"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting comprehensive demo seed...');
    console.log('================================================');
    // ============================================
    // CLEANUP
    // ============================================
    console.log('🧹 Cleaning up existing data...');
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
            role: client_1.UserRole.ADMIN,
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
            role: client_1.UserRole.PROJECT_MANAGER,
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
            role: client_1.UserRole.PROJECT_MANAGER,
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
            role: client_1.UserRole.SUPERVISOR,
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
            role: client_1.UserRole.ADMINISTRATIVE,
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
            role: client_1.UserRole.READ_ONLY,
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
            { supplierId: supCorralon.id, materialId: materials[0].id, unitPrice: 8900, leadTimeDays: 1, isPreferred: true }, // Cemento
            { supplierId: supCorralon.id, materialId: materials[1].id, unitPrice: 48000, leadTimeDays: 2, isPreferred: true }, // Arena
            { supplierId: supCorralon.id, materialId: materials[2].id, unitPrice: 52000, leadTimeDays: 2, isPreferred: true }, // Piedra
            { supplierId: supCorralon.id, materialId: materials[4].id, unitPrice: 4200, leadTimeDays: 1, isPreferred: true }, // Cal
            { supplierId: supCorralon.id, materialId: materials[5].id, unitPrice: 195, leadTimeDays: 1, isPreferred: true }, // Ladrillo 12
            { supplierId: supCorralon.id, materialId: materials[6].id, unitPrice: 280, leadTimeDays: 1, isPreferred: true }, // Ladrillo 18
            { supplierId: supCorralon.id, materialId: materials[7].id, unitPrice: 450, leadTimeDays: 2 }, // Bloque H°
            { supplierId: supHierros.id, materialId: materials[8].id, unitPrice: 7800, leadTimeDays: 3, isPreferred: true }, // Hierro 6
            { supplierId: supHierros.id, materialId: materials[9].id, unitPrice: 12500, leadTimeDays: 3, isPreferred: true }, // Hierro 8
            { supplierId: supHierros.id, materialId: materials[10].id, unitPrice: 18500, leadTimeDays: 3, isPreferred: true }, // Hierro 10
            { supplierId: supHierros.id, materialId: materials[11].id, unitPrice: 26000, leadTimeDays: 3, isPreferred: true }, // Hierro 12
            { supplierId: supHierros.id, materialId: materials[12].id, unitPrice: 42000, leadTimeDays: 5, isPreferred: true }, // Malla
            { supplierId: supHierros.id, materialId: materials[13].id, unitPrice: 3500, leadTimeDays: 1 }, // Alambre
            { supplierId: supElectrica.id, materialId: materials[14].id, unitPrice: 38000, leadTimeDays: 2, isPreferred: true }, // Cable 2.5
            { supplierId: supElectrica.id, materialId: materials[15].id, unitPrice: 55000, leadTimeDays: 2, isPreferred: true }, // Cable 4
            { supplierId: supElectrica.id, materialId: materials[16].id, unitPrice: 12000, leadTimeDays: 1, isPreferred: true }, // Corrugado
            { supplierId: supElectrica.id, materialId: materials[17].id, unitPrice: 35000, leadTimeDays: 5, isPreferred: true }, // Tablero
            { supplierId: supSanitarios.id, materialId: materials[18].id, unitPrice: 8500, leadTimeDays: 2, isPreferred: true }, // PPF 20
            { supplierId: supSanitarios.id, materialId: materials[19].id, unitPrice: 22000, leadTimeDays: 2, isPreferred: true }, // PVC 110
            { supplierId: supSanitarios.id, materialId: materials[20].id, unitPrice: 185000, leadTimeDays: 7, isPreferred: true }, // Tanque
            { supplierId: supHormigon.id, materialId: materials[3].id, unitPrice: 165000, leadTimeDays: 1, isPreferred: true }, // H° Elaborado
            { supplierId: supPintura.id, materialId: materials[21].id, unitPrice: 95000, leadTimeDays: 1, isPreferred: true }, // Látex
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
            status: client_1.ProjectStatus.IN_PROGRESS,
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
    const t1_1 = await prisma.task.create({ data: { name: 'Limpieza y nivelación del terreno', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-06-01'), plannedEndDate: new Date('2024-06-03'), actualStartDate: new Date('2024-06-01'), actualEndDate: new Date('2024-06-02'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p1Stage1.id } });
    const t1_2 = await prisma.task.create({ data: { name: 'Cerco perimetral de obra', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-06-03'), plannedEndDate: new Date('2024-06-05'), actualStartDate: new Date('2024-06-03'), actualEndDate: new Date('2024-06-05'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p1Stage1.id } });
    const t1_3 = await prisma.task.create({ data: { name: 'Montaje de obrador', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-06-05'), plannedEndDate: new Date('2024-06-07'), actualStartDate: new Date('2024-06-05'), actualEndDate: new Date('2024-06-06'), estimatedHours: 16, actualHours: 12, progress: 100, stageId: p1Stage1.id } });
    const t1_4 = await prisma.task.create({ data: { name: 'Conexiones provisorias (agua y luz)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-06-07'), plannedEndDate: new Date('2024-06-12'), actualStartDate: new Date('2024-06-06'), actualEndDate: new Date('2024-06-10'), estimatedHours: 20, actualHours: 18, progress: 100, stageId: p1Stage1.id } });
    const t1_5 = await prisma.task.create({ data: { name: 'Replanteo de obra', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2024-06-10'), plannedEndDate: new Date('2024-06-12'), actualStartDate: new Date('2024-06-10'), actualEndDate: new Date('2024-06-12'), estimatedHours: 12, actualHours: 10, progress: 100, stageId: p1Stage1.id } });
    // ---- TASKS for Stage 3 (Estructura - 100%) ----
    const t3_1 = await prisma.task.create({ data: { name: 'Armado de columnas PB (8 columnas)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-07-11'), plannedEndDate: new Date('2024-07-18'), actualStartDate: new Date('2024-07-11'), actualEndDate: new Date('2024-07-17'), estimatedHours: 48, actualHours: 44, progress: 100, stageId: p1Stage3.id } });
    const t3_2 = await prisma.task.create({ data: { name: 'Hormigonado de columnas PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-07-19'), plannedEndDate: new Date('2024-07-22'), actualStartDate: new Date('2024-07-18'), actualEndDate: new Date('2024-07-21'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p1Stage3.id } });
    const t3_3 = await prisma.task.create({ data: { name: 'Encofrado losa PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-07-25'), plannedEndDate: new Date('2024-08-05'), actualStartDate: new Date('2024-07-23'), actualEndDate: new Date('2024-08-03'), estimatedHours: 64, actualHours: 60, progress: 100, stageId: p1Stage3.id } });
    const t3_4 = await prisma.task.create({ data: { name: 'Armado hierros losa PB + malla', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-08-06'), plannedEndDate: new Date('2024-08-13'), actualStartDate: new Date('2024-08-04'), actualEndDate: new Date('2024-08-12'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p1Stage3.id } });
    const t3_5 = await prisma.task.create({ data: { name: 'Hormigonado losa PB (22m³)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2024-08-14'), plannedEndDate: new Date('2024-08-15'), actualStartDate: new Date('2024-08-13'), actualEndDate: new Date('2024-08-13'), estimatedHours: 12, actualHours: 10, progress: 100, stageId: p1Stage3.id } });
    const t3_6 = await prisma.task.create({ data: { name: 'Armado y hormigonado escalera', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-08-16'), plannedEndDate: new Date('2024-08-23'), actualStartDate: new Date('2024-08-16'), actualEndDate: new Date('2024-08-22'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p1Stage3.id } });
    const t3_7 = await prisma.task.create({ data: { name: 'Columnas y vigas PA', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-08-24'), plannedEndDate: new Date('2024-09-02'), actualStartDate: new Date('2024-08-23'), actualEndDate: new Date('2024-09-01'), estimatedHours: 56, actualHours: 52, progress: 100, stageId: p1Stage3.id } });
    const t3_8 = await prisma.task.create({ data: { name: 'Losa PA + curado', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-09-03'), plannedEndDate: new Date('2024-09-08'), actualStartDate: new Date('2024-09-02'), actualEndDate: new Date('2024-09-08'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p1Stage3.id } });
    // ---- TASKS for Stage 5 (Eléctrica - 85%) ----
    const t5_1 = await prisma.task.create({ data: { name: 'Cañerías embutidas PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-10-28'), plannedEndDate: new Date('2024-11-04'), actualStartDate: new Date('2024-10-28'), actualEndDate: new Date('2024-11-03'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p1Stage5.id } });
    const t5_2 = await prisma.task.create({ data: { name: 'Cañerías embutidas PA', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-05'), plannedEndDate: new Date('2024-11-11'), actualStartDate: new Date('2024-11-04'), actualEndDate: new Date('2024-11-10'), estimatedHours: 36, actualHours: 34, progress: 100, stageId: p1Stage5.id } });
    const t5_3 = await prisma.task.create({ data: { name: 'Cableado general', status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-12'), plannedEndDate: new Date('2024-11-22'), actualStartDate: new Date('2024-11-11'), estimatedHours: 56, actualHours: 42, progress: 75, stageId: p1Stage5.id } });
    const t5_4 = await prisma.task.create({ data: { name: 'Montaje tableros eléctricos', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-11-23'), plannedEndDate: new Date('2024-11-27'), estimatedHours: 24, progress: 0, stageId: p1Stage5.id } });
    const t5_5 = await prisma.task.create({ data: { name: 'Colocación bocas de luz y tomas', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-11-25'), plannedEndDate: new Date('2024-11-30'), estimatedHours: 32, progress: 0, stageId: p1Stage5.id } });
    // ---- TASKS for Stage 6 (Sanitaria - 70%) ----
    const t6_1 = await prisma.task.create({ data: { name: 'Instalación agua fría y caliente PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-12'), plannedEndDate: new Date('2024-11-19'), actualStartDate: new Date('2024-11-12'), actualEndDate: new Date('2024-11-18'), estimatedHours: 40, actualHours: 36, progress: 100, stageId: p1Stage6.id } });
    const t6_2 = await prisma.task.create({ data: { name: 'Desagües cloacales PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-18'), plannedEndDate: new Date('2024-11-25'), actualStartDate: new Date('2024-11-18'), actualEndDate: new Date('2024-11-24'), estimatedHours: 36, actualHours: 32, progress: 100, stageId: p1Stage6.id } });
    const t6_3 = await prisma.task.create({ data: { name: 'Instalaciones sanitarias PA', status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-26'), plannedEndDate: new Date('2024-12-05'), actualStartDate: new Date('2024-11-25'), estimatedHours: 48, actualHours: 28, progress: 55, stageId: p1Stage6.id } });
    const t6_4 = await prisma.task.create({ data: { name: 'Bajadas pluviales', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-12-06'), plannedEndDate: new Date('2024-12-10'), estimatedHours: 24, progress: 0, stageId: p1Stage6.id } });
    const t6_5 = await prisma.task.create({ data: { name: 'Prueba hidráulica y conexión a red', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2024-12-11'), plannedEndDate: new Date('2024-12-15'), estimatedHours: 20, progress: 0, stageId: p1Stage6.id } });
    // ---- TASKS for Stage 7 (Techos - 40%) ----
    const t7_1 = await prisma.task.create({ data: { name: 'Estructura de techo (tirantería)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-12-20'), plannedEndDate: new Date('2024-12-28'), actualStartDate: new Date('2024-12-20'), actualEndDate: new Date('2024-12-27'), estimatedHours: 48, actualHours: 44, progress: 100, stageId: p1Stage7.id } });
    const t7_2 = await prisma.task.create({ data: { name: 'Colocación de membrana asfáltica', status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2025-01-02'), plannedEndDate: new Date('2025-01-07'), actualStartDate: new Date('2025-01-02'), estimatedHours: 32, actualHours: 16, progress: 50, stageId: p1Stage7.id } });
    const t7_3 = await prisma.task.create({ data: { name: 'Aislación térmica techo', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-08'), plannedEndDate: new Date('2025-01-12'), estimatedHours: 24, progress: 0, stageId: p1Stage7.id } });
    const t7_4 = await prisma.task.create({ data: { name: 'Canaletas y bajadas pluviales', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-13'), plannedEndDate: new Date('2025-01-15'), estimatedHours: 16, progress: 0, stageId: p1Stage7.id } });
    // ---- TASKS for Stage 8 (Revoques - 10%) ----
    const t8_1 = await prisma.task.create({ data: { name: 'Revoque grueso exterior', status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2025-01-16'), plannedEndDate: new Date('2025-01-30'), actualStartDate: new Date('2025-01-20'), estimatedHours: 80, actualHours: 16, progress: 20, stageId: p1Stage8.id } });
    const t8_2 = await prisma.task.create({ data: { name: 'Revoque grueso interior PB', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2025-01-25'), plannedEndDate: new Date('2025-02-07'), estimatedHours: 64, progress: 0, stageId: p1Stage8.id } });
    const t8_3 = await prisma.task.create({ data: { name: 'Revoque grueso interior PA', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2025-02-08'), plannedEndDate: new Date('2025-02-18'), estimatedHours: 56, progress: 0, stageId: p1Stage8.id } });
    const t8_4 = await prisma.task.create({ data: { name: 'Contrapisos PB y PA', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2025-02-10'), plannedEndDate: new Date('2025-02-20'), estimatedHours: 48, progress: 0, stageId: p1Stage8.id } });
    const t8_5 = await prisma.task.create({ data: { name: 'Revoque fino (enlucido)', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2025-02-20'), plannedEndDate: new Date('2025-02-28'), estimatedHours: 60, progress: 0, stageId: p1Stage8.id } });
    // ---- TASK DEPENDENCIES (Gantt) ----
    console.log('🔗 Creating task dependencies...');
    await prisma.taskDependency.createMany({
        data: [
            // Preliminares: secuencia
            { taskId: t1_2.id, dependsOnId: t1_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t1_3.id, dependsOnId: t1_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t1_4.id, dependsOnId: t1_3.id, dependencyType: client_1.DependencyType.SS, lagDays: 1 },
            { taskId: t1_5.id, dependsOnId: t1_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            // Estructura: cadena de dependencias
            { taskId: t3_2.id, dependsOnId: t3_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t3_3.id, dependsOnId: t3_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 2 },
            { taskId: t3_4.id, dependsOnId: t3_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t3_5.id, dependsOnId: t3_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t3_6.id, dependsOnId: t3_5.id, dependencyType: client_1.DependencyType.FS, lagDays: 1 },
            { taskId: t3_7.id, dependsOnId: t3_6.id, dependencyType: client_1.DependencyType.SS, lagDays: 2 },
            { taskId: t3_8.id, dependsOnId: t3_7.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            // Eléctrica
            { taskId: t5_2.id, dependsOnId: t5_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t5_3.id, dependsOnId: t5_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t5_4.id, dependsOnId: t5_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t5_5.id, dependsOnId: t5_3.id, dependencyType: client_1.DependencyType.SS, lagDays: 3 },
            // Sanitaria
            { taskId: t6_2.id, dependsOnId: t6_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 3 },
            { taskId: t6_3.id, dependsOnId: t6_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t6_4.id, dependsOnId: t6_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t6_5.id, dependsOnId: t6_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            // Techos
            { taskId: t7_2.id, dependsOnId: t7_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 3 },
            { taskId: t7_3.id, dependsOnId: t7_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t7_4.id, dependsOnId: t7_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            // Revoques
            { taskId: t8_2.id, dependsOnId: t8_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t8_3.id, dependsOnId: t8_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t8_4.id, dependsOnId: t8_2.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t8_5.id, dependsOnId: t8_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 1 },
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
            status: client_1.ProjectStatus.IN_PROGRESS,
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
            { name: 'Encofrado y hormigonado Piso 1', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-09-01'), plannedEndDate: new Date('2024-09-20'), actualStartDate: new Date('2024-08-28'), actualEndDate: new Date('2024-09-18'), estimatedHours: 120, actualHours: 115, progress: 100, stageId: p2Stage3.id },
            { name: 'Encofrado y hormigonado Piso 2', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-09-21'), plannedEndDate: new Date('2024-10-10'), actualStartDate: new Date('2024-09-20'), actualEndDate: new Date('2024-10-08'), estimatedHours: 120, actualHours: 110, progress: 100, stageId: p2Stage3.id },
            { name: 'Encofrado y hormigonado Piso 3', status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-10-11'), plannedEndDate: new Date('2024-10-30'), actualStartDate: new Date('2024-10-10'), estimatedHours: 120, actualHours: 80, progress: 65, stageId: p2Stage3.id },
            { name: 'Encofrado y hormigonado Piso 4', status: client_1.TaskStatus.PENDING, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-11-01'), plannedEndDate: new Date('2024-11-20'), estimatedHours: 120, progress: 0, stageId: p2Stage3.id },
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
            status: client_1.ProjectStatus.PLANNING,
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
            status: client_1.ProjectStatus.COMPLETED,
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
    const t4_1_1 = await prisma.task.create({ data: { name: 'Limpieza y nivelación del terreno', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-06-01'), plannedEndDate: new Date('2023-06-03'), actualStartDate: new Date('2023-06-01'), actualEndDate: new Date('2023-06-02'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p4Stage1.id } });
    const t4_1_2 = await prisma.task.create({ data: { name: 'Cerco perimetral y cartel de obra', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-06-03'), plannedEndDate: new Date('2023-06-05'), actualStartDate: new Date('2023-06-03'), actualEndDate: new Date('2023-06-05'), estimatedHours: 16, actualHours: 16, progress: 100, stageId: p4Stage1.id } });
    const t4_1_3 = await prisma.task.create({ data: { name: 'Replanteo y obrador', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-06-06'), plannedEndDate: new Date('2023-06-10'), actualStartDate: new Date('2023-06-06'), actualEndDate: new Date('2023-06-10'), estimatedHours: 20, actualHours: 18, progress: 100, stageId: p4Stage1.id } });
    // Stage 2: Fundaciones
    const t4_2_1 = await prisma.task.create({ data: { name: 'Excavación de bases', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-06-13'), plannedEndDate: new Date('2023-06-16'), actualStartDate: new Date('2023-06-12'), actualEndDate: new Date('2023-06-15'), estimatedHours: 24, actualHours: 22, progress: 100, stageId: p4Stage2.id } });
    const t4_2_2 = await prisma.task.create({ data: { name: 'Armado de hierros y encofrado', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-06-19'), plannedEndDate: new Date('2023-06-28'), actualStartDate: new Date('2023-06-16'), actualEndDate: new Date('2023-06-28'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p4Stage2.id } });
    const t4_2_3 = await prisma.task.create({ data: { name: 'Hormigonado de fundaciones', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2023-06-29'), plannedEndDate: new Date('2023-07-03'), actualStartDate: new Date('2023-06-29'), actualEndDate: new Date('2023-07-01'), estimatedHours: 16, actualHours: 14, progress: 100, stageId: p4Stage2.id } });
    const t4_2_4 = await prisma.task.create({ data: { name: 'Impermeabilización de cimientos', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-07-04'), plannedEndDate: new Date('2023-07-08'), actualStartDate: new Date('2023-07-03'), actualEndDate: new Date('2023-07-08'), estimatedHours: 16, actualHours: 18, progress: 100, stageId: p4Stage2.id } });
    // Stage 3: Estructura
    const t4_3_1 = await prisma.task.create({ data: { name: 'Columnas planta baja', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-07-10'), plannedEndDate: new Date('2023-07-18'), actualStartDate: new Date('2023-07-10'), actualEndDate: new Date('2023-07-19'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage3.id } });
    const t4_3_2 = await prisma.task.create({ data: { name: 'Vigas y encofrado losa', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-07-19'), plannedEndDate: new Date('2023-08-04'), actualStartDate: new Date('2023-07-20'), actualEndDate: new Date('2023-08-08'), estimatedHours: 64, actualHours: 72, progress: 100, stageId: p4Stage3.id } });
    const t4_3_3 = await prisma.task.create({ data: { name: 'Hormigonado losa entrepiso (16m³)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2023-08-07'), plannedEndDate: new Date('2023-08-08'), actualStartDate: new Date('2023-08-09'), actualEndDate: new Date('2023-08-09'), estimatedHours: 10, actualHours: 10, progress: 100, stageId: p4Stage3.id } });
    const t4_3_4 = await prisma.task.create({ data: { name: 'Escalera de hormigón', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-08-09'), plannedEndDate: new Date('2023-08-18'), actualStartDate: new Date('2023-08-14'), actualEndDate: new Date('2023-08-25'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage3.id } });
    const t4_3_5 = await prisma.task.create({ data: { name: 'Columnas y vigas planta alta', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-08-21'), plannedEndDate: new Date('2023-09-05'), actualStartDate: new Date('2023-08-28'), actualEndDate: new Date('2023-09-10'), estimatedHours: 56, actualHours: 60, progress: 100, stageId: p4Stage3.id } });
    // Stage 4: Mampostería
    const t4_4_1 = await prisma.task.create({ data: { name: 'Paredes exteriores PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-09-11'), plannedEndDate: new Date('2023-09-22'), actualStartDate: new Date('2023-09-11'), actualEndDate: new Date('2023-09-25'), estimatedHours: 48, actualHours: 52, progress: 100, stageId: p4Stage4.id } });
    const t4_4_2 = await prisma.task.create({ data: { name: 'Tabiques interiores PB', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-09-20'), plannedEndDate: new Date('2023-09-29'), actualStartDate: new Date('2023-09-22'), actualEndDate: new Date('2023-10-02'), estimatedHours: 36, actualHours: 38, progress: 100, stageId: p4Stage4.id } });
    const t4_4_3 = await prisma.task.create({ data: { name: 'Paredes exteriores e interiores PA', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-10-02'), plannedEndDate: new Date('2023-10-15'), actualStartDate: new Date('2023-10-03'), actualEndDate: new Date('2023-10-20'), estimatedHours: 56, actualHours: 62, progress: 100, stageId: p4Stage4.id } });
    // Stage 5: Instalaciones
    const t4_5_1 = await prisma.task.create({ data: { name: 'Cañerías eléctricas embutidas', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-10-22'), plannedEndDate: new Date('2023-11-03'), actualStartDate: new Date('2023-10-22'), actualEndDate: new Date('2023-11-02'), estimatedHours: 48, actualHours: 46, progress: 100, stageId: p4Stage5.id } });
    const t4_5_2 = await prisma.task.create({ data: { name: 'Cableado y tablero eléctrico', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-11-06'), plannedEndDate: new Date('2023-11-15'), actualStartDate: new Date('2023-11-03'), actualEndDate: new Date('2023-11-14'), estimatedHours: 40, actualHours: 38, progress: 100, stageId: p4Stage5.id } });
    const t4_5_3 = await prisma.task.create({ data: { name: 'Agua fría y caliente', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-10-25'), plannedEndDate: new Date('2023-11-08'), actualStartDate: new Date('2023-10-25'), actualEndDate: new Date('2023-11-10'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage5.id } });
    const t4_5_4 = await prisma.task.create({ data: { name: 'Desagües cloacales y pluviales', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-11-06'), plannedEndDate: new Date('2023-11-17'), actualStartDate: new Date('2023-11-08'), actualEndDate: new Date('2023-11-22'), estimatedHours: 36, actualHours: 42, progress: 100, stageId: p4Stage5.id } });
    const t4_5_5 = await prisma.task.create({ data: { name: 'Instalación de gas', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-11-20'), plannedEndDate: new Date('2023-11-28'), actualStartDate: new Date('2023-11-23'), actualEndDate: new Date('2023-12-01'), estimatedHours: 24, actualHours: 26, progress: 100, stageId: p4Stage5.id } });
    const t4_5_6 = await prisma.task.create({ data: { name: 'Pruebas hidráulicas y eléctricas', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2023-11-29'), plannedEndDate: new Date('2023-11-30'), actualStartDate: new Date('2023-12-02'), actualEndDate: new Date('2023-12-05'), estimatedHours: 12, actualHours: 16, progress: 100, stageId: p4Stage5.id } });
    // Stage 6: Techos
    const t4_6_1 = await prisma.task.create({ data: { name: 'Tirantería de madera', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-11-20'), plannedEndDate: new Date('2023-11-30'), actualStartDate: new Date('2023-11-20'), actualEndDate: new Date('2023-11-30'), estimatedHours: 40, actualHours: 40, progress: 100, stageId: p4Stage6.id } });
    const t4_6_2 = await prisma.task.create({ data: { name: 'Membrana y cubierta de tejas', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-12-01'), plannedEndDate: new Date('2023-12-10'), actualStartDate: new Date('2023-12-01'), actualEndDate: new Date('2023-12-12'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage6.id } });
    const t4_6_3 = await prisma.task.create({ data: { name: 'Canaletas y bajadas', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2023-12-11'), plannedEndDate: new Date('2023-12-15'), actualStartDate: new Date('2023-12-13'), actualEndDate: new Date('2023-12-18'), estimatedHours: 16, actualHours: 18, progress: 100, stageId: p4Stage6.id } });
    // Stage 7: Revoques
    const t4_7_1 = await prisma.task.create({ data: { name: 'Revoque grueso interior', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2023-12-20'), plannedEndDate: new Date('2024-01-05'), actualStartDate: new Date('2023-12-20'), actualEndDate: new Date('2024-01-05'), estimatedHours: 56, actualHours: 56, progress: 100, stageId: p4Stage7.id } });
    const t4_7_2 = await prisma.task.create({ data: { name: 'Revoque grueso exterior', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-01-03'), plannedEndDate: new Date('2024-01-12'), actualStartDate: new Date('2024-01-04'), actualEndDate: new Date('2024-01-14'), estimatedHours: 48, actualHours: 50, progress: 100, stageId: p4Stage7.id } });
    const t4_7_3 = await prisma.task.create({ data: { name: 'Contrapisos', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-01-08'), plannedEndDate: new Date('2024-01-15'), actualStartDate: new Date('2024-01-10'), actualEndDate: new Date('2024-01-18'), estimatedHours: 32, actualHours: 34, progress: 100, stageId: p4Stage7.id } });
    const t4_7_4 = await prisma.task.create({ data: { name: 'Revoque fino (enlucido)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-01-15'), plannedEndDate: new Date('2024-01-20'), actualStartDate: new Date('2024-01-18'), actualEndDate: new Date('2024-01-25'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage7.id } });
    // Stage 8: Pisos
    const t4_8_1 = await prisma.task.create({ data: { name: 'Porcelanato living/cocina', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-01-26'), plannedEndDate: new Date('2024-02-02'), actualStartDate: new Date('2024-01-26'), actualEndDate: new Date('2024-02-05'), estimatedHours: 36, actualHours: 40, progress: 100, stageId: p4Stage8.id } });
    const t4_8_2 = await prisma.task.create({ data: { name: 'Cerámicos en baños y cocina', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-02-03'), plannedEndDate: new Date('2024-02-10'), actualStartDate: new Date('2024-02-05'), actualEndDate: new Date('2024-02-14'), estimatedHours: 40, actualHours: 44, progress: 100, stageId: p4Stage8.id } });
    const t4_8_3 = await prisma.task.create({ data: { name: 'Piso flotante en dormitorios', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-02-12'), plannedEndDate: new Date('2024-02-15'), actualStartDate: new Date('2024-02-15'), actualEndDate: new Date('2024-02-20'), estimatedHours: 20, actualHours: 22, progress: 100, stageId: p4Stage8.id } });
    // Stage 9: Pintura y Terminaciones
    const t4_9_1 = await prisma.task.create({ data: { name: 'Pintura interior (2 manos)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-02-21'), plannedEndDate: new Date('2024-03-04'), actualStartDate: new Date('2024-02-21'), actualEndDate: new Date('2024-03-06'), estimatedHours: 48, actualHours: 52, progress: 100, stageId: p4Stage9.id } });
    const t4_9_2 = await prisma.task.create({ data: { name: 'Pintura exterior', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-03-01'), plannedEndDate: new Date('2024-03-08'), actualStartDate: new Date('2024-03-04'), actualEndDate: new Date('2024-03-12'), estimatedHours: 32, actualHours: 36, progress: 100, stageId: p4Stage9.id } });
    const t4_9_3 = await prisma.task.create({ data: { name: 'Carpintería de aluminio (ventanas y puertas)', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-03-05'), plannedEndDate: new Date('2024-03-12'), actualStartDate: new Date('2024-03-08'), actualEndDate: new Date('2024-03-18'), estimatedHours: 32, actualHours: 36, progress: 100, stageId: p4Stage9.id } });
    const t4_9_4 = await prisma.task.create({ data: { name: 'Mesadas, grifería y artefactos sanitarios', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.HIGH, plannedStartDate: new Date('2024-03-13'), plannedEndDate: new Date('2024-03-20'), actualStartDate: new Date('2024-03-18'), actualEndDate: new Date('2024-03-28'), estimatedHours: 28, actualHours: 32, progress: 100, stageId: p4Stage9.id } });
    // Stage 10: Exterior y Entrega
    const t4_10_1 = await prisma.task.create({ data: { name: 'Vereda perimetral y garage', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.MEDIUM, plannedStartDate: new Date('2024-03-28'), plannedEndDate: new Date('2024-04-03'), actualStartDate: new Date('2024-03-28'), actualEndDate: new Date('2024-04-05'), estimatedHours: 32, actualHours: 34, progress: 100, stageId: p4Stage10.id } });
    const t4_10_2 = await prisma.task.create({ data: { name: 'Parquización y cerco definitivo', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.LOW, plannedStartDate: new Date('2024-04-01'), plannedEndDate: new Date('2024-04-05'), actualStartDate: new Date('2024-04-03'), actualEndDate: new Date('2024-04-08'), estimatedHours: 20, actualHours: 22, progress: 100, stageId: p4Stage10.id } });
    const t4_10_3 = await prisma.task.create({ data: { name: 'Limpieza final y entrega de llaves', status: client_1.TaskStatus.COMPLETED, priority: client_1.TaskPriority.URGENT, plannedStartDate: new Date('2024-04-08'), plannedEndDate: new Date('2024-04-10'), actualStartDate: new Date('2024-04-10'), actualEndDate: new Date('2024-04-15'), estimatedHours: 16, actualHours: 20, progress: 100, stageId: p4Stage10.id } });
    // ---- TASK DEPENDENCIES for Project 4 ----
    await prisma.taskDependency.createMany({
        data: [
            { taskId: t4_1_2.id, dependsOnId: t4_1_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_1_3.id, dependsOnId: t4_1_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_2_1.id, dependsOnId: t4_1_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 1 },
            { taskId: t4_2_2.id, dependsOnId: t4_2_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_2_3.id, dependsOnId: t4_2_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_2_4.id, dependsOnId: t4_2_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 1 },
            { taskId: t4_3_1.id, dependsOnId: t4_2_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_3_2.id, dependsOnId: t4_3_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_3_3.id, dependsOnId: t4_3_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_3_4.id, dependsOnId: t4_3_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 2 },
            { taskId: t4_3_5.id, dependsOnId: t4_3_4.id, dependencyType: client_1.DependencyType.SS, lagDays: 3 },
            { taskId: t4_4_1.id, dependsOnId: t4_3_5.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_4_2.id, dependsOnId: t4_4_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_4_3.id, dependsOnId: t4_4_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_5_1.id, dependsOnId: t4_4_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_5_2.id, dependsOnId: t4_5_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_5_3.id, dependsOnId: t4_4_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 7 },
            { taskId: t4_5_4.id, dependsOnId: t4_5_3.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_5_5.id, dependsOnId: t4_5_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_5_6.id, dependsOnId: t4_5_5.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_6_1.id, dependsOnId: t4_4_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_6_2.id, dependsOnId: t4_6_1.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_6_3.id, dependsOnId: t4_6_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_7_1.id, dependsOnId: t4_5_6.id, dependencyType: client_1.DependencyType.FS, lagDays: 7 },
            { taskId: t4_7_2.id, dependsOnId: t4_7_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_7_3.id, dependsOnId: t4_7_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 3 },
            { taskId: t4_7_4.id, dependsOnId: t4_7_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 1 },
            { taskId: t4_8_1.id, dependsOnId: t4_7_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 2 },
            { taskId: t4_8_2.id, dependsOnId: t4_8_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 3 },
            { taskId: t4_8_3.id, dependsOnId: t4_8_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_9_1.id, dependsOnId: t4_7_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 5 },
            { taskId: t4_9_2.id, dependsOnId: t4_9_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_9_3.id, dependsOnId: t4_9_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 5 },
            { taskId: t4_9_4.id, dependsOnId: t4_9_3.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_10_1.id, dependsOnId: t4_9_4.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
            { taskId: t4_10_2.id, dependsOnId: t4_10_1.id, dependencyType: client_1.DependencyType.SS, lagDays: 2 },
            { taskId: t4_10_3.id, dependsOnId: t4_10_2.id, dependencyType: client_1.DependencyType.FS, lagDays: 0 },
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
            { reference: 'GAS-2024-00001', description: 'Cemento Portland x 200 bolsas - Inicio de obra', amount: 1780000, taxAmount: 373800, totalAmount: 2153800, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-06-05'), paidDate: new Date('2024-07-05'), invoiceNumber: 'A-0001-00045678', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-06-07') },
            { reference: 'GAS-2024-00002', description: 'Arena gruesa 30m³ + Piedra partida 15m³', amount: 2220000, taxAmount: 466200, totalAmount: 2686200, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-06-20'), paidDate: new Date('2024-07-20'), invoiceNumber: 'A-0001-00045890', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-06-22') },
            { reference: 'GAS-2024-00003', description: 'Hierros varios para estructura - 1er pedido', amount: 4850000, taxAmount: 1018500, totalAmount: 5868500, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-07-08'), paidDate: new Date('2024-07-23'), invoiceNumber: 'A-0002-00012345', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-10') },
            { reference: 'GAS-2024-00004', description: 'Hormigón elaborado H21 - Fundaciones (18m³)', amount: 2970000, taxAmount: 623700, totalAmount: 3593700, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-07-02'), paidDate: new Date('2024-07-02'), invoiceNumber: 'A-0005-00008901', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-01') },
            { reference: 'GAS-2024-00005', description: 'Jornales equipo obra - Junio 2024', amount: 1850000, taxAmount: 0, totalAmount: 1850000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-06-30'), paidDate: new Date('2024-07-05'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-07-01') },
            { reference: 'GAS-2024-00006', description: 'Jornales equipo obra - Julio 2024', amount: 2200000, taxAmount: 0, totalAmount: 2200000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-07-31'), paidDate: new Date('2024-08-05'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-01') },
            { reference: 'GAS-2024-00007', description: 'Hormigón elaborado H21 - Losa PB (22m³)', amount: 3630000, taxAmount: 762300, totalAmount: 4392300, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-08-13'), paidDate: new Date('2024-08-13'), invoiceNumber: 'A-0005-00009234', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-12') },
            { reference: 'GAS-2024-00008', description: 'Hierros para estructura PA', amount: 3200000, taxAmount: 672000, totalAmount: 3872000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-08-20'), paidDate: new Date('2024-09-05'), invoiceNumber: 'A-0002-00013456', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-22') },
            { reference: 'GAS-2024-00009', description: 'Alquiler de grúa torre - Agosto/Septiembre', amount: 2800000, taxAmount: 588000, totalAmount: 3388000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-08-01'), paidDate: new Date('2024-09-01'), invoiceNumber: 'B-0010-00002345', invoiceType: 'B', projectId: project1.id, budgetId: budget1.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-08-03') },
            { reference: 'GAS-2024-00010', description: 'Ladrillos huecos 12cm x 5000 u + 18cm x 3500 u', amount: 1955000, taxAmount: 410550, totalAmount: 2365550, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-09-08'), paidDate: new Date('2024-10-08'), invoiceNumber: 'A-0001-00046789', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-10') },
            { reference: 'GAS-2024-00011', description: 'Jornales equipo obra - Agosto 2024', amount: 2350000, taxAmount: 0, totalAmount: 2350000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-08-31'), paidDate: new Date('2024-09-05'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-01') },
            { reference: 'GAS-2024-00012', description: 'Jornales equipo obra - Septiembre 2024', amount: 2450000, taxAmount: 0, totalAmount: 2450000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-09-30'), paidDate: new Date('2024-10-05'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-10-01') },
            { reference: 'GAS-2024-00013', description: 'Seguro de obra - Póliza anual', amount: 1200000, taxAmount: 0, totalAmount: 1200000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-06-01'), paidDate: new Date('2024-06-01'), projectId: project1.id, budgetId: budget1.id, categoryId: catAdmin.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-05-30') },
            { reference: 'GAS-2024-00014', description: 'Materiales eléctricos - Cables y caños', amount: 1450000, taxAmount: 304500, totalAmount: 1754500, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-10-25'), paidDate: new Date('2024-11-01'), invoiceNumber: 'A-0003-00005678', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supElectrica.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-10-27') },
            { reference: 'GAS-2024-00015', description: 'Fletes y volquetes - Junio a Octubre', amount: 980000, taxAmount: 205800, totalAmount: 1185800, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-10-31'), paidDate: new Date('2024-11-15'), invoiceNumber: 'C-0008-00001234', invoiceType: 'C', projectId: project1.id, budgetId: budget1.id, categoryId: catTransporte.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-01') },
            // APPROVED (waiting payment)
            { reference: 'GAS-2024-00016', description: 'Jornales equipo obra - Octubre 2024', amount: 2600000, taxAmount: 0, totalAmount: 2600000, status: client_1.ExpenseStatus.APPROVED, expenseDate: new Date('2024-10-31'), dueDate: new Date('2024-11-10'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-02') },
            { reference: 'GAS-2024-00017', description: 'Caños PPF y PVC para instalación sanitaria', amount: 680000, taxAmount: 142800, totalAmount: 822800, status: client_1.ExpenseStatus.APPROVED, expenseDate: new Date('2024-11-10'), dueDate: new Date('2024-12-10'), invoiceNumber: 'A-0004-00003456', invoiceType: 'A', projectId: project1.id, budgetId: budget1.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-11-12') },
            // PENDING_APPROVAL
            { reference: 'GAS-2025-00001', description: 'Membrana asfáltica x 15 rollos', amount: 1020000, taxAmount: 214200, totalAmount: 1234200, status: client_1.ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2025-01-02'), projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id },
            { reference: 'GAS-2025-00002', description: 'Jornales equipo obra - Noviembre 2024', amount: 2750000, taxAmount: 0, totalAmount: 2750000, status: client_1.ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2024-11-30'), projectId: project1.id, budgetId: budget1.id, categoryId: catManoObra.id, createdById: administrative.id },
            { reference: 'GAS-2025-00003', description: 'EPP y elementos de seguridad', amount: 320000, taxAmount: 67200, totalAmount: 387200, status: client_1.ExpenseStatus.PENDING_APPROVAL, expenseDate: new Date('2025-01-05'), projectId: project1.id, categoryId: catSeguridad.id, createdById: administrative.id },
            // DRAFT
            { reference: 'GAS-2025-00004', description: 'Cemento Portland x 100 bolsas - Revoques', amount: 890000, taxAmount: 186900, totalAmount: 1076900, status: client_1.ExpenseStatus.DRAFT, expenseDate: new Date('2025-01-20'), projectId: project1.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id },
            // REJECTED
            { reference: 'GAS-2024-00018', description: 'Alquiler de andamios - Proveedor alternativo', amount: 450000, taxAmount: 94500, totalAmount: 544500, status: client_1.ExpenseStatus.REJECTED, expenseDate: new Date('2024-09-15'), projectId: project1.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-09-16'), rejectionReason: 'Precio superior al proveedor habitual. Solicitar cotización a Alqui-Obra.' },
            // ---- Project 2 Expenses ----
            { reference: 'GAS-2024-00019', description: 'Excavación subsuelos - Movimiento de suelos', amount: 18500000, taxAmount: 3885000, totalAmount: 22385000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-03-15'), paidDate: new Date('2024-04-15'), invoiceNumber: 'A-0020-00001234', invoiceType: 'A', projectId: project2.id, budgetId: budget2.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-03-17') },
            { reference: 'GAS-2024-00020', description: 'Hormigón elaborado H25 - Subsuelos (180m³)', amount: 32400000, taxAmount: 6804000, totalAmount: 39204000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-06-01'), paidDate: new Date('2024-06-01'), invoiceNumber: 'A-0005-00010567', invoiceType: 'A', projectId: project2.id, budgetId: budget2.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-05-30') },
            { reference: 'GAS-2024-00021', description: 'Hierros para estructura - Pedido masivo', amount: 28000000, taxAmount: 5880000, totalAmount: 33880000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-05-20'), paidDate: new Date('2024-06-05'), invoiceNumber: 'A-0002-00014567', invoiceType: 'A', projectId: project2.id, budgetId: budget2.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmAndres.id, approvedAt: new Date('2024-05-22') },
            // ---- Project 4 Expenses (Duplex - all PAID) ----
            { reference: 'GAS-2023-00001', description: 'Cemento Portland x 120 bolsas - Inicio de obra', amount: 960000, taxAmount: 201600, totalAmount: 1161600, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-06-08'), paidDate: new Date('2023-07-08'), invoiceNumber: 'A-0001-00038901', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-10') },
            { reference: 'GAS-2023-00002', description: 'Arena gruesa 20m³ + Piedra partida 10m³', amount: 1300000, taxAmount: 273000, totalAmount: 1573000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-06-15'), paidDate: new Date('2023-07-15'), invoiceNumber: 'A-0001-00039012', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-17') },
            { reference: 'GAS-2023-00003', description: 'Hierros para estructura completa', amount: 3800000, taxAmount: 798000, totalAmount: 4598000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-07-05'), paidDate: new Date('2023-07-20'), invoiceNumber: 'A-0002-00009876', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supHierros.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-07-07') },
            { reference: 'GAS-2023-00004', description: 'Hormigón elaborado H21 - Fundaciones (12m³)', amount: 1800000, taxAmount: 378000, totalAmount: 2178000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-06-29'), paidDate: new Date('2023-06-29'), invoiceNumber: 'A-0005-00006789', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-06-28') },
            { reference: 'GAS-2023-00005', description: 'Hormigón elaborado H21 - Losa entrepiso (16m³)', amount: 2400000, taxAmount: 504000, totalAmount: 2904000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-08-09'), paidDate: new Date('2023-08-09'), invoiceNumber: 'A-0005-00007123', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supHormigon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-08-08') },
            { reference: 'GAS-2023-00006', description: 'Ladrillos huecos 12cm x 3000u + 18cm x 2500u', amount: 1285000, taxAmount: 269850, totalAmount: 1554850, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-09-05'), paidDate: new Date('2023-10-05'), invoiceNumber: 'A-0001-00040234', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supCorralon.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-09-07') },
            { reference: 'GAS-2023-00007', description: 'Jornales equipo obra - Jun a Sep 2023', amount: 6800000, taxAmount: 0, totalAmount: 6800000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-09-30'), paidDate: new Date('2023-10-05'), projectId: project4.id, budgetId: budget4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-01') },
            { reference: 'GAS-2023-00008', description: 'Materiales eléctricos completos', amount: 1100000, taxAmount: 231000, totalAmount: 1331000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-10-20'), paidDate: new Date('2023-10-27'), invoiceNumber: 'A-0003-00004321', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supElectrica.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-22') },
            { reference: 'GAS-2023-00009', description: 'Caños y accesorios sanitarios', amount: 780000, taxAmount: 163800, totalAmount: 943800, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-10-23'), paidDate: new Date('2023-11-23'), invoiceNumber: 'A-0004-00002345', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-10-25') },
            { reference: 'GAS-2023-00010', description: 'Jornales equipo obra - Oct a Dic 2023', amount: 7200000, taxAmount: 0, totalAmount: 7200000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-12-31'), paidDate: new Date('2024-01-05'), projectId: project4.id, budgetId: budget4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-01-02') },
            { reference: 'GAS-2024-00022', description: 'Tirantería y cubierta de tejas', amount: 2200000, taxAmount: 462000, totalAmount: 2662000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-11-18'), paidDate: new Date('2023-12-18'), invoiceNumber: 'B-0015-00001234', invoiceType: 'B', projectId: project4.id, budgetId: budget4.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-11-20') },
            { reference: 'GAS-2024-00023', description: 'Porcelanatos, cerámicos y piso flotante', amount: 3500000, taxAmount: 735000, totalAmount: 4235000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-01-22'), paidDate: new Date('2024-02-22'), invoiceNumber: 'A-0025-00003456', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-01-24') },
            { reference: 'GAS-2024-00024', description: 'Carpintería de aluminio - Ventanas y puertas', amount: 4800000, taxAmount: 1008000, totalAmount: 5808000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-03-05'), paidDate: new Date('2024-04-05'), invoiceNumber: 'A-0030-00001234', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catSubcontratos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-03-07') },
            { reference: 'GAS-2024-00025', description: 'Jornales equipo obra - Ene a Abr 2024', amount: 8200000, taxAmount: 0, totalAmount: 8200000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-04-15'), paidDate: new Date('2024-04-20'), projectId: project4.id, budgetId: budget4.id, categoryId: catManoObra.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-16') },
            { reference: 'GAS-2024-00026', description: 'Pintura interior y exterior completa', amount: 1800000, taxAmount: 378000, totalAmount: 2178000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-02-20'), paidDate: new Date('2024-03-20'), invoiceNumber: 'B-0012-00005678', invoiceType: 'B', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supPintura.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-02-22') },
            { reference: 'GAS-2024-00027', description: 'Mesadas, grifería y artefactos sanitarios', amount: 2800000, taxAmount: 588000, totalAmount: 3388000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-03-15'), paidDate: new Date('2024-04-15'), invoiceNumber: 'A-0004-00004567', invoiceType: 'A', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, supplierId: supSanitarios.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-03-17') },
            { reference: 'GAS-2024-00028', description: 'Seguro de obra - Póliza anual', amount: 650000, taxAmount: 0, totalAmount: 650000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-06-01'), paidDate: new Date('2023-06-01'), projectId: project4.id, budgetId: budget4.id, categoryId: catAdmin.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-05-30') },
            { reference: 'GAS-2024-00029', description: 'Alquiler equipos y herramientas varios', amount: 1400000, taxAmount: 294000, totalAmount: 1694000, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2023-12-15'), paidDate: new Date('2024-01-15'), invoiceNumber: 'C-0009-00002345', invoiceType: 'C', projectId: project4.id, budgetId: budget4.id, categoryId: catEquipos.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2023-12-17') },
            { reference: 'GAS-2024-00030', description: 'Fletes y volquetes - Obra completa', amount: 780000, taxAmount: 163800, totalAmount: 943800, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-04-10'), paidDate: new Date('2024-04-25'), invoiceNumber: 'C-0008-00002345', invoiceType: 'C', projectId: project4.id, budgetId: budget4.id, categoryId: catTransporte.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-12') },
            { reference: 'GAS-2024-00031', description: 'Vereda perimetral y parquización', amount: 950000, taxAmount: 199500, totalAmount: 1149500, status: client_1.ExpenseStatus.PAID, expenseDate: new Date('2024-04-03'), paidDate: new Date('2024-05-03'), invoiceNumber: 'C-0011-00001234', invoiceType: 'C', projectId: project4.id, budgetId: budget4.id, categoryId: catMateriales.id, createdById: administrative.id, approvedById: pmMaria.id, approvedAt: new Date('2024-04-05') },
        ],
    });
    console.log('   ✅ 45 expenses (P1: 22, P2: 3, P4: 20 - all states)');
    // Associate expenses with tasks (update taskId by reference)
    console.log('   🔗 Linking expenses to tasks...');
    const expenseTaskMap = {
        // ---- Project 1: Casa Familia Rodríguez ----
        // Cemento 200 bolsas → fue para fundaciones y estructura, asociar con hormigonado columnas PB
        'GAS-2024-00003': t3_1.id, // Hierros varios 1er pedido → Armado columnas PB
        'GAS-2024-00004': t3_2.id, // Hormigón H21 Fundaciones → Hormigonado columnas PB (fundaciones/estructura)
        'GAS-2024-00007': t3_5.id, // Hormigón H21 Losa PB 22m³ → Hormigonado losa PB (match exacto)
        'GAS-2024-00008': t3_7.id, // Hierros para estructura PA → Columnas y vigas PA
        'GAS-2024-00009': t3_8.id, // Alquiler grúa torre Ago/Sep → Losa PA (la grúa se usó para la losa)
        'GAS-2024-00010': t3_7.id, // Ladrillos → se usaron durante etapa estructura PA (mampostería en paralelo)
        'GAS-2024-00014': t5_1.id, // Materiales eléctricos → Cañerías embutidas PB
        'GAS-2024-00017': t6_1.id, // Caños PPF y PVC sanitaria → Instalación agua fría y caliente PB
        'GAS-2025-00001': t7_2.id, // Membrana asfáltica → Colocación de membrana asfáltica (match exacto)
        'GAS-2025-00004': t8_1.id, // Cemento para revoques → Revoque grueso exterior
        // ---- Project 4: Duplex Familia López ----
        'GAS-2023-00001': t4_2_3.id, // Cemento 120 bolsas inicio → Hormigonado de fundaciones
        'GAS-2023-00002': t4_2_1.id, // Arena + Piedra → Excavación de bases (materiales para fundaciones)
        'GAS-2023-00003': t4_3_1.id, // Hierros estructura completa → Columnas planta baja
        'GAS-2023-00004': t4_2_3.id, // Hormigón H21 Fundaciones 12m³ → Hormigonado de fundaciones
        'GAS-2023-00005': t4_3_3.id, // Hormigón H21 Losa entrepiso 16m³ → Hormigonado losa entrepiso (match exacto)
        'GAS-2023-00006': t4_4_1.id, // Ladrillos → Paredes exteriores PB
        'GAS-2023-00008': t4_5_1.id, // Materiales eléctricos → Cañerías eléctricas embutidas
        'GAS-2023-00009': t4_5_3.id, // Caños y accesorios sanitarios → Agua fría y caliente
        'GAS-2024-00022': t4_6_2.id, // Tirantería y cubierta tejas → Membrana y cubierta de tejas
        'GAS-2024-00023': t4_8_1.id, // Porcelanatos, cerámicos, piso flotante → Porcelanato living/cocina
        'GAS-2024-00024': t4_9_3.id, // Carpintería aluminio → Carpintería de aluminio (match exacto)
        'GAS-2024-00026': t4_9_1.id, // Pintura interior y exterior → Pintura interior (2 manos)
        'GAS-2024-00027': t4_9_4.id, // Mesadas, grifería y artefactos → Mesadas, grifería y artefactos (match exacto)
        'GAS-2024-00031': t4_10_1.id, // Vereda perimetral y parquización → Vereda perimetral y garage
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
            orderNumber: 'OC-2025-00001', status: client_1.PurchaseOrderStatus.CONFIRMED,
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
            orderNumber: 'OC-2025-00002', status: client_1.PurchaseOrderStatus.SENT,
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
            orderNumber: 'OC-2024-00010', status: client_1.PurchaseOrderStatus.COMPLETED,
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
    const attendanceData = [];
    const today = new Date();
    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
        for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (weekOffset * 7) - (today.getDay() - dayOfWeek));
            if (date > today)
                continue;
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            for (const emp of allEmployees) {
                // Simulate realistic attendance patterns
                let type = client_1.AttendanceType.PRESENT;
                let hoursWorked = 8;
                let overtimeHours = 0;
                let checkInHour = 8;
                let checkOutHour = 17;
                let notes = null;
                const rand = Math.random();
                if (emp.id === empAyudante2.id && weekOffset === 0 && dayOfWeek === 3) {
                    type = client_1.AttendanceType.ABSENT;
                    hoursWorked = 0;
                    notes = 'Falta sin aviso';
                }
                else if (emp.id === empPlomero.id && weekOffset === 1 && dayOfWeek >= 4) {
                    type = client_1.AttendanceType.ABSENT;
                    hoursWorked = 0;
                    notes = 'Licencia por enfermedad';
                }
                else if (rand > 0.92) {
                    type = client_1.AttendanceType.LATE;
                    checkInHour = 9;
                    hoursWorked = 7;
                    notes = 'Llegó tarde - problemas de transporte';
                }
                else if (rand > 0.88) {
                    overtimeHours = 2;
                    checkOutHour = 19;
                    hoursWorked = 10;
                    notes = 'Horas extra - atraso losa';
                }
                else if (emp.id === empCapataz.id) {
                    overtimeHours = weekOffset === 0 ? 1 : 0;
                    checkOutHour = weekOffset === 0 ? 18 : 17;
                    hoursWorked = weekOffset === 0 ? 9 : 8;
                }
                attendanceData.push({
                    date: dateOnly,
                    checkIn: type !== client_1.AttendanceType.ABSENT ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), checkInHour, 0) : null,
                    checkOut: type !== client_1.AttendanceType.ABSENT ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), checkOutHour, 0) : null,
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
            { type: client_1.NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00001 (Membrana asfáltica x 15 rollos - $1.234.200) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
            { type: client_1.NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00002 (Jornales Noviembre - $2.750.000) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
            { type: client_1.NotificationType.EXPENSE_APPROVAL, title: 'Gasto pendiente de aprobación', message: 'El gasto GAS-2025-00003 (EPP y seguridad - $387.200) requiere su aprobación.', entityType: 'expense', userId: pmMaria.id },
            { type: client_1.NotificationType.TASK_ASSIGNED, title: 'Nueva tarea asignada', message: 'Se te asignó la tarea "Cableado general" en el proyecto Casa Familia Rodríguez.', entityType: 'task', entityId: t5_3.id, userId: supervisor.id, isRead: true, readAt: new Date('2024-11-12') },
            { type: client_1.NotificationType.TASK_OVERDUE, title: 'Tarea con atraso', message: 'La tarea "Colocación de membrana asfáltica" lleva 3 días de atraso respecto al plan.', entityType: 'task', entityId: t7_2.id, userId: pmMaria.id },
            { type: client_1.NotificationType.BUDGET_ALERT, title: 'Alerta de presupuesto', message: 'El proyecto Casa Familia Rodríguez alcanzó el 65% del presupuesto con un 65% de avance. El gasto está en línea con el plan.', entityType: 'project', entityId: project1.id, userId: pmMaria.id },
            { type: client_1.NotificationType.STOCK_LOW, title: 'Stock bajo de material', message: 'El material "Cable Unipolar 2.5mm² Rojo" (MAT-00015) tiene stock bajo: 13 rollos (mínimo: 5). Considerar reposición.', entityType: 'material', userId: administrative.id },
            { type: client_1.NotificationType.PROJECT_UPDATE, title: 'Proyecto completado', message: 'El proyecto "Duplex Familia López" ha sido marcado como completado. Felicitaciones al equipo!', entityType: 'project', entityId: project4.id, userId: admin.id, isRead: true, readAt: new Date('2024-04-16') },
            { type: client_1.NotificationType.GENERAL, title: 'Reunión de avance semanal', message: 'Recordatorio: Reunión de avance de obras todos los lunes a las 9:00hs en oficina central.', userId: pmMaria.id },
            { type: client_1.NotificationType.GENERAL, title: 'Reunión de avance semanal', message: 'Recordatorio: Reunión de avance de obras todos los lunes a las 9:00hs en oficina central.', userId: pmAndres.id },
        ],
    });
    console.log('   ✅ 10 notifications');
    // ============================================
    // AUDIT LOGS
    // ============================================
    console.log('📝 Creating audit logs...');
    await prisma.auditLog.createMany({
        data: [
            { action: client_1.AuditAction.CREATE, entityType: 'project', entityId: project1.id, newValues: { name: 'Casa Familia Rodríguez - Nordelta', status: 'PLANNING' }, userId: pmMaria.id, createdAt: new Date('2024-05-15') },
            { action: client_1.AuditAction.UPDATE, entityType: 'project', entityId: project1.id, oldValues: { status: 'PLANNING' }, newValues: { status: 'IN_PROGRESS' }, userId: pmMaria.id, createdAt: new Date('2024-06-01') },
            { action: client_1.AuditAction.UPDATE, entityType: 'project', entityId: project1.id, oldValues: { progress: 38 }, newValues: { progress: 65 }, userId: supervisor.id, createdAt: new Date('2025-01-15') },
            { action: client_1.AuditAction.CREATE, entityType: 'expense', entityId: 'seed-expense', newValues: { reference: 'GAS-2024-00001', amount: 2153800 }, userId: administrative.id, createdAt: new Date('2024-06-05') },
            { action: client_1.AuditAction.UPDATE, entityType: 'expense', entityId: 'seed-expense', oldValues: { status: 'PENDING_APPROVAL' }, newValues: { status: 'APPROVED' }, userId: pmMaria.id, createdAt: new Date('2024-06-07') },
            { action: client_1.AuditAction.UPDATE, entityType: 'project', entityId: project4.id, oldValues: { status: 'IN_PROGRESS', progress: 98 }, newValues: { status: 'COMPLETED', progress: 100 }, userId: pmMaria.id, createdAt: new Date('2024-04-15') },
            { action: client_1.AuditAction.CREATE, entityType: 'employee', entityId: empAyudante2.id, newValues: { firstName: 'Luciano', lastName: 'Acosta', position: 'Ayudante' }, userId: admin.id, createdAt: new Date('2024-03-01') },
            { action: client_1.AuditAction.UPDATE, entityType: 'task', entityId: t5_3.id, oldValues: { status: 'PENDING' }, newValues: { status: 'IN_PROGRESS' }, userId: supervisor.id, createdAt: new Date('2024-11-11') },
        ],
    });
    console.log('   ✅ 8 audit log entries');
    // ============================================
    // SUMMARY
    // ============================================
    console.log('');
    console.log('================================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('================================================');
    console.log('');
    console.log('📊 Summary:');
    console.log('   🏢 1 Organization: Constructora Patagonia S.A.');
    console.log('   👥 6 Users (admin, 2 PM, supervisor, admin contable, cliente)');
    console.log('   📁 7 Expense categories + 8 Material categories');
    console.log('   🧱 27 Materials with supplier links');
    console.log('   🏪 6 Suppliers with contact & banking info');
    console.log('   👷 8 Employees (capataz, albañiles, electricista, plomero, ayudantes, pintor)');
    console.log('   🏗️ 4 Projects:');
    console.log('      • Casa Rodríguez (IN_PROGRESS 65%) - 11 stages, 35+ tasks, Gantt completo');
    console.log('      • Edificio Mirador (IN_PROGRESS 28%) - 7 stages');
    console.log('      • Remodelación Florida (PLANNING 0%)');
    console.log('      • Duplex López (COMPLETED 100%) - 10 stages, 38 tasks, Gantt completo, 20 gastos');
    console.log('   💰 3 Budgets with category breakdown');
    console.log('   💸 45 Expenses (paid, approved, pending, draft, rejected)');
    console.log('   📋 3 Purchase orders (completed, confirmed, sent)');
    console.log('   📦 15 Stock movements (IN, OUT, ADJUSTMENT)');
    console.log(`   📅 ${attendanceData.length} Attendance records (3 weeks)`);
    console.log('   💬 13 Comments on projects and tasks');
    console.log('   🔔 10 Notifications');
    console.log('   📝 8 Audit log entries');
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
//# sourceMappingURL=seed.js.map