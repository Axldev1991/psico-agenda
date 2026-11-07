import { test, expect } from "@playwright/test";

test.describe("Clinical Features Toggles and Rich Text Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe ocultar y mostrar los elementos clínicos al alternar sus configuraciones", async ({ page }) => {
    const patientName = `Toggles Patient ${Date.now()}`;

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar un turno para que el paciente tenga una sesión activa en la ficha
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();
    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    const dateInput = page.locator("#modal-date");
    const currentValue = await dateInput.inputValue();
    if (!currentValue) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Ir a Configuración y deshabilitar los toggles
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.getByRole("tab", { name: "Movimientos y Puntuaciones" }).click();
    
    // Desactivar Movimientos
    const movementsSummary = page.locator("summary").filter({ hasText: "Movimientos de consulta" });
    const isMovementsOpen = await movementsSummary.evaluate((el) => el.parentElement?.hasAttribute("open"));
    if (!isMovementsOpen) {
      await movementsSummary.click();
    }
    await movementsSummary.getByRole("button", { name: "Desactivar" }).click();

    // Desactivar Puntuaciones
    const punctuationsSummary = page.locator("summary").filter({ hasText: "Puntuaciones (resaltados del editor)" });
    const isPunctuationsOpen = await punctuationsSummary.evaluate((el) => el.parentElement?.hasAttribute("open"));
    if (!isPunctuationsOpen) {
      await punctuationsSummary.click();
    }
    await punctuationsSummary.getByRole("button", { name: "Desactivar" }).click();

    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Guardado con éxito")).toBeVisible();

    // 4. Ir a la ficha del paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    
    // use exact match to locate row, and search it. Core clinical does exactly this
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();

    // Wait for the detail view to be fully loaded
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();

    // 5. Verificar que no se muestran los elementos de movimientos y puntuaciones
    await expect(page.getByText("Movimiento:", { exact: true })).not.toBeVisible();
    await expect(page.locator("div[title='Color de resaltado a elección']")).not.toBeVisible();
    await expect(page.getByRole("combobox").filter({ has: page.getByRole("option", { name: "Todos los movimientos" }) })).not.toBeVisible();

    // 6. Volver a Configuración y habilitarlos
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.getByRole("tab", { name: "Movimientos y Puntuaciones" }).click();

    await movementsSummary.getByRole("button", { name: "Activar" }).click();
    await punctuationsSummary.getByRole("button", { name: "Activar" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Guardado con éxito")).toBeVisible();

    // 7. Volver a la ficha y verificar que sí se muestran
    await page.getByRole("button", { name: "Fichero" }).click();
    
    const volverBtn = page.getByRole("button", { name: /Volver al fichero/i });
    if (!await volverBtn.isVisible()) {
      const patientRowAgain = page.getByRole("row", { name: new RegExp(patientName) });
      await expect(patientRowAgain).toBeVisible();
      await patientRowAgain.getByRole("button", { name: /Ficha/i }).click();
    }
    
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();

    // Expediente Continuo (Active Session Header)
    const timelineTab = page.getByRole("button", { name: "Expediente Continuo" });
    await timelineTab.click();
    
    await expect(page.getByText("Movimiento:", { exact: true })).toBeVisible();
    await expect(page.locator("div[title='Color de resaltado a elección']")).toBeVisible();
    await expect(page.getByRole("combobox").filter({ has: page.getByRole("option", { name: "Todos los movimientos" }) })).toBeVisible();
  });

  test("debe persistir el texto ingresado en el editor de evolución clínica", async ({ page }) => {
    const patientName = `RichText Patient ${Date.now()}`;
    const clinicalNote = `Nota clínica de prueba ${Date.now()}`;

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar un turno
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();
    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    const dateInput = page.locator("#modal-date");
    const currentValue = await dateInput.inputValue();
    if (!currentValue) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Ir a la ficha del paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();

    // Wait for the detail view to be fully loaded
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();

    // 4. Escribir en el RichTextEditor
    const editor = page.locator("div[contenteditable='true']").first();
    await editor.click();
    await editor.type(clinicalNote);
    
    // Disparar blur para guardar (o click afuera)
    await page.getByRole("heading", { level: 1, name: patientName }).click();

    // Pequeña espera para asegurar que IndexedDB guarde (el auto-save)
    await page.waitForTimeout(1000);

    // 5. Recargar la página
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 6. Volver a la ficha del paciente y verificar que la nota persista
    await page.getByRole("button", { name: "Fichero" }).click();
    const rowAfterReload = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(rowAfterReload).toBeVisible();
    await rowAfterReload.getByRole("button", { name: /Ficha/i }).click();

    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();

    const editorAfterReload = page.locator("div[contenteditable='true']").first();
    await expect(editorAfterReload).toContainText(clinicalNote);
  });
});
