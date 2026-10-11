"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSettings } from "../hooks/useSettings";
import { Icon } from "./common/Icon";

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
  const { punctuationConfigs } = useSettings();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!initialValue);
  const [customColor, setCustomColor] = useState("#fef08a");
  const [fontSize, setFontSize] = useState(16); // Tamaño de tipografía base en px (piso accesible 16px)

  const defaultPunctuation = [
    { key: "yellow", color: "#FEF08A", label: "Amarillo" },
    { key: "green", color: "#BBF7D0", label: "Verde" },
    { key: "purple", color: "#E9D5FF", label: "Lavanda" },
    { key: "orange", color: "#FED7AA", label: "Arena" }
  ];
  const configsToUse = punctuationConfigs.length > 0 ? punctuationConfigs : defaultPunctuation;

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

  // Resaltadores cargados dinámicamente

  const isContinuous = variant === "continuous";

  return (
    <div
      className={`transition-all duration-300 ${
        isContinuous
          ? isFocused
            ? "border border-primary/60 rounded-xl bg-surface shadow-sm"
            : "border border-transparent bg-transparent"
          : `border rounded-2xl overflow-hidden bg-surface ${
              isFocused ? "border-primary ring-1 ring-primary/20 shadow-sm" : "border-line"
            }`
      }`}
    >
      {/* Barra de Herramientas Word-Like minimalista (se oculta en modo continuo si no está enfocado) */}
      {(!isContinuous || isFocused) && (
        <div className="bg-sand-light/40 border-b border-line px-3 py-2 flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5">
            {/* Botón Negrita */}
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="h-8 w-8 rounded-lg hover:bg-sand-light text-ink font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              title="Negrita (Ctrl+B)"
            >
              B
            </button>

            {/* Botón Cursiva */}
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="h-8 w-8 rounded-lg hover:bg-sand-light text-ink italic flex items-center justify-center cursor-pointer transition-colors text-xs"
              title="Cursiva (Ctrl+I)"
            >
              I
            </button>

            {/* Botón Subrayado */}
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              className="h-8 w-8 rounded-lg hover:bg-sand-light text-ink underline flex items-center justify-center cursor-pointer transition-colors text-xs"
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
                className={`h-8 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 text-xs border font-medium ${
                  !isSpeechSupported
                    ? "opacity-35 cursor-not-allowed bg-transparent text-ink-muted border-transparent"
                    : isListening
                    ? "bg-danger/10 text-danger border-danger/30 shadow-sm cursor-pointer"
                    : "bg-transparent hover:bg-sand-light text-ink border-transparent cursor-pointer"
                }`}
                title={
                  !isSpeechSupported
                    ? "Dictado por voz no soportado en este navegador (se recomienda Chrome, Edge o Safari)"
                    : isListening
                    ? "Detener Dictado Clínico"
                    : "Dictar evolución pos-sesión (Dictado por Voz)"
                }
              >
                <Icon name="mic" size={14} className={isListening ? "animate-pulse text-danger" : "text-ink-muted"} />
                {isListening && (
                  <span className="text-[9px] uppercase font-mono tracking-wider animate-pulse font-bold">
                    Grabando...
                  </span>
                )}
              </button>
              {speechError && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-1 rounded-lg animate-fade-in" title={speechError}>
                  <Icon name="alert" size={11} /> {speechError}
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-line mx-1" />

            {/* Resaltadores de colores */}
            <div className="flex items-center gap-1.5">
              {configsToUse.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  onClick={() => executeCommand("backColor", color.color)}
                  style={{ backgroundColor: color.color }}
                  className="h-5 w-5 rounded-full border border-line cursor-pointer hover:scale-110 transition-transform shadow-xs"
                  title={`Resaltar como: ${color.label}`}
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
                  className="h-5 w-5 rounded-full border border-line flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: customColor }}
                />
              </div>

              {/* Botón Limpiar Resaltador */}
              <button
                type="button"
                onClick={() => executeCommand("backColor", "transparent")}
                className="h-6 w-6 rounded-lg hover:bg-sand-light text-ink-muted hover:text-danger flex items-center justify-center cursor-pointer transition-colors text-xs ml-1"
                title="Quitar Resaltador"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom de letra */}
            <div className="flex items-center gap-1 bg-surface border border-line rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.max(14, prev - 1))}
                className="h-8 w-8 rounded-lg hover:bg-sand-light text-ink font-bold flex items-center justify-center cursor-pointer transition-colors text-sm"
                title="Achicar letra (Zoom Out)"
              >
                A⁻
              </button>
              <span className="text-sm font-mono font-semibold text-ink min-w-9 text-center">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.min(32, prev + 1))}
                className="h-8 w-8 rounded-lg hover:bg-sand-light text-ink font-bold flex items-center justify-center cursor-pointer transition-colors text-sm"
                title="Agrandar letra (Zoom In)"
              >
                A⁺
              </button>
            </div>

            <button
              type="button"
              onClick={() => executeCommand("removeFormat")}
              className="inline-flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink font-semibold px-2 py-1 rounded hover:bg-sand-light transition-all cursor-pointer"
              title="Limpiar todos los estilos de la selección"
            >
              <Icon name="trash" size={11} /> Limpiar Formato
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
           className={`w-full overflow-y-auto overflow-x-hidden wrap-break-word text-ink focus:outline-none font-sans leading-relaxed whitespace-pre-wrap select-text cursor-text ${
            isContinuous 
              ? "p-2 min-h-10 max-h-200" 
              : "p-4 min-h-37.5 max-h-100"
          }`}
          style={{
            minHeight: isContinuous ? "40px" : "150px",
            fontSize: `${fontSize}px`,
          }}
        />

        {/* Placeholder dinámico */}
        {isEmpty && (
          <div 
            className={`absolute inset-0 text-ink-muted/40 pointer-events-none font-sans ${
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
