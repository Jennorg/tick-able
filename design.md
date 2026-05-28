# Design System - Aplicación de Help Desk con IA

## 1. Principios de Diseño
- **Profesional y limpio**: interfaz tipo SaaS con jerarquía clara.
- **Accesible**: contraste AA, etiquetas en campos, foco visible.
- **Consistente**: todos los componentes siguen tokens definidos.
- **Responsive**: adaptación fluida a móvil, tablet y escritorio.
- **Estados cubiertos**: carga (skeleton), vacío (empty state), error, éxito.

## 2. Paleta de Colores

### Colores principales
- **Primario**: `#2563EB` (blue-600) → hover: `#1D4ED8` (blue-700)
- **Fondo general**: `#F9FAFB` (gray-50)
- **Superficie (cards)**: `#FFFFFF`
- **Texto principal**: `#111827` (gray-900)
- **Texto secundario**: `#6B7280` (gray-500)
- **Borde**: `#E5E7EB` (gray-200)

### Colores de estado (tickets)
- **Open (abierto)**: badge azul claro (fondo `#DBEAFE`, texto `#1E40AF`)
- **In Progress (en progreso)**: amarillo (fondo `#FEF3C7`, texto `#92400E`)
- **Resolved (resuelto)**: verde (fondo `#D1FAE5`, texto `#065F46`)

### Prioridad
- **Baja**: gris `#9CA3AF`
- **Media**: azul `#3B82F6`
- **Alta**: naranja `#F97316`
- **Urgente**: rojo `#EF4444`

### Niveles de riesgo (IA)
- **Crítico**: rojo intenso `#DC2626`
- **Alto**: naranja `#EA580C`
- **Medio**: amarillo `#CA8A04`
- **Bajo**: verde `#16A34A`

### Feedback
- **Éxito**: `#10B981` (fondo `#D1FAE5`)
- **Error**: `#EF4444` (fondo `#FEE2E2`)
- **Advertencia**: `#F59E0B` (fondo `#FEF3C7`)

## 3. Tipografía
- **Familia**: `Inter`, sistema (Tailwind por defecto).
- **Escala**:
  - `xs` (12px), `sm` (14px), `base` (16px), `lg` (18px), `xl` (20px), `2xl` (24px), `3xl` (30px), `4xl` (36px).
- **Pesos**: `normal` (400), `medium` (500), `semibold` (600), `bold` (700).
- Títulos de página: `text-2xl font-semibold text-gray-900`.
- Títulos de sección: `text-lg font-medium text-gray-800`.

## 4. Espaciado y Layout
- Espaciado base: `4px` (usa sistema de Tailwind: 1=4px).
- Padding de página: `p-6` (24px) en escritorio, `p-4` en móvil.
- Gap entre elementos: `gap-4` o `gap-6`.
- Border radius:
  - Botones, inputs, cards: `rounded-lg` (8px).
  - Modales: `rounded-xl` (12px).
  - Badges: `rounded-full`.
- Ancho máximo del contenido: `max-w-7xl mx-auto`.

## 5. Sombras y Elevación
- **Card**: `shadow-sm` con borde `border border-gray-200`.
- **Navbar fijo**: `shadow-md`.
- **Sidebar**: `border-r border-gray-200`.
- **Modal**: `shadow-xl` y backdrop con opacidad `bg-black/50`.
- **Tooltips / dropdowns**: `shadow-lg`.

## 6. Componentes

### 6.1 Botones
- **Primario**: `bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium`.
- **Secundario**: `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium`.
- **Peligro**: `bg-red-600 text-white hover:bg-red-700`.
- **Fantasma**: `text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg`.
- **Tamaños**: `sm` (py-1 px-3 text-sm), `md` (py-2 px-4), `lg` (py-3 px-6 text-lg).
- **Estado loading**: spinner interno y texto "Cargando...", deshabilitado.
- **Icono**: puede llevar ícono a la izquierda.

