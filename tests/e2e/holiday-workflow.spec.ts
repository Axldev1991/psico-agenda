import { test, expect } from "@playwright/test";

test.describe("Holiday Workflow and Biweekly Rescheduling", () => {
  test.beforeEach(async ({ page }) => {
    // Congelar reloj a una fecha fija para que el test nunca sea frágil ante el paso del tiempo
    await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe permitir alternar Atender y No atender en feriados con confirmación y verificar menú contextual sin 'Tomar feriado'", async ({ page }) => {
    const patientName = `Paciente Feriado ${Date.now()}`;

    // 1. Crear paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar un turno para el feriado del 23 de Noviembre de 2026 (Día de la Soberanía Nacional)
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    await page.locator("#modal-date").fill("23/11/2026");
    await page.locator("#modal-time").fill("10:00");
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Navegar a la semana del 23 de Noviembre (semana siguiente)
    await page.getByRole("button", { name: "Semana siguiente" }).click();
    const mondayTab = page.getByRole("button", { name: /lun 23/i });
    if (await mondayTab.isVisible()) {
      await mondayTab.click();
    }

    // 4. Localizar la tarjeta del turno en ese día
    const card = page.locator("article", { hasText: patientName }).first();
    await expect(card).toBeVisible();

    // 4. Verificar cabecera del día indica feriado pero la tarjeta no repite el badge redundante
    await expect(page.getByText(/Día de la Soberanía Nacional/i).first()).toBeVisible();
    await expect(card.getByText("Presencial · 50 min")).toBeVisible();

    // 5. En feriado por defecto el estado es [No atender]
    const noAtenderBtn = card.getByRole("button", { name: "No atender" });
    await expect(noAtenderBtn).toBeVisible();
    await noAtenderBtn.click();

    // 6. Confirmar en el modal de confirmación para pasar a atender
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText("¿Atender en feriado?")).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Atender feriado" }).click();
    await expect(confirmDialog).not.toBeVisible();

    // 7. El botón ahora indica que el turno se atiende: [✓ Atender]
    const atenderBtn = card.getByRole("button", { name: "Atender" });
    await expect(atenderBtn).toBeVisible();

    // 8. Clickear [✓ Atender] y desmarcar con confirmación
    await atenderBtn.click();
    const unmarkDialog = page.getByRole("dialog");
    await expect(unmarkDialog).toBeVisible();
    await expect(unmarkDialog.getByText("¿Desmarcar atención en feriado?")).toBeVisible();
    await unmarkDialog.getByRole("button", { name: "No atender" }).click();
    await expect(unmarkDialog).not.toBeVisible();

    // El botón vuelve a indicar [No atender]
    await expect(card.getByRole("button", { name: "No atender" })).toBeVisible();

    // 9. Verificar menú contextual de 3 puntos
    const moreActionsBtn = card.getByRole("button", { name: "Más acciones" });
    await expect(moreActionsBtn).toBeVisible();
    await moreActionsBtn.click();

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Reagendar" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Eliminar turno" })).toBeVisible();

    // Verificar explícitamente que "Tomar feriado" NO está en el menú
    await expect(menu.getByRole("menuitem", { name: /tomar feriado/i })).not.toBeVisible();

    // Cerrar menú abriendo Reagendar
    await menu.getByRole("menuitem", { name: "Reagendar" }).click();
    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();
    await expect(rescheduleModal.getByText("Reagendar turno")).toBeVisible();
    await rescheduleModal.getByRole("button", { name: "Cancelar" }).click();
    await expect(rescheduleModal).not.toBeVisible();
  });

  test("debe detectar frecuencia quincenal en RescheduleModal y ofrecer atajo de salto a 14 días", async ({ page }) => {
    const patientName = `Paciente Quincenal ${Date.now()}`;

    // 1. Crear paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Programar turno con recurrencia quincenal
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    await page.locator("#modal-date").fill("23/11/2026");
    await page.locator("#modal-time").fill("11:00");

    // Activar recurrencia y elegir Quincenal
    const recurrenceCheckbox = sessionModal.getByRole("checkbox");
    await recurrenceCheckbox.check();
    await sessionModal.getByRole("button", { name: "Quincenal" }).click();

    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Navegar a la semana del 23 de Noviembre (semana siguiente)
    await page.getByRole("button", { name: "Semana siguiente" }).click();
    const mondayTab = page.getByRole("button", { name: /lun 23/i });
    if (await mondayTab.isVisible()) {
      await mondayTab.click();
    }

    // 4. Abrir Reagendar desde el menú de 3 puntos
    const card = page.locator("article", { hasText: patientName }).first();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Más acciones" }).click();
    await page.getByRole("menuitem", { name: "Reagendar" }).click();

    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();

    // 4. Verificar banner de sugerencia quincenal
    await expect(rescheduleModal.getByText("Frecuencia quincenal detectada")).toBeVisible();
    const jumpBtn = rescheduleModal.getByRole("button", { name: /Saltar a la siguiente quincena/i });
    await expect(jumpBtn).toBeVisible();

    // 5. Clickear atajo de salto quincenal (+14 días: 23/11 -> 07/12)
    await jumpBtn.click();

    // La fecha en el input debe haber avanzado 14 días
    const dateInput = rescheduleModal.locator("#reschedule-date");
    await expect(dateInput).toHaveValue("07/12/2026");

    await rescheduleModal.getByRole("button", { name: "Cancelar" }).click();
    await expect(rescheduleModal).not.toBeVisible();
  });
});
