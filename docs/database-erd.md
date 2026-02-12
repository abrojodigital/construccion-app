# Diagrama Entidad-Relación (ERD) - Sistema de Gestión de Construcción

## Resumen

Este documento describe la estructura de la base de datos del Sistema de Gestión de Construcción, incluyendo todas las entidades, sus relaciones y los enums utilizados.

---

## Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ORGANIZATION                                          │
│  (Multi-tenancy - Empresa Constructora)                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  PK: id                                                                                  │
│  name, cuit, address, phone, email, logoUrl                                             │
│  isActive, createdAt, updatedAt                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│        USER         │     │      PROJECT        │     │      SUPPLIER       │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ PK: id              │     │ PK: id              │     │ PK: id              │
│ FK: organizationId  │     │ FK: organizationId  │     │ FK: organizationId  │
│ email, password     │     │ code, name          │     │ code, name, cuit    │
│ firstName, lastName │     │ description         │     │ contactName         │
│ role (enum)         │     │ status (enum)       │     │ email, phone        │
│ isActive            │     │ startDate, endDate  │     │ address, city       │
│ lastLoginAt         │     │ estimatedBudget     │     │ province, notes     │
└─────────────────────┘     │ spentAmount         │     │ isActive            │
         │                  │ address, city       │     └─────────────────────┘
         │                  │ province, latitude  │              │
         │                  │ longitude           │              │ 1:N
         │                  └─────────────────────┘              ▼
         │                           │                  ┌─────────────────────┐
         │                           │ 1:N              │   SUPPLIER_CONTACT  │
         │                           ▼                  ├─────────────────────┤
         │                  ┌─────────────────────┐     │ PK: id              │
         │                  │       STAGE         │     │ FK: supplierId      │
         │                  ├─────────────────────┤     │ name, position      │
         │                  │ PK: id              │     │ email, phone        │
         │                  │ FK: projectId       │     │ isPrimary           │
         │                  │ name, description   │     └─────────────────────┘
         │                  │ order, color        │
         │                  │ startDate, endDate  │
         │                  │ progress            │
         │                  └─────────────────────┘
         │                           │
         │                           │ 1:N
         │                           ▼
         │                  ┌─────────────────────┐
         │                  │        TASK         │
         │                  ├─────────────────────┤
         │                  │ PK: id              │
         │                  │ FK: stageId         │
         │                  │ FK: assignedToId    │◄──────────────────┐
         │                  │ name, description   │                   │
         │                  │ status (enum)       │                   │
         │                  │ priority (enum)     │                   │
         │                  │ startDate, endDate  │                   │
         │                  │ estimatedHours      │                   │
         │                  │ actualHours         │                   │
         │                  │ progress, order     │                   │
         │                  └─────────────────────┘                   │
         │                           │                                │
         │                           │ N:M (auto-referencia)          │
         │                           ▼                                │
         │                  ┌─────────────────────┐                   │
         │                  │  TASK_DEPENDENCY    │                   │
         │                  ├─────────────────────┤                   │
         │                  │ PK: id              │                   │
         │                  │ FK: taskId          │                   │
         │                  │ FK: dependsOnId     │                   │
         │                  │ type (enum)         │                   │
         │                  │ lagDays             │                   │
         │                  └─────────────────────┘                   │
         │                                                            │
         └────────────────────────────────────────────────────────────┘
```

---

## Módulo de Costos y Presupuestos

```
┌─────────────────────┐
│   EXPENSE_CATEGORY  │
├─────────────────────┤
│ PK: id              │
│ FK: organizationId  │
│ FK: parentId        │◄──┐ (auto-referencia para subcategorías)
│ code, name          │   │
│ description, color  │───┘
│ isActive            │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│       BUDGET        │     │      EXPENSE        │
├─────────────────────┤     ├─────────────────────┤
│ PK: id              │     │ PK: id              │
│ FK: projectId       │     │ FK: projectId       │
│ FK: categoryId      │     │ FK: taskId          │◄── Vinculación opcional con tarea
│ estimatedAmount     │     │ FK: categoryId      │
│ spentAmount         │     │ FK: supplierId      │
│ description         │     │ FK: budgetId        │
│ notes               │     │ FK: createdById     │
└─────────────────────┘     │ FK: approvedById    │
         │                  │ reference           │
         │ 1:N              │ description, amount │
         ▼                  │ taxAmount           │
