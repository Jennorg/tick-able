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
5. **Human-in-the-Loop:** Los agentes revisan la sugerencia de la IA antes de aplicarla.

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

### 📉 Estrategias de Optimización de Tokens

1. **Uso de Modelos Flash:** Utilizamos `gemini-1.5-flash` por defecto. Es significativamente más económico y rápido que `1.5-pro` para tareas de clasificación y resumen, manteniendo una alta precisión.
2. **Contexto Truncado:** En lugar de enviar todo el historial de comentarios, solo enviamos el título y la descripción inicial para el análisis principal. Para análisis posteriores, se envían solo los últimos 3 mensajes relevantes.
3. **Formatos Estrictos:** El uso de `responseMimeType: "application/json"` reduce la verbosidad del modelo, evitando explicaciones innecesarias y ahorrando tokens de salida.
4. **Prompt Comprimido:** El prompt de sistema está diseñado para ser directo y sin adornos, minimizando los tokens de entrada (Input Tokens).

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
