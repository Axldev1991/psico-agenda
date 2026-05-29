"use client";

import { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "standard" | "continuous";
}

export function RichTextEditor({
  initialValue,
  onChange,
  placeholder = "Comenzá a redactar la evolución clínica del paciente...",
  variant = "standard",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Cargar el valor inicial solo una vez al montar para evitar que el cursor salte
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue || "";
    }
  }, []);

  const executeCommand = (command: string, value: string = "") => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      // Mantener el foco
      editorRef.current?.focus();
      triggerChange();
    }
  };

  const triggerChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Resaltadores calmos acordes al diseño de PSICO-AGENDA
  const highlights = [
    { name: "Amarillo", hex: "#fef08a", class: "bg-yellow-200" },
    { name: "Verde", hex: "#bbf7d0", class: "bg-green-200" },
    { name: "Lavanda", hex: "#e9d5ff", class: "bg-purple-200" },
    { name: "Arena", hex: "#fed7aa", class: "bg-orange-200" },
  ];

  const isContinuous = variant === "continuous";

  return (
    <div
      className={`transition-all duration-300 ${
        isContinuous
          ? isFocused
            ? "border border-brand-indigo/60 rounded-xl bg-bg-card shadow-sm"
            : "border border-transparent bg-transparent"
          : `border rounded-2xl overflow-hidden bg-bg-card ${
              isFocused ? "border-brand-indigo ring-1 ring-brand-indigo" : "border-brand-sand/70"
            }`
      }`}
    >
      {/* Barra de Herramientas Word-Like minimalista (se oculta en modo continuo si no está enfocado) */}
      {(!isContinuous || isFocused) && (
        <div className="bg-bg-base/70 border-b border-brand-sand px-3 py-2 flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5">
            {/* Botón Negrita */}
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="h-8 w-8 rounded-lg hover:bg-brand-sand/40 text-text-main font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              title="Negrita (Ctrl+B)"
            >
              B
            </button>

            {/* Botón Cursiva */}
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="h-8 w-8 rounded-lg hover:bg-brand-sand/40 text-text-main italic flex items-center justify-center cursor-pointer transition-colors text-xs"
              title="Cursiva (Ctrl+I)"
            >
              I
            </button>

            {/* Botón Subrayado */}
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              className="h-8 w-8 rounded-lg hover:bg-brand-sand/40 text-text-main underline flex items-center justify-center cursor-pointer transition-colors text-xs"
              title="Subrayado (Ctrl+U)"
            >
              U
            </button>

            <div className="h-4 w-px bg-brand-sand mx-1" />

            {/* Resaltadores de colores */}
            <div className="flex items-center gap-1">
              {highlights.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => executeCommand("backColor", color.hex)}
                  className={`h-5 w-5 rounded-full border border-brand-sand/50 cursor-pointer hover:scale-110 transition-transform ${color.class}`}
                  title={`Resaltar en ${color.name}`}
                />
              ))}
              {/* Botón Limpiar Resaltador */}
              <button
                type="button"
                onClick={() => executeCommand("backColor", "transparent")}
                className="h-6 w-6 rounded-lg hover:bg-brand-sand/40 text-text-sub hover:text-status-cancelled-dark flex items-center justify-center cursor-pointer transition-colors text-xs ml-1"
                title="Quitar Resaltador"
              >
                🚫
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="text-[10px] text-text-sub hover:text-text-main font-title font-bold px-2 py-1 rounded hover:bg-brand-sand/30 transition-all cursor-pointer"
            title="Limpiar todos los estilos de la selección"
          >
            🧹 Limpiar Formato
          </button>
        </div>
      )}

      {/* Caja Editable */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            triggerChange();
          }}
          onInput={triggerChange}
          className={`w-full overflow-y-auto text-xs text-text-main focus:outline-none font-sans leading-relaxed whitespace-pre-wrap select-text cursor-text ${
            isContinuous 
              ? "p-2 min-h-[40px] max-h-[800px]" 
              : "p-4 min-h-[150px] max-h-[400px]"
          }`}
          style={{
            minHeight: isContinuous ? "40px" : "150px",
          }}
        />

        {/* Placeholder dinámico */}
        {editorRef.current && !editorRef.current.innerHTML && (
          <div className={`absolute inset-0 text-xs text-text-sub/40 pointer-events-none font-sans ${
            isContinuous ? "p-2" : "p-4"
          }`}>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
