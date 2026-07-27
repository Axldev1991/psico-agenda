export interface IDriveRepository {
  /**
   * Inicializa el flujo de login oficial de Google Identity Services.
   * Retorna el Access Token de OAuth2 otorgado por el usuario.
   */
  login(): Promise<string>;

  /**
   * Elimina la sesión activa de Google y limpia las credenciales.
   */
  logout(): void;

  /**
   * Configura el token de acceso activo.
   */
  setAccessToken(token: string | null): void;

  /**
   * Sube el JSON comprimido de la base de datos local al contenedor aislado 'appDataFolder'.
   * @param jsonData String con el JSON serializado de pacientes y sesiones.
   */
  uploadBackup(jsonData: string): Promise<void>;

  /**
   * Descarga el JSON actual del backup desde el contenedor aislado 'appDataFolder'.
   * Retorna el string JSON o null si el archivo aún no existe en Drive.
   */
  downloadBackup(): Promise<string | null>;

  /**
   * Busca o crea una carpeta en base a su nombre y opcionalmente su padre.
   */
  getOrCreateFolder(name: string, parentId?: string): Promise<string>;

  /**
   * Sube o actualiza un archivo en una carpeta específica en Drive.
   */
  uploadFileToFolder(folderId: string, filename: string, mimeType: string, content: string | Blob): Promise<string>;

  /**
   * Descarga el contenido de un archivo por su nombre dentro de una carpeta específica.
   */
  downloadFileFromFolder(folderId: string, filename: string): Promise<string | null>;

  /**
   * Busca una carpeta usando un sufijo dentro de un directorio padre específico.
   */
  findFolderBySuffix(suffix: string, parentId: string): Promise<{ id: string; name: string } | null>;

  /**
   * Renombra una carpeta o archivo en Google Drive.
   */
  renameFileOrFolder(fileId: string, newName: string): Promise<void>;

  /**
   * Obtiene los metadatos básicos de un archivo en una carpeta específica.
   */
  getFileMetadata(folderId: string, filename: string): Promise<{ id: string; modifiedTime: string; name: string } | null>;
}
