import { test, expect } from "@playwright/test";

test.describe("Confirmation Dialogs", () => {
  const patientName = "Juan Perez";

  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should handle patient and appointment deletion confirmations", async ({ page }) => {
    // Navigate to Fichero tab
    await page.getByRole("button", { name: "Fichero" }).click();
    
    // Create a new patient first
    const newPatientBtn = page.getByRole("button", { name: /Nuevo paciente/i });
    await expect(newPatientBtn).toBeVisible();
    await newPatientBtn.click();

    // Fill patient name and save
    const modalDialog = page.getByRole("dialog");
    await expect(modalDialog).toBeVisible();
    
    await page.getByLabel(/Nombre completo/i).fill(patientName);
    await page.getByRole("button", { name: "Guardar" }).click();
    
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
    
    // Select patient from select dropdown
    const patientSelect = page.getByRole('combobox').first();
    // Use selectOption by grabbing the option value, but since label is provided, it should work.
    // However, if the label doesn't match perfectly, value might be needed. Let's select by value using evaluate or just click.
    // Given the previous error: the modal did NOT close. Why? Probably because the selectOption didn't work or date is invalid.
    await patientSelect.selectOption({ label: patientName });
    
    // Date input: DD/MM/AAAA
    // Since we filled with YYYY-MM-DD, it might not have worked depending on the input type. The input is date type probably.
    // Oh wait, in the error dump: 
    // - textbox "Fecha del turno *": 20/26/1106
    // So fill(new Date().toISOString().split("T")[0]) filled "20/26/1106". This is because the input handles formatted typing.
    const dateInput = page.locator("#modal-date");
    // Just click it and use the default value, or format explicitly if needed.
    // Wait, the default value is probably empty.
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    // For date inputs, sometimes you need to fill in YYYY-MM-DD for native input date. But if it's text, it's DD/MM/AAAA.
    // Let's clear it and type.
    await dateInput.fill("");
    await dateInput.type(`${day}${month}${year}`);

    // Wait a bit or click outside
    await page.locator('body').click();

    // Submit the dialog button specifically
    const submitBtn = sessionModalDialog.locator('button[type="submit"]', { hasText: "Programar turno" });
    await submitBtn.click();
    await expect(sessionModalDialog).not.toBeVisible();

    // The appointment should be visible
    await expect(page.getByText(patientName).first()).toBeVisible();

    // --- Test Appointment Deletion ---
    // Click the delete/trash icon on a non-recurrent appointment
    const deleteAppointmentBtn = page.getByTitle("Eliminar turno").first();
    await expect(deleteAppointmentBtn).toBeVisible();
    await deleteAppointmentBtn.click();

    // The confirmation dialog might be the ONLY dialog open now
    const appointmentConfirmModal = page.getByRole("dialog");
    await expect(appointmentConfirmModal).toBeVisible();
    await expect(page.getByText("¿Eliminar este turno?")).toBeVisible();

    // Verify Safe Focus: focus should be on Cancel button
    const appointmentCancelBtn = appointmentConfirmModal.getByRole("button", { name: "Cancelar" });
    await expect(appointmentCancelBtn).toBeFocused();

    // Verify Cancel preserves appointment
    await appointmentCancelBtn.click();
    await expect(appointmentConfirmModal).not.toBeVisible();
    await expect(page.getByText(patientName).first()).toBeVisible();

    // Verify Escape closes dialog
    await deleteAppointmentBtn.click();
    await expect(appointmentConfirmModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(appointmentConfirmModal).not.toBeVisible();
    await expect(page.getByText(patientName).first()).toBeVisible();

    // Verify confirmation deletes appointment
    await deleteAppointmentBtn.click();
    await expect(appointmentConfirmModal).toBeVisible();
    await appointmentConfirmModal.getByRole("button", { name: "Eliminar turno" }).click();
    await expect(appointmentConfirmModal).not.toBeVisible();
    
    // Appointment should be deleted
    await expect(page.getByTitle("Eliminar turno")).not.toBeVisible();

    // --- Test Patient Deletion ---
    // Navigate back to Fichero tab
    await page.getByRole("button", { name: "Fichero" }).click();

    // Find the delete button for this patient.
    const deletePatientBtn = page.getByTitle("Eliminar paciente").first();
    await deletePatientBtn.click();

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
    await expect(page.getByText(patientName).first()).toBeVisible();

    // Verify Escape closes dialog
    await deletePatientBtn.click();
    await expect(patientConfirmModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(patientConfirmModal).not.toBeVisible();
    await expect(page.getByText(patientName).first()).toBeVisible();

    // Verify confirmation deletes patient
    await deletePatientBtn.click();
    await expect(patientConfirmModal).toBeVisible();
    await patientConfirmModal.getByRole("button", { name: "Eliminar paciente" }).click();
    await expect(patientConfirmModal).not.toBeVisible();
    
    // Patient should be deleted
    await expect(page.getByText(patientName).first()).not.toBeVisible();
  });
});
