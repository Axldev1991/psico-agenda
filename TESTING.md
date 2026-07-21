# Guía de Testing: PSICO-AGENDA

Esta guía documenta cómo mantenemos la calidad del código, específicamente para nuestra arquitectura de sincronización con Google Drive y gestión de caché.

## 1. Stack Tecnológico
Usamos **Vitest** por su velocidad y soporte nativo de TypeScript.

## 2. Cómo ejecutar los tests
Para ejecutar la suite de pruebas, simplemente corre:

```bash
pnpm test
```

## 3. Filosofía de Testing
En este proyecto, la **Lógica de Negocio** es lo más importante. Por eso nos enfocamos en:
- **Unit Tests:** Validar algoritmos de evicción, lógica de sincronización y estados del caché (`DriveSyncService`).
- **Mocks:** Como interactuamos con servicios externos (Google Drive) y bases de datos (IndexedDB/Dexie), **siempre** debemos mockear estas dependencias para tener tests determinísticos y rápidos.

## 4. Patrón de Mocking
Para evitar problemas de instanciación con clases que tienen dependencias, utilizamos `vi.hoisted`. Este patrón asegura que los mocks se carguen antes que cualquier otro código del módulo.

### Ejemplo de implementación (en `DriveSyncService.test.ts`):
```typescript
const { mockSave, mockGetAll } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockGetAll: vi.fn(),
}));

vi.mock('../db/dexie-patient.repository', () => {
  return {
    DexiePatientRepository: class {
      getAll = mockGetAll;
      save = mockSave;
    }
  };
});
```

## 5. Cómo agregar nuevos tests
1. Crea un archivo `.test.ts` junto al archivo que quieres testear (ej. `src/infrastructure/drive/drive-sync.service.test.ts`).
2. Usa los mocks existentes o crea nuevos siguiendo el patrón de `vi.hoisted`.
3. Mantén los tests aislados: usa `vi.clearAllMocks()` en el `beforeEach` para que el estado de un test no afecte al siguiente.
