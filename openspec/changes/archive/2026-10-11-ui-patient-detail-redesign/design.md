# Design: UI Patient Clinical Detail Redesign (Fase 7)

## Architecture & Subcomponents
1. `src/ui/components/patient-detail/PatientDetailHeader.tsx`:
   - Back button, Newsreader serif patient title, age, arancel formatted in ARS with `data-sensitive`, edit and export actions.
2. `src/ui/components/patient-detail/PatientSearchFilters.tsx`:
   - Search bar with stroke `search` icon, faceted selects with design tokens.
3. `src/ui/components/patient-detail/PatientArchivedNotice.tsx`:
   - Calm warning tokens (`bg-warn-tint text-warn border-warn/30`).
4. `src/ui/components/ActiveSessionHeader.tsx`:
   - Session number, day and time display, clinical movement selector with `CLINICAL_TAG_PALETTE`.
5. `src/ui/components/SessionSidebar.tsx`:
   - Past session list with petroleum active states and clinical movement pills.
6. `src/ui/components/CeciForm.tsx`:
   - Form inputs with `border-line`, `text-ink`, and `bg-surface`.
7. `src/ui/components/RichTextEditor.tsx`:
   - Document-like container with subtle borders and accessible toolbar.
8. `src/ui/components/PatientHighlights.tsx`:
   - Highlights viewer styled with `CLINICAL_TAG_PALETTE`.
9. `src/ui/components/PatientDetail.tsx`:
   - Overall layout coordinator with accessible tabs.
