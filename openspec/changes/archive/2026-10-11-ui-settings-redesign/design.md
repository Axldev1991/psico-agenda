# Design: UI Settings & Clinical Tools Redesign (Fase 5)

## Architecture & Decomposition
1. `src/ui/components/settings/ClinicalColorPicker.tsx`:
   - Interactive popover / swatch group displaying the 8 clinical colors from `CLINICAL_TAG_PALETTE` in `clinical-tags.ts`.
2. `src/ui/components/settings/MovementRow.tsx`:
   - Single row with label input, color picker, live preview tag, and delete button.
3. `src/ui/components/SettingsPanel.tsx`:
   - Layout coordinator using `<details class="group ...">` accordions for "Movimientos de consulta" and "Puntuaciones (resaltados del editor)".
   - Primary `Guardar cambios` button with animated feedback.
