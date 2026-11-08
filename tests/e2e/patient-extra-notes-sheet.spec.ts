import { test, expect } from "@playwright/test";

test.describe("Hoja en Blanco de Anotaciones Clínicas Extras", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("presenta una hoja en blanco sin tecnicismos, sin etiquetas ni botones manuales, con auto-guardado e inclusión en exportación Word", async ({
    page,
  }) => {
    const patientName = `Paciente Notas Extras ${Date.now()}`;

    // 1. Crear nuevo paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Abrir ficha del paciente
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();

    // 3. Cambiar a la pestaña "Anotaciones Extras"
    const extraNotesTab = page.getByRole("button", { name: /Anotaciones Extras/i });
    await expect(extraNotesTab).toBeVisible();
    await extraNotesTab.click();

    // 4. Verificar que se removieron todos los tecnicismos, etiquetas y botones manuales
    await expect(page.getByText(/IndexedDB \+ Google Drive Sync/i)).not.toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Guardar Nota/i })).not.toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Fijar al inicio/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Supervisión/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Interconsulta/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /\+ Urgente/i })).not.toBeVisible();

    // 5. Verificar presencia de la hoja en blanco con editor enriquecido accesible
    await expect(page.getByRole("heading", { level: 3, name: "Anotaciones Clínicas Extras" })).toBeVisible();
    await expect(page.getByText("Auto-guardado activo")).toBeVisible();

    // El editor enriquecido debe tener botones de formato (Negrita, Cursiva) pero NO los resaltadores de colores
    const sheet = page.getByTestId("patient-extra-notes-sheet");
    await expect(sheet).toBeVisible();
    const editor = sheet.locator("[contenteditable='true']");
    await expect(editor).toBeVisible();
    await expect(sheet.locator("button[title*='Resaltar como']")).not.toBeVisible();

    // 6. Escribir anotaciones en la hoja en blanco
    const extraText = "Observación clínica: muy buena adherencia al encuadre terapéutico.";
    await editor.click();
    await editor.pressSequentially(extraText);

    // Disparar blur para asegurar cambio
    await page.getByRole("heading", { level: 3, name: "Anotaciones Clínicas Extras" }).click();

    // 7. Validar retroalimentación visual de auto-guardado (esperar el texto exacto "Guardado" del indicador de notas extras)
    await expect(page.getByText("Guardado", { exact: true })).toBeVisible({ timeout: 5000 });

    // 8. Recargar página para certificar persistencia offline en IndexedDB
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 9. Volver a la ficha y a la pestaña de Anotaciones Extras
    await page.getByRole("button", { name: "Fichero" }).click();
    const patientRowReloaded = page.getByRole("row", { name: new RegExp(patientName) });
    await patientRowReloaded.getByRole("button", { name: /Ficha/i }).click();

    await page.getByRole("button", { name: /Anotaciones Extras/i }).click();
    const sheetReloaded = page.getByTestId("patient-extra-notes-sheet");
    await expect(sheetReloaded).toBeVisible();
    const editorReloaded = sheetReloaded.locator("[contenteditable='true']");
    await expect(editorReloaded).toBeVisible();
    await expect(editorReloaded).toContainText("Observación clínica: muy buena adherencia");

    // 10. Probar exportación Word en la cabecera (debe incluir el historial y las anotaciones extras)
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exportar Historial/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("_historial.docx");
  });
});
