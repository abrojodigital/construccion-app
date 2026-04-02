import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/utils/errors';
import { generateCode, generateSimpleCode } from '../../shared/utils/code-generator';
import type { BudgetVersionStatus, ParsedBudget, ParsedPriceAnalysis } from '@construccion/shared';

// ============================================
// Interfaces
// ============================================

interface CreateBudgetVersionInput {
  name: string;
  description?: string;
  gastosGeneralesPct?: number;
  beneficioPct?: number;
  gastosFinancierosPct?: number;
  ivaPct?: number;
  projectId: string;
}

interface UpdateBudgetVersionInput {
  name?: string;
  description?: string;
  gastosGeneralesPct?: number;
  beneficioPct?: number;
  gastosFinancierosPct?: number;
  ivaPct?: number;
}

interface CreateCategoryInput {
  number: number;
  name: string;
  description?: string;
  order: number;
}

interface CreateStageInput {
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface UpdateStageInput {
  number?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
}

interface CreateItemInput {
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface UpdateItemInput {
  number?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
}

interface BudgetVersionFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: BudgetVersionStatus;
  search?: string;
}

// ============================================
// Service
// ============================================

export class BudgetVersionsService {
  /**
   * Calcula el coeficiente K a partir de los porcentajes
   * CC × (1 + GG%) × (1 + Beneficio%) × (1 + GF%) × (1 + IVA%)
   */
  private calculateK(
    gastosGeneralesPct: number,
    beneficioPct: number,
    gastosFinancierosPct: number,
    ivaPct: number
  ): number {
    const k =
      (1 + gastosGeneralesPct) *
      (1 + beneficioPct) *
      (1 + gastosFinancierosPct) *
      (1 + ivaPct);
    return Math.round(k * 10000) / 10000;
  }

  /**
   * Recalcula totales de un presupuesto (3 niveles):
   * - Nivel 3: BudgetItem.totalPrice = quantity × unitPrice
   * - Nivel 2: BudgetStage.totalPrice = Σ items.totalPrice
   * - Nivel 1: BudgetCategory.subtotalCostoCosto = Σ stages.totalPrice
   * - Nivel 0: BudgetVersion.totalCostoCosto = Σ categories.subtotalCostoCosto
   * + incidencePct en stages
   */
  async recalculateTotals(budgetVersionId: string): Promise<void> {
    // Obtener todas las categorías con sus etapas e ítems
    const categories = await prisma.budgetCategory.findMany({
      where: { budgetVersionId },
      include: {
        stages: {
          include: { items: true },
        },
      },
    });

    let totalCostoCosto = new Prisma.Decimal(0);

    for (const category of categories) {
      let categorySubtotal = new Prisma.Decimal(0);

      for (const stage of category.stages) {
        let stageTotal = new Prisma.Decimal(0);

        // Nivel 3: Recalcular cada ítem
        for (const item of stage.items) {
          const itemTotal = new Prisma.Decimal(Number(item.quantity)).mul(
            new Prisma.Decimal(Number(item.unitPrice))
          );
          await prisma.budgetItem.update({
            where: { id: item.id },
            data: { totalPrice: itemTotal },
          });
          stageTotal = stageTotal.add(itemTotal);
        }

        // Nivel 2: Si la etapa tiene ítems, su total es la suma; si no, calcular desde quantity × unitPrice
        if (stage.items.length > 0) {
          await prisma.budgetStage.update({
            where: { id: stage.id },
            data: { totalPrice: stageTotal },
          });
        } else {
          stageTotal = new Prisma.Decimal(Number(stage.quantity)).mul(
            new Prisma.Decimal(Number(stage.unitPrice))
          );
          await prisma.budgetStage.update({
            where: { id: stage.id },
            data: { totalPrice: stageTotal },
          });
        }

        categorySubtotal = categorySubtotal.add(stageTotal);
      }

      // Nivel 1: Actualizar subtotal de categoría
      await prisma.budgetCategory.update({
        where: { id: category.id },
        data: { subtotalCostoCosto: categorySubtotal },
      });

      totalCostoCosto = totalCostoCosto.add(categorySubtotal);
    }

    // Obtener versión para calcular K y precio final
    const version = await prisma.budgetVersion.findUnique({
      where: { id: budgetVersionId },
    });

    if (!version) return;

    const k = this.calculateK(
      Number(version.gastosGeneralesPct),
      Number(version.beneficioPct),
      Number(version.gastosFinancierosPct),
      Number(version.ivaPct)
    );

    const totalPrecio = totalCostoCosto.mul(new Prisma.Decimal(k));

    // Calcular incidencia de cada etapa
    const allStages = categories.flatMap((c) => c.stages);
    if (Number(totalCostoCosto) > 0) {
      for (const stage of allStages) {
        // Recalcular el total de la etapa (puede haber cambiado)
        const stageData = await prisma.budgetStage.findUnique({
          where: { id: stage.id },
          select: { totalPrice: true },
        });
        if (stageData) {
          const incidence = Number(stageData.totalPrice) / Number(totalCostoCosto);
          await prisma.budgetStage.update({
            where: { id: stage.id },
            data: { incidencePct: Math.round(incidence * 10000) / 10000 },
          });
        }
      }
    }

    await prisma.budgetVersion.update({
      where: { id: budgetVersionId },
      data: {
        totalCostoCosto,
        totalPrecio,
        coeficienteK: k,
      },
    });
  }

