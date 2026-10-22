"use client";

import React, { useState } from "react";
import { Patient } from "../../domain/patient.types";
import {
  PatientTypeFilter,
  filterPatients,
} from "../../domain/patient.utils";
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
  const [typeFilter, setTypeFilter] = useState<PatientTypeFilter>("all");

  const typeFilteredPatients = patients.filter((p) => {
    const patientType = p.type || "adult";
    return typeFilter === "all" || patientType === typeFilter;
  });

  const counts = {
    active: typeFilteredPatients.filter((p) => (p.status || "active") === "active").length,
    inactive: typeFilteredPatients.filter((p) => p.status === "inactive").length,
    all: typeFilteredPatients.length,
  };

  const filteredPatients = filterPatients(patients, {
    status: statusFilter,
    type: typeFilter,
    searchTerm,
  });

  return (
    <section className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
      {/* 1. Status Tabs */}
      <PatientStatusTabs
        currentTab={statusFilter}
        onChangeTab={setStatusFilter}
        counts={counts}
      />

      {/* 2. List Header with Subtitle, Population Filter, and Search */}
      <PatientListHeader
        currentTab={statusFilter}
        count={filteredPatients.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
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
