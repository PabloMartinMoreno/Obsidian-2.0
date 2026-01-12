### Registros de Eventos de Windows (_Windows Event Logs_)

#### Conceptos Básicos

Los Registros de Eventos de Windows son una parte intrínseca del Sistema Operativo Windows, almacenando registros de diferentes componentes del sistema, incluyendo el sistema mismo, las aplicaciones que se ejecutan en él, proveedores ETW, servicios y otros.

El registro de eventos de Windows ofrece capacidades integrales para registrar errores de aplicaciones, eventos de seguridad e información de diagnóstico. Como profesionales de ciberseguridad, aprovechamos estos registros extensivamente para el análisis y la detección de intrusiones.

Los registros se categorizan en diferentes registros de eventos, como "Aplicación", "Sistema", "Seguridad" y otros, para organizar los eventos según su fuente o propósito. Se puede acceder a ellos utilizando la aplicación **Visor de Eventos** (_Event Viewer_) o programáticamente mediante APIs.

Acceder al Visor de Eventos de Windows como usuario administrativo nos permite explorar los diversos registros disponibles:

- **Aplicación (_Application_):** Errores de aplicaciones y eventos generales.
- **Seguridad (_Security_):** Eventos de auditoría de seguridad (inicios de sesión, acceso a objetos).
- **Instalación (_Setup_):** Actividades de configuración del sistema.
- **Sistema (_System_):** Errores y eventos de componentes del sistema (drivers, servicios).
- **Eventos Reenviados (_Forwarded Events_):** Muestra datos de registro de eventos reenviados desde otras máquinas (útil para administradores que desean una vista consolidada).

Cabe destacar que el Visor de Eventos tiene la capacidad de abrir y mostrar archivos `.evtx` guardados previamente.

#### La Anatomía de un Registro de Evento

Al examinar los registros de Aplicación, encontramos dos niveles distintos de eventos: **información** y **error**. Los eventos de información brindan detalles generales de uso, mientras que los eventos de error resaltan problemas específicos.

Cada entrada en el Registro de Eventos de Windows es un "Evento" y contiene los siguientes componentes principales:

- **Nombre del registro (_Log Name_):** El nombre del registro (ej. Aplicación, Sistema).
- **Fuente (_Source_):** El software que registró el evento.
- **ID de Evento (_Event ID_):** Un identificador único para el tipo de evento.
- **Categoría de tarea:** Ayuda a entender el propósito o uso del evento.
- **Nivel (_Level_):** La gravedad (Información, Advertencia, Error, Crítico, Verbose).
- **Palabras clave (_Keywords_):** Banderas para categorizar eventos (ej. "Auditoría Correcta" o "Auditoría Fallida").
- **Usuario:** La cuenta de usuario que estaba conectada cuando ocurrió el evento.
- **OpCode:** Identifica la operación específica.
- **Registrado (_Logged_):** Fecha y hora del evento.
- **Equipo (_Computer_):** Nombre del equipo donde ocurrió.
- **Datos XML:** Toda la información anterior en formato XML junto con datos adicionales.

El campo **Palabras clave** es particularmente útil para filtrar.

Mirando más de cerca un evento de seguridad, consideremos el **ID de Evento 4624** (Inicio de sesión exitoso).

Según la documentación de Microsoft, este evento significa la creación de una sesión de inicio de sesión. Dentro de este registro, encontramos detalles cruciales:

- **Logon ID:** Permite correlacionar este inicio de sesión con otros eventos que comparten el mismo ID.
- **Logon Type:** Indica el tipo de inicio de sesión (ej. Tipo 5 es inicio de sesión de Servicio).

#### Aprovechando Consultas XML Personalizadas

Para agilizar nuestro análisis, podemos crear consultas XML personalizadas para identificar eventos relacionados utilizando el "Logon ID" como punto de partida. Al navegar a _"Filtrar registro actual"_ -> _"XML"_ -> _"Editar consulta manualmente"_, obtenemos acceso a un lenguaje de consulta que permite búsquedas más granulares.

Por ejemplo, podemos filtrar por eventos que contengan un `SubjectLogonId` con valor `0x3E7` para ver toda la actividad de esa sesión específica.

Profundizar en los detalles revela una narrativa. Por ejemplo:

1. **Evento 4907:** Cambio de política de auditoría (cambio en la SACL de un objeto).
2. **Evento 4624:** Inicio de sesión.
3. **Evento 4672 (Inicio de sesión especial):** Indica que se otorgaron privilegios especiales (como `SeDebugPrivilege`) a un usuario (a menudo el usuario SYSTEM o Administradores).

#### Registros de Windows Útiles

Aquí tienes una lista (no exhaustiva) de eventos clave para monitorear:

**Registros del Sistema (_System Logs_)**

- **1074:** Apagado/Reinicio del sistema (legítimo o inesperado).
- **6005:** El servicio de registro de eventos se inició (arranque del sistema).
- **6006:** El servicio de registro de eventos se detuvo (apagado del sistema).
- **6013:** Tiempo de actividad (_uptime_) del sistema.
- **7040:** Cambio de estado de servicio (ej. de manual a automático).
- **7045:** Se instaló un servicio en el sistema (crítico para detectar persistencia de malware).

**Registros de Seguridad (_Security Logs_)**

- **1102:** El registro de auditoría fue borrado (signo de encubrimiento).
- **1116/1118/1119:** Detección y remediación de malware de Windows Defender.
- **4624/4625:** Inicio de sesión exitoso / fallido (fuerza bruta).
- **4648:** Inicio de sesión con credenciales explícitas (posible movimiento lateral).
- **4672:** Privilegios especiales asignados (escalada de privilegios).
- **4698/4700/4702:** Creación/modificación de tareas programadas (persistencia).
- **4719:** Cambio de política de auditoría del sistema.
- **4738:** Cambio de cuenta de usuario.
- **4771:** Fallo de pre-autenticación Kerberos.
- **5140/5145:** Acceso a recursos compartidos de red.

---
