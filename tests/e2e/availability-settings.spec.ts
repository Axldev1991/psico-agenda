import { test, expect } from "@playwright/test";

test.describe("Fase 4: Configuración de Disponibilidad y Duración de Sesión", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("permite configurar la duración de las sesiones y guardar disponibilidad", async ({ page }) => {
    // 1. Navegar a Configuración
    await page.getByRole("button", { name: "Configuración" }).click();

    // 2. Verificar que la pestaña "Disponibilidad y Turnos" está presente y activa
    const availabilityTab = page.getByRole("tab", { name: /Disponibilidad y Turnos/i });
    await expect(availabilityTab).toBeVisible();
    await expect(availabilityTab).toHaveAttribute("aria-selected", "true");

    // 3. Cambiar duración de sesión a 45 min
    const durationBtn45 = page.getByRole("button", { name: "45 min" });
    await expect(durationBtn45).toBeVisible();
    await durationBtn45.click();
    await expect(durationBtn45).toHaveClass(/bg-primary/);

    // 4. Verificar que los días están presentes (Lunes a Domingo)
    await expect(page.getByText("Lunes")).toBeVisible();
    await expect(page.getByText("Viernes")).toBeVisible();

    // 5. Guardar disponibilidad
    const saveBtn = page.getByRole("button", { name: /Guardar disponibilidad/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 6. Verificar mensaje de confirmación
    await expect(page.getByText("Disponibilidad guardada")).toBeVisible();
  });

  test("permite alternar a la pestaña de Movimientos y Puntuaciones", async ({ page }) => {
    await page.getByRole("button", { name: "Configuración" }).click();

    const categoriesTab = page.getByRole("tab", { name: /Movimientos y Puntuaciones/i });
    await expect(categoriesTab).toBeVisible();
    await categoriesTab.click();
    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

    // Verificar secciones de movimientos y puntuaciones
    await expect(page.getByText("Movimientos de consulta")).toBeVisible();
    await expect(page.getByText("Puntuaciones (resaltados del editor)")).toBeVisible();
  });

  test("permite seleccionar turnos disponibles mediante píldoras y alternar modo excepción en SessionModal", async ({ page }) => {
    // 1. Crear un paciente rápido para el test
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill("Paciente Disponibilidad Test");
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Abrir modal de programar turno desde Agenda
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // 3. Seleccionar el paciente
    await page.locator("#modal-patient").selectOption({ label: "Paciente Disponibilidad Test" });

    // 4. Ingresar una fecha de lunes (ej. 16/11/2026)
    const dateInput = page.locator("#modal-date");
    await dateInput.fill("16/11/2026");

    // 5. Verificar que aparecen las píldoras de horarios disponibles
    const pill09 = sessionModal.getByRole("button", { name: "09:00", exact: true });
    await expect(pill09).toBeVisible();

    // 6. Hacer clic en una píldora diferente (ej. 14:00)
    const pill14 = sessionModal.getByRole("button", { name: "14:00", exact: true });
    if (await pill14.isVisible()) {
      await pill14.click();
      await expect(sessionModal.locator("#modal-time")).toHaveValue("14:00");
    }

    // 7. Alternar modo excepción
    const exceptionBtn = sessionModal.getByRole("button", { name: /Horario fuera de agenda/i });
    await expect(exceptionBtn).toBeVisible();
    await exceptionBtn.click();

    // 8. Verificar que estamos en modo excepción
    await expect(sessionModal.getByText(/Modo excepción/i)).toBeVisible();
    await expect(sessionModal.getByRole("button", { name: /Ver horarios disponibles/i })).toBeVisible();

    // 9. Volver a horarios disponibles
    await sessionModal.getByRole("button", { name: /Ver horarios disponibles/i }).click();
    await expect(pill09).toBeVisible();

    // 10. Cerrar modal
    await sessionModal.getByRole("button", { name: "Cancelar" }).click();
    await expect(sessionModal).not.toBeVisible();
  });

  test("permite configurar un período de receso/vacaciones y alerta en SessionModal", async ({ page }) => {
    // 1. Navegar a Configuración
    await page.getByRole("button", { name: "Configuración" }).click();

    // 2. Verificar sección de Períodos de receso y vacaciones
    await expect(page.getByText("Períodos de receso y vacaciones")).toBeVisible();

    // 3. Abrir formulario de nuevo período
    const newPeriodBtn = page.getByRole("button", { name: /Nuevo período/i });
    await expect(newPeriodBtn).toBeVisible();
    await newPeriodBtn.click();

    // 4. Llenar fechas y motivo (ej. 20/11/2026 al 25/11/2026, "Congreso Anual")
    const startDateInput = page.locator("#absence-start-date");
    const endDateInput = page.locator("#absence-end-date");
    const reasonInput = page.locator("#absence-reason");

    await startDateInput.fill("20/11/2026");
    await endDateInput.fill("25/11/2026");
    await reasonInput.fill("Congreso Anual");

    // 5. Guardar período
    await page.getByRole("button", { name: /Guardar período/i }).click();

    // 6. Verificar que aparece en la lista
    await expect(page.getByText("Congreso Anual")).toBeVisible();

    // 6b. Persistir disponibilidad
    await page.getByRole("button", { name: /Guardar disponibilidad/i }).click();
    await expect(page.getByText("Disponibilidad guardada")).toBeVisible();

    // 7. Ir a Agenda y abrir SessionModal
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // 8. Ingresar una fecha dentro del período de receso (22/11/2026)
    const modalDate = sessionModal.locator("#modal-date");
    await modalDate.fill("22/11/2026");

    // 9. Verificar que aparece el banner de alerta de receso
    await expect(sessionModal.getByText("Período de receso / vacaciones")).toBeVisible();
    await expect(sessionModal.getByText(/Congreso Anual/i)).toBeVisible();

    // 10. Cerrar modal y limpiar el período creado en Configuración
    await sessionModal.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("button", { name: "Configuración" }).click();

    const deleteBtn = page.getByRole("button", { name: /Eliminar período/i }).first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await expect(page.getByText("Congreso Anual")).not.toBeVisible();
    await page.getByRole("button", { name: /Guardar disponibilidad/i }).click();
  });
});

