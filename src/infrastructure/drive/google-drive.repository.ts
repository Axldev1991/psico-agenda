import { IDriveRepository } from "../../repositories/drive.repository";

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

    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`;
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error buscando la carpeta "${name}" en Google Drive.`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const body: any = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      body.parents = [parentId];
    }

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!createResponse.ok) {
      throw new Error(`Error al crear la carpeta "${name}" en Google Drive.`);
    }

    const createdData = await createResponse.json();
    return createdData.id;
  }

  /**
   * Sube o actualiza un archivo en una carpeta específica en Drive.
   */
  async uploadFileToFolder(folderId: string, filename: string, mimeType: string, content: string | Blob): Promise<string> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`;
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
      }
    }

    const textContent = typeof content === "string" ? content : await content.text();

    if (fileId) {
      const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": mimeType,
        },
        body: textContent,
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar el archivo "${filename}" en Google Drive.`);
      }
      return fileId;
    } else {
      const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      
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
        throw new Error(`Error al crear el archivo "${filename}" en Google Drive: ` + errText);
      }

      const createdData = await response.json();
      return createdData.id;
    }
  }

  /**
   * Descarga el contenido de un archivo por su nombre dentro de una carpeta específica.
   */
  async downloadFileFromFolder(folderId: string, filename: string): Promise<string | null> {
    if (!this.accessToken) throw new Error("No hay una sesión activa de Google.");

    const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id)`;
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error buscando el archivo "${filename}" en la carpeta.`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      return null;
    }

    const fileId = data.files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Error al descargar el archivo "${filename}" desde Google Drive.`);
    }

    return await downloadResponse.text();
  }
}
