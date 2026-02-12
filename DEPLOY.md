# Guia de Deploy - Sistema de Gestion de Construccion

Esta guia explica como deployar la aplicacion usando **Vercel** (frontend) y **Railway** (backend + PostgreSQL).

---

## Prerequisitos

1. Cuenta en [GitHub](https://github.com)
2. Cuenta en [Vercel](https://vercel.com) (gratis)
3. Cuenta en [Railway](https://railway.app) (gratis con $5/mes de credito)
4. Tu codigo subido a un repositorio de GitHub

---

## Paso 1: Subir codigo a GitHub

Si aun no tenes el repo en GitHub:

```bash
cd /Users/pablobersier/desarrollo/construccion-app

# Inicializar git (si no esta)
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Initial commit - Sistema de Gestion de Construccion"

# Crear repo en GitHub y conectar
gh repo create construccion-app --private --source=. --push
# O manualmente:
# git remote add origin https://github.com/TU_USUARIO/construccion-app.git
# git push -u origin main
```

---

## Paso 2: Deploy del Backend en Railway

### 2.1 Crear proyecto en Railway

1. Ir a [railway.app](https://railway.app) y loguearte con GitHub
2. Click en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Autorizar Railway a acceder a tu repositorio
5. Seleccionar el repo `construccion-app`

### 2.2 Agregar PostgreSQL

1. En el proyecto, click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creara automaticamente la base de datos
3. Click en la base de datos y copia el **DATABASE_URL** de la seccion "Variables"

### 2.3 Configurar el servicio API

1. Click en el servicio de GitHub que se creo
2. Ir a **"Settings"** → **"Root Directory"** → escribir: `apps/api`
3. Ir a **"Variables"** y agregar:

```env
NODE_ENV=production
DATABASE_URL=<el que copiaste de PostgreSQL>
JWT_SECRET=<genera uno seguro con: openssl rand -base64 32>
JWT_REFRESH_SECRET=<genera otro con: openssl rand -base64 32>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://tu-app.vercel.app
```

4. Railway hara deploy automaticamente

### 2.4 Ejecutar migraciones de Prisma

1. En Railway, ir al servicio de la API
2. Click en **"Settings"** → **"Deploy"**
3. En **"Build Command"** cambiar a:
   ```
   pnpm install && cd ../../packages/database && pnpm prisma generate && pnpm prisma migrate deploy && cd ../../apps/api && pnpm build
   ```

4. Hacer redeploy

### 2.5 Obtener la URL del backend

1. En el servicio, ir a **"Settings"** → **"Networking"**
2. Click en **"Generate Domain"**
3. Copiar la URL (ej: `https://construccion-api-production.up.railway.app`)

---

## Paso 3: Deploy del Frontend en Vercel

### 3.1 Importar proyecto

1. Ir a [vercel.com](https://vercel.com) y loguearte con GitHub
2. Click en **"Add New..."** → **"Project"**
3. Seleccionar el repo `construccion-app`

### 3.2 Configurar el proyecto

1. En **"Root Directory"** escribir: `apps/web`
2. Framework Preset: **Next.js**
3. En **"Environment Variables"** agregar:

```env
NEXT_PUBLIC_API_URL=https://tu-api.up.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

4. Click en **"Deploy"**

### 3.3 Actualizar CORS en Railway

Una vez que tengas la URL de Vercel:

1. Volver a Railway → tu servicio API → Variables
2. Actualizar `CORS_ORIGIN` con la URL de Vercel (ej: `https://construccion-app.vercel.app`)
3. Railway redesplegara automaticamente

---

## Paso 4: Crear usuario administrador

Despues del deploy, necesitas crear el primer usuario admin.

### Opcion A: Via API (recomendado)

```bash
# Reemplaza con tu URL de Railway
curl -X POST https://tu-api.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tuempresa.com",
    "password": "TuPasswordSeguro123!",
    "firstName": "Admin",
    "lastName": "Principal",
    "organizationName": "Tu Empresa Constructora"
  }'
```

### Opcion B: Via Railway Shell

1. En Railway, click en el servicio API
2. Click en **"Deploy"** → **"Shell"**
3. Ejecutar comando de seed si existe

---

## Paso 5: Verificar el deploy

1. Abrir la URL de Vercel en el navegador
2. Deberia cargar la pagina de login
3. Ingresar con las credenciales del usuario admin
4. Verificar que todas las secciones funcionen

---

## Troubleshooting

### Error: "Cannot connect to database"
- Verificar que DATABASE_URL este correctamente configurado en Railway
- Verificar que las migraciones se ejecutaron

### Error: "CORS blocked"
- Verificar que CORS_ORIGIN en Railway coincida exactamente con la URL de Vercel
- No incluir `/` al final de la URL

### Error: "Build failed" en Vercel
- Verificar que el Root Directory sea `apps/web`
- Revisar los logs de build en Vercel

### Error: "Build failed" en Railway
- Verificar que el Root Directory sea `apps/api`
- Verificar que todas las variables de entorno esten configuradas

---

## Comandos utiles

```bash
# Generar secrets seguros
openssl rand -base64 32

# Ver logs en Railway (si tenes CLI)
railway logs

# Ejecutar migraciones manualmente
railway run pnpm prisma migrate deploy
```

---

## Costos estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby (gratis) | $0/mes |
| Railway | Starter ($5 credito) | ~$5-10/mes |
| **Total** | | **~$5-10/mes** |

Para mas trafico, considerar:
- Vercel Pro: $20/mes
- Railway Pro: segun uso

---

## Actualizaciones futuras

Para deployar cambios:

1. Hacer commit y push a GitHub:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

2. Vercel y Railway detectaran los cambios y desplegaran automaticamente

---

*Guia creada para el Sistema de Gestion de Construccion*
