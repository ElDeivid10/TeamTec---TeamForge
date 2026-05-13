# TeamForge - Aplicación de Creación de Equipos de Trabajo

Una aplicación web moderna para la creación y gestión de equipos de trabajo, construida con Astro.js, React.js y Supabase.

## Características

- **Autenticación**: Registro e inicio de sesión con email/password
- **Gestión de Equipos**: Crear, visualizar y administrar equipos
- **Miembros**: Agregar, eliminar y gestionar roles de miembros
- **Tiempo Real**: Ver usuarios conectados en simultáneo
- **Estados de Conexión**: En línea, ausente, ocupado, desconectado
- **Diseño Moderno**: Interfaz con tema azul y efectos glassmorphism

## Tecnologías

- **Frontend**: [Astro.js](https://astro.build/) + [React.js](https://react.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Despliegue**: Node.js (standalone)

## Requisitos Previos

- Node.js >= 22.12.0
- Cuenta en [Supabase](https://supabase.com/)
- npm o yarn

## Inicio Rápido

### 1. Clonar el repositorio

```bash
cd flaky-force
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard)
2. Ve a **Settings > API** y copia:
   - `Project URL` → `PUBLIC_SUPABASE_URL`
   - `anon public` key → `PUBLIC_SUPABASE_ANON_KEY`
3. Actualiza el archivo `.env`:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Configurar la Base de Datos

1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Copia y ejecuta el contenido de `supabase-schema.sql`
3. Esto creará las tablas necesarias y configurará la seguridad

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

### 6. Build para Producción

```bash
npm run build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── astro/          # Componentes Astro (estáticos)
│   │   └── Navigation.astro
│   └── react/          # Componentes React (interactivos)
│       ├── CreateTeamModal.tsx
│       ├── MemberList.tsx
│       ├── OnlineUsersList.tsx
│       ├── TeamCard.tsx
│       └── TeamList.tsx
├── layouts/
│   └── Layout.astro
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   └── types.ts        # Tipos TypeScript
├── pages/
│   ├── index.astro     # Landing page
│   ├── dashboard.astro # Panel principal
│   ├── auth/
│   │   ├── login.astro
│   │   ├── register.astro
│   │   └── callback.astro
│   └── teams/
│       └── [id].astro  # Detalle de equipo
└── styles/
    └── global.css      # Estilos Tailwind + custom
```

## Funcionalidades Principales

### Autenticación
- Registro con email/password
- Inicio de sesión
- Cierre de sesión
- Perfil automático al registrarse

### Gestión de Equipos
- Crear equipos con nombre, descripción y color
- Visualizar lista de equipos
- Ver detalles del equipo
- Roles: Owner, Admin, Miembro

### Usuarios en Línea
- Sistema de presencia en tiempo real
- Estados: En línea, Ausente, Ocupado
- Actualización automática al cambiar pestañas
- Conteo de usuarios conectados

### Gestión de Miembros
- Agregar miembros por búsqueda
- Eliminar miembros
- Cambiar roles
- Indicadores de estado en tiempo real

## Personalización

### Colores del Tema

Los colores están definidos en `src/styles/global.css`:

```css
:root {
  --blue-500: #3b82f6;  /* Color principal */
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
}
```

### Componentes

Los componentes React están en `src/components/react/` y pueden personalizarse según las necesidades.

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Build para producción |
| `npm run preview` | Vista previa del build |

## Consideraciones de Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso basadas en autenticación
- Solo miembros pueden ver equipos
- Solo owners/admins pueden gestionar miembros
- Perfiles visibles para usuarios autenticados

## Próximos Pasos

- [ ] Agregar autenticación OAuth (Google, GitHub)
- [ ] Implementar notificaciones
- [ ] Agregar chat en tiempo real
- [ ] Crear sistema de tareas por equipo
- [ ] Agregar invitaciones por email
- [ ] Implementar búsqueda de equipos públicos

## Licencia

MIT
