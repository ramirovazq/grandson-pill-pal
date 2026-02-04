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

## 🚀 Deploy con Arquitectura Separada (Plan FREE)

El archivo `render.yaml` está configurado con servicios separados optimizados para free tier.

### ✅ Ventajas de esta arquitectura
- Mejor uso de recursos (512MB RAM por servicio)
- Servicios independientes
- Más estable que monolito
- Escalable

### ⚠️ Consideraciones
- 3 servicios = 3 spin downs después de inactividad
- Primera carga: ~50 segundos por servicio

### 📋 Paso a Paso

#### 1. Preparación

```bash
# Asegúrate de tener los Dockerfiles necesarios
ls backend/Dockerfile              # ✓
ls backend/Dockerfile.extractor    # ✓
ls frontend/Dockerfile             # ✓

# Verifica que render.yaml existe
cat render.yaml

# Commit y push a GitHub
git add .
git commit -m "Add Render deployment configuration"
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
4. Render detectará automáticamente `render.yaml`
5. Click **"Apply"**

Render creará automáticamente:
- ✅ grandson-pill-pal-backend
- ✅ grandson-pill-pal-extractor
- ✅ grandson-pill-pal-frontend
- ✅ grandson-pill-pal-db (PostgreSQL)

#### 4. Configurar Variables de Entorno

**IMPORTANTE:** Después del deploy inicial, configura tu API key de OpenAI:

1. Ve a cada servicio (backend y extractor)
2. Click en "Environment"
3. Encuentra `OPENAI_API_KEY`
4. Agrega tu API key: `sk-proj-xxxxx...`
5. Save changes
6. Trigger un nuevo deploy (Manual Deploy)

**Backend** necesita:
- `OPENAI_API_KEY`: ⚠️ REQUERIDO
- `DATABASE_URL`: ✅ Auto-configurado por Render
- `CORS_ORIGINS`: ✅ Ya configurado en render.yaml

**Extractor** necesita:
- `OPENAI_API_KEY`: ⚠️ REQUERIDO
- `CORS_ORIGINS`: ✅ Ya configurado en render.yaml

**Frontend** necesita:
- `VITE_API_URL`: ✅ Ya configurado en render.yaml
- `VITE_EXTRACTOR_URL`: ✅ Ya configurado en render.yaml

#### 5. Verificar Deployment

```bash
# Espera ~10 minutos para que todos los servicios se construyan

# Health checks
curl https://grandson-pill-pal-backend.onrender.com/health
# Respuesta esperada: {"status":"healthy","timestamp":"..."}

curl https://grandson-pill-pal-extractor.onrender.com/health
# Respuesta esperada: {"status":"healthy","timestamp":"..."}

# Frontend
open https://grandson-pill-pal-frontend.onrender.com
```

#### 6. URLs Finales

Tus servicios estarán disponibles en:

```
Frontend:      https://grandson-pill-pal-frontend.onrender.com
Backend API:   https://grandson-pill-pal-backend.onrender.com
API Docs:      https://grandson-pill-pal-backend.onrender.com/api/v1/docs
Extractor:     https://grandson-pill-pal-extractor.onrender.com
Extractor Docs: https://grandson-pill-pal-extractor.onrender.com/docs
```

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
