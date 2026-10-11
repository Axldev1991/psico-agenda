# UI Navigation Shell Specification

## Purpose
Specifies layout, typography, accessibility, and visual interactions for the primary application navigation shell (Sidebar, Mobile Header, Brand, and Google Drive Card) as defined in `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Uniform Iconography
The application SHALL replace loose emoji icons with an accessible SVG icon system sharing a consistent stroke width (`1.75px`), rounded joins/caps, and inheriting text color (`currentColor`).
- Icons: `calendar`, `folder`, `settings`, `plus`, `cloud`, `eye`, `eye-off`, `chev-l`, `chev-r`, `chev-d`, `menu`, `terminal`, `lock`, `check`, `alert`, `refresh`, `search`, `file`, `download`, `list`, `more`, `logout`.

### Requirement: Full-Height Sidebar Navigation
The desktop sidebar SHALL:
- Extend the full height of the viewport (`min-h-screen`).
- Display the brand symbol (`Ψ` in a petroleum square with `r-md`) and title `Psico-Agenda` (`font-serif`) with subtitle `Gestión clínica` (`font-sans`).
- Provide navigation links for `Agenda`, `Fichero`, and `Configuración` with `aria-current="page"` on active tab and petroleum tint (`#E4EFF1`) background.
- List recent patients using standard typography (blurrable when privacy mode is enabled).
- Exclude "Programar turno" (which moves to the calendar header per the guide).

### Requirement: Simplified Google Drive Card
The sidebar footer SHALL render a dedicated Google Drive card:
- Connection indicator dot: green (connected), amber (syncing / disconnected), red (error).
- Status label and formatted natural language timestamp (e.g., "Sincronizado hoy a las 14:30").
- If connected: A primary "Sincronizar" button alongside a "..." overflow button.
- Overflow menu with accessible menuitems:
  - "Descargar copia sin conexión" (triggers full preload).
  - "Ver registros de sincronización" (opens or downloads logs).
  - Divider line (`<hr>`).
  - "Desconectar Drive" (in danger red).
- If disconnected: A clear "Conectar Drive" action button.

### Requirement: Mobile Top Bar & Privacy Toggle
On narrow screens (< 768px):
- Render a header with menu button (`i-menu`), centered `Psico-Agenda` brand, and a dedicated "Ocultar datos" button (`i-eye` / `i-eye-off`) with `aria-pressed`.
- Toggling privacy blurs all patient sensitive data across the entire UI.
