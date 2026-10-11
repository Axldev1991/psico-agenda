"use client";

import React from "react";
import { ClinicalColorPicker } from "./ClinicalColorPicker";
import { resolveClinicalTag } from "../../utils/clinical-tags";
import { Icon } from "../common/Icon";

interface MovementRowProps {
  label: string;
  color: string;
  onLabelChange: (val: string) => void;
  onColorChange: (val: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function MovementRow({
  label,
  color,
  onLabelChange,
  onColorChange,
  onDelete,
  canDelete,
}: MovementRowProps) {
  const clinicalTag = resolveClinicalTag(color);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 py-3 items-center border-b border-line/60 last:border-b-0">
      {/* Label input */}
      <div className="col-span-1 sm:col-span-5">
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Nombre del movimiento"
          className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Color picker */}
      <div className="col-span-1 sm:col-span-2 flex justify-center items-center">
        <ClinicalColorPicker currentColor={color} onSelectColor={onColorChange} />
      </div>

      {/* Preview tag */}
      <div className="col-span-1 sm:col-span-4 flex justify-center items-center">
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium select-none truncate max-w-40 border"
          style={{
            backgroundColor: clinicalTag.bg,
            color: clinicalTag.text,
            borderColor: `${clinicalTag.text}33`,
          }}
        >
          {label.trim() || "Vista previa"}
        </span>
      </div>

      {/* Delete action */}
      <div className="col-span-1 sm:col-span-1 flex justify-center items-center">
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Eliminar elemento"
          title={canDelete ? "Eliminar" : "No se puede eliminar el único elemento"}
          className="p-1.5 text-ink-sub hover:text-err hover:bg-err-tint rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Icon name="x" size={15} />
        </button>
      </div>
    </div>
  );
}
