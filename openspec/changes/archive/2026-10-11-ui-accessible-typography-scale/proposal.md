# Proposal: UI Accessible Typography Scale

## Problem Statement
Several UI components across Psico-Agenda currently utilize micro-typography (`text-[9px]`, `text-[10px]`, `text-[11px]`) and an undersized default clinical editor font size (`13px`). For users with visual impairments, glasses, astigmatism, or high-DPI displays, these microscopic sizes cause eye strain, reduced readability, and fail WCAG 2.1 AAA readability criteria.

## Proposed Changes
1. **12px Floor Rule (`text-xs`):** Eliminate all sub-12px classes (`9px`, `10px`, `11px`). All badges, pills, counters, and metadata tags must be at least `12px` (`text-xs`) with medium or semibold weights (`font-medium`, `font-semibold`).
2. **Body & Input Scale (`text-sm`):** Subtitles, table body cells, form labels, and inputs must use `text-sm` (14px) with comfortable leading.
3. **Clinical Editor Default Base:** Upgrade `RichTextEditor` default font size from 13px to 15px (zoom steps 12px to 28px).
4. **Preserve Layout Harmony:** Adjust pill and badge paddings (`px-2 py-0.5`) to prevent clipping or layout breakage.
