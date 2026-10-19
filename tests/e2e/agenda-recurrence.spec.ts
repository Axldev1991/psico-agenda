import { test, expect } from "@playwright/test";

test.describe("Fase 2: Robustez de Agenda, Recurrencias y Reagendamiento", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("debe programar un turno recurrente semanal y verificar su proyección en semanas siguientes", async ({
    page,
  }) => {
    const patientName = `Paciente Recurrente ${Date.now()}`;

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Ir a la Agenda y abrir modal de sesión
    await page.getByRole("button", { name: "Agenda" }).click();
    const openSessionBtn = page.getByRole("button", { name: "Programar turno" }).first();
    await openSessionBtn.click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // 3. Seleccionar paciente
    await page.locator("#modal-patient").selectOption({ label: patientName });

    // 4. Activar turno recurrente semanal
    const recurrentCheckbox = sessionModal.getByRole("checkbox");
    await recurrentCheckbox.check();
    await expect(recurrentCheckbox).toBeChecked();

    // Validar que la cadencia semanal esté activa por defecto
    await expect(sessionModal.getByRole("button", { name: "Semanal" })).toBeVisible();

    // Asegurar fecha y hora
    const dateInput = page.locator("#modal-date");
    const currentValue = await dateInput.inputValue();
    if (!currentValue) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    // Guardar
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 5. Verificar turno en la semana actual con icono de recurrencia
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
    await expect(appointmentCard.locator("span[title='Se repite semanalmente']")).toBeVisible();

    // 6. Navegar a la semana siguiente y corroborar que el turno recurrente se proyecta
    await page.getByRole("button", { name: "Semana siguiente" }).click();
    await expect(page.locator("article", { hasText: patientName })).toBeVisible();

    // Regresar a hoy
    await page.getByRole("button", { name: "Hoy" }).click();
    await expect(appointmentCard).toBeVisible();
  });

  test("debe reagendar un turno de manera eventual hacia otro horario disponible sin desarmar la serie", async ({
    page,
  }) => {
    const patientName = `Paciente Reagenda ${Date.now()}`;

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar turno a las 09:00
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await page.locator("#modal-patient").selectOption({ label: patientName });
    await page.locator("#modal-time").fill("09:00");

    const dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();

    // 3. Abrir modal de reagendamiento desde la tarjeta
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
    await appointmentCard.getByRole("button", { name: "Reagendar" }).click();

    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();
    await expect(rescheduleModal.getByText("Reagendar turno")).toBeVisible();

    // 4. Verificar modo "Disponible" y alcance "Solo esta vez"
    await expect(rescheduleModal.getByRole("button", { name: /Disponible/i })).toBeVisible();
    const eventualRadio = rescheduleModal.getByRole("radio", { name: /Solo esta vez/i });
    await eventualRadio.check();
    await expect(eventualRadio).toBeChecked();

    // 5. Seleccionar un slot disponible diferente (ej. 14:00 o el primer botón de horario libre)
    const availableSlotBtns = rescheduleModal.locator("button", { hasText: /^\d{2}:\d{2}$/ });
    const count = await availableSlotBtns.count();
    expect(count).toBeGreaterThan(0);
    const chosenSlotBtn = availableSlotBtns.nth(count > 1 ? 1 : 0);
    const newTime = await chosenSlotBtn.innerText();
    await chosenSlotBtn.click();

    // 6. Confirmar cambio
    await rescheduleModal.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect(page.getByText("¡Turno reagendado correctamente!")).toBeVisible();
    await expect(rescheduleModal).not.toBeVisible();

    // 7. Verificar que el horario cambió en la tarjeta
    await expect(appointmentCard.getByText(newTime.trim())).toBeVisible();
  });

  test("debe permitir enrocar turnos (swap) entre dos pacientes agendados", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const patientA = `Paciente Alpha ${timestamp}`;
    const patientB = `Paciente Beta ${timestamp}`;

    // 1. Crear ambos pacientes
    await page.getByRole("button", { name: "Fichero" }).click();

    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientA);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientB);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Agendar a Alpha a las 10:00
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();
    let modal = page.getByRole("dialog");
    await page.locator("#modal-patient").selectOption({ label: patientA });
    await page.locator("#modal-time").fill("10:00");
    let dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      await dateInput.fill(
        `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
      );
    }
    await modal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();

    // 3. Agendar a Beta a las 11:00
    await page.getByRole("button", { name: "Programar turno" }).first().click();
    modal = page.getByRole("dialog");
    await page.locator("#modal-patient").selectOption({ label: patientB });
    await page.locator("#modal-time").fill("11:00");
    dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      await dateInput.fill(
        `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
      );
    }
    await modal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();

    // 4. Abrir reagendamiento en Alpha y seleccionar modo Intercambio
    const cardA = page.locator("article", { hasText: patientA });
    await expect(cardA).toBeVisible();
    await cardA.getByRole("button", { name: "Reagendar" }).click();

    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();

    await rescheduleModal.getByRole("button", { name: /Intercambio/i }).click();

    // 5. Seleccionar a Beta en el selector de intercambio
    const swapSelect = rescheduleModal.locator("#swap-candidate");
    await expect(swapSelect).toBeVisible();
    // Seleccionar la opción que contiene a PatientB
    await swapSelect.selectOption({ index: 1 });

    // 6. Confirmar intercambio
    await rescheduleModal.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect(page.getByText("¡Intercambio de turnos realizado con éxito!")).toBeVisible();
    await expect(rescheduleModal).not.toBeVisible();

    // 7. Validar que ahora Alpha esté a las 11:00 y Beta a las 10:00
    const updatedCardA = page.locator("article", { hasText: patientA });
    const updatedCardB = page.locator("article", { hasText: patientB });
    await expect(updatedCardA.getByText("11:00")).toBeVisible();
    await expect(updatedCardB.getByText("10:00")).toBeVisible();
  });

  test("debe programar un turno recurrente mensual ordinal (E2E-07)", async ({ page }) => {
    const patientName = `Paciente Mensual ${Date.now()}`;

    // 1. Crear el paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Abrir modal de programar turno
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await expect(sessionModal).toBeVisible();

    // 3. Seleccionar paciente y activar recurrencia mensual
    await page.locator("#modal-patient").selectOption({ label: patientName });
    await sessionModal.getByRole("checkbox").check();

    // Seleccionar cadencia Mensual
    await sessionModal.getByRole("button", { name: "Mensual" }).click();

    // Asegurar fecha y hora
    const dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    // Validar que el texto descriptivo del resumen indique recurrencia mensual
    await expect(sessionModal.getByText(/de cada mes/i)).toBeVisible();

    // 4. Guardar turno
    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 5. Verificar que el turno aparece en la agenda con indicador de recurrencia
    const appointmentCard = page.locator("article", { hasText: patientName });
    await expect(appointmentCard).toBeVisible();
  });

  test("debe reagendar un turno de manera permanente actualizando la recurrencia para fechas futuras (E2E-09)", async ({
    page,
  }) => {
    const patientName = `Paciente Permanente ${Date.now()}`;

    // 1. Crear paciente
    await page.getByRole("button", { name: "Fichero" }).click();
    await page.getByRole("button", { name: /Nuevo paciente/i }).click();
    await page.locator("#p-name").fill(patientName);
    await page.getByRole("button", { name: "Guardar paciente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 2. Programar turno recurrente semanal inicial a las 10:00
    await page.getByRole("button", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Programar turno" }).first().click();

    const sessionModal = page.getByRole("dialog");
    await page.locator("#modal-patient").selectOption({ label: patientName });
    await sessionModal.getByRole("checkbox").check();
    await page.locator("#modal-time").fill("10:00");

    const dateInput = page.locator("#modal-date");
    if (!(await dateInput.inputValue())) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      await dateInput.fill(`${dd}/${mm}/${yyyy}`);
    }

    await sessionModal.getByRole("button", { name: "Programar turno" }).click();
    await expect(page.getByText("¡Turno programado correctamente!")).toBeVisible();
    await expect(sessionModal).not.toBeVisible();

    // 3. Abrir modal de reagendamiento en la tarjeta
    const initialCard = page.locator("article", { hasText: patientName });
    await expect(initialCard).toBeVisible();
    await initialCard.getByRole("button", { name: "Reagendar" }).click();

    const rescheduleModal = page.getByRole("dialog");
    await expect(rescheduleModal).toBeVisible();

    // 4. Seleccionar alcance "Permanente" (De ahora en más)
    const permanentRadio = rescheduleModal.getByRole("radio", { name: /De ahora en más/i });
    await permanentRadio.check();
    await expect(permanentRadio).toBeChecked();

    // 5. Elegir un horario disponible en la grilla de slots
    const availableSlotBtns = rescheduleModal.locator("button", { hasText: /^\d{2}:\d{2}$/ });
    const count = await availableSlotBtns.count();
    expect(count).toBeGreaterThan(0);
    const chosenSlotBtn = availableSlotBtns.nth(count > 1 ? 1 : 0);
    const newTime = (await chosenSlotBtn.innerText()).trim();
    await chosenSlotBtn.click();

    // 6. Confirmar reagendamiento permanente
    await rescheduleModal.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect(page.getByText("¡Turno reagendado correctamente!")).toBeVisible();
    await expect(rescheduleModal).not.toBeVisible();

    // 7. Verificar que en la semana actual el turno se actualizó al nuevo horario
    const updatedCard = page.locator("article", { hasText: patientName });
    await expect(updatedCard.getByText(newTime)).toBeVisible();

    // 8. Navegar a la semana siguiente y corroborar que el turno recurrente YA tiene el nuevo horario
    await page.getByRole("button", { name: "Semana siguiente" }).click();
    const nextWeekCard = page.locator("article", { hasText: patientName });
    await expect(nextWeekCard).toBeVisible();
    await expect(nextWeekCard.getByText(newTime)).toBeVisible();
  });
});

