"use client";

import React, { useState } from "react";
import { Patient } from "../../domain/patient.types";
import { sortPatientsAlphabetically } from "../../domain/patient.utils";
import {
  PatientStatusTabs,
  PatientStatusFilter,
} from "./patients/PatientStatusTabs";
import { PatientListHeader } from "./patients/PatientListHeader";
import { PatientTable } from "./patients/PatientTable";
import { PatientEmptyState } from "./patients/PatientEmptyState";

interface PatientManagerProps {
  patients: Patient[];
  loading: boolean;
  onRemovePatient: (uuid: string) => Promise<void>;
  onOpenPatientModal: () => void;
  onSelectPatient: (patient: Patient) => void;
}

export function PatientManager({
  patients,
  loading,
  onRemovePatient,
  onOpenPatientModal,
  onSelectPatient,
}: PatientManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>("active");

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const counts = {
    active: patients.filter((p) => (p.status || "active") === "active").length,
    inactive: patients.filter((p) => p.status === "inactive").length,
    all: patients.length,
  };

  const filteredPatients = sortPatientsAlphabetically(
    patients.filter((p) => {
      const patientStatus = p.status || "active";
      const matchesStatus =
        statusFilter === "all" || patientStatus === statusFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        normalize(p.fullName).includes(normalize(searchTerm.trim()));
      return matchesStatus && matchesSearch;
    })
  );

  return (
    <section className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
      {/* 1. Status Tabs */}
      <PatientStatusTabs
        currentTab={statusFilter}
        onChangeTab={setStatusFilter}
        counts={counts}
      />

      {/* 2. List Header with Subtitle and Search */}
      <PatientListHeader
        currentTab={statusFilter}
        count={counts[statusFilter]}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenPatientModal={onOpenPatientModal}
      />

      {/* 3. Content: Loading / Empty State / Table */}
      {loading ? (
        <div className="p-12 text-center text-ink-sub text-sm">
          Cargando fichero de pacientes...
        </div>
      ) : filteredPatients.length === 0 ? (
        <PatientEmptyState
          searchTerm={searchTerm}
          onOpenPatientModal={onOpenPatientModal}
        />
      ) : (
        <PatientTable
          patients={filteredPatients}
          onSelectPatient={onSelectPatient}
          onRemovePatient={onRemovePatient}
        />
      )}
    </section>
  );
}
