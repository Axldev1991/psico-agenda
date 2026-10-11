# UI Settings & Clinical Tools Specification

## Purpose
Specifies layout, components, accessibility, and visual interactions for the Clinical Settings Panel (movements and punctuation highlights) following `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Accessible Native Accordions
The settings sections SHALL:
- Use native HTML `<details>` and `<summary>` elements to support keyboard navigation (Enter/Space to expand/collapse).
- Display an animated chevron (`chev-d` stroke icon) indicating expanded/collapsed state.

### Requirement: Clinical Color Swatches
Movement and punctuation colors SHALL:
- Offer quick selection from the closed 8-color clinical palette (`pizarra`, `salvia`, `azul`, `violeta`, `ciruela`, `petroleo`, `ambar`, `rojo`).
- Display real-time preview tags using matched foreground and background contrast pairs.

### Requirement: Structured Row Actions
Each movement and punctuation row SHALL:
- Provide an accessible text input for the configuration label.
- Provide a color selector button showing the active swatch.
- Render the live preview tag.
- Provide a delete action button with appropriate confirmation or minimum-item restriction.
- Provide an "Agregar movimiento" / "Agregar puntuación" button with `plus` stroke icon.

### Requirement: Save Actions & Feedback
The settings footer SHALL:
- Render a primary button `Guardar cambios` styled with primary petroleum (`#2C5F6B`).
- Provide non-blocking status feedback for idle, saving (spinner), and saved (success check).
