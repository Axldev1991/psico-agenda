# UI Accessible Typography Scale Specification

## Requirements

### Requirement: Minimum Text Floor (12px / `text-xs`)
No user-facing text in the application SHALL be smaller than 12px (`0.75rem` / `text-xs`).
- All metadata tags, pills, counters, and status badges SHALL use at least `text-xs` (14px effective accessible scale).
- Badges and small text SHALL have sufficient font weight (`font-medium` or `font-semibold`) to guarantee legibility.

### Requirement: Standard Reading Baseline (16px / `text-sm` / `text-base`)
The general baseline for application readability SHALL be at least 16px (`1rem`).
- Subtitles, table rows, form inputs, navigation links, and primary buttons SHALL use at least 16px.

### Requirement: Clinical Editor Readability
The `RichTextEditor` clinical note view SHALL:
- Default to 16px base font size for comfortable reading.
- Allow zoom controls ranging from 14px to 32px.
- Toolbar indicator and controls SHALL use legible sizes (14px minimum).
