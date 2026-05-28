# Especificación Funcional: Hito 1 - PSICO-AGENDA

Esta especificación detalla las reglas de negocio, el comportamiento esperado y el alcance de las funcionalidades que se implementarán en el **Hito 1: Infraestructura y Núcleo de Seguridad**.

---

## 1. Requerimientos Funcionales

### RF-1.1: Base de Datos Offline-First
*   **Comportamiento**: La aplicación debe estar lista para usar de forma instantánea sin necesidad de esperar a que la red responda.
*   **Almacenamiento Local**: Todo alta, modificación o consulta de pacientes se realiza directamente sobre una base de datos IndexedDB local (vía Dexie.js).
*   **Resiliencia**: Si el usuario no tiene conexión o la API de Google Drive está caída, la app debe seguir operando localmente al 100% de su capacidad.

### RF-1.2: Gestión Básica de Ficha de Pacientes
*   **Campos Requeridos**:
    *   `uuid`: Identificador único (generado con `crypto.randomUUID()`).
    *   `fullName`: Nombre y apellido del paciente.
    *   `email`: Correo electrónico (opcional).
    *   `phone`: Teléfono de contacto (opcional).
    *   `healthInsurance`: Prepaga/Obra Social (opcional).
    *   `affiliateNumber`: Número de afiliado (opcional).
    *   `sessionPrice`: Costo acordado por sesión (numérico).
    *   `createdAt`: Fecha de registro en formato ISO.
    *   `updatedAt`: Fecha de última modificación en formato ISO.

### RF-1.3: Autenticación Segura y Vinculación con Google Drive
*   **Flujo**: El usuario inicia sesión mediante Google OAuth2.
*   **Alcance**: Solo se requerirá acceso al directorio de aplicación (`drive.appdata` o `drive.file`) para resguardar la privacidad de los datos.
*   **Sincronización en segundo plano**: Cada vez que se guarde un cambio localmente, se encolará la sincronización en segundo plano con la nube de Drive en formato JSON.

---

## 2. Criterios de Aceptación

1.  **Carga instantánea**: Al abrir la app, la lista de pacientes debe renderizarse en menos de 100ms leyendo de Dexie.js.
2.  **Validación de esquemas**: No se puede registrar un paciente sin Nombre Completo o con un Costo de Sesión negativo.
3.  **Seguridad Local**: Los datos médicos no deben exponerse en almacenamiento no seguro como localStorage clásico. Se utiliza IndexedDB de forma estructurada.
