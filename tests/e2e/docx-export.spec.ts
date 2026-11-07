import { test, expect } from "@playwright/test";
import fs from "fs";

test.describe("Word/DOCX clinical history file export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe exportar el historial clinico a un archivo word y descargar la sesion individual", async ({ page }) => {
    const patientName = `Word Export Patient ${Date.now()}`;

    // 1. Crear un paciente y agendar un turno con notas
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

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

    // 2. Navegar a la ficha del paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();

    // Wait for history to load
    await page.waitForTimeout(500);

    // Escribir algo en el editor para que haya contenido
    const editor = page.locator("div[contenteditable='true']").first();
    if (await editor.isVisible()) {
        await editor.click();
        await editor.type("Notas de prueba para exportación a DOCX");
        await page.getByRole("heading", { level: 1, name: patientName }).click();
        await page.waitForTimeout(1000);
    }

    // 3 & 4 & 5. Listen for download and click Exportar historial
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar historial" }).click();
    const download = await downloadPromise;

    // Assert download initiates and suggested filename ends with .doc
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.doc$/);

    // Assert non-zero size
    const downloadPath = await download.path();
    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);
    }

    // 6. Verify individual session export button from a specific session card also triggers a valid Word file download.
    const sessionDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar sesión" }).click();
    const sessionDownload = await sessionDownloadPromise;

    // Assert download initiates and suggested filename ends with .doc
    const sessionSuggestedFilename = sessionDownload.suggestedFilename();
    expect(sessionSuggestedFilename).toMatch(/\.doc$/);
    const sessionDownloadPath = await sessionDownload.path();
    if (sessionDownloadPath) {
      const stats = fs.statSync(sessionDownloadPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });
});
