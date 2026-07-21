"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface RichTextEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: "standard" | "continuous";
  onBlur?: () => void;
}

export function RichTextEditor({
  initialValue,
  onChange,
  placeholder = "Comenzá a redactar la evolución clínica del paciente...",
  variant = "standard",
  onBlur,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!initialValue);
  const [customColor, setCustomColor] = useState("#fef08a");
  const [fontSize, setFontSize] = useState(13); // Tamaño de tipografía base en px

  const insertTextAtCursor = (text: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const formattedText = ` ${text.trim()} `;

    if (typeof window !== "undefined") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(formattedText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += formattedText;
      }
      triggerChange();
    }
  };

  const { isListening, error: speechError, isSupported: isSpeechSupported, toggleListening } = useSpeechRecognition(insertTextAtCursor);

  // Sincronizar el contenido del editor con initialValue cuando cambia (ej: al cargar la DB),
  // pero solo si el usuario no está editando activamente (isFocused === false) para evitar saltos de cursor.
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== initialValue) {
      editorRef.current.innerHTML = initialValue || "";
      setIsEmpty(!initialValue || initialValue === "<br>" || editorRef.current.textContent?.trim() === "");
    }
  }, [initialValue, isFocused]);

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
      const html = editorRef.current.innerHTML;
      onChange(html);
      const text = editorRef.current.textContent || "";
      setIsEmpty(html === "" || html === "<br>" || text.trim() === "");
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

            {/* Dictado Clínico por Voz */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={isSpeechSupported ? toggleListening : undefined}
                disabled={!isSpeechSupported}
                className={`h-8 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 text-xs border font-bold ${
                  !isSpeechSupported
                    ? "opacity-35 cursor-not-allowed bg-transparent text-text-sub border-transparent"
                    : isListening
                    ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/45 shadow-sm cursor-pointer"
                    : "bg-transparent hover:bg-brand-sand/40 text-text-main border-transparent cursor-pointer"
                }`}
                title={
                  !isSpeechSupported
                    ? "Dictado por voz no soportado en este navegador (se recomienda Chrome, Edge o Safari)"
                    : isListening
                    ? "Detener Dictado Clínico"
                    : "Dictar evolución pos-sesión (Dictado por Voz)"
                }
              >
                <span className={isListening ? "animate-pulse" : ""}>🎙️</span>
                {isListening && (
                  <span className="text-[9px] uppercase font-title tracking-wider animate-pulse font-extrabold">
                    Grabando...
                  </span>
                )}
              </button>
              {speechError && (
                <span className="text-[9px] font-bold text-status-cancelled-dark bg-status-cancelled-light border border-status-cancelled-dark/20 px-2 py-1 rounded-lg animate-fade-in" title={speechError}>
                  ⚠️ {speechError}
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-brand-sand mx-1" />

            {/* Resaltadores de colores */}
            <div className="flex items-center gap-1.5">
              {highlights.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => executeCommand("backColor", color.hex)}
                  className={`h-5 w-5 rounded-full border border-brand-sand/50 cursor-pointer hover:scale-110 transition-transform ${color.class}`}
                  title={`Resaltar en ${color.name}`}
                />
              ))}

              {/* Selector de color personalizado */}
              <div className="relative h-6 w-6 flex items-center justify-center rounded-full hover:scale-110 transition-transform group cursor-pointer" title="Color de resaltado a elección">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    executeCommand("backColor", e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div 
                  className="h-5 w-5 rounded-full border border-brand-sand/70 flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: customColor }}
                />
                <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full px-0.5 border border-brand-sand shadow-sm pointer-events-none">🎨</span>
              </div>

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

          <div className="flex items-center gap-2">
            {/* Zoom de letra */}
            <div className="flex items-center gap-1 bg-bg-base border border-brand-sand/60 rounded-xl p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.max(9, prev - 1))}
                className="h-6 w-6 rounded-lg hover:bg-brand-sand/40 text-text-sub font-bold flex items-center justify-center cursor-pointer transition-colors text-[10px]"
                title="Achicar letra (Zoom Out)"
              >
                A⁻
              </button>
              <span className="text-[10px] font-mono font-bold text-text-sub min-w-[28px] text-center">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.min(26, prev + 1))}
                className="h-6 w-6 rounded-lg hover:bg-brand-sand/40 text-text-sub font-bold flex items-center justify-center cursor-pointer transition-colors text-[10px]"
                title="Agrandar letra (Zoom In)"
              >
                A⁺
              </button>
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
            if (onBlur) onBlur();
          }}
          onInput={triggerChange}
           className={`w-full overflow-y-auto overflow-x-hidden break-words text-text-main focus:outline-none font-sans leading-relaxed whitespace-pre-wrap select-text cursor-text ${
            isContinuous 
              ? "p-2 min-h-[40px] max-h-[800px]" 
              : "p-4 min-h-[150px] max-h-[400px]"
          }`}
          style={{
            minHeight: isContinuous ? "40px" : "150px",
            fontSize: `${fontSize}px`,
          }}
        />

        {/* Placeholder dinámico */}
        {isEmpty && (
          <div 
            className={`absolute inset-0 text-text-sub/40 pointer-events-none font-sans ${
              isContinuous ? "p-2" : "p-4"
            }`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
