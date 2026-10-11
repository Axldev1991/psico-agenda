# Design: UI Accessible Typography Scale

## Architectural Strategy
- Systematic replacement of all `text-[9px]`, `text-[10px]`, `text-[11px]` with `text-xs` (12px) or `text-sm` (14px).
- In compact pill containers, adjust padding from `py-0.2` to `py-0.5` or `px-2 py-0.5` with rounded-full geometry.
- In `RichTextEditor`, set initial state `fontSize` to `15` and floor to `12`.
- In `PatientModal` and `SessionModal`, upgrade micro-labels to `text-xs font-semibold` or `text-sm`.
- Ensure zero regression in test suite and layout stability.
