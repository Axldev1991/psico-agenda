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
      <div key={selectedPatientForDetail.uuid} className="animate-in fade-in duration-200">
        <PatientDetail
          patient={selectedPatientForDetail}
          onBack={() => setSelectedPatientForDetail(null)}
          onEdit={(patient) => openEditPatientModal(patient)}
        />
      </div>
    );
  }

  return (
    <div key="patient-list" className="animate-in fade-in duration-200">
      <PatientManager
        patients={patients}
        loading={loading}
        onRemovePatient={removePatient}
        onOpenPatientModal={openNewPatientModal}
        onSelectPatient={setSelectedPatientForDetail}
      />
    </div>
  );
}
