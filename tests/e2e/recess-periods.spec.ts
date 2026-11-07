import { test, expect } from "@playwright/test";
import { format, addDays } from "date-fns";

test.describe("Períodos de receso y vacaciones", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe permitir crear un receso, suspender turnos, persistir al recargar y restaurar al eliminar", async ({ page }) => {
    const patientName = `Paciente Receso Test ${Date.now()}`;
    const recessReason = "Congreso Anual";
    
    // Calcular fechas
    const today = new Date();
    const startDate = addDays(today, 1);
    const endDate = addDays(today, 3);
    const appointmentDate = addDays(today, 2);

    const formatForInput = (d: Date) => format(d, "dd/MM/yyyy");
    
    // 1. Crear un paciente rápido para el test
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Navegar a Configuración y luego a la pestaña de disponibilidad
    await page.getByRole("button", { name: "Configuración" }).click();
    
    // El sistema tiene "Disponibilidad y Turnos" tab (referencia de availability-settings.spec.ts)
    const availabilityTab = page.getByRole("tab", { name: /Disponibilidad y Turnos/i });
    if (await availabilityTab.isVisible()) {
        await availabilityTab.click();
    }

    // 3. Crear período de receso
    await page.getByRole("button", { name: /Nuevo período/i }).click();
    await page.locator("#absence-start-date").fill(formatForInput(startDate));
    await page.locator("#absence-end-date").fill(formatForInput(endDate));
    await page.locator("#absence-reason").fill(recessReason);
    await page.getByRole("button", { name: /Guardar período/i }).click();

    // 4. Guardar cambios y verificar
    const saveBtn = page.getByRole("button", { name: /Guardar ahora|Guardar disponibilidad/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(page.getByText("Guardado con éxito").or(page.getByText("Disponibilidad guardada"))).toBeVisible();

    // 5. Navegar a Agenda y crear turno durante el receso
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    
    await sessionModal.locator("#modal-patient").selectOption({ label: patientName });
    
    // Fill the date input
    const dateInput = sessionModal.locator("#modal-date");
    await dateInput.fill("");
    await dateInput.pressSequentially(formatForInput(appointmentDate));
    
    // Como es un receso, deberíamos ver la alerta
    await expect(sessionModal.getByText("Período de receso / vacaciones")).toBeVisible();
    await expect(sessionModal.getByText(recessReason)).toBeVisible();
    
    // Llenar hora si no hay píldoras
    const modalTime = sessionModal.locator("#modal-time");
    await modalTime.fill("14:00");
    
    // Forzar el modo excepción porque estamos agendando en un horario posiblemente fuera de disponibilidad
    const exceptionBtn = sessionModal.getByRole("button", { name: /Horario fuera de agenda/i });
    // try to wait a moment to see if it renders
    try {
        await expect(exceptionBtn).toBeVisible({ timeout: 1000 });
        await exceptionBtn.click();
    } catch (e) {
        // do nothing if exception mode isn't needed
    }
    
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(sessionModal).not.toBeVisible();

    // Go to the date of the appointment in the mini calendar
    const appDayString = appointmentDate.getDate().toString();
    const dateBtn = page.getByRole('button', { name: new RegExp(`^${appDayString}$`, 'i'), exact: true });
    
    try {
       await expect(dateBtn).toBeVisible({timeout: 1000});
       await dateBtn.click();
    } catch(e) {
        await page.getByRole('button', { name: 'Mes siguiente' }).click();
        await page.getByRole('button', { name: new RegExp(`^${appDayString}$`, 'i'), exact: true }).click();
    }

    // 6. Verificar que la tarjeta del turno renderiza con el estilo de suspendido y muestra el motivo
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
    
    // Verificar badge de receso
    await expect(appointmentCard.getByText(`🏖️ ${recessReason}`)).toBeVisible();
    
    // Verificar status "Suspendido por receso"
    const statusButton = appointmentCard.locator("button", { hasText: "Suspendido por receso" });
    await expect(statusButton).toBeDisabled();
    
    // 7. Recargar la página y verificar persistencia
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    
    try {
       await expect(dateBtn).toBeVisible({timeout: 1000});
       await dateBtn.click();
    } catch(e) {
        await page.getByRole('button', { name: 'Mes siguiente' }).click();
        await page.getByRole('button', { name: new RegExp(`^${appDayString}$`, 'i'), exact: true }).click();
    }
    
    const reloadedAppointmentCard = page.locator("article", { hasText: patientName });
    await expect(reloadedAppointmentCard).toBeVisible();
    await expect(reloadedAppointmentCard.getByText(`🏖️ ${recessReason}`)).toBeVisible();

    // 8. Volver a Configuración, eliminar el receso
    await page.getByRole("button", { name: "Configuración" }).click();
    if (await availabilityTab.isVisible()) {
        await availabilityTab.click();
    }
    
    const deleteBtn = page.getByRole("button", { name: `Eliminar período ${recessReason}` });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    
    const confirmDialogBtn = page.getByRole("button", { name: "Eliminar receso" });
    try {
       await expect(confirmDialogBtn).toBeVisible({timeout: 1000});
       await confirmDialogBtn.click();
    } catch (e) {
       // if no custom dialog, maybe standard js alert, but Playwright auto dismisses unless attached to event
    }
    
    await page.getByRole("button", { name: /Guardar ahora|Guardar disponibilidad/i }).click();
    await expect(page.getByText("Guardado con éxito").or(page.getByText("Disponibilidad guardada"))).toBeVisible();

    // 9. Volver a la Agenda y verificar que se limpió la suspensión
    await page.getByRole("button", { name: "Agenda" }).click();
    
    try {
       await expect(dateBtn).toBeVisible({timeout: 1000});
       await dateBtn.click();
    } catch(e) {
        await page.getByRole('button', { name: 'Mes siguiente' }).click();
        await page.getByRole('button', { name: new RegExp(`^${appDayString}$`, 'i'), exact: true }).click();
    }
    
    const restoredAppointmentCard = page.locator("article", { hasText: patientName });
    await expect(restoredAppointmentCard).toBeVisible();
    await expect(restoredAppointmentCard.getByText(`🏖️ ${recessReason}`)).not.toBeVisible();
    
    // El botón debería estar habilitado de nuevo y el estado debería ser "Agendado" (o el que tenía originalmente)
    const restoredStatusButton = restoredAppointmentCard.locator("button", { hasText: "Agendado" }).first();
    await expect(restoredStatusButton).toBeEnabled();
  });
});
