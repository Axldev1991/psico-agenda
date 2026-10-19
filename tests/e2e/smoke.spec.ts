import { test, expect } from "@playwright/test";

test.describe("Psico-Agenda Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto("/");
    // Wait for the app to hydrate
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe cargar la aplicación y mostrar el encabezado de navegación", async ({ page }) => {
    await expect(page).toHaveTitle(/Psico-Agenda/i);
    // Verify primary navigation is rendered
    await expect(page.getByRole("button", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fichero" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Configuración" })).toBeVisible();
  });

  test("debe navegar al fichero de pacientes y abrir el modal de paciente", async ({ page }) => {
    // Navigate to Fichero tab
    await page.getByRole("button", { name: "Fichero" }).click();
    
    // Check that we are in patients view
    const newPatientBtn = page.getByRole("button", { name: /Nuevo paciente/i });
    await expect(newPatientBtn).toBeVisible();

    // Open Patient modal
    await newPatientBtn.click();
    const modalDialog = page.getByRole("dialog");
    await expect(modalDialog).toBeVisible();

    // Close the modal
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(modalDialog).not.toBeVisible();
  });

  test("debe abrir el modal de programar turno con campo de fecha DD/MM/AAAA", async ({ page }) => {
    // Click on "Programar turno" (target the main header action)
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await expect(openSessionBtn).toBeVisible();
    await openSessionBtn.click();

    // Verify modal is displayed
    const modalDialog = page.getByRole("dialog");
    await expect(modalDialog).toBeVisible();
    await expect(page.getByText("Programar turno o sesión")).toBeVisible();

    // Verify DateInput has placeholder DD/MM/AAAA
    const dateInput = page.locator("#modal-date");
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toHaveAttribute("placeholder", "DD/MM/AAAA");

    // Close modal
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(modalDialog).not.toBeVisible();
  });
});
