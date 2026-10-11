# Proposal: UI Patient Clinical Detail Redesign (Fase 7)

## Motivation
`PatientDetail.tsx` and its supporting components (`PatientDetailHeader`, `PatientSearchFilters`, `PatientArchivedNotice`, `ActiveSessionHeader`, `CeciForm`, `SessionSidebar`, `RichTextEditor`, and `PatientHighlights`) represent the comprehensive clinical workbench where therapists review records, transcribe notes, and manage session details.

Currently, this workbench still uses legacy design tokens (`brand-sand`, `brand-indigo`, `brand-lavender`), loose emojis (✏️, 📄, 📖, 📋, 🔍, 🎙️, ←), unformatted arancel strings, and lacks `data-sensitive` blur integration across header personal information.

This change migrates the clinical detail workspace to official design tokens, Newsreader/Public Sans typography, stroke iconography, and complete privacy shielding.

## Proposed Scope
1. **Patient Detail Header (`PatientDetailHeader.tsx`)**:
   - Modernized back button (`Icon name="chev-l"`).
   - Patient name in Newsreader serif 500 with `data-sensitive` protection.
   - Status badge and age indicator.
   - Session fee formatted in Argentine pesos with tabular figures and `data-sensitive`.
   - Actions with stroke icons: "Editar ficha" (`file`), "Exportar Word" (`download`).
2. **Clinical Filters & Badges (`PatientSearchFilters.tsx`, `PatientArchivedNotice.tsx`)**:
   - Search input with stroke search icon.
   - Filter dropdowns styled with design tokens.
   - Archived patient banner with calm warning tokens (`warn-tint`, `warn`).
3. **Session Workbench (`ActiveSessionHeader.tsx`, `SessionSidebar.tsx`)**:
   - Clean petroleum highlight for the active session.
   - Session description and clinical tag selection utilizing `CLINICAL_TAG_PALETTE`.
   - Sidebar list of past sessions with date, time, and clinical movement badges.
4. **Editor & CECI Form (`RichTextEditor.tsx`, `CeciForm.tsx`)**:
   - Text editing toolbar with minimal clean buttons and voice dictation indicator.
   - CECI clinical form inputs tokenized with `border-line`, `text-ink`, and `bg-surface`.
5. **Patient Highlights (`PatientHighlights.tsx`)**:
   - Color-coded text highlights synchronized with punctuation configs and `CLINICAL_TAG_PALETTE`.
6. **Main Composition (`PatientDetail.tsx`)**:
   - Accessible tabs for "Expediente continuo" and "Ficha CECI" with stroke icons.
