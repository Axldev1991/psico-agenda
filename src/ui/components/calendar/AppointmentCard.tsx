"use client";

import React from "react";
import { format, addMinutes } from "date-fns";
import { CalendarSlot } from "../../../domain/agenda.types";
import { Session, PaymentStatus, PaymentMethod } from "../../../domain/session.types";
import { Icon } from "../common/Icon";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";

interface AppointmentCardProps {
  slot: CalendarSlot;
  onUpdateStatus: (slot: CalendarSlot, status: Session["status"]) => Promise<void>;
  onUpdatePaymentStatus?: (slot: CalendarSlot, status: PaymentStatus, method?: PaymentMethod) => Promise<void>;
  onRemoveRecurrenceRule?: (patientUuid: string) => Promise<void>;
  onNavigateToPatientDetail: (patientUuid: string, sessionUuid?: string) => void;
  onOpenRescheduleModal?: (slot: CalendarSlot) => void;
}

export function AppointmentCard({
  slot,
  onUpdateStatus,
  onUpdatePaymentStatus,
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

  // Status badge config
  let badgeClass = "bg-primary-tint text-primary";
  let badgeIcon: "check" | "alert" | "x" = "check";
  let badgeLabel = "Agendado";
  let barColor = "bg-primary";

  if (isSuspended) {
    badgeClass = "bg-amber-500/15 text-amber-800 border border-amber-300/60";
    badgeIcon = "alert";
    badgeLabel = "Suspendido por receso";
    barColor = "bg-amber-400";
  } else if (isCompleted) {
    badgeClass = "bg-ok-tint text-ok";
    badgeIcon = "check";
    badgeLabel = "Atendido";
    barColor = "bg-ok";
  } else if (isCancelled) {
    badgeClass = "bg-line/60 text-ink-sub line-through";
    badgeIcon = "x";
    badgeLabel = "Cancelado";
    barColor = "bg-line-control";
  } else if (isMissed) {
    badgeClass = "bg-warn-tint text-warn";
    badgeIcon = "alert";
    badgeLabel = "Ausente";
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
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        {/* Time display */}
        <div className="shrink-0 flex flex-col items-center justify-center font-mono text-xs text-ink-sub">
          <span className="font-semibold text-ink text-base">{startTime}</span>
          <span className="text-sm text-ink-sub">{endTime}</span>
        </div>

        {/* State Bar */}
        <div
          className={`w-1 self-stretch rounded-full shrink-0 ${barColor}`}
          aria-hidden="true"
        />

        {/* Patient and modality info */}
        <div className="min-w-0">
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
                className="text-primary inline-flex items-center"
              >
                <Icon name="repeat" size={13} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-ink-sub mt-0.5">
            <Icon name="pin" size={13} />
            <span>Sesión individual · Presencial</span>
            {slot.absence && (
              <span className="text-amber-800 text-sm font-medium ml-1">
                (🏖️ {slot.absence.reason})
              </span>
            )}
            {slot.holiday && !slot.absence && (
              <span className="text-warn text-sm font-medium ml-1">
                (Feriado: {slot.holiday.name})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badges and action buttons */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
          >
            <Icon name={badgeIcon} size={13} />
            <span>{badgeLabel}</span>
          </span>

          {/* Payment Badge */}
          {!isCancelled && !isSuspended && onUpdatePaymentStatus && (
            <AppointmentPaymentBadge
              paymentStatus={slot.paymentStatus || "pending"}
              paymentMethod={slot.paymentMethod}
              onUpdatePayment={(status, method) => onUpdatePaymentStatus(slot, status, method)}
            />
          )}
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigateToPatientDetail(slot.patientUuid, slot.uuid)}
            className="p-1.5 text-ink-sub hover:text-primary hover:bg-primary-tint rounded-lg transition-colors cursor-pointer text-sm flex items-center gap-1"
            title="Ver ficha del paciente"
          >
            <Icon name="file" size={15} />
            <span className="hidden md:inline font-medium">Ficha</span>
          </button>

          {/* Reagendar button */}
          {!isCancelled && onOpenRescheduleModal && (
            <button
              type="button"
              onClick={() => onOpenRescheduleModal(slot)}
              className="p-1.5 text-ink-sub hover:text-primary hover:bg-primary-tint rounded-lg transition-colors cursor-pointer text-sm flex items-center gap-1"
              title="Reagendar o cambiar turno"
            >
              <Icon name="calendar" size={15} />
              <span className="hidden md:inline font-medium">Reagendar</span>
            </button>
          )}

          {/* Status changer dropdown */}
          <select
            value={slot.status}
            onChange={(e) => onUpdateStatus(slot, e.target.value as any)}
            aria-label="Cambiar estado del turno"
            className="text-sm bg-bg-base border border-line rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            <option value="scheduled">Agendado</option>
            <option value="completed">Atendido</option>
            <option value="cancelled">Cancelado</option>
            <option value="missed">Ausente</option>
          </select>

          {/* Delete recurrent rule if recurrent */}
          {slot.isRecurrent && onRemoveRecurrenceRule && (
            <button
              type="button"
              onClick={() => onRemoveRecurrenceRule(slot.patientUuid)}
              title="Quitar turno recurrente"
              className="p-1.5 text-ink-sub hover:text-err hover:bg-err-tint rounded-lg transition-colors cursor-pointer"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
