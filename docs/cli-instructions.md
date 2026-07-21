# Manual de Instrucciones: PSICO-AGENDA DEV CLI

El proyecto cuenta con una herramienta CLI local para asistir en el desarrollo y la simulación de estados de datos.

## Ejecución

Podés invocar a la interfaz CLI usando `npm` desde la raíz del proyecto:

```bash
npm run cli -- <comando>
```

O bien directamente llamando a Node:

```bash
node bin/psico-cli.js <comando>
```

---

## Comandos Disponibles

### 1. `seed`
Genera una plantilla JSON estructurada de pacientes demo customizados en la carpeta `public/` para uso de simulaciones.
```bash
npm run cli -- seed
```

### 2. `clear`
Limpia los archivos locales generados de caché o exportaciones temporales.
```bash
npm run cli -- clear
```

### 3. `export`
Exporta y comprueba la ruta local de la base de datos de simulación en `public/demo-db.json`.
```bash
npm run cli -- export
```

### 4. `import <ruta-archivo>`
Copia un archivo JSON externo al directorio de desarrollo para cargarlo como base de datos demo.
```bash
npm run cli -- import ./backup.json
```

### 5. `sync-config <normal|slow|fail>`
Configura el simulador de red local.
- `normal`: comportamiento estándar.
- `slow`: añade un delay de 4 segundos antes de procesar llamadas con Drive.
- `fail`: genera errores inmediatos de red al sincronizar con Drive.
```bash
npm run cli -- sync-config slow
```

### 6. `evict-simulation`
Simula el algoritmo de limpieza de caché (eviction) de 180 días contra los datos demo locales y reporta qué registros serían optimizados.
```bash
npm run cli -- evict-simulation
```

### 7. `--help` o `-h`
Muestra el panel de ayuda con el listado de comandos.
```bash
npm run cli -- --help
```
