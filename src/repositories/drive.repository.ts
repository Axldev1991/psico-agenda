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
   * Sube el JSON comprimido de la base de datos local al contenedor aislado 'appDataFolder'.
   * @param jsonData String con el JSON serializado de pacientes y sesiones.
   */
  uploadBackup(jsonData: string): Promise<void>;

  /**
   * Descarga el JSON actual del backup desde el contenedor aislado 'appDataFolder'.
   * Retorna el string JSON o null si el archivo aún no existe en Drive.
   */
  downloadBackup(): Promise<string | null>;
}
