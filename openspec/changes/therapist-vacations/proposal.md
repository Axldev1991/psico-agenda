# Proposal: Therapist Vacation & Absence Periods Management

## Problem
Therapists currently have no native way to declare vacation periods, medical leaves, or conference absences. As a consequence:
1. The calendar continues projecting recurring appointments during vacations, cluttering the agenda.
2. The slot calculator (`findAvailableSlots`) falsely considers vacation days available for booking.
3. Monthly projected revenue erroneously includes sessions that will not be held.
4. Therapists lack a clear visual indicator of which recurring patients are affected by their planned absence.

## Solution
Introduce a first-class **Vacation & Recess Periods** mechanism:
1. **Settings Configuration:** In the Settings panel (Availability tab), therapists can add, edit, and delete date ranges (`startDate`, `endDate`, `reason`).
2. **Calendar Visibility:** Columns falling within recess periods are shaded with a distinct clinical theme tint, displaying an absence badge in the day header.
3. **Recurring Appointments Treatment:** Recurring sessions falling into vacation periods are displayed as visually suspended (struck-through with a "Suspendido por receso" tag).
4. **Billing Projection:** Suspended vacation sessions are excluded from projected monthly revenue calculations.
5. **Booking Safeguards:** `findAvailableSlots` returns 0 available slots for vacation dates; `SessionModal` displays an alert if a manual exception is forced.
