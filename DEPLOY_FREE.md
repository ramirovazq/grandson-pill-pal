# Deployment a Render.com - Plan FREE

Esta guía te ayuda a deployar Grandson Pill Pal usando el **plan gratuito** de Render.com.

## ⚠️ Limitaciones del Plan FREE

Antes de comenzar, entiende estas limitaciones:

### Web Services (FREE)
- ✅ Disponible gratuitamente
- ⚠️ **Spin down después de 15 minutos de inactividad**
- ⚠️ **Primera solicitud después de spin down toma ~50 segundos**
- ⚠️ **512MB RAM máximo**
- ✅ 500 build minutes/mes
- ✅ SSL gratuito

### PostgreSQL (FREE)
- ✅ Disponible gratuitamente
- ⚠️ **Expira después de 90 días**
- ⚠️ **Se elimina automáticamente si no usas por 90 días**
- ✅ 1GB almacenamiento
- ⚠️ Backups limitados

### NO Disponible en FREE
- ❌ Disk storage persistente
- ❌ Always-on (sin spin down)
- ❌ Background workers
- ❌ Cron jobs

---

## 🚀 Opción 1: Arquitectura Separada (RECOMENDADA)

Usa `render-free.yaml` - Servicios separados optimizados para free tier.

### Ventajas
- ✅ Mejor uso de recursos (512MB por servicio)
- ✅ Servicios independientes
- ✅ Más estable

### Desventajas
- ⚠️ 3 servicios = 3 spin downs
- ⚠️ Más complejo

### Paso a Paso

#### 1. Preparación

```bash
# Asegúrate de tener los Dockerfiles
ls backend/Dockerfile
ls backend/Dockerfile.extractor
ls frontend/Dockerfile

# Commit y push a GitHub
git add .
git commit -m "Add Render free tier configuration"
git push origin main
```

#### 2. Crear Cuenta en Render

1. Ve a https://render.com
2. Sign up con GitHub
3. Autoriza Render a acceder a tu repositorio

#### 3. Deploy con Blueprint

1. En Render Dashboard, click **"New +"**
2. Selecciona **"Blueprint"**
3. Conecta tu repositorio `grandson-pill-pal`
4. Selecciona el archivo: **`render-free.yaml`**
5. Click **"Apply"**

#### 4. Configurar Variables de Entorno

Después del deploy, configura en cada servicio:

**Backend:**
- `OPENAI_API_KEY`: Tu API key de OpenAI
- `DATABASE_URL`: (auto-configurado por Render)
- `CORS_ORIGINS`: URL del frontend

**Extractor:**
- `OPENAI_API_KEY`: Tu API key de OpenAI
- `CORS_ORIGINS`: URL del frontend

#### 5. Actualizar Frontend URLs

Una vez desplegados backend y extractor, actualiza sus URLs en el frontend:

1. Ve al servicio frontend en Render
2. Environment → Add environment variable:
   ```
   VITE_API_URL=https://grandson-pill-pal-backend.onrender.com
   VITE_EXTRACTOR_URL=https://grandson-pill-pal-extractor.onrender.com
   ```
3. Trigger un nuevo deploy (Manual Deploy)

#### 6. Verificar Deployment

```bash
# Health checks
curl https://grandson-pill-pal-backend.onrender.com/health
curl https://grandson-pill-pal-extractor.onrender.com/health

# Frontend
open https://grandson-pill-pal-frontend.onrender.com
```

---

## 🚀 Opción 2: Monolítico Simplificado

Usa `render.yaml` - Todo en un servicio.

### Ventajas
- ✅ Más simple (1 solo servicio web)
- ✅ Solo 1 spin down

### Desventajas
- ⚠️ 512MB RAM para todo (puede quedarse sin memoria)
- ⚠️ Menos estable
- ⚠️ Build más lento

### Requisitos Adicionales

Necesitas crear `Dockerfile.monolith` en la raíz:

```dockerfile
# Dockerfile.monolith
FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

# Backend setup
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN pip install uv
WORKDIR /app/backend
RUN uv sync --no-dev

# Frontend setup
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Copy backend code
WORKDIR /app
COPY backend/ ./backend/

# Serve frontend with nginx and run backend
WORKDIR /app
EXPOSE 8080

# Start script
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]
```

**NO RECOMENDADO para free tier** - Probablemente exceda 512MB RAM.

