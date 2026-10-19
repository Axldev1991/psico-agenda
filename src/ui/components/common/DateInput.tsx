"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./Icon";

interface DateInputProps {
  id?: string;
  value: string; // ISO format "yyyy-MM-dd"
  onChange: (isoValue: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showHelper?: boolean;
}

export function DateInput({
  id,
  value,
  onChange,
  required = false,
  placeholder = "DD/MM/AAAA",
  className = "",
  disabled = false,
  showHelper = true,
}: DateInputProps) {
  const [displayDate, setDisplayDate] = useState("");
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Sync formatted display string when external ISO value changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setDisplayDate(`${d}/${m}/${y}`);
    } else if (!value) {
      setDisplayDate("");
    }
  }, [value]);

  const handleTextChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDisplayDate(formatted);

    if (digits.length === 8) {
      const d = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      const y = parseInt(digits.slice(4), 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        onChange(iso);
      }
    } else if (digits.length === 0) {
      onChange("");
    }
  };

  const handleNativePickerChange = (isoVal: string) => {
    onChange(isoVal);
    if (isoVal && /^\d{4}-\d{2}-\d{2}$/.test(isoVal)) {
      const [y, m, d] = isoVal.split("-");
      setDisplayDate(`${d}/${m}/${y}`);
    } else {
      setDisplayDate("");
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={displayDate}
          onChange={(e) => handleTextChange(e.target.value)}
          className={`w-full bg-surface border border-line rounded-lg px-3 py-2 pr-10 text-ink focus:outline-none focus:border-primary text-base transition-colors ${className}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => datePickerRef.current?.showPicker()}
          title="Abrir calendario"
          aria-label="Abrir selector de fecha"
          className="absolute right-2.5 p-1 text-ink-sub hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <Icon name="calendar" size={18} />
        </button>
        <input
          ref={datePickerRef}
          type="date"
          tabIndex={-1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleNativePickerChange(e.target.value)}
          className="sr-only pointer-events-none"
          aria-hidden="true"
        />
      </div>
      {showHelper && (
        <span className="text-xs text-ink-sub mt-1 block">
          Formato DD/MM/AAAA (ej. 22/10/2026)
        </span>
      )}
    </div>
  );
}
