import { test, expect } from "@playwright/test";

test.describe("Purga de Pacientes Modelo y Persistencia de Puntuaciones Clínicas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("verifica que los pacientes de prueba no existen en el fichero y que las modificaciones de puntuación persisten tras reload", async ({
    page,
  }) => {
    // 1. Validar que la clínica arranca sin pacientes de prueba artificiales
    await page.getByRole("button", { name: "Fichero" }).click();
    await expect(page.getByRole("row", { name: /Axel Pasado \(Modelo\)/i })).not.toBeVisible();
    await expect(page.getByRole("row", { name: /Axel Futuro \(Modelo\)/i })).not.toBeVisible();

    // 2. Navegar a Configuración > Movimientos y Puntuaciones
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.getByRole("tab", { name: "Movimientos y Puntuaciones" }).click();

    // 3. Abrir la sección de Puntuaciones
    const punctuationsSummary = page.locator("summary").filter({ hasText: "Puntuaciones (resaltados del editor)" });
    const isPunctuationsOpen = await punctuationsSummary.evaluate((el) => el.parentElement?.hasAttribute("open"));
    if (!isPunctuationsOpen) {
      await punctuationsSummary.click();
    }

    // 4. Modificar el nombre de una de las puntuaciones
    const uniquePunctuationName = `Seguimiento Terapeuta ${Date.now()}`;
    const punctuationInput = page.locator("details[open] input[type='text']").first();
    await expect(punctuationInput).toBeVisible();
    await punctuationInput.fill(uniquePunctuationName);

    // 5. Guardar cambios y validar confirmación visual
    const saveButton = page.getByRole("button", { name: /Guardar cambios/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page.getByText("Guardado con éxito")).toBeVisible();

    // 6. Recargar la página para certificar persistencia offline en IndexedDB
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 7. Volver a Configuración > Movimientos y Puntuaciones
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.getByRole("tab", { name: "Movimientos y Puntuaciones" }).click();

    const punctuationsSummaryReloaded = page.locator("summary").filter({ hasText: "Puntuaciones (resaltados del editor)" });
    const isReloadedOpen = await punctuationsSummaryReloaded.evaluate((el) => el.parentElement?.hasAttribute("open"));
    if (!isReloadedOpen) {
      await punctuationsSummaryReloaded.click();
    }

    // 8. Verificar que el cambio realizado se mantuvo intacto
    const punctuationInputReloaded = page.locator("details[open] input[type='text']").first();
    await expect(punctuationInputReloaded).toHaveValue(uniquePunctuationName);
  });
});

