"use client";

import { useState, useEffect } from "react";
import { GoogleDriveRepository } from "../../infrastructure/drive/google-drive.repository";
import { DriveSyncService } from "../../infrastructure/drive/drive-sync.service";

const driveRepo = new GoogleDriveRepository();
const syncService = new DriveSyncService();

// Shared global state for all useGoogleDrive instances
let globalGoogleToken: string | null = null;
let globalSyncStatus: "idle" | "syncing" | "synced" | "error" = "idle";
let globalLastSynced: string | null = null;
let globalErrorMessage: string | null = null;
let globalLoading = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function useGoogleDrive() {
  const [googleToken, setGoogleToken] = useState<string | null>(globalGoogleToken);
  const [loading, setLoading] = useState(globalLoading);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">(globalSyncStatus);
  const [lastSynced, setLastSynced] = useState<string | null>(globalLastSynced);
  const [errorMessage, setErrorMessage] = useState<string | null>(globalErrorMessage);

  useEffect(() => {
    const handleUpdate = () => {
      setGoogleToken(globalGoogleToken);
      setLoading(globalLoading);
      setSyncStatus(globalSyncStatus);
      setLastSynced(globalLastSynced);
      setErrorMessage(globalErrorMessage);
    };

    listeners.add(handleUpdate);

    if (typeof window !== "undefined") {
      const savedSync = localStorage.getItem("gd-last-synced");
      if (savedSync && !globalLastSynced) {
        globalLastSynced = savedSync;
        setLastSynced(savedSync);
      }

      const cachedToken = localStorage.getItem("gd-access-token");
      if (cachedToken && !globalGoogleToken) {
        globalGoogleToken = cachedToken;
        setGoogleToken(cachedToken);
        driveRepo.setAccessToken(cachedToken);
      }

      syncService.evictOldCache();
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const setGlobalState = (updates: {
    googleToken?: string | null;
    loading?: boolean;
    syncStatus?: "idle" | "syncing" | "synced" | "error";
    lastSynced?: string | null;
    errorMessage?: string | null;
  }) => {
    if (updates.googleToken !== undefined) {
      globalGoogleToken = updates.googleToken;
      if (updates.googleToken) {
        driveRepo.setAccessToken(updates.googleToken);
      }
    }
    if (updates.loading !== undefined) globalLoading = updates.loading;
    if (updates.syncStatus !== undefined) globalSyncStatus = updates.syncStatus;
    if (updates.lastSynced !== undefined) globalLastSynced = updates.lastSynced;
    if (updates.errorMessage !== undefined) globalErrorMessage = updates.errorMessage;
    emitChange();
  };

  const connectGoogle = async () => {
    setGlobalState({ loading: true, errorMessage: null });
    try {
      const token = await driveRepo.login();
      localStorage.setItem("gd-access-token", token);
      setGlobalState({ googleToken: token, syncStatus: "idle", loading: false });
    } catch (err: any) {
      console.error(err);
      setGlobalState({
        errorMessage: "No se pudo conectar con Google Drive: " + err.message,
        syncStatus: "error",
        loading: false,
      });
    }
  };

  const disconnectGoogle = () => {
    driveRepo.logout();
    localStorage.removeItem("gd-access-token");
    setGlobalState({ googleToken: null, syncStatus: "idle" });
  };

  const checkSimulatedNetwork = async () => {
    try {
      const res = await fetch("/net-config.json");
      if (res.ok) {
        const config = await res.json();
        if (config.status === "fail") {
          throw new Error("Google Drive synchronization simulated failure");
        }
        if (config.status === "slow") {
          console.log("⏳ Simulación de red lenta: esperando 4 segundos...");
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
      }
    } catch (e: any) {
      if (e.message.includes("simulated")) throw e;
    }
  };

  const downloadPatientHistory = async (uuid: string): Promise<void> => {
    if (!googleToken) throw new Error("No hay una sesión activa de Google.");
    await checkSimulatedNetwork();
    await syncService.downloadPatientHistory(uuid, googleToken);
  };

  const preloadAllForOffline = async () => {
    if (!googleToken) throw new Error("No hay una sesión activa de Google.");
    setGlobalState({ loading: true, syncStatus: "syncing", errorMessage: null });
    try {
      await checkSimulatedNetwork();
      await syncService.preloadAllForOffline(googleToken);
      setGlobalState({ syncStatus: "synced", loading: false });
    } catch (err: any) {
      console.error("Error en pre-carga completa offline:", err);
      setGlobalState({
        errorMessage: "La pre-carga offline falló: " + err.message,
        syncStatus: "error",
        loading: false,
      });
    }
  };

  const performSync = async () => {
    if (!googleToken) return;
    setGlobalState({ loading: true, syncStatus: "syncing", errorMessage: null });

    try {
      await checkSimulatedNetwork();
      const result = await syncService.performSync(googleToken);
      localStorage.setItem("gd-last-synced", result.lastSynced);
      setGlobalState({ lastSynced: result.lastSynced, syncStatus: "synced", loading: false });
    } catch (err: any) {
      console.error("Error en sincronización selectiva:", err);
      const errMessage = err.message || "";
      if (
        errMessage.includes("401") ||
        errMessage.includes("unauthorized") ||
        errMessage.includes("invalid_credentials") ||
        errMessage.includes("auth") ||
        errMessage.includes("sesión activa")
      ) {
        disconnectGoogle();
        setGlobalState({
          errorMessage: "La sesión de Google Drive expiró. Por favor, conectate de nuevo.",
          syncStatus: "error",
          loading: false,
        });
      } else {
        setGlobalState({
          errorMessage: "Sincronización fallida: " + errMessage,
          syncStatus: "error",
          loading: false,
        });
      }
    }
  };

  return {
    googleToken,
    loading,
    syncStatus,
    lastSynced,
    errorMessage,
    connectGoogle,
    disconnectGoogle,
    performSync,
    downloadPatientHistory,
    preloadAllForOffline,
  };
}
