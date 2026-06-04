# AI Support Ticket System - TickAble

TickAble es una plataforma integral de gestión de tickets de soporte potenciada por Inteligencia Artificial (Google Gemini). Permite a los usuarios crear solicitudes que son analizadas automáticamente para categorizarlas, resumirlas y sugerir respuestas, optimizando el tiempo de resolución del equipo de soporte.

## 🚀 Tecnologías

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4.
- **Backend:** Supabase (Auth, PostgreSQL, RLS).
- **IA:** Google Gemini (Generative AI SDK) con procesamiento JSON estructurado.
- **Automatización:** n8n para flujos de notificación y resúmenes.
- **Componentes:** Lucide React (iconos), Recharts (métricas).

## 🏗️ Arquitectura

La aplicación sigue una arquitectura basada en **Next.js Server Actions** para la lógica de negocio y comunicación con Supabase/Gemini, asegurando que las claves de API permanezcan en el servidor.

1. **Creación:** El usuario envía un ticket.
2. **Análisis:** Una Server Action invoca a Gemini 1.5 Flash para analizar el contenido.
3. **Persistencia:** Se guarda el ticket y su análisis en Supabase.
4. **Notificación:** Supabase Triggers o Webhooks activan flujos en n8n.
5. **Human-in-the-Loop:** Los agentes revisan la sugerencia de la IA y pueden copiarla al cuadro de comentarios para editarla antes de enviarla.

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <repo-url>
   cd tick-able
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Variables de Entorno:**
   Crea un archivo `.env.local` con las siguientes claves:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_supabase
   GEMINI_API_KEY=tu_clave_gemini
   ```

4. **Base de Datos:**
   Ejecuta el script SQL en `supabase/migrations/20260527000001_initial_schema.sql` en el SQL Editor de Supabase.

5. **Ejecución:**
   ```bash
   npm run dev
   ```

## 🤖 Integración de IA

TickAble utiliza un "Prompt de Sistema" estricto para forzar a Gemini a devolver un JSON válido. Los datos extraídos incluyen:
- **Resumen:** Una frase concisa del problema.
- **Clasificación:** Categoría técnica sugerida.
- **Sugerencia:** Respuesta profesional pre-redactada.
- **Riesgo:** Nivel de urgencia (Critical, High, Medium, Low).

### 📊 Control y Conteo del Consumo de Tokens

Para garantizar un monitoreo de costos a escala y en tiempo real, TickAble cuenta con una arquitectura de observabilidad optimizada:
1. **Acumulador en Base de Datos (`usage_stats`):** En lugar de barrer la tabla de auditoría completa en cada solicitud, un trigger de base de datos (`on_ia_audit_log_inserted`) incrementa de forma incremental los totales diarios agrupados por modelo en la tabla `usage_stats`.
2. **Auditoría Exhaustiva (`ia_audit_log`):** Cada llamada a la API de IA genera un registro detallado que incluye: el prompt exacto enviado, el modelo utilizado, el tiempo de latencia en milisegundos, los tokens consumidos y la respuesta estructurada devuelta por Gemini.
3. **Visualización y Reportes de Consumo:**
   - **Dashboard de Métricas:** Gráficos interactivos de Recharts que revelan las tendencias de consumo y costo diario, además de una lista de auditoría en tiempo real del uso de IA.
   - **Reporte Diario en n8n:** El flujo cron diario recopila de forma paralela los consumos de las últimas 24h directamente desde la base de datos, agregando automáticamente los tokens usados, costos y tiempos promedio de latencia mediante un nodo Code (JavaScript) antes de enviar el reporte unificado a Slack.

### 📉 Estrategias de Optimización de Tokens

1. **Uso de Modelos Flash:** Utilizamos `gemini-2.5-flash` por defecto en lugar de modelos más pesados. Es sumamente veloz y óptimo en costos para resúmenes y clasificación, con un ahorro de más del 90% comparado con la gama Pro.
2. **Contexto Truncado e Inteligente:** La descripción de los tickets se trunca y sanea para evitar el envío de payloads redundantes o excesivos. Para flujos conversacionales, solo se transmiten los últimos comentarios relevantes en lugar del histórico completo.
3. **Formatos de Salida Estrictos (JSON):** El uso de `responseMimeType: "application/json"` previene que el modelo agregue preámbulos explicativos verbosos, minimizando significativamente los tokens de salida (Output Tokens).
4. **Prompt de Sistema Comprimido:** Se han purgado palabras redundantes del prompt, manteniendo únicamente las directrices técnicas esenciales para reducir los tokens de entrada (Input Tokens).
5. **Caché y Human-in-the-Loop:** Las sugerencias se guardan en el ticket y requieren aprobación explícita del agente (Human-in-the-loop) para publicarse como comentarios, evitando re-ejecuciones de IA accidentales sobre la misma consulta.

## ⚙️ Automatizaciones n8n

Para que las automatizaciones funcionen correctamente, utiliza **Database Webhooks** en Supabase en lugar del nodo `Supabase Trigger` (que puede ser inestable).

### Configuración en n8n:
1. Importa los archivos JSON de la carpeta `/n8n`.
2. En cada nodo **Webhook**, copia la URL de producción (Production URL).
3. Asegúrate de que el flujo esté activo (Active: ON).

### Configuración en Supabase (Dashboard):
1. Ve a **Database** -> **Webhooks**.
2. Crea un nuevo Webhook:
   - **Name:** `notify_ticket_created`
   - **Table:** `tickets`
   - **Events:** `INSERT`
   - **HTTP Method:** `POST`
   - **URL:** Pega la URL del Webhook de n8n correspondientes.
3. Haz lo mismo para las alertas de prioridad alta, apuntando a la URL del Webhook respectivo.

## 🛡️ Seguridad (RLS)

Todas las tablas en Supabase tienen habilitado **Row Level Security**:
- **Profiles:** Usuarios solo ven su perfil; Admin ve todos.
- **Tickets:** Usuarios ven sus tickets; Agentes ven asignados y abiertos.
- **Comments:** Usuarios no ven comentarios marcados como `is_internal`.
- **IA Audit Log:** Solo accesible por personal autorizado.

---
Proyecto desarrollado para la evaluación de AI Support Ticket System.
