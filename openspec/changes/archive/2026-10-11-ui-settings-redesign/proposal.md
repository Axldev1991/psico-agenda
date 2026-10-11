# Proposal: UI Settings & Clinical Tools Redesign (Fase 5)

## Motivation
`SettingsPanel.tsx` uses legacy tokens (`brand-sand`, `brand-indigo`), freeform unconstrained `<input type="color">` selectors that can produce illegible tags without contrast, manual toggle state instead of accessible native disclosure elements, and lacks stroke iconography.

This change refactors the settings screen into accessible, tokenized components adhering to `docs/psico-agenda-guia-de-diseno-02.html`, incorporating the closed clinical color palette (`CLINICAL_TAG_PALETTE`).

## Proposed Scope
1. **Clinical Palette Swatch Selector (`ClinicalPalettePicker.tsx`)**:
   - Provide direct selection from the 8 official clinical tag pairs (pizarra, salvia, azul, violeta, ciruela, petroleo, ambar, rojo).
   - Guarantee contrast ratio compliance.
2. **Accessible Native Accordions (`<details>`)**:
   - Use native `<details className="group ...">` and `<summary>` elements with stroke chevron indicator.
3. **Refactored Settings Panel (`SettingsPanel.tsx`)**:
   - Modernized header in Newsreader serif.
   - Clean rows for movements and punctation highlights with real-time preview tag.
   - Primary petroleum button for saving changes with status feedback.
