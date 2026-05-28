<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

```markdown
# AGENT_INSTRUCTIONS.md — AI Support Ticket System

> **Objetivo:** Construir de extremo a extremo la plataforma "AI Support Ticket System", siguiendo estrictamente los requisitos funcionales, técnicos y de evaluación proporcionados por el jurado.

---

## 1. Stack Tecnológico (Inamovible)

- **Frontend:** Next.js (App Router o Pages Router) + Tailwind CSS.
- **Backend y DB:** Supabase (PostgreSQL) con autenticación, Row Level Security y funciones Edge si es necesario. Opcionalmente Node.js en API Routes de Next.js.
- **IA:** Claude (Anthropic) u OpenAI (GPT-4o). El modelo debe devolver siempre una respuesta en JSON estructurado.
- **Automatización:** n8n (autogestionado o cloud) para flujos de notificación.
- **Infraestructura:** Repositorio en GitHub, despliegue del frontend en Vercel.

---

## 2. Esquema de Base de Datos (Supabase)

Crea las siguientes tablas con sus columnas, tipos y relaciones. Incluye políticas de seguridad (RLS) por rol.

```sql
-- users (extiende auth.users de Supabase)
-- Supabase maneja auth.users internamente.
-- Tabla pública:
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'agent', 'user')) default 'user',
  avatar_url text,
  created_at timestamptz default now()
);

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text check (status in ('open', 'in_progress', 'resolved')) default 'open',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  category_id uuid references public.categories on delete set null,
  created_by uuid references public.profiles not null,
  assigned_to uuid references public.profiles,
  ia_summary text,
  ia_classification text,
  ia_suggestions text,
  ia_risk_level text check (ia_risk_level in ('critical', 'high', 'medium', 'low')),
  ia_raw_json jsonb,
  ia_prompt text,
  ia_model text,
  ia_latency_ms integer,
  ia_tokens_used integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets on delete cascade not null,
  author_id uuid references public.profiles not null,
  content text not null,
  is_internal boolean default false,
  created_at timestamptz default now()
);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  ticket_id uuid references public.tickets,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ia_audit_log (observabilidad de IA)
create table public.ia_audit_log (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets not null,
  prompt text,
  model text,
  latency_ms integer,
  tokens_used integer,
  result jsonb,
  created_at timestamptz default now()
);
```

Políticas RLS mínimas:
- `profiles`: los usuarios pueden leer sus propios datos, admin todos.
- `tickets`: user ve sus propios tickets; agent ve los asignados y todos los abiertos; admin ve todos.
- `comments`: visibilidad según el ticket y si es interno (agentes/admin).
- `notifications`: cada usuario ve las suyas.
- `categories`: admin CRUD, otros solo lectura.
- `ia_audit_log`: solo admin y agentes.

---

## 3. Frontend (Next.js + Tailwind) — Vistas y Funcionalidades

Implementa **todas** estas páginas con los estados: **loading (skeleton)**, **empty (ilustración + mensaje)**, **error (toast o alert)**.

### 3.1 Autenticación
- Página `/login`: email/password, enlace a registro.
- Página `/register`: nombre, email, password, rol por defecto 'user'.
- Protección de rutas: proxy que redirija según sesión y rol.

### 3.2 Layout principal
- `Navbar`: logotipo, campana de notificaciones con badge (número de no leídas), avatar y menú desplegable (perfil, logout).
- `Sidebar`: solo visible en `lg`. Elementos según rol:
  - User: Dashboard, Mis Tickets, Crear Ticket.
  - Agent: Dashboard, Tickets (todos), Métricas.
  - Admin: Dashboard, Tickets, Gestión de Usuarios, Categorías, Métricas.
- En móvil: drawer lateral.

### 3.3 Dashboard (según rol)
- **User**:
  - KPIs: tickets abiertos, en progreso, resueltos.
  - Lista de mis tickets recientes (últimos 5).
  - Botón grande "Crear nuevo ticket".
- **Agent**:
  - Tickets asignados por prioridad (badges de color).
  - Alertas: sección "Alta prioridad" con fondo naranja/rojo si hay urgentes.
  - Métricas personales: cerrados hoy, tiempo promedio de respuesta (simulado).
- **Admin**:
  - KPIs globales: total abiertos, en progreso, resueltos, tiempo medio resolución.
  - Gráfico de tendencia (puede ser placeholder con barras) semanal.
  - Tabla de últimos tickets urgentes.

### 3.4 Listado de tickets
- Página `/tickets`.
- Filtros: estado, prioridad, categoría, búsqueda por texto.
- Vista en tabla (escritorio) y cards (móvil). Cada fila/card muestra: título, ID, prioridad (badge), estado (badge), fecha, agente asignado.
- Riesgo IA: si `ia_risk_level` es "critical" o "high", mostrar un icono de advertencia (usar un SVG o clase como `AlertTriangle`) y borde izquierdo coloreado.
- Paginación.
- Estado vacío: "No se encontraron tickets" con ilustración.
- Acción: clic lleva a detalle.

### 3.5 Creación de ticket
- Página `/tickets/new`.
- Formulario: título, descripción (textarea), prioridad (select), categoría (select cargado de DB).
- Archivo adjunto (simulado, campo file con vista previa opcional).
- Al enviar:
  - Se inserta en `tickets`.
  - Se dispara **automáticamente** el análisis de IA (ver sección 4).
  - Se muestra toast de éxito y redirige al detalle.
- Validación: título obligatorio, mín. 10 caracteres en descripción.

### 3.6 Detalle del ticket (`/tickets/[id]`)
- Cabecera: título, ID, estado (badge), prioridad (badge), fechas.
- Sección de descripción completa.
- **Panel de IA** (lateral derecho o colapsable):
  - Siempre visible si hay datos de IA (no en creación).
  - Cabecera "Análisis IA" con un icono representativo (cerebro, chip o similar).
  - Muestra el JSON procesado de forma legible:
    - **Resumen** (summary)
    - **Clasificación** (classification)
    - **Sugerencia de respuesta** (suggestions) en un textarea editable.
    - **Nivel de riesgo** (riskLevel) con círculo de color (crítico=rojo pulsante, alto=naranja, medio=amarillo, bajo=verde).
    - Información de auditoría: tokens usados, latencia, modelo (si se desea).
  - Botón "Aplicar sugerencia": al hacer clic, abre modal de confirmación ("¿Agregar esta respuesta como comentario?"). Al confirmar, se crea un comentario con el contenido de la sugerencia y se muestra toast "Respuesta agregada". El botón debe requerir rol Agent/Admin.
- **Timeline de comentarios**:
  - Línea temporal con burbujas. Cada comentario: avatar, nombre, fecha, contenido.
  - Los comentarios internos se muestran con fondo gris claro y etiqueta "Interno".
- **Formulario de comentario** (abajo): campo de texto y botón "Enviar".
- **Acciones** (solo Agent/Admin):
  - Cambiar estado (Open a In Progress a Resolved).
  - Asignar agente (select con usuarios Agent).
  - Botón "Escalar" (simula notificación especial).
- Si no hay comentarios: empty state "Sin comentarios aún".
- Si no hay análisis IA: mensaje "El análisis de IA estará disponible pronto".

### 3.7 Gestión de usuarios (Admin)
- Página `/admin/users`.
- Tabla: nombre, email, rol (badge), acciones.
- Botón "Cambiar rol" que abre modal con select (user/agent/admin).
- Confirmación antes de actualizar. Toast de éxito/error.
- Búsqueda y paginación.

### 3.8 Gestión de categorías (Admin)
- Página `/admin/categories`.
- Lista de categorías con nombre, descripción, acciones (editar, eliminar).
- Botón "Nueva categoría" seguido de modal con formulario (nombre, descripción).
- Eliminar con confirmación modal.
- Validaciones: nombre obligatorio y único.

### 3.9 Métricas (Admin y Agent)
- Página `/metrics`.
- Gráficos de barras/donas (pueden ser placeholders SVG o usando una librería como Recharts).
  - Tickets por estado (abiertos, en progreso, resueltos).
  - Distribución de prioridades.
  - Tiempo promedio de resolución por agente (simulado).
- Filtro por rango de fechas.
- Tabla de rendimiento de agentes: nombre, tickets asignados, cerrados, satisfacción (aleatoria para demo).

### 3.10 Notificaciones (componente global)
- En navbar, icono de campana con contador (badge rojo si >0).
- Dropdown con lista de últimas notificaciones. Cada una: mensaje, enlace al ticket, marca "nueva" (punto azul/violeta).
- Acción "Marcar todas como leídas".
- Página completa de notificaciones `/notifications` con historial.

---

## 4. Integración de la IA (Reglas Estrictas)

### 4.1 Flujo de invocación
- Cuando se crea un ticket, se debe llamar a la API de IA (OpenAI/Claude) pasando el `title` y `description`.
- Prompt de sistema (ejemplo):
  ```
  Eres un asistente de soporte técnico. Analiza el siguiente ticket y devuelve un JSON estrictamente con este formato, sin texto adicional:
  {
    "summary": "resumen del problema en una frase",
    "classification": "categoría detectada (hardware, software, red, etc.)",
    "suggestions": "respuesta sugerida al usuario, profesional y clara",
    "riskLevel": "critical, high, medium o low"
  }
  Ticket: Título: [title] Descripción: [description]
  ```
- **Importante:** Usa `response_format={ type: "json_object" }` si es OpenAI, o instrucciones explícitas para Claude de devolver solo JSON.

### 4.2 Almacenamiento de la respuesta
- Guarda el JSON devuelto en la columna `ia_raw_json` del ticket.
- Extrae los campos y guarda en `ia_summary`, `ia_classification`, `ia_suggestions`, `ia_risk_level`.
- Calcula y guarda: `ia_prompt` (el prompt completo enviado), `ia_model` (ej. "gpt-4o"), `ia_latency_ms` (tiempo de respuesta), `ia_tokens_used` (de la respuesta de API).
- Además, inserta un registro en `ia_audit_log` con los mismos datos.

### 4.3 Human-in-the-loop
- La sugerencia (`suggestions`) nunca se aplica automáticamente.
- Debe mostrarse en el panel de IA del detalle y requerir que un Agente/Admin presione "Aplicar sugerencia".
- Solo al confirmar se crea el comentario.

### 4.4 Gestión de Tokens y Optimización
- Mantén un contador global de tokens consumidos (puede ser una tabla `usage_stats` o simplemente sumando los logs).
- En la página de métricas (o una sección de admin) muestra el total de tokens usados y el costo estimado.
- **Entrega documentada de optimización:** En el README del repo, incluye una sección "Estrategias de optimización de tokens" donde sugieras: limitar la longitud del prompt, usar modelos más pequeños para tareas simples, cachear respuestas para tickets similares, resumir conversaciones antes de reenviar, etc. (ver sección 7).

---

## 5. Automatizaciones con n8n

Debes proveer los workflows de n8n como archivos JSON exportables y una guía de importación. Los flujos obligatorios:

1. **Email de confirmación al crear ticket:**
   - Trigger: Webhook (llamado desde Supabase/Next.js tras insertar ticket) o escucha cambios en la tabla `tickets` vía Supabase trigger.
   - Acción: enviar correo al creador con los detalles del ticket.

2. **Alerta en Slack si prioridad es alta o urgente:**
   - Trigger: nuevo ticket con `priority IN ('high', 'urgent')` o actualización de prioridad a esos valores.
   - Acción: enviar mensaje a un canal de Slack con título, descripción y enlace al ticket.

3. **Resumen diario:**
   - Trigger: programado (cron) cada día a las 8 AM.
   - Acción: consultar tickets creados/actualizados en las últimas 24h, contar por estado y prioridad, y enviar un correo o mensaje de Slack al equipo de soporte con el resumen.

Asegúrate de documentar en el README cómo configurar las credenciales en n8n (Gmail/SMTP, Slack, Supabase).

---

## 6. Rutas API (Backend)

Opcionalmente, puedes implementar API Routes en Next.js o usar directamente Supabase desde el frontend con RLS. Si usas API Routes, incluye:

- `POST /api/auth/login`, `POST /api/auth/register` (si no usas solo Supabase Auth).
- `GET /api/tickets`, `POST /api/tickets`.
- `GET /api/tickets/[id]`, `PATCH /api/tickets/[id]`.
- `POST /api/tickets/[id]/comments`.
- `GET /api/users`, `PATCH /api/users/[id]/role` (admin).
- `GET /api/categories`, `POST /api/categories`, `DELETE /api/categories/[id]` (admin).
- `GET /api/notifications`.
- `GET /api/metrics`.

Pero se recomienda usar Supabase Client directamente con RLS para simplificar.

---

## 7. Documentación y Entregables

### 7.1 Repositorio GitHub
Estructura sugerida:
```
├── app/ (o src/)
│   ├── (auth)/login, register
│   ├── dashboard
│   ├── tickets
│   ├── admin
│   ├── metrics
│   └── notifications
├── components/ (UI reutilizables)
├── lib/ (supabase client, helpers)
├── public/
├── design.md (tu design system)
├── AGENT_INSTRUCTIONS.md (este archivo)
└── README.md
```

### 7.2 README.md obligatorio
Debe contener:
- Descripción del proyecto.
- Arquitectura general (diagrama en texto o imagen).
- Stack tecnológico.
- Guía de instalación y ejecución local:
  1. Clonar repo.
  2. Instalar dependencias (`npm install`).
  3. Configurar variables de entorno (`.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, etc.).
  4. Ejecutar migraciones de Supabase.
  5. `npm run dev`.
