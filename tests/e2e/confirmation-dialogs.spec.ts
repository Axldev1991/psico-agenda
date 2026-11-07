import { test, expect } from "@playwright/test";

test.describe("Confirmation Dialogs", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should handle patient and appointment deletion confirmations", async ({ page }) => {
    const patientName = `Juan Perez ${Date.now()}`;

    // Navigate to Fichero tab
    await page.getByRole("button", { name: "Fichero" }).click();
    
    // Create a new patient first
    const newPatientBtn = page.getByRole("button", { name: /Nuevo paciente/i });
    await expect(newPatientBtn).toBeVisible();
    await newPatientBtn.click();

    // Fill patient name and save
    const modalDialog = page.getByRole("dialog");
    await expect(modalDialog).toBeVisible();
    
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: /Guardar/i }).click();
    
    // Wait for modal to close
    await expect(modalDialog).not.toBeVisible();

    // Verify patient is in the list
    await expect(page.getByText(patientName).first()).toBeVisible();

    // --- Create an Appointment for this patient ---
    // Navigate to Agenda
    await page.getByRole("button", { name: "Agenda" }).click();
    
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await expect(openSessionBtn).toBeVisible();
    await openSessionBtn.click();

    // Fill the programar turno modal
    const sessionModalDialog = page.getByRole("dialog");
    await expect(sessionModalDialog).toBeVisible();
    
    await sessionModalDialog.locator("#modal-patient").selectOption({ label: patientName });
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    const dateInput = sessionModalDialog.locator("#modal-date");
    await dateInput.fill(`${day}/${month}/${year}`);

    // Select or fill time
    const slotPill = sessionModalDialog.locator('button[type="button"]').filter({ hasText: /^\d\d:\d\d$/ }).first();
    if (await slotPill.isVisible({ timeout: 1000 }).catch(() => false)) {
      await slotPill.click();
    } else {
      const exceptionBtn = sessionModalDialog.getByRole("button", { name: /Horario fuera de agenda/i });
      if (await exceptionBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await exceptionBtn.click();
      }
      await sessionModalDialog.locator("#modal-time").fill("15:00");
    }

    // Submit the dialog button specifically
    const submitBtn = sessionModalDialog.locator('button[type="submit"]', { hasText: "Programar turno" });
    await submitBtn.click();
    await expect(sessionModalDialog).not.toBeVisible();

    // The appointment should be visible
    const appointmentCard = page.locator("article").filter({ hasText: patientName }).first();
    await expect(appointmentCard).toBeVisible();

    // --- Test Appointment Deletion ---
    const deleteAppointmentBtn = appointmentCard.getByTitle("Eliminar turno");
    await expect(deleteAppointmentBtn).toBeVisible();
    await deleteAppointmentBtn.click();

    // The confirmation dialog appears
    const appointmentConfirmModal = page.getByRole("dialog");
    await expect(appointmentConfirmModal).toBeVisible();
    await expect(page.getByText("¿Eliminar este turno?")).toBeVisible();

    // Verify Safe Focus: focus should be on Cancel button
    const appointmentCancelBtn = appointmentConfirmModal.getByRole("button", { name: "Cancelar" });
    await expect(appointmentCancelBtn).toBeFocused();

    // Verify Cancel preserves appointment
    await appointmentCancelBtn.click();
    await expect(appointmentConfirmModal).not.toBeVisible();
    await expect(appointmentCard).toBeVisible();

    // Verify Escape closes dialog
    await deleteAppointmentBtn.click();
    await expect(appointmentConfirmModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(appointmentConfirmModal).not.toBeVisible();
    await expect(appointmentCard).toBeVisible();

    // Verify confirmation deletes appointment
    await deleteAppointmentBtn.click();
    await expect(appointmentConfirmModal).toBeVisible();
    await appointmentConfirmModal.getByRole("button", { name: "Eliminar turno" }).click();
    await expect(appointmentConfirmModal).not.toBeVisible();
    
    // Appointment should be deleted
    await expect(appointmentCard).not.toBeVisible();

    // --- Test Patient Deletion ---
    // Navigate back to Fichero tab
    await page.getByRole("button", { name: "Fichero" }).click();

    // Find the row for this patient
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();

    // Find the delete button for this patient.
    const deletePatientBtn = patientRow.getByTitle("Eliminar paciente");
    await deletePatientBtn.click({ force: true });

    // Modal should appear
    const patientConfirmModal = page.getByRole("dialog");
    await expect(patientConfirmModal).toBeVisible();
    await expect(page.getByText(/¿Eliminar a/i)).toBeVisible();

    // Verify Safe Focus
    const patientCancelBtn = patientConfirmModal.getByRole("button", { name: "Cancelar" });
    await expect(patientCancelBtn).toBeFocused();

    // Verify Cancel preserves patient
    await patientCancelBtn.click();
    await expect(patientConfirmModal).not.toBeVisible();
    await expect(patientRow).toBeVisible();

    // Verify Escape closes dialog
    await deletePatientBtn.click({ force: true });
    await expect(patientConfirmModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(patientConfirmModal).not.toBeVisible();
    await expect(patientRow).toBeVisible();

    // Verify confirmation deletes patient
    await deletePatientBtn.click({ force: true });
    await expect(patientConfirmModal).toBeVisible();
    await patientConfirmModal.getByRole("button", { name: "Eliminar paciente" }).click();
    await expect(patientConfirmModal).not.toBeVisible();
    
    // Patient should be deleted
    await expect(patientRow).not.toBeVisible();
  });
});
