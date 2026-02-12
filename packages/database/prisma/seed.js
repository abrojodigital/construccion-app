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
    console.log('🌱 Starting seed...');
    // Clean up existing data
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
    // Create Organization
    console.log('🏢 Creating organization...');
    const organization = await prisma.organization.create({
        data: {
            name: 'Constructora Demo S.A.',
            cuit: '30-12345678-9',
            address: 'Av. Corrientes 1234, Piso 5',
            city: 'Buenos Aires',
            province: 'Ciudad Autónoma de Buenos Aires',
            phone: '+54 11 4567-8900',
            email: 'info@constructorademo.com.ar',
        },
    });
    console.log(`   Created: ${organization.name}`);
    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@constructorademo.com.ar',
                password: hashedPassword,
                firstName: 'Carlos',
                lastName: 'Administrador',
                phone: '+54 11 1234-5678',
                role: client_1.UserRole.ADMIN,
                organizationId: organization.id,
            },
        }),
        prisma.user.create({
            data: {
                email: 'jefe@constructorademo.com.ar',
                password: hashedPassword,
                firstName: 'María',
                lastName: 'González',
                phone: '+54 11 2345-6789',
                role: client_1.UserRole.PROJECT_MANAGER,
                organizationId: organization.id,
            },
        }),
        prisma.user.create({
            data: {
                email: 'supervisor@constructorademo.com.ar',
                password: hashedPassword,
                firstName: 'Juan',
                lastName: 'Pérez',
                phone: '+54 11 3456-7890',
                role: client_1.UserRole.SUPERVISOR,
                organizationId: organization.id,
            },
        }),
        prisma.user.create({
            data: {
                email: 'admin.contable@constructorademo.com.ar',
                password: hashedPassword,
                firstName: 'Laura',
                lastName: 'Martínez',
                phone: '+54 11 4567-8901',
                role: client_1.UserRole.ADMINISTRATIVE,
                organizationId: organization.id,
            },
        }),
        prisma.user.create({
            data: {
                email: 'cliente@ejemplo.com.ar',
                password: hashedPassword,
                firstName: 'Roberto',
                lastName: 'Cliente',
                phone: '+54 11 5678-9012',
                role: client_1.UserRole.READ_ONLY,
                organizationId: organization.id,
            },
        }),
    ]);
    console.log(`   Created ${users.length} users`);
    // Create Expense Categories
    console.log('📁 Creating expense categories...');
    const expenseCategories = await Promise.all([
        prisma.expenseCategory.create({
            data: { name: 'Materiales', code: 'MAT', color: '#3B82F6', organizationId: organization.id },
        }),
        prisma.expenseCategory.create({
            data: { name: 'Mano de Obra', code: 'MO', color: '#10B981', organizationId: organization.id },
        }),
        prisma.expenseCategory.create({
            data: { name: 'Equipos y Herramientas', code: 'EQ', color: '#F59E0B', organizationId: organization.id },
        }),
        prisma.expenseCategory.create({
            data: { name: 'Subcontratistas', code: 'SUB', color: '#8B5CF6', organizationId: organization.id },
        }),
        prisma.expenseCategory.create({
            data: { name: 'Transporte', code: 'TRANS', color: '#EC4899', organizationId: organization.id },
        }),
        prisma.expenseCategory.create({
            data: { name: 'Gastos Administrativos', code: 'ADM', color: '#6B7280', organizationId: organization.id },
        }),
    ]);
    console.log(`   Created ${expenseCategories.length} expense categories`);
    // Create Material Categories
    console.log('📦 Creating material categories...');
    const materialCategories = await Promise.all([
        prisma.materialCategory.create({
            data: { name: 'Cemento y Agregados', code: 'CEM', organizationId: organization.id },
        }),
        prisma.materialCategory.create({
            data: { name: 'Ladrillos y Bloques', code: 'LAD', organizationId: organization.id },
        }),
        prisma.materialCategory.create({
            data: { name: 'Hierros y Aceros', code: 'HIE', organizationId: organization.id },
        }),
        prisma.materialCategory.create({
            data: { name: 'Electricidad', code: 'ELEC', organizationId: organization.id },
        }),
        prisma.materialCategory.create({
            data: { name: 'Plomería', code: 'PLOM', organizationId: organization.id },
        }),
        prisma.materialCategory.create({
            data: { name: 'Pintura', code: 'PINT', organizationId: organization.id },
        }),
    ]);
    console.log(`   Created ${materialCategories.length} material categories`);
    // Create Materials
    console.log('🧱 Creating materials...');
    const materials = await Promise.all([
        prisma.material.create({
            data: {
                code: 'MAT-00001',
                name: 'Cemento Portland',
                description: 'Bolsa de 50kg',
                unit: 'bolsa',
                currentStock: 150,
                minimumStock: 50,
                lastPurchasePrice: 8500,
                categoryId: materialCategories[0].id,
                organizationId: organization.id,
            },
        }),
        prisma.material.create({
            data: {
                code: 'MAT-00002',
                name: 'Arena Gruesa',
                description: 'Metro cúbico',
                unit: 'm3',
                currentStock: 25,
                minimumStock: 10,
                lastPurchasePrice: 45000,
                categoryId: materialCategories[0].id,
                organizationId: organization.id,
            },
        }),
        prisma.material.create({
            data: {
                code: 'MAT-00003',
                name: 'Ladrillo Hueco 12x18x33',
                description: 'Unidad',
                unit: 'unidad',
                currentStock: 3000,
                minimumStock: 1000,
                lastPurchasePrice: 180,
                categoryId: materialCategories[1].id,
                organizationId: organization.id,
            },
        }),
        prisma.material.create({
            data: {
                code: 'MAT-00004',
                name: 'Hierro Ø 8mm',
                description: 'Barra de 12m',
                unit: 'unidad',
                currentStock: 200,
                minimumStock: 50,
                lastPurchasePrice: 12500,
                categoryId: materialCategories[2].id,
                organizationId: organization.id,
            },
        }),
        prisma.material.create({
            data: {
                code: 'MAT-00005',
                name: 'Hierro Ø 10mm',
                description: 'Barra de 12m',
                unit: 'unidad',
                currentStock: 150,
                minimumStock: 40,
                lastPurchasePrice: 18500,
                categoryId: materialCategories[2].id,
                organizationId: organization.id,
            },
        }),
        prisma.material.create({
            data: {
                code: 'MAT-00006',
                name: 'Cable Unipolar 2.5mm',
                description: 'Rollo de 100m',
                unit: 'rollo',
                currentStock: 20,
                minimumStock: 5,
                lastPurchasePrice: 35000,
                categoryId: materialCategories[3].id,
                organizationId: organization.id,
            },
        }),
    ]);
    console.log(`   Created ${materials.length} materials`);
    // Create Suppliers
    console.log('🏪 Creating suppliers...');
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                code: 'PROV-00001',
                name: 'Corralón El Constructor',
                tradeName: 'El Constructor S.R.L.',
                cuit: '30-98765432-1',
                address: 'Ruta 8 Km 45',
                city: 'Pilar',
                province: 'Buenos Aires',
                phone: '+54 230 442-5500',
                email: 'ventas@elconstructor.com.ar',
                contactName: 'Pedro García',
                paymentTerms: '30 días',
                rating: 5,
                organizationId: organization.id,
            },
        }),
        prisma.supplier.create({
            data: {
                code: 'PROV-00002',
                name: 'Hierros del Sur',
                tradeName: 'Hierros del Sur S.A.',
                cuit: '30-87654321-0',
                address: 'Av. Industrial 2500',
                city: 'Avellaneda',
                province: 'Buenos Aires',
                phone: '+54 11 4201-3000',
                email: 'comercial@hierrosdelsur.com.ar',
                contactName: 'Ana Rodríguez',
                paymentTerms: '15 días',
                rating: 4,
                organizationId: organization.id,
            },
        }),
        prisma.supplier.create({
            data: {
                code: 'PROV-00003',
                name: 'Eléctrica Norte',
                tradeName: 'Eléctrica Norte S.A.',
                cuit: '30-76543210-9',
                address: 'Calle San Martín 450',
                city: 'San Isidro',
                province: 'Buenos Aires',
                phone: '+54 11 4732-9900',
                email: 'pedidos@electricanorte.com.ar',
                contactName: 'Martín López',
                paymentTerms: '7 días',
                rating: 4,
                organizationId: organization.id,
            },
        }),
    ]);
    console.log(`   Created ${suppliers.length} suppliers`);
    // Create Employees
    console.log('👷 Creating employees...');
    const employees = await Promise.all([
        prisma.employee.create({
            data: {
                legajo: 'EMP-00001',
                firstName: 'Ricardo',
                lastName: 'Fernández',
                dni: '25678901',
                cuil: '20-25678901-5',
                phone: '+54 11 6789-0123',
                position: 'Oficial Albañil',
                specialty: 'Albañil',
                employmentType: 'PERMANENT',
                hireDate: new Date('2020-03-15'),
                hourlyRate: 2500,
                organizationId: organization.id,
            },
        }),
        prisma.employee.create({
            data: {
                legajo: 'EMP-00002',
                firstName: 'Miguel',
                lastName: 'Torres',
                dni: '28901234',
                cuil: '20-28901234-8',
                phone: '+54 11 7890-1234',
                position: 'Electricista',
                specialty: 'Electricista',
                employmentType: 'PERMANENT',
                hireDate: new Date('2019-06-01'),
                hourlyRate: 3000,
                organizationId: organization.id,
            },
        }),
        prisma.employee.create({
            data: {
                legajo: 'EMP-00003',
                firstName: 'Diego',
                lastName: 'Sánchez',
                dni: '32123456',
                cuil: '20-32123456-1',
                phone: '+54 11 8901-2345',
                position: 'Ayudante',
                specialty: 'Ayudante',
                employmentType: 'TEMPORARY',
                hireDate: new Date('2024-01-10'),
                hourlyRate: 1800,
                organizationId: organization.id,
            },
        }),
        prisma.employee.create({
            data: {
                legajo: 'EMP-00004',
                firstName: 'Sebastián',
                lastName: 'Gómez',
                dni: '30456789',
                cuil: '20-30456789-4',
                phone: '+54 11 9012-3456',
                position: 'Plomero',
                specialty: 'Plomero',
                employmentType: 'CONTRACTOR',
                hireDate: new Date('2022-08-20'),
                hourlyRate: 2800,
                organizationId: organization.id,
            },
        }),
        prisma.employee.create({
            data: {
                legajo: 'EMP-00005',
                firstName: 'Fernando',
                lastName: 'Ruiz',
                dni: '27890123',
                cuil: '20-27890123-7',
                phone: '+54 11 0123-4567',
                position: 'Capataz',
                specialty: 'Capataz',
                employmentType: 'PERMANENT',
                hireDate: new Date('2018-02-01'),
                hourlyRate: 3500,
                organizationId: organization.id,
            },
        }),
    ]);
    console.log(`   Created ${employees.length} employees`);
    // Create Projects
    console.log('🏗️ Creating projects...');
    const projectManager = users.find((u) => u.role === client_1.UserRole.PROJECT_MANAGER);
    const projects = await Promise.all([
        prisma.project.create({
            data: {
                code: 'OBR-2024-00001',
                name: 'Casa Familia Rodriguez',
                description: 'Construcción de vivienda unifamiliar de 180m2 en dos plantas. Incluye garage, jardín y pileta.',
                address: 'Calle Los Pinos 456',
                city: 'Nordelta',
                province: 'Buenos Aires',
                status: client_1.ProjectStatus.IN_PROGRESS,
                startDate: new Date('2024-02-01'),
                estimatedEndDate: new Date('2024-10-31'),
                estimatedBudget: 85000000,
                currentSpent: 32500000,
                progress: 38,
                organizationId: organization.id,
                managerId: projectManager.id,
            },
        }),
        prisma.project.create({
            data: {
                code: 'OBR-2024-00002',
                name: 'Edificio Mirador del Parque',
                description: 'Edificio de 8 pisos con 16 departamentos, cocheras y amenities.',
                address: 'Av. del Libertador 8900',
                city: 'Vicente López',
                province: 'Buenos Aires',
                status: client_1.ProjectStatus.IN_PROGRESS,
                startDate: new Date('2024-01-15'),
                estimatedEndDate: new Date('2025-06-30'),
                estimatedBudget: 450000000,
                currentSpent: 125000000,
                progress: 28,
                organizationId: organization.id,
                managerId: projectManager.id,
            },
        }),
        prisma.project.create({
            data: {
                code: 'OBR-2024-00003',
                name: 'Remodelación Local Comercial',
                description: 'Remodelación completa de local comercial de 120m2 para tienda de ropa.',
                address: 'Calle Florida 875',
                city: 'Buenos Aires',
                province: 'Ciudad Autónoma de Buenos Aires',
                status: client_1.ProjectStatus.PLANNING,
                startDate: new Date('2024-04-01'),
                estimatedEndDate: new Date('2024-06-30'),
                estimatedBudget: 25000000,
                currentSpent: 0,
                progress: 0,
                organizationId: organization.id,
                managerId: projectManager.id,
            },
        }),
    ]);
    console.log(`   Created ${projects.length} projects`);
    // Create Stages and Tasks for first project
    console.log('📋 Creating stages and tasks...');
    const project1 = projects[0];
    const stages = await Promise.all([
        prisma.stage.create({
            data: {
                name: 'Trabajos Preliminares',
                description: 'Limpieza de terreno, cerco perimetral, obrador',
                order: 1,
                plannedStartDate: new Date('2024-02-01'),
                plannedEndDate: new Date('2024-02-15'),
                actualStartDate: new Date('2024-02-01'),
                actualEndDate: new Date('2024-02-12'),
                progress: 100,
                projectId: project1.id,
            },
        }),
        prisma.stage.create({
            data: {
                name: 'Fundaciones',
                description: 'Excavación, armado de hierros, hormigonado de bases',
                order: 2,
                plannedStartDate: new Date('2024-02-16'),
                plannedEndDate: new Date('2024-03-15'),
                actualStartDate: new Date('2024-02-13'),
                actualEndDate: new Date('2024-03-10'),
                progress: 100,
                projectId: project1.id,
            },
        }),
        prisma.stage.create({
            data: {
                name: 'Estructura',
                description: 'Columnas, vigas, losas de planta baja y alta',
                order: 3,
                plannedStartDate: new Date('2024-03-16'),
                plannedEndDate: new Date('2024-05-15'),
                actualStartDate: new Date('2024-03-11'),
                progress: 75,
                projectId: project1.id,
            },
        }),
        prisma.stage.create({
            data: {
                name: 'Mampostería',
                description: 'Levantamiento de paredes exteriores e interiores',
                order: 4,
                plannedStartDate: new Date('2024-05-16'),
                plannedEndDate: new Date('2024-06-30'),
                progress: 0,
                projectId: project1.id,
            },
        }),
        prisma.stage.create({
            data: {
                name: 'Instalaciones',
                description: 'Electricidad, sanitarios, gas',
                order: 5,
                plannedStartDate: new Date('2024-07-01'),
                plannedEndDate: new Date('2024-08-15'),
                progress: 0,
                projectId: project1.id,
            },
        }),
        prisma.stage.create({
            data: {
                name: 'Terminaciones',
                description: 'Revoques, pisos, pintura, carpintería',
                order: 6,
                plannedStartDate: new Date('2024-08-16'),
                plannedEndDate: new Date('2024-10-31'),
                progress: 0,
                projectId: project1.id,
            },
        }),
    ]);
    // Create tasks for Structure stage (3rd stage)
    const structureStage = stages[2];
    const tasks = await Promise.all([
        prisma.task.create({
            data: {
                name: 'Armado de columnas PB',
                description: 'Armado de hierros para 8 columnas de planta baja',
                status: client_1.TaskStatus.COMPLETED,
                priority: client_1.TaskPriority.HIGH,
                plannedStartDate: new Date('2024-03-11'),
                plannedEndDate: new Date('2024-03-18'),
                actualStartDate: new Date('2024-03-11'),
                actualEndDate: new Date('2024-03-17'),
                estimatedHours: 40,
                actualHours: 38,
                progress: 100,
                stageId: structureStage.id,
            },
        }),
        prisma.task.create({
            data: {
                name: 'Hormigonado de columnas PB',
                description: 'Llenado de hormigón en columnas de planta baja',
                status: client_1.TaskStatus.COMPLETED,
                priority: client_1.TaskPriority.HIGH,
                plannedStartDate: new Date('2024-03-19'),
                plannedEndDate: new Date('2024-03-22'),
                actualStartDate: new Date('2024-03-18'),
                actualEndDate: new Date('2024-03-21'),
                estimatedHours: 24,
                actualHours: 22,
                progress: 100,
                stageId: structureStage.id,
            },
        }),
        prisma.task.create({
            data: {
                name: 'Encofrado losa PB',
                description: 'Armado de encofrado para losa de planta baja',
                status: client_1.TaskStatus.COMPLETED,
                priority: client_1.TaskPriority.MEDIUM,
                plannedStartDate: new Date('2024-03-25'),
                plannedEndDate: new Date('2024-04-05'),
                actualStartDate: new Date('2024-03-23'),
                actualEndDate: new Date('2024-04-03'),
                estimatedHours: 60,
                actualHours: 55,
                progress: 100,
                stageId: structureStage.id,
            },
        }),
        prisma.task.create({
            data: {
                name: 'Armado hierros losa PB',
                description: 'Colocación de hierros y malla para losa',
                status: client_1.TaskStatus.IN_PROGRESS,
                priority: client_1.TaskPriority.HIGH,
                plannedStartDate: new Date('2024-04-08'),
                plannedEndDate: new Date('2024-04-15'),
                actualStartDate: new Date('2024-04-05'),
                estimatedHours: 48,
                actualHours: 30,
                progress: 60,
                stageId: structureStage.id,
            },
        }),
        prisma.task.create({
            data: {
                name: 'Hormigonado losa PB',
                description: 'Llenado de hormigón en losa de planta baja',
                status: client_1.TaskStatus.PENDING,
                priority: client_1.TaskPriority.HIGH,
                plannedStartDate: new Date('2024-04-16'),
                plannedEndDate: new Date('2024-04-18'),
                estimatedHours: 16,
                progress: 0,
                stageId: structureStage.id,
            },
        }),
    ]);
    console.log(`   Created ${stages.length} stages and ${tasks.length} tasks`);
    // Create task dependencies
    await prisma.taskDependency.create({
        data: {
            taskId: tasks[1].id,
            dependsOnId: tasks[0].id,
            dependencyType: client_1.DependencyType.FS,
            lagDays: 0,
        },
    });
    await prisma.taskDependency.create({
        data: {
            taskId: tasks[3].id,
            dependsOnId: tasks[2].id,
            dependencyType: client_1.DependencyType.FS,
            lagDays: 0,
        },
    });
    await prisma.taskDependency.create({
        data: {
            taskId: tasks[4].id,
            dependsOnId: tasks[3].id,
            dependencyType: client_1.DependencyType.FS,
            lagDays: 0,
        },
    });
    // Assign employees to project and tasks
    await prisma.employeeProjectAssignment.createMany({
        data: employees.map((emp) => ({
            employeeId: emp.id,
            projectId: project1.id,
            role: emp.position,
            startDate: new Date('2024-02-01'),
        })),
    });
    await prisma.taskAssignment.create({
        data: {
            taskId: tasks[3].id,
            employeeId: employees[0].id,
        },
    });
    // Create Budget
    console.log('💰 Creating budget...');
    const budget = await prisma.budget.create({
        data: {
            name: 'Presupuesto Inicial v1',
            description: 'Presupuesto aprobado por el cliente',
            materialsBudget: 35000000,
            laborBudget: 28000000,
            equipmentBudget: 8000000,
            subcontractBudget: 10000000,
            otherBudget: 2000000,
            contingencyBudget: 2000000,
            projectId: project1.id,
        },
    });
    // Create Expenses
    console.log('💸 Creating expenses...');
    await prisma.expense.createMany({
        data: [
            {
                reference: 'GAS-2024-00001',
                description: 'Compra de cemento Portland x 100 bolsas',
                amount: 850000,
                taxAmount: 178500,
                totalAmount: 1028500,
                status: client_1.ExpenseStatus.PAID,
                expenseDate: new Date('2024-02-10'),
                paidDate: new Date('2024-03-10'),
                invoiceNumber: 'A-0001-00045678',
                invoiceType: 'A',
                projectId: project1.id,
                budgetId: budget.id,
                categoryId: expenseCategories[0].id,
                supplierId: suppliers[0].id,
                createdById: users[3].id,
                approvedById: projectManager.id,
                approvedAt: new Date('2024-02-12'),
            },
            {
                reference: 'GAS-2024-00002',
                description: 'Hierros varios para estructura',
                amount: 2500000,
                taxAmount: 525000,
                totalAmount: 3025000,
                status: client_1.ExpenseStatus.PAID,
                expenseDate: new Date('2024-03-05'),
                paidDate: new Date('2024-03-20'),
                invoiceNumber: 'A-0002-00012345',
                invoiceType: 'A',
                projectId: project1.id,
                budgetId: budget.id,
                categoryId: expenseCategories[0].id,
                supplierId: suppliers[1].id,
                createdById: users[3].id,
                approvedById: projectManager.id,
                approvedAt: new Date('2024-03-07'),
            },
            {
                reference: 'GAS-2024-00003',
                description: 'Jornales semana 1 marzo',
                amount: 450000,
                taxAmount: 0,
                totalAmount: 450000,
                status: client_1.ExpenseStatus.APPROVED,
                expenseDate: new Date('2024-03-08'),
                projectId: project1.id,
                budgetId: budget.id,
                categoryId: expenseCategories[1].id,
                createdById: users[3].id,
                approvedById: projectManager.id,
                approvedAt: new Date('2024-03-10'),
            },
            {
                reference: 'GAS-2024-00004',
                description: 'Alquiler de mixer de hormigón',
                amount: 180000,
                taxAmount: 37800,
                totalAmount: 217800,
                status: client_1.ExpenseStatus.PENDING_APPROVAL,
                expenseDate: new Date('2024-03-21'),
                projectId: project1.id,
                categoryId: expenseCategories[2].id,
                supplierId: suppliers[0].id,
                createdById: users[3].id,
            },
        ],
    });
    console.log('   Created 4 expenses');
    // Create attendance records
    console.log('📅 Creating attendance records...');
    const attendanceData = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            for (const emp of employees) {
                attendanceData.push({
                    date,
                    checkIn: new Date(date.setHours(8, 0, 0, 0)),
                    checkOut: new Date(date.setHours(17, 0, 0, 0)),
                    type: client_1.AttendanceType.PRESENT,
                    hoursWorked: 8,
                    overtimeHours: i % 3 === 0 ? 1 : 0,
                    employeeId: emp.id,
                });
            }
        }
    }
    await prisma.attendance.createMany({ data: attendanceData });
    console.log(`   Created ${attendanceData.length} attendance records`);
    // Create notifications
    console.log('🔔 Creating notifications...');
    await prisma.notification.createMany({
        data: [
            {
                type: 'EXPENSE_APPROVAL',
                title: 'Gasto pendiente de aprobación',
                message: 'El gasto GAS-2024-00004 requiere su aprobación',
                entityType: 'expense',
                userId: projectManager.id,
            },
            {
                type: 'TASK_OVERDUE',
                title: 'Tarea próxima a vencer',
                message: 'La tarea "Armado hierros losa PB" vence en 2 días',
                entityType: 'task',
                entityId: tasks[3].id,
                userId: users[2].id,
            },
            {
                type: 'STOCK_LOW',
                title: 'Stock bajo de materiales',
                message: 'El material "Arena Gruesa" está por debajo del stock mínimo',
                entityType: 'material',
                userId: users[3].id,
            },
        ],
    });
    console.log('   Created 3 notifications');
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📝 Test credentials:');
    console.log('   Admin:        admin@constructorademo.com.ar / password123');
    console.log('   Jefe de Obra: jefe@constructorademo.com.ar / password123');
    console.log('   Supervisor:   supervisor@constructorademo.com.ar / password123');
    console.log('   Administrativo: admin.contable@constructorademo.com.ar / password123');
    console.log('   Cliente:      cliente@ejemplo.com.ar / password123');
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