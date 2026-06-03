# Plan de Tareas (Tasks): Hardening de pnpm

## Checklist de Tareas

- [ ] **Configuración de Seguridad en la Raíz**
  - [ ] Crear el archivo `.npmrc` con las directivas de seguridad (`ignore-scripts`, `audit`, `minimum-release-age`, `strict-peer-dependencies`).
- [ ] **Hardening en package.json**
  - [ ] Añadir campo `"files"` para listar directorios y archivos autorizados ante publicación.
  - [ ] Añadir script `"lint:lockfile"` ejecutando `lockfile-lint` con validación HTTPS y dominio oficial.
- [ ] **Instalación de Dependencias**
  - [ ] Instalar la herramienta `lockfile-lint` como dependencia de desarrollo usando la bandera `--ignore-scripts`.
- [ ] **Verificación de Seguridad**
  - [ ] Ejecutar `pnpm run lint:lockfile` para corroborar el estado del lockfile.
  - [ ] Validar que `pnpm build` compila correctamente.
