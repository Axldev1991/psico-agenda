"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Patient } from "../../domain/patient.types";

export type ActiveTab = "calendar" | "patients" | "settings";

export interface UIContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPatientForDetail: Patient | null;
  setSelectedPatientForDetail: (patient: Patient | null) => void;
  patientToEdit: Patient | null;
  isPatientModalOpen: boolean;
  openNewPatientModal: () => void;
  openEditPatientModal: (patient: Patient) => void;
  closePatientModal: () => void;
  isSessionModalOpen: boolean;
  openSessionModal: () => void;
  closeSessionModal: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  navigateToPatientDetail: (patient: Patient) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("calendar");
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const openNewPatientModal = () => {
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  };

  const openEditPatientModal = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  };

  const closePatientModal = () => {
    setIsPatientModalOpen(false);
    setPatientToEdit(null);
  };

  const openSessionModal = () => {
    setIsSessionModalOpen(true);
  };

  const closeSessionModal = () => {
    setIsSessionModalOpen(false);
  };

  const navigateToPatientDetail = (patient: Patient) => {
    setSelectedPatientForDetail(patient);
    setActiveTab("patients");
  };

  return (
    <UIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedPatientForDetail,
        setSelectedPatientForDetail,
        patientToEdit,
        isPatientModalOpen,
        openNewPatientModal,
        openEditPatientModal,
        closePatientModal,
        isSessionModalOpen,
        openSessionModal,
        closeSessionModal,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        navigateToPatientDetail,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIState(): UIContextType {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIState must be used within a UIProvider");
  }
  return context;
}