---

## 📊 Costos Estimados

| Configuración | Costo | Limitaciones |
|---------------|-------|--------------|
| **Arquitectura Separada (FREE)** | $0/mes | Spin down, DB expira en 90 días |
| **Upgrade a Starter** | $7/mes | Sin spin down, DB permanente |
| **Todo en Starter + Postgres** | $14/mes | Recomendado para producción |

---

## 🔄 Limitación de Spin Down

El servicio "duerme" después de 15 minutos sin tráfico:

- **Primera carga después de dormir:** ~50 segundos
- **Solución gratuita:** Usar un servicio de ping (UptimeRobot)
- **Solución de pago:** Upgrade a plan Starter ($7/mes)

### Mantener Activo (Gratis)

Usa **UptimeRobot** (https://uptimerobot.com):

1. Crea cuenta gratis
2. Add Monitor
3. Type: HTTP(s)
4. URL: Tu URL de Render
5. Interval: 5 minutos

Esto hace ping cada 5 minutos para evitar spin down.

---

## ⏰ Expiración de Base de Datos (90 días)

El PostgreSQL free expira después de 90 días:

### Opciones:

1. **Backup y restaurar:**
   ```bash
   # Backup antes de expirar
   pg_dump $DATABASE_URL > backup.sql
   
   # Crear nueva DB free
   # Restaurar
   psql $NEW_DATABASE_URL < backup.sql
   ```

2. **Upgrade a plan Starter:** $7/mes (base de datos permanente)

3. **Usar otra base de datos:**
   - ElephantSQL (free tier)
   - Supabase (free tier)
   - Neon (free tier)

---

## ✅ Checklist de Deployment

- [ ] Repositorio en GitHub
- [ ] `render-free.yaml` configurado
- [ ] Dockerfiles listos
- [ ] Cuenta Render creada
- [ ] Blueprint aplicado
- [ ] Variables de entorno configuradas
- [ ] URLs actualizadas
- [ ] Health checks pasando
- [ ] Frontend funcional
- [ ] UptimeRobot configurado (opcional)

---

## 🆘 Troubleshooting

### "Out of Memory" Error

```
Solución: Usar arquitectura separada (render-free.yaml)
Cada servicio tiene sus propios 512MB
```

### Build Timeout

```
Solución: Optimizar Dockerfile
- Usar caché de capas
- Minimizar dependencias
```

### Database Connection Failed

```
Solución: Verificar DATABASE_URL
- Auto-configurado por Render
- Verificar en Environment variables
```

### Spin Down Molesto

```
Solución 1: UptimeRobot (gratis)
Solución 2: Upgrade a Starter ($7/mes)
```

---

## 🚀 Deploy Rápido

```bash
# 1. Push a GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main

# 2. En Render Dashboard:
# - New > Blueprint
# - Select repository
# - Choose render-free.yaml
# - Click Apply

# 3. Configurar OPENAI_API_KEY en cada servicio

# 4. Esperar ~10 minutos para el build

# 5. Verificar:
curl https://your-backend.onrender.com/health
```

---

## 💡 Recomendaciones

### Para Desarrollo/Demo (FREE es suficiente)
- ✅ Usa `render-free.yaml`
- ✅ Configura UptimeRobot
- ✅ Acepta el spin down inicial

### Para Producción (Upgrade recomendado)
- ✅ Backend: Plan Starter ($7/mes)
- ✅ PostgreSQL: Plan Starter ($7/mes)
- ✅ Frontend: Puede quedarse en FREE
- **Total:** $14/mes

---

## 📚 Recursos

- [Render Free Tier](https://render.com/docs/free)
- [Render Blueprint](https://render.com/docs/blueprint-spec)
- [UptimeRobot](https://uptimerobot.com)
- [OpenAI API Keys](https://platform.openai.com/api-keys)

---

## ✅ Resultado Esperado

Después de seguir esta guía tendrás:

- ✅ Aplicación deployada en Render (FREE)
- ✅ Frontend accesible vía HTTPS
- ✅ Backend API funcional
- ✅ Base de datos PostgreSQL (90 días)
- ✅ Extractor de prescripciones activo
- ⚠️ Spin down después de 15 min inactividad
- ⚠️ DB expira en 90 días

**Costo total: $0/mes** (con limitaciones)
