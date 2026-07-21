"use client";

import { useState, useEffect } from "react";
import { GoogleDriveRepository } from "../../infrastructure/drive/google-drive.repository";
import { DriveSyncService } from "../../infrastructure/drive/drive-sync.service";

const driveRepo = new GoogleDriveRepository();
const syncService = new DriveSyncService();

export function useGoogleDrive() {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leer estado de la sesión local inicial al montar el hook e iniciar evicción
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSync = localStorage.getItem("gd-last-synced");
      if (savedSync) setLastSynced(savedSync);

      const cachedToken = localStorage.getItem("gd-access-token");
      if (cachedToken) {
        setGoogleToken(cachedToken);
        driveRepo.setAccessToken(cachedToken);
      }

      // Ejecutar evicción silenciosa delegada en el servicio
      syncService.evictOldCache();
    }
  }, []);

  const connectGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = await driveRepo.login();
      setGoogleToken(token);
      localStorage.setItem("gd-access-token", token);
      setSyncStatus("idle");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("No se pudo conectar con Google Drive: " + err.message);
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectGoogle = () => {
    driveRepo.logout();
    setGoogleToken(null);
    localStorage.removeItem("gd-access-token");
    setSyncStatus("idle");
  };

  // Helper local para simular estados de red a través de la CLI
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
      // Si no existe el archivo o da error de parsing, simplemente continuar normal
    }
  };

  /**
   * Descarga el historial clínico y sesiones de un paciente específico de manera diferida.
   */
  const downloadPatientHistory = async (uuid: string): Promise<void> => {
    if (!googleToken) throw new Error("No hay una sesión activa de Google.");
    await checkSimulatedNetwork();
    await syncService.downloadPatientHistory(uuid, googleToken);
  };

  /**
   * Descarga en bucle todos los expedientes pendientes para habilitar el uso 100% offline.
   */
  const preloadAllForOffline = async () => {
    if (!googleToken) throw new Error("No hay una sesión activa de Google.");
    setLoading(true);
    setSyncStatus("syncing");
    setErrorMessage(null);
    try {
      await checkSimulatedNetwork();
      await syncService.preloadAllForOffline(googleToken);
      setSyncStatus("synced");
    } catch (err: any) {
      console.error("Error en pre-carga completa offline:", err);
      setErrorMessage("La pre-carga offline falló: " + err.message);
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sincronización selectiva delegada.
   */
  const performSync = async () => {
    if (!googleToken) return;
    setLoading(true);
    setSyncStatus("syncing");
    setErrorMessage(null);

    try {
      await checkSimulatedNetwork();
      const result = await syncService.performSync(googleToken);
      
      setLastSynced(result.lastSynced);
      localStorage.setItem("gd-last-synced", result.lastSynced);
      setSyncStatus("synced");
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
        setErrorMessage("La sesión de Google Drive expiró. Por favor, conectate de nuevo.");
      } else {
        setErrorMessage("Sincronización fallida: " + errMessage);
      }
      setSyncStatus("error");
    } finally {
      setLoading(false);
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
