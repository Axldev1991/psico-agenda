import { test, expect } from "@playwright/test";

test.describe("Fase 3: Privacidad, Resiliencia y Accesibilidad Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe alternar el modo de privacidad ocultando y revelando datos sensibles", async ({
    page,
  }) => {
    // 1. Ubicar el botón de alternancia de privacidad
    const privacyBtn = page.getByRole("button", { name: "Ocultar datos" });
    await expect(privacyBtn).toBeVisible();
    await expect(privacyBtn).toHaveAttribute("aria-pressed", "false");

    const mainContainer = page.locator("main");
    await expect(mainContainer).not.toHaveClass(/blur-md/);

    // 2. Activar modo privacidad
    await privacyBtn.click();
    await expect(privacyBtn).toHaveAttribute("aria-pressed", "true");
    await expect(mainContainer).toHaveClass(/blur-md/);

    // 3. Desactivar modo privacidad para restaurar visibilidad
    await privacyBtn.click();
    await expect(privacyBtn).toHaveAttribute("aria-pressed", "false");
    await expect(mainContainer).not.toHaveClass(/blur-md/);
  });

  test("debe cerrar los modales al presionar la tecla Escape", async ({ page }) => {
    // 1. Probar modal de Nuevo Paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();

    const patientDialog = page.getByRole("dialog");
    await expect(patientDialog).toBeVisible();

    // Presionar Escape
    await page.keyboard.press("Escape");
    await expect(patientDialog).not.toBeVisible();

    // 2. Probar modal de Programar Turno
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: /Programar turno/i }).first().click();

    const sessionDialog = page.getByRole("dialog");
    await expect(sessionDialog).toBeVisible();

    // Presionar Escape
    await page.keyboard.press("Escape");
    await expect(sessionDialog).not.toBeVisible();
  });

  test("debe permitir navegar al expediente clínico unificado y alternar pestañas de evolución y anotaciones extras", async ({
    page,
  }) => {
    const patientName = `Historial Paciente ${Date.now()}`;

    // 1. Crear paciente para acceder a su ficha clínica
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();

    const row = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Ficha/i }).click();

    // 2. Verificar vista de Expediente Clínico Unificado
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();
    await expect(page.getByText("Expediente Clínico Unificado")).toBeVisible();

    // 3. Pestaña Expediente Continuo está activa por defecto
    const timelineTab = page.getByRole("button", { name: "Expediente Continuo" });
    const extraNotesTab = page.getByRole("button", { name: "Anotaciones Extras" });
    await expect(timelineTab).toBeVisible();
    await expect(extraNotesTab).toBeVisible();

    // 4. Alternar a Anotaciones Extras
    await extraNotesTab.click();
    await expect(page.getByText("Anotaciones Clínicas Extras")).toBeVisible();

    // 5. Volver a Expediente Continuo
    await timelineTab.click();
    await expect(page.getByText("Expediente Clínico Unificado")).toBeVisible();
  });

  test("debe operar sin conexión (offline) persistiendo datos en IndexedDB (E2E-13)", async ({
    page,
    context,
  }) => {
    const patientName = `Paciente Offline ${Date.now()}`;

    // 1. Simular corte completo de red
    await context.setOffline(true);

    // 2. Dar de alta paciente en modo offline
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();

    const patientDialog = page.getByRole("dialog");
    await expect(patientDialog).toBeVisible();

    await page.locator("#p-name").fill(patientName);
    await page.locator("#p-phone").fill("+54 11 0000 9999");
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(patientDialog).not.toBeVisible();

    // 3. Verificar que el paciente aparece en la lista local de IndexedDB
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();

    // 4. Programar un turno en modo offline
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: /Programar turno/i }).first().click();

    const sessionDialog = page.getByRole("dialog");
    await expect(sessionDialog).toBeVisible();

    await page.locator("#modal-patient").selectOption({ label: patientName });
    await page.locator("#modal-time").fill("14:00");

    const dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    await sessionDialog.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionDialog).not.toBeVisible();

    // 5. Verificar que la tarjeta aparece en la grilla
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();

    // 6. Restaurar red y asegurar consistencia
    await context.setOffline(false);
  });
});

