# UI Patient Clinical Detail Specification

## Purpose
Specifies layout, typography, accessibility, and visual interactions for the Patient Clinical Detail view (header, session history, word-like editor, CECI record, and highlights) following `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Detail Header & Privacy Shielding
The patient detail header SHALL:
- Provide an accessible back button to return to the patient directory (`chev-l` icon).
- Display the patient full name in Newsreader serif 500 tagged with `data-sensitive`.
- Display patient group badge (`Infanto-juvenil` or `Adulto`) and age.
- Render session arancel in Argentine pesos with tabular numbers and `data-sensitive`.
- Provide primary actions with stroke iconography: "Editar ficha" and "Exportar Word".
- Tag phone, email, address, and insurance with `data-sensitive`.

### Requirement: Clinical Navigation Tabs
The main clinical workspace SHALL:
- Provide tabs for "Expediente continuo" (icon `file`) and "Ficha CECI" (icon `folder`).
- Apply active state petroleum styling (`#2C5F6B`) and `aria-selected` attributes.

### Requirement: Active Session Controls
When a session is active:
- The header SHALL display session ordinal number, date in natural Spanish, and time.
- The session movement SHALL use colors from `CLINICAL_TAG_PALETTE`.
- Changes to notes and description SHALL be synced to IndexedDB automatically.

### Requirement: Rich Text Editor & Toolbar
The session notes editor SHALL:
- Render within a clean document-like surface with standard margins and `Public Sans` font.
- Provide a clean formatting toolbar with stroke icons for bold, italic, underline, and clinical voice dictation.
