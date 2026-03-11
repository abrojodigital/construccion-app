/**
 * Script: replace-duplex-project.ts
 * Elimina el proyecto "Duplex Familia López - Escobar" y crea el nuevo
 * "Complejo Residencial Las Araucarias - Morón" con TODOS los módulos ERP.
 *
 * Ejecutar (desde contenedor): tsx packages/database/prisma/replace-duplex-project.ts
 */

import {
  PrismaClient,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  DependencyType,
  BudgetVersionStatus,
  CertificateStatus,
  SubcontractStatus,
  FinancialPlanStatus,
  ExpenseStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('🔄 Reemplazando proyecto Duplex López por Las Araucarias...');
  console.log('============================================================');

  // ----------------------------------------------------------------
  // 1. Buscar organización y usuarios existentes
  // ----------------------------------------------------------------
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No se encontró la organización. Ejecutá el seed principal primero.');

  const pmMaria = await prisma.user.findFirst({ where: { email: 'jefe@constructorademo.com.ar' } });
  const pmAndres = await prisma.user.findFirst({ where: { email: 'andres.pm@constructorademo.com.ar' } });
  const supervisor = await prisma.user.findFirst({ where: { email: 'supervisor@constructorademo.com.ar' } });
  const administrative = await prisma.user.findFirst({ where: { email: 'admin.contable@constructorademo.com.ar' } });
  const admin = await prisma.user.findFirst({ where: { email: 'admin@constructorademo.com.ar' } });

  if (!pmMaria || !pmAndres || !supervisor || !administrative || !admin)
    throw new Error('Faltan usuarios. Ejecutá el seed principal primero.');

  // ----------------------------------------------------------------
  // 2. Eliminar el proyecto Duplex y todos sus datos
  // ----------------------------------------------------------------
  console.log('\n🗑️  Buscando proyecto "Duplex Familia López - Escobar"...');
  const duplex = await prisma.project.findFirst({
    where: { name: { contains: 'Duplex Familia' } },
  });

  if (duplex) {
    console.log(`   Encontrado: ${duplex.name} (${duplex.code}) — eliminando...`);

    // Certificados del proyecto
    const certs = await prisma.certificate.findMany({ where: { projectId: duplex.id } });
    for (const cert of certs) {
      await prisma.certificateItem.deleteMany({ where: { certificateId: cert.id } });
    }
    await prisma.certificate.deleteMany({ where: { projectId: duplex.id } });

    // Subcontratos
    const subs = await prisma.subcontract.findMany({ where: { projectId: duplex.id } });
    for (const sub of subs) {
      const subCerts = await prisma.subcontractCertificate.findMany({ where: { subcontractId: sub.id } });
      for (const sc of subCerts) {
        await prisma.subcontractCertificateItem.deleteMany({ where: { certificateId: sc.id } });
      }
      await prisma.subcontractCertificate.deleteMany({ where: { subcontractId: sub.id } });
      await prisma.subcontractItem.deleteMany({ where: { subcontractId: sub.id } });
    }
    await prisma.subcontract.deleteMany({ where: { projectId: duplex.id } });

    // Plan financiero (sin versión presupuestaria)
    const fps = await prisma.financialPlan.findMany({ where: { projectId: duplex.id } });
    for (const fp of fps) {
      await prisma.financialPeriod.deleteMany({ where: { financialPlanId: fp.id } });
    }
    await prisma.financialPlan.deleteMany({ where: { projectId: duplex.id } });

    // Budget versions
    const bvs = await prisma.budgetVersion.findMany({ where: { projectId: duplex.id } });
    for (const bv of bvs) {
      // Fórmulas de ajuste ligadas a esta versión
      const formulas = await prisma.adjustmentFormula.findMany({ where: { budgetVersionId: bv.id } });
      for (const formula of formulas) {
        await prisma.adjustmentWeight.deleteMany({ where: { formulaId: formula.id } });
      }
      await prisma.adjustmentFormula.deleteMany({ where: { budgetVersionId: bv.id } });

      const cats = await prisma.budgetCategory.findMany({ where: { budgetVersionId: bv.id } });
      for (const cat of cats) {
        const stages = await prisma.budgetStage.findMany({ where: { categoryId: cat.id } });
        for (const stage of stages) {
          const items = await prisma.budgetItem.findMany({ where: { stageId: stage.id } });
          for (const item of items) {
            await prisma.itemProgress.deleteMany({ where: { budgetItemId: item.id } });
            const apus = await prisma.priceAnalysis.findMany({ where: { budgetItemId: item.id } });
            for (const apu of apus) {
              await prisma.analysisMaterial.deleteMany({ where: { priceAnalysisId: apu.id } });
              await prisma.analysisLabor.deleteMany({ where: { priceAnalysisId: apu.id } });
              await prisma.analysisEquipment.deleteMany({ where: { priceAnalysisId: apu.id } });
              await prisma.analysisTransport.deleteMany({ where: { priceAnalysisId: apu.id } });
            }
            await prisma.priceAnalysis.deleteMany({ where: { budgetItemId: item.id } });
            // Cert items que referencian estos budget items (certificados del proyecto ya eliminados)
          }
          await prisma.budgetItem.deleteMany({ where: { stageId: stage.id } });
        }
        await prisma.budgetStage.deleteMany({ where: { categoryId: cat.id } });
      }
      await prisma.budgetCategory.deleteMany({ where: { budgetVersionId: bv.id } });
    }
    await prisma.budgetVersion.deleteMany({ where: { projectId: duplex.id } });

    // Presupuesto legacy
    await prisma.budget.deleteMany({ where: { projectId: duplex.id } });

    // Gastos
    await prisma.expense.deleteMany({ where: { projectId: duplex.id } });

    // Asignaciones de empleados
    await prisma.employeeProjectAssignment.deleteMany({ where: { projectId: duplex.id } });

    // Tareas y etapas
    const stages = await prisma.stage.findMany({ where: { projectId: duplex.id } });
    for (const st of stages) {
      const tasks = await prisma.task.findMany({ where: { stageId: st.id } });
      for (const task of tasks) {
        await prisma.taskAssignment.deleteMany({ where: { taskId: task.id } });
        await prisma.taskDependency.deleteMany({
          where: { OR: [{ taskId: task.id }, { dependsOnId: task.id }] },
        });
        await prisma.comment.deleteMany({ where: { taskId: task.id } });
      }
      await prisma.task.deleteMany({ where: { stageId: st.id } });
    }
    await prisma.stage.deleteMany({ where: { projectId: duplex.id } });

    // Notificaciones
    await prisma.notification.deleteMany({ where: { entityId: duplex.id } });

    // Proyecto
    await prisma.project.delete({ where: { id: duplex.id } });
    console.log('   ✅ Proyecto Duplex eliminado correctamente');
  } else {
    console.log('   ⚠️  No se encontró el proyecto Duplex. Continuando de todos modos...');
  }

  // ----------------------------------------------------------------
  // 3. Obtener índices de precios existentes para la fórmula
  // ----------------------------------------------------------------
  const idxMO = await prisma.priceIndex.findFirst({ where: { code: 'MO-UOCRA' } });
  const idxMAT = await prisma.priceIndex.findFirst({ where: { code: 'MAT-ICC' } });
  const idxEQ = await prisma.priceIndex.findFirst({ where: { code: 'EQ-VIAL' } });
  const idxCOMB = await prisma.priceIndex.findFirst({ where: { code: 'COMB-GO' } });

  const catMateriales = await prisma.expenseCategory.findFirst({ where: { code: 'MAT' } });
  const catManoObra = await prisma.expenseCategory.findFirst({ where: { code: 'MO' } });
  const catEquipos = await prisma.expenseCategory.findFirst({ where: { code: 'EQ' } });
  const catAdmin = await prisma.expenseCategory.findFirst({ where: { code: 'ADM' } });

  // ----------------------------------------------------------------
  // 4. NUEVO PROYECTO: Complejo Residencial Las Araucarias - Morón
  // ----------------------------------------------------------------
  console.log('\n🏗️  Creando Complejo Residencial Las Araucarias - Morón...');

  const project = await prisma.project.create({
    data: {
      code: 'OBR-2024-00004',
      name: 'Complejo Residencial Las Araucarias - Morón',
      description:
        'Construcción de edificio de departamentos PB+3 pisos. 9 unidades: 8 departamentos de 2 ambientes de 75m² y 1 PH de 110m². Planta baja con cocheras, sala de usos múltiples y jardín. Terminaciones premium con amenities. Barrio Residencial Morón Centro.',
      address: 'Av. Gaona 3450',
      city: 'Morón',
      province: 'Buenos Aires',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-08-01'),
      estimatedEndDate: new Date('2025-10-31'),
      estimatedBudget: 285000000,
      currentSpent: 127875000,
      progress: 45,
      organizationId: org.id,
      managerId: pmAndres.id,
    },
  });
  console.log(`   ✅ Proyecto: ${project.name}`);

  // ----------------------------------------------------------------
  // 5. ETAPAS
  // ----------------------------------------------------------------
  console.log('   📋 Creando etapas...');

  const stg1 = await prisma.stage.create({ data: {
    name: 'Trabajos Preliminares', order: 1, progress: 100, projectId: project.id,
    description: 'Demolición parcial, limpieza de terreno, cerco de obra, obrador, conexiones provisorias.',
    plannedStartDate: new Date('2024-08-01'), plannedEndDate: new Date('2024-08-20'),
    actualStartDate: new Date('2024-08-01'), actualEndDate: new Date('2024-08-18'),
  }});
  const stg2 = await prisma.stage.create({ data: {
    name: 'Fundaciones y Estructura Subsuelo', order: 2, progress: 100, projectId: project.id,
    description: 'Excavación, pilotes, bases, vigas de fundación, muro de contención y losa de subsuelo/PB.',
    plannedStartDate: new Date('2024-08-21'), plannedEndDate: new Date('2024-10-15'),
    actualStartDate: new Date('2024-08-19'), actualEndDate: new Date('2024-10-10'),
  }});
  const stg3 = await prisma.stage.create({ data: {
    name: 'Estructura de Hormigón Armado', order: 3, progress: 100, projectId: project.id,
    description: 'Columnas, vigas y losas de entrepiso (PB, P1, P2, P3) y terraza. Escalera y caja de ascensor.',
    plannedStartDate: new Date('2024-10-16'), plannedEndDate: new Date('2025-02-15'),
    actualStartDate: new Date('2024-10-12'), actualEndDate: new Date('2025-02-10'),
  }});
  const stg4 = await prisma.stage.create({ data: {
    name: 'Mampostería y Tabiques', order: 4, progress: 75, projectId: project.id,
    description: 'Paredes exteriores ladrillo hueco 18cm, tabiques interiores ladrillo hueco 12cm, dinteles.',
    plannedStartDate: new Date('2025-02-16'), plannedEndDate: new Date('2025-05-31'),
    actualStartDate: new Date('2025-02-12'),
  }});
  const stg5 = await prisma.stage.create({ data: {
    name: 'Instalaciones (Eléctrica, Sanitaria, Gas)', order: 5, progress: 35, projectId: project.id,
    description: 'Instalaciones eléctricas, agua fría/caliente, cloacal, pluvial, gas natural, telefonía/datos.',
    plannedStartDate: new Date('2025-03-01'), plannedEndDate: new Date('2025-06-30'),
    actualStartDate: new Date('2025-03-10'),
  }});
  const stg6 = await prisma.stage.create({ data: {
    name: 'Cubierta y Terrazas', order: 6, progress: 20, projectId: project.id,
    description: 'Losa de terraza, membrana asfáltica, aislación térmica, pendientes, desagüe pluvial terraza.',
    plannedStartDate: new Date('2025-05-01'), plannedEndDate: new Date('2025-06-30'),
    actualStartDate: new Date('2025-05-05'),
  }});
  const stg7 = await prisma.stage.create({ data: {
    name: 'Revoques y Contrapisos', order: 7, progress: 5, projectId: project.id,
    description: 'Revoques grueso y fino interior/exterior. Contrapisos en todas las plantas.',
    plannedStartDate: new Date('2025-06-01'), plannedEndDate: new Date('2025-08-15'),
  }});
  const stg8 = await prisma.stage.create({ data: {
    name: 'Pisos, Revestimientos y Carpintería', order: 8, progress: 0, projectId: project.id,
    description: 'Porcelanato áreas comunes, pisos flotantes en dptos, revestimientos de baños, aberturas.',
    plannedStartDate: new Date('2025-08-01'), plannedEndDate: new Date('2025-09-30'),
  }});
  const stg9 = await prisma.stage.create({ data: {
    name: 'Pintura, Terminaciones y Paisajismo', order: 9, progress: 0, projectId: project.id,
    description: 'Pintura interior/exterior, grifería, artefactos sanitarios, luminarias, jardín y accesos.',
    plannedStartDate: new Date('2025-09-15'), plannedEndDate: new Date('2025-10-31'),
  }});

  // ----------------------------------------------------------------
  // 6. TAREAS
  // ----------------------------------------------------------------
  console.log('   📌 Creando tareas...');

  // Etapa 1
  const t1_1 = await prisma.task.create({ data: { name: 'Cerco perimetral de obra', description: 'Malla ciega galvanizada h=2.20m, portón de acceso', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-08-01'), plannedEndDate: new Date('2024-08-05'), actualStartDate: new Date('2024-08-01'), actualEndDate: new Date('2024-08-04'), progress: 100, stageId: stg1.id }});
  const t1_2 = await prisma.task.create({ data: { name: 'Obrador y vestuarios', description: 'Instalación de obrador, comedor, baños y vestuarios para 20 operarios', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-08-05'), plannedEndDate: new Date('2024-08-10'), actualStartDate: new Date('2024-08-05'), actualEndDate: new Date('2024-08-09'), progress: 100, stageId: stg1.id }});
  const t1_3 = await prisma.task.create({ data: { name: 'Conexiones provisorias agua/electricidad', description: 'Gestión y conexión de servicios provisorios para la obra', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-08-08'), plannedEndDate: new Date('2024-08-18'), actualStartDate: new Date('2024-08-08'), actualEndDate: new Date('2024-08-18'), progress: 100, stageId: stg1.id }});

  // Etapa 2
  const t2_1 = await prisma.task.create({ data: { name: 'Excavación general y nivelación', description: 'Excavación con retroexcavadora hasta nivel -1.80m, retiro de suelo excedente', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-08-21'), plannedEndDate: new Date('2024-09-05'), actualStartDate: new Date('2024-08-19'), actualEndDate: new Date('2024-09-01'), progress: 100, stageId: stg2.id }});
  const t2_2 = await prisma.task.create({ data: { name: 'Armado de hierros - Bases y vigas de fundación', description: 'Armado de parrillas de bases, cadenas y vigas de fundación según planos estructurales', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-09-06'), plannedEndDate: new Date('2024-09-25'), actualStartDate: new Date('2024-09-03'), actualEndDate: new Date('2024-09-22'), progress: 100, stageId: stg2.id }});
  const t2_3 = await prisma.task.create({ data: { name: 'Hormigonado de fundaciones', description: 'H21 con mixer, vibrado y curado. Encofrado metálico para vigas de fundación', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-09-26'), plannedEndDate: new Date('2024-10-10'), actualStartDate: new Date('2024-09-24'), actualEndDate: new Date('2024-10-08'), progress: 100, stageId: stg2.id }});

  // Etapa 3
  const t3_1 = await prisma.task.create({ data: { name: 'Columnas y vigas PB', description: 'Encofrado, armado y hormigonado de columnas y vigas de planta baja', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-10-16'), plannedEndDate: new Date('2024-11-15'), actualStartDate: new Date('2024-10-12'), actualEndDate: new Date('2024-11-10'), progress: 100, stageId: stg3.id }});
  const t3_2 = await prisma.task.create({ data: { name: 'Losa entrepiso PB-P1', description: 'Encofrado, malla electrosoldada, tesinas y hormigonado H21', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-16'), plannedEndDate: new Date('2024-12-15'), actualStartDate: new Date('2024-11-12'), actualEndDate: new Date('2024-12-12'), progress: 100, stageId: stg3.id }});
  const t3_3 = await prisma.task.create({ data: { name: 'Estructura P1, P2 y P3', description: 'Columnas, vigas y losas de los 3 pisos superiores', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-12-16'), plannedEndDate: new Date('2025-01-31'), actualStartDate: new Date('2024-12-14'), actualEndDate: new Date('2025-01-28'), progress: 100, stageId: stg3.id }});
  const t3_4 = await prisma.task.create({ data: { name: 'Losa de terraza y escalera', description: 'Losa de cubierta impermeabilizada, escalera hormigón armado y caja de ascensor', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-02-01'), plannedEndDate: new Date('2025-02-15'), actualStartDate: new Date('2025-01-30'), actualEndDate: new Date('2025-02-10'), progress: 100, stageId: stg3.id }});

  // Etapa 4
  const t4_1 = await prisma.task.create({ data: { name: 'Paredes exteriores PB y P1', description: 'Ladrillo hueco 18x18x33 con mezcla Portland/Cal 1:3', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-02-16'), plannedEndDate: new Date('2025-03-20'), actualStartDate: new Date('2025-02-12'), actualEndDate: new Date('2025-03-18'), progress: 100, stageId: stg4.id }});
  const t4_2 = await prisma.task.create({ data: { name: 'Paredes exteriores P2 y P3', description: 'Ladrillo hueco 18x18x33 con mezcla Portland/Cal 1:3', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-03-21'), plannedEndDate: new Date('2025-04-20'), actualStartDate: new Date('2025-03-19'), actualEndDate: new Date('2025-04-18'), progress: 100, stageId: stg4.id }});
  const t4_3 = await prisma.task.create({ data: { name: 'Tabiques interiores todos los pisos', description: 'Ladrillo hueco 12x18x33, diseño de planos de subdivisión', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-04-01'), plannedEndDate: new Date('2025-05-15'), actualStartDate: new Date('2025-04-02'), progress: 65, stageId: stg4.id }});
  const t4_4 = await prisma.task.create({ data: { name: 'Dinteles y antepechos', description: 'Dinteles prefabricados sobre vanos de puertas y ventanas', status: TaskStatus.PENDING, priority: TaskPriority.LOW, plannedStartDate: new Date('2025-05-01'), plannedEndDate: new Date('2025-05-31'), progress: 0, stageId: stg4.id }});

  // Etapa 5
  const t5_1 = await prisma.task.create({ data: { name: 'Cañerías embutidas eléctricas', description: 'Caño corrugado, cajas, portafusibles. Circuitos iluminación y tomacorrientes', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-03-10'), plannedEndDate: new Date('2025-05-31'), actualStartDate: new Date('2025-03-12'), progress: 50, stageId: stg5.id }});
  const t5_2 = await prisma.task.create({ data: { name: 'Red de agua fría y caliente', description: 'PPF embutido, tanque 1100L terrazas, calefón, mezcladores', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-03-15'), plannedEndDate: new Date('2025-06-15'), actualStartDate: new Date('2025-03-20'), progress: 30, stageId: stg5.id }});
  const t5_3 = await prisma.task.create({ data: { name: 'Desagüe cloacal y pluvial', description: 'PVC 110 cloacal, colectores, pileta de patio, columnas bajada pluvial', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-04-01'), plannedEndDate: new Date('2025-06-30'), progress: 0, stageId: stg5.id }});
  const t5_4 = await prisma.task.create({ data: { name: 'Instalación de gas natural', description: 'Subcontratada a empresa habilitada - cañería acero negro, llaves y medidores', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-05-01'), plannedEndDate: new Date('2025-06-30'), progress: 0, stageId: stg5.id }});

  // Etapa 6
  const t6_1 = await prisma.task.create({ data: { name: 'Membrana asfáltica terraza principal', description: 'Membrana bicapa - aluminio 3mm + aluminio 4mm, pendientes con arlita', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-05-01'), plannedEndDate: new Date('2025-06-15'), actualStartDate: new Date('2025-05-05'), progress: 30, stageId: stg6.id }});
  const t6_2 = await prisma.task.create({ data: { name: 'Cubierta PH y terrazas secundarias', description: 'Membrana, aislación térmica EPS 30mm, canaletas y bajadas pluviales', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-06-01'), plannedEndDate: new Date('2025-06-30'), progress: 0, stageId: stg6.id }});

  // Dependencias de tareas
  await prisma.taskDependency.createMany({
    data: [
      { taskId: t1_2.id, dependsOnId: t1_1.id, dependencyType: DependencyType.FS },
      { taskId: t2_1.id, dependsOnId: t1_3.id, dependencyType: DependencyType.FS },
      { taskId: t2_2.id, dependsOnId: t2_1.id, dependencyType: DependencyType.FS },
      { taskId: t2_3.id, dependsOnId: t2_2.id, dependencyType: DependencyType.FS },
      { taskId: t3_1.id, dependsOnId: t2_3.id, dependencyType: DependencyType.FS },
      { taskId: t3_2.id, dependsOnId: t3_1.id, dependencyType: DependencyType.FS },
      { taskId: t3_3.id, dependsOnId: t3_2.id, dependencyType: DependencyType.FS },
      { taskId: t3_4.id, dependsOnId: t3_3.id, dependencyType: DependencyType.FS },
      { taskId: t4_1.id, dependsOnId: t3_4.id, dependencyType: DependencyType.FS },
      { taskId: t4_3.id, dependsOnId: t4_1.id, dependencyType: DependencyType.FS },
      { taskId: t5_1.id, dependsOnId: t3_4.id, dependencyType: DependencyType.FS },
      { taskId: t6_1.id, dependsOnId: t3_4.id, dependencyType: DependencyType.FS },
    ],
  });

  // Asignaciones de tareas a empleados
  const empCapataz = await prisma.employee.findFirst({ where: { legajo: 'EMP-00001' } });
  const empAlbanil1 = await prisma.employee.findFirst({ where: { legajo: 'EMP-00002' } });
  const empElectricista = await prisma.employee.findFirst({ where: { legajo: 'EMP-00004' } });
  if (empCapataz && empAlbanil1 && empElectricista) {
    await prisma.taskAssignment.createMany({
      data: [
        { taskId: t4_3.id, employeeId: empCapataz.id },
        { taskId: t4_3.id, employeeId: empAlbanil1.id },
        { taskId: t5_1.id, employeeId: empElectricista.id },
      ],
    });
  }

  console.log('   ✅ 9 etapas, 19 tareas, dependencias y asignaciones');

  // ----------------------------------------------------------------
  // 7. GASTOS
  // ----------------------------------------------------------------
  console.log('   💸 Creando gastos...');

  interface ExpenseRecord {
    ref: string; desc: string; amount: number; tax?: number; total: number;
    status: ExpenseStatus; date: Date; paid?: Date;
    inv: string; type: string; catId?: string | null;
  }

  const expensesData: ExpenseRecord[] = [
    { ref: 'GAS-2024-00040', desc: 'Materiales fundaciones - hormigón H21 y hierros', amount: 8500000, tax: 1785000, total: 10285000, status: ExpenseStatus.PAID, date: new Date('2024-09-10'), paid: new Date('2024-10-10'), inv: 'A-0015-00006701', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2024-00041', desc: 'Mano de obra fundaciones - Julio/Octubre 2024', amount: 4200000, total: 4200000, status: ExpenseStatus.PAID, date: new Date('2024-10-15'), paid: new Date('2024-10-20'), inv: 'B-0001-00003401', type: 'B', catId: catManoObra?.id },
    { ref: 'GAS-2024-00042', desc: 'Alquiler retroexcavadora - 3 semanas', amount: 2800000, tax: 588000, total: 3388000, status: ExpenseStatus.PAID, date: new Date('2024-09-05'), paid: new Date('2024-09-30'), inv: 'A-0008-00002201', type: 'A', catId: catEquipos?.id },
    { ref: 'GAS-2024-00043', desc: 'Hierros estructura (columnas, vigas, losas - PB+P1)', amount: 18500000, tax: 3885000, total: 22385000, status: ExpenseStatus.PAID, date: new Date('2024-10-20'), paid: new Date('2024-11-20'), inv: 'A-0002-00014501', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2024-00044', desc: 'Hormigón elaborado H21 - Losas entrepiso (6 pedidos)', amount: 22000000, tax: 4620000, total: 26620000, status: ExpenseStatus.PAID, date: new Date('2024-11-01'), paid: new Date('2024-12-01'), inv: 'A-0022-00009801', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2024-00045', desc: 'Mano de obra estructura completa - Nov 2024 / Feb 2025', amount: 12600000, total: 12600000, status: ExpenseStatus.PAID, date: new Date('2025-02-15'), paid: new Date('2025-02-20'), inv: 'B-0001-00004501', type: 'B', catId: catManoObra?.id },
    { ref: 'GAS-2025-00010', desc: 'Ladrillos huecos 18x18x33 - 12.000 unidades', amount: 3360000, tax: 705600, total: 4065600, status: ExpenseStatus.PAID, date: new Date('2025-02-20'), paid: new Date('2025-03-10'), inv: 'A-0015-00008901', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2025-00011', desc: 'Ladrillos huecos 12x18x33 - 8.500 unidades', amount: 1657500, tax: 348075, total: 2005575, status: ExpenseStatus.PAID, date: new Date('2025-02-25'), paid: new Date('2025-03-15'), inv: 'A-0015-00009101', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2025-00012', desc: 'Mano de obra mampostería - Febrero/Marzo 2025', amount: 7800000, total: 7800000, status: ExpenseStatus.PAID, date: new Date('2025-03-31'), paid: new Date('2025-04-05'), inv: 'B-0001-00005201', type: 'B', catId: catManoObra?.id },
    { ref: 'GAS-2025-00013', desc: 'Caño corrugado y cables eléctricos - materiales', amount: 2450000, tax: 514500, total: 2964500, status: ExpenseStatus.APPROVED, date: new Date('2025-03-15'), inv: 'A-0009-00003301', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2025-00014', desc: 'Membranas asfálticas - terraza (2 capas, 250m²)', amount: 4250000, tax: 892500, total: 5142500, status: ExpenseStatus.APPROVED, date: new Date('2025-05-10'), inv: 'A-0031-00001201', type: 'A', catId: catMateriales?.id },
    { ref: 'GAS-2025-00015', desc: 'Seguro todo riesgo construcción - anual', amount: 1850000, total: 1850000, status: ExpenseStatus.PENDING_APPROVAL, date: new Date('2025-05-01'), inv: 'B-0045-00000801', type: 'B', catId: catAdmin?.id },
  ];

  for (const e of expensesData) {
    await prisma.expense.create({
      data: {
        reference: e.ref, description: e.desc, amount: e.amount, taxAmount: e.tax ?? 0,
        totalAmount: e.total, status: e.status, expenseDate: e.date,
        paidDate: e.paid ?? null, invoiceNumber: e.inv, invoiceType: e.type,
        projectId: project.id,
        categoryId: e.catId ?? undefined,
        createdById: administrative.id,
        approvedById: (e.status === ExpenseStatus.PAID || e.status === ExpenseStatus.APPROVED) ? pmAndres.id : undefined,
        approvedAt: (e.status === ExpenseStatus.PAID || e.status === ExpenseStatus.APPROVED) ? new Date() : undefined,
      },
    });
  }
  console.log(`   ✅ ${expensesData.length} gastos creados`);

  // ----------------------------------------------------------------
  // 8. VERSIONES PRESUPUESTARIAS
  // ----------------------------------------------------------------
  console.log('   📊 Creando presupuesto versionado...');

  // Versión 1 - SUPERSEDED
  const bv1 = await prisma.budgetVersion.create({ data: {
    code: 'PRES-2024-00004',
    name: 'Presupuesto Oferta Inicial',
    description: 'Presupuesto original presentado para aprobación de crédito bancario',
    version: 1, status: BudgetVersionStatus.SUPERSEDED,
    gastosGeneralesPct: 0.12, beneficioPct: 0.08, gastosFinancierosPct: 0.015, ivaPct: 0.21,
    coeficienteK: 1.4969,
    totalCostoCosto: 190000000, totalPrecio: 284411000,
    projectId: project.id, organizationId: org.id,
  }});

  // Versión 2 - APPROVED
  const bv2 = await prisma.budgetVersion.create({ data: {
    code: 'PRES-2024-00005',
    name: 'Presupuesto Ejecutivo v2 — Actualizado',
    description: 'Actualización de precios por inflación + adicional: SUM, pileta y landscaping',
    version: 2, status: BudgetVersionStatus.APPROVED,
    approvedAt: new Date('2024-09-15'), approvedById: admin.id,
    gastosGeneralesPct: 0.14, beneficioPct: 0.10, gastosFinancierosPct: 0.02, ivaPct: 0.21,
    coeficienteK: 1.5604,
    totalCostoCosto: 182628000, totalPrecio: 285200000,
    projectId: project.id, organizationId: org.id,
  }});

  // --- Rubros (categorías) del presupuesto v2 ---
  const catRubroA = await prisma.budgetCategory.create({ data: { number: 1, name: 'Trabajos Preliminares', order: 1, subtotalCostoCosto: 5150000, budgetVersionId: bv2.id }});
  const catRubroB = await prisma.budgetCategory.create({ data: { number: 2, name: 'Fundaciones y Estructura', order: 2, subtotalCostoCosto: 58750000, budgetVersionId: bv2.id }});
  const catRubroC = await prisma.budgetCategory.create({ data: { number: 3, name: 'Mampostería y Revoques', order: 3, subtotalCostoCosto: 28400000, budgetVersionId: bv2.id }});
  const catRubroD = await prisma.budgetCategory.create({ data: { number: 4, name: 'Instalaciones', order: 4, subtotalCostoCosto: 35700000, budgetVersionId: bv2.id }});
  const catRubroE = await prisma.budgetCategory.create({ data: { number: 5, name: 'Cubierta y Aislaciones', order: 5, subtotalCostoCosto: 12800000, budgetVersionId: bv2.id }});
  const catRubroF = await prisma.budgetCategory.create({ data: { number: 6, name: 'Terminaciones y Equipamiento', order: 6, subtotalCostoCosto: 31828000, budgetVersionId: bv2.id }});
  const catRubroG = await prisma.budgetCategory.create({ data: { number: 7, name: 'Amenities y Espacios Comunes', order: 7, subtotalCostoCosto: 10000000, budgetVersionId: bv2.id }});

  // --- Etapas presupuestarias ---
  const bsA  = await prisma.budgetStage.create({ data: { number: 'A',   description: 'Trabajos Preliminares',        unit: 'gl', quantity: 1,      unitPrice: 5150000,   totalPrice: 5150000,   categoryId: catRubroA.id }});
  const bsB1 = await prisma.budgetStage.create({ data: { number: 'B.1', description: 'Fundaciones',                  unit: 'gl', quantity: 1,      unitPrice: 17850000,  totalPrice: 17850000,  categoryId: catRubroB.id }});
  const bsB2 = await prisma.budgetStage.create({ data: { number: 'B.2', description: 'Estructura Hormigón Armado',   unit: 'gl', quantity: 1,      unitPrice: 40900000,  totalPrice: 40900000,  categoryId: catRubroB.id }});
  const bsC1 = await prisma.budgetStage.create({ data: { number: 'C.1', description: 'Mampostería',                  unit: 'gl', quantity: 1,      unitPrice: 18200000,  totalPrice: 18200000,  categoryId: catRubroC.id }});
  const bsC2 = await prisma.budgetStage.create({ data: { number: 'C.2', description: 'Revoques',                     unit: 'gl', quantity: 1,      unitPrice: 10200000,  totalPrice: 10200000,  categoryId: catRubroC.id }});
  const bsD1 = await prisma.budgetStage.create({ data: { number: 'D.1', description: 'Instalación Eléctrica',        unit: 'gl', quantity: 1,      unitPrice: 11500000,  totalPrice: 11500000,  categoryId: catRubroD.id }});
  const bsD2 = await prisma.budgetStage.create({ data: { number: 'D.2', description: 'Instalación Sanitaria',        unit: 'gl', quantity: 1,      unitPrice: 14200000,  totalPrice: 14200000,  categoryId: catRubroD.id }});
  const bsD3 = await prisma.budgetStage.create({ data: { number: 'D.3', description: 'Instalación de Gas',           unit: 'gl', quantity: 1,      unitPrice: 10000000,  totalPrice: 10000000,  categoryId: catRubroD.id }});
  const bsE  = await prisma.budgetStage.create({ data: { number: 'E',   description: 'Cubierta y Aislaciones',       unit: 'gl', quantity: 1,      unitPrice: 12800000,  totalPrice: 12800000,  categoryId: catRubroE.id }});
  const bsF  = await prisma.budgetStage.create({ data: { number: 'F',   description: 'Terminaciones',                unit: 'gl', quantity: 1,      unitPrice: 31828000,  totalPrice: 31828000,  categoryId: catRubroF.id }});
  const bsG  = await prisma.budgetStage.create({ data: { number: 'G',   description: 'Amenities',                    unit: 'gl', quantity: 1,      unitPrice: 10000000,  totalPrice: 10000000,  categoryId: catRubroG.id }});

  // --- Items de presupuesto ---
  const biA1  = await prisma.budgetItem.create({ data: { number: 'A.1',   description: 'Cerco de obra y obrador',                              unit: 'gl',  quantity: 1,    unitPrice: 1800000,    totalPrice: 1800000,   stageId: bsA.id }});
  const biA2  = await prisma.budgetItem.create({ data: { number: 'A.2',   description: 'Conexiones provisorias y cartel de obra',              unit: 'gl',  quantity: 1,    unitPrice: 950000,     totalPrice: 950000,    stageId: bsA.id }});
  const biA3  = await prisma.budgetItem.create({ data: { number: 'A.3',   description: 'Movimiento de suelos y nivelación',                    unit: 'm³',  quantity: 580,  unitPrice: 4137.93,    totalPrice: 2400000,   stageId: bsA.id }});
  const biB11 = await prisma.budgetItem.create({ data: { number: 'B.1.1', description: 'Excavación de bases y vigas fundación',                unit: 'm³',  quantity: 420,  unitPrice: 12500,      totalPrice: 5250000,   stageId: bsB1.id }});
  const biB12 = await prisma.budgetItem.create({ data: { number: 'B.1.2', description: 'Hormigón H21 bases y vigas fundación',                 unit: 'm³',  quantity: 68,   unitPrice: 185000,     totalPrice: 12580000,  stageId: bsB1.id }});
  const biB21 = await prisma.budgetItem.create({ data: { number: 'B.2.1', description: 'Columnas y vigas HA (4 niveles)',                      unit: 'm³',  quantity: 85,   unitPrice: 210000,     totalPrice: 17850000,  stageId: bsB2.id }});
  const biB22 = await prisma.budgetItem.create({ data: { number: 'B.2.2', description: 'Losas de entrepiso H21 (4 losas)',                     unit: 'm²',  quantity: 1200, unitPrice: 19208.33,   totalPrice: 23050000,  stageId: bsB2.id }});
  const biC11 = await prisma.budgetItem.create({ data: { number: 'C.1.1', description: 'Mampostería exterior ladrillo h. 18cm',                unit: 'm²',  quantity: 1450, unitPrice: 7241.38,    totalPrice: 10500000,  stageId: bsC1.id }});
  const biC12 = await prisma.budgetItem.create({ data: { number: 'C.1.2', description: 'Tabiques interiores ladrillo h. 12cm',                 unit: 'm²',  quantity: 2200, unitPrice: 3500,       totalPrice: 7700000,   stageId: bsC1.id }});
  const biC21 = await prisma.budgetItem.create({ data: { number: 'C.2.1', description: 'Revoque grueso exterior e interior',                   unit: 'm²',  quantity: 3650, unitPrice: 1753.42,    totalPrice: 6400000,   stageId: bsC2.id }});
  const biC22 = await prisma.budgetItem.create({ data: { number: 'C.2.2', description: 'Revoque fino y enduido interior',                      unit: 'm²',  quantity: 3200, unitPrice: 1187.50,    totalPrice: 3800000,   stageId: bsC2.id }});
  const biD11 = await prisma.budgetItem.create({ data: { number: 'D.1.1', description: 'Instalación eléctrica completa (9 unidades + comunes)', unit: 'gl', quantity: 1,    unitPrice: 8500000,    totalPrice: 8500000,   stageId: bsD1.id }});
  const biD12 = await prisma.budgetItem.create({ data: { number: 'D.1.2', description: 'Tableros generales y seccionales',                     unit: 'gl',  quantity: 1,    unitPrice: 3000000,    totalPrice: 3000000,   stageId: bsD1.id }});
  const biD21 = await prisma.budgetItem.create({ data: { number: 'D.2.1', description: 'Agua fría y caliente (9 unidades)',                    unit: 'gl',  quantity: 1,    unitPrice: 9800000,    totalPrice: 9800000,   stageId: bsD2.id }});
  const biD22 = await prisma.budgetItem.create({ data: { number: 'D.2.2', description: 'Desagüe cloacal y pluvial completo',                   unit: 'gl',  quantity: 1,    unitPrice: 4400000,    totalPrice: 4400000,   stageId: bsD2.id }});
  const biD31 = await prisma.budgetItem.create({ data: { number: 'D.3.1', description: 'Red de gas natural (9 unidades + zonas comunes)',      unit: 'gl',  quantity: 1,    unitPrice: 10000000,   totalPrice: 10000000,  stageId: bsD3.id }});
  const biE1  = await prisma.budgetItem.create({ data: { number: 'E.1',   description: 'Membrana asfáltica bicapa terraza 350m²',              unit: 'm²',  quantity: 350,  unitPrice: 25142.86,   totalPrice: 8800000,   stageId: bsE.id }});
  const biE2  = await prisma.budgetItem.create({ data: { number: 'E.2',   description: 'Aislación térmica EPS 30mm terraza',                  unit: 'm²',  quantity: 350,  unitPrice: 11428.57,   totalPrice: 4000000,   stageId: bsE.id }});
  const biF1  = await prisma.budgetItem.create({ data: { number: 'F.1',   description: 'Pisos y revestimientos (9 unidades)',                  unit: 'gl',  quantity: 1,    unitPrice: 12500000,   totalPrice: 12500000,  stageId: bsF.id }});
  const biF2  = await prisma.budgetItem.create({ data: { number: 'F.2',   description: 'Carpintería de aluminio DVH - aberturas',              unit: 'gl',  quantity: 1,    unitPrice: 11328000,   totalPrice: 11328000,  stageId: bsF.id }});
  const biF3  = await prisma.budgetItem.create({ data: { number: 'F.3',   description: 'Pintura interior y exterior',                         unit: 'gl',  quantity: 1,    unitPrice: 8000000,    totalPrice: 8000000,   stageId: bsF.id }});
  const biG1  = await prisma.budgetItem.create({ data: { number: 'G.1',   description: 'SUM (sala de usos múltiples) - terminaciones',        unit: 'gl',  quantity: 1,    unitPrice: 3500000,    totalPrice: 3500000,   stageId: bsG.id }});
  const biG2  = await prisma.budgetItem.create({ data: { number: 'G.2',   description: 'Pileta de natación 8x4m',                            unit: 'gl',  quantity: 1,    unitPrice: 4200000,    totalPrice: 4200000,   stageId: bsG.id }});
  const biG3  = await prisma.budgetItem.create({ data: { number: 'G.3',   description: 'Jardín y paisajismo',                                unit: 'gl',  quantity: 1,    unitPrice: 2300000,    totalPrice: 2300000,   stageId: bsG.id }});

  console.log('   ✅ 2 versiones presupuestarias, 7 rubros, 11 etapas, 24 ítems');

  // ----------------------------------------------------------------
  // 9. APU (Análisis de Precios Unitarios)
  // ----------------------------------------------------------------
  console.log('   🔬 Creando APUs...');

  // APU B.1.1 - Excavación fundaciones
  const apuB11 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-001',
    totalMaterials: 0, totalLabor: 3750, totalTransport: 0,
    totalEquipAmort: 5250, totalRepairs: 2362.50, totalFuel: 2700,
    totalDirect: 14062.50,
    budgetItemId: biB11.id, organizationId: org.id,
  }});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial', quantity: 0.08, hourlyRate: 10022.01, totalCost: 801.76, priceAnalysisId: apuB11.id },
    { category: 'Ayudante', quantity: 0.32, hourlyRate: 8559.97, totalCost: 2739.19, priceAnalysisId: apuB11.id },
  ]});
  await prisma.analysisEquipment.createMany({ data: [
    { description: 'Retroexcavadora CAT 416E', powerHp: 87, amortInterest: 4050, repairsCost: 3037.50, fuelCost: 4500, lubricantsCost: 450, hoursUsed: 0.10, hourlyTotal: 12037.50, totalCost: 1203.75, section: 'D', priceAnalysisId: apuB11.id },
    { description: 'Camión volcador 6m³', powerHp: 200, amortInterest: 2625, repairsCost: 1968.75, fuelCost: 6000, lubricantsCost: 600, hoursUsed: 0.08, hourlyTotal: 11193.75, totalCost: 895.50, section: 'D', priceAnalysisId: apuB11.id },
    { description: 'Compactador manual', powerHp: 7, amortInterest: 281.25, repairsCost: 210.94, fuelCost: 800, lubricantsCost: 80, hoursUsed: 0.06, hourlyTotal: 1372.19, totalCost: 82.33, section: 'D', priceAnalysisId: apuB11.id },
  ]});

  // APU B.1.2 - Hormigón H21 fundaciones
  const apuB12 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-002',
    totalMaterials: 165000, totalLabor: 8750, totalTransport: 0,
    totalEquipAmort: 3000, totalRepairs: 1350, totalFuel: 2000,
    totalDirect: 180100,
    budgetItemId: biB12.id, organizationId: org.id,
  }});
  await prisma.analysisMaterial.createMany({ data: [
    { description: 'Hormigón Elaborado H21 (con mixer)', unit: 'm³', quantity: 1.00, unitCost: 165000, wastePct: 0, totalCost: 165000, priceAnalysisId: apuB12.id },
  ]});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial Especializado', quantity: 0.30, hourlyRate: 11710.37, totalCost: 3513.11, priceAnalysisId: apuB12.id },
    { category: 'Oficial',              quantity: 0.25, hourlyRate: 10022.01, totalCost: 2505.50, priceAnalysisId: apuB12.id },
    { category: 'Ayudante',             quantity: 0.30, hourlyRate: 8559.97,  totalCost: 2567.99, priceAnalysisId: apuB12.id },
  ]});
  await prisma.analysisEquipment.createMany({ data: [
    { description: 'Vibradora de concreto', amortInterest: 1200, repairsCost: 900, fuelCost: 800, lubricantsCost: 80, hoursUsed: 0.30, hourlyTotal: 2980, totalCost: 894, section: 'D', priceAnalysisId: apuB12.id },
    { description: 'Grúa torre (parcial)', amortInterest: 8000, repairsCost: 6000, fuelCost: 3500, lubricantsCost: 350, hoursUsed: 0.15, hourlyTotal: 17850, totalCost: 2677.50, section: 'D', priceAnalysisId: apuB12.id },
  ]});

  // APU B.2.1 - Columnas y vigas HA
  const apuB21 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-003',
    totalMaterials: 135000, totalLabor: 29250, totalTransport: 0,
    totalEquipAmort: 14500, totalRepairs: 6525, totalFuel: 5500,
    totalDirect: 190775,
    budgetItemId: biB21.id, organizationId: org.id,
  }});
  await prisma.analysisMaterial.createMany({ data: [
    { description: 'Hormigón Elaborado H21', unit: 'm³',  quantity: 0.60, unitCost: 165000, wastePct: 0,    totalCost: 99000,   priceAnalysisId: apuB21.id },
    { description: 'Hierro ADN 420 (varios diámetros)', unit: 'kg', quantity: 90,   unitCost: 400,    wastePct: 0.05, totalCost: 37800,   priceAnalysisId: apuB21.id },
    { description: 'Alambre de atar N°16', unit: 'kg',   quantity: 0.80, unitCost: 3500,   wastePct: 0,    totalCost: 2800,    priceAnalysisId: apuB21.id },
  ]});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial Especializado', quantity: 1.00, hourlyRate: 11710.37, totalCost: 11710.37, priceAnalysisId: apuB21.id },
    { category: 'Oficial',              quantity: 0.80, hourlyRate: 10022.01, totalCost: 8017.61,  priceAnalysisId: apuB21.id },
    { category: 'Medio Oficial',        quantity: 0.60, hourlyRate: 8559.97,  totalCost: 5135.98,  priceAnalysisId: apuB21.id },
    { category: 'Ayudante',             quantity: 0.50, hourlyRate: 8559.97,  totalCost: 4279.99,  priceAnalysisId: apuB21.id },
  ]});
  await prisma.analysisEquipment.createMany({ data: [
    { description: 'Grúa torre Liebherr 65K', powerHp: 45, amortInterest: 7200, repairsCost: 5400, fuelCost: 3500, lubricantsCost: 350, hoursUsed: 0.80, hourlyTotal: 16450, totalCost: 13160, section: 'D', priceAnalysisId: apuB21.id },
    { description: 'Hormigonera 350L',        powerHp: 7,  amortInterest: 375,  repairsCost: 281.25, fuelCost: 800, lubricantsCost: 80,  hoursUsed: 0.25, hourlyTotal: 1536.25, totalCost: 384.06, section: 'D', priceAnalysisId: apuB21.id },
  ]});

  // APU C.1.1 - Mampostería exterior
  const apuC11 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-004',
    totalMaterials: 2800, totalLabor: 2600, totalTransport: 0,
    totalEquipAmort: 0, totalRepairs: 0, totalFuel: 0,
    totalDirect: 5400,
    budgetItemId: biC11.id, organizationId: org.id,
  }});
  await prisma.analysisMaterial.createMany({ data: [
    { description: 'Ladrillo hueco 18x18x33', unit: 'ud',    quantity: 12.5,  unitCost: 165,   wastePct: 0.05, totalCost: 2165.63, priceAnalysisId: apuC11.id },
    { description: 'Cemento Portland CPF40',  unit: 'bolsa', quantity: 0.03,  unitCost: 8900,  wastePct: 0.05, totalCost: 280.35,  priceAnalysisId: apuC11.id },
    { description: 'Arena gruesa lavada',     unit: 'm³',    quantity: 0.008, unitCost: 48000, wastePct: 0.05, totalCost: 403.20,  priceAnalysisId: apuC11.id },
  ]});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial',   quantity: 0.18, hourlyRate: 10022.01, totalCost: 1803.96, priceAnalysisId: apuC11.id },
    { category: 'Ayudante',  quantity: 0.09, hourlyRate: 8559.97,  totalCost: 770.40,  priceAnalysisId: apuC11.id },
  ]});

  // APU D.1.1 - Instalación eléctrica (por departamento)
  const apuD11 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-005',
    totalMaterials: 680000, totalLabor: 165000, totalTransport: 0,
    totalEquipAmort: 0, totalRepairs: 0, totalFuel: 0,
    totalDirect: 845000,
    budgetItemId: biD11.id, organizationId: org.id,
  }});
  await prisma.analysisMaterial.createMany({ data: [
    { description: 'Cable unipolar 2.5mm² (iluminación)',   unit: 'rollo 100m', quantity: 2.5, unitCost: 38000, wastePct: 0.10, totalCost: 104500,  priceAnalysisId: apuD11.id },
    { description: 'Cable unipolar 4mm² (tomacorrientes)',  unit: 'rollo 100m', quantity: 3.0, unitCost: 55000, wastePct: 0.10, totalCost: 181500,  priceAnalysisId: apuD11.id },
    { description: 'Caño corrugado 3/4"',                   unit: 'rollo 25m',  quantity: 8,   unitCost: 12000, wastePct: 0.05, totalCost: 100800,  priceAnalysisId: apuD11.id },
    { description: 'Caja plástica 100x100',                 unit: 'ud',         quantity: 45,  unitCost: 850,   wastePct: 0,    totalCost: 38250,   priceAnalysisId: apuD11.id },
    { description: 'Tablero seccional 12 módulos',          unit: 'ud',         quantity: 1,   unitCost: 35000, wastePct: 0,    totalCost: 35000,   priceAnalysisId: apuD11.id },
    { description: 'Llaves, tomas, porteros y accesorios',  unit: 'gl',         quantity: 1,   unitCost: 220000,wastePct: 0,    totalCost: 220000,  priceAnalysisId: apuD11.id },
  ]});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial Especializado', quantity: 12,  hourlyRate: 11710.37, totalCost: 140524.44, priceAnalysisId: apuD11.id },
    { category: 'Ayudante',             quantity: 2.8, hourlyRate: 8559.97,  totalCost: 23967.92,  priceAnalysisId: apuD11.id },
  ]});

  // APU E.1 - Membrana asfáltica terraza
  const apuE1 = await prisma.priceAnalysis.create({ data: {
    code: 'APU-ARA-006',
    totalMaterials: 18500, totalLabor: 1800, totalTransport: 0,
    totalEquipAmort: 0, totalRepairs: 0, totalFuel: 0,
    totalDirect: 20300,
    budgetItemId: biE1.id, organizationId: org.id,
  }});
  await prisma.analysisMaterial.createMany({ data: [
    { description: 'Membrana asfáltica aluminio 3mm (base)', unit: 'rollo 10m²', quantity: 0.115, unitCost: 65000, wastePct: 0.05, totalCost: 7863.75, priceAnalysisId: apuE1.id },
    { description: 'Membrana asfáltica aluminio 4mm (top)',  unit: 'rollo 10m²', quantity: 0.115, unitCost: 68000, wastePct: 0.05, totalCost: 8228.40, priceAnalysisId: apuE1.id },
    { description: 'Imprimación asfáltica',                  unit: 'litro',      quantity: 0.30,  unitCost: 8500,  wastePct: 0,    totalCost: 2550,    priceAnalysisId: apuE1.id },
  ]});
  await prisma.analysisLabor.createMany({ data: [
    { category: 'Oficial',   quantity: 0.15,  hourlyRate: 10022.01, totalCost: 1503.30, priceAnalysisId: apuE1.id },
    { category: 'Ayudante',  quantity: 0.035, hourlyRate: 8559.97,  totalCost: 299.60,  priceAnalysisId: apuE1.id },
  ]});

  console.log('   ✅ 6 APUs (excavación, hormigón, estructura, mampostería, eléctrica, membrana)');

  // ----------------------------------------------------------------
  // 10. AVANCE FÍSICO (ItemProgress)
  // ----------------------------------------------------------------
  console.log('   📈 Registrando avance físico...');

  for (const item of [biA1, biA2, biA3]) {
    await prisma.itemProgress.create({ data: { date: new Date('2024-08-18'), advance: 1.00, budgetItemId: item.id, registeredById: supervisor.id }});
  }
  for (const item of [biB11, biB12]) {
    await prisma.itemProgress.create({ data: { date: new Date('2024-10-10'), advance: 1.00, budgetItemId: item.id, registeredById: supervisor.id }});
  }
  for (const item of [biB21, biB22]) {
    await prisma.itemProgress.create({ data: { date: new Date('2025-02-10'), advance: 1.00, budgetItemId: item.id, registeredById: supervisor.id }});
  }
  await prisma.itemProgress.create({ data: { date: new Date('2025-04-18'), advance: 1.00, budgetItemId: biC11.id, registeredById: supervisor.id }});
  await prisma.itemProgress.create({ data: { date: new Date('2025-03-15'), advance: 0.35, budgetItemId: biC12.id, registeredById: supervisor.id }});
  await prisma.itemProgress.create({ data: { date: new Date('2025-04-30'), advance: 0.65, budgetItemId: biC12.id, registeredById: supervisor.id }});
  await prisma.itemProgress.create({ data: { date: new Date('2025-04-30'), advance: 0.50, budgetItemId: biD11.id, registeredById: supervisor.id }});
  await prisma.itemProgress.create({ data: { date: new Date('2025-05-20'), advance: 0.30, budgetItemId: biE1.id,  registeredById: supervisor.id }});

  console.log('   ✅ 12 registros de avance físico');

  // ----------------------------------------------------------------
  // 11. CERTIFICADOS
  // ----------------------------------------------------------------
  console.log('   📜 Creando certificados...');

  // Certificado Nº1 - APPROVED (Trabajos Prel. + Fundaciones)
  const cert1 = await prisma.certificate.create({ data: {
    code: 'CERT-2024-00006', number: 1, status: CertificateStatus.APPROVED,
    periodStart: new Date('2024-08-01'), periodEnd: new Date('2024-10-31'),
    subtotal: 22900000,
    acopioPct: 0.00, acopioAmount: 0,
    anticipoPct: 0.10, anticipoAmount: 2290000,
    fondoReparoPct: 0.05, fondoReparoAmount: 1145000,
    adjustmentFactor: 1.0,
    ivaPct: 0.21, ivaAmount: 3976110,
    totalAmount: 23441110,
    submittedAt: new Date('2024-11-05'), approvedAt: new Date('2024-11-10'), approvedById: pmAndres.id,
    budgetVersionId: bv2.id, projectId: project.id, organizationId: org.id,
  }});
  await prisma.certificateItem.createMany({ data: [
    { itemNumber: 'A.1', description: 'Cerco de obra y obrador',    unit: 'gl',  quantity: 1,   unitPrice: 1800000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 1800000,  totalAdvance: 1.0, totalAmount: 1800000,  certificateId: cert1.id, budgetItemId: biA1.id },
    { itemNumber: 'A.2', description: 'Conexiones provisorias',     unit: 'gl',  quantity: 1,   unitPrice: 950000,  previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 950000,   totalAdvance: 1.0, totalAmount: 950000,   certificateId: cert1.id, budgetItemId: biA2.id },
    { itemNumber: 'A.3', description: 'Movimiento de suelos',       unit: 'm³',  quantity: 580, unitPrice: 4137.93, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 2400000,  totalAdvance: 1.0, totalAmount: 2400000,  certificateId: cert1.id, budgetItemId: biA3.id },
    { itemNumber: 'B.1.1', description: 'Excavación fundaciones',   unit: 'm³',  quantity: 420, unitPrice: 12500,   previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 5250000,  totalAdvance: 1.0, totalAmount: 5250000,  certificateId: cert1.id, budgetItemId: biB11.id },
    { itemNumber: 'B.1.2', description: 'Hormigón H21 fundaciones', unit: 'm³',  quantity: 68,  unitPrice: 185000,  previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 12580000, totalAdvance: 1.0, totalAmount: 12580000, certificateId: cert1.id, budgetItemId: biB12.id },
  ]});

  // Certificado Nº2 - APPROVED (Estructura completa)
  const cert2 = await prisma.certificate.create({ data: {
    code: 'CERT-2025-00006', number: 2, status: CertificateStatus.APPROVED,
    periodStart: new Date('2024-11-01'), periodEnd: new Date('2025-02-28'),
    subtotal: 40900000,
    acopioPct: 0.00, acopioAmount: 0,
    anticipoPct: 0.10, anticipoAmount: 4090000,
    fondoReparoPct: 0.05, fondoReparoAmount: 2045000,
    adjustmentFactor: 1.08,
    ivaPct: 0.21, ivaAmount: 7455120,
    totalAmount: 43219120,
    submittedAt: new Date('2025-03-05'), approvedAt: new Date('2025-03-10'), approvedById: pmAndres.id,
    budgetVersionId: bv2.id, projectId: project.id, organizationId: org.id,
  }});
  await prisma.certificateItem.createMany({ data: [
    { itemNumber: 'B.2.1', description: 'Columnas y vigas HA (4 niveles)', unit: 'm³', quantity: 85,   unitPrice: 210000,   previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 17850000, totalAdvance: 1.0, totalAmount: 17850000, certificateId: cert2.id, budgetItemId: biB21.id },
    { itemNumber: 'B.2.2', description: 'Losas de entrepiso H21',          unit: 'm²', quantity: 1200, unitPrice: 19208.33, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 23050000, totalAdvance: 1.0, totalAmount: 23050000, certificateId: cert2.id, budgetItemId: biB22.id },
  ]});

  // Certificado Nº3 - SUBMITTED (Mampostería parcial + inicio instalaciones)
  const cert3 = await prisma.certificate.create({ data: {
    code: 'CERT-2025-00007', number: 3, status: CertificateStatus.SUBMITTED,
    periodStart: new Date('2025-03-01'), periodEnd: new Date('2025-05-31'),
    subtotal: 32870000,
    acopioPct: 0.00, acopioAmount: 0,
    anticipoPct: 0.10, anticipoAmount: 3287000,
    fondoReparoPct: 0.05, fondoReparoAmount: 1643500,
    adjustmentFactor: 1.12,
    ivaPct: 0.21, ivaAmount: 6302040,
    totalAmount: 34241540,
    submittedAt: new Date('2025-06-03'),
    budgetVersionId: bv2.id, projectId: project.id, organizationId: org.id,
  }});
  await prisma.certificateItem.createMany({ data: [
    { itemNumber: 'C.1.1', description: 'Mampostería exterior 18cm',       unit: 'm²', quantity: 1450, unitPrice: 7241.38,  previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0,  currentAmount: 10500000, totalAdvance: 1.0,  totalAmount: 10500000, certificateId: cert3.id, budgetItemId: biC11.id },
    { itemNumber: 'C.1.2', description: 'Tabiques interiores 12cm',        unit: 'm²', quantity: 2200, unitPrice: 3500,     previousAdvance: 0, previousAmount: 0, currentAdvance: 0.65, currentAmount: 5005000,  totalAdvance: 0.65, totalAmount: 5005000,  certificateId: cert3.id, budgetItemId: biC12.id },
    { itemNumber: 'D.1.1', description: 'Instalación eléctrica',           unit: 'gl', quantity: 1,    unitPrice: 8500000,  previousAdvance: 0, previousAmount: 0, currentAdvance: 0.50, currentAmount: 4250000,  totalAdvance: 0.50, totalAmount: 4250000,  certificateId: cert3.id, budgetItemId: biD11.id },
    { itemNumber: 'D.2.1', description: 'Agua fría y caliente',            unit: 'gl', quantity: 1,    unitPrice: 9800000,  previousAdvance: 0, previousAmount: 0, currentAdvance: 0.30, currentAmount: 2940000,  totalAdvance: 0.30, totalAmount: 2940000,  certificateId: cert3.id, budgetItemId: biD21.id },
    { itemNumber: 'E.1',   description: 'Membrana asfáltica terraza',      unit: 'm²', quantity: 350,  unitPrice: 25142.86, previousAdvance: 0, previousAmount: 0, currentAdvance: 0.30, currentAmount: 2640000,  totalAdvance: 0.30, totalAmount: 2640000,  certificateId: cert3.id, budgetItemId: biE1.id },
  ]});

  // Certificado Nº4 - DRAFT (en preparación)
  await prisma.certificate.create({ data: {
    code: 'CERT-2025-00008', number: 4, status: CertificateStatus.DRAFT,
    periodStart: new Date('2025-06-01'), periodEnd: new Date('2025-08-31'),
    subtotal: 0, acopioPct: 0, acopioAmount: 0,
    anticipoPct: 0.10, anticipoAmount: 0,
    fondoReparoPct: 0.05, fondoReparoAmount: 0,
    adjustmentFactor: 1.0, ivaPct: 0.21, ivaAmount: 0, totalAmount: 0,
    budgetVersionId: bv2.id, projectId: project.id, organizationId: org.id,
  }});

  console.log('   ✅ 4 certificados (2 APPROVED + 1 SUBMITTED + 1 DRAFT)');

  // ----------------------------------------------------------------
  // 12. SUBCONTRATOS
  // ----------------------------------------------------------------
  console.log('   🤝 Creando subcontratos...');

  // Subcontrato 1 - Instalación de gas (ACTIVE)
  const sub1 = await prisma.subcontract.create({ data: {
    code: 'SUB-2025-00003',
    name: 'Instalación de Gas Natural',
    description: 'Red de gas natural completa: 9 unidades, zonas comunes y caldera central. Habilitación MetroGas.',
    status: SubcontractStatus.ACTIVE,
    contractorName: 'Instalaciones Gasíferas del Sur S.R.L.',
    contractorCuit: '30-72345678-1',
    contactEmail: 'operaciones@igdelsur.com.ar',
    contactPhone: '+54 11 4788-3300',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-08-31'),
    totalAmount: 10000000,
    projectId: project.id, organizationId: org.id,
  }});
  const subItem1a = await prisma.subcontractItem.create({ data: { description: 'Red troncal de distribución gas (acero negro)',      unit: 'gl', quantity: 1, unitPrice: 3500000, totalPrice: 3500000, subcontractId: sub1.id }});
  const subItem1b = await prisma.subcontractItem.create({ data: { description: 'Ramales y medidores por unidad (9 unidades)',         unit: 'ud', quantity: 9, unitPrice: 600000,  totalPrice: 5400000, subcontractId: sub1.id }});
  const subItem1c = await prisma.subcontractItem.create({ data: { description: 'Habilitación MetroGas y ensayo de estanqueidad',      unit: 'gl', quantity: 1, unitPrice: 1100000, totalPrice: 1100000, subcontractId: sub1.id }});

  // Primer certificado del subcontrato - APPROVED
  const subCert1 = await prisma.subcontractCertificate.create({ data: {
    code: 'SUBCERT-2025-00003', number: 1, status: CertificateStatus.APPROVED,
    periodStart: new Date('2025-05-01'), periodEnd: new Date('2025-05-31'),
    subtotal: 2506000, totalAmount: 2506000,
    approvedAt: new Date('2025-06-05'), approvedById: pmAndres.id,
    subcontractId: sub1.id, organizationId: org.id,
  }});
  await prisma.subcontractCertificateItem.createMany({ data: [
    { description: 'Red troncal de distribución gas', unit: 'gl', quantity: 1, unitPrice: 3500000, previousAdvance: 0, currentAdvance: 0.50, currentAmount: 1750000, totalAdvance: 0.50, totalAmount: 1750000, certificateId: subCert1.id, subcontractItemId: subItem1a.id },
    { description: 'Ramales y medidores',             unit: 'ud', quantity: 9, unitPrice: 600000,  previousAdvance: 0, currentAdvance: 0.14, currentAmount: 756000,  totalAdvance: 0.14, totalAmount: 756000,  certificateId: subCert1.id, subcontractItemId: subItem1b.id },
  ]});

  // Subcontrato 2 - Carpintería de Aluminio DVH (DRAFT)
  const sub2 = await prisma.subcontract.create({ data: {
    code: 'SUB-2025-00004',
    name: 'Carpintería de Aluminio DVH',
    description: 'Provisión y colocación de aberturas de aluminio anodizado con doble vidriado hermético. Línea Premium. 9 unidades + zonas comunes.',
    status: SubcontractStatus.DRAFT,
    contractorName: 'Aluminios Metropolitanos S.A.',
    contractorCuit: '30-68123456-5',
    contactEmail: 'proyectos@aluminiosmet.com.ar',
    contactPhone: '+54 11 4622-7700',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-09-30'),
    totalAmount: 11328000,
    projectId: project.id, organizationId: org.id,
  }});
  await prisma.subcontractItem.createMany({ data: [
    { description: 'Ventanas corredizas 1.20x1.10m DVH (36 unidades)',      unit: 'ud', quantity: 36, unitPrice: 145000, totalPrice: 5220000, subcontractId: sub2.id },
    { description: 'Puertas balcón corredizas 1.80x2.10m DVH (18 unidades)',unit: 'ud', quantity: 18, unitPrice: 285000, totalPrice: 5130000, subcontractId: sub2.id },
    { description: 'Puertas de acceso aluminio reforzado (9 unidades)',      unit: 'ud', quantity: 9,  unitPrice: 108667, totalPrice: 978000,  subcontractId: sub2.id },
  ]});

  console.log('   ✅ 2 subcontratos (1 ACTIVE con certificado + 1 DRAFT), 6 ítems');

  // ----------------------------------------------------------------
  // 13. FÓRMULA DE REDETERMINACIÓN DE PRECIOS
  // ----------------------------------------------------------------
  if (idxMO && idxMAT && idxEQ && idxCOMB) {
    console.log('   📊 Creando fórmula de redeterminación de precios...');

    await prisma.adjustmentFormula.create({ data: {
      name: 'Fórmula Polinómica - Edificio Las Araucarias',
      budgetVersionId: bv2.id,
      organizationId: org.id,
      weights: {
        create: [
          { component: 'Mano de Obra',             weight: 0.40, priceIndexId: idxMO.id },
          { component: 'Materiales de Construcción', weight: 0.38, priceIndexId: idxMAT.id },
          { component: 'Equipos Viales',            weight: 0.12, priceIndexId: idxEQ.id },
          { component: 'Combustibles',              weight: 0.10, priceIndexId: idxCOMB.id },
        ],
      },
    }});

    console.log('   ✅ Fórmula polinómica: MO 40% + MAT 38% + EQ 12% + COMB 10%');
  } else {
    console.log('   ⚠️  Índices de precios no encontrados. Fórmula omitida.');
  }

  // ----------------------------------------------------------------
  // 14. PLAN FINANCIERO
  // ----------------------------------------------------------------
  console.log('   📅 Creando plan financiero...');

  const financialPlan = await prisma.financialPlan.create({ data: {
    name: 'Plan Financiero 2024-2025 - Las Araucarias',
    status: FinancialPlanStatus.APPROVED,
    projectId: project.id,
    budgetVersionId: bv2.id,
    organizationId: org.id,
  }});

  interface MonthlyPlan {
    month: number; year: number; label: string;
    projected: number; materials: number; labor: number; equipment: number; subcontracts: number;
    projectedProgress: number; actualProgress?: number; certifiedAmount?: number; executedAmount?: number;
  }

  const monthlyData: MonthlyPlan[] = [
    // 2024
    { month: 8,  year: 2024, label: 'Agosto 2024',     projected: 5150000,  materials: 2200000, labor: 1800000, equipment: 900000,  subcontracts: 250000,  projectedProgress: 0.02, actualProgress: 0.02,  certifiedAmount: 4380000,  executedAmount: 5200000  },
    { month: 9,  year: 2024, label: 'Septiembre 2024', projected: 8000000,  materials: 3500000, labor: 2800000, equipment: 1400000, subcontracts: 300000,  projectedProgress: 0.05, actualProgress: 0.05,  certifiedAmount: 6800000,  executedAmount: 8300000  },
    { month: 10, year: 2024, label: 'Octubre 2024',    projected: 12000000, materials: 5200000, labor: 4000000, equipment: 2200000, subcontracts: 600000,  projectedProgress: 0.09, actualProgress: 0.09,  certifiedAmount: 10200000, executedAmount: 11800000 },
    { month: 11, year: 2024, label: 'Noviembre 2024',  projected: 15000000, materials: 6500000, labor: 5000000, equipment: 2800000, subcontracts: 700000,  projectedProgress: 0.15, actualProgress: 0.15,  certifiedAmount: 12750000, executedAmount: 15500000 },
    { month: 12, year: 2024, label: 'Diciembre 2024',  projected: 18000000, materials: 7800000, labor: 6000000, equipment: 3400000, subcontracts: 800000,  projectedProgress: 0.21, actualProgress: 0.21,  certifiedAmount: 15300000, executedAmount: 17900000 },
    // 2025
    { month: 1,  year: 2025, label: 'Enero 2025',      projected: 20000000, materials: 8700000, labor: 6700000, equipment: 3800000, subcontracts: 800000,  projectedProgress: 0.28, actualProgress: 0.28,  certifiedAmount: 17000000, executedAmount: 20200000 },
    { month: 2,  year: 2025, label: 'Febrero 2025',    projected: 22000000, materials: 9600000, labor: 7400000, equipment: 4200000, subcontracts: 800000,  projectedProgress: 0.35, actualProgress: 0.35,  certifiedAmount: 18700000, executedAmount: 21800000 },
    { month: 3,  year: 2025, label: 'Marzo 2025',      projected: 25000000, materials: 10900000,labor: 8400000, equipment: 4800000, subcontracts: 900000,  projectedProgress: 0.42, actualProgress: 0.42,  certifiedAmount: 21250000, executedAmount: 25600000 },
    { month: 4,  year: 2025, label: 'Abril 2025',      projected: 28000000, materials: 12200000,labor: 9400000, equipment: 5400000, subcontracts: 1000000, projectedProgress: 0.45, actualProgress: 0.45,  certifiedAmount: 23800000, executedAmount: 27500000 },
    { month: 5,  year: 2025, label: 'Mayo 2025',       projected: 30000000, materials: 13100000,labor: 10100000,equipment: 5800000, subcontracts: 1000000, projectedProgress: 0.52 },
    { month: 6,  year: 2025, label: 'Junio 2025',      projected: 30000000, materials: 13100000,labor: 10100000,equipment: 5800000, subcontracts: 1000000, projectedProgress: 0.60 },
    { month: 7,  year: 2025, label: 'Julio 2025',      projected: 28000000, materials: 12200000,labor: 9400000, equipment: 5400000, subcontracts: 1000000, projectedProgress: 0.68 },
    { month: 8,  year: 2025, label: 'Agosto 2025',     projected: 25000000, materials: 10900000,labor: 8400000, equipment: 4800000, subcontracts: 900000,  projectedProgress: 0.76 },
    { month: 9,  year: 2025, label: 'Septiembre 2025', projected: 20000000, materials: 8700000, labor: 6700000, equipment: 3800000, subcontracts: 800000,  projectedProgress: 0.87 },
    { month: 10, year: 2025, label: 'Octubre 2025',    projected: 15000000, materials: 6500000, labor: 5000000, equipment: 2800000, subcontracts: 700000,  projectedProgress: 1.00 },
  ];

  for (const mp of monthlyData) {
    await prisma.financialPeriod.create({ data: {
      month: mp.month, year: mp.year, label: mp.label,
      projectedAmount: mp.projected,
      projectedMaterials: mp.materials,
      projectedLabor: mp.labor,
      projectedEquipment: mp.equipment,
      projectedSubcontracts: mp.subcontracts,
      projectedProgress: mp.projectedProgress,
      certifiedAmount: mp.certifiedAmount ?? 0,
      executedAmount: mp.executedAmount ?? 0,
      actualProgress: mp.actualProgress ?? 0,
      financialPlanId: financialPlan.id,
    }});
  }

  console.log(`   ✅ Plan financiero: ${monthlyData.length} meses (ago 2024 - oct 2025), 9 meses con datos reales`);

  // ----------------------------------------------------------------
  // Resumen final
  // ----------------------------------------------------------------
  console.log('');
  console.log('============================================================');
  console.log('✅ PROYECTO CREADO EXITOSAMENTE');
  console.log('============================================================');
  console.log(`   📌 ${project.name}`);
  console.log(`   🔑 Código: ${project.code}`);
  console.log(`   📍 ${project.address}, ${project.city}, ${project.province}`);
  console.log(`   📅 ${project.startDate?.toLocaleDateString('es-AR')} → ${project.estimatedEndDate?.toLocaleDateString('es-AR')}`);
  console.log(`   💰 Presupuesto: $${(project.estimatedBudget ?? 0).toLocaleString('es-AR')} ARS`);
  console.log(`   📊 Avance: ${project.progress}%`);
  console.log('');
  console.log('   Módulos ERP incluidos:');
  console.log('   • 9 etapas + 19 tareas con dependencias y asignaciones');
  console.log('   • 12 gastos (pagados, aprobados, pendientes)');
  console.log('   • 2 versiones presupuestarias (SUPERSEDED + APPROVED)');
  console.log('   • 7 rubros, 11 etapas presupuestarias, 24 ítems');
  console.log('   • 6 APUs (materiales, MdO, equipos)');
  console.log('   • 12 registros de avance físico');
  console.log('   • 4 certificados (2 APPROVED + 1 SUBMITTED + 1 DRAFT)');
  console.log('   • 2 subcontratos (1 ACTIVE + 1 DRAFT) con certificación');
  console.log('   • 1 fórmula de redeterminación de precios (4 componentes)');
  console.log('   • Plan financiero 15 meses con datos históricos y proyecciones');
  console.log('============================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
