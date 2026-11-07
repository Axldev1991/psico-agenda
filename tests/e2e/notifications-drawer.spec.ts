import { test, expect } from "@playwright/test";

test.describe("Notificaciones y Recordatorios Clínicos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe mostrar notificación de sesión reprogramada en el panel de avisos y permitir su descarte individual y masivo", async ({
    page,
  }) => {
    const patientName = `Paciente Notif ${Date.now()}`;
    const patientName2 = `Paciente Notif2 ${Date.now()}`;

    // 1. Crear el primer paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    
    // Crear el segundo paciente
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName2);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Ir a la Agenda y programar primer turno
    await page.getByRole("button", { name: "Agenda" }).click();
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await openSessionBtn.click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // Seleccionar el primer paciente
    await page.locator("#modal-patient").selectOption({ label: patientName });

    // Completar fecha con formato DD/MM/AAAA para hoy
    const dateInput = page.locator("#modal-date");
    const currentValue = await dateInput.inputValue();
    if (!currentValue) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    // Completar horario
    await page.locator("#modal-time").fill("14:00");

    // Guardar turno
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // Localizar la tarjeta del turno en la agenda
    const appointmentCard = page.locator("article", { hasText: patientName }).first();
    await expect(appointmentCard).toBeVisible();
    
    // Cambiar estado del turno a "Reagendado" (rescheduled)
    const statusSelect = appointmentCard.getByLabel("Cambiar estado del turno");
    await statusSelect.selectOption("rescheduled");
    await expect(appointmentCard.locator("span", { hasText: /^Reagendado$/ }).first()).toBeVisible();

    // 3. Verificar panel de notificaciones
    // Localizar el botón de Avisos en el sidebar
    const avisosButton = page.getByRole("button", { name: /Avisos/i });
    await expect(avisosButton.locator("span").last()).not.toBeEmpty();

    await avisosButton.click();

    // El drawer de notificaciones debería abrirse
    const notificationsDrawer = page.getByRole("dialog", { name: "Panel de avisos y recordatorios" });
    await expect(notificationsDrawer).toBeVisible();

    // Verificar que aparece la notificación de "Sesión reprogramada"
    const notifItem = notificationsDrawer.locator("div").filter({ hasText: "Sesión reprogramada" }).filter({ hasText: patientName }).last();
    await expect(notifItem).toBeVisible();
    // No time is displayed in this notification message directly, remove this assertion.

    // 4. Descartar la notificación individualmente
    const dismissBtn = notifItem.getByRole("button", { name: "Descartar" }); 
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();
    
    // Verificar que la notificación ya no está
    await expect(notifItem).not.toBeVisible();
    
    // Verificar que el count decrece
    await expect(avisosButton.locator("span").last()).toHaveText("1");

    // Cerrar panel
    await notificationsDrawer.getByRole("button", { name: "Cerrar panel (Esc)" }).click();
    await expect(notificationsDrawer).not.toBeVisible();

    // Wait for any previous toast to be hidden
    await expect(page.locator('[role="status"]')).not.toBeVisible();

    // Wait slightly so any states settle
    await page.waitForTimeout(500);

    // Programar segundo turno para hoy para generar otra notificación
    await openSessionBtn.click();
    await expect(sessionModal).toBeVisible();
    
    // Seleccionamos la opcion por el paciente
    await page.locator("#modal-patient").selectOption({ label: patientName2 });
    
    // Asegurarse de re-llenar la fecha
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    await page.locator("#modal-date").fill(`${dd}/${mm}/${yyyy}`);
    
    await page.locator("#modal-time").fill("16:00");
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    
    // Wait for the success toast and modal close
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();
    
    // Marcar como reprogramado otra vez para otra notif
    const newAppointmentCard = page.locator("article", { hasText: patientName2 }).first();
    await expect(newAppointmentCard).toBeVisible();
    const newStatusSelect = newAppointmentCard.getByLabel("Cambiar estado del turno");
    await newStatusSelect.selectOption("rescheduled");
    await expect(newAppointmentCard.locator("span", { hasText: /^Reagendado$/ }).first()).toBeVisible();

    // Reabrir avisos
    await avisosButton.click();
    await expect(notificationsDrawer).toBeVisible();

    // Descartar todas
    const dismissAllBtn = notificationsDrawer.getByRole("button", { name: "Descartar todas" });
    await expect(dismissAllBtn).toBeVisible();
    await dismissAllBtn.click();

    // Verificar estado vacío
    await expect(notificationsDrawer.getByText("Sin avisos pendientes")).toBeVisible();

    // 5. Persistencia después de reload
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    
    const reloadedAvisosBtn = page.getByRole("button", { name: /Avisos/i });
    await reloadedAvisosBtn.click();
    const reloadedDrawer = page.getByRole("dialog", { name: "Panel de avisos y recordatorios" });
    await expect(reloadedDrawer.getByText("Sin avisos pendientes")).toBeVisible();
  });
});
