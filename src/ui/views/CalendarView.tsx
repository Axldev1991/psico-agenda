"use client";

import React from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { useCalendar } from "../hooks/useCalendar";
import { useUIState } from "../context/UIContext";

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
  } = useCalendar();

  const { openSessionModal } = useUIState();

  return (
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
      onNavigateToPatientDetail={onNavigateToPatientDetail}
    />
  );
}
