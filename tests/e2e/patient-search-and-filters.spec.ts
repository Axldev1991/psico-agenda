import { test, expect } from "@playwright/test";

test.describe("Patient Search and Clinical Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should filter patients in directory and sessions in clinical history", async ({ page }) => {
    const patientAName = `Patient A OSDE ${Date.now()}`;
    const patientBName = `Patient B Particular ${Date.now()}`;

    // 1. Create Patient A
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientAName);
    await page.locator("#p-insurance").fill("OSDE");
    
    // Select type as underage tag
    await page.getByRole("combobox", { name: /Grupo de atención/i }).selectOption("underage");
    
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Create Patient B
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientBName);
    await page.locator("#p-insurance").fill("Particular");
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Patient Directory Search
    // Search by Name (Patient A)
    const searchInput = page.getByPlaceholder("Buscar paciente...");
    await searchInput.fill(patientAName);
    
    // Assert Patient A is visible, Patient B is not
    await expect(page.getByRole("row", { name: new RegExp(patientAName) })).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(patientBName) })).not.toBeVisible();

    // Clear search, search by Insurance (OSDE)
    await searchInput.clear();
    await searchInput.fill("OSDE");
    
    // Assert Patient A is visible, Patient B is not
    await expect(page.getByRole("row", { name: new RegExp(patientAName) })).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(patientBName) })).not.toBeVisible();

    // 3. Clinical File Filters (Patient A)
    // Clear search and open Patient A's file
    await searchInput.clear();
    await page.getByRole("row", { name: new RegExp(patientAName) }).getByRole("button", { name: /Ficha/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: patientAName })).toBeVisible();

    // Create Session 1 (Control - indigo by default)
    await page.getByRole("button", { name: "Iniciar nueva evolución clínica" }).click();
    await expect(page.getByText("Sesión N°:")).toBeVisible();
    
    // Create a second session
    await page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: "Iniciar nueva sesión clínica" }).click();
    
    // Wait for the new session to be active (maybe check session number is 2)
    await expect(page.locator("text=Sesión N°: >> ../span[contains(@class, 'font-mono')]").nth(0)).toHaveText("2");
    
    // Change movement to 'Cognitivo'
    await page.getByRole("button", { name: "Cognitivo" }).click();
    
    // Filter by Movement 'Control'
    const movementSelect = page.getByRole("combobox").filter({ has: page.getByRole("option", { name: "Todos los movimientos" }) });
    await movementSelect.selectOption({ label: "Control" });
    
    // Assert only Session 1 (Control) is active or visible in sidebar
    await expect(page.locator("text=Sesión N°: >> ../span[contains(@class, 'font-mono')]").nth(0)).toHaveText("1");
    // Assert it is the only one in the sidebar
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 1/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 2/ })).not.toBeVisible();
    
    // Filter by Cognitivo
    await movementSelect.selectOption({ label: "Cognitivo" });
    await expect(page.locator("text=Sesión N°: >> ../span[contains(@class, 'font-mono')]").nth(0)).toHaveText("2");
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 1/ })).not.toBeVisible();
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 2/ })).toBeVisible();
    
    // Clear filter
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    
    // Assert both sessions in sidebar
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 1/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Índice de sesiones" }).getByRole("button", { name: /Sesión N° 2/ })).toBeVisible();
  });
});
