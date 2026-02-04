# Deploy a Render.com (Plan FREE) 🚀

Guía rápida para deployar Grandson Pill Pal en Render usando el **plan gratuito**.

## ⚡ Quick Start (5 minutos)

### 1. Push a GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Deploy en Render

1. Ve a [render.com](https://render.com) y sign up con GitHub
2. Click **"New +"** → **"Blueprint"**
3. Conecta tu repositorio `grandson-pill-pal`
4. Render detecta `render.yaml` automáticamente
5. Click **"Apply"**

### 3. Configura OPENAI_API_KEY

**Importante:** Después del deploy inicial:

1. Ve al servicio **grandson-pill-pal-backend**
2. Environment → `OPENAI_API_KEY` → Agrega tu key
3. Manual Deploy

4. Ve al servicio **grandson-pill-pal-extractor**
5. Environment → `OPENAI_API_KEY` → Agrega la misma key
6. Manual Deploy

### 4. ¡Listo! Verifica

```bash
# Backend
curl https://grandson-pill-pal-backend.onrender.com/health

# Extractor
curl https://grandson-pill-pal-extractor.onrender.com/health

# Frontend (abre en navegador)
open https://grandson-pill-pal-frontend.onrender.com
```

## 📊 Lo que se despliega

El archivo `render.yaml` crea automáticamente:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | `grandson-pill-pal-frontend.onrender.com` | React app (Nginx) |
| Backend | `grandson-pill-pal-backend.onrender.com` | FastAPI API |
| Extractor | `grandson-pill-pal-extractor.onrender.com` | AI microservice |
| Database | Internal | PostgreSQL (FREE 90 días) |

## ⚠️ Limitaciones del Plan FREE

- **Spin down:** Servicios duermen después de 15 min sin uso
- **Primera carga:** ~50 segundos después de dormir
- **Database:** Expira después de 90 días
- **RAM:** 512MB por servicio

## 🔧 Configuración (Ya incluida en render.yaml)

### Backend
```yaml
envVars:
  - DATABASE_URL: auto-configurado ✅
  - CORS_ORIGINS: frontend URL ✅
  - OPENAI_API_KEY: ⚠️ DEBES CONFIGURAR
```

### Extractor
```yaml
envVars:
  - OPENAI_API_KEY: ⚠️ DEBES CONFIGURAR
  - CORS_ORIGINS: frontend URL ✅
```

### Frontend
```yaml
envVars:
  - VITE_API_URL: backend URL ✅
  - VITE_EXTRACTOR_URL: extractor URL ✅
```

## 💡 Evitar Spin Down (Opcional)

Usa [UptimeRobot](https://uptimerobot.com) (gratis):

1. Crea cuenta
2. Add Monitor → HTTP(s)
3. URL: Tu backend en Render
4. Interval: 5 minutos

Esto hace ping cada 5 minutos para mantenerlo activo.

## 🔄 Updates y Redeploys

Render hace auto-deploy cuando haces push a GitHub:

```bash
# Hacer cambios
git add .
git commit -m "Update feature"
git push origin main

# Render detecta el push y redeploya automáticamente
```

## 🆘 Troubleshooting

### "Service Unavailable" (503)

Servicio dormido. Espera ~50 segundos y recarga.

### "Build Failed"

Revisa los logs en Render Dashboard → Service → Logs

### "Health Check Failed"

Verifica que `/health` endpoint responde en backend/extractor.

### Variables de entorno no funcionan

1. Verifica en Render Dashboard → Service → Environment
2. Asegúrate que `OPENAI_API_KEY` está configurado
3. Trigger Manual Deploy

## 💰 Costos

| Plan | Costo | Features |
|------|-------|----------|
| **FREE** | $0/mes | Spin down, DB 90 días |
| Backend Starter | $7/mes | Sin spin down |
| DB Starter | $7/mes | DB permanente |

**Recomendación:** Empieza con FREE para desarrollo/demo.

## 📚 Recursos

- [Render Docs](https://render.com/docs)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [UptimeRobot](https://uptimerobot.com)

## ✅ Checklist

- [ ] Código en GitHub
- [ ] Render Blueprint aplicado
- [ ] `OPENAI_API_KEY` configurado en backend
- [ ] `OPENAI_API_KEY` configurado en extractor
- [ ] Health checks pasando
- [ ] Frontend carga correctamente
- [ ] UptimeRobot configurado (opcional)

---

**¿Problemas?** Lee la guía detallada en `DEPLOY_FREE.md`