- Explicación de cómo funciona la integración con IA.
- **Sección "Optimización de Tokens"** (ver abajo).
- Cómo importar los flujos de n8n y configurarlos.
- Evidencia funcional: capturas de pantalla o enlace a demo.

### 7.3 Sección de optimización de tokens (obligatoria para evaluación)
Redacta un análisis que incluya al menos 3 estrategias concretas para reducir el consumo de tokens, por ejemplo:
- **Prompt comprimido:** eliminar palabras redundantes y usar formato estricto para reducir tokens de entrada.
- **Selección de modelo:** usar `gpt-3.5-turbo` para clasificación simple y reservar `gpt-4o` solo para resúmenes complejos.
- **Caché semántico:** almacenar respuestas de IA para tickets similares y reutilizarlas si la similitud supera un umbral.
- **Truncamiento inteligente:** limitar la descripción a los primeros 500 caracteres para el análisis inicial, con opción de análisis completo bajo demanda.
- **Reutilización de contexto:** en lugar de enviar todo el historial del ticket a la IA, enviar solo el último comentario y el resumen previo.

---

## 8. Checklist de Evaluación (Autoverificación)

Antes de presentar, asegúrate de cumplir:

- [ ] CRUD tickets funcional.
- [ ] Autenticación con roles y restricciones en UI y RLS.
- [ ] Dashboard con KPIs (datos reales o simulados con queries).
- [ ] Formulario de ticket con análisis de IA automático.
- [ ] Panel de IA con JSON estructurado mostrado correctamente.
- [ ] Botón "Aplicar sugerencia" con confirmación (human-in-the-loop).
- [ ] Registro de auditoría de IA (tabla `ia_audit_log` con todos los campos).
- [ ] Estados vacíos y manejo de errores en cada vista.
- [ ] Flujos n8n funcionales: correo, Slack, resumen diario.
- [ ] Documentación de tokens y sugerencias de optimización en README.
- [ ] Aplicación desplegada en Vercel y Supabase funcional.
- [ ] Repositorio público ordenado con README completo.

