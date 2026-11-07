import { test, expect } from "@playwright/test";

test.describe("Facturación y Cobros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe permitir gestionar el cobro de un turno desde la agenda y reflejarse en la ficha clínica", async ({
    page,
  }) => {
    const patientName = `Paciente Pagos ${Date.now()}`;
    const sessionPrice = "15000";

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.locator("#p-fee").fill(sessionPrice);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar un turno
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    
    // Completar fecha
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

    // 3. Localizar la tarjeta en la agenda y verificar estado inicial "Sin cobrar"
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
    
    // Identificar el botón del popover por su title (ya que contiene el texto "Sin cobrar" y un tooltip)
    const paymentBadge = appointmentCard.locator("button", { hasText: "Sin cobrar" });
    await expect(paymentBadge).toBeVisible();

    // 4. Cambiar a "Cobrado · Transferencia"
    await paymentBadge.click();
    // Esperar a que se abra el menú (buscamos por role="menu")
    const paymentMenu = page.getByRole("menu", { name: "Opciones de cobro" });
    await expect(paymentMenu).toBeVisible();
    await paymentMenu.getByRole("menuitem", { name: /Transferencia/i }).click();

    // Verificar actualización del badge
    const paidTransferBadge = appointmentCard.locator("button", { hasText: "Cobrado · Transferencia" });
    await expect(paidTransferBadge).toBeVisible();

    // 5. Cambiar a "Sin cargo"
    await paidTransferBadge.click();
    await expect(paymentMenu).toBeVisible();
    await paymentMenu.getByRole("menuitem", { name: /Sin cargo/i }).click();
    
    // Verificar actualización del badge
    const waivedBadge = appointmentCard.locator("button", { hasText: "Sin cargo" });
    await expect(waivedBadge).toBeVisible();

    // 6. Cambiar de nuevo a "Cobrado · Efectivo"
    await waivedBadge.click();
    await expect(paymentMenu).toBeVisible();
    await paymentMenu.getByRole("menuitem", { name: /Efectivo/i }).click();

    // Verificar actualización del badge
    const paidCashBadge = appointmentCard.locator("button", { hasText: "Cobrado · Efectivo" });
    await expect(paidCashBadge).toBeVisible();

    // 7. Navegar a la ficha clínica
    await appointmentCard.getByRole("button", { name: "Ficha" }).click();
    
    // El header de la ficha debe cargar y mostrar el expediente
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();
    
    // En la cabecera de la sesión activa, verificar que el badge muestra "Cobrado · Efectivo"
    // Buscamos el contenedor del expediente continuo
    const sessionEditorArea = page.locator(".view-transition").filter({ hasText: "Expediente Clínico Unificado" });
    const detailPaymentBadge = sessionEditorArea.locator("button", { hasText: "Cobrado · Efectivo" });
    await expect(detailPaymentBadge).toBeVisible();

    // 8. Recargar la página y verificar persistencia en la ficha clínica
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    
    // En Next.js si recargamos la ficha clínica puede que perdamos el estado del paciente.
    // Navegamos devuelta a Fichero -> Ficha
    await page.getByRole("button", { name: "Fichero" }).click();
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();

    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();
    const reloadedDetailPaymentBadge = page.locator(".view-transition").filter({ hasText: "Expediente Clínico Unificado" }).locator("button", { hasText: "Cobrado · Efectivo" });
    await expect(reloadedDetailPaymentBadge).toBeVisible();

    // 9. Volver a la agenda y verificar persistencia
    await page.getByRole("button", { name: "Agenda" }).click();
    const persistedAppointmentCard = page.locator("article", { hasText: patientName });
    await expect(persistedAppointmentCard).toBeVisible();
    const persistedPaidCashBadge = persistedAppointmentCard.locator("button", { hasText: "Cobrado · Efectivo" });
    await expect(persistedPaidCashBadge).toBeVisible();
  });
});
