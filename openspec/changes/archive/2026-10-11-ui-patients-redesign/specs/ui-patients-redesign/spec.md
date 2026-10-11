# UI Patients View Specification

## Purpose
Specifies layout, typography, accessibility, and visual interactions for the Patients Directory (tabs, header, search, responsive table/cards, and modal) following `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Status Tabs & Counter Subtitle
The patients view SHALL:
- Provide 3 tabs: "En tratamiento", "De alta", and "Todos", each displaying its real-time item count.
- Update the subtitle text to state the exact count for the selected tab in natural Spanish (e.g., `12 pacientes en tratamiento`, `3 pacientes de alta`, `15 pacientes en total`).

### Requirement: Header & Search Bar
The directory header SHALL:
- Display title `Fichero de pacientes` in Newsreader serif 500.
- Provide a search input with stroke `search` icon that filters patients in real time without accent or case sensitivity.
- Provide a single primary action button `+ Nuevo paciente` using the primary petroleum token (`#2C5F6B`).

### Requirement: Tabular & Card Patient Presentation
The patient list SHALL:
- On desktop (>= 768px): Render a table with sentence-case headers: `Paciente`, `Contacto`, `Obra social o prepaga`, `Costo de sesión`, `Acciones`.
- On mobile (< 768px): Render stacked cards containing the same fields.
- Tag every sensitive data element (`name`, `age`, `phone`, `email`, `address`, `insurance`, `affiliateNumber`, `fee`) with `data-sensitive` to ensure full privacy blur when active.
- Display session fee in tabular numbers formatted as Argentine pesos (`$ 20.000`).
- Display group badge (`Infanto-juvenil` or `Adulto`) and `De alta` state pill when inactive.
- Replace emojis with stroke icons (`pin` for address, `file` for "Ver ficha").

### Requirement: Patient Modal Redesign
The `PatientModal` SHALL:
- Render in an accessible dialog container with clean token styling.
- Display `Registrar nuevo paciente` or `Editar ficha de paciente` title with `x` close button.
- Provide clear validation, accessible labels, and primary save action.