---

## 9. Instrucciones de ejecución para el agente

1. **Setup inicial:** Crea un proyecto Next.js con Tailwind, configura Supabase y las variables de entorno.
2. **Base de datos:** Ejecuta las migraciones SQL proporcionadas. Habilita RLS y políticas.
3. **Autenticación:** Implementa login/registro con Supabase Auth y tabla `profiles`. Crea proxy de protección de rutas.
4. **UI y páginas:** Construye cada vista según la sección 3, usando los componentes del design system (`design.md`). Asegura responsive.
5. **Lógica de tickets:** Conecta formularios y listados a Supabase. Implementa filtros, búsqueda y paginación.
6. **Integración IA:** Al crear ticket, llama a la API de IA (desde un API Route o Edge Function), procesa la respuesta JSON y guarda en DB. Refleja los datos en el detalle.
7. **Auditoría IA:** Registra cada interacción en `ia_audit_log`.
8. **Notificaciones:** Implementa la tabla y el componente de notificaciones; inserta registros al cambiar estados o asignar agentes.
9. **n8n:** Diseña los tres workflows y exporta el JSON. Documenta cómo configurarlos.
10. **Documentación:** Escribe el README con todas las secciones requeridas. Incluye capturas de pantalla y enlace a demo.
11. **Despliegue:** Haz push a GitHub, conecta Vercel, configura variables de entorno y despliega.

Sigue al pie de la letra estos requisitos para obtener la máxima calificación.
```