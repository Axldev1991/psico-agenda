"use client";

import { useState, useEffect } from "react";
import { GoogleDriveRepository } from "../../infrastructure/drive/google-drive.repository";
import { DriveSyncService } from "../../infrastructure/drive/drive-sync.service";
import { driveLogger } from "../../infrastructure/drive/drive-logger";

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

  const getValidToken = async (): Promise<string | null> => {
    if (!globalGoogleToken) return null;

    if (driveRepo.isTokenExpired()) {
      try {
        driveLogger.log("info", "Token de Google Drive próximo a vencer o expirado. Intentando renovación silenciosa...");
        const refreshedToken = await driveRepo.login("");
        localStorage.setItem("gd-access-token", refreshedToken);
        setGlobalState({ googleToken: refreshedToken });
        return refreshedToken;
      } catch (e: any) {
        driveLogger.log("info", "Renovación silenciosa no disponible: " + (e?.message || e));
        return globalGoogleToken;
      }
    }

    return globalGoogleToken;
  };

  const connectGoogle = async () => {
    setGlobalState({ loading: true, errorMessage: null });
    try {
      const hasPriorSession = typeof window !== "undefined" && !!localStorage.getItem("gd-access-token");
      let token: string;
      try {
        token = await driveRepo.login(hasPriorSession ? "" : "consent");
      } catch (silentErr) {
        token = await driveRepo.login("consent");
      }
      localStorage.setItem("gd-access-token", token);
      setGlobalState({ googleToken: token, syncStatus: "idle", loading: false });
      // Sincronización automática inmediata al conectar
      await performSyncWithToken(token);
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("gd-access-token");
      localStorage.removeItem("gd-token-expires-at");
    }
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
    const activeToken = await getValidToken();
    if (!activeToken) throw new Error("No hay una sesión activa de Google.");
    await checkSimulatedNetwork();
    try {
      await syncService.downloadPatientHistory(uuid, activeToken);
    } catch (err: any) {
      const errMessage = err?.message || "";
      if (
        errMessage.includes("401") ||
        errMessage.includes("UNAUTHENTICATED") ||
        errMessage.includes("Invalid Credentials") ||
        errMessage.includes("authError")
      ) {
        disconnectGoogle();
        throw new Error("La sesión de Google Drive expiró. Por favor, volvé a conectar tu cuenta.");
      }
      throw err;
    }
  };

  const preloadAllForOffline = async () => {
    const activeToken = await getValidToken();
    if (!activeToken) throw new Error("No hay una sesión activa de Google.");
    setGlobalState({ loading: true, syncStatus: "syncing", errorMessage: null });
    try {
      await checkSimulatedNetwork();
      await syncService.preloadAllForOffline(activeToken);
      setGlobalState({ syncStatus: "synced", loading: false });
    } catch (err: any) {
      console.error("Error en pre-carga completa offline:", err);
      const errMessage = err?.message || "";
      if (
        errMessage.includes("401") ||
        errMessage.includes("UNAUTHENTICATED") ||
        errMessage.includes("Invalid Credentials") ||
        errMessage.includes("authError")
      ) {
        disconnectGoogle();
        setGlobalState({
          errorMessage: "La sesión de Google Drive expiró. Por favor, conectate de nuevo.",
          syncStatus: "error",
          loading: false,
        });
      } else {
        setGlobalState({
          errorMessage: "La pre-carga offline falló: " + err.message,
          syncStatus: "error",
          loading: false,
        });
      }
    }
  };

  const performSyncWithToken = async (token: string) => {
    if (!token) return;
    setGlobalState({ loading: true, syncStatus: "syncing", errorMessage: null });

    try {
      await checkSimulatedNetwork();
      const result = await syncService.performSync(token);
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

  const performSync = async () => {
    const activeToken = await getValidToken();
    if (activeToken) {
      await performSyncWithToken(activeToken);
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
    downloadDiagnosticLogs: () => driveLogger.downloadDiagnosticLogs(),
  };
}
