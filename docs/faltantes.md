# Requerimientos Faltantes y Pendientes

Este documento detalla las funcionalidades, ajustes y requerimientos pendientes de implementar en el sistema **PSICO-AGENDA**.

---

## 📋 Lista de Faltantes

### 👤 Gestión de Pacientes

- [x] **Diferenciación de tipo de paciente:**
  - Clasificar a los pacientes entre **Adultos** e **Infanto-Juveniles** (con filtros reactivos en el fichero).
- [x] **Edad del paciente:**
  - Agregar el campo de **Edad** en el perfil/ficha del paciente (cálculo automático a partir de `birthDate`).
- [x] **Ficha del paciente (CECI):**
  - Incorporar la ficha del paciente enviada por CECI al sistema (`CeciForm` en detalle de paciente y modal).
- [x] **Ordenamiento alfabético:**
  - Ordenar la lista de pacientes alfabéticamente de forma predeterminada.
- [x] **Categorización por estado de tratamiento:**
  - Clasificar a los pacientes en categorías: **En Tratamiento** y **De alta** (inactivos).

### 📝 Sesiones e Historias Clínicas

- [ ] **Dibujos de pacientes infanto-juveniles:**
  - **⚠️ IMPORTANTE:** Los dibujos físicos realizados por pacientes infanto-juveniles **NO SE DIGITALIZAN**.
- [ ] **Índice de sesiones mejorado:**
  - Agregar una **descripción** a cada sesión en el índice.
  - Agregar una **marca de color** visual a cada sesión en el índice para categorizarlas o destacar su estado.
