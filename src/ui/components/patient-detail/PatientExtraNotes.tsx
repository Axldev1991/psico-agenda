"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useExtraNotes } from "../../hooks/useExtraNotes";
import { useGoogleDrive } from "../../hooks/useGoogleDrive";
import { RichTextEditor } from "../RichTextEditor";
import { Icon } from "../common/Icon";

interface PatientExtraNotesProps {
  patientUuid: string;
}

export function PatientExtraNotes({ patientUuid }: PatientExtraNotesProps) {
  const { notes, loading, addNote, editNote, removeNote } = useExtraNotes({ patientUuid });
  const { googleToken, performSync } = useGoogleDrive();

  // Consolidar notas existentes del paciente si existiesen varias de la versión anterior
  const initialContent = useMemo(() => {
    if (!notes || notes.length === 0) return "";
    return notes.map((n) => n.content).join("<br/><br/>");
  }, [notes]);

  const [content, setContent] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const existingNoteUuidRef = useRef<string | null>(null);
  existingNoteUuidRef.current = notes && notes.length > 0 ? notes[0].uuid : null;

  // Inicializar el contenido cuando termina de cargar la consulta reactiva
  useEffect(() => {
    if (!loading && !isInitialized) {
      setContent(initialContent);
      contentRef.current = initialContent;
      setIsInitialized(true);
    }
  }, [loading, initialContent, isInitialized]);

  const handleEditorChange = (newHtml: string) => {
    setContent(newHtml);
    contentRef.current = newHtml;
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const textToSave = contentRef.current;
        const isEmpty = !textToSave || textToSave.trim() === "" || textToSave === "<p></p>" || textToSave === "<br>";

        if (isEmpty) {
          if (existingNoteUuidRef.current) {
            await removeNote(existingNoteUuidRef.current);
            existingNoteUuidRef.current = null;
          }
        } else {
          if (existingNoteUuidRef.current) {
            await editNote(existingNoteUuidRef.current, { content: textToSave });
          } else {
            const created = await addNote(textToSave, {
              patientUuid,
              uuid: crypto.randomUUID(),
            });
            existingNoteUuidRef.current = created.uuid;
          }
        }

        setIsSaving(false);
        setSaveFeedback(true);
        setTimeout(() => setSaveFeedback(false), 2000);

        // Programar sincronización con Drive si la sesión de Google está activa
        if (uploadTimeoutRef.current) {
          clearTimeout(uploadTimeoutRef.current);
        }
        if (googleToken) {
          uploadTimeoutRef.current = setTimeout(() => {
            performSync().catch(console.error);
          }, 15000);
        }
      } catch (err) {
        setIsSaving(false);
        console.error("Error auto-guardando anotaciones extras:", err);
      }
    }, 800);
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
    };
  }, []);

  if (loading || !isInitialized) {
    return (
      <div className="bg-surface border border-line rounded-b-3xl p-8 shadow-xs flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2.5 text-ink-sub text-sm font-medium">
          <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Cargando anotaciones extras...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-b-3xl p-5 sm:p-7 shadow-xs space-y-4">
      {/* Encabezado clínico sobrio sin tecnicismos */}
      <div className="border-b border-line pb-3.5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-base text-ink">
            Anotaciones Clínicas Extras
          </h3>
          <p className="text-sm text-ink-sub mt-0.5">
            Hoja de trabajo y notas clínicas del paciente fuera del expediente oficial.
          </p>
        </div>

        {/* Indicador de estado de guardado automático */}
        <div className="shrink-0 text-sm">
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Guardando...</span>
            </span>
          ) : saveFeedback ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-ok animate-fade-in">
              <Icon name="check" size={15} />
              <span>Guardado</span>
            </span>
          ) : (
            <span className="text-ink-sub/70 text-xs font-medium">
              Auto-guardado activo
            </span>
          )}
        </div>
      </div>

      {/* Hoja en blanco con editor enriquecido accesible (sin resaltadores de colores) */}
      <div data-testid="patient-extra-notes-sheet" className="rounded-xl border border-line/80 overflow-hidden bg-white shadow-2xs">
        <RichTextEditor
          key={patientUuid + "_" + (isInitialized ? "loaded" : "pending")}
          initialValue={initialContent}
          onChange={handleEditorChange}
          showHighlighters={false}
          placeholder="Escribí aquí las anotaciones clínicas extras, hipótesis, temas de supervisión o interconsulta..."
          minHeight="480px"
        />
      </div>
    </div>
  );
}
