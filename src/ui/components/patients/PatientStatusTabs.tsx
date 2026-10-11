"use client";

import React from "react";

export type PatientStatusFilter = "active" | "inactive" | "all";

interface PatientStatusTabsProps {
  currentTab: PatientStatusFilter;
  onChangeTab: (tab: PatientStatusFilter) => void;
  counts: {
    active: number;
    inactive: number;
    all: number;
  };
}

export function PatientStatusTabs({
  currentTab,
  onChangeTab,
  counts,
}: PatientStatusTabsProps) {
  const tabs: { key: PatientStatusFilter; label: string; count: number }[] = [
    { key: "active", label: "En tratamiento", count: counts.active },
    { key: "inactive", label: "De alta", count: counts.inactive },
    { key: "all", label: "Todos", count: counts.all },
  ];

  return (
    <div
      role="tablist"
      aria-label="Estado del paciente"
      className="flex border-b border-line bg-surface px-5 pt-3 gap-6 overflow-x-auto"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChangeTab(tab.key)}
            className={`pb-2.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-ink-sub hover:text-ink"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                isActive
                  ? "bg-primary-tint text-primary"
                  : "bg-bg-base text-ink-sub"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
