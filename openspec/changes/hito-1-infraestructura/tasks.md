# Lista de Tareas (Tasks): Hito 1 - PSICO-AGENDA

Este checklist detalla los pasos mecánicos ordenados para implementar las bases del proyecto siguiendo la arquitectura modular diseñada.

---

## Fase 1: Inicialización del Entorno
- [ ] **Tarea 1.1**: Inicializar la aplicación con `npx create-next-app` configurando TypeScript y Tailwind CSS en el directorio raíz.
- [ ] **Tarea 1.2**: Limpiar el boilerplate de Next.js (archivos base de la carpeta `app/` y estilos globales) para dejar una estructura minimalista.
- [ ] **Tarea 1.3**: Instalar las dependencias core del Hito 1 (`dexie`, `dexie-react-hooks`).

## Fase 2: Capas de Dominio e Interfaces
- [ ] **Tarea 2.1**: Crear archivo de dominio `src/domain/patient.types.ts` con la estructura de datos pura.
- [ ] **Tarea 2.2**: Crear la interfaz contract `src/repositories/patient.repository.ts` para abstraer la persistencia.

## Fase 3: Capa de Infraestructura (Persistencia Local)
- [ ] **Tarea 3.1**: Configurar la base de datos IndexedDB local con Dexie en `src/infrastructure/db/dexie.db.ts`.
- [ ] **Tarea 3.2**: Implementar el repositorio de base de datos local `src/infrastructure/db/dexie-patient.repository.ts`.

## Fase 4: Capa de Presentación (Controladores y UI)
- [ ] **Tarea 4.1**: Crear el controlador react `src/ui/hooks/usePatients.ts`.
- [ ] **Tarea 4.2**: Diseñar una interfaz visual premium y modular con Tailwind CSS en `src/app/page.tsx` (Dashboard con listado de pacientes y botón/modal para registrar un nuevo paciente).

## Fase 5: Verificación y Pruebas
- [ ] **Tarea 5.1**: Verificar la reactividad del guardado local y el comportamiento offline simulado.
