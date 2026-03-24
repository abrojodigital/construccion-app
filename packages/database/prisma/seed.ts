import { PrismaClient, Prisma, UserRole, ProjectStatus, TaskStatus, TaskPriority, ExpenseStatus, DependencyType, AttendanceType, PurchaseOrderStatus, AuditAction, NotificationType, BudgetVersionStatus, CertificateStatus, SubcontractStatus, FinancialPlanStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive demo seed...');
  console.log('================================================');

  // ============================================
  // CLEANUP
  // ============================================
  console.log('🧹 Cleaning up existing data...');
  // ERP models (Fases 1-7) - eliminar primero por FK
  await prisma.financialPeriod.deleteMany();
  await prisma.financialPlan.deleteMany();
  await prisma.equipmentCatalogItem.deleteMany();
  await prisma.laborCategory.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.adjustmentWeight.deleteMany();
  await prisma.adjustmentFormula.deleteMany();
  await prisma.priceIndexValue.deleteMany();
  await prisma.priceIndex.deleteMany();
  await prisma.subcontractCertificateItem.deleteMany();
  await prisma.subcontractCertificate.deleteMany();
  await prisma.subcontractItem.deleteMany();
  await prisma.subcontract.deleteMany();
  await prisma.certificateItem.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.itemProgress.deleteMany();
  await prisma.analysisTransport.deleteMany();
  await prisma.analysisEquipment.deleteMany();
  await prisma.analysisLabor.deleteMany();
  await prisma.analysisMaterial.deleteMany();
  await prisma.priceAnalysis.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.budgetStage.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.budgetVersion.deleteMany();
  // Original models
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.task.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.employeeProjectAssignment.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.supplierMaterial.deleteMany();
  await prisma.material.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('   ✅ Database cleaned');

  // ============================================
  // ORGANIZATION
  // ============================================
  console.log('🏢 Creating organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'Constructora Patagonia S.A.',
      cuit: '30-71456823-9',
      address: 'Av. Santa Fe 2450, Piso 8, Of. A',
      city: 'Buenos Aires',
      province: 'Ciudad Autónoma de Buenos Aires',
      phone: '+54 11 4827-3500',
      email: 'info@constructorapatagonia.com.ar',
    },
  });
  console.log(`   ✅ ${org.name}`);

  // ============================================
  // USERS (5 roles del sistema)
  // ============================================
  console.log('👥 Creating users...');
  const hash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@constructorademo.com.ar',
      password: hash,
      firstName: 'Paula Agustina',
      lastName: 'Bersier Arias',
      phone: '+54 11 4155-2200',
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const pmMaria = await prisma.user.create({
    data: {
      email: 'jefe@constructorademo.com.ar',
      password: hash,
      firstName: 'María',
      lastName: 'González',
      phone: '+54 11 4267-8800',
      role: UserRole.PROJECT_MANAGER,
      organizationId: org.id,
    },
  });

  const pmAndres = await prisma.user.create({
    data: {
      email: 'andres.pm@constructorademo.com.ar',
      password: hash,
      firstName: 'Andrés',
      lastName: 'Villanueva',
      phone: '+54 11 5534-1100',
      role: UserRole.PROJECT_MANAGER,
      organizationId: org.id,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@constructorademo.com.ar',
      password: hash,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+54 11 3456-7890',
      role: UserRole.SUPERVISOR,
      organizationId: org.id,
    },
  });

  const administrative = await prisma.user.create({
    data: {
      email: 'admin.contable@constructorademo.com.ar',
      password: hash,
      firstName: 'Laura',
      lastName: 'Martínez',
      phone: '+54 11 4567-8901',
      role: UserRole.ADMINISTRATIVE,
      organizationId: org.id,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'cliente@ejemplo.com.ar',
      password: hash,
      firstName: 'Roberto',
      lastName: 'Fernández',
      phone: '+54 11 5678-9012',
      role: UserRole.READ_ONLY,
      organizationId: org.id,
    },
  });
  console.log('   ✅ 6 users created (admin, 2 PM, supervisor, admin contable, cliente)');

  // ============================================
  // EXPENSE CATEGORIES
  // ============================================
  console.log('📁 Creating expense categories...');
  const catMateriales = await prisma.expenseCategory.create({
    data: { name: 'Materiales de Construcción', code: 'MAT', color: '#3B82F6', description: 'Cemento, hierro, ladrillos, áridos, etc.', organizationId: org.id },
  });
  const catManoObra = await prisma.expenseCategory.create({
    data: { name: 'Mano de Obra', code: 'MO', color: '#10B981', description: 'Jornales, horas extra, cargas sociales', organizationId: org.id },
  });
  const catEquipos = await prisma.expenseCategory.create({
    data: { name: 'Equipos y Maquinaria', code: 'EQ', color: '#F59E0B', description: 'Alquiler de grúas, mixers, compactadoras', organizationId: org.id },
  });
  const catSubcontratos = await prisma.expenseCategory.create({
    data: { name: 'Subcontratistas', code: 'SUB', color: '#8B5CF6', description: 'Trabajos tercerizados (ascensores, vidrios, etc.)', organizationId: org.id },
  });
  const catTransporte = await prisma.expenseCategory.create({
    data: { name: 'Transporte y Logística', code: 'TRANS', color: '#EC4899', description: 'Fletes, volquetes, envíos', organizationId: org.id },
  });
  const catAdmin = await prisma.expenseCategory.create({
    data: { name: 'Gastos Administrativos', code: 'ADM', color: '#6B7280', description: 'Seguros, permisos, trámites municipales', organizationId: org.id },
  });
  const catSeguridad = await prisma.expenseCategory.create({
    data: { name: 'Seguridad e Higiene', code: 'SEG', color: '#EF4444', description: 'EPP, señalización, matafuegos', organizationId: org.id },
  });
  console.log('   ✅ 7 expense categories');

  // ============================================
  // MATERIAL CATEGORIES
  // ============================================
  console.log('📦 Creating material categories...');
  const mcCemento = await prisma.materialCategory.create({
    data: { name: 'Cemento y Agregados', code: 'CEM', organizationId: org.id },
  });
  const mcLadrillos = await prisma.materialCategory.create({
    data: { name: 'Ladrillos y Bloques', code: 'LAD', organizationId: org.id },
  });
  const mcHierros = await prisma.materialCategory.create({
    data: { name: 'Hierros y Aceros', code: 'HIE', organizationId: org.id },
  });
  const mcElectricidad = await prisma.materialCategory.create({
    data: { name: 'Electricidad', code: 'ELEC', organizationId: org.id },
  });
  const mcPlomeria = await prisma.materialCategory.create({
    data: { name: 'Plomería y Sanitarios', code: 'PLOM', organizationId: org.id },
  });
  const mcPintura = await prisma.materialCategory.create({
    data: { name: 'Pintura y Revestimientos', code: 'PINT', organizationId: org.id },
  });
  const mcMadera = await prisma.materialCategory.create({
    data: { name: 'Maderas y Carpintería', code: 'MAD', organizationId: org.id },
  });
  const mcAislaciones = await prisma.materialCategory.create({
    data: { name: 'Aislaciones e Impermeabilización', code: 'AISL', organizationId: org.id },
  });
  console.log('   ✅ 8 material categories');

  // ============================================
  // MATERIALS (amplio catálogo)
  // ============================================
  console.log('🧱 Creating materials...');
  const materials = await Promise.all([
    // Cemento y Agregados
    prisma.material.create({ data: { code: 'MAT-00001', name: 'Cemento Portland CPF40', description: 'Bolsa de 50kg - Loma Negra', unit: 'bolsa', currentStock: 180, minimumStock: 50, lastPurchasePrice: 8900, averagePrice: 8650, categoryId: mcCemento.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00002', name: 'Arena Gruesa Lavada', description: 'Metro cúbico - Cantera San Martín', unit: 'm3', currentStock: 35, minimumStock: 15, lastPurchasePrice: 48000, averagePrice: 46000, categoryId: mcCemento.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00003', name: 'Piedra Partida 6/20', description: 'Metro cúbico', unit: 'm3', currentStock: 20, minimumStock: 10, lastPurchasePrice: 52000, averagePrice: 50000, categoryId: mcCemento.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00004', name: 'Hormigón Elaborado H21', description: 'Metro cúbico - Entrega con mixer', unit: 'm3', currentStock: 0, minimumStock: 0, lastPurchasePrice: 165000, averagePrice: 158000, categoryId: mcCemento.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00005', name: 'Cal Hidráulica', description: 'Bolsa de 25kg', unit: 'bolsa', currentStock: 60, minimumStock: 20, lastPurchasePrice: 4200, averagePrice: 4000, categoryId: mcCemento.id, organizationId: org.id } }),
    // Ladrillos y Bloques
    prisma.material.create({ data: { code: 'MAT-00006', name: 'Ladrillo Hueco 12x18x33', description: 'Unidad - Para tabiques interiores', unit: 'unidad', currentStock: 4500, minimumStock: 1000, lastPurchasePrice: 195, averagePrice: 185, categoryId: mcLadrillos.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00007', name: 'Ladrillo Hueco 18x18x33', description: 'Unidad - Para paredes exteriores', unit: 'unidad', currentStock: 3200, minimumStock: 800, lastPurchasePrice: 280, averagePrice: 265, categoryId: mcLadrillos.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00008', name: 'Bloque de Hormigón 20x20x40', description: 'Unidad - Para estructura', unit: 'unidad', currentStock: 800, minimumStock: 200, lastPurchasePrice: 450, averagePrice: 430, categoryId: mcLadrillos.id, organizationId: org.id } }),
    // Hierros y Aceros
    prisma.material.create({ data: { code: 'MAT-00009', name: 'Hierro Aletado Ø 6mm', description: 'Barra de 12m - ADN420', unit: 'barra', currentStock: 250, minimumStock: 80, lastPurchasePrice: 7800, averagePrice: 7500, categoryId: mcHierros.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00010', name: 'Hierro Aletado Ø 8mm', description: 'Barra de 12m - ADN420', unit: 'barra', currentStock: 320, minimumStock: 100, lastPurchasePrice: 12500, averagePrice: 12000, categoryId: mcHierros.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00011', name: 'Hierro Aletado Ø 10mm', description: 'Barra de 12m - ADN420', unit: 'barra', currentStock: 180, minimumStock: 60, lastPurchasePrice: 18500, averagePrice: 17800, categoryId: mcHierros.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00012', name: 'Hierro Aletado Ø 12mm', description: 'Barra de 12m - ADN420', unit: 'barra', currentStock: 120, minimumStock: 40, lastPurchasePrice: 26000, averagePrice: 25000, categoryId: mcHierros.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00013', name: 'Malla Electrosoldada 15x15 Ø4.2', description: 'Panel 2.40 x 6.00m', unit: 'panel', currentStock: 45, minimumStock: 15, lastPurchasePrice: 42000, averagePrice: 40000, categoryId: mcHierros.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00014', name: 'Alambre de Atar N°16', description: 'Rollo de 1kg', unit: 'kg', currentStock: 30, minimumStock: 10, lastPurchasePrice: 3500, averagePrice: 3300, categoryId: mcHierros.id, organizationId: org.id } }),
    // Electricidad
    prisma.material.create({ data: { code: 'MAT-00015', name: 'Cable Unipolar 2.5mm² Rojo', description: 'Rollo de 100m - IRAM', unit: 'rollo', currentStock: 15, minimumStock: 5, lastPurchasePrice: 38000, averagePrice: 36000, categoryId: mcElectricidad.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00016', name: 'Cable Unipolar 4mm² Celeste', description: 'Rollo de 100m - IRAM', unit: 'rollo', currentStock: 10, minimumStock: 3, lastPurchasePrice: 55000, averagePrice: 52000, categoryId: mcElectricidad.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00017', name: 'Caño Corrugado 3/4"', description: 'Rollo de 25m', unit: 'rollo', currentStock: 22, minimumStock: 8, lastPurchasePrice: 12000, averagePrice: 11500, categoryId: mcElectricidad.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00018', name: 'Tablero Eléctrico 12 módulos', description: 'Con riel DIN y borneras', unit: 'unidad', currentStock: 4, minimumStock: 2, lastPurchasePrice: 35000, averagePrice: 33000, categoryId: mcElectricidad.id, organizationId: org.id } }),
    // Plomería
    prisma.material.create({ data: { code: 'MAT-00019', name: 'Caño PPF Ø 20mm', description: 'Barra de 4m - Agua fría/caliente', unit: 'barra', currentStock: 40, minimumStock: 15, lastPurchasePrice: 8500, averagePrice: 8200, categoryId: mcPlomeria.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00020', name: 'Caño PVC Ø 110mm', description: 'Barra de 4m - Desagüe cloacal', unit: 'barra', currentStock: 18, minimumStock: 6, lastPurchasePrice: 22000, averagePrice: 21000, categoryId: mcPlomeria.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00021', name: 'Tanque de Agua 1100L', description: 'Tricapa Rotoplas', unit: 'unidad', currentStock: 2, minimumStock: 1, lastPurchasePrice: 185000, averagePrice: 180000, categoryId: mcPlomeria.id, organizationId: org.id } }),
    // Pintura
    prisma.material.create({ data: { code: 'MAT-00022', name: 'Látex Interior Blanco 20L', description: 'Sherwin Williams - 1ra calidad', unit: 'lata', currentStock: 8, minimumStock: 3, lastPurchasePrice: 95000, averagePrice: 90000, categoryId: mcPintura.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00023', name: 'Membrana Líquida 20L', description: 'Para techos - Sika', unit: 'balde', currentStock: 5, minimumStock: 2, lastPurchasePrice: 115000, averagePrice: 110000, categoryId: mcPintura.id, organizationId: org.id } }),
    // Maderas
    prisma.material.create({ data: { code: 'MAT-00024', name: 'Fenólico 18mm 1.22x2.44', description: 'Placa para encofrado', unit: 'placa', currentStock: 25, minimumStock: 8, lastPurchasePrice: 48000, averagePrice: 46000, categoryId: mcMadera.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00025', name: 'Tirante Pino 2x4" x 3.60m', description: 'Para puntales y encofrado', unit: 'unidad', currentStock: 60, minimumStock: 20, lastPurchasePrice: 12000, averagePrice: 11500, categoryId: mcMadera.id, organizationId: org.id } }),
    // Aislaciones
    prisma.material.create({ data: { code: 'MAT-00026', name: 'Membrana Asfáltica 4mm', description: 'Rollo 10m² - Con aluminio', unit: 'rollo', currentStock: 12, minimumStock: 4, lastPurchasePrice: 68000, averagePrice: 65000, categoryId: mcAislaciones.id, organizationId: org.id } }),
    prisma.material.create({ data: { code: 'MAT-00027', name: 'Poliestireno Expandido 25mm', description: 'Placa 1x1m - Densidad 20kg/m³', unit: 'placa', currentStock: 80, minimumStock: 20, lastPurchasePrice: 5500, averagePrice: 5200, categoryId: mcAislaciones.id, organizationId: org.id } }),
  ]);
  console.log(`   ✅ ${materials.length} materials created`);

  // ============================================
  // SUPPLIERS
  // ============================================
  console.log('🏪 Creating suppliers...');
  const supCorralon = await prisma.supplier.create({
    data: {
      code: 'PROV-00001', name: 'Corralón El Constructor', tradeName: 'El Constructor S.R.L.',
      cuit: '30-98765432-1', address: 'Ruta 8 Km 45, Lote 12', city: 'Pilar', province: 'Buenos Aires',
      phone: '+54 230 442-5500', email: 'ventas@elconstructor.com.ar',
      contactName: 'Pedro García', contactPhone: '+54 11 6543-2100', contactEmail: 'pedro@elconstructor.com.ar',
      paymentTerms: '30 días FF', bankName: 'Banco Nación', cbu: '0110012340001234567890', alias: 'CONSTRUCTOR.VENTAS',
      rating: 5, notes: 'Proveedor histórico. Excelente stock y entrega puntual.', organizationId: org.id,
    },
  });
  const supHierros = await prisma.supplier.create({
    data: {
      code: 'PROV-00002', name: 'Hierros del Sur S.A.', tradeName: 'Hierros del Sur S.A.',
      cuit: '30-87654321-0', address: 'Av. Industrial 2500', city: 'Avellaneda', province: 'Buenos Aires',
      phone: '+54 11 4201-3000', email: 'comercial@hierrosdelsur.com.ar',
      contactName: 'Ana Rodríguez', contactPhone: '+54 11 5201-3001', contactEmail: 'ana.rodriguez@hierrosdelsur.com.ar',
      paymentTerms: '15 días', bankName: 'Banco Galicia', cbu: '0070012340005678901234', alias: 'HIERROS.SUR',
      rating: 4, notes: 'Especialistas en hierros. Buen precio en volumen.', organizationId: org.id,
    },
  });
  const supElectrica = await prisma.supplier.create({
    data: {
      code: 'PROV-00003', name: 'Eléctrica Norte', tradeName: 'Eléctrica Norte S.A.',
      cuit: '30-76543210-9', address: 'Calle San Martín 450', city: 'San Isidro', province: 'Buenos Aires',
      phone: '+54 11 4732-9900', email: 'pedidos@electricanorte.com.ar',
      contactName: 'Martín López', contactPhone: '+54 11 4732-9901',
      paymentTerms: '7 días', rating: 4, organizationId: org.id,
    },
  });
  const supSanitarios = await prisma.supplier.create({
    data: {
      code: 'PROV-00004', name: 'Sanitarios Buenos Aires', tradeName: 'Sanitarios BA S.R.L.',
      cuit: '30-65432109-8', address: 'Av. Crovara 1800', city: 'La Matanza', province: 'Buenos Aires',
      phone: '+54 11 4622-8800', email: 'info@sanitariosba.com.ar',
      contactName: 'Lucía Romero', paymentTerms: '30 días',
      rating: 3, notes: 'Buen stock en cañerías y accesorios.', organizationId: org.id,
    },
  });
  const supHormigon = await prisma.supplier.create({
    data: {
      code: 'PROV-00005', name: 'Hormigón Listo del Plata', tradeName: 'HL del Plata S.A.',
      cuit: '30-54321098-7', address: 'Acceso Norte Km 32', city: 'Pacheco', province: 'Buenos Aires',
      phone: '+54 11 4740-2200', email: 'pedidos@hldelplata.com.ar',
      contactName: 'Raúl Domínguez', paymentTerms: 'Contado contra entrega',
      rating: 5, notes: 'Excelente calidad de hormigón. Puntualidad en entregas con mixer.', organizationId: org.id,
    },
  });
  const supPintura = await prisma.supplier.create({
    data: {
      code: 'PROV-00006', name: 'Pinturerías del Centro', tradeName: 'Pinturerías del Centro S.R.L.',
      cuit: '30-43210987-6', address: 'Av. Rivadavia 5200', city: 'Buenos Aires', province: 'Ciudad Autónoma de Buenos Aires',
      phone: '+54 11 4901-5500', email: 'ventas@pinturerias.com.ar',
      contactName: 'Gabriela Sosa', paymentTerms: '15 días',
      rating: 4, organizationId: org.id,
    },
  });
  console.log('   ✅ 6 suppliers created');

  // ============================================
  // SUPPLIER-MATERIAL RELATIONS
  // ============================================
  console.log('🔗 Linking suppliers to materials...');
  await prisma.supplierMaterial.createMany({
    data: [
      { supplierId: supCorralon.id, materialId: materials[0].id, unitPrice: 8900, leadTimeDays: 1, isPreferred: true },   // Cemento
      { supplierId: supCorralon.id, materialId: materials[1].id, unitPrice: 48000, leadTimeDays: 2, isPreferred: true },  // Arena
      { supplierId: supCorralon.id, materialId: materials[2].id, unitPrice: 52000, leadTimeDays: 2, isPreferred: true },  // Piedra
      { supplierId: supCorralon.id, materialId: materials[4].id, unitPrice: 4200, leadTimeDays: 1, isPreferred: true },   // Cal
      { supplierId: supCorralon.id, materialId: materials[5].id, unitPrice: 195, leadTimeDays: 1, isPreferred: true },    // Ladrillo 12
      { supplierId: supCorralon.id, materialId: materials[6].id, unitPrice: 280, leadTimeDays: 1, isPreferred: true },    // Ladrillo 18
      { supplierId: supCorralon.id, materialId: materials[7].id, unitPrice: 450, leadTimeDays: 2 },                       // Bloque H°
      { supplierId: supHierros.id, materialId: materials[8].id, unitPrice: 7800, leadTimeDays: 3, isPreferred: true },    // Hierro 6
      { supplierId: supHierros.id, materialId: materials[9].id, unitPrice: 12500, leadTimeDays: 3, isPreferred: true },   // Hierro 8
      { supplierId: supHierros.id, materialId: materials[10].id, unitPrice: 18500, leadTimeDays: 3, isPreferred: true },  // Hierro 10
      { supplierId: supHierros.id, materialId: materials[11].id, unitPrice: 26000, leadTimeDays: 3, isPreferred: true },  // Hierro 12
      { supplierId: supHierros.id, materialId: materials[12].id, unitPrice: 42000, leadTimeDays: 5, isPreferred: true },  // Malla
      { supplierId: supHierros.id, materialId: materials[13].id, unitPrice: 3500, leadTimeDays: 1 },                      // Alambre
      { supplierId: supElectrica.id, materialId: materials[14].id, unitPrice: 38000, leadTimeDays: 2, isPreferred: true },// Cable 2.5
      { supplierId: supElectrica.id, materialId: materials[15].id, unitPrice: 55000, leadTimeDays: 2, isPreferred: true },// Cable 4
      { supplierId: supElectrica.id, materialId: materials[16].id, unitPrice: 12000, leadTimeDays: 1, isPreferred: true },// Corrugado
      { supplierId: supElectrica.id, materialId: materials[17].id, unitPrice: 35000, leadTimeDays: 5, isPreferred: true },// Tablero
      { supplierId: supSanitarios.id, materialId: materials[18].id, unitPrice: 8500, leadTimeDays: 2, isPreferred: true },// PPF 20
      { supplierId: supSanitarios.id, materialId: materials[19].id, unitPrice: 22000, leadTimeDays: 2, isPreferred: true },// PVC 110
      { supplierId: supSanitarios.id, materialId: materials[20].id, unitPrice: 185000, leadTimeDays: 7, isPreferred: true },// Tanque
      { supplierId: supHormigon.id, materialId: materials[3].id, unitPrice: 165000, leadTimeDays: 1, isPreferred: true }, // H° Elaborado
      { supplierId: supPintura.id, materialId: materials[21].id, unitPrice: 95000, leadTimeDays: 1, isPreferred: true },  // Látex
      { supplierId: supPintura.id, materialId: materials[22].id, unitPrice: 115000, leadTimeDays: 2, isPreferred: true }, // Membrana líq
    ],
  });
  console.log('   ✅ 23 supplier-material links');

  // ============================================
  // EMPLOYEES (equipo completo de obra)
  // ============================================
  console.log('👷 Creating employees...');
  const empCapataz = await prisma.employee.create({
    data: {
      legajo: 'EMP-00001', firstName: 'Fernando', lastName: 'Ruiz',
      dni: '27890123', cuil: '20-27890123-7', gender: 'M',
      phone: '+54 11 6123-4567', address: 'Calle Mitre 890', city: 'San Miguel', province: 'Buenos Aires',
      birthDate: new Date('1978-05-12'), hireDate: new Date('2018-02-01'),
      position: 'Capataz General', department: 'Obra', specialty: 'Dirección de Obra',
      employmentType: 'PERMANENT', baseSalary: 850000, hourlyRate: 4200,
      emergencyContact: 'Silvia Ruiz', emergencyPhone: '+54 11 6123-4568',
      organizationId: org.id,
    },
  });
  const empAlbanil1 = await prisma.employee.create({
    data: {
      legajo: 'EMP-00002', firstName: 'Ricardo', lastName: 'Fernández',
      dni: '25678901', cuil: '20-25678901-5', gender: 'M',
      phone: '+54 11 6789-0123', address: 'Av. Libertador 1200', city: 'Pilar', province: 'Buenos Aires',
      birthDate: new Date('1975-09-23'), hireDate: new Date('2020-03-15'),
      position: 'Oficial Albañil', department: 'Obra', specialty: 'Albañilería',
      employmentType: 'PERMANENT', baseSalary: 680000, hourlyRate: 3200,
      emergencyContact: 'María Fernández', emergencyPhone: '+54 11 6789-0124',
      organizationId: org.id,
    },
  });
  const empAlbanil2 = await prisma.employee.create({
    data: {
      legajo: 'EMP-00003', firstName: 'Héctor', lastName: 'Domínguez',
      dni: '29345678', cuil: '20-29345678-3', gender: 'M',
      phone: '+54 11 7234-5678', address: 'Calle Belgrano 456', city: 'Merlo', province: 'Buenos Aires',
      birthDate: new Date('1982-03-18'), hireDate: new Date('2021-06-10'),
      position: 'Oficial Albañil', department: 'Obra', specialty: 'Albañilería',
      employmentType: 'PERMANENT', baseSalary: 650000, hourlyRate: 3000,
      organizationId: org.id,
    },
  });
  const empElectricista = await prisma.employee.create({
    data: {
      legajo: 'EMP-00004', firstName: 'Miguel', lastName: 'Torres',
      dni: '28901234', cuil: '20-28901234-8', gender: 'M',
      phone: '+54 11 7890-1234', address: 'Pasaje Colón 120', city: 'Moreno', province: 'Buenos Aires',
      birthDate: new Date('1980-11-05'), hireDate: new Date('2019-06-01'),
      position: 'Electricista Matriculado', department: 'Instalaciones', specialty: 'Electricidad',
      employmentType: 'PERMANENT', baseSalary: 720000, hourlyRate: 3500,
      emergencyContact: 'Rosa Torres', emergencyPhone: '+54 11 7890-1235',
      organizationId: org.id,
    },
  });
  const empPlomero = await prisma.employee.create({
    data: {
      legajo: 'EMP-00005', firstName: 'Sebastián', lastName: 'Gómez',
      dni: '30456789', cuil: '20-30456789-4', gender: 'M',
      phone: '+54 11 9012-3456', address: 'Av. San Martín 2300', city: 'Caseros', province: 'Buenos Aires',
      birthDate: new Date('1985-07-28'), hireDate: new Date('2022-08-20'),
      position: 'Plomero', department: 'Instalaciones', specialty: 'Plomería',
      employmentType: 'CONTRACTOR', hourlyRate: 3800,
      organizationId: org.id,
    },
  });
  const empAyudante1 = await prisma.employee.create({
    data: {
      legajo: 'EMP-00006', firstName: 'Diego', lastName: 'Sánchez',
      dni: '32123456', cuil: '20-32123456-1', gender: 'M',
      phone: '+54 11 8901-2345', address: 'Calle Sarmiento 780', city: 'Morón', province: 'Buenos Aires',
      birthDate: new Date('1992-01-14'), hireDate: new Date('2024-01-10'),
      position: 'Medio Oficial', department: 'Obra', specialty: 'Albañilería',
      employmentType: 'PERMANENT', baseSalary: 520000, hourlyRate: 2500,
      organizationId: org.id,
    },
  });
  const empAyudante2 = await prisma.employee.create({
    data: {
      legajo: 'EMP-00007', firstName: 'Luciano', lastName: 'Acosta',
      dni: '35678901', cuil: '20-35678901-2', gender: 'M',
      phone: '+54 11 3456-7890', address: 'Calle Rivadavia 3400', city: 'Hurlingham', province: 'Buenos Aires',
      birthDate: new Date('1996-08-22'), hireDate: new Date('2024-03-01'),
      position: 'Ayudante', department: 'Obra', specialty: 'General',
      employmentType: 'TEMPORARY', hourlyRate: 1800,
      organizationId: org.id,
    },
  });
  const empPintor = await prisma.employee.create({
    data: {
      legajo: 'EMP-00008', firstName: 'Ramón', lastName: 'Pereyra',
      dni: '26789012', cuil: '20-26789012-6', gender: 'M',
      phone: '+54 11 5678-1234', address: 'Calle Corrientes 560', city: 'Ituzaingó', province: 'Buenos Aires',
      birthDate: new Date('1977-12-30'), hireDate: new Date('2023-04-15'),
      position: 'Pintor Oficial', department: 'Terminaciones', specialty: 'Pintura',
      employmentType: 'CONTRACTOR', hourlyRate: 3000,
      organizationId: org.id,
    },
  });
  const allEmployees = [empCapataz, empAlbanil1, empAlbanil2, empElectricista, empPlomero, empAyudante1, empAyudante2, empPintor];
  console.log(`   ✅ ${allEmployees.length} employees created`);

  // ============================================
  // PROJECT 1: Casa en Nordelta (IN_PROGRESS - 65%)
  // El proyecto estrella para la demo
  // ============================================
  console.log('🏗️ Creating Project 1: Casa Familia Rodríguez...');
  const project1 = await prisma.project.create({
    data: {
      code: 'OBR-2024-00001',
      name: 'Casa Familia Rodríguez - Nordelta',
      description: 'Construcción de vivienda unifamiliar de 220m² en dos plantas con garage doble, jardín perimetral y pileta de natación. Estilo moderno con terminaciones premium. Barrio Los Castores, Nordelta.',
      address: 'Lote 45, Barrio Los Castores',
      city: 'Nordelta - Tigre',
      province: 'Buenos Aires',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-06-01'),
      estimatedEndDate: new Date('2025-04-30'),
      estimatedBudget: 125000000,
      currentSpent: 81250000,
      progress: 65,
      organizationId: org.id,
      managerId: pmMaria.id,
    },
  });

  // ---- STAGES for Project 1 ----
  const p1Stage1 = await prisma.stage.create({
    data: {
      name: 'Trabajos Preliminares', description: 'Limpieza de terreno, nivelación, cerco perimetral, obrador y conexiones provisorias de agua y electricidad.',
      order: 1, plannedStartDate: new Date('2024-06-01'), plannedEndDate: new Date('2024-06-15'),
      actualStartDate: new Date('2024-06-01'), actualEndDate: new Date('2024-06-12'), progress: 100, projectId: project1.id,
    },
  });
  const p1Stage2 = await prisma.stage.create({
    data: {
      name: 'Fundaciones', description: 'Excavación de bases y vigas de fundación, armado de hierros, encofrado y hormigonado. Impermeabilización de cimientos.',
      order: 2, plannedStartDate: new Date('2024-06-16'), plannedEndDate: new Date('2024-07-15'),
      actualStartDate: new Date('2024-06-13'), actualEndDate: new Date('2024-07-10'), progress: 100, projectId: project1.id,
    },
  });
  const p1Stage3 = await prisma.stage.create({
    data: {
      name: 'Estructura de Hormigón', description: 'Columnas, vigas, losas de planta baja y planta alta. Escalera de hormigón.',
      order: 3, plannedStartDate: new Date('2024-07-16'), plannedEndDate: new Date('2024-09-15'),
      actualStartDate: new Date('2024-07-11'), actualEndDate: new Date('2024-09-08'), progress: 100, projectId: project1.id,
    },
  });
  const p1Stage4 = await prisma.stage.create({
    data: {
      name: 'Mampostería', description: 'Levantamiento de paredes exteriores (ladrillo hueco 18cm) e interiores (ladrillo hueco 12cm). Dinteles y antepechos.',
      order: 4, plannedStartDate: new Date('2024-09-16'), plannedEndDate: new Date('2024-10-31'),
      actualStartDate: new Date('2024-09-10'), actualEndDate: new Date('2024-10-25'), progress: 100, projectId: project1.id,
    },
  });
  const p1Stage5 = await prisma.stage.create({
    data: {
      name: 'Instalación Eléctrica', description: 'Cañerías embutidas, cableado, tableros, bocas de luz, tomas e interruptores. Sistema de portero eléctrico.',
      order: 5, plannedStartDate: new Date('2024-11-01'), plannedEndDate: new Date('2024-11-30'),
      actualStartDate: new Date('2024-10-28'), progress: 85, projectId: project1.id,
    },
  });
  const p1Stage6 = await prisma.stage.create({
    data: {
      name: 'Instalación Sanitaria', description: 'Agua fría y caliente, desagües cloacales y pluviales, instalación de gas. Conexión a red.',
      order: 6, plannedStartDate: new Date('2024-11-15'), plannedEndDate: new Date('2024-12-15'),
      actualStartDate: new Date('2024-11-12'), progress: 70, projectId: project1.id,
    },
  });
  const p1Stage7 = await prisma.stage.create({
    data: {
      name: 'Techos y Aislaciones', description: 'Cubierta de techo, membrana asfáltica, aislación térmica, canaletas y bajadas pluviales.',
      order: 7, plannedStartDate: new Date('2024-12-16'), plannedEndDate: new Date('2025-01-15'),
      actualStartDate: new Date('2024-12-20'), progress: 40, projectId: project1.id,
    },
  });
  const p1Stage8 = await prisma.stage.create({
    data: {
      name: 'Revoques y Contrapisos', description: 'Revoques gruesos y finos interiores y exteriores. Contrapisos en todas las plantas.',
      order: 8, plannedStartDate: new Date('2025-01-16'), plannedEndDate: new Date('2025-02-28'),
      progress: 10, projectId: project1.id,
    },
  });
  const p1Stage9 = await prisma.stage.create({
    data: {
      name: 'Pisos y Revestimientos', description: 'Colocación de cerámicos, porcelanatos, pisos de madera. Revestimientos de baños y cocina.',
      order: 9, plannedStartDate: new Date('2025-02-15'), plannedEndDate: new Date('2025-03-15'),
      progress: 0, projectId: project1.id,
    },
  });
  const p1Stage10 = await prisma.stage.create({
    data: {
      name: 'Pintura y Terminaciones', description: 'Pintura interior y exterior, colocación de carpinterías, grifería, artefactos sanitarios y detalles finales.',
      order: 10, plannedStartDate: new Date('2025-03-01'), plannedEndDate: new Date('2025-04-15'),
      progress: 0, projectId: project1.id,
    },
  });
  const p1Stage11 = await prisma.stage.create({
    data: {
      name: 'Exterior y Pileta', description: 'Construcción de pileta, solarium, parquización, vereda perimetral y portón de garage.',
      order: 11, plannedStartDate: new Date('2025-03-15'), plannedEndDate: new Date('2025-04-30'),
      progress: 0, projectId: project1.id,
    },
  });

  // ---- TASKS for Stage 1 (Preliminares - 100%) ----
  const t1_1 = await prisma.task.create({ data: { name: 'Limpieza y nivelación del terreno', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-06-01'), plannedEndDate: new Date('2024-06-03'), actualStartDate: new Date('2024-06-01'), actualEndDate: new Date('2024-06-02'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p1Stage1.id } });
  const t1_2 = await prisma.task.create({ data: { name: 'Cerco perimetral de obra', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-06-03'), plannedEndDate: new Date('2024-06-05'), actualStartDate: new Date('2024-06-03'), actualEndDate: new Date('2024-06-05'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p1Stage1.id } });
  const t1_3 = await prisma.task.create({ data: { name: 'Montaje de obrador', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-06-05'), plannedEndDate: new Date('2024-06-07'), actualStartDate: new Date('2024-06-05'), actualEndDate: new Date('2024-06-06'), estimatedHours: 16, actualHours: 12, progress: 100, stageId: p1Stage1.id } });
  const t1_4 = await prisma.task.create({ data: { name: 'Conexiones provisorias (agua y luz)', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-06-07'), plannedEndDate: new Date('2024-06-12'), actualStartDate: new Date('2024-06-06'), actualEndDate: new Date('2024-06-10'), estimatedHours: 20, actualHours: 18, progress: 100, stageId: p1Stage1.id } });
  const t1_5 = await prisma.task.create({ data: { name: 'Replanteo de obra', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2024-06-10'), plannedEndDate: new Date('2024-06-12'), actualStartDate: new Date('2024-06-10'), actualEndDate: new Date('2024-06-12'), estimatedHours: 12, actualHours: 10, progress: 100, stageId: p1Stage1.id } });

  // ---- TASKS for Stage 3 (Estructura - 100%) ----
  const t3_1 = await prisma.task.create({ data: { name: 'Armado de columnas PB (8 columnas)', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-07-11'), plannedEndDate: new Date('2024-07-18'), actualStartDate: new Date('2024-07-11'), actualEndDate: new Date('2024-07-17'), estimatedHours: 48, actualHours: 44, progress: 100, stageId: p1Stage3.id } });
  const t3_2 = await prisma.task.create({ data: { name: 'Hormigonado de columnas PB', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-07-19'), plannedEndDate: new Date('2024-07-22'), actualStartDate: new Date('2024-07-18'), actualEndDate: new Date('2024-07-21'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p1Stage3.id } });
  const t3_3 = await prisma.task.create({ data: { name: 'Encofrado losa PB', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-07-25'), plannedEndDate: new Date('2024-08-05'), actualStartDate: new Date('2024-07-23'), actualEndDate: new Date('2024-08-03'), estimatedHours: 64, actualHours: 60, progress: 100, stageId: p1Stage3.id } });
  const t3_4 = await prisma.task.create({ data: { name: 'Armado hierros losa PB + malla', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-08-06'), plannedEndDate: new Date('2024-08-13'), actualStartDate: new Date('2024-08-04'), actualEndDate: new Date('2024-08-12'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p1Stage3.id } });
  const t3_5 = await prisma.task.create({ data: { name: 'Hormigonado losa PB (22m³)', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2024-08-14'), plannedEndDate: new Date('2024-08-15'), actualStartDate: new Date('2024-08-13'), actualEndDate: new Date('2024-08-13'), estimatedHours: 12, actualHours: 10, progress: 100, stageId: p1Stage3.id } });
  const t3_6 = await prisma.task.create({ data: { name: 'Armado y hormigonado escalera', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-08-16'), plannedEndDate: new Date('2024-08-23'), actualStartDate: new Date('2024-08-16'), actualEndDate: new Date('2024-08-22'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p1Stage3.id } });
  const t3_7 = await prisma.task.create({ data: { name: 'Columnas y vigas PA', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-08-24'), plannedEndDate: new Date('2024-09-02'), actualStartDate: new Date('2024-08-23'), actualEndDate: new Date('2024-09-01'), estimatedHours: 56, actualHours: 52, progress: 100, stageId: p1Stage3.id } });
  const t3_8 = await prisma.task.create({ data: { name: 'Losa PA + curado', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-09-03'), plannedEndDate: new Date('2024-09-08'), actualStartDate: new Date('2024-09-02'), actualEndDate: new Date('2024-09-08'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p1Stage3.id } });

  // ---- TASKS for Stage 5 (Eléctrica - 85%) ----
  const t5_1 = await prisma.task.create({ data: { name: 'Cañerías embutidas PB', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-10-28'), plannedEndDate: new Date('2024-11-04'), actualStartDate: new Date('2024-10-28'), actualEndDate: new Date('2024-11-03'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p1Stage5.id } });
  const t5_2 = await prisma.task.create({ data: { name: 'Cañerías embutidas PA', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-05'), plannedEndDate: new Date('2024-11-11'), actualStartDate: new Date('2024-11-04'), actualEndDate: new Date('2024-11-10'), estimatedHours: 36, actualHours: 34, progress: 100, stageId: p1Stage5.id } });
  const t5_3 = await prisma.task.create({ data: { name: 'Cableado general', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-12'), plannedEndDate: new Date('2024-11-22'), actualStartDate: new Date('2024-11-11'), estimatedHours: 56, actualHours: 42, progress: 75, stageId: p1Stage5.id } });
  const t5_4 = await prisma.task.create({ data: { name: 'Montaje tableros eléctricos', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-11-23'), plannedEndDate: new Date('2024-11-27'), estimatedHours: 24, progress: 0, stageId: p1Stage5.id } });
  const t5_5 = await prisma.task.create({ data: { name: 'Colocación bocas de luz y tomas', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-11-25'), plannedEndDate: new Date('2024-11-30'), estimatedHours: 32, progress: 0, stageId: p1Stage5.id } });

  // ---- TASKS for Stage 6 (Sanitaria - 70%) ----
  const t6_1 = await prisma.task.create({ data: { name: 'Instalación agua fría y caliente PB', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-12'), plannedEndDate: new Date('2024-11-19'), actualStartDate: new Date('2024-11-12'), actualEndDate: new Date('2024-11-18'), estimatedHours: 40, actualHours: 36, progress: 100, stageId: p1Stage6.id } });
  const t6_2 = await prisma.task.create({ data: { name: 'Desagües cloacales PB', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-18'), plannedEndDate: new Date('2024-11-25'), actualStartDate: new Date('2024-11-18'), actualEndDate: new Date('2024-11-24'), estimatedHours: 36, actualHours: 32, progress: 100, stageId: p1Stage6.id } });
  const t6_3 = await prisma.task.create({ data: { name: 'Instalaciones sanitarias PA', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-26'), plannedEndDate: new Date('2024-12-05'), actualStartDate: new Date('2024-11-25'), estimatedHours: 48, actualHours: 28, progress: 55, stageId: p1Stage6.id } });
  const t6_4 = await prisma.task.create({ data: { name: 'Bajadas pluviales', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-12-06'), plannedEndDate: new Date('2024-12-10'), estimatedHours: 24, progress: 0, stageId: p1Stage6.id } });
  const t6_5 = await prisma.task.create({ data: { name: 'Prueba hidráulica y conexión a red', status: TaskStatus.PENDING, priority: TaskPriority.URGENT, plannedStartDate: new Date('2024-12-11'), plannedEndDate: new Date('2024-12-15'), estimatedHours: 20, progress: 0, stageId: p1Stage6.id } });

  // ---- TASKS for Stage 7 (Techos - 40%) ----
  const t7_1 = await prisma.task.create({ data: { name: 'Estructura de techo (tirantería)', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-12-20'), plannedEndDate: new Date('2024-12-28'), actualStartDate: new Date('2024-12-20'), actualEndDate: new Date('2024-12-27'), estimatedHours: 48, actualHours: 44, progress: 100, stageId: p1Stage7.id } });
  const t7_2 = await prisma.task.create({ data: { name: 'Colocación de membrana asfáltica', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-01-02'), plannedEndDate: new Date('2025-01-07'), actualStartDate: new Date('2025-01-02'), estimatedHours: 32, actualHours: 16, progress: 50, stageId: p1Stage7.id } });
  const t7_3 = await prisma.task.create({ data: { name: 'Aislación térmica techo', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-08'), plannedEndDate: new Date('2025-01-12'), estimatedHours: 24, progress: 0, stageId: p1Stage7.id } });
  const t7_4 = await prisma.task.create({ data: { name: 'Canaletas y bajadas pluviales', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-13'), plannedEndDate: new Date('2025-01-15'), estimatedHours: 16, progress: 0, stageId: p1Stage7.id } });

  // ---- TASKS for Stage 8 (Revoques - 10%) ----
  const t8_1 = await prisma.task.create({ data: { name: 'Revoque grueso exterior', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-01-16'), plannedEndDate: new Date('2025-01-30'), actualStartDate: new Date('2025-01-20'), estimatedHours: 80, actualHours: 16, progress: 20, stageId: p1Stage8.id } });
  const t8_2 = await prisma.task.create({ data: { name: 'Revoque grueso interior PB', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-25'), plannedEndDate: new Date('2025-02-07'), estimatedHours: 64, progress: 0, stageId: p1Stage8.id } });
  const t8_3 = await prisma.task.create({ data: { name: 'Revoque grueso interior PA', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-02-08'), plannedEndDate: new Date('2025-02-18'), estimatedHours: 56, progress: 0, stageId: p1Stage8.id } });
  const t8_4 = await prisma.task.create({ data: { name: 'Contrapisos PB y PA', status: TaskStatus.PENDING, priority: TaskPriority.HIGH, plannedStartDate: new Date('2025-02-10'), plannedEndDate: new Date('2025-02-20'), estimatedHours: 48, progress: 0, stageId: p1Stage8.id } });
  const t8_5 = await prisma.task.create({ data: { name: 'Revoque fino (enlucido)', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2025-02-20'), plannedEndDate: new Date('2025-02-28'), estimatedHours: 60, progress: 0, stageId: p1Stage8.id } });

  // ---- TASK DEPENDENCIES (Gantt) ----
  console.log('🔗 Creating task dependencies...');
  await prisma.taskDependency.createMany({
    data: [
      // Preliminares: secuencia
      { taskId: t1_2.id, dependsOnId: t1_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t1_3.id, dependsOnId: t1_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t1_4.id, dependsOnId: t1_3.id, dependencyType: DependencyType.SS, lagDays: 1 },
      { taskId: t1_5.id, dependsOnId: t1_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      // Estructura: cadena de dependencias
      { taskId: t3_2.id, dependsOnId: t3_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t3_3.id, dependsOnId: t3_2.id, dependencyType: DependencyType.FS, lagDays: 2 },
      { taskId: t3_4.id, dependsOnId: t3_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t3_5.id, dependsOnId: t3_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t3_6.id, dependsOnId: t3_5.id, dependencyType: DependencyType.FS, lagDays: 1 },
      { taskId: t3_7.id, dependsOnId: t3_6.id, dependencyType: DependencyType.SS, lagDays: 2 },
      { taskId: t3_8.id, dependsOnId: t3_7.id, dependencyType: DependencyType.FS, lagDays: 0 },
      // Eléctrica
      { taskId: t5_2.id, dependsOnId: t5_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t5_3.id, dependsOnId: t5_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t5_4.id, dependsOnId: t5_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t5_5.id, dependsOnId: t5_3.id, dependencyType: DependencyType.SS, lagDays: 3 },
      // Sanitaria
      { taskId: t6_2.id, dependsOnId: t6_1.id, dependencyType: DependencyType.SS, lagDays: 3 },
      { taskId: t6_3.id, dependsOnId: t6_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t6_4.id, dependsOnId: t6_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t6_5.id, dependsOnId: t6_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      // Techos
      { taskId: t7_2.id, dependsOnId: t7_1.id, dependencyType: DependencyType.FS, lagDays: 3 },
      { taskId: t7_3.id, dependsOnId: t7_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t7_4.id, dependsOnId: t7_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      // Revoques
      { taskId: t8_2.id, dependsOnId: t8_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t8_3.id, dependsOnId: t8_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t8_4.id, dependsOnId: t8_2.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t8_5.id, dependsOnId: t8_3.id, dependencyType: DependencyType.FS, lagDays: 1 },
    ],
  });
  console.log('   ✅ 26 task dependencies (Gantt links)');

  // ---- TASK ASSIGNMENTS ----
  console.log('👤 Assigning employees & users to tasks...');
  await prisma.taskAssignment.createMany({
    data: [
      { taskId: t3_1.id, employeeId: empAlbanil1.id },
      { taskId: t3_1.id, employeeId: empAyudante1.id },
      { taskId: t3_4.id, employeeId: empAlbanil1.id },
      { taskId: t3_4.id, employeeId: empAlbanil2.id },
      { taskId: t3_5.id, employeeId: empCapataz.id },
      { taskId: t5_1.id, employeeId: empElectricista.id },
      { taskId: t5_2.id, employeeId: empElectricista.id },
      { taskId: t5_3.id, employeeId: empElectricista.id },
      { taskId: t6_1.id, employeeId: empPlomero.id },
      { taskId: t6_2.id, employeeId: empPlomero.id },
      { taskId: t6_3.id, employeeId: empPlomero.id },
      { taskId: t7_1.id, employeeId: empAlbanil1.id },
      { taskId: t7_2.id, employeeId: empAlbanil2.id },
      { taskId: t8_1.id, employeeId: empAlbanil1.id },
      { taskId: t8_1.id, employeeId: empAyudante2.id },
      { taskId: t5_3.id, userId: supervisor.id },
      { taskId: t7_2.id, userId: supervisor.id },
    ],
  });

  // ---- EMPLOYEE-PROJECT ASSIGNMENTS ----
  await prisma.employeeProjectAssignment.createMany({
    data: [
      { employeeId: empCapataz.id, projectId: project1.id, role: 'Capataz General', startDate: new Date('2024-06-01') },
      { employeeId: empAlbanil1.id, projectId: project1.id, role: 'Oficial Albañil', startDate: new Date('2024-06-01') },
      { employeeId: empAlbanil2.id, projectId: project1.id, role: 'Oficial Albañil', startDate: new Date('2024-07-01') },
      { employeeId: empElectricista.id, projectId: project1.id, role: 'Electricista', startDate: new Date('2024-10-28') },
      { employeeId: empPlomero.id, projectId: project1.id, role: 'Plomero', startDate: new Date('2024-11-12') },
      { employeeId: empAyudante1.id, projectId: project1.id, role: 'Medio Oficial', startDate: new Date('2024-06-01') },
      { employeeId: empAyudante2.id, projectId: project1.id, role: 'Ayudante', startDate: new Date('2024-07-15') },
    ],
  });
  console.log('   ✅ Task & project assignments created');

  // ============================================
  // PROJECT 2: Edificio (IN_PROGRESS - 28%)
  // ============================================
  console.log('🏗️ Creating Project 2: Edificio Mirador del Parque...');
  const project2 = await prisma.project.create({
    data: {
      code: 'OBR-2024-00002',
      name: 'Edificio Mirador del Parque',
      description: 'Edificio residencial de 8 pisos con 16 departamentos (2 por piso), 2 subsuelos de cocheras, SUM, terraza con parrilla y lavadero. Estructura de hormigón armado, fachada con curtain wall parcial.',
      address: 'Av. del Libertador 8900',
      city: 'Vicente López',
      province: 'Buenos Aires',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2024-03-01'),
      estimatedEndDate: new Date('2026-03-31'),
      estimatedBudget: 580000000,
      currentSpent: 162400000,
      progress: 28,
      organizationId: org.id,
      managerId: pmAndres.id,
    },
  });

  // Stages for Project 2 (simplified)
  const p2Stage1 = await prisma.stage.create({ data: { name: 'Demolición y Excavación', order: 1, plannedStartDate: new Date('2024-03-01'), plannedEndDate: new Date('2024-05-15'), actualStartDate: new Date('2024-03-01'), actualEndDate: new Date('2024-05-10'), progress: 100, projectId: project2.id } });
  const p2Stage2 = await prisma.stage.create({ data: { name: 'Subsuelos y Fundaciones', order: 2, plannedStartDate: new Date('2024-05-16'), plannedEndDate: new Date('2024-08-31'), actualStartDate: new Date('2024-05-12'), actualEndDate: new Date('2024-08-20'), progress: 100, projectId: project2.id } });
  const p2Stage3 = await prisma.stage.create({ data: { name: 'Estructura Pisos 1-4', order: 3, plannedStartDate: new Date('2024-09-01'), plannedEndDate: new Date('2024-12-31'), actualStartDate: new Date('2024-08-25'), progress: 60, projectId: project2.id } });
  const p2Stage4 = await prisma.stage.create({ data: { name: 'Estructura Pisos 5-8', order: 4, plannedStartDate: new Date('2025-01-01'), plannedEndDate: new Date('2025-04-30'), progress: 0, projectId: project2.id } });
  const p2Stage5 = await prisma.stage.create({ data: { name: 'Mampostería e Instalaciones', order: 5, plannedStartDate: new Date('2025-03-01'), plannedEndDate: new Date('2025-09-30'), progress: 0, projectId: project2.id } });
  const p2Stage6 = await prisma.stage.create({ data: { name: 'Terminaciones y Espacios Comunes', order: 6, plannedStartDate: new Date('2025-08-01'), plannedEndDate: new Date('2026-02-28'), progress: 0, projectId: project2.id } });
  const p2Stage7 = await prisma.stage.create({ data: { name: 'Habilitación y Entrega', order: 7, plannedStartDate: new Date('2026-02-01'), plannedEndDate: new Date('2026-03-31'), progress: 0, projectId: project2.id } });

  // Some tasks for Project 2
  await prisma.task.createMany({
    data: [
      { name: 'Encofrado y hormigonado Piso 1', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-09-01'), plannedEndDate: new Date('2024-09-20'), actualStartDate: new Date('2024-08-28'), actualEndDate: new Date('2024-09-18'), estimatedHours: 120, actualHours: 115, progress: 100, stageId: p2Stage3.id },
      { name: 'Encofrado y hormigonado Piso 2', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-09-21'), plannedEndDate: new Date('2024-10-10'), actualStartDate: new Date('2024-09-20'), actualEndDate: new Date('2024-10-08'), estimatedHours: 120, actualHours: 110, progress: 100, stageId: p2Stage3.id },
      { name: 'Encofrado y hormigonado Piso 3', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-10-11'), plannedEndDate: new Date('2024-10-30'), actualStartDate: new Date('2024-10-10'), estimatedHours: 120, actualHours: 80, progress: 65, stageId: p2Stage3.id },
      { name: 'Encofrado y hormigonado Piso 4', status: TaskStatus.PENDING, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-11-01'), plannedEndDate: new Date('2024-11-20'), estimatedHours: 120, progress: 0, stageId: p2Stage3.id },
    ],
  });

  await prisma.employeeProjectAssignment.createMany({
    data: [
      { employeeId: empCapataz.id, projectId: project2.id, role: 'Supervisión', startDate: new Date('2024-03-01') },
      { employeeId: empAlbanil2.id, projectId: project2.id, role: 'Oficial Albañil', startDate: new Date('2024-09-01') },
    ],
  });

  // ============================================
  // PROJECT 3: Remodelación (PLANNING)
  // ============================================
  console.log('🏗️ Creating Project 3: Remodelación Local Comercial...');
  const project3 = await prisma.project.create({
    data: {
      code: 'OBR-2025-00001',
      name: 'Remodelación Local Comercial - Florida',
      description: 'Remodelación integral de local comercial de 150m² en Calle Florida para marca de indumentaria. Incluye demolición parcial, nueva distribución, instalaciones completas, piso técnico y fachada vidriada.',
      address: 'Calle Florida 875, Local 3',
      city: 'Buenos Aires',
      province: 'Ciudad Autónoma de Buenos Aires',
      status: ProjectStatus.PLANNING,
      startDate: new Date('2025-04-01'),
      estimatedEndDate: new Date('2025-07-31'),
      estimatedBudget: 35000000,
      currentSpent: 0,
      progress: 0,
      organizationId: org.id,
      managerId: pmMaria.id,
    },
  });

  // ============================================
  // PROJECT 4: Completed
  // ============================================
  console.log('🏗️ Creating Project 4: Duplex Finalizado...');
  const project4 = await prisma.project.create({
    data: {
      code: 'OBR-2023-00001',
      name: 'Duplex Familia López - Escobar',
      description: 'Construcción de duplex de 140m² en barrio cerrado. Proyecto entregado y finalizado con éxito.',
      address: 'Calle de los Álamos 234, Barrio Santa Elena',
      city: 'Escobar',
      province: 'Buenos Aires',
      status: ProjectStatus.COMPLETED,
      startDate: new Date('2023-06-01'),
      estimatedEndDate: new Date('2024-03-31'),
      actualEndDate: new Date('2024-04-15'),
      estimatedBudget: 65000000,
      currentSpent: 68250000,
      progress: 100,
      organizationId: org.id,
      managerId: pmMaria.id,
    },
  });

  console.log('   ✅ 4 projects created');

  // ============================================
  // PROJECT 4: STAGES, TASKS & DATA (Duplex Completado)
  // ============================================
  console.log('📋 Creating stages & tasks for Duplex López (completed project)...');

  // ---- STAGES for Project 4 (all 100%) ----
  const p4Stage1 = await prisma.stage.create({
    data: {
      name: 'Trabajos Preliminares', description: 'Limpieza del terreno, cerco de obra, obrador provisorio y conexiones de agua/luz.',
      order: 1, plannedStartDate: new Date('2023-06-01'), plannedEndDate: new Date('2023-06-12'),
      actualStartDate: new Date('2023-06-01'), actualEndDate: new Date('2023-06-10'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage2 = await prisma.stage.create({
    data: {
      name: 'Fundaciones', description: 'Excavación de bases, armado de hierros, hormigonado de zapatas y vigas de fundación.',
      order: 2, plannedStartDate: new Date('2023-06-13'), plannedEndDate: new Date('2023-07-10'),
      actualStartDate: new Date('2023-06-12'), actualEndDate: new Date('2023-07-08'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage3 = await prisma.stage.create({
    data: {
      name: 'Estructura', description: 'Columnas, vigas, losa de entrepiso y escalera de hormigón armado.',
      order: 3, plannedStartDate: new Date('2023-07-11'), plannedEndDate: new Date('2023-09-05'),
      actualStartDate: new Date('2023-07-10'), actualEndDate: new Date('2023-09-10'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage4 = await prisma.stage.create({
    data: {
      name: 'Mampostería', description: 'Paredes exteriores en ladrillo hueco 18cm e interiores en ladrillo hueco 12cm. Dinteles prefabricados.',
      order: 4, plannedStartDate: new Date('2023-09-06'), plannedEndDate: new Date('2023-10-15'),
      actualStartDate: new Date('2023-09-11'), actualEndDate: new Date('2023-10-20'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage5 = await prisma.stage.create({
    data: {
      name: 'Instalaciones', description: 'Instalación eléctrica completa, sanitaria (agua fría/caliente, cloacal, pluvial) y gas.',
      order: 5, plannedStartDate: new Date('2023-10-16'), plannedEndDate: new Date('2023-11-30'),
      actualStartDate: new Date('2023-10-22'), actualEndDate: new Date('2023-12-05'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage6 = await prisma.stage.create({
    data: {
      name: 'Techos y Cubierta', description: 'Estructura de techo en tirantería de madera, cubierta de tejas, membrana e impermeabilización.',
      order: 6, plannedStartDate: new Date('2023-11-15'), plannedEndDate: new Date('2023-12-15'),
      actualStartDate: new Date('2023-11-20'), actualEndDate: new Date('2023-12-18'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage7 = await prisma.stage.create({
    data: {
      name: 'Revoques y Contrapisos', description: 'Revoques grueso y fino interior/exterior. Contrapisos en todas las plantas.',
      order: 7, plannedStartDate: new Date('2023-12-16'), plannedEndDate: new Date('2024-01-20'),
      actualStartDate: new Date('2023-12-20'), actualEndDate: new Date('2024-01-25'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage8 = await prisma.stage.create({
    data: {
      name: 'Pisos y Revestimientos', description: 'Porcelanato en living/cocina, cerámicos en baños, piso flotante en dormitorios. Revestimientos de baño.',
      order: 8, plannedStartDate: new Date('2024-01-21'), plannedEndDate: new Date('2024-02-15'),
      actualStartDate: new Date('2024-01-26'), actualEndDate: new Date('2024-02-20'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage9 = await prisma.stage.create({
    data: {
      name: 'Pintura y Terminaciones', description: 'Pintura interior/exterior, carpintería de aluminio, mesadas, grifería, artefactos sanitarios.',
      order: 9, plannedStartDate: new Date('2024-02-16'), plannedEndDate: new Date('2024-03-20'),
      actualStartDate: new Date('2024-02-21'), actualEndDate: new Date('2024-03-28'), progress: 100, projectId: project4.id,
    },
  });
  const p4Stage10 = await prisma.stage.create({
    data: {
      name: 'Exterior y Entrega', description: 'Vereda perimetral, parquización, portón, limpieza final y entrega al cliente.',
      order: 10, plannedStartDate: new Date('2024-03-21'), plannedEndDate: new Date('2024-03-31'),
      actualStartDate: new Date('2024-03-28'), actualEndDate: new Date('2024-04-15'), progress: 100, projectId: project4.id,
    },
  });

  // ---- TASKS for Project 4 (all COMPLETED) ----
  // Stage 1: Preliminares
  const t4_1_1 = await prisma.task.create({ data: { name: 'Limpieza y nivelación del terreno', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-06-01'), plannedEndDate: new Date('2023-06-03'), actualStartDate: new Date('2023-06-01'), actualEndDate: new Date('2023-06-02'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p4Stage1.id } });
  const t4_1_2 = await prisma.task.create({ data: { name: 'Cerco perimetral y cartel de obra', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-06-03'), plannedEndDate: new Date('2023-06-05'), actualStartDate: new Date('2023-06-03'), actualEndDate: new Date('2023-06-05'), estimatedHours: 16, actualHours: 16, progress: 100, stageId: p4Stage1.id } });
  const t4_1_3 = await prisma.task.create({ data: { name: 'Replanteo y obrador', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-06-06'), plannedEndDate: new Date('2023-06-10'), actualStartDate: new Date('2023-06-06'), actualEndDate: new Date('2023-06-10'), estimatedHours: 20, actualHours: 18, progress: 100, stageId: p4Stage1.id } });

  // Stage 2: Fundaciones
  const t4_2_1 = await prisma.task.create({ data: { name: 'Excavación de bases', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-06-13'), plannedEndDate: new Date('2023-06-16'), actualStartDate: new Date('2023-06-12'), actualEndDate: new Date('2023-06-15'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p4Stage2.id } });
  const t4_2_2 = await prisma.task.create({ data: { name: 'Armado de hierros y encofrado', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-06-19'), plannedEndDate: new Date('2023-06-28'), actualStartDate: new Date('2023-06-16'), actualEndDate: new Date('2023-06-28'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p4Stage2.id } });
  const t4_2_3 = await prisma.task.create({ data: { name: 'Hormigonado de fundaciones', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2023-06-29'), plannedEndDate: new Date('2023-07-03'), actualStartDate: new Date('2023-06-29'), actualEndDate: new Date('2023-07-01'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p4Stage2.id } });
  const t4_2_4 = await prisma.task.create({ data: { name: 'Impermeabilización de cimientos', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-07-04'), plannedEndDate: new Date('2023-07-08'), actualStartDate: new Date('2023-07-03'), actualEndDate: new Date('2023-07-08'), estimatedHours: 16, actualHours: 18, progress: 100, stageId: p4Stage2.id } });

  // Stage 3: Estructura
  const t4_3_1 = await prisma.task.create({ data: { name: 'Columnas planta baja', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-07-10'), plannedEndDate: new Date('2023-07-18'), actualStartDate: new Date('2023-07-10'), actualEndDate: new Date('2023-07-19'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage3.id } });
  const t4_3_2 = await prisma.task.create({ data: { name: 'Vigas y encofrado losa', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-07-19'), plannedEndDate: new Date('2023-08-04'), actualStartDate: new Date('2023-07-20'), actualEndDate: new Date('2023-08-08'), estimatedHours: 64, actualHours: 72, progress: 100, stageId: p4Stage3.id } });
  const t4_3_3 = await prisma.task.create({ data: { name: 'Hormigonado losa entrepiso (16m³)', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2023-08-07'), plannedEndDate: new Date('2023-08-08'), actualStartDate: new Date('2023-08-09'), actualEndDate: new Date('2023-08-09'), estimatedHours: 10, actualHours: 10, progress: 100, stageId: p4Stage3.id } });
  const t4_3_4 = await prisma.task.create({ data: { name: 'Escalera de hormigón', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-08-09'), plannedEndDate: new Date('2023-08-18'), actualStartDate: new Date('2023-08-14'), actualEndDate: new Date('2023-08-25'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage3.id } });
  const t4_3_5 = await prisma.task.create({ data: { name: 'Columnas y vigas planta alta', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-08-21'), plannedEndDate: new Date('2023-09-05'), actualStartDate: new Date('2023-08-28'), actualEndDate: new Date('2023-09-10'), estimatedHours: 56, actualHours: 60, progress: 100, stageId: p4Stage3.id } });

  // Stage 4: Mampostería
  const t4_4_1 = await prisma.task.create({ data: { name: 'Paredes exteriores PB', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-09-11'), plannedEndDate: new Date('2023-09-22'), actualStartDate: new Date('2023-09-11'), actualEndDate: new Date('2023-09-25'), estimatedHours: 48, actualHours: 52, progress: 100, stageId: p4Stage4.id } });
  const t4_4_2 = await prisma.task.create({ data: { name: 'Tabiques interiores PB', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-09-20'), plannedEndDate: new Date('2023-09-29'), actualStartDate: new Date('2023-09-22'), actualEndDate: new Date('2023-10-02'), estimatedHours: 36, actualHours: 38, progress: 100, stageId: p4Stage4.id } });
  const t4_4_3 = await prisma.task.create({ data: { name: 'Paredes exteriores e interiores PA', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-10-02'), plannedEndDate: new Date('2023-10-15'), actualStartDate: new Date('2023-10-03'), actualEndDate: new Date('2023-10-20'), estimatedHours: 56, actualHours: 62, progress: 100, stageId: p4Stage4.id } });

  // Stage 5: Instalaciones
  const t4_5_1 = await prisma.task.create({ data: { name: 'Cañerías eléctricas embutidas', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-10-22'), plannedEndDate: new Date('2023-11-03'), actualStartDate: new Date('2023-10-22'), actualEndDate: new Date('2023-11-02'), estimatedHours: 48, actualHours: 46, progress: 100, stageId: p4Stage5.id } });
  const t4_5_2 = await prisma.task.create({ data: { name: 'Cableado y tablero eléctrico', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-11-06'), plannedEndDate: new Date('2023-11-15'), actualStartDate: new Date('2023-11-03'), actualEndDate: new Date('2023-11-14'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p4Stage5.id } });
  const t4_5_3 = await prisma.task.create({ data: { name: 'Agua fría y caliente', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-10-25'), plannedEndDate: new Date('2023-11-08'), actualStartDate: new Date('2023-10-25'), actualEndDate: new Date('2023-11-10'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage5.id } });
  const t4_5_4 = await prisma.task.create({ data: { name: 'Desagües cloacales y pluviales', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-11-06'), plannedEndDate: new Date('2023-11-17'), actualStartDate: new Date('2023-11-08'), actualEndDate: new Date('2023-11-22'), estimatedHours: 36, actualHours: 42, progress: 100, stageId: p4Stage5.id } });
  const t4_5_5 = await prisma.task.create({ data: { name: 'Instalación de gas', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-11-20'), plannedEndDate: new Date('2023-11-28'), actualStartDate: new Date('2023-11-23'), actualEndDate: new Date('2023-12-01'), estimatedHours: 24, actualHours: 26, progress: 100, stageId: p4Stage5.id } });
  const t4_5_6 = await prisma.task.create({ data: { name: 'Pruebas hidráulicas y eléctricas', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2023-11-29'), plannedEndDate: new Date('2023-11-30'), actualStartDate: new Date('2023-12-02'), actualEndDate: new Date('2023-12-05'), estimatedHours: 12, actualHours: 16, progress: 100, stageId: p4Stage5.id } });

  // Stage 6: Techos
  const t4_6_1 = await prisma.task.create({ data: { name: 'Tirantería de madera', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-11-20'), plannedEndDate: new Date('2023-11-30'), actualStartDate: new Date('2023-11-20'), actualEndDate: new Date('2023-11-30'), estimatedHours: 40, actualHours: 40, progress: 100, stageId: p4Stage6.id } });
  const t4_6_2 = await prisma.task.create({ data: { name: 'Membrana y cubierta de tejas', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-12-01'), plannedEndDate: new Date('2023-12-10'), actualStartDate: new Date('2023-12-01'), actualEndDate: new Date('2023-12-12'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage6.id } });
  const t4_6_3 = await prisma.task.create({ data: { name: 'Canaletas y bajadas', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2023-12-11'), plannedEndDate: new Date('2023-12-15'), actualStartDate: new Date('2023-12-13'), actualEndDate: new Date('2023-12-18'), estimatedHours: 16, actualHours: 18, progress: 100, stageId: p4Stage6.id } });

  // Stage 7: Revoques
  const t4_7_1 = await prisma.task.create({ data: { name: 'Revoque grueso interior', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2023-12-20'), plannedEndDate: new Date('2024-01-05'), actualStartDate: new Date('2023-12-20'), actualEndDate: new Date('2024-01-05'), estimatedHours: 56, actualHours: 56, progress: 100, stageId: p4Stage7.id } });
  const t4_7_2 = await prisma.task.create({ data: { name: 'Revoque grueso exterior', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-01-03'), plannedEndDate: new Date('2024-01-12'), actualStartDate: new Date('2024-01-04'), actualEndDate: new Date('2024-01-14'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p4Stage7.id } });
  const t4_7_3 = await prisma.task.create({ data: { name: 'Contrapisos', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-01-08'), plannedEndDate: new Date('2024-01-15'), actualStartDate: new Date('2024-01-10'), actualEndDate: new Date('2024-01-18'), estimatedHours: 32, actualHours: 34, progress: 100, stageId: p4Stage7.id } });
  const t4_7_4 = await prisma.task.create({ data: { name: 'Revoque fino (enlucido)', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-01-15'), plannedEndDate: new Date('2024-01-20'), actualStartDate: new Date('2024-01-18'), actualEndDate: new Date('2024-01-25'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage7.id } });

  // Stage 8: Pisos
  const t4_8_1 = await prisma.task.create({ data: { name: 'Porcelanato living/cocina', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-01-26'), plannedEndDate: new Date('2024-02-02'), actualStartDate: new Date('2024-01-26'), actualEndDate: new Date('2024-02-05'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage8.id } });
  const t4_8_2 = await prisma.task.create({ data: { name: 'Cerámicos en baños y cocina', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-02-03'), plannedEndDate: new Date('2024-02-10'), actualStartDate: new Date('2024-02-05'), actualEndDate: new Date('2024-02-14'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage8.id } });
  const t4_8_3 = await prisma.task.create({ data: { name: 'Piso flotante en dormitorios', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-02-12'), plannedEndDate: new Date('2024-02-15'), actualStartDate: new Date('2024-02-15'), actualEndDate: new Date('2024-02-20'), estimatedHours: 20, actualHours: 22, progress: 100, stageId: p4Stage8.id } });

  // Stage 9: Pintura y Terminaciones
  const t4_9_1 = await prisma.task.create({ data: { name: 'Pintura interior (2 manos)', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-02-21'), plannedEndDate: new Date('2024-03-04'), actualStartDate: new Date('2024-02-21'), actualEndDate: new Date('2024-03-06'), estimatedHours: 48, actualHours: 52, progress: 100, stageId: p4Stage9.id } });
  const t4_9_2 = await prisma.task.create({ data: { name: 'Pintura exterior', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-03-01'), plannedEndDate: new Date('2024-03-08'), actualStartDate: new Date('2024-03-04'), actualEndDate: new Date('2024-03-12'), estimatedHours: 32, actualHours: 36, progress: 100, stageId: p4Stage9.id } });
  const t4_9_3 = await prisma.task.create({ data: { name: 'Carpintería de aluminio (ventanas y puertas)', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-03-05'), plannedEndDate: new Date('2024-03-12'), actualStartDate: new Date('2024-03-08'), actualEndDate: new Date('2024-03-18'), estimatedHours: 32, actualHours: 36, progress: 100, stageId: p4Stage9.id } });
  const t4_9_4 = await prisma.task.create({ data: { name: 'Mesadas, grifería y artefactos sanitarios', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, plannedStartDate: new Date('2024-03-13'), plannedEndDate: new Date('2024-03-20'), actualStartDate: new Date('2024-03-18'), actualEndDate: new Date('2024-03-28'), estimatedHours: 28, actualHours: 32, progress: 100, stageId: p4Stage9.id } });

  // Stage 10: Exterior y Entrega
  const t4_10_1 = await prisma.task.create({ data: { name: 'Vereda perimetral y garage', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, plannedStartDate: new Date('2024-03-28'), plannedEndDate: new Date('2024-04-03'), actualStartDate: new Date('2024-03-28'), actualEndDate: new Date('2024-04-05'), estimatedHours: 32, actualHours: 34, progress: 100, stageId: p4Stage10.id } });
  const t4_10_2 = await prisma.task.create({ data: { name: 'Parquización y cerco definitivo', status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, plannedStartDate: new Date('2024-04-01'), plannedEndDate: new Date('2024-04-05'), actualStartDate: new Date('2024-04-03'), actualEndDate: new Date('2024-04-08'), estimatedHours: 20, actualHours: 22, progress: 100, stageId: p4Stage10.id } });
  const t4_10_3 = await prisma.task.create({ data: { name: 'Limpieza final y entrega de llaves', status: TaskStatus.COMPLETED, priority: TaskPriority.URGENT, plannedStartDate: new Date('2024-04-08'), plannedEndDate: new Date('2024-04-10'), actualStartDate: new Date('2024-04-10'), actualEndDate: new Date('2024-04-15'), estimatedHours: 16, actualHours: 20, progress: 100, stageId: p4Stage10.id } });

  // ---- TASK DEPENDENCIES for Project 4 ----
  await prisma.taskDependency.createMany({
    data: [
      { taskId: t4_1_2.id, dependsOnId: t4_1_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_1_3.id, dependsOnId: t4_1_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_2_1.id, dependsOnId: t4_1_3.id, dependencyType: DependencyType.FS, lagDays: 1 },
      { taskId: t4_2_2.id, dependsOnId: t4_2_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_2_3.id, dependsOnId: t4_2_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_2_4.id, dependsOnId: t4_2_3.id, dependencyType: DependencyType.FS, lagDays: 1 },
      { taskId: t4_3_1.id, dependsOnId: t4_2_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_3_2.id, dependsOnId: t4_3_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_3_3.id, dependsOnId: t4_3_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_3_4.id, dependsOnId: t4_3_3.id, dependencyType: DependencyType.FS, lagDays: 2 },
      { taskId: t4_3_5.id, dependsOnId: t4_3_4.id, dependencyType: DependencyType.SS, lagDays: 3 },
      { taskId: t4_4_1.id, dependsOnId: t4_3_5.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_4_2.id, dependsOnId: t4_4_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_4_3.id, dependsOnId: t4_4_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_5_1.id, dependsOnId: t4_4_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_5_2.id, dependsOnId: t4_5_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_5_3.id, dependsOnId: t4_4_1.id, dependencyType: DependencyType.SS, lagDays: 7 },
      { taskId: t4_5_4.id, dependsOnId: t4_5_3.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_5_5.id, dependsOnId: t4_5_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_5_6.id, dependsOnId: t4_5_5.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_6_1.id, dependsOnId: t4_4_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_6_2.id, dependsOnId: t4_6_1.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_6_3.id, dependsOnId: t4_6_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_7_1.id, dependsOnId: t4_5_6.id, dependencyType: DependencyType.FS, lagDays: 7 },
      { taskId: t4_7_2.id, dependsOnId: t4_7_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_7_3.id, dependsOnId: t4_7_1.id, dependencyType: DependencyType.SS, lagDays: 3 },
      { taskId: t4_7_4.id, dependsOnId: t4_7_2.id, dependencyType: DependencyType.FS, lagDays: 1 },
      { taskId: t4_8_1.id, dependsOnId: t4_7_3.id, dependencyType: DependencyType.FS, lagDays: 2 },
      { taskId: t4_8_2.id, dependsOnId: t4_8_1.id, dependencyType: DependencyType.SS, lagDays: 3 },
      { taskId: t4_8_3.id, dependsOnId: t4_8_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_9_1.id, dependsOnId: t4_7_4.id, dependencyType: DependencyType.FS, lagDays: 5 },
      { taskId: t4_9_2.id, dependsOnId: t4_9_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_9_3.id, dependsOnId: t4_9_1.id, dependencyType: DependencyType.SS, lagDays: 5 },
      { taskId: t4_9_4.id, dependsOnId: t4_9_3.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_10_1.id, dependsOnId: t4_9_4.id, dependencyType: DependencyType.FS, lagDays: 0 },
      { taskId: t4_10_2.id, dependsOnId: t4_10_1.id, dependencyType: DependencyType.SS, lagDays: 2 },
      { taskId: t4_10_3.id, dependsOnId: t4_10_2.id, dependencyType: DependencyType.FS, lagDays: 0 },
    ],
  });

  // ---- TASK ASSIGNMENTS for Project 4 ----
  await prisma.taskAssignment.createMany({
    data: [
      { taskId: t4_2_2.id, employeeId: empAlbanil1.id },
      { taskId: t4_2_2.id, employeeId: empAyudante1.id },
      { taskId: t4_3_1.id, employeeId: empAlbanil1.id },
      { taskId: t4_3_2.id, employeeId: empAlbanil1.id },
      { taskId: t4_3_2.id, employeeId: empAlbanil2.id },
      { taskId: t4_3_3.id, employeeId: empCapataz.id },
      { taskId: t4_4_1.id, employeeId: empAlbanil1.id },
      { taskId: t4_4_3.id, employeeId: empAlbanil2.id },
      { taskId: t4_5_1.id, employeeId: empElectricista.id },
      { taskId: t4_5_2.id, employeeId: empElectricista.id },
      { taskId: t4_5_3.id, employeeId: empPlomero.id },
      { taskId: t4_5_4.id, employeeId: empPlomero.id },
      { taskId: t4_9_1.id, employeeId: empPintor.id },
      { taskId: t4_9_2.id, employeeId: empPintor.id },
      { taskId: t4_10_3.id, employeeId: empCapataz.id },
    ],
  });

  // ---- EMPLOYEE-PROJECT ASSIGNMENTS for Project 4 ----
  await prisma.employeeProjectAssignment.createMany({
    data: [
      { employeeId: empCapataz.id, projectId: project4.id, role: 'Capataz General', startDate: new Date('2023-06-01'), endDate: new Date('2024-04-15'), isActive: false },
      { employeeId: empAlbanil1.id, projectId: project4.id, role: 'Oficial Albañil', startDate: new Date('2023-06-01'), endDate: new Date('2024-04-15'), isActive: false },
      { employeeId: empAlbanil2.id, projectId: project4.id, role: 'Oficial Albañil', startDate: new Date('2023-07-10'), endDate: new Date('2024-04-15'), isActive: false },
      { employeeId: empElectricista.id, projectId: project4.id, role: 'Electricista', startDate: new Date('2023-10-22'), endDate: new Date('2023-12-05'), isActive: false },
      { employeeId: empPlomero.id, projectId: project4.id, role: 'Plomero', startDate: new Date('2023-10-25'), endDate: new Date('2023-12-05'), isActive: false },
      { employeeId: empPintor.id, projectId: project4.id, role: 'Pintor', startDate: new Date('2024-02-21'), endDate: new Date('2024-03-28'), isActive: false },
      { employeeId: empAyudante1.id, projectId: project4.id, role: 'Medio Oficial', startDate: new Date('2023-06-01'), endDate: new Date('2024-04-15'), isActive: false },
    ],
  });

  console.log('   ✅ Duplex López: 10 stages, 38 tasks, 37 dependencies, 15 assignments');

  // ============================================
  // BUDGETS
  // ============================================
  console.log('💰 Creating budgets...');
  const budget1 = await prisma.budget.create({
    data: {
      name: 'Presupuesto Aprobado v2', description: 'Presupuesto revisado y aprobado por el cliente. Incluye ajuste por inflación Q3 2024.',
      version: 2, isActive: true,
      materialsBudget: 48750000, laborBudget: 37500000, equipmentBudget: 12500000,
      subcontractBudget: 15000000, otherBudget: 6250000, contingencyBudget: 5000000,
      projectId: project1.id,
    },
  });
  const budget2 = await prisma.budget.create({
    data: {
      name: 'Presupuesto Base Edificio', description: 'Presupuesto estimado inicial sujeto a revisión trimestral.',
      version: 1, isActive: true,
      materialsBudget: 220000000, laborBudget: 175000000, equipmentBudget: 58000000,
      subcontractBudget: 87000000, otherBudget: 23200000, contingencyBudget: 16800000,
      projectId: project2.id,
    },
  });
  const budget4 = await prisma.budget.create({
    data: {
      name: 'Presupuesto Final Duplex', description: 'Presupuesto final ejecutado. Sobrecosto del 5% por atrasos climáticos y ajustes del cliente.',
      version: 1, isActive: true,
      materialsBudget: 26000000, laborBudget: 20000000, equipmentBudget: 5000000,
      subcontractBudget: 8000000, otherBudget: 3500000, contingencyBudget: 2500000,
      projectId: project4.id,
    },
  });
  console.log('   ✅ 3 budgets created');

  // ============================================
  // EXPENSES (variedad de estados)
  // ============================================
  console.log('💸 Creating expenses...');
  await prisma.expense.createMany({
    data: [
      // ---- Project 1 Expenses ----
      // PAID
      { reference: 'GAS-2024-00001', description: 'Cemento Portland x 200 bolsas - Inicio de obra', amount: 1780000, taxAmount: 373800, totalAmount: 2153800, status: ExpenseStatus.PAID, expenseDate: new Date('2024-06-05'), paidDate: new Date('2024-07-05'), invoiceNumber: 'A-0001-00045678', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-06-07') },
      { reference: 'GAS-2024-00002', description: 'Arena gruesa 30m³ + Piedra partida 15m³', amount: 2220000, taxAmount: 466200, totalAmount: 2686200, status: ExpenseStatus.PAID, expenseDate: new Date('2024-06-20'), paidDate: new Date('2024-07-20'), invoiceNumber: 'A-0001-00045890', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-06-22') },
      { reference: 'GAS-2024-00003', description: 'Hierros varios para estructura - 1er pedido', amount: 4850000, taxAmount: 1018500, totalAmount: 5868500, status: ExpenseStatus.PAID, expenseDate: new Date('2024-07-08'), paidDate: new Date('2024-07-23'), invoiceNumber: 'A-0002-00012345', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-10') },
      { reference: 'GAS-2024-00004', description: 'Hormigón elaborado H21 - Fundaciones (18m³)', amount: 2970000, taxAmount: 623700, totalAmount: 3593700, status: ExpenseStatus.PAID, expenseDate: new Date('2024-07-02'), paidDate: new Date('2024-07-02'), invoiceNumber: 'A-0005-00008901', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-01') },
      { reference: 'GAS-2024-00005', description: 'Jornales equipo obra - Junio 2024', amount: 1850000, taxAmount: 0, totalAmount: 1850000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-06-30'), paidDate: new Date('2024-07-05'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-01') },
      { reference: 'GAS-2024-00006', description: 'Jornales equipo obra - Julio 2024', amount: 2200000, taxAmount: 0, totalAmount: 2200000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-07-31'), paidDate: new Date('2024-08-05'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-01') },
      { reference: 'GAS-2024-00007', description: 'Hormigón elaborado H21 - Losa PB (22m³)', amount: 3630000, taxAmount: 762300, totalAmount: 4392300, status: ExpenseStatus.PAID, expenseDate: new Date('2024-08-13'), paidDate: new Date('2024-08-13'), invoiceNumber: 'A-0005-00009234', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-12') },
      { reference: 'GAS-2024-00008', description: 'Hierros para estructura PA', amount: 3200000, taxAmount: 672000, totalAmount: 3872000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-08-20'), paidDate: new Date('2024-09-05'), invoiceNumber: 'A-0002-00013456', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-22') },
      { reference: 'GAS-2024-00009', description: 'Alquiler de grúa torre - Agosto/Septiembre', amount: 2800000, taxAmount: 588000, totalAmount: 3388000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-08-01'), paidDate: new Date('2024-09-01'), invoiceNumber: 'B-0010-00002345', invoiceType: 'B', projectId: project1.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-03') },
      { reference: 'GAS-2024-00010', description: 'Ladrillos huecos 12cm x 5000 u + 18cm x 3500 u', amount: 1955000, taxAmount: 410550, totalAmount: 2365550, status: ExpenseStatus.PAID, expenseDate: new Date('2024-09-08'), paidDate: new Date('2024-10-08'), invoiceNumber: 'A-0001-00046789', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-10') },
      { reference: 'GAS-2024-00011', description: 'Jornales equipo obra - Agosto 2024', amount: 2350000, taxAmount: 0, totalAmount: 2350000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-08-31'), paidDate: new Date('2024-09-05'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-01') },
      { reference: 'GAS-2024-00012', description: 'Jornales equipo obra - Septiembre 2024', amount: 2450000, taxAmount: 0, totalAmount: 2450000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-09-30'), paidDate: new Date('2024-10-05'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-10-01') },
      { reference: 'GAS-2024-00013', description: 'Seguro de obra - Póliza anual', amount: 1200000, taxAmount: 0, totalAmount: 1200000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-06-01'), paidDate: new Date('2024-06-01'), projectId: project1.id, categoryId: catAdmin.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-05-30') },
      { reference: 'GAS-2024-00014', description: 'Materiales eléctricos - Cables y caños', amount: 1450000, taxAmount: 304500, totalAmount: 1754500, status: ExpenseStatus.PAID, expenseDate: new Date('2024-10-25'), paidDate: new Date('2024-11-01'), invoiceNumber: 'A-0003-00005678', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supElectrica.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-10-27') },
      { reference: 'GAS-2024-00015', description: 'Fletes y volquetes - Junio a Octubre', amount: 980000, taxAmount: 205800, totalAmount: 1185800, status: ExpenseStatus.PAID, expenseDate: new Date('2024-10-31'), paidDate: new Date('2024-11-15'), invoiceNumber: 'C-0008-00001234', invoiceType: 'C', projectId: project1.id, categoryId: catTransporte.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-01') },
      // APPROVED (waiting payment)
      { reference: 'GAS-2024-00016', description: 'Jornales equipo obra - Octubre 2024', amount: 2600000, taxAmount: 0, totalAmount: 2600000, status: ExpenseStatus.APPROVED, expenseDate: new Date('2024-10-31'), dueDate: new Date('2024-11-10'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-02') },
      { reference: 'GAS-2024-00017', description: 'Caños PPF y PVC para instalación sanitaria', amount: 680000, taxAmount: 142800, totalAmount: 822800, status: ExpenseStatus.APPROVED, expenseDate: new Date('2024-11-10'), dueDate: new Date('2024-12-10'), invoiceNumber: 'A-0004-00003456', invoiceType: 'A', projectId: project1.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-12') },
      // PENDING_APPROVAL
      { reference: 'GAS-2025-00001', description: 'Membrana asfáltica x 15 rollos', amount: 1020000, taxAmount: 214200, totalAmount: 1234200, status: ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2025-01-02'), projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id },
      { reference: 'GAS-2025-00002', description: 'Jornales equipo obra - Noviembre 2024', amount: 2750000, taxAmount: 0, totalAmount: 2750000, status: ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2024-11-30'), projectId: project1.id, categoryId: catManoObra.id, createdById: administrative.id },
      { reference: 'GAS-2025-00003', description: 'EPP y elementos de seguridad', amount: 320000, taxAmount: 67200, totalAmount: 387200, status: ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2025-01-05'), projectId: project1.id, categoryId: catSeguridad.id, createdById: administrative.id },
      // DRAFT
      { reference: 'GAS-2025-00004', description: 'Cemento Portland x 100 bolsas - Revoques', amount: 890000, taxAmount: 186900, totalAmount: 1076900, status: ExpenseStatus.DRAFT, expenseDate: new Date('2025-01-20'), projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id },
      // REJECTED
      { reference: 'GAS-2024-00018', description: 'Alquiler de andamios - Proveedor alternativo', amount: 450000, taxAmount: 94500, totalAmount: 544500, status: ExpenseStatus.REJECTED, expenseDate: new Date('2024-09-15'), projectId: project1.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-16'), rejectionReason: 'Precio superior al proveedor habitual. Solicitar cotización a Alqui-Obra.' },
      // ---- Project 2 Expenses ----
      { reference: 'GAS-2024-00019', description: 'Excavación subsuelos - Movimiento de suelos', amount: 18500000, taxAmount: 3885000, totalAmount: 22385000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-03-15'), paidDate: new Date('2024-04-15'), invoiceNumber: 'A-0020-00001234', invoiceType: 'A', projectId: project2.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-03-17') },
      { reference: 'GAS-2024-00020', description: 'Hormigón elaborado H25 - Subsuelos (180m³)', amount: 32400000, taxAmount: 6804000, totalAmount: 39204000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-06-01'), paidDate: new Date('2024-06-01'), invoiceNumber: 'A-0005-00010567', invoiceType: 'A', projectId: project2.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-05-30') },
      { reference: 'GAS-2024-00021', description: 'Hierros para estructura - Pedido masivo', amount: 28000000, taxAmount: 5880000, totalAmount: 33880000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-05-20'), paidDate: new Date('2024-06-05'), invoiceNumber: 'A-0002-00014567', invoiceType: 'A', projectId: project2.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-05-22') },
      // ---- Project 4 Expenses (Duplex - all PAID) ----
      { reference: 'GAS-2023-00001', description: 'Cemento Portland x 120 bolsas - Inicio de obra', amount: 960000, taxAmount: 201600, totalAmount: 1161600, status: ExpenseStatus.PAID, expenseDate: new Date('2023-06-08'), paidDate: new Date('2023-07-08'), invoiceNumber: 'A-0001-00038901', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-10') },
      { reference: 'GAS-2023-00002', description: 'Arena gruesa 20m³ + Piedra partida 10m³', amount: 1300000, taxAmount: 273000, totalAmount: 1573000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-06-15'), paidDate: new Date('2023-07-15'), invoiceNumber: 'A-0001-00039012', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-17') },
      { reference: 'GAS-2023-00003', description: 'Hierros para estructura completa', amount: 3800000, taxAmount: 798000, totalAmount: 4598000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-07-05'), paidDate: new Date('2023-07-20'), invoiceNumber: 'A-0002-00009876', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-07-07') },
      { reference: 'GAS-2023-00004', description: 'Hormigón elaborado H21 - Fundaciones (12m³)', amount: 1800000, taxAmount: 378000, totalAmount: 2178000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-06-29'), paidDate: new Date('2023-06-29'), invoiceNumber: 'A-0005-00006789', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-28') },
      { reference: 'GAS-2023-00005', description: 'Hormigón elaborado H21 - Losa entrepiso (16m³)', amount: 2400000, taxAmount: 504000, totalAmount: 2904000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-08-09'), paidDate: new Date('2023-08-09'), invoiceNumber: 'A-0005-00007123', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-08-08') },
      { reference: 'GAS-2023-00006', description: 'Ladrillos huecos 12cm x 3000u + 18cm x 2500u', amount: 1285000, taxAmount: 269850, totalAmount: 1554850, status: ExpenseStatus.PAID, expenseDate: new Date('2023-09-05'), paidDate: new Date('2023-10-05'), invoiceNumber: 'A-0001-00040234', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-09-07') },
      { reference: 'GAS-2023-00007', description: 'Jornales equipo obra - Jun a Sep 2023', amount: 6800000, taxAmount: 0, totalAmount: 6800000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-09-30'), paidDate: new Date('2023-10-05'), projectId: project4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-01') },
      { reference: 'GAS-2023-00008', description: 'Materiales eléctricos completos', amount: 1100000, taxAmount: 231000, totalAmount: 1331000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-10-20'), paidDate: new Date('2023-10-27'), invoiceNumber: 'A-0003-00004321', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supElectrica.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-22') },
      { reference: 'GAS-2023-00009', description: 'Caños y accesorios sanitarios', amount: 780000, taxAmount: 163800, totalAmount: 943800, status: ExpenseStatus.PAID, expenseDate: new Date('2023-10-23'), paidDate: new Date('2023-11-23'), invoiceNumber: 'A-0004-00002345', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-25') },
      { reference: 'GAS-2023-00010', description: 'Jornales equipo obra - Oct a Dic 2023', amount: 7200000, taxAmount: 0, totalAmount: 7200000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-12-31'), paidDate: new Date('2024-01-05'), projectId: project4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-01-02') },
      { reference: 'GAS-2024-00022', description: 'Tirantería y cubierta de tejas', amount: 2200000, taxAmount: 462000, totalAmount: 2662000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-11-18'), paidDate: new Date('2023-12-18'), invoiceNumber: 'B-0015-00001234', invoiceType: 'B', projectId: project4.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-11-20') },
      { reference: 'GAS-2024-00023', description: 'Porcelanatos, cerámicos y piso flotante', amount: 3500000, taxAmount: 735000, totalAmount: 4235000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-01-22'), paidDate: new Date('2024-02-22'), invoiceNumber: 'A-0025-00003456', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-01-24') },
      { reference: 'GAS-2024-00024', description: 'Carpintería de aluminio - Ventanas y puertas', amount: 4800000, taxAmount: 1008000, totalAmount: 5808000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-03-05'), paidDate: new Date('2024-04-05'), invoiceNumber: 'A-0030-00001234', invoiceType: 'A', projectId: project4.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-03-07') },
      { reference: 'GAS-2024-00025', description: 'Jornales equipo obra - Ene a Abr 2024', amount: 8200000, taxAmount: 0, totalAmount: 8200000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-04-15'), paidDate: new Date('2024-04-20'), projectId: project4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-16') },
      { reference: 'GAS-2024-00026', description: 'Pintura interior y exterior completa', amount: 1800000, taxAmount: 378000, totalAmount: 2178000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-02-20'), paidDate: new Date('2024-03-20'), invoiceNumber: 'B-0012-00005678', invoiceType: 'B', projectId: project4.id, categoryId: catMateriales.id, supplierId: supPintura.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-02-22') },
      { reference: 'GAS-2024-00027', description: 'Mesadas, grifería y artefactos sanitarios', amount: 2800000, taxAmount: 588000, totalAmount: 3388000, status: ExpenseStatus.PAID, expenseDate: new Date('2024-03-15'), paidDate: new Date('2024-04-15'), invoiceNumber: 'A-0004-00004567', invoiceType: 'A', projectId: project4.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-03-17') },
      { reference: 'GAS-2024-00028', description: 'Seguro de obra - Póliza anual', amount: 650000, taxAmount: 0, totalAmount: 650000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-06-01'), paidDate: new Date('2023-06-01'), projectId: project4.id, categoryId: catAdmin.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-05-30') },
      { reference: 'GAS-2024-00029', description: 'Alquiler equipos y herramientas varios', amount: 1400000, taxAmount: 294000, totalAmount: 1694000, status: ExpenseStatus.PAID, expenseDate: new Date('2023-12-15'), paidDate: new Date('2024-01-15'), invoiceNumber: 'C-0009-00002345', invoiceType: 'C', projectId: project4.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-12-17') },
      { reference: 'GAS-2024-00030', description: 'Fletes y volquetes - Obra completa', amount: 780000, taxAmount: 163800, totalAmount: 943800, status: ExpenseStatus.PAID, expenseDate: new Date('2024-04-10'), paidDate: new Date('2024-04-25'), invoiceNumber: 'C-0008-00002345', invoiceType: 'C', projectId: project4.id, categoryId: catTransporte.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-12') },
      { reference: 'GAS-2024-00031', description: 'Vereda perimetral y parquización', amount: 950000, taxAmount: 199500, totalAmount: 1149500, status: ExpenseStatus.PAID, expenseDate: new Date('2024-04-03'), paidDate: new Date('2024-05-03'), invoiceNumber: 'C-0011-00001234', invoiceType: 'C', projectId: project4.id, categoryId: catMateriales.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-05') },
    ],
  });
  console.log('   ✅ 45 expenses (P1: 22, P2: 3, P4: 20 - all states)');

  // Associate expenses with tasks (update taskId by reference)
  console.log('   🔗 Linking expenses to tasks...');
  const expenseTaskMap: Record<string, string> = {
    // ---- Project 1: Casa Familia Rodríguez ----
    // Cemento 200 bolsas → fue para fundaciones y estructura, asociar con hormigonado columnas PB
    'GAS-2024-00003': t3_1.id,     // Hierros varios 1er pedido → Armado columnas PB
    'GAS-2024-00004': t3_2.id,     // Hormigón H21 Fundaciones → Hormigonado columnas PB (fundaciones/estructura)
    'GAS-2024-00007': t3_5.id,     // Hormigón H21 Losa PB 22m³ → Hormigonado losa PB (match exacto)
    'GAS-2024-00008': t3_7.id,     // Hierros para estructura PA → Columnas y vigas PA
    'GAS-2024-00009': t3_8.id,     // Alquiler grúa torre Ago/Sep → Losa PA (la grúa se usó para la losa)
    'GAS-2024-00010': t3_7.id,     // Ladrillos → se usaron durante etapa estructura PA (mampostería en paralelo)
    'GAS-2024-00014': t5_1.id,     // Materiales eléctricos → Cañerías embutidas PB
    'GAS-2024-00017': t6_1.id,     // Caños PPF y PVC sanitaria → Instalación agua fría y caliente PB
    'GAS-2025-00001': t7_2.id,     // Membrana asfáltica → Colocación de membrana asfáltica (match exacto)
    'GAS-2025-00004': t8_1.id,     // Cemento para revoques → Revoque grueso exterior

    // ---- Project 4: Duplex Familia López ----
    'GAS-2023-00001': t4_2_3.id,   // Cemento 120 bolsas inicio → Hormigonado de fundaciones
    'GAS-2023-00002': t4_2_1.id,   // Arena + Piedra → Excavación de bases (materiales para fundaciones)
    'GAS-2023-00003': t4_3_1.id,   // Hierros estructura completa → Columnas planta baja
    'GAS-2023-00004': t4_2_3.id,   // Hormigón H21 Fundaciones 12m³ → Hormigonado de fundaciones
    'GAS-2023-00005': t4_3_3.id,   // Hormigón H21 Losa entrepiso 16m³ → Hormigonado losa entrepiso (match exacto)
    'GAS-2023-00006': t4_4_1.id,   // Ladrillos → Paredes exteriores PB
    'GAS-2023-00008': t4_5_1.id,   // Materiales eléctricos → Cañerías eléctricas embutidas
    'GAS-2023-00009': t4_5_3.id,   // Caños y accesorios sanitarios → Agua fría y caliente
    'GAS-2024-00022': t4_6_2.id,   // Tirantería y cubierta tejas → Membrana y cubierta de tejas
    'GAS-2024-00023': t4_8_1.id,   // Porcelanatos, cerámicos, piso flotante → Porcelanato living/cocina
    'GAS-2024-00024': t4_9_3.id,   // Carpintería aluminio → Carpintería de aluminio (match exacto)
    'GAS-2024-00026': t4_9_1.id,   // Pintura interior y exterior → Pintura interior (2 manos)
    'GAS-2024-00027': t4_9_4.id,   // Mesadas, grifería y artefactos → Mesadas, grifería y artefactos (match exacto)
    'GAS-2024-00031': t4_10_1.id,  // Vereda perimetral y parquización → Vereda perimetral y garage
  };

  for (const [reference, taskId] of Object.entries(expenseTaskMap)) {
    await prisma.expense.update({
      where: { reference },
      data: { taskId },
    });
  }
  console.log(`   ✅ ${Object.keys(expenseTaskMap).length} expenses linked to tasks`);

  // ============================================
  // PURCHASE ORDERS
  // ============================================
  console.log('📋 Creating purchase orders...');
  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'OC-2025-00001', status: PurchaseOrderStatus.CONFIRMED,
      subtotal: 1020000, taxAmount: 214200, totalAmount: 1234200,
      orderDate: new Date('2024-12-28'), expectedDeliveryDate: new Date('2025-01-03'),
      deliveryAddress: 'Lote 45, Barrio Los Castores, Nordelta',
      notes: 'Entregar por la mañana antes de las 10hs. Preguntar por Fernando (capataz).',
      projectId: project1.id, supplierId: supCorralon.id, createdById: administrative.id,
    },
  });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { purchaseOrderId: po1.id, materialId: materials[25].id, quantity: 15, unitPrice: 68000, totalPrice: 1020000, deliveredQty: 15 },
    ],
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'OC-2025-00002', status: PurchaseOrderStatus.SENT,
      subtotal: 1780000, taxAmount: 373800, totalAmount: 2153800,
      orderDate: new Date('2025-01-15'), expectedDeliveryDate: new Date('2025-01-22'),
      deliveryAddress: 'Lote 45, Barrio Los Castores, Nordelta',
      projectId: project1.id, supplierId: supCorralon.id, createdById: administrative.id,
    },
  });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { purchaseOrderId: po2.id, materialId: materials[0].id, quantity: 100, unitPrice: 8900, totalPrice: 890000, deliveredQty: 0 },
      { purchaseOrderId: po2.id, materialId: materials[4].id, quantity: 50, unitPrice: 4200, totalPrice: 210000, deliveredQty: 0 },
      { purchaseOrderId: po2.id, materialId: materials[1].id, quantity: 10, unitPrice: 48000, totalPrice: 480000, deliveredQty: 0 },
      { purchaseOrderId: po2.id, materialId: materials[26].id, quantity: 40, unitPrice: 5000, totalPrice: 200000, deliveredQty: 0 },
    ],
  });

  const po3 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'OC-2024-00010', status: PurchaseOrderStatus.COMPLETED,
      subtotal: 4850000, taxAmount: 1018500, totalAmount: 5868500,
      orderDate: new Date('2024-07-05'), expectedDeliveryDate: new Date('2024-07-10'), actualDeliveryDate: new Date('2024-07-09'),
      deliveryAddress: 'Lote 45, Barrio Los Castores, Nordelta',
      projectId: project1.id, supplierId: supHierros.id, createdById: administrative.id,
    },
  });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { purchaseOrderId: po3.id, materialId: materials[9].id, quantity: 150, unitPrice: 12500, totalPrice: 1875000, deliveredQty: 150 },
      { purchaseOrderId: po3.id, materialId: materials[10].id, quantity: 80, unitPrice: 18500, totalPrice: 1480000, deliveredQty: 80 },
      { purchaseOrderId: po3.id, materialId: materials[11].id, quantity: 50, unitPrice: 26000, totalPrice: 1300000, deliveredQty: 50 },
      { purchaseOrderId: po3.id, materialId: materials[13].id, quantity: 20, unitPrice: 3500, totalPrice: 70000, deliveredQty: 20 },
      { purchaseOrderId: po3.id, materialId: materials[12].id, quantity: 3, unitPrice: 42000, totalPrice: 126000, deliveredQty: 3 },
    ],
  });
  console.log('   ✅ 3 purchase orders (completed, confirmed, sent)');

  // ============================================
  // STOCK MOVEMENTS
  // ============================================
  console.log('📦 Creating stock movements...');
  await prisma.stockMovement.createMany({
    data: [
      // Entries from purchases
      { materialId: materials[0].id, quantity: 200, movementType: 'IN', reason: 'Compra inicial', reference: 'GAS-2024-00001', unitCost: 8900, totalCost: 1780000, projectId: project1.id, createdAt: new Date('2024-06-05') },
      { materialId: materials[1].id, quantity: 30, movementType: 'IN', reason: 'Compra arena gruesa', reference: 'GAS-2024-00002', unitCost: 48000, totalCost: 1440000, projectId: project1.id, createdAt: new Date('2024-06-20') },
      { materialId: materials[2].id, quantity: 15, movementType: 'IN', reason: 'Compra piedra partida', reference: 'GAS-2024-00002', unitCost: 52000, totalCost: 780000, projectId: project1.id, createdAt: new Date('2024-06-20') },
      { materialId: materials[9].id, quantity: 150, movementType: 'IN', reason: 'Pedido hierros estructura', reference: 'OC-2024-00010', unitCost: 12500, totalCost: 1875000, projectId: project1.id, createdAt: new Date('2024-07-09') },
      { materialId: materials[10].id, quantity: 80, movementType: 'IN', reason: 'Pedido hierros estructura', reference: 'OC-2024-00010', unitCost: 18500, totalCost: 1480000, projectId: project1.id, createdAt: new Date('2024-07-09') },
      { materialId: materials[5].id, quantity: 5000, movementType: 'IN', reason: 'Compra ladrillos', reference: 'GAS-2024-00010', unitCost: 195, totalCost: 975000, projectId: project1.id, createdAt: new Date('2024-09-08') },
      { materialId: materials[6].id, quantity: 3500, movementType: 'IN', reason: 'Compra ladrillos', reference: 'GAS-2024-00010', unitCost: 280, totalCost: 980000, projectId: project1.id, createdAt: new Date('2024-09-08') },
      { materialId: materials[25].id, quantity: 15, movementType: 'IN', reason: 'Compra membrana asfáltica', reference: 'OC-2025-00001', unitCost: 68000, totalCost: 1020000, projectId: project1.id, createdAt: new Date('2025-01-03') },
      // Outputs to project
      { materialId: materials[0].id, quantity: -120, movementType: 'OUT', reason: 'Consumo fundaciones y estructura', projectId: project1.id, createdAt: new Date('2024-09-15') },
      { materialId: materials[1].id, quantity: -22, movementType: 'OUT', reason: 'Consumo hormigón y mezcla', projectId: project1.id, createdAt: new Date('2024-09-15') },
      { materialId: materials[9].id, quantity: -130, movementType: 'OUT', reason: 'Consumo estructura PB+PA', projectId: project1.id, createdAt: new Date('2024-09-10') },
      { materialId: materials[10].id, quantity: -65, movementType: 'OUT', reason: 'Consumo estructura PB+PA', projectId: project1.id, createdAt: new Date('2024-09-10') },
      { materialId: materials[5].id, quantity: -3800, movementType: 'OUT', reason: 'Consumo mampostería', projectId: project1.id, createdAt: new Date('2024-10-28') },
      { materialId: materials[6].id, quantity: -2600, movementType: 'OUT', reason: 'Consumo mampostería', projectId: project1.id, createdAt: new Date('2024-10-28') },
      // Adjustment
      { materialId: materials[14].id, quantity: -2, movementType: 'ADJUSTMENT', reason: 'Ajuste inventario - Rollos dañados por lluvia', createdAt: new Date('2024-12-15') },
    ],
  });
  console.log('   ✅ 15 stock movements (IN, OUT, ADJUSTMENT)');

  // ============================================
  // ATTENDANCE (últimas 3 semanas laborales)
  // ============================================
  console.log('📅 Creating attendance records...');
  const attendanceData: any[] = [];
  const today = new Date();

  for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weekOffset * 7) - (today.getDay() - dayOfWeek));
      if (date > today) continue;

      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      for (const emp of allEmployees) {
        // Simulate realistic attendance patterns
        let type = AttendanceType.PRESENT;
        let hoursWorked = 8;
        let overtimeHours = 0;
        let checkInHour = 8;
        let checkOutHour = 17;
        let notes: string | null = null;

        const rand = Math.random();
        if (emp.id === empAyudante2.id && weekOffset === 0 && dayOfWeek === 3) {
          type = AttendanceType.ABSENT;
          hoursWorked = 0;
          notes = 'Falta sin aviso';
        } else if (emp.id === empPlomero.id && weekOffset === 1 && dayOfWeek >= 4) {
          type = AttendanceType.ABSENT;
          hoursWorked = 0;
          notes = 'Licencia por enfermedad';
        } else if (rand > 0.92) {
          type = AttendanceType.LATE;
          checkInHour = 9;
          hoursWorked = 7;
          notes = 'Llegó tarde - problemas de transporte';
        } else if (rand > 0.88) {
          overtimeHours = 2;
          checkOutHour = 19;
          hoursWorked = 10;
          notes = 'Horas extra - atraso losa';
        } else if (emp.id === empCapataz.id) {
          overtimeHours = weekOffset === 0 ? 1 : 0;
          checkOutHour = weekOffset === 0 ? 18 : 17;
          hoursWorked = weekOffset === 0 ? 9 : 8;
        }

        attendanceData.push({
          date: dateOnly,
          checkIn: type !== AttendanceType.ABSENT ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), checkInHour, 0) : null,
          checkOut: type !== AttendanceType.ABSENT ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), checkOutHour, 0) : null,
          type,
          hoursWorked,
          overtimeHours,
          notes,
          employeeId: emp.id,
        });
      }
    }
  }
  await prisma.attendance.createMany({ data: attendanceData, skipDuplicates: true });
  console.log(`   ✅ ${attendanceData.length} attendance records (3 weeks)`);

  // ============================================
  // COMMENTS
  // ============================================
  console.log('💬 Creating comments...');
  await prisma.comment.createMany({
    data: [
      { content: 'Se completó la excavación antes de lo previsto. Terreno en buenas condiciones, sin napa freática.', userId: supervisor.id, projectId: project1.id, createdAt: new Date('2024-06-13') },
      { content: 'Aprobada la muestra de hormigón H21 del laboratorio. Resistencia a 28 días: 245 kg/cm². OK para continuar.', userId: pmMaria.id, projectId: project1.id, createdAt: new Date('2024-07-25') },
      { content: 'El cliente visitó la obra y solicitó agregar una boca de luz adicional en el living. Evaluar impacto en presupuesto.', userId: supervisor.id, projectId: project1.id, createdAt: new Date('2024-11-05') },
      { content: 'Se detectó un caño de PVC fisurado en la bajada del baño PA. Se reemplazó sin costo adicional (garantía proveedor).', userId: empPlomero.id ? supervisor.id : supervisor.id, taskId: t6_3.id, createdAt: new Date('2024-12-01') },
      { content: 'Cableado de PB terminado. Faltan 8 bocas en PA y el tendido al tablero principal.', userId: supervisor.id, taskId: t5_3.id, createdAt: new Date('2025-01-10') },
      { content: 'Lluvia fuerte durante 3 días. Se cubrió la losa con polietileno. Sin daños en la estructura.', userId: pmMaria.id, projectId: project1.id, createdAt: new Date('2024-09-05') },
      { content: 'Reunión con el cliente programada para el viernes. Preparar avance fotográfico.', userId: pmMaria.id, projectId: project1.id, createdAt: new Date('2025-01-28') },
      { content: 'Hormigonado del piso 2 completado exitosamente. Curado con riego programado.', userId: pmAndres.id, projectId: project2.id, createdAt: new Date('2024-10-08') },
      // Project 4 comments
      { content: 'Inicio de obra. Terreno en buenas condiciones. Sin obstáculos para la excavación.', userId: supervisor.id, projectId: project4.id, createdAt: new Date('2023-06-01') },
      { content: 'La estructura se demoró 5 días por lluvias persistentes en agosto. Se ajusta cronograma.', userId: pmMaria.id, projectId: project4.id, createdAt: new Date('2023-08-25') },
      { content: 'El cliente solicitó cambiar los cerámicos del baño principal por porcelanato. Impacto: +$350.000.', userId: supervisor.id, projectId: project4.id, createdAt: new Date('2024-01-15') },
      { content: 'Inspección municipal aprobada. Habilitación final en trámite.', userId: pmMaria.id, projectId: project4.id, createdAt: new Date('2024-04-02') },
      { content: 'Entrega de llaves realizada. Cliente muy conforme con el resultado. Obra finalizada con 15 días de atraso y 5% de sobrecosto.', userId: pmMaria.id, projectId: project4.id, createdAt: new Date('2024-04-15') },
    ],
  });
  console.log('   ✅ 13 comments on projects and tasks');

  // ============================================
  // NOTIFICATIONS
  // ============================================
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      { type: NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00001 (Membrana asfáltica x 15 rollos - $1.234.200) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
      { type: NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00002 (Jornales Noviembre - $2.750.000) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
      { type: NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00003 (EPP y seguridad - $387.200) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
      { type: NotificationType.TASK_ASSIGNED, title: 'Nueva tarea asignada', message: 'Se te asignó la tarea "Cableado general" en el proyecto Casa Familia Rodríguez.', entityType: 'task', entityId: t5_3.id, userId: supervisor.id, isRead: true, readAt: new Date('2024-11-12') },
      { type: NotificationType.TASK_OVERDUE, title: 'Tarea con atraso', message: 'La tarea "Colocación de membrana asfáltica" lleva 3 días de atraso respecto al plan.', entityType: 'task', entityId: t7_2.id, userId: pmMaria.id },
      { type: NotificationType.BUDGET_ALERT, title: 'Alerta de presupuesto', message: 'El proyecto Casa Familia Rodríguez alcanzó el 65% del presupuesto con un 65% de avance. El gasto está en línea con el plan.', entityType: 'project', entityId: project1.id, userId: pmMaria.id },
      { type: NotificationType.STOCK_LOW, title: 'Stock bajo de material', message: 'El material "Cable Unipolar 2.5mm² Rojo" (MAT-00015) tiene stock bajo: 13 rollos (mínimo: 5). Considerar reposición.', entityType: 'material', userId: administrative.id },
      { type: NotificationType.PROJECT_UPDATE, title: 'Proyecto completado', message: 'El proyecto "Duplex Familia López" ha sido marcado como completado. Felicitaciones al equipo!', entityType: 'project', entityId: project4.id, userId: admin.id, isRead: true, readAt: new Date('2024-04-16') },
      { type: NotificationType.GENERAL, title: 'Reunión de avance semanal', message: 'Recordatorio: Reunión de avance de obras todos los lunes a las 9:00hs en oficina central.', userId: pmMaria.id },
      { type: NotificationType.GENERAL, title: 'Reunión de avance semanal', message: 'Recordatorio: Reunión de avance de obras todos los lunes a las 9:00hs en oficina central.', userId: pmAndres.id },
    ],
  });
  console.log('   ✅ 10 notifications');

  // ============================================
  // AUDIT LOGS
  // ============================================
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { action: AuditAction.CREATE, entityType: 'project', entityId: project1.id, newValues: { name: 'Casa Familia Rodríguez - Nordelta', status: 'PLANNING' }, userId: pmMaria.id, createdAt: new Date('2024-05-15') },
      { action: AuditAction.UPDATE, entityType: 'project', entityId: project1.id, oldValues: { status: 'PLANNING' }, newValues: { status: 'IN_PROGRESS' }, userId: pmMaria.id, createdAt: new Date('2024-06-01') },
      { action: AuditAction.UPDATE, entityType: 'project', entityId: project1.id, oldValues: { progress: 38 }, newValues: { progress: 65 }, userId: supervisor.id, createdAt: new Date('2025-01-15') },
      { action: AuditAction.CREATE, entityType: 'expense', entityId: 'seed-expense', newValues: { reference: 'GAS-2024-00001', amount: 2153800 }, userId: administrative.id, createdAt: new Date('2024-06-05') },
      { action: AuditAction.UPDATE, entityType: 'expense', entityId: 'seed-expense', oldValues: { status: 'PENDING_APPROVAL' }, newValues: { status: 'APPROVED' }, userId: pmMaria.id, createdAt: new Date('2024-06-07') },
      { action: AuditAction.UPDATE, entityType: 'project', entityId: project4.id, oldValues: { status: 'IN_PROGRESS', progress: 98 }, newValues: { status: 'COMPLETED', progress: 100 }, userId: pmMaria.id, createdAt: new Date('2024-04-15') },
      { action: AuditAction.CREATE, entityType: 'employee', entityId: empAyudante2.id, newValues: { firstName: 'Luciano', lastName: 'Acosta', position: 'Ayudante' }, userId: admin.id, createdAt: new Date('2024-03-01') },
      { action: AuditAction.UPDATE, entityType: 'task', entityId: t5_3.id, oldValues: { status: 'PENDING' }, newValues: { status: 'IN_PROGRESS' }, userId: supervisor.id, createdAt: new Date('2024-11-11') },
    ],
  });
  console.log('   ✅ 8 audit log entries');

  // ============================================
  // FASE 7: MONEDAS Y TIPOS DE CAMBIO
  // ============================================
  console.log('💱 Creating currencies and exchange rates...');
  const currARS = await prisma.currency.create({
    data: { code: 'ARS', name: 'Peso Argentino', symbol: '$', organizationId: org.id },
  });
  const currUSD = await prisma.currency.create({
    data: { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', organizationId: org.id },
  });
  const currEUR = await prisma.currency.create({
    data: { code: 'EUR', name: 'Euro', symbol: '€', organizationId: org.id },
  });

  // Tipos de cambio mensuales USD/ARS
  const exchangeRates = [
    { date: '2024-06-01', rate: 920.50 },
    { date: '2024-07-01', rate: 945.00 },
    { date: '2024-08-01', rate: 965.00 },
    { date: '2024-09-01', rate: 985.00 },
    { date: '2024-10-01', rate: 1005.00 },
    { date: '2024-11-01', rate: 1025.00 },
    { date: '2024-12-01', rate: 1050.00 },
    { date: '2025-01-01', rate: 1080.00 },
  ];
  for (const er of exchangeRates) {
    await prisma.exchangeRate.create({
      data: {
        date: new Date(er.date),
        rate: er.rate,
        fromCurrencyId: currUSD.id,
        toCurrencyId: currARS.id,
        source: 'BCRA',
        organizationId: org.id,
      },
    });
  }
  // EUR/ARS
  await prisma.exchangeRate.create({
    data: { date: new Date('2025-01-01'), rate: 1175.00, fromCurrencyId: currEUR.id, toCurrencyId: currARS.id, source: 'BCRA', organizationId: org.id },
  });
  console.log('   ✅ 3 currencies, 9 exchange rates');

  // ============================================
  // FASE 1: PRESUPUESTO VERSIONADO - Proyecto 1
  // ============================================
  console.log('📊 Creating budget versions with chapters and items...');

  // Version 1: SUPERSEDED (presupuesto original)
  const bv1 = await prisma.budgetVersion.create({
    data: {
      code: 'PRES-2024-00001',
      name: 'Presupuesto Original - Licitación',
      description: 'Presupuesto base presentado en licitación',
      version: 1,
      status: BudgetVersionStatus.SUPERSEDED,
      gastosGeneralesPct: 0.13,
      beneficioPct: 0.08,
      gastosFinancierosPct: 0.015,
      ivaPct: 0.21,
      coeficienteK: 1.5138, // (1.13)*(1.08)*(1.015)*(1.21)
      totalCostoCosto: 95000000,
      totalPrecio: 143811000,
      projectId: project1.id,
      organizationId: org.id,
    },
  });

  // Version 2: APPROVED (presupuesto vigente con ajustes)
  const bv2 = await prisma.budgetVersion.create({
    data: {
      code: 'PRES-2024-00002',
      name: 'Presupuesto Ajustado v2',
      description: 'Actualización de precios con adicional de pileta y solarium',
      version: 2,
      status: BudgetVersionStatus.APPROVED,
      gastosGeneralesPct: 0.15,
      beneficioPct: 0.10,
      gastosFinancierosPct: 0.02,
      ivaPct: 0.21,
      coeficienteK: 1.5604, // (1.15)*(1.10)*(1.02)*(1.21)
      totalCostoCosto: 80125000,
      totalPrecio: 125027050,
      projectId: project1.id,
      organizationId: org.id,
    },
  });

  // Categorías y Etapas para BV2 (presupuesto vigente)
  const ch1 = await prisma.budgetCategory.create({
    data: { number: 1, name: 'Trabajos Preliminares y Movimiento de Suelos', order: 1, subtotalCostoCosto: 4850000, budgetVersionId: bv2.id },
  });
  const st1 = await prisma.budgetStage.create({
    data: { number: '1', description: 'Trabajos Preliminares', unit: 'gl', quantity: 1, unitPrice: 4850000, totalPrice: 4850000, categoryId: ch1.id },
  });
  const ch2 = await prisma.budgetCategory.create({
    data: { number: 2, name: 'Fundaciones', order: 2, subtotalCostoCosto: 12500000, budgetVersionId: bv2.id },
  });
  const st2 = await prisma.budgetStage.create({
    data: { number: '2', description: 'Fundaciones', unit: 'gl', quantity: 1, unitPrice: 12500000, totalPrice: 12500000, categoryId: ch2.id },
  });
  const ch3 = await prisma.budgetCategory.create({
    data: { number: 3, name: 'Estructura de Hormigón Armado', order: 3, subtotalCostoCosto: 22800000, budgetVersionId: bv2.id },
  });
  const st3 = await prisma.budgetStage.create({
    data: { number: '3', description: 'Estructura H°A°', unit: 'gl', quantity: 1, unitPrice: 22800000, totalPrice: 22800000, categoryId: ch3.id },
  });
  const ch4 = await prisma.budgetCategory.create({
    data: { number: 4, name: 'Mampostería', order: 4, subtotalCostoCosto: 9800000, budgetVersionId: bv2.id },
  });
  const st4 = await prisma.budgetStage.create({
    data: { number: '4', description: 'Mampostería', unit: 'gl', quantity: 1, unitPrice: 9800000, totalPrice: 9800000, categoryId: ch4.id },
  });
  const ch5 = await prisma.budgetCategory.create({
    data: { number: 5, name: 'Instalaciones (Eléctrica, Sanitaria, Gas)', order: 5, subtotalCostoCosto: 11500000, budgetVersionId: bv2.id },
  });
  const st5 = await prisma.budgetStage.create({
    data: { number: '5', description: 'Instalaciones', unit: 'gl', quantity: 1, unitPrice: 11500000, totalPrice: 11500000, categoryId: ch5.id },
  });
  const ch6 = await prisma.budgetCategory.create({
    data: { number: 6, name: 'Techos, Aislaciones e Impermeabilización', order: 6, subtotalCostoCosto: 6200000, budgetVersionId: bv2.id },
  });
  const st6 = await prisma.budgetStage.create({
    data: { number: '6', description: 'Techos e Impermeabilización', unit: 'gl', quantity: 1, unitPrice: 6200000, totalPrice: 6200000, categoryId: ch6.id },
  });
  const ch7 = await prisma.budgetCategory.create({
    data: { number: 7, name: 'Revoques, Contrapisos y Carpetas', order: 7, subtotalCostoCosto: 5475000, budgetVersionId: bv2.id },
  });
  const st7 = await prisma.budgetStage.create({
    data: { number: '7', description: 'Revoques y Terminaciones', unit: 'gl', quantity: 1, unitPrice: 5475000, totalPrice: 5475000, categoryId: ch7.id },
  });
  const ch8 = await prisma.budgetCategory.create({
    data: { number: 8, name: 'Terminaciones y Exterior', order: 8, subtotalCostoCosto: 7000000, budgetVersionId: bv2.id },
  });
  const st8 = await prisma.budgetStage.create({
    data: { number: '8', description: 'Terminaciones', unit: 'gl', quantity: 1, unitPrice: 7000000, totalPrice: 7000000, categoryId: ch8.id },
  });

  // Items del capitulo 1 - Preliminares
  const bi1_1 = await prisma.budgetItem.create({
    data: { number: '1.1', description: 'Limpieza y nivelación del terreno', unit: 'm2', quantity: 450, unitPrice: 2800, totalPrice: 1260000, stageId: st1.id },
  });
  const bi1_2 = await prisma.budgetItem.create({
    data: { number: '1.2', description: 'Cerco perimetral de obra', unit: 'ml', quantity: 120, unitPrice: 8500, totalPrice: 1020000, stageId: st1.id },
  });
  const bi1_3 = await prisma.budgetItem.create({
    data: { number: '1.3', description: 'Obrador y conexiones provisorias', unit: 'gl', quantity: 1, unitPrice: 1850000, totalPrice: 1850000, stageId: st1.id },
  });
  const bi1_4 = await prisma.budgetItem.create({
    data: { number: '1.4', description: 'Replanteo', unit: 'gl', quantity: 1, unitPrice: 720000, totalPrice: 720000, stageId: st1.id },
  });

  // Items del capitulo 2 - Fundaciones
  const bi2_1 = await prisma.budgetItem.create({
    data: { number: '2.1', description: 'Excavación de bases', unit: 'm3', quantity: 85, unitPrice: 32000, totalPrice: 2720000, stageId: st2.id },
  });
  const bi2_2 = await prisma.budgetItem.create({
    data: { number: '2.2', description: 'Hormigón armado de fundación H21', unit: 'm3', quantity: 42, unitPrice: 185000, totalPrice: 7770000, stageId: st2.id },
  });
  const bi2_3 = await prisma.budgetItem.create({
    data: { number: '2.3', description: 'Impermeabilización de cimientos', unit: 'm2', quantity: 180, unitPrice: 11167, totalPrice: 2010060, stageId: st2.id },
  });

  // Items del capitulo 3 - Estructura
  const bi3_1 = await prisma.budgetItem.create({
    data: { number: '3.1', description: 'Columnas de H°A° PB (8 columnas)', unit: 'm3', quantity: 12, unitPrice: 295000, totalPrice: 3540000, stageId: st3.id },
  });
  const bi3_2 = await prisma.budgetItem.create({
    data: { number: '3.2', description: 'Losa de H°A° PB e=12cm', unit: 'm2', quantity: 220, unitPrice: 42000, totalPrice: 9240000, stageId: st3.id },
  });
  const bi3_3 = await prisma.budgetItem.create({
    data: { number: '3.3', description: 'Escalera de H°A°', unit: 'gl', quantity: 1, unitPrice: 2800000, totalPrice: 2800000, stageId: st3.id },
  });
  const bi3_4 = await prisma.budgetItem.create({
    data: { number: '3.4', description: 'Estructura PA (columnas + vigas + losa)', unit: 'm3', quantity: 28, unitPrice: 258000, totalPrice: 7224000, stageId: st3.id },
  });

  // Items del capitulo 4 - Mampostería
  const bi4_1 = await prisma.budgetItem.create({
    data: { number: '4.1', description: 'Pared exterior ladrillo hueco 18cm', unit: 'm2', quantity: 320, unitPrice: 18500, totalPrice: 5920000, stageId: st4.id },
  });
  const bi4_2 = await prisma.budgetItem.create({
    data: { number: '4.2', description: 'Tabique interior ladrillo hueco 12cm', unit: 'm2', quantity: 280, unitPrice: 13857, totalPrice: 3879960, stageId: st4.id },
  });

  // Items del capitulo 5 - Instalaciones
  const bi5_1 = await prisma.budgetItem.create({
    data: { number: '5.1', description: 'Instalación eléctrica completa', unit: 'gl', quantity: 1, unitPrice: 5800000, totalPrice: 5800000, stageId: st5.id },
  });
  const bi5_2 = await prisma.budgetItem.create({
    data: { number: '5.2', description: 'Instalación sanitaria (agua fría/caliente + cloacal)', unit: 'gl', quantity: 1, unitPrice: 4200000, totalPrice: 4200000, stageId: st5.id },
  });
  const bi5_3 = await prisma.budgetItem.create({
    data: { number: '5.3', description: 'Instalación de gas', unit: 'gl', quantity: 1, unitPrice: 1500000, totalPrice: 1500000, stageId: st5.id },
  });

  // Items del capitulo 6 - Techos
  const bi6_1 = await prisma.budgetItem.create({
    data: { number: '6.1', description: 'Estructura de techo (tirantería)', unit: 'm2', quantity: 130, unitPrice: 22000, totalPrice: 2860000, stageId: st6.id },
  });
  const bi6_2 = await prisma.budgetItem.create({
    data: { number: '6.2', description: 'Cubierta con membrana asfáltica', unit: 'm2', quantity: 130, unitPrice: 15000, totalPrice: 1950000, stageId: st6.id },
  });
  const bi6_3 = await prisma.budgetItem.create({
    data: { number: '6.3', description: 'Aislación térmica y canaletas', unit: 'gl', quantity: 1, unitPrice: 1390000, totalPrice: 1390000, stageId: st6.id },
  });

  // Items del capitulo 7 - Revoques
  const bi7_1 = await prisma.budgetItem.create({
    data: { number: '7.1', description: 'Revoque grueso exterior', unit: 'm2', quantity: 350, unitPrice: 6500, totalPrice: 2275000, stageId: st7.id },
  });
  const bi7_2 = await prisma.budgetItem.create({
    data: { number: '7.2', description: 'Revoque grueso y fino interior', unit: 'm2', quantity: 580, unitPrice: 4500, totalPrice: 2610000, stageId: st7.id },
  });
  const bi7_3 = await prisma.budgetItem.create({
    data: { number: '7.3', description: 'Contrapiso H°P° e=10cm', unit: 'm2', quantity: 220, unitPrice: 2680, totalPrice: 589600, stageId: st7.id },
  });

  // Items del capitulo 8 - Terminaciones
  const bi8_1 = await prisma.budgetItem.create({
    data: { number: '8.1', description: 'Pisos y revestimientos cerámicos', unit: 'm2', quantity: 280, unitPrice: 12000, totalPrice: 3360000, stageId: st8.id },
  });
  const bi8_2 = await prisma.budgetItem.create({
    data: { number: '8.2', description: 'Pintura interior y exterior', unit: 'm2', quantity: 700, unitPrice: 3200, totalPrice: 2240000, stageId: st8.id },
  });
  const bi8_3 = await prisma.budgetItem.create({
    data: { number: '8.3', description: 'Pileta de natación y solarium', unit: 'gl', quantity: 1, unitPrice: 1400000, totalPrice: 1400000, stageId: st8.id },
  });

  console.log('   ✅ 2 budget versions, 8 chapters, 24 items');

  // ============================================
  // FASE 2: APU - Análisis de Precios Unitarios
  // ============================================
  console.log('📐 Creating APU (unit price analyses)...');

  // APU para "Hormigón armado de fundación H21" (item 2.2)
  const apu1 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-00001',
      totalMaterials: 128100, totalLabor: 28800, totalTransport: 12750,
      totalEquipAmort: 4800, totalRepairs: 3200, totalFuel: 7350,
      totalDirect: 185000,
      budgetItemId: bi2_2.id, organizationId: org.id,
    },
  });

  // Materiales del APU 1 (Hormigón fundación)
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Hormigón elaborado H21', unit: 'm3', quantity: 1.05, unitCost: 105000, wastePct: 5, totalCost: 115762.50, priceAnalysisId: apu1.id },
      { description: 'Hierro ADN420 Ø12mm', unit: 'kg', quantity: 85, unitCost: 120, wastePct: 3, totalCost: 10506, priceAnalysisId: apu1.id },
      { description: 'Alambre de atar', unit: 'kg', quantity: 2.5, unitCost: 3500, wastePct: 0, totalCost: 8750, priceAnalysisId: apu1.id },
    ],
  });

  // Mano de obra del APU 1
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial Especializado', quantity: 2, hourlyRate: 4800, totalCost: 9600, priceAnalysisId: apu1.id },
      { category: 'Oficial', quantity: 2, hourlyRate: 4200, totalCost: 8400, priceAnalysisId: apu1.id },
      { category: 'Ayudante', quantity: 4, hourlyRate: 2700, totalCost: 10800, priceAnalysisId: apu1.id },
    ],
  });

  // Equipo del APU 1
  await prisma.analysisEquipment.createMany({
    data: [
      { description: 'Vibrador de inmersión', powerHp: 5, amortInterest: 600, repairsCost: 400, fuelCost: 350, lubricantsCost: 50, hoursUsed: 8, hourlyTotal: 1400, totalCost: 11200, section: 'D', priceAnalysisId: apu1.id },
      { description: 'Mixer descarga', powerHp: 250, amortInterest: 0, repairsCost: 0, fuelCost: 0, lubricantsCost: 0, hoursUsed: 4, hourlyTotal: 1050, totalCost: 4200, section: 'D', priceAnalysisId: apu1.id },
    ],
  });

  // Transporte del APU 1
  await prisma.analysisTransport.create({
    data: { description: 'Flete de hierros', unit: 'tn', quantity: 0.5, unitCost: 25500, totalCost: 12750, priceAnalysisId: apu1.id },
  });

  // APU para "Losa de H°A° PB" (item 3.2)
  const apu2 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-00002',
      totalMaterials: 24500, totalLabor: 9800, totalTransport: 2200,
      totalEquipAmort: 2000, totalRepairs: 1500, totalFuel: 2000,
      totalDirect: 42000,
      budgetItemId: bi3_2.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Hormigón elaborado H21', unit: 'm3', quantity: 0.13, unitCost: 165000, wastePct: 5, totalCost: 22522.50, priceAnalysisId: apu2.id },
      { description: 'Malla electrosoldada 15x15 Ø4.2', unit: 'm2', quantity: 1.1, unitCost: 1800, wastePct: 0, totalCost: 1980, priceAnalysisId: apu2.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial', quantity: 1, hourlyRate: 4200, totalCost: 4200, priceAnalysisId: apu2.id },
      { category: 'Medio Oficial', quantity: 1, hourlyRate: 3200, totalCost: 3200, priceAnalysisId: apu2.id },
      { category: 'Ayudante', quantity: 1, hourlyRate: 2400, totalCost: 2400, priceAnalysisId: apu2.id },
    ],
  });

  // APU para "Pared exterior 18cm" (item 4.1)
  const apu3 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-00003',
      totalMaterials: 10200, totalLabor: 7300, totalTransport: 1000,
      totalEquipAmort: 0, totalRepairs: 0, totalFuel: 0,
      totalDirect: 18500,
      budgetItemId: bi4_1.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Ladrillo hueco 18x18x33', unit: 'u', quantity: 16, unitCost: 280, wastePct: 5, totalCost: 4704, priceAnalysisId: apu3.id },
      { description: 'Cemento Portland', unit: 'kg', quantity: 12, unitCost: 178, wastePct: 3, totalCost: 2199.12, priceAnalysisId: apu3.id },
      { description: 'Arena gruesa', unit: 'm3', quantity: 0.022, unitCost: 48000, wastePct: 5, totalCost: 1108.80, priceAnalysisId: apu3.id },
      { description: 'Cal hidráulica', unit: 'kg', quantity: 6, unitCost: 168, wastePct: 3, totalCost: 1038.24, priceAnalysisId: apu3.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial', quantity: 1, hourlyRate: 4200, totalCost: 4200, priceAnalysisId: apu3.id },
      { category: 'Ayudante', quantity: 1, hourlyRate: 3100, totalCost: 3100, priceAnalysisId: apu3.id },
    ],
  });

  console.log('   ✅ 3 APUs with materials, labor, equipment, transport');

  // ============================================
  // FASE 3: AVANCE FÍSICO
  // ============================================
  console.log('📈 Creating item progress records...');
  const progressRecords = [
    // Cap 1 - Preliminares: 100% completado
    { budgetItemId: bi1_1.id, date: '2024-06-12', advance: 1.0 },
    { budgetItemId: bi1_2.id, date: '2024-06-12', advance: 1.0 },
    { budgetItemId: bi1_3.id, date: '2024-06-12', advance: 1.0 },
    { budgetItemId: bi1_4.id, date: '2024-06-12', advance: 1.0 },
    // Cap 2 - Fundaciones: 100%
    { budgetItemId: bi2_1.id, date: '2024-07-10', advance: 1.0 },
    { budgetItemId: bi2_2.id, date: '2024-07-10', advance: 1.0 },
    { budgetItemId: bi2_3.id, date: '2024-07-10', advance: 1.0 },
    // Cap 3 - Estructura: 100%
    { budgetItemId: bi3_1.id, date: '2024-09-08', advance: 1.0 },
    { budgetItemId: bi3_2.id, date: '2024-09-08', advance: 1.0 },
    { budgetItemId: bi3_3.id, date: '2024-09-08', advance: 1.0 },
    { budgetItemId: bi3_4.id, date: '2024-09-08', advance: 1.0 },
    // Cap 4 - Mampostería: 100%
    { budgetItemId: bi4_1.id, date: '2024-10-25', advance: 1.0 },
    { budgetItemId: bi4_2.id, date: '2024-10-25', advance: 1.0 },
    // Cap 5 - Instalaciones: parcial
    { budgetItemId: bi5_1.id, date: '2024-12-15', advance: 0.85 },
    { budgetItemId: bi5_2.id, date: '2024-12-15', advance: 0.70 },
    { budgetItemId: bi5_3.id, date: '2024-12-15', advance: 0.30 },
    // Cap 6 - Techos: parcial
    { budgetItemId: bi6_1.id, date: '2025-01-10', advance: 1.0 },
    { budgetItemId: bi6_2.id, date: '2025-01-10', advance: 0.50 },
    { budgetItemId: bi6_3.id, date: '2025-01-10', advance: 0.20 },
    // Cap 7 - Revoques: inicio
    { budgetItemId: bi7_1.id, date: '2025-01-20', advance: 0.20 },
    { budgetItemId: bi7_2.id, date: '2025-01-20', advance: 0.0 },
  ];
  for (const pr of progressRecords) {
    await prisma.itemProgress.create({
      data: {
        date: new Date(pr.date),
        advance: pr.advance,
        budgetItemId: pr.budgetItemId,
        registeredById: supervisor.id,
      },
    });
  }
  console.log(`   ✅ ${progressRecords.length} progress records`);

  // ============================================
  // FASE 4: CERTIFICACIONES
  // ============================================
  console.log('📜 Creating certificates...');

  // Certificado 1 - Jun-Jul 2024 (APPROVED)
  const cert1 = await prisma.certificate.create({
    data: {
      code: 'CERT-2024-00001', number: 1, status: CertificateStatus.APPROVED,
      periodStart: new Date('2024-06-01'), periodEnd: new Date('2024-07-31'),
      subtotal: 17350000, acopioPct: 0.05, acopioAmount: 867500,
      anticipoPct: 0.20, anticipoAmount: 3470000,
      fondoReparoPct: 0.05, fondoReparoAmount: 867500,
      adjustmentFactor: 1.0, ivaPct: 0.21, ivaAmount: 2550750,
      totalAmount: 14695750,
      submittedAt: new Date('2024-08-05'), approvedAt: new Date('2024-08-10'), approvedById: pmMaria.id,
      budgetVersionId: bv2.id, projectId: project1.id, organizationId: org.id,
    },
  });

  // Items del cert 1 (solo items con avance en el período)
  await prisma.certificateItem.createMany({
    data: [
      { itemNumber: '1.1', description: 'Limpieza y nivelación del terreno', unit: 'm2', quantity: 450, unitPrice: 2800, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 1260000, totalAdvance: 1.0, totalAmount: 1260000, certificateId: cert1.id, budgetItemId: bi1_1.id },
      { itemNumber: '1.2', description: 'Cerco perimetral de obra', unit: 'ml', quantity: 120, unitPrice: 8500, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 1020000, totalAdvance: 1.0, totalAmount: 1020000, certificateId: cert1.id, budgetItemId: bi1_2.id },
      { itemNumber: '1.3', description: 'Obrador y conexiones provisorias', unit: 'gl', quantity: 1, unitPrice: 1850000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 1850000, totalAdvance: 1.0, totalAmount: 1850000, certificateId: cert1.id, budgetItemId: bi1_3.id },
      { itemNumber: '1.4', description: 'Replanteo', unit: 'gl', quantity: 1, unitPrice: 720000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 720000, totalAdvance: 1.0, totalAmount: 720000, certificateId: cert1.id, budgetItemId: bi1_4.id },
      { itemNumber: '2.1', description: 'Excavación de bases', unit: 'm3', quantity: 85, unitPrice: 32000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 2720000, totalAdvance: 1.0, totalAmount: 2720000, certificateId: cert1.id, budgetItemId: bi2_1.id },
      { itemNumber: '2.2', description: 'Hormigón armado de fundación H21', unit: 'm3', quantity: 42, unitPrice: 185000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 7770000, totalAdvance: 1.0, totalAmount: 7770000, certificateId: cert1.id, budgetItemId: bi2_2.id },
      { itemNumber: '2.3', description: 'Impermeabilización de cimientos', unit: 'm2', quantity: 180, unitPrice: 11167, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 2010060, totalAdvance: 1.0, totalAmount: 2010060, certificateId: cert1.id, budgetItemId: bi2_3.id },
    ],
  });

  // Certificado 2 - Ago-Sep 2024 (APPROVED)
  const cert2 = await prisma.certificate.create({
    data: {
      code: 'CERT-2024-00002', number: 2, status: CertificateStatus.APPROVED,
      periodStart: new Date('2024-08-01'), periodEnd: new Date('2024-09-30'),
      subtotal: 22804000, acopioPct: 0.05, acopioAmount: 1140200,
      anticipoPct: 0.20, anticipoAmount: 4560800,
      fondoReparoPct: 0.05, fondoReparoAmount: 1140200,
      adjustmentFactor: 1.0, ivaPct: 0.21, ivaAmount: 3352788,
      totalAmount: 19315388,
      submittedAt: new Date('2024-10-05'), approvedAt: new Date('2024-10-12'), approvedById: pmMaria.id,
      budgetVersionId: bv2.id, projectId: project1.id, organizationId: org.id,
    },
  });

  await prisma.certificateItem.createMany({
    data: [
      { itemNumber: '3.1', description: 'Columnas de H°A° PB', unit: 'm3', quantity: 12, unitPrice: 295000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 3540000, totalAdvance: 1.0, totalAmount: 3540000, certificateId: cert2.id, budgetItemId: bi3_1.id },
      { itemNumber: '3.2', description: 'Losa de H°A° PB', unit: 'm2', quantity: 220, unitPrice: 42000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 9240000, totalAdvance: 1.0, totalAmount: 9240000, certificateId: cert2.id, budgetItemId: bi3_2.id },
      { itemNumber: '3.3', description: 'Escalera de H°A°', unit: 'gl', quantity: 1, unitPrice: 2800000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 2800000, totalAdvance: 1.0, totalAmount: 2800000, certificateId: cert2.id, budgetItemId: bi3_3.id },
      { itemNumber: '3.4', description: 'Estructura PA', unit: 'm3', quantity: 28, unitPrice: 258000, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 7224000, totalAdvance: 1.0, totalAmount: 7224000, certificateId: cert2.id, budgetItemId: bi3_4.id },
    ],
  });

  // Certificado 3 - Oct-Nov 2024 (DRAFT - en preparación)
  const cert3 = await prisma.certificate.create({
    data: {
      code: 'CERT-2024-00003', number: 3, status: CertificateStatus.DRAFT,
      periodStart: new Date('2024-10-01'), periodEnd: new Date('2024-11-30'),
      subtotal: 14730000, acopioPct: 0.05, acopioAmount: 736500,
      anticipoPct: 0.20, anticipoAmount: 2946000,
      fondoReparoPct: 0.05, fondoReparoAmount: 736500,
      adjustmentFactor: 1.045, ivaPct: 0.21, ivaAmount: 2269253,
      totalAmount: 13080253,
      budgetVersionId: bv2.id, projectId: project1.id, organizationId: org.id,
    },
  });

  await prisma.certificateItem.createMany({
    data: [
      { itemNumber: '4.1', description: 'Pared exterior ladrillo hueco 18cm', unit: 'm2', quantity: 320, unitPrice: 18500, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 5920000, totalAdvance: 1.0, totalAmount: 5920000, certificateId: cert3.id, budgetItemId: bi4_1.id },
      { itemNumber: '4.2', description: 'Tabique interior ladrillo hueco 12cm', unit: 'm2', quantity: 280, unitPrice: 13857, previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 3879960, totalAdvance: 1.0, totalAmount: 3879960, certificateId: cert3.id, budgetItemId: bi4_2.id },
      { itemNumber: '5.1', description: 'Instalación eléctrica completa', unit: 'gl', quantity: 1, unitPrice: 5800000, previousAdvance: 0, previousAmount: 0, currentAdvance: 0.85, currentAmount: 4930000, totalAdvance: 0.85, totalAmount: 4930000, certificateId: cert3.id, budgetItemId: bi5_1.id },
    ],
  });

  console.log('   ✅ 3 certificates (2 approved, 1 draft) with 14 items');

  // ============================================
  // FASE 5: SUBCONTRATACIONES
  // ============================================
  console.log('🤝 Creating subcontracts...');

  const sub1 = await prisma.subcontract.create({
    data: {
      code: 'SUB-2024-00001',
      name: 'Instalación de Ascensor',
      description: 'Provisión e instalación de ascensor para 4 personas, recorrido PB-PA',
      status: SubcontractStatus.ACTIVE,
      contractorName: 'Ascensores Roca S.A.',
      contractorCuit: '30-61234567-8',
      contactEmail: 'comercial@ascensoresroca.com.ar',
      contactPhone: '+54 11 4555-1200',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-04-15'),
      totalAmount: 18500000,
      projectId: project1.id,
      organizationId: org.id,
    },
  });

  const subItem1 = await prisma.subcontractItem.create({
    data: {
      description: 'Cabina de ascensor con puerta automática',
      unit: 'gl', quantity: 1, unitPrice: 12000000, totalPrice: 12000000,
      subcontractId: sub1.id,
    },
  });
  const subItem2 = await prisma.subcontractItem.create({
    data: {
      description: 'Instalación electromecánica completa',
      unit: 'gl', quantity: 1, unitPrice: 4500000, totalPrice: 4500000,
      subcontractId: sub1.id,
    },
  });
  const subItem3 = await prisma.subcontractItem.create({
    data: {
      description: 'Puertas de piso (2 paradas)',
      unit: 'u', quantity: 2, unitPrice: 1000000, totalPrice: 2000000,
      subcontractId: sub1.id,
    },
  });

  // Certificado del subcontratista - APPROVED
  const subCert1 = await prisma.subcontractCertificate.create({
    data: {
      code: 'SUBCERT-2025-00001', number: 1, status: CertificateStatus.APPROVED,
      periodStart: new Date('2025-01-15'), periodEnd: new Date('2025-02-15'),
      subtotal: 3600000, totalAmount: 3600000,
      approvedAt: new Date('2025-02-20'), approvedById: pmMaria.id,
      subcontractId: sub1.id, organizationId: org.id,
    },
  });
  await prisma.subcontractCertificateItem.createMany({
    data: [
      { description: 'Cabina de ascensor', unit: 'gl', quantity: 1, unitPrice: 12000000, previousAdvance: 0, currentAdvance: 0.20, currentAmount: 2400000, totalAdvance: 0.20, totalAmount: 2400000, certificateId: subCert1.id, subcontractItemId: subItem1.id },
      { description: 'Instalación electromecánica', unit: 'gl', quantity: 1, unitPrice: 4500000, previousAdvance: 0, currentAdvance: 0.15, currentAmount: 675000, totalAdvance: 0.15, totalAmount: 675000, certificateId: subCert1.id, subcontractItemId: subItem2.id },
      { description: 'Puertas de piso', unit: 'u', quantity: 2, unitPrice: 1000000, previousAdvance: 0, currentAdvance: 0.25, currentAmount: 500000, totalAdvance: 0.25, totalAmount: 500000, certificateId: subCert1.id, subcontractItemId: subItem3.id },
    ],
  });

  // Segunda subcontratación - Carpintería
  const sub2 = await prisma.subcontract.create({
    data: {
      code: 'SUB-2024-00002',
      name: 'Carpintería de Aluminio',
      description: 'Provisión y colocación de aberturas de aluminio línea Modena',
      status: SubcontractStatus.DRAFT,
      contractorName: 'Aluminios del Plata S.R.L.',
      contractorCuit: '30-71234567-9',
      contactEmail: 'info@aluminiosdelplata.com.ar',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-04-30'),
      totalAmount: 8200000,
      projectId: project1.id,
      organizationId: org.id,
    },
  });

  await prisma.subcontractItem.createMany({
    data: [
      { description: 'Ventana corrediza 1.50x1.20m DVH', unit: 'u', quantity: 8, unitPrice: 450000, totalPrice: 3600000, subcontractId: sub2.id },
      { description: 'Puerta balcón corrediza 2.00x2.10m DVH', unit: 'u', quantity: 3, unitPrice: 850000, totalPrice: 2550000, subcontractId: sub2.id },
      { description: 'Ventana banderola 0.60x0.40m', unit: 'u', quantity: 4, unitPrice: 185000, totalPrice: 740000, subcontractId: sub2.id },
      { description: 'Puerta de entrada aluminio reforzado', unit: 'u', quantity: 1, unitPrice: 1310000, totalPrice: 1310000, subcontractId: sub2.id },
    ],
  });

  console.log('   ✅ 2 subcontracts (1 active + 1 draft), 7 items, 1 certificate');

  // ============================================
  // FASE 6: REDETERMINACIÓN DE PRECIOS
  // ============================================
  console.log('📊 Creating price indices and adjustment formulas...');

  const idxMO = await prisma.priceIndex.create({
    data: { name: 'Mano de Obra UOCRA', code: 'MO-UOCRA', source: 'INDEC / UOCRA', organizationId: org.id },
  });
  const idxMAT = await prisma.priceIndex.create({
    data: { name: 'Materiales de Construcción', code: 'MAT-ICC', source: 'INDEC - ICC', organizationId: org.id },
  });
  const idxEQ = await prisma.priceIndex.create({
    data: { name: 'Equipos Viales y Construcción', code: 'EQ-VIAL', source: 'CAC', organizationId: org.id },
  });
  const idxCOMB = await prisma.priceIndex.create({
    data: { name: 'Combustibles Gasoil', code: 'COMB-GO', source: 'Sec. Energía', organizationId: org.id },
  });

  // Valores de índices: base junio 2024 = 1000 con evolución mensual
  const indexValuesData = [
    { idx: idxMO.id,   values: [{ d: '2024-06-01', v: 1000 }, { d: '2024-07-01', v: 1025 }, { d: '2024-08-01', v: 1055 }, { d: '2024-09-01', v: 1090 }, { d: '2024-10-01', v: 1130 }, { d: '2024-11-01', v: 1175 }, { d: '2024-12-01', v: 1220 }, { d: '2025-01-01', v: 1270 }] },
    { idx: idxMAT.id,  values: [{ d: '2024-06-01', v: 1000 }, { d: '2024-07-01', v: 1018 }, { d: '2024-08-01', v: 1040 }, { d: '2024-09-01', v: 1065 }, { d: '2024-10-01', v: 1085 }, { d: '2024-11-01', v: 1105 }, { d: '2024-12-01', v: 1128 }, { d: '2025-01-01', v: 1155 }] },
    { idx: idxEQ.id,   values: [{ d: '2024-06-01', v: 1000 }, { d: '2024-07-01', v: 1010 }, { d: '2024-08-01', v: 1022 }, { d: '2024-09-01', v: 1038 }, { d: '2024-10-01', v: 1055 }, { d: '2024-11-01', v: 1070 }, { d: '2024-12-01', v: 1088 }, { d: '2025-01-01', v: 1110 }] },
    { idx: idxCOMB.id, values: [{ d: '2024-06-01', v: 1000 }, { d: '2024-07-01', v: 1035 }, { d: '2024-08-01', v: 1065 }, { d: '2024-09-01', v: 1100 }, { d: '2024-10-01', v: 1140 }, { d: '2024-11-01', v: 1180 }, { d: '2024-12-01', v: 1225 }, { d: '2025-01-01', v: 1275 }] },
  ];
  for (const idx of indexValuesData) {
    for (const v of idx.values) {
      await prisma.priceIndexValue.create({
        data: { date: new Date(v.d), value: v.v, priceIndexId: idx.idx },
      });
    }
  }

  // Fórmula polinómica para el proyecto
  const formula1 = await prisma.adjustmentFormula.create({
    data: {
      name: 'Fórmula Tipo - Vivienda Unifamiliar',
      budgetVersionId: bv2.id,
      organizationId: org.id,
      weights: {
        create: [
          { component: 'Mano de Obra', weight: 0.35, priceIndexId: idxMO.id },
          { component: 'Materiales', weight: 0.30, priceIndexId: idxMAT.id },
          { component: 'Equipos', weight: 0.20, priceIndexId: idxEQ.id },
          { component: 'Combustibles', weight: 0.15, priceIndexId: idxCOMB.id },
        ],
      },
    },
  });

  console.log('   ✅ 4 price indices with 32 monthly values, 1 adjustment formula');

  // ============================================
  // PROYECTO RED CLOACAL ZONA 1 (datos reales)
  // ============================================
  console.log('🚰 Creating Red Cloacal Zona 1 project...');

  const projectCloacal = await prisma.project.create({
    data: {
      name: 'Red Cloacal Zona 1 - Barrio San Martín',
      code: 'OBR-2025-00005',
      description: 'Construcción de red cloacal colector principal DN630 PEAD con bocas de registro, cruce de arroyo y empalmes. Licitación pública Provincia de Buenos Aires.',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2025-03-01'),
      estimatedEndDate: new Date('2025-09-30'),
      address: 'Barrio San Martín, Partido de Quilmes',
      city: 'Quilmes',
      province: 'Buenos Aires',
      estimatedBudget: new Prisma.Decimal('2704649382.79'),
      currentSpent: new Prisma.Decimal('17895972.18'),
      progress: 1,
      managerId: pmMaria.id,
      organizationId: org.id,
    },
  });

  console.log('   ✅ Proyecto Red Cloacal creado');

  // --- BudgetVersion Red Cloacal ---
  console.log('📐 Creating budget version Red Cloacal (K=1.5863)...');

  const bvCloacal = await prisma.budgetVersion.create({
    data: {
      code: 'PRES-2025-00003',
      name: 'Presupuesto Oferta Zona 1 - Red Cloacal',
      description: 'Presupuesto de oferta licitación pública - Colector cloacal DN630 PEAD',
      version: 1,
      status: BudgetVersionStatus.APPROVED,
      approvedAt: new Date('2025-02-20'),
      approvedById: pmMaria.id,
      gastosGeneralesPct: 0.15,     // 15%
      beneficioPct: 0.10,           // 10% sobre C
      gastosFinancierosPct: 0.04,   // 4% sobre C
      ivaPct: 0.21,                 // 21% sobre W
      coeficienteK: 1.5863,
      totalCostoCosto: 1705004969.30,
      totalPrecio: 2704649382.79,
      projectId: projectCloacal.id,
      organizationId: org.id,
    },
  });

  // --- Categorías (Rubros) ---
  const catA = await prisma.budgetCategory.create({
    data: {
      number: 1, name: 'Trabajos Preliminares', description: 'Rubro A: Cartel, proyecto ejecutivo, replanteo',
      order: 1, subtotalCostoCosto: 17895972.18, budgetVersionId: bvCloacal.id,
    },
  });
  const stA = await prisma.budgetStage.create({
    data: { number: 'A', description: 'Trabajos Preliminares', unit: 'gl', quantity: 1, unitPrice: 17895972.18, totalPrice: 17895972.18, categoryId: catA.id },
  });

  const catB = await prisma.budgetCategory.create({
    data: {
      number: 2, name: 'Colector Cloacal', description: 'Rubro B: Excavación, cañerías PEAD, bocas de registro, empalmes, cruce arroyo',
      order: 2, subtotalCostoCosto: 1664108852.13, budgetVersionId: bvCloacal.id,
    },
  });
  const stB1 = await prisma.budgetStage.create({
    data: { number: 'B.1', description: 'Excavación', unit: 'gl', quantity: 1, unitPrice: 679441206.27, totalPrice: 679441206.27, categoryId: catB.id },
  });
  const stB2 = await prisma.budgetStage.create({
    data: { number: 'B.2', description: 'Cañería PEAD DN630 PN6', unit: 'ml', quantity: 2773.02, unitPrice: 266395.53, totalPrice: 738720133.93, categoryId: catB.id },
  });
  const stB3 = await prisma.budgetStage.create({
    data: { number: 'B.3', description: 'Bocas de Registro', unit: 'gl', quantity: 1, unitPrice: 171656820.80, totalPrice: 171656820.80, categoryId: catB.id },
  });
  const stB4 = await prisma.budgetStage.create({
    data: { number: 'B.4', description: 'Empalmes', unit: 'ud', quantity: 2, unitPrice: 246553.33, totalPrice: 493106.66, categoryId: catB.id },
  });
  const stB5 = await prisma.budgetStage.create({
    data: { number: 'B.5', description: 'Cruce Especial Arroyo', unit: 'gl', quantity: 1, unitPrice: 73797584.47, totalPrice: 73797584.47, categoryId: catB.id },
  });

  const catC = await prisma.budgetCategory.create({
    data: {
      number: 3, name: 'Higiene y Seguridad', description: 'Rubro C: EPP, señalización, profesional SyH',
      order: 3, subtotalCostoCosto: 23000144.99, budgetVersionId: bvCloacal.id,
    },
  });
  const stC = await prisma.budgetStage.create({
    data: { number: 'C', description: 'Higiene y Seguridad', unit: 'gl', quantity: 1, unitPrice: 23000144.99, totalPrice: 23000144.99, categoryId: catC.id },
  });

  // --- Items Rubro A ---
  const biA1 = await prisma.budgetItem.create({
    data: { number: 'A.1', description: 'Cartel de obra', unit: 'gl', quantity: 1, unitPrice: 2074341.00, totalPrice: 2074341.00, stageId: stA.id },
  });
  const biA2 = await prisma.budgetItem.create({
    data: { number: 'A.2', description: 'Proyecto Ejecutivo', unit: 'gl', quantity: 1, unitPrice: 8820055.60, totalPrice: 8820055.60, stageId: stA.id },
  });
  const biA3 = await prisma.budgetItem.create({
    data: { number: 'A.3', description: 'Replanteo de obra', unit: 'gl', quantity: 1, unitPrice: 7001575.58, totalPrice: 7001575.58, stageId: stA.id },
  });

  // --- Items Rubro B ---
  const biB11 = await prisma.budgetItem.create({
    data: { number: 'B.1.1', description: 'Excavación a cielo abierto hasta 2,5m con depresión', unit: 'm3', quantity: 2429.53, unitPrice: 69226.39, totalPrice: 168187587.53, stageId: stB1.id },
  });
  const biB12 = await prisma.budgetItem.create({
    data: { number: 'B.1.2', description: 'Excavación a cielo abierto entre 2,50m y 4,00m con depresión', unit: 'm3', quantity: 5711.75, unitPrice: 89509.10, totalPrice: 511253618.74, stageId: stB1.id },
  });
  const biB21 = await prisma.budgetItem.create({
    data: { number: 'B.2.1', description: 'Provisión y colocación cañería PEAD DN630 PN6', unit: 'ml', quantity: 2773.02, unitPrice: 266395.53, totalPrice: 738720133.93, stageId: stB2.id },
  });
  const biB31 = await prisma.budgetItem.create({
    data: { number: 'B.3.1', description: 'Bocas de registro (BR) hasta 2,50m', unit: 'ud', quantity: 9, unitPrice: 5355437.87, totalPrice: 48198940.87, stageId: stB3.id },
  });
  const biB32 = await prisma.budgetItem.create({
    data: { number: 'B.3.2', description: 'Bocas de registro (BR) entre 2,50m y 4,00m', unit: 'ud', quantity: 18, unitPrice: 5677575.52, totalPrice: 102196359.28, stageId: stB3.id },
  });
  const biB33 = await prisma.budgetItem.create({
    data: { number: 'B.3.3', description: 'Boca de Registro especial cañería DN630 en Av. Yrigoyen', unit: 'ud', quantity: 1, unitPrice: 21261520.65, totalPrice: 21261520.65, stageId: stB3.id },
  });
  const biB41 = await prisma.budgetItem.create({
    data: { number: 'B.4.1', description: 'Empalme DN160 a colector DN630', unit: 'ud', quantity: 2, unitPrice: 246553.33, totalPrice: 493106.66, stageId: stB4.id },
  });
  const biB51 = await prisma.budgetItem.create({
    data: { number: 'B.5.1', description: 'Cruce especial Arroyo Seco', unit: 'gl', quantity: 1, unitPrice: 73797584.47, totalPrice: 73797584.47, stageId: stB5.id },
  });

  // --- Items Rubro C ---
  const biC1 = await prisma.budgetItem.create({
    data: { number: 'C.1', description: 'Higiene y Seguridad', unit: 'gl', quantity: 1, unitPrice: 23000144.99, totalPrice: 23000144.99, stageId: stC.id },
  });

  console.log('   ✅ 1 budget version, 3 categories, 8 stages, 12 items');

  // --- APU para items clave ---
  console.log('🔬 Creating APUs Red Cloacal...');

  // APU A.3 - Replanteo
  const apuA3 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-RC-001',
      totalMaterials: 5574400.00, totalLabor: 1427131.44, totalTransport: 0,
      totalEquipAmort: 0, totalRepairs: 0, totalFuel: 0,
      totalDirect: 7001531.44,
      budgetItemId: biA3.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Estacas de madera 5×5×50cm', unit: 'ud', quantity: 300, unitCost: 850, wastePct: 0, totalCost: 255000, priceAnalysisId: apuA3.id },
      { description: 'Mojones de hormigón 15×15×60cm', unit: 'ud', quantity: 30, unitCost: 3500, wastePct: 0, totalCost: 105000, priceAnalysisId: apuA3.id },
      { description: 'Agrimensor', unit: 'gl', quantity: 1, unitCost: 2500000, wastePct: 0, totalCost: 2500000, priceAnalysisId: apuA3.id },
      { description: 'Equipo topográfico', unit: 'gl', quantity: 1, unitCost: 2500000, wastePct: 0, totalCost: 2500000, priceAnalysisId: apuA3.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial Especializado', quantity: 40, hourlyRate: 11710.37, totalCost: 468414.80, priceAnalysisId: apuA3.id },
      { category: 'Ayudante', quantity: 112, hourlyRate: 8559.97, totalCost: 958716.64, priceAnalysisId: apuA3.id },
    ],
  });

  // APU B.1.1 - Excavación ≤2.5m
  const apuB11 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-RC-002',
      totalMaterials: 24750.00, totalLabor: 9189.49, totalTransport: 0,
      totalEquipAmort: 14288.60, totalRepairs: 6508.53, totalFuel: 16343.60,
      totalDirect: 71080.22,
      budgetItemId: biB11.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Granza 6/19 (cama asiento caño)', unit: 'm³', quantity: 0.110, unitCost: 25000, wastePct: 0, totalCost: 2750, priceAnalysisId: apuB11.id },
      { description: 'Suelo seleccionado cantera (50% recambio)', unit: 'm³', quantity: 1.100, unitCost: 20000, wastePct: 0, totalCost: 22000, priceAnalysisId: apuB11.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial Especializado', quantity: 0.16, hourlyRate: 11710.37, totalCost: 1873.66, priceAnalysisId: apuB11.id },
      { category: 'Oficial', quantity: 0.32, hourlyRate: 10022.01, totalCost: 3207.04, priceAnalysisId: apuB11.id },
      { category: 'Ayudante', quantity: 0.48, hourlyRate: 8559.97, totalCost: 4108.79, priceAnalysisId: apuB11.id },
    ],
  });
  await prisma.analysisEquipment.createMany({
    data: [
      { description: 'Retroexcavadora A', powerHp: 120, amortInterest: 28224, repairsCost: 21168, fuelCost: 31928.89, lubricantsCost: 7982.22, hoursUsed: 0.16, hourlyTotal: 89303.11, totalCost: 4515.84, section: 'D', priceAnalysisId: apuB11.id },
      { description: 'Camión volcador A', powerHp: 150, amortInterest: 8624, repairsCost: 6468, fuelCost: 39911.11, lubricantsCost: 9977.78, hoursUsed: 0.13, hourlyTotal: 64980.89, totalCost: 1121.12, section: 'D', priceAnalysisId: apuB11.id },
      { description: 'Motoniveladora A', powerHp: 120, amortInterest: 23520, repairsCost: 17640, fuelCost: 31928.89, lubricantsCost: 7982.22, hoursUsed: 0.08, hourlyTotal: 81071.11, totalCost: 1881.60, section: 'D', priceAnalysisId: apuB11.id },
      { description: 'Compactador manual', powerHp: 7, amortInterest: 1128.96, repairsCost: 846.72, fuelCost: 1862.52, lubricantsCost: 465.63, hoursUsed: 0.12, hourlyTotal: 4303.83, totalCost: 135.48, section: 'D', priceAnalysisId: apuB11.id },
      { description: 'Sistema depresión napas WELL-POINT', amortInterest: 4266.67, repairsCost: 3200, fuelCost: 0, lubricantsCost: 0, hoursUsed: 0.24, hourlyTotal: 7466.67, totalCost: 1024.00, section: 'D', priceAnalysisId: apuB11.id },
      { description: 'Sistema entibado (alquiler)', amortInterest: 28052.81, repairsCost: 0, fuelCost: 0, lubricantsCost: 0, hoursUsed: 0.20, hourlyTotal: 28052.81, totalCost: 5610.56, section: 'D', priceAnalysisId: apuB11.id },
    ],
  });

  // APU B.2.1 - Cañería PEAD DN630
  const apuB21 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-RC-003',
      totalMaterials: 188951.24, totalLabor: 8090.03, totalTransport: 0,
      totalEquipAmort: 8953.62, totalRepairs: 3348.88, totalFuel: 1862.52,
      totalDirect: 211206.29,
      budgetItemId: biB21.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Caño PEAD DN 630 PN 6', unit: 'ml', quantity: 1.000, unitCost: 239396.85, wastePct: 0, totalCost: 239396.85, priceAnalysisId: apuB21.id },
      { description: 'Arena fina cama asiento (10cm)', unit: 'm³', quantity: 0.110, unitCost: 25000, wastePct: 0, totalCost: 2750, priceAnalysisId: apuB21.id },
      { description: 'Arena fina cobertura (20cm)', unit: 'm³', quantity: 0.220, unitCost: 25000, wastePct: 0, totalCost: 5500, priceAnalysisId: apuB21.id },
      { description: 'Film polietileno (protección)', unit: 'm²', quantity: 1.200, unitCost: 850, wastePct: 0, totalCost: 1020, priceAnalysisId: apuB21.id },
      { description: 'Manguito empotramiento DN630', unit: 'ud', quantity: 0.022, unitCost: 95000, wastePct: 0, totalCost: 2128, priceAnalysisId: apuB21.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial Especializado', quantity: 0.320, hourlyRate: 11710.37, totalCost: 3747.32, priceAnalysisId: apuB21.id },
      { category: 'Oficial', quantity: 0.160, hourlyRate: 10022.01, totalCost: 1603.52, priceAnalysisId: apuB21.id },
      { category: 'Ayudante', quantity: 0.320, hourlyRate: 8559.97, totalCost: 2739.19, priceAnalysisId: apuB21.id },
    ],
  });
  await prisma.analysisEquipment.createMany({
    data: [
      { description: 'Equipo termofusión a tope', amortInterest: 3371.20, repairsCost: 2528.40, fuelCost: 0, lubricantsCost: 0, hoursUsed: 1.0, hourlyTotal: 5899.60, totalCost: 3371.20, section: 'D', priceAnalysisId: apuB21.id },
      { description: 'Generador', powerHp: 35, amortInterest: 2133.33, repairsCost: 1600, fuelCost: 9312.59, lubricantsCost: 2328.15, hoursUsed: 0.16, hourlyTotal: 15374.07, totalCost: 341.33, section: 'D', priceAnalysisId: apuB21.id },
      { description: 'Debeader automático DN630', amortInterest: 4704, repairsCost: 3528, fuelCost: 0, lubricantsCost: 0, hoursUsed: 0.16, hourlyTotal: 8232, totalCost: 752.64, section: 'D', priceAnalysisId: apuB21.id },
      { description: 'Sistema entibado (alquiler)', amortInterest: 28052.81, repairsCost: 0, fuelCost: 0, lubricantsCost: 0, hoursUsed: 0.16, hourlyTotal: 28052.81, totalCost: 4488.45, section: 'D', priceAnalysisId: apuB21.id },
    ],
  });

  // APU B.3.1 - Bocas de registro ≤2.5m
  const apuB31 = await prisma.priceAnalysis.create({
    data: {
      code: 'APU-RC-004',
      totalMaterials: 1986907.00, totalLabor: 918948.80, totalTransport: 0,
      totalEquipAmort: 1254071.68, totalRepairs: 501088.00, totalFuel: 851436.96,
      totalDirect: 5498852.44,
      budgetItemId: biB31.id, organizationId: org.id,
    },
  });
  await prisma.analysisMaterial.createMany({
    data: [
      { description: 'Bocas de registro prefabricada hasta 2,50m', unit: 'ud', quantity: 1, unitCost: 1974407, wastePct: 0, totalCost: 1974407, priceAnalysisId: apuB31.id },
      { description: 'Arena fina base', unit: 'm³', quantity: 0.5, unitCost: 25000, wastePct: 0, totalCost: 12500, priceAnalysisId: apuB31.id },
    ],
  });
  await prisma.analysisLabor.createMany({
    data: [
      { category: 'Oficial Especializado', quantity: 16, hourlyRate: 11710.37, totalCost: 187365.92, priceAnalysisId: apuB31.id },
      { category: 'Oficial', quantity: 32, hourlyRate: 10022.01, totalCost: 320704.32, priceAnalysisId: apuB31.id },
      { category: 'Ayudante', quantity: 48, hourlyRate: 8559.97, totalCost: 410878.56, priceAnalysisId: apuB31.id },
    ],
  });
  await prisma.analysisEquipment.createMany({
    data: [
      { description: 'Camión con Grúa', powerHp: 200, amortInterest: 20384, repairsCost: 15288, fuelCost: 53214.81, lubricantsCost: 13303.70, hoursUsed: 10, hourlyTotal: 102190.51, totalCost: 203840, section: 'D', priceAnalysisId: apuB31.id },
      { description: 'Retroexcavadora A', powerHp: 120, amortInterest: 28224, repairsCost: 21168, fuelCost: 31928.89, lubricantsCost: 7982.22, hoursUsed: 10, hourlyTotal: 89303.11, totalCost: 282240, section: 'D', priceAnalysisId: apuB31.id },
      { description: 'Sistema depresión napas WELL-POINT', amortInterest: 4266.67, repairsCost: 3200, fuelCost: 0, lubricantsCost: 0, hoursUsed: 16, hourlyTotal: 7466.67, totalCost: 68266.72, section: 'D', priceAnalysisId: apuB31.id },
      { description: 'Equipos menores y herramientas', amortInterest: 15680, repairsCost: 11760, fuelCost: 0, lubricantsCost: 0, hoursUsed: 16, hourlyTotal: 27440, totalCost: 250880, section: 'D', priceAnalysisId: apuB31.id },
      { description: 'Sistema entibado (alquiler)', amortInterest: 28052.81, repairsCost: 0, fuelCost: 0, lubricantsCost: 0, hoursUsed: 16, hourlyTotal: 28052.81, totalCost: 448844.96, section: 'D', priceAnalysisId: apuB31.id },
    ],
  });

  console.log('   ✅ 4 APUs (replanteo, excavación, cañería PEAD, bocas de registro)');

  // --- Certificado Nº1 Red Cloacal (Rubro A completo) ---
  console.log('📜 Creating certificate Red Cloacal...');

  const certCloacal1 = await prisma.certificate.create({
    data: {
      code: 'CERT-2025-00004', number: 1, status: CertificateStatus.APPROVED,
      periodStart: new Date('2025-03-01'), periodEnd: new Date('2025-03-31'),
      subtotal: 17895972.18,
      acopioPct: 0.00, acopioAmount: 0,
      anticipoPct: 0.10, anticipoAmount: 1789597.22,
      fondoReparoPct: 0.05, fondoReparoAmount: 894798.61,
      adjustmentFactor: 1.0,
      ivaPct: 0.21, ivaAmount: 3194431.28,
      totalAmount: 18406007.63,
      submittedAt: new Date('2025-04-05'), approvedAt: new Date('2025-04-10'), approvedById: pmMaria.id,
      budgetVersionId: bvCloacal.id, projectId: projectCloacal.id, organizationId: org.id,
    },
  });
  await prisma.certificateItem.createMany({
    data: [
      { itemNumber: 'A.1', description: 'Cartel de obra', unit: 'gl', quantity: 1, unitPrice: 2074341.00,
        previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 2074341.00,
        totalAdvance: 1.0, totalAmount: 2074341.00,
        certificateId: certCloacal1.id, budgetItemId: biA1.id },
      { itemNumber: 'A.2', description: 'Proyecto Ejecutivo', unit: 'gl', quantity: 1, unitPrice: 8820055.60,
        previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 8820055.60,
        totalAdvance: 1.0, totalAmount: 8820055.60,
        certificateId: certCloacal1.id, budgetItemId: biA2.id },
      { itemNumber: 'A.3', description: 'Replanteo de obra', unit: 'gl', quantity: 1, unitPrice: 7001575.58,
        previousAdvance: 0, previousAmount: 0, currentAdvance: 1.0, currentAmount: 7001575.58,
        totalAdvance: 1.0, totalAmount: 7001575.58,
        certificateId: certCloacal1.id, budgetItemId: biA3.id },
    ],
  });

  // Certificado Nº2 - Inicio excavaciones (DRAFT)
  const certCloacal2 = await prisma.certificate.create({
    data: {
      code: 'CERT-2025-00005', number: 2, status: CertificateStatus.DRAFT,
      periodStart: new Date('2025-04-01'), periodEnd: new Date('2025-04-30'),
      subtotal: 37259754.20,
      acopioPct: 0.00, acopioAmount: 0,
      anticipoPct: 0.10, anticipoAmount: 3725975.42,
      fondoReparoPct: 0.05, fondoReparoAmount: 1862987.71,
      adjustmentFactor: 1.0,
      ivaPct: 0.21, ivaAmount: 6650365.93,
      totalAmount: 38321156.00,
      budgetVersionId: bvCloacal.id, projectId: projectCloacal.id, organizationId: org.id,
    },
  });
  await prisma.certificateItem.createMany({
    data: [
      { itemNumber: 'B.1.1', description: 'Excavación a cielo abierto hasta 2,5m', unit: 'm3', quantity: 2429.53, unitPrice: 69226.39,
        previousAdvance: 0, previousAmount: 0, currentAdvance: 0.10, currentAmount: 16818758.75,
        totalAdvance: 0.10, totalAmount: 16818758.75,
        certificateId: certCloacal2.id, budgetItemId: biB11.id },
      { itemNumber: 'B.1.2', description: 'Excavación a cielo abierto 2,5-4m', unit: 'm3', quantity: 5711.75, unitPrice: 89509.10,
        previousAdvance: 0, previousAmount: 0, currentAdvance: 0.04, currentAmount: 20440995.45,
        totalAdvance: 0.04, totalAmount: 20440995.45,
        certificateId: certCloacal2.id, budgetItemId: biB12.id },
    ],
  });

  // Avance físico para items completados del Rubro A
  for (const bi of [biA1, biA2, biA3]) {
    await prisma.itemProgress.create({
      data: { date: new Date('2025-03-31'), advance: 1.0, budgetItemId: bi.id, registeredById: supervisor.id },
    });
  }
  // Avance parcial excavaciones
  await prisma.itemProgress.create({
    data: { date: new Date('2025-04-30'), advance: 0.10, budgetItemId: biB11.id, registeredById: supervisor.id },
  });
  await prisma.itemProgress.create({
    data: { date: new Date('2025-04-30'), advance: 0.04, budgetItemId: biB12.id, registeredById: supervisor.id },
  });

  console.log('   ✅ 2 certificates (1 APPROVED + 1 DRAFT), 5 items, 5 progress records');
  console.log('   ✅ Red Cloacal Zona 1 complete');

  // ============================================
  // CATÁLOGOS GLOBALES: Categorías MdO + Equipos
  // ============================================
  console.log('');
  console.log('📋 Creating global catalogs (Labor Categories + Equipment)...');

  // --- Categorías de Mano de Obra (MMO Feb-26) ---
  // Fuente: planilla MMO FEB-26.xlsx
  // Cargas: presentismo 20%, cargas sociales 59% (UOCRA), ART 7,9%
  const laborCategories = [
    { code: 'OF-ESP', name: 'Oficial Especializado', baseSalaryPerHour: 6071, attendancePct: 0.20, socialChargesPct: 0.59, artPct: 0.079 },
    { code: 'OF',     name: 'Oficial',               baseSalaryPerHour: 5196, attendancePct: 0.20, socialChargesPct: 0.59, artPct: 0.079 },
    { code: 'MO',     name: 'Medio Oficial',         baseSalaryPerHour: 4793, attendancePct: 0.20, socialChargesPct: 0.59, artPct: 0.079 },
    { code: 'AY',     name: 'Ayudante',              baseSalaryPerHour: 4438, attendancePct: 0.20, socialChargesPct: 0.59, artPct: 0.079 },
  ];

  for (const lc of laborCategories) {
    const totalHourlyCost = parseFloat(
      (lc.baseSalaryPerHour * (1 + lc.attendancePct) * (1 + lc.socialChargesPct) * (1 + lc.artPct)).toFixed(2)
    );
    await prisma.laborCategory.create({
      data: {
        code: lc.code,
        name: lc.name,
        baseSalaryPerHour: lc.baseSalaryPerHour,
        attendancePct: lc.attendancePct,
        socialChargesPct: lc.socialChargesPct,
        artPct: lc.artPct,
        totalHourlyCost,
        organizationId: org.id,
      },
    });
  }
  console.log('   ✅ 4 Categorías de Mano de Obra (OF-ESP $6.071/h, OF $5.196/h, MO $4.793/h, AY $4.438/h) — MMO Feb-26');

  // --- Catálogo de Equipos ---
  // Fuente: EQUIPOS.xlsx
  // EQ-RET-01..EQ-GRU-01 : equipos demo originales
  // EQ-GEN-XX : catálogo genérico (planilla "Equipos", dólar $1.390, gas oil $1.917)
  // EQ-PRY-XX : equipos del proyecto con marca/modelo (planilla "equipo", dólar $1.450)
  const equipmentItems: {
    code: string; name: string; description?: string | null;
    powerHp?: number | null; newValue: number; residualPct: number;
    usefulLifeHours: number; amortPerHour: number; repairsPerHour: number;
    fuelPerHour: number; lubricantsPerHour: number; totalHourlyCost: number;
  }[] = [
    // — Demo originales —
    { code: 'EQ-RET-01',  name: 'Retroexcavadora CAT 416E',          powerHp: 87,  newValue: 45000000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 4050,    repairsPerHour: 3037.5,  fuelPerHour: 4500,  lubricantsPerHour: 450   , totalHourlyCost: 12037.5  },
    { code: 'EQ-COMP-01', name: 'Compactador vibratorio BOMAG BW120', powerHp: 25,  newValue: 18000000,   residualPct: 0.10, usefulLifeHours: 8000,  amortPerHour: 2025,    repairsPerHour: 1518.75, fuelPerHour: 2800,  lubricantsPerHour: 280   , totalHourlyCost: 6623.75  },
    { code: 'EQ-HOR-01',  name: 'Hormigonera 350L',                  powerHp: 7,   newValue: 2500000,    residualPct: 0.15, usefulLifeHours: 6000,  amortPerHour: 354.17,  repairsPerHour: 265.63,  fuelPerHour: 800,   lubricantsPerHour: 80    , totalHourlyCost: 1499.8   },
    { code: 'EQ-CAM-01',  name: 'Camión volcador 6m³',               powerHp: 200, newValue: 35000000,   residualPct: 0.12, usefulLifeHours: 12000, amortPerHour: 2566.67, repairsPerHour: 1925.0,  fuelPerHour: 6000,  lubricantsPerHour: 600   , totalHourlyCost: 11091.67 },
    { code: 'EQ-GRU-01',  name: 'Grúa torre Liebherr 65K',           powerHp: 45,  newValue: 120000000,  residualPct: 0.08, usefulLifeHours: 15000, amortPerHour: 7360,    repairsPerHour: 5520.0,  fuelPerHour: 3500,  lubricantsPerHour: 350   , totalHourlyCost: 16730    },
    // — Catálogo genérico (EQUIPOS.xlsx "Equipos", dólar $1.390) —
    { code: 'EQ-GEN-01',  name: 'Aserradora de Juntas',                              description: 'Catálogo genérico - 2.720 USD',    powerHp: 45,  newValue: 3780800,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 434.79,   repairsPerHour: 302.46,  fuelPerHour: 12772.0,  lubricantsPerHour: 3193.0,   totalHourlyCost: 16702.25  },
    { code: 'EQ-GEN-02',  name: 'Camión Regador de Agua',                            description: 'Catálogo genérico - 6.000 USD',    powerHp: 140, newValue: 8340000,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 958.1,    repairsPerHour: 667.2,   fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,   totalHourlyCost: 51302.8   },
    { code: 'EQ-GEN-03',  name: 'Camión Chasis',                                     description: 'Catálogo genérico - 13.750 USD',   powerHp: 340, newValue: 19112500,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2197.94,  repairsPerHour: 1529.0,  fuelPerHour: 96507.0,  lubricantsPerHour: 24126.75, totalHourlyCost: 124360.69 },
    { code: 'EQ-GEN-04',  name: 'Cargadora Frontal sobre Neumáticos',                description: 'Catálogo genérico - 174.150 USD',  powerHp: 140, newValue: 242068500,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 27837.88, repairsPerHour: 19365.48,fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,   totalHourlyCost: 96880.86  },
    { code: 'EQ-GEN-05',  name: 'Motocompresor con Martillos',                       description: 'Catálogo genérico - 42.000 USD',   powerHp: 65,  newValue: 58380000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 6713.7,   repairsPerHour: 4670.4,  fuelPerHour: 18450.0,  lubricantsPerHour: 4612.5,   totalHourlyCost: 34446.6   },
    { code: 'EQ-GEN-06',  name: 'Equipos Menores y Herramientas de Mano',            description: 'Catálogo genérico - 13.000 USD',   powerHp: null,newValue: 18070000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2078.05,  repairsPerHour: 1445.6,  fuelPerHour: 0,        lubricantsPerHour: 0,        totalHourlyCost: 3523.65   },
    { code: 'EQ-GEN-07',  name: 'Guinche de Cable con Cuchara tipo Almeja',          description: 'Catálogo genérico - 35.000 USD',   powerHp: 150, newValue: 48650000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5594.75,  repairsPerHour: 3892.0,  fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5,  totalHourlyCost: 62699.25  },
    { code: 'EQ-GEN-08',  name: 'Reclamadora',                                       description: 'Catálogo genérico - 600.000 USD',  powerHp: 600, newValue: 834000000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 95910.0,  repairsPerHour: 66720.0, fuelPerHour: 170280.0, lubricantsPerHour: 42570.0,  totalHourlyCost: 375480.0  },
    { code: 'EQ-GEN-09',  name: 'Camión Motohormigonero (Genérico)',                 description: 'Catálogo genérico - 130.000 USD',  powerHp: 205, newValue: 180700000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 20780.5,  repairsPerHour: 14456.0, fuelPerHour: 58188.0,  lubricantsPerHour: 14547.0,  totalHourlyCost: 107971.5  },
    { code: 'EQ-GEN-10',  name: 'Motoniveladora',                                    description: 'Catálogo genérico - 150.000 USD',  powerHp: 120, newValue: 208500000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 23977.5,  repairsPerHour: 16680.0, fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,   totalHourlyCost: 83227.5   },
    { code: 'EQ-GEN-11',  name: 'Grúa 20 tn',                                        description: 'Catálogo genérico - 11.000 USD',   powerHp: 140, newValue: 15290000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 1758.35,  repairsPerHour: 1223.2,  fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,   totalHourlyCost: 52659.05  },
    { code: 'EQ-GEN-12',  name: 'Camión Volcador',                                   description: 'Catálogo genérico - 55.000 USD',   powerHp: 150, newValue: 76450000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 8791.75,  repairsPerHour: 6116.0,  fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5,  totalHourlyCost: 68120.25  },
    { code: 'EQ-GEN-13',  name: 'Retroexcavadora (Genérico)',                        description: 'Catálogo genérico - 180.000 USD',  powerHp: 120, newValue: 250200000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 28773.0,  repairsPerHour: 20016.0, fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,   totalHourlyCost: 91359.0   },
    { code: 'EQ-GEN-14',  name: 'Rastra de Discos',                                  description: 'Catálogo genérico - 3.500 USD',    powerHp: null,newValue: 4865000,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 559.48,   repairsPerHour: 389.2,   fuelPerHour: 0,        lubricantsPerHour: 0,        totalHourlyCost: 948.68    },
    { code: 'EQ-GEN-15',  name: 'Retropala 4x4',                                     description: 'Catálogo genérico - 42.000 USD',   powerHp: 100, newValue: 58380000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 6713.7,   repairsPerHour: 4670.4,  fuelPerHour: 28380.0,  lubricantsPerHour: 7095.0,   totalHourlyCost: 46859.1   },
    { code: 'EQ-GEN-16',  name: 'Camión Tractor',                                    description: 'Catálogo genérico - 40.000 USD',   powerHp: 140, newValue: 55600000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 6394.0,   repairsPerHour: 4448.0,  fuelPerHour: 39742.0,  lubricantsPerHour: 9935.5,   totalHourlyCost: 60519.5   },
    { code: 'EQ-GEN-17',  name: 'Equipo para Demarcación Vial Horizontal',           description: 'Catálogo genérico - 4.200 USD',    powerHp: 180, newValue: 5838000,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 671.37,   repairsPerHour: 467.04,  fuelPerHour: 51084.0,  lubricantsPerHour: 12771.0,  totalHourlyCost: 64993.41  },
    { code: 'EQ-GEN-18',  name: 'Rodillo Neumático Autopropulsado',                  description: 'Catálogo genérico - 90.000 USD',   powerHp: 125, newValue: 125100000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 14386.5,  repairsPerHour: 10008.0, fuelPerHour: 35475.0,  lubricantsPerHour: 8868.75,  totalHourlyCost: 68738.25  },
    { code: 'EQ-GEN-19',  name: 'Rodillo Neumático de Arrastre',                     description: 'Catálogo genérico - 13.400 USD',   powerHp: null,newValue: 18626000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2141.99,  repairsPerHour: 1490.08, fuelPerHour: 0,        lubricantsPerHour: 0,        totalHourlyCost: 3632.07   },
    { code: 'EQ-GEN-20',  name: 'Rodillo Pata de Cabra de Arrastre',                 description: 'Catálogo genérico - 35.000 USD',   powerHp: null,newValue: 48650000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5594.75,  repairsPerHour: 3892.0,  fuelPerHour: 0,        lubricantsPerHour: 0,        totalHourlyCost: 9486.75   },
    { code: 'EQ-GEN-21',  name: 'Rodillo Pata de Cabra Autopropulsado',              description: 'Catálogo genérico - 70.000 USD',   powerHp: 112, newValue: 97300000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 11189.5,  repairsPerHour: 7784.0,  fuelPerHour: 31793.0,  lubricantsPerHour: 7948.25,  totalHourlyCost: 58714.75  },
    { code: 'EQ-GEN-22',  name: 'Equipo Rompepavimentos',                            description: 'Catálogo genérico - 90.000 USD',   powerHp: 120, newValue: 125100000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 14386.5,  repairsPerHour: 10008.0, fuelPerHour: 34056.0,  lubricantsPerHour: 8514.0,   totalHourlyCost: 66964.5   },
    { code: 'EQ-GEN-23',  name: 'Terminadora de Pavimentos de Hormigón',             description: 'Catálogo genérico - 120.000 USD',  powerHp: 300, newValue: 166800000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 19182.0,  repairsPerHour: 13344.0, fuelPerHour: 85140.0,  lubricantsPerHour: 21285.0,  totalHourlyCost: 138951.0  },
    { code: 'EQ-GEN-24',  name: 'Tractor sobre Neumático 4x2',                       description: 'Catálogo genérico - 40.000 USD',   powerHp: 150, newValue: 55600000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 6394.0,   repairsPerHour: 4448.0,  fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5,  totalHourlyCost: 64054.5   },
    { code: 'EQ-GEN-25',  name: 'Vibrocompactador Manual',                           description: 'Catálogo genérico - 3.100 USD',    powerHp: 4,   newValue: 4309000,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 495.54,   repairsPerHour: 344.72,  fuelPerHour: 1135.0,   lubricantsPerHour: 283.75,   totalHourlyCost: 2259.01   },
    { code: 'EQ-GEN-26',  name: 'Camión Regador de Asfalto',                         description: 'Catálogo genérico - 100.000 USD',  powerHp: 145, newValue: 139000000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 15985.0,  repairsPerHour: 11120.0, fuelPerHour: 41152.0,  lubricantsPerHour: 10288.0,  totalHourlyCost: 78545.0   },
    { code: 'EQ-GEN-27',  name: 'Rodillo Liso Vibratorio Autopropulsado',            description: 'Catálogo genérico - 75.000 USD',   powerHp: 70,  newValue: 104250000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 11988.75, repairsPerHour: 8340.0,  fuelPerHour: 19866.0,  lubricantsPerHour: 4966.5,   totalHourlyCost: 45161.25  },
    { code: 'EQ-GEN-28',  name: 'Terminadora de Pavimentos Asfálticos',              description: 'Catálogo genérico - 243.000 USD',  powerHp: 150, newValue: 337770000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 38843.55, repairsPerHour: 27021.6, fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5,  totalHourlyCost: 119077.65 },
    { code: 'EQ-GEN-29',  name: 'Planta Asfáltica Completa',                         description: 'Catálogo genérico - 644.000 USD',  powerHp: 330, newValue: 895160000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 102943.4, repairsPerHour: 71612.8, fuelPerHour: 93643.0,  lubricantsPerHour: 23410.75, totalHourlyCost: 291609.95 },
    { code: 'EQ-GEN-30',  name: 'Aplanadora',                                        description: 'Catálogo genérico - 55.000 USD',   powerHp: 70,  newValue: 76450000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 8791.75,  repairsPerHour: 6116.0,  fuelPerHour: 19866.0,  lubricantsPerHour: 4966.5,   totalHourlyCost: 39740.25  },
    { code: 'EQ-GEN-31',  name: 'Fresadora de Pavimentos',                           description: 'Catálogo genérico - 500.000 USD',  powerHp: 400, newValue: 695000000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 79925.0,  repairsPerHour: 55600.0, fuelPerHour: 113520.0, lubricantsPerHour: 28380.0,  totalHourlyCost: 277425.0  },
    { code: 'EQ-GEN-32',  name: 'Hidrogrúa',                                         description: 'Catálogo genérico - 11.000 USD',   powerHp: 150, newValue: 15290000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 1758.35,  repairsPerHour: 1223.2,  fuelPerHour: 42570.0,  lubricantsPerHour: 10642.5,  totalHourlyCost: 56194.05  },
    { code: 'EQ-GEN-33',  name: 'Minicargadora',                                     description: 'Catálogo genérico - 125.000 USD',  powerHp: 71,  newValue: 173750000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 19981.25, repairsPerHour: 13900.0, fuelPerHour: 20152.0,  lubricantsPerHour: 5038.0,   totalHourlyCost: 59071.25  },
    // — Equipos del proyecto con marca/modelo (EQUIPOS.xlsx "equipo", dólar $1.450) —
    { code: 'EQ-PRY-01',  name: 'Manitou - Autoelevadora',                          description: 'Año 2013',      powerHp: 60,  newValue: 116000000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 11600, repairsPerHour: 5800,  fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 34902  },
    { code: 'EQ-PRY-02',  name: 'IVECO - Camión Chasis c/Cabina Dormitorio',        description: 'Año 2021',      powerHp: 250, newValue: 130500000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 13050, repairsPerHour: 6525,  fuelPerHour: 47925, lubricantsPerHour: 25000, totalHourlyCost: 92500  },
    { code: 'EQ-PRY-03',  name: 'IVECO - Camión Chasis Volcadora y Grúa',           description: 'Año 2023',      powerHp: 200, newValue: 188500000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 18850, repairsPerHour: 9425,  fuelPerHour: 38340, lubricantsPerHour: 20000, totalHourlyCost: 86615  },
    { code: 'EQ-PRY-04',  name: 'IVECO - Camión Chasis c/Cabina',                   description: 'Año 2021',      powerHp: 200, newValue: 130500000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 13050, repairsPerHour: 6525,  fuelPerHour: 38340, lubricantsPerHour: 20000, totalHourlyCost: 77915  },
    { code: 'EQ-PRY-05',  name: 'Patronelli - Acoplado',                            description: 'Año 2022',      powerHp: null,newValue: 50750000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 0,     lubricantsPerHour: 0,     totalHourlyCost: 7613   },
    { code: 'EQ-PRY-06',  name: 'New Holland - Cargadora L220',                     description: 'Año 2019',      powerHp: 150, newValue: 50750000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 51368  },
    { code: 'EQ-PRY-07',  name: 'Case - Cargadora 580 L',                           description: 'Año 2006',      powerHp: 130, newValue: 58000000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5800,  repairsPerHour: 2900,  fuelPerHour: 24921, lubricantsPerHour: 13000, totalHourlyCost: 46621  },
    { code: 'EQ-PRY-08',  name: 'Ford Transit - Camión Chasis c/Cabina',            description: 'Año 2014',      powerHp: 130, newValue: 26100000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2610,  repairsPerHour: 1305,  fuelPerHour: 24921, lubricantsPerHour: 13000, totalHourlyCost: 41836  },
    { code: 'EQ-PRY-09',  name: 'Toyota - Camioneta Pick-Up',                       description: 'Año 2016',      powerHp: 170, newValue: 27550000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2755,  repairsPerHour: 1378,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53722  },
    { code: 'EQ-PRY-10',  name: 'Toyota Hilux 4x4 - Pick-Up',                       description: 'Año 2012',      powerHp: 170, newValue: 26100000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2610,  repairsPerHour: 1305,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53504  },
    { code: 'EQ-PRY-11',  name: 'Toyota Hilux 4x4 - Pick-Up (2022-A)',              description: 'Año 2022',      powerHp: 170, newValue: 43500000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 4350,  repairsPerHour: 2175,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 56114  },
    { code: 'EQ-PRY-12',  name: 'Toyota Hilux 4x4 - Pick-Up (2022-B)',              description: 'Año 2022',      powerHp: 170, newValue: 43500000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 4350,  repairsPerHour: 2175,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 56114  },
    { code: 'EQ-PRY-13',  name: 'Toyota Hilux 4x4 - Pick-Up (2020)',                description: 'Año 2020',      powerHp: 170, newValue: 29000000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2900,  repairsPerHour: 1450,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53939  },
    { code: 'EQ-PRY-14',  name: 'Toyota Hilux 4x4 - Pick-Up (2019)',                description: 'Año 2019',      powerHp: 170, newValue: 27550000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2755,  repairsPerHour: 1378,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 53722  },
    { code: 'EQ-PRY-15',  name: 'Toyota SW4 - Todo Terreno',                        description: 'Año 2017',      powerHp: 170, newValue: 50750000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 57202  },
    { code: 'EQ-PRY-16',  name: 'Toyota Hilux 4x5 - Todo Terreno',                  description: 'Año 2013',      powerHp: 170, newValue: 21750000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 2175,  repairsPerHour: 1088,  fuelPerHour: 32589, lubricantsPerHour: 17000, totalHourlyCost: 52852  },
    { code: 'EQ-PRY-17',  name: 'Renault Kind Iconic - Automóvil',                  description: 'Año 2018',      powerHp: 60,  newValue: 11600000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 1160,  repairsPerHour: 580,   fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 19242  },
    { code: 'EQ-PRY-18',  name: 'Zampi Heli H2000 - Compresor',                     description: 'Año 2020',      powerHp: 60,  newValue: 36250000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 3625,  repairsPerHour: 1813,  fuelPerHour: 11502, lubricantsPerHour: 6000,  totalHourlyCost: 22940  },
    { code: 'EQ-PRY-19',  name: 'John Deere - Cargadora',                           description: 'Año 2007',      powerHp: 150, newValue: 108750000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 10875, repairsPerHour: 5438,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 60068  },
    { code: 'EQ-PRY-20',  name: 'IVECO - Autohormigonero',                          description: 'Año 2017',      powerHp: 150, newValue: 113100000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 11310, repairsPerHour: 5655,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 60720  },
    { code: 'EQ-PRY-21',  name: 'New Holland - Cargadora (2013)',                   description: 'Año 2013',      powerHp: 150, newValue: 50750000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 5075,  repairsPerHour: 2538,  fuelPerHour: 28755, lubricantsPerHour: 15000, totalHourlyCost: 51368  },
    { code: 'EQ-PRY-22',  name: 'John Deere - Retroexcavadora 310',                 description: 'Año 2014',      powerHp: 80,  newValue: 116000000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 11600, repairsPerHour: 5800,  fuelPerHour: 15336, lubricantsPerHour: 8000,  totalHourlyCost: 40736  },
    { code: 'EQ-PRY-23',  name: 'Bob Cat - Rodillo Compactador Dinámico 1,20m',     description: null,            powerHp: 80,  newValue: 36250000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 3625,  repairsPerHour: 1813,  fuelPerHour: 15336, lubricantsPerHour: 8000,  totalHourlyCost: 28774  },
    { code: 'EQ-PRY-24',  name: 'Camión Motohormigonero',                           description: null,            powerHp: 260, newValue: 124700000,  residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 12470, repairsPerHour: 6235,  fuelPerHour: 49842, lubricantsPerHour: 26000, totalHourlyCost: 94547  },
    { code: 'EQ-PRY-25',  name: 'Vibrador de Inmersión',                            description: 'Motor a nafta', powerHp: 5,   newValue: 1087500,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 109,   repairsPerHour: 54,    fuelPerHour: 959,   lubricantsPerHour: 500,   totalHourlyCost: 1622   },
    { code: 'EQ-PRY-26',  name: 'Compactador Manual',                               description: 'Motor a nafta', powerHp: 7,   newValue: 10440000,   residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 1044,  repairsPerHour: 522,   fuelPerHour: 1342,  lubricantsPerHour: 700,   totalHourlyCost: 3608   },
    { code: 'EQ-PRY-27',  name: 'Grupo Electrógeno',                                description: null,            powerHp: 5,   newValue: 1500000,    residualPct: 0.10, usefulLifeHours: 10000, amortPerHour: 150,   repairsPerHour: 75,    fuelPerHour: 959,   lubricantsPerHour: 500,   totalHourlyCost: 1684   },
  ];

  for (const eq of equipmentItems) {
    await prisma.equipmentCatalogItem.create({
      data: {
        code: eq.code,
        name: eq.name,
        description: eq.description,
        powerHp: eq.powerHp,
        newValue: eq.newValue,
        residualPct: eq.residualPct,
        usefulLifeHours: eq.usefulLifeHours,
        amortPerHour: eq.amortPerHour,
        repairsPerHour: eq.repairsPerHour,
        fuelPerHour: eq.fuelPerHour,
        lubricantsPerHour: eq.lubricantsPerHour,
        totalHourlyCost: eq.totalHourlyCost,
        organizationId: org.id,
      },
    });
  }
  console.log(`   ✅ ${equipmentItems.length} equipos en catálogo (5 demo + 33 genéricos EQ-GEN + 27 del proyecto EQ-PRY)`);

  // --- Plan Financiero para Red Cloacal ---
  console.log('📅 Creating financial plan for Red Cloacal...');
  const financialPlan = await prisma.financialPlan.create({
    data: {
      name: 'Plan Financiero 2025 - Red Cloacal Zona 1',
      status: 'DRAFT',
      projectId: projectCloacal.id,
      budgetVersionId: bvCloacal.id,
      organizationId: org.id,
    },
  });

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  // 12 meses de plan financiero para 2025
  const monthlyPlans = [
    { month: 1, projected: 120000000, materials: 60000000, labor: 35000000, equipment: 15000000, subcontracts: 10000000, progress: 0.03 },
    { month: 2, projected: 180000000, materials: 90000000, labor: 52000000, equipment: 22000000, subcontracts: 16000000, progress: 0.08 },
    { month: 3, projected: 250000000, materials: 125000000, labor: 72000000, equipment: 31000000, subcontracts: 22000000, progress: 0.17 },
    { month: 4, projected: 320000000, materials: 160000000, labor: 92000000, equipment: 40000000, subcontracts: 28000000, progress: 0.29 },
    { month: 5, projected: 350000000, materials: 175000000, labor: 101000000, equipment: 44000000, subcontracts: 30000000, progress: 0.42 },
    { month: 6, projected: 350000000, materials: 175000000, labor: 101000000, equipment: 44000000, subcontracts: 30000000, progress: 0.55 },
    { month: 7, projected: 300000000, materials: 150000000, labor: 87000000, equipment: 38000000, subcontracts: 25000000, progress: 0.66 },
    { month: 8, projected: 280000000, materials: 140000000, labor: 81000000, equipment: 35000000, subcontracts: 24000000, progress: 0.77 },
    { month: 9, projected: 220000000, materials: 110000000, labor: 64000000, equipment: 28000000, subcontracts: 18000000, progress: 0.85 },
    { month: 10, projected: 160000000, materials: 80000000, labor: 46000000, equipment: 20000000, subcontracts: 14000000, progress: 0.91 },
    { month: 11, projected: 100000000, materials: 50000000, labor: 29000000, equipment: 13000000, subcontracts: 8000000, progress: 0.96 },
    { month: 12, projected: 74000000, materials: 37000000, labor: 21000000, equipment: 10000000, subcontracts: 6000000, progress: 1.0 },
  ];

  for (const mp of monthlyPlans) {
    await prisma.financialPeriod.create({
      data: {
        month: mp.month,
        year: 2025,
        label: `${monthNames[mp.month - 1]} 2025`,
        projectedAmount: mp.projected,
        projectedMaterials: mp.materials,
        projectedLabor: mp.labor,
        projectedEquipment: mp.equipment,
        projectedSubcontracts: mp.subcontracts,
        projectedProgress: mp.progress,
        certifiedAmount: mp.month <= 3 ? Math.round(mp.projected * 0.85) : 0,
        executedAmount: mp.month <= 3 ? Math.round(mp.projected * 0.90) : 0,
        actualProgress: mp.month === 1 ? 0.025 : mp.month === 2 ? 0.07 : mp.month === 3 ? 0.15 : 0,
        financialPlanId: financialPlan.id,
      },
    });
  }
  console.log('   ✅ 1 Financial plan with 12 monthly periods');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('');
  console.log('================================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('================================================');
  console.log('');
  console.log('📊 Summary:');
  console.log('');
  console.log('   --- Datos base ---');
  console.log('   🏢 1 Organization: Constructora Patagonia S.A.');
  console.log('   👥 6 Users (admin, 2 PM, supervisor, admin contable, cliente)');
  console.log('   📁 7 Expense categories + 8 Material categories');
  console.log('   🧱 27 Materials with supplier links');
  console.log('   🏪 6 Suppliers with contact & banking info');
  console.log('   👷 8 Employees (capataz, albañiles, electricista, plomero, ayudantes, pintor)');
  console.log('   🏗️ 5 Projects:');
  console.log('      • Casa Rodríguez (IN_PROGRESS 65%) - 11 stages, 35+ tasks, Gantt completo');
  console.log('      • Edificio Mirador (IN_PROGRESS 28%) - 7 stages');
  console.log('      • Remodelación Florida (PLANNING 0%)');
  console.log('      • Duplex López (COMPLETED 100%) - 10 stages, 38 tasks, Gantt completo, 20 gastos');
  console.log('      • Red Cloacal Zona 1 (IN_PROGRESS 1%) - datos reales de licitación pública');
  console.log('   💰 3 Budgets (legacy) with category breakdown');
  console.log('   💸 45 Expenses (paid, approved, pending, draft, rejected)');
  console.log('   📋 3 Purchase orders (completed, confirmed, sent)');
  console.log('   📦 15 Stock movements (IN, OUT, ADJUSTMENT)');
  console.log(`   📅 ${attendanceData.length} Attendance records (3 weeks)`);
  console.log('   💬 13 Comments on projects and tasks');
  console.log('   🔔 10 Notifications');
  console.log('   📝 8 Audit log entries');
  console.log('');
  console.log('   --- ERP Obra Pública ---');
  console.log('   💱 3 Currencies (ARS, USD, EUR) + 9 exchange rates');
  console.log('   📐 2 Budget versions (v1 SUPERSEDED, v2 APPROVED)');
  console.log('   📑 8 Chapters + 24 Budget items');
  console.log('   🔬 3 APUs (hormigón, losa, pared) con materiales, MO, equipos, transporte');
  console.log('   📈 21 Progress records (avance físico por ítem)');
  console.log('   📜 3 Certificates (2 APPROVED + 1 DRAFT) con 14 certificate items');
  console.log('   🤝 2 Subcontracts (ascensor ACTIVE, carpintería DRAFT) + 7 items');
  console.log('   📊 4 Price indices (MO, MAT, EQ, COMB) con 32 valores mensuales');
  console.log('   🧮 1 Adjustment formula polinómica (4 pesos)');
  console.log('');
  console.log('   --- Catálogos Globales ---');
  console.log('   👷 4 Categorías de MdO (OF-ESP, OF, MO, AY) con cargas sociales');
  console.log('   🚜 5 Equipos en catálogo (retroexcavadora, compactador, hormigonera, camión, grúa)');
  console.log('   📅 1 Plan financiero + 12 períodos mensuales (Red Cloacal 2025)');
  console.log('');
  console.log('   --- Red Cloacal Zona 1 (datos reales) ---');
  console.log('   🚰 1 Proyecto Red Cloacal ($2,704M ARS)');
  console.log('   📐 1 Budget version (K=1.5863, APPROVED)');
  console.log('   📑 3 Chapters (Preliminares, Colector, HyS) + 12 items');
  console.log('   🔬 4 APUs (replanteo, excavación, cañería PEAD, bocas de registro)');
  console.log('   📜 2 Certificates (1 APPROVED Rubro A + 1 DRAFT excavaciones)');
  console.log('   📈 5 Progress records');
  console.log('');
  console.log('🔐 Test credentials (all passwords: password123):');
  console.log('   Admin:          admin@constructorademo.com.ar');
  console.log('   Jefe de Obra:   jefe@constructorademo.com.ar');
  console.log('   Jefe de Obra 2: andres.pm@constructorademo.com.ar');
  console.log('   Supervisor:     supervisor@constructorademo.com.ar');
  console.log('   Administrativo: admin.contable@constructorademo.com.ar');
  console.log('   Cliente:        cliente@ejemplo.com.ar');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
