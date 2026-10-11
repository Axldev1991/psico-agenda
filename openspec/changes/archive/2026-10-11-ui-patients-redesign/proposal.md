# Proposal: UI Patients View & Manager Redesign (Fase 4)

## Motivation
`PatientManager.tsx` and `PatientModal.tsx` currently rely on legacy tokens (`brand-sand`, `brand-indigo`, `brand-lavender`), emoji icons (📂, 📍, 📝, 🌱, ⏳, ✅, ❌), raw ID displays ("ID: patient-..."), and lack proper `data-sensitive` attributes on contact, insurance, and billing fields.

This change modernizes the patient directory into modular components respecting Single Responsibility Principle (SRP), DRY, and design guide `02`.

## Proposed Scope
1. **Status Tabs (`PatientStatusTabs.tsx`)**:
   - Tabs for "En tratamiento", "De alta", and "Todos" with live counters.
   - Accessible tablist keyboard navigation and ARIA attributes.
2. **List Header (`PatientListHeader.tsx`)**:
   - Title "Fichero de pacientes" (Newsreader serif 500) and natural subtitle (e.g., "12 pacientes en tratamiento").
   - Search input with stroke search icon.
   - Single "+ Nuevo paciente" primary action button (moving demo seed to developer tools).
3. **Responsive Patient Table (`PatientTable.tsx`)**:
   - Sentence-case headers in subtle gray (`text-ink-sub`).
   - Standardized typography and tabular figures for ARS fee.
   - Comprehensive `data-sensitive` markup on all personal info (name, age, phone, email, address, insurance, fee).
   - "Ver ficha" action button with document stroke icon (`file`).
   - Seamless responsive fallback to stacked cards on narrow viewports (< 768px).
4. **Empty State (`PatientEmptyState.tsx`)**:
   - Specific messages for empty search vs. empty database.
5. **Patient Modal (`PatientModal.tsx`)**:
   - Redesign with design tokens, field groups (basic info, clinical info / CECI), and clean accessibility.
