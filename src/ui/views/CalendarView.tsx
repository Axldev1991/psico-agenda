"use client";

import React, { useState } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { RescheduleModal } from "../components/calendar/RescheduleModal";
import { useCalendar } from "../hooks/useCalendar";
import { useUIState } from "../context/UIContext";
import { CalendarSlot } from "../../domain/agenda.types";

interface CalendarViewProps {
  onNavigateToPatientDetail: (patientUuid: string) => void;
}

export function CalendarView({ onNavigateToPatientDetail }: CalendarViewProps) {
  const {
    currentDate,
    weekDays,
    agenda,
    nextWeek,
    prevWeek,
    goToToday,
    selectDate,
    updateSessionStatus,
    removeRecurrenceRule,
    holidays,
    dbSessions,
    recurrenceRules,
    rescheduleSlot,
    swapSlots,
    patients,
    absencePeriods,
  } = useCalendar();

  const { openSessionModal } = useUIState();

  const [selectedSlotForReschedule, setSelectedSlotForReschedule] =
    useState<CalendarSlot | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const handleOpenReschedule = (slot: CalendarSlot) => {
    setSelectedSlotForReschedule(slot);
    setIsRescheduleOpen(true);
  };

  const handleCloseReschedule = () => {
    setSelectedSlotForReschedule(null);
    setIsRescheduleOpen(false);
  };

  return (
    <>
      <CalendarGrid
        currentDate={currentDate}
        weekDays={weekDays}
        agenda={agenda}
        holidays={holidays}
        nextWeek={nextWeek}
        prevWeek={prevWeek}
        goToToday={goToToday}
        onUpdateStatus={updateSessionStatus}
        onRemoveRecurrenceRule={removeRecurrenceRule}
        onOpenSessionModal={openSessionModal}
        selectDate={selectDate}
        dbSessions={dbSessions}
        recurrenceRules={recurrenceRules}
        patients={patients}
        onNavigateToPatientDetail={onNavigateToPatientDetail}
        onOpenRescheduleModal={handleOpenReschedule}
        absencePeriods={absencePeriods}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={handleCloseReschedule}
        slot={selectedSlotForReschedule}
        bookedSlots={agenda}
        onReschedule={rescheduleSlot}
        onSwap={swapSlots}
      />
    </>
  );
}
