# UI Accessible Typography Scale Specification

## Requirements

### Requirement: Minimum Text Floor (12px / `text-xs`)
No user-facing text in the application SHALL be smaller than 12px (`0.75rem` / `text-xs`).
- All metadata tags, pills, counters, and status badges SHALL use at least `text-xs` (12px).
- Badges and small text SHALL have sufficient font weight (`font-medium` or `font-semibold`) to guarantee legibility.

### Requirement: Form Labels & Inputs Scale (14px / `text-sm`)
Form input fields and field labels SHALL:
- Use at least `text-sm` (14px).
- Maintain sufficient touch targets (min 36-40px).

### Requirement: Clinical Editor Readability
The `RichTextEditor` clinical note view SHALL:
- Default to at least 15px base font size for comfortable reading.
- Minimum allowable zoomed-out size SHALL be 12px.
- Toolbar indicator and controls SHALL use legible sizes (12px minimum).
