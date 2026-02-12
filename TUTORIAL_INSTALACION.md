# Tutorial de Instalacion

## Que necesitas antes de empezar

Solo necesitas tener instalado **Docker Desktop** en tu computadora.

| Sistema | Descarga |
|---------|----------|
| Windows | https://www.docker.com/products/docker-desktop |
| Mac     | https://www.docker.com/products/docker-desktop |
| Linux   | https://docs.docker.com/engine/install/        |

> Una vez instalado, abrilo y asegurate de que este corriendo (icono de la ballena en la barra de tareas).

---

## Paso 1 - Descargar el proyecto

Abri una terminal y ejecuta:

```bash
git clone <url-del-repositorio>
cd construccion-app
```

---

## Paso 2 - Ejecutar el instalador

```bash
./setup.sh
```

Eso es todo. El script se encarga de:

```
[1/4] Verificando prerequisitos...        <-- Chequea Docker
[2/4] Verificando puertos disponibles...  <-- Chequea que 3000, 3001, 5432 esten libres
[3/4] Construyendo e iniciando servicios  <-- Construye y levanta todo (~5 min)
[4/4] Esperando a que todo este listo...  <-- Migra la base de datos y carga datos de demo
```

Al finalizar vas a ver algo asi:

```
  Instalacion completada!

  Aplicacion:  http://localhost:3000
  API:         http://localhost:3001/api/v1
```

---

## Paso 3 - Ingresar al sistema

Abri el navegador en **http://localhost:3000** y usa estas credenciales:

```
Email:    admin@constructorademo.com.ar
Password: password123
```

### Otros usuarios disponibles

| Rol | Email | Que puede hacer |
|-----|-------|-----------------|
| Administrador   | admin@constructorademo.com.ar       | Acceso total al sistema |
| Jefe de Obra    | jefe@constructorademo.com.ar        | Gestiona proyectos, etapas y tareas |
| Project Manager | andres.pm@constructorademo.com.ar   | Gestiona proyectos asignados |
| Supervisor      | supervisor@constructorademo.com.ar  | Supervisa avance en obra |
| Contable        | admin.contable@constructorademo.com.ar | Gastos, presupuestos y reportes |
| Cliente         | cliente@ejemplo.com.ar              | Solo lectura |

> Todas las cuentas usan la password: **password123**

---

## Que datos de demo voy a encontrar

El sistema viene cargado con datos realistas para que puedas explorar todas las funcionalidades:

### 4 Proyectos de obra

| Proyecto | Estado | Avance |
|----------|--------|--------|
| Casa Familia Rodriguez - Nordelta      | En progreso    | 65% |
| Edificio Mirador del Parque            | En progreso    | 28% |
| Remodelacion Local Comercial - Florida | En planificacion | 0%  |
| Duplex Familia Lopez - Escobar         | Completado     | 100% |

### Datos incluidos en cada proyecto

- **Etapas de construccion** (preliminares, fundaciones, estructura, mamposteria, etc.)
- **Tareas** con asignaciones, prioridades y dependencias para diagrama Gantt
- **Presupuestos** con desglose por categoria
- **Gastos** en todos los estados (borrador, pendiente, aprobado, pagado, rechazado)
- **Ordenes de compra** a proveedores
- **Registro de asistencia** del personal (3 semanas de datos)
- **Comentarios** en proyectos y tareas

### Datos maestros

- 6 usuarios con distintos roles
- 8 empleados (capataz, albaniles, electricista, plomero, ayudantes, pintor)
- 6 proveedores con datos de contacto y bancarios
- 27 materiales con stock y precios
- 7 categorias de gasto + 8 categorias de material

---

## Operaciones comunes

### Detener el sistema

```bash
docker compose down
```

### Volver a iniciarlo

```bash
docker compose up -d
```

> Los datos se mantienen entre reinicios.

### Ver si todo esta corriendo

```bash
docker compose ps
```

Deberias ver 3 servicios con estado "Up" y "(healthy)":

```
NAME              STATUS                  PORTS
construccion-db   Up (healthy)            5432
construccion-api  Up (healthy)            3001
construccion-web  Up                      3000
```

### Ver logs si algo falla

```bash
docker compose logs -f api
```

### Borrar todo y empezar de cero

```bash
docker compose down -v
docker compose up -d --build
```

> Esto borra la base de datos y recarga los datos de demo.

---

## Problemas frecuentes

### "Puerto en uso"

Algo ya esta usando el puerto 3000, 3001 o 5432. Si es una instancia anterior:

```bash
docker compose down
```

### El build tarda mucho o falla

Asegurate de que Docker tenga al menos **4 GB de RAM** asignados:
- Docker Desktop > Settings > Resources > Memory

### No puedo acceder a localhost:3000

1. Verifica que los containers esten corriendo: `docker compose ps`
2. Espera 1-2 minutos despues de iniciar (la primera vez tarda mas)
3. Verifica los logs: `docker compose logs api`