### 6.2 Campos de formulario
- **Input / Textarea**: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`.
- **Label**: `block text-sm font-medium text-gray-700 mb-1`.
- **Error**: borde rojo `border-red-500` y mensaje debajo en rojo `text-sm text-red-600`.

### 6.3 Badges (etiquetas de estado/prioridad)
- Estructura: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`.
- Colores según estado/prioridad (ver paleta).
- Ejemplo: `<span class="bg-blue-100 text-blue-800">Open</span>`.

### 6.4 Cards de ticket (listado)
- Estilo: `bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`.
- Contenido: título (text-base font-semibold), ID (#123), prioridad (badge), estado (badge), fecha (text-xs text-gray-500).
- Indicador de riesgo crítico: borde izquierdo de color o ícono de alerta.

### 6.5 Modales
- Overlay: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`.
- Contenido: `bg-white rounded-xl p-6 max-w-md w-full shadow-xl`.
- Header con título y botón cerrar, cuerpo con mensaje, footer con acciones (Cancelar / Confirmar).

### 6.6 Pestañas y filtros
- Pestañas: `flex border-b border-gray-200 space-x-4`, pestaña activa `border-b-2 border-blue-600 text-blue-600`.
- Filtros: conjunto de selects y botones en una barra superior.

### 6.7 Empty State
- Contenedor centrado con ilustración (svg o emoji), texto principal "No hay resultados", texto secundario descriptivo, y acción opcional (ej. "Crear primer ticket").
- Clases: `flex flex-col items-center justify-center py-12 text-center`.

### 6.8 Skeleton Loaders
- Barras grises animadas: `animate-pulse bg-gray-200 rounded`.
- Para tabla: filas con anchos variables, para card: bloque rectangular.

### 6.9 Notificaciones Toast
- Posición: `fixed bottom-4 right-4 z-50`.
- Tipos: éxito (verde), error (rojo), información (azul).
- Con icono y texto, desaparición automática o botón cerrar.

### 6.10 Panel de IA (detalle de ticket)
- Contenedor colapsable con borde `border border-blue-200 bg-blue-50 rounded-lg p-4`.
- Cabecera con ícono de IA y título "Análisis de IA".
- Contenido formateado con campos: resumen, clasificación, sugerencia (textarea editable), nivel de riesgo (badge de color).
- Botón "Usar sugerencia" (primario) que copia el texto al formulario de comentarios.

## 7. Breakpoints Responsive (Tailwind por defecto)
- `sm`: 640px (móvil grande)
- `md`: 768px (tablet)
- `lg`: 1024px (laptop)
- `xl`: 1280px (escritorio)
- Sidebar: en `lg` es fijo (240px), en móviles se convierte en drawer.
- Tablas: en móviles se apilan cards o scroll horizontal.

## 8. Iconografía
- Librería: `lucide-react` (preferida) o `@heroicons/react`.
- Tamaños: 16px, 20px, 24px, con `strokeWidth={2}`.
- Ejemplos: `AlertCircle` para riesgo alto, `CheckCircle` para resuelto, `Clock` para en progreso, `Plus` para crear.

## 9. Accesibilidad
- Contraste de texto sobre fondo mínimo 4.5:1 (normal) y 3:1 (gran texto).
- Foco visible en todos los elementos interactivos (`focus:ring`).
- Roles ARIA para modales, alerts, navegación.
- Formularios con `<label>` vinculado a input.

## 10. Ejemplos Visuales (descripción)

### Página de Login
- Centro de pantalla, fondo gris claro, tarjeta blanca con sombra, logo arriba, formulario con inputs de email/contraseña, botón "Iniciar sesión" full-width, enlace a registro.

### Dashboard Admin
- Navbar superior con logotipo, campana de notificaciones, avatar.
- Sidebar con ítems: Dashboard, Tickets, Usuarios, Métricas, Categorías.
- Área principal: grid de 4 tarjetas KPI (estadísticas), gráfico de barras y tabla de últimos tickets críticos.

### Detalle de Ticket
- Layout de dos columnas en escritorio: principal con descripción y timeline de comentarios, lateral con panel de IA y acciones rápidas.
- En móvil, apilado vertical.