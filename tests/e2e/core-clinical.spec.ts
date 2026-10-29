import { test, expect } from "@playwright/test";

test.describe("Fase 1: Core Clínico y Ciclo de Turnos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe permitir crear un paciente, ver su detalle y editar sus datos con persistencia", async ({
    page,
  }) => {
    const patientName = `Paciente Test ${Date.now()}`;
    const initialPhone = "+54 11 4433 2211";
    const updatedPhone = "+54 11 9988 7766";

    // 1. Navegar al Fichero
    await page.getByRole("button", { name: "Fichero" }).click();

    // 2. Abrir modal y registrar paciente
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.locator("#p-name").fill(patientName);
    await page.locator("#p-phone").fill(initialPhone);
    await page.getByRole("button", { name: "Guardar paciente" }).click();

    // 3. Verificar que el modal cierre y el paciente aparezca en la lista
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();

    // 4. Entrar al detalle del paciente haciendo clic en su botón Ficha
    await patientRow.getByRole("button", { name: /Ficha/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: patientName })).toBeVisible();
    await expect(page.getByText(initialPhone)).toBeVisible();

    // 5. Editar datos del paciente
    await page.getByRole("button", { name: "Editar ficha" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator("#p-phone").fill(updatedPhone);
    await page.getByRole("button", { name: /Guardar cambios|Guardar paciente/i }).click();

    // 6. Verificar actualización en el detalle
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(updatedPhone)).toBeVisible();

    // 7. Volver al listado
    await page.getByRole("button", { name: "Volver al fichero de pacientes" }).click();
    await expect(page.getByText(patientName).first()).toBeVisible();
  });

  test("debe permitir agendar un turno y transicionar estados (Agendado -> Atendido -> Ausente -> Cancelado)", async ({
    page,
  }) => {
    const patientName = `Turno Paciente ${Date.now()}`;

    // 1. Crear el paciente previo
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Ir a la Agenda y abrir modal de turno
    await page.getByRole("button", { name: "Agenda" }).click();
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await openSessionBtn.click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // 3. Seleccionar el paciente y asegurar fecha válida
    await page.locator("#modal-patient").selectOption({ label: patientName });

    // Completar fecha con formato DD/MM/AAAA si está vacío
    const dateInput = page.locator("#modal-date");
    const currentValue = await dateInput.inputValue();
    if (!currentValue) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    // 4. Guardar turno
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();

    // 5. Verificar toast de confirmación y cierre del modal
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 6. Localizar la tarjeta del turno en la agenda
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
    const statusBadge = appointmentCard.locator("span", { hasText: /^Agendado$/ }).first();
    await expect(statusBadge).toBeVisible();

    // 7. Transición a "Atendido"
    const statusSelect = appointmentCard.getByLabel("Cambiar estado del turno");
    await statusSelect.selectOption("completed");
    await expect(appointmentCard.locator("span", { hasText: /^Atendido$/ }).first()).toBeVisible();

    // 8. Transición a "Ausente"
    await statusSelect.selectOption("missed");
    await expect(appointmentCard.locator("span", { hasText: /^Ausente$/ }).first()).toBeVisible();

    // 9. Transición a "Cancelado"
    await statusSelect.selectOption("cancelled");
    await expect(appointmentCard.locator("span", { hasText: /^Cancelado$/ }).first()).toBeVisible();
  });
});
