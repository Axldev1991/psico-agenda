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

  test("debe permitir navegar al expediente clínico unificado y alternar pestañas de evolución y CECI", async ({
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
    const ceciTab = page.getByRole("button", { name: "Ficha CECI" });
    await expect(timelineTab).toBeVisible();
    await expect(ceciTab).toBeVisible();

    // 4. Alternar a Ficha CECI
    await ceciTab.click();
    await expect(page.getByText("Ficha del paciente (CECI)")).toBeVisible();
    await expect(page.locator("#ceci-convive")).toBeVisible();

    // 5. Volver a Expediente Continuo
    await timelineTab.click();
    await expect(page.getByText("Expediente Clínico Unificado")).toBeVisible();
  });
});