  private async createPriceAnalysisFromParsed(
    data: ParsedPriceAnalysis,
    budgetItemId: string,
    organizationId: string,
    code: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const pa = await tx.priceAnalysis.create({
      data: { code, budgetItemId, organizationId },
    });

    for (const mat of data.materials) {
      await tx.analysisMaterial.create({
        data: {
          description: mat.description,
          unit: mat.unit,
          quantity: mat.quantity,
          unitCost: mat.unitCost,
          wastePct: 0,
          totalCost: new Prisma.Decimal(mat.quantity * mat.unitCost),
          priceAnalysisId: pa.id,
        },
      });
    }

    for (const lab of data.labor) {
      await tx.analysisLabor.create({
        data: {
          category: lab.category,
          quantity: lab.quantity,
          hourlyRate: lab.hourlyRate,
          totalCost: new Prisma.Decimal(lab.quantity * lab.hourlyRate),
          priceAnalysisId: pa.id,
        },
      });
    }

    for (const tr of data.transport) {
      await tx.analysisTransport.create({
        data: {
          description: tr.description,
          unit: tr.unit,
          quantity: tr.quantity,
          unitCost: tr.unitCost,
          totalCost: new Prisma.Decimal(tr.quantity * tr.unitCost),
          priceAnalysisId: pa.id,
        },
      });
    }
  }

  // ============================================
  // CRUD Versiones de Presupuesto
  // ============================================

