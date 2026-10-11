"use client";

import React from "react";
import { PatientManager } from "../components/PatientManager";
import { PatientDetail } from "../components/PatientDetail";
import { usePatients } from "../hooks/usePatients";
import { useUIState } from "../context/UIContext";

export function PatientsView() {
  const { patients, loading, removePatient } = usePatients();
  const {
    selectedPatientForDetail,
    setSelectedPatientForDetail,
    openNewPatientModal,
    openEditPatientModal,
  } = useUIState();

  if (selectedPatientForDetail) {
    return (
      <PatientDetail
        patient={selectedPatientForDetail}
        onBack={() => setSelectedPatientForDetail(null)}
        onEdit={(patient) => openEditPatientModal(patient)}
      />
    );
  }

  return (
    <PatientManager
      patients={patients}
      loading={loading}
      onRemovePatient={removePatient}
      onOpenPatientModal={openNewPatientModal}
      onSelectPatient={setSelectedPatientForDetail}
    />
  );
}