┌─────────────────────┐     │ totalAmount         │
│      EXPENSE        │◄────│ status (enum)       │
│   (vinculado a      │     │ expenseDate         │
│    budget)          │     │ dueDate             │
└─────────────────────┘     │ invoiceNumber       │
                            │ invoiceType         │
                            │ rejectionReason     │
                            │ approvedAt          │
                            └─────────────────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────────┐
                            │ EXPENSE_ATTACHMENT  │
                            ├─────────────────────┤
                            │ PK: id              │
                            │ FK: expenseId       │
                            │ fileName            │
                            │ fileUrl, fileSize   │
                            │ mimeType            │
                            └─────────────────────┘
```

---

## Módulo de Compras

```
┌─────────────────────┐
│   PURCHASE_ORDER    │
├─────────────────────┤
│ PK: id              │
│ FK: projectId       │
│ FK: supplierId      │
│ FK: createdById     │
│ FK: approvedById    │
│ reference           │
│ status (enum)       │
│ subtotal, taxAmount │
│ totalAmount         │
│ expectedDeliveryDate│
│ actualDeliveryDate  │
│ notes               │
│ approvedAt          │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│ PURCHASE_ORDER_ITEM │     │      MATERIAL       │
├─────────────────────┤     ├─────────────────────┤
│ PK: id              │     │ PK: id              │
│ FK: purchaseOrderId │     │ FK: organizationId  │
│ FK: materialId      │────►│ FK: categoryId      │
│ description         │     │ code, name          │
│ quantity, unit      │     │ description, unit   │
│ unitPrice           │     │ unitPrice           │
│ taxRate, totalPrice │     │ currentStock        │
│ receivedQuantity    │     │ minStock            │
└─────────────────────┘     │ isActive            │
                            └─────────────────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────────┐
                            │   STOCK_MOVEMENT    │
                            ├─────────────────────┤
                            │ PK: id              │
                            │ FK: materialId      │
                            │ FK: projectId       │
                            │ FK: purchaseOrderId │
                            │ FK: createdById     │
                            │ type (enum)         │
                            │ quantity            │
                            │ previousStock       │
                            │ newStock            │
                            │ notes, movementDate │
                            └─────────────────────┘
```

---

## Módulo de Cotizaciones

```
┌─────────────────────┐
│       QUOTE         │
├─────────────────────┤
│ PK: id              │
│ FK: supplierId      │
│ FK: createdById     │
│ reference           │
│ status (enum)       │
│ validUntil          │
│ subtotal, taxAmount │
│ totalAmount, notes  │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│     QUOTE_ITEM      │
├─────────────────────┤
│ PK: id              │
│ FK: quoteId         │
│ FK: materialId      │
│ description         │
│ quantity, unit      │
│ unitPrice, taxRate  │
│ totalPrice          │
└─────────────────────┘
```

---

## Módulo de Empleados

```
┌─────────────────────────────────────────────────────────────────┐
│                          EMPLOYEE                                │
├─────────────────────────────────────────────────────────────────┤
│ PK: id                                                           │
│ FK: organizationId                                               │
│ code, firstName, lastName                                        │
│ dni, cuil, gender (enum)                                         │
│ birthDate, email, phone, address, city, province                 │
│ position, department                                             │
│ employmentType (enum)                                            │
│ startDate, endDate                                               │
│ bankName, cbu, salary                                            │
│ emergencyContactName, emergencyContactPhone                      │
│ notes, isActive                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ATTENDANCE                               │
├─────────────────────────────────────────────────────────────────┤
│ PK: id                                                           │
│ FK: employeeId                                                   │
│ FK: projectId                                                    │
│ FK: recordedById                                                 │
│ date                                                             │
│ checkIn, checkOut                                                │
│ hoursWorked, overtimeHours                                       │
│ status (enum)                                                    │
│ notes                                                            │
│ UNIQUE: employeeId + date                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Módulo de Notificaciones y Auditoría

```
┌─────────────────────┐     ┌─────────────────────┐
│    NOTIFICATION     │     │     AUDIT_LOG       │
├─────────────────────┤     ├─────────────────────┤
│ PK: id              │     │ PK: id              │
│ FK: userId          │     │ FK: userId          │
│ FK: organizationId  │     │ FK: organizationId  │
│ type (enum)         │     │ action (enum)       │
│ title, message      │     │ entityType          │
│ data (JSON)         │     │ entityId            │
│ isRead, readAt      │     │ oldValues (JSON)    │
│ createdAt           │     │ newValues (JSON)    │
└─────────────────────┘     │ ipAddress           │
                            │ userAgent           │
                            │ createdAt           │
                            └─────────────────────┘
```

---

## Categorías de Materiales

