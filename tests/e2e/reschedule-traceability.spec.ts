import { test, expect } from "@playwright/test";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

test.describe("Reschedule Traceability and Badges", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe permitir reagendar un turno eventualmente y verificar trazabilidad", async ({ page }) => {
    // 1. Create a patient
    const patientName = `Paciente Reschedule ${Date.now()}`;
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Schedule an appointment for today so it appears in current view
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();
    
    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();
    await page.locator("#modal-patient").selectOption({ label: patientName });
    
    // Choose today at 10:00 AM
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;
    await page.locator("#modal-date").fill(todayStr);
    
    await page.locator("#modal-time").fill("10:00");
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Open Reschedule Modal from today's appointment card
    const appointmentCard = page.locator("article", { hasText: patientName }).first();
    await expect(appointmentCard).toBeVisible();
    await appointmentCard.getByRole("button", { name: /reagendar/i }).click();

    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();

    // 4. Fill target date (2 days ahead, next week) and select an available slot
    const targetDate = addDays(new Date(), 2);
    const ddt = String(targetDate.getDate()).padStart(2, "0");
    const mmt = String(targetDate.getMonth() + 1).padStart(2, "0");
    const yyyyt = targetDate.getFullYear();
    const targetDateStr = `${ddt}/${mmt}/${yyyyt}`;
    
    await rescheduleModal.locator("#reschedule-date").fill(targetDateStr);
    
    // Select 11:00 AM available slot
    const availableSlot = rescheduleModal.getByRole("button", { name: "11:00" });
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();

    // Confirm reschedule
    await rescheduleModal.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect(page.getByText("¡Turno reagendado correctamente!")).toBeVisible();
    await expect(rescheduleModal).not.toBeVisible();

    // Re-locate the original card on today's view (it should have status Reagendado and destination badge)
    const originalCard = page.locator("article", { hasText: patientName }).first();
    const statusBadge = originalCard.locator("span", { hasText: /^Reagendado$/ }).first();
    await expect(statusBadge).toBeVisible();
    
    const destinationBadge = originalCard.locator("span", { hasText: /^Para el/ }).first();
    await expect(destinationBadge).toContainText(`Para el ${ddt}/${mmt} 11:00 hs`);

    // Navigate to next week and select the target day
    await page.getByRole("button", { name: "Semana siguiente" }).click();
    await page
      .getByRole("group", { name: "Días de la semana" })
      .getByRole("button", { name: new RegExp(String(targetDate.getDate())) })
      .click();

    const newCard = page.locator("article", { hasText: patientName }).first();
    await expect(newCard).toBeVisible();
    await expect(newCard.getByRole("button", { name: "Agendado" })).toBeVisible();
    
    const originBadge = newCard.locator("span", { hasText: /^Reprogramado/ }).first();
    await expect(originBadge).toContainText(`Reprogramado (era ${dd}/${mm} 10:00 hs)`);

    // 5. Ir al Fichero del paciente y verificar que NO aparece la sesión fantasma reagendada sin notas
    await page.getByRole("button", { name: "Fichero" }).click();
    const patientRow = page.getByRole("row", { name: new RegExp(patientName) });
    await expect(patientRow).toBeVisible();
    await patientRow.getByRole("button", { name: /Ficha/i }).click();

    // En el índice de sesiones lateral, debe haber una única sesión (la activa/reagendada), numerada como Sesión N° 1
    const sessionNav = page.getByRole("navigation", { name: "Índice de sesiones" });
    await expect(sessionNav).toBeVisible();

    const sessionButtons = sessionNav.locator("button").filter({ hasText: /Sesión N°/i });
    await expect(sessionButtons).toHaveCount(1);
    await expect(sessionButtons.first()).toContainText("Sesión N° 1");
    await expect(sessionButtons.first()).toContainText("11:00 hs");

    // No debe existir ninguna sesión con badge de estado 'Reagendado' en el índice
    await expect(sessionNav.getByText("Reagendado", { exact: true })).not.toBeVisible();
  });
});
