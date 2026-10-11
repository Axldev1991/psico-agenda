"use client";

import React, { useState, useRef, useEffect } from "react";
import { CLINICAL_TAG_PALETTE, resolveClinicalTag } from "../../utils/clinical-tags";

interface ClinicalColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
}

export function ClinicalColorPicker({
  currentColor,
  onSelectColor,
}: ClinicalColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matched = resolveClinicalTag(currentColor);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Elegir color (actual: ${matched.name})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="h-7 w-7 rounded-full border-2 border-surface shadow-xs transition-transform hover:scale-110 cursor-pointer flex items-center justify-center relative ring-1 ring-line"
        style={{ backgroundColor: currentColor }}
      />

      {isOpen && (
        <div
          role="listbox"
          aria-label="Paleta de colores clínicos"
          className="absolute z-40 top-full mt-2 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-xl p-2.5 shadow-lg grid grid-cols-4 gap-2 w-44 animate-in fade-in duration-150"
        >
          {CLINICAL_TAG_PALETTE.map((tag) => {
            const isSelected =
              currentColor.toLowerCase() === tag.text.toLowerCase() ||
              currentColor.toLowerCase() === tag.key.toLowerCase();

            return (
              <button
                key={tag.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                title={`${tag.name} (contraste ${tag.contrast})`}
                onClick={() => {
                  onSelectColor(tag.text);
                  setIsOpen(false);
                }}
                className={`h-7 w-7 rounded-full transition-transform hover:scale-115 cursor-pointer relative flex items-center justify-center border ${
                  isSelected ? "ring-2 ring-primary ring-offset-1 scale-105" : "border-line"
                }`}
                style={{ backgroundColor: tag.text }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
