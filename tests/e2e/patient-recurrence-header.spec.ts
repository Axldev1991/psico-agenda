import { test, expect } from "@playwright/test";

test.describe("Visualización de Turno Fijo / Recurrencia en Ficha Clínica", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe mostrar el turno fijo programado en la ficha de Axel Pasado y Axel Futuro, y neutral en paciente nuevo", async ({
    page,
  }) => {
    // 1. Ir a Fichero
    await page.getByRole("button", { name: "Fichero" }).click();

    // 2. Abrir ficha de Axel Pasado
    const axelPasadoRow = page.getByRole("row", { name: /Axel Pasado/i });
    await expect(axelPasadoRow).toBeVisible();
    await axelPasadoRow.getByRole("button", { name: /Ficha/i }).click();

    // Validar encabezado de Axel Pasado
    await expect(page.getByRole("heading", { level: 1, name: /Axel Pasado/i })).toBeVisible();

    const bannerPasado = page.getByTestId("patient-recurrence-banner");
    await expect(bannerPasado).toBeVisible();
    await expect(bannerPasado.getByText("Turno Fijo Programado")).toBeVisible();
    await expect(bannerPasado.getByText(/10:00 hs/i)).toBeVisible();
    await expect(bannerPasado.getByText(/Semanal · Presencial/i)).toBeVisible();
    await expect(bannerPasado.getByTestId("patient-recurrence-start-date")).toBeVisible();

    // 3. Volver al Fichero y abrir ficha de Axel Futuro
    await page.getByRole("button", { name: "Volver al fichero de pacientes" }).click();
    const axelFuturoRow = page.getByRole("row", { name: /Axel Futuro/i });
    await expect(axelFuturoRow).toBeVisible();
    await axelFuturoRow.getByRole("button", { name: /Ficha/i }).click();

    // Validar encabezado de Axel Futuro
    await expect(page.getByRole("heading", { level: 1, name: /Axel Futuro/i })).toBeVisible();

    const bannerFuturo = page.getByTestId("patient-recurrence-banner");
    await expect(bannerFuturo).toBeVisible();
    await expect(bannerFuturo.getByText("Turno Fijo Programado")).toBeVisible();
    await expect(bannerFuturo.getByText(/16:00 hs/i)).toBeVisible();
    await expect(bannerFuturo.getByText(/Semanal · Virtual/i)).toBeVisible();

    // 4. Crear un nuevo paciente sin turno fijo y verificar estado neutral
    await page.getByRole("button", { name: "Volver al fichero de pacientes" }).click();
    const uniqueName = `Paciente Sin Recurrencia ${Date.now()}`;
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(uniqueName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const newPatientRow = page.getByRole("row", { name: new RegExp(uniqueName) });
    await expect(newPatientRow).toBeVisible();
    await newPatientRow.getByRole("button", { name: /Ficha/i }).click();

    const bannerNuevo = page.getByTestId("patient-recurrence-banner");
    await expect(bannerNuevo).toBeVisible();
    await expect(bannerNuevo.getByText("Sin turno fijo programado")).toBeVisible();
  });
});
