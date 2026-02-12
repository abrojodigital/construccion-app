// Roles y Permisos
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  READ_ONLY: 'READ_ONLY',
} as const;

export const ROLE_LABELS: Record<keyof typeof USER_ROLES, string> = {
  ADMIN: 'Administrador',
  PROJECT_MANAGER: 'Jefe de Obra',
  SUPERVISOR: 'Supervisor',
  ADMINISTRATIVE: 'Administrativo',
  READ_ONLY: 'Solo Lectura',
};

// Estados de Proyecto
export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const PROJECT_STATUS_LABELS: Record<keyof typeof PROJECT_STATUS, string> = {
  PLANNING: 'Planificación',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PROJECT_STATUS_COLORS: Record<keyof typeof PROJECT_STATUS, string> = {
  PLANNING: 'blue',
  IN_PROGRESS: 'green',
  ON_HOLD: 'yellow',
  COMPLETED: 'gray',
  CANCELLED: 'red',
};

// Estados de Tarea
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
} as const;

export const TASK_STATUS_LABELS: Record<keyof typeof TASK_STATUS, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  BLOCKED: 'Bloqueada',
  CANCELLED: 'Cancelada',
};

export const TASK_STATUS_COLORS: Record<keyof typeof TASK_STATUS, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  BLOCKED: 'red',
  CANCELLED: 'gray',
};

// Prioridades de Tarea
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const TASK_PRIORITY_LABELS: Record<keyof typeof TASK_PRIORITY, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const TASK_PRIORITY_COLORS: Record<keyof typeof TASK_PRIORITY, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

// Estados de Gasto
export const EXPENSE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
} as const;

export const EXPENSE_STATUS_LABELS: Record<keyof typeof EXPENSE_STATUS, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente Aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PAID: 'Pagado',
};

export const EXPENSE_STATUS_COLORS: Record<keyof typeof EXPENSE_STATUS, string> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'blue',
};

// Estados de Orden de Compra
export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  PARTIAL_DELIVERY: 'PARTIAL_DELIVERY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const PURCHASE_ORDER_STATUS_LABELS: Record<keyof typeof PURCHASE_ORDER_STATUS, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  CONFIRMED: 'Confirmada',
  PARTIAL_DELIVERY: 'Entrega Parcial',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

// Estados de Cotización
export const QUOTE_STATUS = {
  REQUESTED: 'REQUESTED',
  RECEIVED: 'RECEIVED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export const QUOTE_STATUS_LABELS: Record<keyof typeof QUOTE_STATUS, string> = {
  REQUESTED: 'Solicitada',
  RECEIVED: 'Recibida',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

// Tipos de Asistencia
export const ATTENDANCE_TYPE = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  VACATION: 'VACATION',
  SICK_LEAVE: 'SICK_LEAVE',
} as const;

export const ATTENDANCE_TYPE_LABELS: Record<keyof typeof ATTENDANCE_TYPE, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Llegada Tarde',
  HALF_DAY: 'Medio Día',
  VACATION: 'Vacaciones',
  SICK_LEAVE: 'Licencia Médica',
};

// Tipos de Dependencia (Gantt)
export const DEPENDENCY_TYPE = {
  FS: 'FS', // Finish-to-Start
  SS: 'SS', // Start-to-Start
  FF: 'FF', // Finish-to-Finish
  SF: 'SF', // Start-to-Finish
} as const;

export const DEPENDENCY_TYPE_LABELS: Record<keyof typeof DEPENDENCY_TYPE, string> = {
  FS: 'Fin a Inicio',
  SS: 'Inicio a Inicio',
  FF: 'Fin a Fin',
  SF: 'Inicio a Fin',
};

// Provincias Argentinas
export const ARGENTINE_PROVINCES = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

// Unidades de Medida
export const MATERIAL_UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'm', label: 'Metro' },
  { value: 'm2', label: 'Metro Cuadrado' },
  { value: 'm3', label: 'Metro Cúbico' },
  { value: 'l', label: 'Litro' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'caja', label: 'Caja' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'par', label: 'Par' },
  { value: 'docena', label: 'Docena' },
] as const;

// Tipos de Factura (Argentina)
export const INVOICE_TYPES = [
  { value: 'A', label: 'Factura A' },
  { value: 'B', label: 'Factura B' },
  { value: 'C', label: 'Factura C' },
  { value: 'X', label: 'Comprobante X' },
  { value: 'RECIBO', label: 'Recibo' },
] as const;

// Categorías de Gastos por Defecto
export const DEFAULT_EXPENSE_CATEGORIES = [
  { code: 'MAT', name: 'Materiales', color: '#3B82F6' },
  { code: 'MO', name: 'Mano de Obra', color: '#10B981' },
  { code: 'EQ', name: 'Equipos y Herramientas', color: '#F59E0B' },
  { code: 'SUB', name: 'Subcontratistas', color: '#8B5CF6' },
  { code: 'TRANS', name: 'Transporte', color: '#EC4899' },
  { code: 'ADM', name: 'Gastos Administrativos', color: '#6B7280' },
  { code: 'SEG', name: 'Seguros', color: '#14B8A6' },
  { code: 'IMP', name: 'Impuestos y Tasas', color: '#EF4444' },
  { code: 'OTRO', name: 'Otros', color: '#64748B' },
] as const;

// Etapas de Construcción por Defecto
export const DEFAULT_CONSTRUCTION_STAGES = [
  { order: 1, name: 'Trabajos Preliminares', description: 'Limpieza, cerco, obrador' },
  { order: 2, name: 'Movimiento de Suelos', description: 'Excavaciones y rellenos' },
  { order: 3, name: 'Fundaciones', description: 'Cimientos, zapatas, plateas' },
  { order: 4, name: 'Estructura', description: 'Columnas, vigas, losas' },
  { order: 5, name: 'Mampostería', description: 'Paredes, tabiques' },
  { order: 6, name: 'Cubierta', description: 'Techos, aislaciones' },
  { order: 7, name: 'Instalaciones Sanitarias', description: 'Agua, cloacas, gas' },
  { order: 8, name: 'Instalaciones Eléctricas', description: 'Electricidad, datos' },
  { order: 9, name: 'Revoques', description: 'Gruesos y finos' },
  { order: 10, name: 'Contrapisos y Carpetas', description: 'Nivelación de pisos' },
  { order: 11, name: 'Carpintería', description: 'Puertas, ventanas, muebles' },
  { order: 12, name: 'Revestimientos', description: 'Pisos, cerámicos, porcelanatos' },
  { order: 13, name: 'Pintura', description: 'Interiores y exteriores' },
  { order: 14, name: 'Terminaciones', description: 'Detalles finales, limpieza' },
] as const;

// Tipos de Empleo
export const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: 'Permanente' },
  { value: 'CONTRACTOR', label: 'Contratista' },
  { value: 'TEMPORARY', label: 'Temporal' },
] as const;

// Especialidades de Empleados
export const EMPLOYEE_SPECIALTIES = [
  'Albañil',
  'Oficial Albañil',
  'Ayudante',
  'Electricista',
  'Plomero',
  'Gasista',
  'Carpintero',
  'Herrero',
  'Pintor',
  'Yesero',
  'Colocador de Pisos',
  'Techista',
  'Vidriero',
  'Durlock',
  'Capataz',
  'Encargado',
  'Operador de Máquinas',
  'Soldador',
  'Climatización',
  'Otro',
] as const;

// Configuración de Paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Configuración de Archivos
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// IVA Argentina
export const IVA_RATES = {
  GENERAL: 21,
  REDUCED: 10.5,
  EXEMPT: 0,
} as const;
