"use client";

import React from "react";
import { format, addMinutes } from "date-fns";
import { CalendarSlot } from "../../../domain/agenda.types";
import { Session, PaymentStatus, PaymentMethod, SessionModality } from "../../../domain/session.types";
import { Icon } from "../common/Icon";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";

interface AppointmentCardProps {
  slot: CalendarSlot;
  onUpdateStatus: (slot: CalendarSlot, status: Session["status"]) => Promise<void>;
  onUpdatePaymentStatus?: (slot: CalendarSlot, status: PaymentStatus, method?: PaymentMethod) => Promise<void>;
  onUpdateModality?: (slot: CalendarSlot, modality: SessionModality) => Promise<void>;
  onRemoveRecurrenceRule?: (patientUuid: string) => Promise<void>;
  onNavigateToPatientDetail: (patientUuid: string, sessionUuid?: string, slot?: CalendarSlot) => void;
  onOpenRescheduleModal?: (slot: CalendarSlot) => void;
}

export function AppointmentCard({
  slot,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onUpdateModality,
  onRemoveRecurrenceRule,
  onNavigateToPatientDetail,
  onOpenRescheduleModal,
}: AppointmentCardProps) {
  const startTime = format(slot.dateTime, "HH:mm");
  const endTime = format(addMinutes(slot.dateTime, 50), "HH:mm");

  const isCancelled = slot.status === "cancelled";
  const isCompleted = slot.status === "completed";
  const isMissed = slot.status === "missed";
  const isSuspended = !!slot.isSuspended;

  let barColor = "bg-primary";
  if (isSuspended) {
    barColor = "bg-amber-400";
  } else if (isCompleted) {
    barColor = "bg-ok";
  } else if (isCancelled) {
    barColor = "bg-line-control";
  } else if (isMissed) {
    barColor = "bg-warn";
  }

  return (
    <article
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xs transition-colors hover:border-line-control/60 ${
        isCancelled
          ? "opacity-75 bg-bg-base/40 border-line"
          : isSuspended
          ? "bg-amber-500/5 border-amber-200/80"
          : "bg-surface border-line"
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Time display */}
        <div className="shrink-0 flex flex-col items-center justify-center font-mono text-xs text-ink-sub pt-0.5">
          <span className="font-semibold text-ink text-base">{startTime}</span>
          <span className="text-sm text-ink-sub">{endTime}</span>
        </div>

        {/* State Bar */}
        <div
          className={`w-1 self-stretch rounded-full shrink-0 ${barColor}`}
          aria-hidden="true"
        />

        {/* Patient and modality info */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Patient Name */}
          <div className="flex items-center gap-2">
            <h4
              data-sensitive
              className={`font-semibold text-base text-ink truncate ${
                isCancelled || isSuspended ? "line-through text-ink-sub" : ""
              }`}
            >
              {slot.patientName}
            </h4>
            {slot.isRecurrent && (
              <span
                title="Se repite semanalmente"
                className="text-primary inline-flex items-center shrink-0"
              >
                <Icon name="repeat" size={13} />
              </span>
            )}
          </div>

          {/* Row 2: Metadata tags: Modality + Status Dropdown Badge + Payment Badge */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Modalidad */}
            {onUpdateModality && !isCancelled && !isSuspended ? (
              <button
                type="button"
                onClick={() => onUpdateModality(slot, slot.modality === "online" ? "in_person" : "online")}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-line bg-surface hover:border-line-control text-ink-sub hover:text-ink transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                title={`Modalidad: ${slot.modality === "online" ? "Virtual" : "Presencial"}. Hacé clic para cambiar a ${slot.modality === "online" ? "Presencial" : "Virtual"}`}
              >
                <Icon
                  name={slot.modality === "online" ? "video" : "pin"}
                  size={12}
                  className={slot.modality === "online" ? "text-indigo-600" : "text-ink-sub"}
                />
                <span>{slot.modality === "online" ? "Virtual" : "Presencial"}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-line bg-surface text-ink-sub whitespace-nowrap shadow-2xs">
                <Icon name={slot.modality === "online" ? "video" : "pin"} size={12} />
                <span>{slot.modality === "online" ? "Virtual" : "Presencial"}</span>
              </span>
            )}

            {/* Status Dropdown Badge */}
            <AppointmentStatusBadge
              status={slot.status}
              isSuspended={isSuspended}
              onUpdateStatus={(newStatus) => onUpdateStatus(slot, newStatus)}
            />

            {/* Payment Badge */}
            {!isCancelled && !isSuspended && onUpdatePaymentStatus && (
              <AppointmentPaymentBadge
                paymentStatus={slot.paymentStatus || "pending"}
                paymentMethod={slot.paymentMethod}
                onUpdatePayment={(status, method) => onUpdatePaymentStatus(slot, status, method)}
              />
            )}

            {/* Recesos / Feriados */}
            {slot.absence && (
              <span className="text-amber-800 text-xs font-medium whitespace-nowrap bg-amber-500/10 px-2 py-0.5 rounded border border-amber-300/40">
                🏖️ {slot.absence.reason}
              </span>
            )}
            {slot.holiday && !slot.absence && (
              <span className="text-warn text-xs font-medium whitespace-nowrap bg-warn-tint px-2 py-0.5 rounded border border-warn/30">
                Feriado: {slot.holiday.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={() => onNavigateToPatientDetail(slot.patientUuid, slot.uuid, slot)}
          className="px-2.5 py-1.5 text-ink-sub hover:text-primary hover:bg-primary-tint border border-line hover:border-primary/40 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center gap-1.5 shadow-2xs"
          title="Ver ficha clínica del paciente"
        >
          <Icon name="file" size={14} />
          <span>Ficha</span>
        </button>

        {!isCancelled && onOpenRescheduleModal && (
          <button
            type="button"
            onClick={() => onOpenRescheduleModal(slot)}
            className="px-2.5 py-1.5 text-ink-sub hover:text-primary hover:bg-primary-tint border border-line hover:border-primary/40 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center gap-1.5 shadow-2xs"
            title="Reagendar o cambiar turno"
          >
            <Icon name="calendar" size={14} />
            <span>Reagendar</span>
          </button>
        )}

        {slot.isRecurrent && onRemoveRecurrenceRule && (
          <button
            type="button"
            onClick={() => onRemoveRecurrenceRule(slot.patientUuid)}
            title="Quitar turno recurrente"
            className="p-1.5 text-ink-sub hover:text-err hover:bg-err-tint border border-transparent hover:border-err/30 rounded-lg transition-colors cursor-pointer"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
