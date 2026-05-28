# Diseño Arquitectónico: Hito 1 - PSICO-AGENDA

Este documento define las interfaces de TypeScript, las clases de infraestructura y el diseño detallado para el Hito 1, asegurando modularidad pura y alta legibilidad para el aprendizaje.

---

## 1. Modelado de Datos (Domain Layer)

Ubicación: `src/domain/patient.types.ts`
```typescript
export interface Patient {
  uuid: string;
  fullName: string;
  email?: string;
  phone?: string;
  healthInsurance?: string;
  affiliateNumber?: string;
  sessionPrice: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Abstracción de Persistencia (Repository Contract)

Ubicación: `src/repositories/patient.repository.ts`
```typescript
import { Patient } from '../domain/patient.types';

export interface IPatientRepository {
  getAll(): Promise<Patient[]>;
  getByUuid(uuid: string): Promise<Patient | undefined>;
  save(patient: Patient): Promise<void>;
  delete(uuid: string): Promise<void>;
}
```

---

## 3. Implementación de Infraestructura (Dexie DB)

Ubicación: `src/infrastructure/db/dexie.db.ts`
```typescript
import Dexie, { Table } from 'dexie';
import { Patient } from '../../domain/patient.types';

export class PsicoAgendaDatabase extends Dexie {
  patients!: Table<Patient>;

  constructor() {
    super('PsicoAgendaDB');
    this.version(1).stores({
      patients: 'uuid, fullName, createdAt' // uuid es la clave primaria
    });
  }
}

export const db = new PsicoAgendaDatabase();
```

Ubicación: `src/infrastructure/db/dexie-patient.repository.ts`
```typescript
import { IPatientRepository } from '../../repositories/patient.repository';
import { Patient } from '../../domain/patient.types';
import { db } from './dexie.db';

export class DexiePatientRepository implements IPatientRepository {
  async getAll(): Promise<Patient[]> {
    return db.patients.toArray();
  }

  async getByUuid(uuid: string): Promise<Patient | undefined> {
    return db.patients.get(uuid);
  }

  async save(patient: Patient): Promise<void> {
    await db.patients.put(patient);
  }

  async delete(uuid: string): Promise<void> {
    await db.patients.delete(uuid);
  }
}
```

---

## 4. Controladores React (Presentation Layer - Custom Hooks)

Para aislar a los componentes visuales de React de las clases de repositorios directos, crearemos un Custom Hook que actúe como "Presenter / Controlador" y maneje el estado de React.

Ubicación: `src/ui/hooks/usePatients.ts`
```typescript
import { useState, useEffect } from 'react';
import { Patient } from '../../domain/patient.types';
import { DexiePatientRepository } from '../../infrastructure/db/dexie-patient.repository';

const repository = new DexiePatientRepository();

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    const data = await repository.getAll();
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const addPatient = async (patientData: Omit<Patient, 'uuid' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      uuid: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.save(newPatient);
    await fetchPatients();
  };

  return { patients, loading, addPatient, refresh: fetchPatients };
}
```
> [!NOTE]
> De esta forma, tus componentes de React solo harán `const { patients, addPatient } = usePatients()` y no tendrán idea de que existe Dexie.js corriendo por detrás. ¡Desacoplamiento absoluto!
