import { test, expect } from "@playwright/test";

test.describe("Visualización de Turno Fijo / Recurrencia en Ficha Clínica", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe purgar modelos de prueba y mostrar el banner reactivo al programar recurrencia", async ({
    page,
  }) => {
    // 1. Ir a Fichero
    await page.getByRole("button", { name: "Fichero" }).click();

    // 2. Verificar que los pacientes modelo de prueba NO existen en la clínica
    await expect(page.getByRole("row", { name: /Axel Pasado \(Modelo\)/i })).not.toBeVisible();
    await expect(page.getByRole("row", { name: /Axel Futuro \(Modelo\)/i })).not.toBeVisible();

    // 3. Crear un nuevo paciente sin turno fijo y verificar estado neutral en su ficha
    const uniqueName = `Paciente Clínico ${Date.now()}`;
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(uniqueName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const newPatientRow = page.getByRole("row", { name: new RegExp(uniqueName) });
    await expect(newPatientRow).toBeVisible();
    await newPatientRow.getByRole("button", { name: /Ficha/i }).click();

    const bannerNeutral = page.getByTestId("patient-recurrence-banner");
    await expect(bannerNeutral).toBeVisible();
    await expect(bannerNeutral.getByText("Sin turno fijo programado")).toBeVisible();

    // 4. Ir a la Agenda y programar un turno recurrente semanal para este paciente
    await page.getByRole("button", { name: "Agenda" }).click();
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await openSessionBtn.click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: uniqueName });

    const recurrentCheckbox = sessionModal.getByRole("checkbox");
    await recurrentCheckbox.check();
    await expect(recurrentCheckbox).toBeChecked();

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

    // 5. Volver a la ficha del paciente y verificar que el banner reactivo muestra el turno fijo
    await page.getByRole("button", { name: "Fichero" }).click();

    const bannerScheduled = page.getByTestId("patient-recurrence-banner");
    const isBannerVisible = await bannerScheduled.isVisible().catch(() => false);
    if (!isBannerVisible) {
      const patientRow = page.getByRole("row", { name: new RegExp(uniqueName) });
      await patientRow.getByRole("button", { name: /Ficha/i }).click();
    }

    await expect(bannerScheduled).toBeVisible();
    await expect(bannerScheduled.getByText("Turno Fijo Programado", { exact: true })).toBeVisible();
    await expect(bannerScheduled.getByTestId("patient-recurrence-summary")).not.toHaveText("Sin turno fijo programado");
    await expect(bannerScheduled.getByTestId("patient-recurrence-summary")).toContainText("Semanal");
    await expect(bannerScheduled.getByTestId("patient-recurrence-start-date")).toBeVisible();
    await expect(bannerScheduled.getByTestId("patient-recurrence-start-date")).toBeVisible();
  });
});
