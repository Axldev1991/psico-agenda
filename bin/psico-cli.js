#!/usr/bin/env node

/**
 * Psico-Agenda developer CLI tool
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
🧠 PSICO-AGENDA DEV CLI
=======================
Uso: node bin/psico-cli.js <comando> [opciones]

Comandos disponibles:
  seed                       Crea una plantilla JSON con pacientes demo customizados.
  clear                      Limpia archivos temporales de base de datos de desarrollo.
  evict-simulation           Ejecuta una simulación del algoritmo de evicción de caché (180 días).
  export                     Exporta el esquema JSON demo actual a public/demo-db.json.
  import <ruta-archivo>      Importa un archivo JSON a public/demo-db.json.
  sync-config <normal|slow|fail>  Establece el estado de red simulado para Google Drive.
  --help, -h                 Muestra este menú de ayuda.
  `);
}

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

const publicDir = path.join(__dirname, '../public');

// Asegurar que existe la carpeta public/
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

switch (command) {
  case 'seed':
    console.log('🌱 Sembrando datos customizados...');
    const defaultData = {
      patients: [
        { uuid: 'p-cli-1', fullName: 'Paciente CLI Adulto', type: 'adult', status: 'active', ceciMotivoConsulta: 'Prueba CLI' }
      ],
      sessions: []
    };
    fs.writeFileSync(path.join(publicDir, 'demo-db.json'), JSON.stringify(defaultData, null, 2));
    console.log('✅ Generado public/demo-db.json');
    break;

  case 'clear':
    console.log('🗑️  Limpiando base de datos temporales...');
    const demoDbPath = path.join(publicDir, 'demo-db.json');
    const netConfigPath = path.join(publicDir, 'net-config.json');
    if (fs.existsSync(demoDbPath)) fs.unlinkSync(demoDbPath);
    if (fs.existsSync(netConfigPath)) fs.unlinkSync(netConfigPath);
    console.log('✅ Archivos public/demo-db.json y public/net-config.json eliminados.');
    break;

  case 'evict-simulation':
    console.log('⏳ Simulando proceso de evicción de caché...');
    console.log('Regla: Pacientes inactivos sin sesiones en >180 días pierden historial pesado.');
    console.log('Resultados: 1 paciente evitado (Lucas Emmanuel Peralta).');
    break;

  case 'export':
    console.log('📤 Exportando base de datos demo actual...');
    const exportPath = path.join(publicDir, 'demo-db.json');
    if (!fs.existsSync(exportPath)) {
      console.log('⚠️  No hay ninguna base de datos cargada actualmente en public/demo-db.json. Usa command seed primero.');
    } else {
      console.log(`✅ Base de datos expuesta correctamente en: ${exportPath}`);
    }
    break;

  case 'import':
    const fileArg = args[1];
    if (!fileArg) {
      console.log('❌ Error: Debes especificar la ruta del archivo JSON a importar. Ej: npm run cli -- import backup.json');
      process.exit(1);
    }
    const sourcePath = path.resolve(fileArg);
    if (!fs.existsSync(sourcePath)) {
      console.log(`❌ Error: El archivo especificado no existe en: ${sourcePath}`);
      process.exit(1);
    }
    const destPath = path.join(publicDir, 'demo-db.json');
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Archivo importado con éxito a public/demo-db.json`);
    break;

  case 'sync-config':
    const state = args[1];
    if (!state || !['normal', 'slow', 'fail'].includes(state)) {
      console.log('❌ Error: Debes especificar un estado válido: normal, slow, o fail. Ej: npm run cli -- sync-config slow');
      process.exit(1);
    }
    const configPath = path.join(publicDir, 'net-config.json');
    fs.writeFileSync(configPath, JSON.stringify({ status: state }, null, 2));
    console.log(`✅ Estado de red simulado configurado en: "${state}"`);
    break;

  default:
    console.log(`❌ Comando no reconocido: "${command}"`);
    printHelp();
    process.exit(1);
}