  async findAll(organizationId: string, projectId: string, filters: BudgetVersionFilters) {
    const {
      page = 1,
      limit = 20,
      sortOrder = 'desc',
      status,
      search,
    } = filters;

    const ALLOWED_SORT_FIELDS = ['name', 'code', 'version', 'status', 'totalPrecio', 'createdAt', 'approvedAt'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(filters.sortBy as string)
      ? (filters.sortBy as string)
      : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : ('desc' as const);

    const where: Prisma.BudgetVersionWhereInput = {
      projectId,
      organizationId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.budgetVersion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: safeSortOrder },
        include: {
          _count: { select: { categories: true } },
        },
      }),
      prisma.budgetVersion.count({ where }),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  async findById(id: string, organizationId: string) {
    const version = await prisma.budgetVersion.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: {
                items: {
                  orderBy: { number: 'asc' },
                },
              },
            },
          },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    if (!version) throw new NotFoundError('Versión de presupuesto', id);
    return version;
  }

  async create(data: CreateBudgetVersionInput, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundError('Proyecto', data.projectId);

    const lastVersion = await prisma.budgetVersion.findFirst({
      where: { projectId: data.projectId, deletedAt: null },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;
    const code = await generateCode('budgetVersion', organizationId);
    const codeWithVersion = `${code}-v${nextVersion}`;

    const k = this.calculateK(
      data.gastosGeneralesPct || 0,
      data.beneficioPct || 0,
      data.gastosFinancierosPct || 0,
      data.ivaPct || 0
    );

    const version = await prisma.budgetVersion.create({
      data: {
        code: codeWithVersion,
        version: nextVersion,
        name: data.name,
        description: data.description,
        gastosGeneralesPct: data.gastosGeneralesPct || 0,
        beneficioPct: data.beneficioPct || 0,
        gastosFinancierosPct: data.gastosFinancierosPct || 0,
        ivaPct: data.ivaPct || 0,
        coeficienteK: k,
        projectId: data.projectId,
        organizationId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { categories: true } },
      },
    });

    return version;
  }

  async importFromParsed(
    data: { projectId: string; name: string; description?: string; parsedBudget: ParsedBudget },
    organizationId: string
  ) {
    // Validar límite de ítems
    const totalItems = data.parsedBudget.categories
      .flatMap((c) => c.stages)
      .reduce((sum, s) => sum + Math.max(1, s.items.length), 0);
    if (totalItems > 500) {
      throw new ValidationError(`El archivo tiene ${totalItems} ítems. El límite es 500.`);
    }

    // Verificar que el proyecto existe
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundError('Proyecto', data.projectId);

    // Calcular número de versión y código
    const lastVersion = await prisma.budgetVersion.findFirst({
      where: { projectId: data.projectId, deletedAt: null },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;
    const code = await generateCode('budgetVersion', organizationId);
    const codeWithVersion = `${code}-v${nextVersion}`;

    // Pre-generar códigos APU fuera de la transacción
    const apuCount = data.parsedBudget.categories
      .flatMap((c) => c.stages)
      .reduce((sum, s) => {
        const stageApu = s.priceAnalysis && s.items.length === 0 ? 1 : 0;
        const itemApus = s.items.filter((i) => i.priceAnalysis).length;
        return sum + stageApu + itemApus;
      }, 0);
    const apuCodes: string[] = [];
    for (let i = 0; i < apuCount; i++) {
      apuCodes.push(await generateSimpleCode('priceAnalysis', organizationId));
    }
    let apuCodeIdx = 0;

    const { gastosGeneralesPct, beneficioPct, gastosFinancierosPct, ivaPct } =
      data.parsedBudget.coeficienteK;
    const k = this.calculateK(gastosGeneralesPct, beneficioPct, gastosFinancierosPct, ivaPct);

    // Ejecutar toda la creación en una sola transacción
    const version = await prisma.$transaction(async (tx) => {
      const ver = await tx.budgetVersion.create({
        data: {
          code: codeWithVersion,
          version: nextVersion,
          name: data.name,
          description: data.description,
          gastosGeneralesPct,
          beneficioPct,
          gastosFinancierosPct,
          ivaPct,
          coeficienteK: k,
          projectId: data.projectId,
          organizationId,
        },
      });

      for (let catIdx = 0; catIdx < data.parsedBudget.categories.length; catIdx++) {
        const cat = data.parsedBudget.categories[catIdx];
        const category = await tx.budgetCategory.create({
          data: {
            number: cat.number,
            name: cat.name,
            order: catIdx + 1,
            budgetVersionId: ver.id,
          },
        });

        for (const stage of cat.stages) {
          const hasSubItems = stage.items.length > 0;
          const createdStage = await tx.budgetStage.create({
            data: {
              number: stage.number,
              description: stage.description,
              unit: stage.unit || 'gl',
              quantity: hasSubItems ? 1 : stage.quantity,
              unitPrice: hasSubItems ? 0 : stage.unitPrice,
              totalPrice: hasSubItems ? 0 : new Prisma.Decimal(stage.quantity * stage.unitPrice),
              categoryId: category.id,
            },
          });

          if (hasSubItems) {
            for (const item of stage.items) {
              const createdItem = await tx.budgetItem.create({
                data: {
                  number: item.number,
                  description: item.description,
                  unit: item.unit || 'gl',
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
                  stageId: createdStage.id,
                },
              });
              if (item.priceAnalysis) {
                await this.createPriceAnalysisFromParsed(
                  item.priceAnalysis,
                  createdItem.id,
                  organizationId,
                  apuCodes[apuCodeIdx++],
                  tx
                );
              }
            }
          } else {
            // Etapa hoja: crear un BudgetItem espejo
            const createdItem = await tx.budgetItem.create({
              data: {
                number: stage.number,
                description: stage.description,
                unit: stage.unit || 'gl',
                quantity: stage.quantity,
                unitPrice: stage.unitPrice,
                totalPrice: new Prisma.Decimal(stage.quantity * stage.unitPrice),
                stageId: createdStage.id,
              },
            });
            if (stage.priceAnalysis) {
              await this.createPriceAnalysisFromParsed(
                stage.priceAnalysis,
                createdItem.id,
                organizationId,
                apuCodes[apuCodeIdx++],
                tx
              );
            }
          }
        }
      }

      return ver;
    }, { timeout: 30000 });

    await this.recalculateTotals(version.id);
    return await this.findById(version.id, organizationId);
  }

  async update(id: string, data: UpdateBudgetVersionInput, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar versiones en estado Borrador');
    }

    const gg = data.gastosGeneralesPct ?? Number(existing.gastosGeneralesPct);
    const ben = data.beneficioPct ?? Number(existing.beneficioPct);
    const gf = data.gastosFinancierosPct ?? Number(existing.gastosFinancierosPct);
    const iva = data.ivaPct ?? Number(existing.ivaPct);
    const k = this.calculateK(gg, ben, gf, iva);

    const totalPrecio = new Prisma.Decimal(Number(existing.totalCostoCosto) * k);

    const version = await prisma.budgetVersion.update({
      where: { id },
      data: {
        ...data,
        coeficienteK: k,
        totalPrecio,
      },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: { items: { orderBy: { number: 'asc' } } },
            },
          },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return version;
  }

  async delete(id: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status === 'APPROVED') {
      throw new ValidationError('No se puede eliminar una versión aprobada');
    }

    await prisma.budgetVersion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async approve(id: string, organizationId: string, userId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden aprobar versiones en estado Borrador');
    }

    // Verificar que tenga al menos una categoría con etapas
    const stageCount = existing.categories.reduce((sum, cat) => sum + cat.stages.length, 0);
    if (stageCount === 0) {
      throw new ValidationError('El presupuesto debe tener al menos una etapa para ser aprobado');
    }

    // Marcar versiones anteriores como SUPERSEDED
    await prisma.budgetVersion.updateMany({
      where: {
        projectId: existing.projectId,
        status: 'APPROVED',
        deletedAt: null,
        id: { not: id },
      },
      data: { status: 'SUPERSEDED' },
    });

    const version = await prisma.budgetVersion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: { items: { orderBy: { number: 'asc' } } },
            },
          },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    // Generar cronograma automáticamente al aprobar
    const scheduleResult = await this.generateSchedule(id, organizationId, 'replace');

    return { ...version, scheduleGenerated: scheduleResult };
  }

  async revertToDraft(id: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status === 'DRAFT') {
      throw new ValidationError('La versión ya está en estado Borrador');
    }

    return prisma.budgetVersion.update({
      where: { id },
      data: {
        status: 'DRAFT',
        approvedAt: null,
        approvedById: null,
      },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: { items: { orderBy: { number: 'asc' } } },
            },
          },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  // ============================================
  // CRUD Categorías (Nivel 1)
  // ============================================

  async createCategory(budgetVersionId: string, data: CreateCategoryInput, organizationId: string) {
    const version = await this.findById(budgetVersionId, organizationId);

    if (version.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden agregar categorías a versiones en estado Borrador');
    }

    const existing = version.categories.find((cat) => cat.number === data.number);
    if (existing) {
      throw new ConflictError(`Ya existe una categoría con el número ${data.number}`);
    }

    const category = await prisma.budgetCategory.create({
      data: {
        ...data,
        budgetVersionId,
      },
      include: { stages: { include: { items: true } } },
    });

    return category;
  }

  async updateCategory(
    categoryId: string,
    data: Partial<CreateCategoryInput>,
    organizationId: string
  ) {
    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId },
      include: { budgetVersion: true },
    });

    if (!category) throw new NotFoundError('Categoría', categoryId);

    if (category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Categoría', categoryId);
    }

    if (category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar categorías de versiones en estado Borrador');
    }

    const updated = await prisma.budgetCategory.update({
      where: { id: categoryId },
      data,
      include: {
        stages: {
          orderBy: { number: 'asc' },
          include: { items: { orderBy: { number: 'asc' } } },
        },
      },
    });

    return updated;
  }

  async deleteCategory(categoryId: string, organizationId: string) {
    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId },
      include: { budgetVersion: true },
    });

    if (!category) throw new NotFoundError('Categoría', categoryId);

    if (category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Categoría', categoryId);
    }

    if (category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError(
        'Solo se pueden eliminar categorías de versiones en estado Borrador'
      );
    }

    await prisma.budgetCategory.delete({ where: { id: categoryId } });
    await this.recalculateTotals(category.budgetVersionId);
  }

  // ============================================
  // CRUD Etapas (Nivel 2)
  // ============================================

  async createStage(categoryId: string, data: CreateStageInput, organizationId: string) {
    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId },
      include: { budgetVersion: true },
    });

    if (!category) throw new NotFoundError('Categoría', categoryId);

    if (category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Categoría', categoryId);
    }

    if (category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden agregar etapas a versiones en estado Borrador');
    }

    const totalPrice = data.quantity * data.unitPrice;

    const stage = await prisma.budgetStage.create({
      data: {
        number: data.number,
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        categoryId,
      },
      include: { items: true },
    });

    await this.recalculateTotals(category.budgetVersionId);

    return stage;
  }

  async updateStage(stageId: string, data: UpdateStageInput, organizationId: string) {
    const stage = await prisma.budgetStage.findFirst({
      where: { id: stageId },
      include: {
        category: {
          include: { budgetVersion: true },
        },
      },
    });

    if (!stage) throw new NotFoundError('Etapa', stageId);

    if (stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Etapa', stageId);
    }

    if (stage.category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar etapas de versiones en estado Borrador');
    }

    const quantity = data.quantity ?? Number(stage.quantity);
    const unitPrice = data.unitPrice ?? Number(stage.unitPrice);
    const totalPrice = quantity * unitPrice;

    const updated = await prisma.budgetStage.update({
      where: { id: stageId },
      data: {
        ...data,
        totalPrice,
      },
      include: { items: { orderBy: { number: 'asc' } } },
    });

    await this.recalculateTotals(stage.category.budgetVersionId);

    return updated;
  }

  async deleteStage(stageId: string, organizationId: string) {
    const stage = await prisma.budgetStage.findFirst({
      where: { id: stageId },
      include: {
        category: {
          include: { budgetVersion: true },
        },
      },
    });

    if (!stage) throw new NotFoundError('Etapa', stageId);

    if (stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Etapa', stageId);
    }

    if (stage.category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden eliminar etapas de versiones en estado Borrador');
    }

    await prisma.budgetStage.delete({ where: { id: stageId } });
    await this.recalculateTotals(stage.category.budgetVersionId);
  }

  // ============================================
  // CRUD Ítems (Nivel 3)
  // ============================================

  async createItem(stageId: string, data: CreateItemInput, organizationId: string) {
    const stage = await prisma.budgetStage.findFirst({
      where: { id: stageId },
      include: {
        category: {
          include: { budgetVersion: true },
        },
      },
    });

    if (!stage) throw new NotFoundError('Etapa', stageId);

    if (stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Etapa', stageId);
    }

    if (stage.category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden agregar ítems a versiones en estado Borrador');
    }

    const totalPrice = data.quantity * data.unitPrice;

    const item = await prisma.budgetItem.create({
      data: {
        number: data.number,
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        stageId,
      },
    });

    await this.recalculateTotals(stage.category.budgetVersionId);

    return item;
  }

  async updateItem(itemId: string, data: UpdateItemInput, organizationId: string) {
    const item = await prisma.budgetItem.findFirst({
      where: { id: itemId },
      include: {
        stage: {
          include: {
            category: {
              include: { budgetVersion: true },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundError('Ítem', itemId);

    if (item.stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Ítem', itemId);
    }

    if (item.stage.category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar ítems de versiones en estado Borrador');
    }

    const quantity = data.quantity ?? Number(item.quantity);
    const unitPrice = data.unitPrice ?? Number(item.unitPrice);
    const totalPrice = quantity * unitPrice;

    const updated = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        ...data,
        totalPrice,
      },
    });

    await this.recalculateTotals(item.stage.category.budgetVersionId);

    return updated;
  }

  async deleteItem(itemId: string, organizationId: string) {
    const item = await prisma.budgetItem.findFirst({
      where: { id: itemId },
      include: {
        stage: {
          include: {
            category: {
              include: { budgetVersion: true },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundError('Ítem', itemId);

    if (item.stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Ítem', itemId);
    }

    if (item.stage.category.budgetVersion.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden eliminar ítems de versiones en estado Borrador');
    }

    await prisma.budgetItem.delete({ where: { id: itemId } });
    await this.recalculateTotals(item.stage.category.budgetVersionId);
  }

  // ============================================
  // Generación de Cronograma
  // ============================================

  async checkExistingSchedule(id: string, organizationId: string) {
    const version = await this.findById(id, organizationId);

    const existingStages = await prisma.stage.findMany({
      where: {
        projectId: version.projectId,
        budgetVersionId: id,
        deletedAt: null,
      },
      include: { _count: { select: { tasks: true } } },
    });

    const stageCount = existingStages.length;
    const taskCount = existingStages.reduce((sum, s) => sum + s._count.tasks, 0);

    return {
      hasExistingStages: stageCount > 0,
      stageCount,
      taskCount,
    };
  }

  async generateSchedule(
    id: string,
    organizationId: string,
    mode: 'replace' | 'append'
  ) {
    const version = await this.findById(id, organizationId);

    if (version.status !== 'APPROVED') {
      throw new ValidationError('Solo se puede generar cronograma de versiones aprobadas');
    }

    let createdStages = 0;

    await prisma.$transaction(async (tx) => {
      if (mode === 'replace') {
        // Soft-delete existing stages and tasks linked to this budget version
        const existingStages = await tx.stage.findMany({
          where: {
            projectId: version.projectId,
            budgetVersionId: id,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (existingStages.length > 0) {
          const stageIds = existingStages.map((s) => s.id);

          // Soft-delete tasks of these stages
          await tx.task.updateMany({
            where: { stageId: { in: stageIds }, deletedAt: null },
            data: { deletedAt: new Date() },
          });

          // Soft-delete stages
          await tx.stage.updateMany({
            where: { id: { in: stageIds } },
            data: { deletedAt: new Date() },
          });
        }
      }

      let stageOrder = 1;

      // Obtener el máximo order existente si estamos en modo append
      if (mode === 'append') {
        const maxOrder = await tx.stage.findFirst({
          where: { projectId: version.projectId, deletedAt: null },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        stageOrder = (maxOrder?.order || 0) + 1;
      }

      for (const category of version.categories) {
        // Crear Stage padre para cada Categoría
        const parentStage = await tx.stage.create({
          data: {
            name: category.name,
            description: category.description || undefined,
            order: stageOrder++,
            projectId: version.projectId,
            budgetCategoryId: category.id,
            budgetVersionId: id,
          },
        });
        createdStages++;

        for (const budgetStage of category.stages) {
          // Crear Stage hijo para cada Etapa
          await tx.stage.create({
            data: {
              name: budgetStage.description,
              description: `${budgetStage.number} - ${budgetStage.unit}`,
              order: stageOrder++,
              projectId: version.projectId,
              parentStageId: parentStage.id,
              budgetStageId: budgetStage.id,
              budgetVersionId: id,
            },
          });
          createdStages++;
        }
      }
    });

    return {
      success: true,
      stagesCreated: createdStages,
    };
  }
}

export const budgetVersionsService = new BudgetVersionsService();
