import { IDriveRepository } from "../../repositories/drive.repository";
import { driveLogger } from "./drive-logger";

// Declaración global para TypeScript
declare global {
  interface Window {
    google?: any;
  }
}

export class GoogleDriveRepository implements IDriveRepository {
  private clientId: string;
  private accessToken: string | null = null;
  private gisScriptLoaded = false;
  private appDataFolderId: string | null = null;

  constructor() {
    // Leer Client ID de variables de entorno o usar un valor por defecto didáctico
    this.clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
  }

  /**
   * Carga el script oficial de Google Identity Services de forma dinámica e inofensiva.
   */
  private loadGisScript(): Promise<void> {
    if (this.gisScriptLoaded && window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gisScriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => reject(new Error("Error cargando Google Identity Services Client: " + err));
      document.body.appendChild(script);
    });
  }

  /**
   * Inicializa el TokenClient de Google Identity Services y abre el pop-up oficial.
   */
  async login(): Promise<string> {
    await this.loadGisScript();

    if (!window.google?.accounts?.oauth2) {
      throw new Error("El SDK de Google Identity Services no está listo.");
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file",
          callback: (response: any) => {
            if (response.error) {
              reject(new Error("Autenticación fallida: " + response.error));
              return;
            }
            this.accessToken = response.access_token;
            resolve(response.access_token);
          },
        });

        // Solicitar token (abrir popup)
        client.requestAccessToken({ prompt: "consent" });
      } catch (err) {
        reject(err);
      }
    });
  }

  logout(): void {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log("Token de Google revocado de forma segura.");
        });
      } catch (e) {
        console.warn("No se pudo revocar el token en los servidores de Google:", e);
      }
    }
    this.accessToken = null;
  }

  setAccessToken(token: string | null): void {
    console.log("[GoogleDriveRepository] Setting token:", token ? `${token.substring(0, 15)}...` : "null");
    driveLogger.log("info", `Configurando token de acceso: ${token ? `${token.substring(0, 15)}...` : "null"}`);
    this.accessToken = token;
  }

  /**
   * Busca el ID del archivo backup existente en la carpeta de la app.
   */
  private async findBackupFileId(): Promise<string | null> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const url = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='psico-agenda-backup.json'&fields=files(id)";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error buscando el archivo de backup en Google Drive.");
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  /**
   * Sube o actualiza el archivo backup en el 'appDataFolder'.
   */
  async uploadBackup(jsonData: string): Promise<void> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const fileId = await this.findBackupFileId();

    if (fileId) {
      // Actualizar archivo existente (PATCH)
      const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: jsonData,
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el backup en Google Drive.");
      }
    } else {
      // Crear nuevo archivo (Multipart POST: Metadata + Contenido)
      const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      
      const metadata = {
        name: "psico-agenda-backup.json",
        parents: ["appDataFolder"],
      };

      const boundary = "314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--\r\n`;

      const body = [
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        delimiter,
        'Content-Type: application/json\r\n\r\n',
        jsonData,
        closeDelimiter
      ].join("");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error("Error al crear el backup en Google Drive: " + errText);
      }
    }
  }

  /**
   * Descarga el JSON actual del backup desde el 'appDataFolder'.
   */
  async downloadBackup(): Promise<string | null> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const fileId = await this.findBackupFileId();
    if (!fileId) return null; // No hay backup previo aún

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error al descargar el backup desde Google Drive.");
    }

    return await response.text();
  }

  /**
   * Busca o crea una carpeta en base a su nombre y opcionalmente su padre.
   */
  async getOrCreateFolder(name: string, parentId?: string): Promise<string> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    } else {
      query += ` and 'root' in parents`;
    }

    const isAppData = parentId === "appDataFolder" || (this.appDataFolderId && parentId === this.appDataFolderId);
    const spaces = isAppData ? "appDataFolder" : "drive";

    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=${spaces}&q=${encodeURIComponent(query)}&fields=files(id)`;
    driveLogger.log("request", `GET Buscar carpeta: "${name}" (Espacio: ${spaces}, Padre: ${parentId || "root"})`, { query });

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      driveLogger.log("error", `Error buscando carpeta "${name}": ${response.status} - ${errText}`);
      throw new Error(`Error buscando la carpeta "${name}" en Google Drive: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      driveLogger.log("response", `Carpeta encontrada: "${name}" -> ID: ${folderId}`);
      if (name === "patients" && parentId === "appDataFolder") {
        this.appDataFolderId = folderId;
      }
      return folderId;
    }

    // Crear carpeta
    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const body: any = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      body.parents = [parentId];
    }

    driveLogger.log("request", `POST Crear carpeta: "${name}" (Padre: ${parentId || "root"})`);

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      driveLogger.log("error", `Error al crear carpeta "${name}": ${createResponse.status} - ${errText}`);
      throw new Error(`Error al crear la carpeta "${name}" en Google Drive.`);
    }

    const createdData = await createResponse.json();
    const folderId = createdData.id;
    driveLogger.log("response", `Carpeta creada exitosamente: "${name}" -> ID: ${folderId}`);
    if (name === "patients" && parentId === "appDataFolder") {
      this.appDataFolderId = folderId;
    }
    return folderId;
  }

  async uploadFileToFolder(folderId: string, filename: string, mimeType: string, content: string | Blob): Promise<string> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const isAppData = folderId === "appDataFolder" || (this.appDataFolderId && folderId === this.appDataFolderId);
    const spaces = isAppData ? "appDataFolder" : "drive";

    const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=${spaces}&q=${encodeURIComponent(query)}&fields=files(id)`;
    
    driveLogger.log("request", `GET Buscar archivo: "${filename}" (Carpeta: ${folderId}, Espacio: ${spaces})`);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    let fileId: string | null = null;
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.files && data.files.length > 0) {
        fileId = data.files[0].id;
        driveLogger.log("response", `Archivo encontrado en la nube -> ID: ${fileId}`);
      }
    }

    const textContent = typeof content === "string" ? content : await content.text();

    if (fileId) {
      const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      driveLogger.log("request", `PATCH Actualizar archivo: "${filename}" -> ID: ${fileId} (${mimeType})`);
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": mimeType,
        },
        body: textContent,
      });

      if (!response.ok) {
        const errText = await response.text();
        driveLogger.log("error", `Error actualizando archivo "${filename}": ${response.status} - ${errText}`);
        throw new Error(`Error al actualizar el archivo "${filename}" en Google Drive.`);
      }
      driveLogger.log("response", `Archivo "${filename}" actualizado exitosamente.`);
      return fileId;
    } else {
      const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      driveLogger.log("request", `POST Crear archivo: "${filename}" (Carpeta Padre: ${folderId})`);
      
      const metadata = {
        name: filename,
        parents: [folderId],
      };

      const boundary = "314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--\r\n`;

      const body = [
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        delimiter,
        `Content-Type: ${mimeType}\r\n\r\n`,
        textContent,
        closeDelimiter
      ].join("");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: body,
      });

      if (!response.ok) {
        const errText = await response.text();
        driveLogger.log("error", `Error al crear archivo "${filename}": ${response.status} - ${errText}`);
        throw new Error(`Error al crear el archivo "${filename}" en Google Drive: ` + errText);
      }

      const createdData = await response.json();
      const newFileId = createdData.id;
      driveLogger.log("response", `Archivo "${filename}" creado exitosamente -> ID: ${newFileId}`);
      return newFileId;
    }
  }

  /**
   * Descarga el contenido de un archivo por su nombre dentro de una carpeta específica.
   */
  async downloadFileFromFolder(folderId: string, filename: string): Promise<string | null> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const isAppData = folderId === "appDataFolder" || (this.appDataFolderId && folderId === this.appDataFolderId);
    const spaces = isAppData ? "appDataFolder" : "drive";

    const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=${spaces}&q=${encodeURIComponent(query)}&fields=files(id)`;
    
    driveLogger.log("request", `GET Buscar archivo para descarga: "${filename}" (Carpeta: ${folderId}, Espacio: ${spaces})`);
    
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      driveLogger.log("error", `Error buscando archivo "${filename}": ${response.status} - ${errText}`);
      throw new Error(`Error buscando el archivo "${filename}" en la carpeta.`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      driveLogger.log("response", `Archivo no encontrado: "${filename}"`);
      return null;
    }

    const fileId = data.files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    driveLogger.log("request", `GET Descargar contenido: "${filename}" -> ID: ${fileId}`);
    
    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!downloadResponse.ok) {
      const errText = await downloadResponse.text();
      driveLogger.log("error", `Error descargando contenido de "${filename}": ${downloadResponse.status} - ${errText}`);
      throw new Error(`Error al descargar el archivo "${filename}" desde Google Drive.`);
    }

    driveLogger.log("response", `Archivo "${filename}" descargado exitosamente.`);
    return await downloadResponse.text();
  }
}
