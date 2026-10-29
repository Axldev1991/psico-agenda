"use client";

import React, { useState } from "react";
import { useExtraNotes } from "../../hooks/useExtraNotes";
import { ExtraNoteTag, ExtraNote } from "../../../domain/extra-note.types";
import { Icon } from "../common/Icon";

interface PatientExtraNotesProps {
  patientUuid: string;
}

const PREDEFINED_TAGS: { tag: ExtraNoteTag; label: string; colorClass: string }[] = [
  { tag: "supervisión", label: "Supervisión", colorClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60" },
  { tag: "interconsulta", label: "Interconsulta", colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" },
  { tag: "urgente", label: "Urgente", colorClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
];

export function PatientExtraNotes({ patientUuid }: PatientExtraNotesProps) {
  const { notes, loading, addNote, editNote, togglePin, removeNote } = useExtraNotes({ patientUuid });

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<ExtraNoteTag[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros de visualización
  const [filterTag, setFilterTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de edición inline
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTags, setEditingTags] = useState<ExtraNoteTag[]>([]);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  const toggleTag = (tag: ExtraNoteTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleEditingTag = (tag: ExtraNoteTag) => {
    setEditingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await addNote(content, {
        patientUuid,
        tags: selectedTags,
        isPinned,
      });
      setContent("");
      setSelectedTags([]);
      setIsPinned(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al guardar la nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (note: ExtraNote) => {
    setEditingUuid(note.uuid);
    setEditingContent(note.content);
    setEditingTags([...note.tags]);
  };

  const handleCancelEdit = () => {
    setEditingUuid(null);
    setEditingContent("");
    setEditingTags([]);
  };

  const handleSaveEdit = async (uuid: string) => {
    if (!editingContent.trim()) return;
    setIsEditingSaving(true);
    try {
      await editNote(uuid, {
        content: editingContent,
        tags: editingTags,
      });
      setEditingUuid(null);
    } catch (err) {
      alert("Error al actualizar la nota.");
    } finally {
      setIsEditingSaving(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (window.confirm("¿Seguro que deseás eliminar esta anotación?")) {
      await removeNote(uuid);
    }
  };

  // Filtrado reactivo en memoria
  const displayedNotes = notes.filter((note) => {
    if (filterTag === "pinned" && !note.isPinned) return false;
    if (filterTag !== "all" && filterTag !== "pinned" && !note.tags.includes(filterTag)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return note.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="bg-surface border border-line rounded-b-3xl p-6 md:p-8 shadow-xs max-h-[75vh] overflow-y-auto space-y-6">
      {/* Header descriptivo */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-serif font-bold text-base text-ink">
            Anotaciones Clínicas Extras
          </h3>
          <p className="text-sm text-ink-sub mt-0.5">
            Registro aislado para supervisión, interconsultas y notas de trabajo clínico fuera del expediente oficial.
          </p>
        </div>
        <span className="text-sm text-ink-sub/80 font-mono font-medium self-start sm:self-auto">
          IndexedDB + Google Drive Sync
        </span>
      </div>

      {/* Formulario de creación rápida */}
      <form onSubmit={handleCreate} className="bg-bg-base/40 border border-line rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div>
          <label htmlFor="extra-note-content" className="sr-only">
            Nueva Anotación Extra
          </label>
          <textarea
            id="extra-note-content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí una hipótesis, tema para supervisión, interconsulta o recordatorio clínico..."
            className="w-full bg-surface border border-line rounded-xl p-3 text-base text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary transition-colors resize-y min-h-[90px]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pills de Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-sub mr-1">Etiquetas:</span>
            {PREDEFINED_TAGS.map(({ tag, label, colorClass }) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm font-medium rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? `${colorClass} ring-2 ring-primary/40 font-semibold shadow-xs`
                      : "bg-surface text-ink-sub border-line hover:border-line-sub"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Toggle Fijar & Botón Guardar */}
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-ink select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-line text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" size={13} className={isPinned ? "text-primary fill-primary" : "text-ink-sub"} />
                Fijar al inicio
              </span>
            </label>

            <button
              type="submit"
              disabled={!content.trim() || isSaving}
              className="bg-primary text-white font-medium px-5 py-2 rounded-xl text-base hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Icon name="plus" size={15} />
              <span>{isSaving ? "Guardando..." : "Guardar Nota"}</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 font-medium">{String(errorMessage)}</p>
        )}
      </form>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTag("all")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
              filterTag === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-ink-sub border border-line hover:text-ink"
            }`}
          >
            Todas ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTag("pinned")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
              filterTag === "pinned"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-ink-sub border border-line hover:text-ink"
            }`}
          >
            <Icon name="pin" size={12} />
            Fijadas ({notes.filter((n) => n.isPinned).length})
          </button>
          {PREDEFINED_TAGS.map(({ tag, label }) => {
            const count = notes.filter((n) => n.tags.includes(tag)).length;
            if (count === 0) return null;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                  filterTag === tag
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface text-ink-sub border border-line hover:text-ink"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-sub">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en notas..."
            className="w-full bg-surface border border-line rounded-lg pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Lista de Anotaciones */}
      {loading ? (
        <div className="text-center py-12 text-sm text-ink-sub font-medium">
          Cargando anotaciones...
        </div>
      ) : displayedNotes.length === 0 ? (
        <div className="text-center py-16 text-base text-ink-sub font-medium bg-bg-base/30 rounded-2xl border border-dashed border-line space-y-1">
          <p>No hay anotaciones extras para este paciente.</p>
          <p className="text-sm text-ink-muted">Podés usar el cuadro superior para registrar notas clínicas de trabajo.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedNotes.map((note) => {
            const isEditing = editingUuid === note.uuid;
            const dateStr = new Date(note.createdAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={note.uuid}
                className={`bg-surface border rounded-2xl p-4 sm:p-5 transition-all shadow-xs space-y-3 ${
                  note.isPinned
                    ? "border-primary/40 bg-primary/[0.02] shadow-sm"
                    : "border-line hover:border-line-sub"
                }`}
              >
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Icon name="pin" size={11} className="fill-primary" />
                        Fijada
                      </span>
                    )}

                    {note.tags.map((tag) => {
                      const conf = PREDEFINED_TAGS.find((p) => p.tag === tag);
                      return (
                        <span
                          key={tag}
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            conf
                              ? conf.colorClass
                              : "bg-surface text-ink-sub border-line"
                          }`}
                        >
                          {tag}
                        </span>
                      );
                    })}

                    <time className="text-sm text-ink-sub font-mono">{dateStr}</time>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={note.isPinned ? "Desfijar" : "Fijar al inicio"}
                      onClick={() => togglePin(note.uuid)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        note.isPinned
                          ? "text-primary hover:bg-primary/10"
                          : "text-ink-sub hover:text-ink hover:bg-bg-base"
                      }`}
                    >
                      <Icon name="pin" size={14} className={note.isPinned ? "fill-primary" : ""} />
                    </button>

                    {!isEditing && (
                      <button
                        type="button"
                        title="Editar nota"
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 rounded-lg text-ink-sub hover:text-ink hover:bg-bg-base transition-colors cursor-pointer text-sm font-medium px-2.5"
                      >
                        Editar
                      </button>
                    )}

                    <button
                      type="button"
                      title="Eliminar nota"
                      onClick={() => handleDelete(note.uuid)}
                      className="p-1.5 rounded-lg text-ink-sub hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                {/* Contenido / Modo Edición */}
                {isEditing ? (
                  <div className="space-y-3 pt-1">
                    <textarea
                      rows={3}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full bg-bg-base border border-line rounded-xl p-3 text-base text-ink focus:outline-none focus:border-primary transition-colors"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {PREDEFINED_TAGS.map(({ tag, label, colorClass }) => {
                          const isSel = editingTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleEditingTag(tag)}
                              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                                isSel
                                  ? `${colorClass} font-semibold shadow-xs`
                                  : "bg-surface text-ink-sub border-line hover:border-line-sub"
                              }`}
                            >
                              {isSel ? "✓ " : "+ "}
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm text-ink-sub hover:text-ink font-medium rounded-lg cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={!editingContent.trim() || isEditingSaving}
                          onClick={() => handleSaveEdit(note.uuid)}
                          className="bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary-dark cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isEditingSaving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-ink font-sans whitespace-pre-wrap leading-relaxed pl-1">
                    {note.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