```
┌─────────────────────────────────────────────────────────────────┐
│                      MATERIAL_CATEGORY                           │
├─────────────────────────────────────────────────────────────────┤
│ PK: id                                                           │
│ FK: organizationId                                               │
│ FK: parentId (auto-referencia para subcategorías)                │
│ code, name, description                                          │
│ isActive                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Enums del Sistema

### UserRole (Roles de Usuario)
```
┌────────────────────┐
│     UserRole       │
├────────────────────┤
│ ADMIN              │  → Acceso total
│ PROJECT_MANAGER    │  → Gestión de proyectos
│ SUPERVISOR         │  → Supervisión de obras
│ ADMINISTRATIVE     │  → Tareas administrativas
│ READ_ONLY          │  → Solo lectura
└────────────────────┘
```

### ProjectStatus (Estado de Proyecto)
```
┌────────────────────┐
│   ProjectStatus    │
├────────────────────┤
│ PLANNING           │  → En planificación
│ IN_PROGRESS        │  → En ejecución
│ ON_HOLD            │  → Pausado
│ COMPLETED          │  → Completado
│ CANCELLED          │  → Cancelado
└────────────────────┘
```

### TaskStatus (Estado de Tarea)
```
┌────────────────────┐
│    TaskStatus      │
├────────────────────┤
│ PENDING            │  → Pendiente
│ IN_PROGRESS        │  → En progreso
│ COMPLETED          │  → Completada
│ BLOCKED            │  → Bloqueada
│ CANCELLED          │  → Cancelada
└────────────────────┘
```

### TaskPriority (Prioridad de Tarea)
```
┌────────────────────┐
│   TaskPriority     │
├────────────────────┤
│ LOW                │  → Baja
│ MEDIUM             │  → Media
│ HIGH               │  → Alta
│ URGENT             │  → Urgente
└────────────────────┘
```

### DependencyType (Tipo de Dependencia - Gantt)
```
┌────────────────────┐
│  DependencyType    │
├────────────────────┤
│ FS                 │  → Finish-to-Start (más común)
│ SS                 │  → Start-to-Start
│ FF                 │  → Finish-to-Finish
│ SF                 │  → Start-to-Finish
└────────────────────┘
```

### ExpenseStatus (Estado de Gasto)
```
┌────────────────────┐
│   ExpenseStatus    │
├────────────────────┤
│ DRAFT              │  → Borrador
│ PENDING_APPROVAL   │  → Pendiente aprobación
│ APPROVED           │  → Aprobado
│ REJECTED           │  → Rechazado
│ PAID               │  → Pagado
└────────────────────┘
```

### PurchaseOrderStatus (Estado de Orden de Compra)
```
┌────────────────────┐
│PurchaseOrderStatus │
├────────────────────┤
│ DRAFT              │  → Borrador
│ PENDING_APPROVAL   │  → Pendiente aprobación
│ APPROVED           │  → Aprobada
│ SENT               │  → Enviada al proveedor
│ PARTIAL            │  → Recepción parcial
│ RECEIVED           │  → Recibida completa
│ CANCELLED          │  → Cancelada
└────────────────────┘
```

### QuoteStatus (Estado de Cotización)
```
┌────────────────────┐
│    QuoteStatus     │
├────────────────────┤
│ DRAFT              │  → Borrador
│ REQUESTED          │  → Solicitada
│ RECEIVED           │  → Recibida
│ ACCEPTED           │  → Aceptada
│ REJECTED           │  → Rechazada
│ EXPIRED            │  → Expirada
└────────────────────┘
```

### StockMovementType (Tipo de Movimiento de Stock)
```
┌────────────────────┐
│ StockMovementType  │
├────────────────────┤
│ PURCHASE           │  → Compra
│ SALE               │  → Venta
│ ADJUSTMENT         │  → Ajuste
│ TRANSFER_IN        │  → Transferencia entrada
│ TRANSFER_OUT       │  → Transferencia salida
│ RETURN             │  → Devolución
│ CONSUMPTION        │  → Consumo en obra
└────────────────────┘
```

### AttendanceStatus (Estado de Asistencia)
```
┌────────────────────┐
│ AttendanceStatus   │
├────────────────────┤
│ PRESENT            │  → Presente
│ ABSENT             │  → Ausente
│ LATE               │  → Tardanza
│ HALF_DAY           │  → Medio día
│ VACATION           │  → Vacaciones
│ SICK_LEAVE         │  → Licencia por enfermedad
│ HOLIDAY            │  → Feriado
└────────────────────┘
```

### NotificationType (Tipo de Notificación)
```
┌────────────────────┐
│ NotificationType   │
├────────────────────┤
│ TASK_ASSIGNED      │  → Tarea asignada
│ TASK_COMPLETED     │  → Tarea completada
│ EXPENSE_PENDING    │  → Gasto pendiente
│ EXPENSE_APPROVED   │  → Gasto aprobado
│ EXPENSE_REJECTED   │  → Gasto rechazado
│ PO_APPROVED        │  → OC aprobada
│ LOW_STOCK          │  → Stock bajo
│ PROJECT_UPDATE     │  → Actualización proyecto
│ SYSTEM             │  → Sistema
└────────────────────┘
```

### AuditAction (Acción de Auditoría)
```
┌────────────────────┐
│    AuditAction     │
├────────────────────┤
│ CREATE             │  → Crear
│ UPDATE             │  → Actualizar
│ DELETE             │  → Eliminar
│ LOGIN              │  → Inicio de sesión
│ LOGOUT             │  → Cierre de sesión
│ APPROVE            │  → Aprobar
│ REJECT             │  → Rechazar
└────────────────────┘
```

### EmploymentType (Tipo de Empleo)
```
┌────────────────────┐
│  EmploymentType    │
├────────────────────┤
│ FULL_TIME          │  → Tiempo completo
│ PART_TIME          │  → Medio tiempo
│ CONTRACTOR         │  → Contratista
│ TEMPORARY          │  → Temporal
└────────────────────┘
```

### Gender (Género)
```
┌────────────────────┐
│      Gender        │
├────────────────────┤
│ MALE               │  → Masculino
│ FEMALE             │  → Femenino
│ OTHER              │  → Otro
└────────────────────┘
```

---

## Relaciones Principales

| Entidad Origen | Relación | Entidad Destino | Descripción |
|----------------|----------|-----------------|-------------|
| Organization | 1:N | User | Una organización tiene múltiples usuarios |
| Organization | 1:N | Project | Una organización tiene múltiples proyectos |
| Organization | 1:N | Supplier | Una organización tiene múltiples proveedores |
| Organization | 1:N | Employee | Una organización tiene múltiples empleados |
| Organization | 1:N | Material | Una organización tiene múltiples materiales |
| Organization | 1:N | ExpenseCategory | Una organización tiene múltiples categorías |
| Project | 1:N | Stage | Un proyecto tiene múltiples etapas |
| Project | 1:N | Budget | Un proyecto tiene múltiples presupuestos |
| Project | 1:N | Expense | Un proyecto tiene múltiples gastos |
| Project | 1:N | PurchaseOrder | Un proyecto tiene múltiples órdenes de compra |
| Stage | 1:N | Task | Una etapa tiene múltiples tareas |
| Task | 1:N | Expense | Una tarea puede tener múltiples gastos asociados |
| Task | N:M | Task | Tareas con dependencias (via TaskDependency) |
| User | 1:N | Task | Un usuario puede tener tareas asignadas |
| User | 1:N | Expense | Un usuario crea/aprueba gastos |
| Supplier | 1:N | Expense | Un proveedor tiene múltiples gastos |
| Supplier | 1:N | PurchaseOrder | Un proveedor tiene múltiples OC |
| Supplier | 1:N | SupplierContact | Un proveedor tiene múltiples contactos |
| Material | 1:N | StockMovement | Un material tiene múltiples movimientos |
| Employee | 1:N | Attendance | Un empleado tiene múltiples registros de asistencia |
| ExpenseCategory | 1:N | ExpenseCategory | Categorías con subcategorías (auto-referencia) |

---

## Índices Importantes

```sql
-- Índices de búsqueda frecuente
CREATE INDEX idx_project_organization ON Project(organizationId);
CREATE INDEX idx_project_status ON Project(status);
CREATE INDEX idx_expense_project ON Expense(projectId);
CREATE INDEX idx_expense_task ON Expense(taskId);
CREATE INDEX idx_expense_status ON Expense(status);
CREATE INDEX idx_task_stage ON Task(stageId);
CREATE INDEX idx_task_assigned ON Task(assignedToId);
CREATE INDEX idx_attendance_employee_date ON Attendance(employeeId, date);
CREATE INDEX idx_stock_movement_material ON StockMovement(materialId);
```

---

## Notas de Implementación

### Multi-tenancy
- Todas las consultas deben filtrar por `organizationId`
- Los usuarios solo pueden ver datos de su organización
- Implementado a nivel de middleware y consultas Prisma

### Soft Delete
- Las entidades principales usan `deletedAt` para soft delete
- Las consultas filtran `deletedAt: null` por defecto

### Auditoría
- Cambios importantes se registran en `AuditLog`
- Se guarda el estado anterior y nuevo de la entidad

### Datos Específicos Argentina
- CUIT para organizaciones y proveedores
- CUIL para empleados (auto-calculado desde DNI + género)
- CBU para datos bancarios
- Provincias argentinas predefinidas

---

*Documento generado para el Sistema de Gestión de Construcción*
*Última actualización: 2026*
