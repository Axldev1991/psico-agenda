# Hoja de Ruta de Desarrollo: Psico-Agenda

**Cliente:** Lic. Cecilia A. Padin.  
**Desarrollador:** Axel  
**Fecha:** 7 de mayo de 2026


## 1. Visión del Proyecto

Desarrollo de una solución integral de gestión clínica con enfoque en la **Soberanía de Datos**. El objetivo es que toda la información sensible resida exclusivamente en el Google Drive de la profesional, garantizando privacidad total y eliminando la dependencia de servidores externos.

## 2. Etapas de Implementación

### Hito 1: Infraestructura y Núcleo de Seguridad

- **Entorno Next.js y Tecnología PWA (Progressive Web App):** Preparamos la aplicación para que sea "instalable" tanto en tu PC como en tu celular. Esto permite usarla como una app nativa, con su propio icono, sin necesidad de descargarla de una tienda de aplicaciones.

- **Autenticación Google OAuth2:** Configuramos el acceso seguro mediante tu cuenta de Google. Esto garantiza que solo vos puedas entrar, sin necesidad de recordar nuevas contraseñas.

- **Motor de Sincronización con Google Drive:** Implementamos la lógica que guarda automáticamente toda tu información en tu propia nube de Google (Capa de persistencia). Cada cambio se respalda en tiempo real.

- **Base de datos local (PouchDB/Dexie):** Configuramos una memoria interna de alta velocidad para que la aplicación responda instantáneamente y sea fluida, permitiendo el trabajo incluso con conexiones a internet inestables.

> **Tiempo estimado de desarrollo:** 20 horas.

### Hito 2: Gestión de Pacientes y Agenda Inteligente

- **Panel de Administración de Pacientes:** Centralizamos toda la información de tus pacientes en fichas digitales completas y fáciles de organizar, incluyendo datos de contacto y prepagas.

- **Calendario Dinámico con Turnos Recurrentes (rrule.js):** Automatizamos tu agenda para que los turnos semanales o quincenales se carguen solos para todo el año, ahorrándote tiempo de carga manual.

- **Gestión de Feriados y Vacaciones (date-fns):** La aplicación reconoce automáticamente los feriados nacionales y te permite bloquear tus periodos de descanso con un solo clic, ajustando los turnos de forma inteligente.

> **Tiempo estimado de desarrollo:** 30 horas.

### Hito 3: Módulo de Historias Clínicas y Privacidad

- **Editor de Notas Profesionales con Autoguardado:** Un espacio de escritura limpio y sin distracciones que guarda tu progreso automáticamente para evitar cualquier pérdida de información sensible.

- **Buscador Inteligente y Sistema de Etiquetas:** Filtros avanzados para encontrar rápidamente patrones clínicos o palabras clave dentro de todas tus historias clínicas de forma instantánea.

- **Generación de Archivos Word (.docx) por Sesión (docx.js):** Cada nota que guardás se convierte automáticamente en un documento de Word en tu computadora, asegurando que tu información sea siempre tuya y fácil de compartir.

- **Seguridad Visual ("Botón de Pánico" / Blur):** Implementamos un sistema de privacidad instantánea que nubla la pantalla si necesitás ocultar datos confidenciales rápidamente ante la presencia de terceros.

> **Tiempo estimado de desarrollo:** 20 horas.

### Hito 4: Contabilidad, Reportes y Optimización Móvil

- **Seguimiento de Pagos y Gestión de Deudas:** Un tablero simple para marcar sesiones pagadas o pendientes, permitiéndote controlar tus ingresos y ver montos adeudados de forma instantánea.

- **Generador de Reportes Mensuales (PDF/Excel):** Exportamos listados detallados con los datos que necesita tu contadora, eliminando la necesidad de armar planillas manuales a fin de mes.

- **Sistema de Backup Físico:** Implementamos un botón de seguridad para descargar todo tu consultorio en un solo archivo comprimido (ZIP) para guardar en un pendrive o disco externo.

- **Optimización Multi-dispositivo (PWA) y WhatsApp:** Aseguramos que la experiencia sea fluida en cualquier pantalla, permitiéndote consultar la agenda desde el celular y enviar mensajes de recordatorio personalizados con un solo botón.

> **Tiempo estimado de desarrollo:** 20 horas.


## 3. Resumen de Tiempos

- **Tiempo total estimado de desarrollo:** 90 horas de trabajo efectivo.


## 4. Entregables

Al finalizar el proyecto, se hará entrega de:

1. Acceso a la aplicación web personalizada.

2. Documentación de uso básico.

3. Estructura de carpetas configurada en Google Drive para el respaldo automático de la información.


## 4. Compromiso de Calidad

- **Privacidad:** Los datos nunca pasan por servidores de terceros.

- **Portabilidad:** Si se deja de usar la app, los archivos generados (.docx, .json) siguen siendo accesibles desde Google Drive.

- **Soporte:** Garantía de funcionamiento y corrección de errores tras la entrega.


> **Nota:** El desarrollo se realizará de forma incremental, permitiendo revisiones periódicas para ajustar la herramienta a la comodidad de la profesional.

