# 🚀 Capacidades de TickAble — AI Support Ticket System

TickAble es una plataforma inteligente de gestión de soporte técnico diseñada para optimizar la resolución de incidencias mediante IA y automatización. A continuación se detallan las capacidades del sistema clasificadas por rol y funcionalidad técnica.

---

## 👥 1. Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles (Admin, Agent, User) que personaliza la experiencia completa:

### **Usuario Final (User)**
- **Creación de Tickets**: Formulario intuitivo con validación para reportar problemas.
- **Dashboard Personal**: Visualización de KPIs propios (tickets abiertos, en progreso, resueltos).
- **Seguimiento**: Historial detallado de sus tickets y notificaciones de progreso en tiempo real.
- **Comunicación**: Sistema de hilos de comentarios para interactuar con el equipo de soporte.

### **Agente de Soporte (Agent)**
- **Gestión Centralizada**: Acceso a todos los tickets abiertos y asignados.
- **Alertas de Prioridad**: Panel de control que resalta automáticamente tickets urgentes o de alto riesgo.
- **Acciones de Agente**: Cambiar estado (Open -> In Progress -> Resolved), escalar incidencias y asignarse tickets a sí mismo o a compañeros.
- **Métricas de Rendimiento**: Seguimiento de tickets cerrados hoy y tiempo promedio de respuesta.

### **Administrador (Admin)**
- **Control Total**: Capacidad de gestionar usuarios, cambiar roles y administrar categorías del sistema.
- **KPIs Globales**: Visibilidad completa del estado del sistema, tendencias semanales y carga de trabajo del equipo.
- **Gestión de Infraestructura**: CRUD de categorías y auditoría de uso de IA.

---

## 🤖 2. Inteligencia Artificial (Google Gemini)

La IA está integrada en el núcleo del flujo de trabajo, no solo como un adorno:

- **Análisis Automático**: Al crear un ticket, Gemini analiza el título y descripción instantáneamente.
- **Categorización Inteligente**: Sugiere la categoría técnica (Hardware, Software, Red, etc.).
- **Detección de Riesgo**: Clasifica el nivel de riesgo (Crítico, Alto, Medio, Bajo). Los tickets críticos activan alertas visuales (bordes rojos, animaciones pulse).
- **Human-in-the-Loop**: La IA genera una **sugerencia de respuesta profesional**. Los agentes pueden revisarla, editarla y aplicarla como comentario oficial con un solo clic.
- **Auditoría de IA**: Registro detallado de cada invocación (latencia, tokens consumidos, prompt exacto) para control de costos y optimización.

---

## ⚡ 3. Automatización y Notificaciones

- **Notificaciones en Tiempo Real**: Sistema de campana con badge dinámico que informa sobre cambios de estado, nuevas asignaciones o escalaciones.
- **Flujos Externos (n8n)**:
    - **Confirmación por Email**: Envío automático al usuario tras crear un ticket.
    - **Alertas en Slack**: Notificaciones inmediatas en canales de equipo para tickets urgentes.
    - **Resumen Diario**: Generación de reportes de actividad cada 24 horas.
- **Actualización de Estado**: El sistema actualiza automáticamente marcas de tiempo y disparadores de bases de datos ante cualquier interacción.

---

## 📊 4. Gestión de Datos y Métricas

- **Filtrado Avanzado**: Buscador por texto y filtros combinados por Estado, Prioridad y Categoría mediante parámetros de URL.
- **Panel de Métricas**:
    - Distribución de tickets por estado y prioridad.
    - Tabla de rendimiento de agentes (tickets cerrados vs asignados).
    - Monitoreo de satisfacción (simulado para demo).
    - Seguimiento de costos de IA (tokens usados).

---

## 🔒 5. Seguridad y Rendimiento

- **Row Level Security (RLS)**: Las políticas de Supabase garantizan que los usuarios solo vean sus propios datos y los agentes solo información autorizada.
- **Next.js 15 (App Router)**: Uso de Server Components para máxima velocidad y Client Components solo donde la interactividad es necesaria.
- **Optimización de Tokens**: Estrategias implementadas para reducir el consumo de IA (Modelos Flash, prompts comprimidos y truncamiento de contexto).
