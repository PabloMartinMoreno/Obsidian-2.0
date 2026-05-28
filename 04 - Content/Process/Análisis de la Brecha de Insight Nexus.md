---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Análisis de la Brecha de Insight Nexus

#### Escenario del Incidente

La víctima en este incidente es **Insight Nexus**, una empresa mediana de investigación de mercado y análisis de datos con sede en Singapur. Proporcionan inteligencia competitiva y conocimientos del consumidor para clientes globales, incluidas empresas de Fortune 500 en los sectores de TI y finanzas. Su infraestructura incluye muchas aplicaciones, servidores y hosts, pero nos centraremos en los importantes, como una pila de aplicaciones orientada a Internet para clientes, un servidor ManageEngine para administración de TI y un portal de informes de clientes basado en PHP. Debido a la naturaleza de su trabajo, se convirtieron en un objetivo atractivo para adversarios interesados en el robo de datos de clientes.

Echemos un vistazo al incidente para comprender algunos desafíos que enfrentan los gestores de incidentes. Este incidente muestra un ejemplo de los patrones observados repetidamente en incidentes del mundo real. La víctima en este escenario es Insight Nexus, una firma global de investigación de mercado que maneja datos competitivos sensibles para clientes de alto perfil en el sector de TI. La firma se convierte en el objetivo de dos grupos de amenazas distintos operando simultáneamente dentro de su entorno. El primer actor de amenazas ganó acceso cuando los administradores del sistema olvidaron cambiar la contraseña predeterminada _admin/admin_ en una aplicación orientada a Internet, es decir, **ManageEngine ADManager Plus**, después de una actualización del producto. Aprovechando esto, los atacantes iniciaron sesión con éxito, realizaron reconocimiento, mapearon usuarios y máquinas, y finalmente crearon nuevas cuentas privilegiadas de Active Directory. Usando una de las cuentas recién creadas, los adversarios pivotaron más profundamente en el entorno, identificando un servicio RDP externo expuesto por una mala configuración. Explotando ese punto de entrada, escalaron su control y finalmente usaron Objetos de Política de Grupo (GPOs) para desplegar spyware usando un paquete MSI en múltiples endpoints.
![[Análisis de la Brecha de Insight Nexus-1.png]]

Durante días, estas actividades pasaron desapercibidas. El incidente fue descubierto por primera vez un día cuando un analista del equipo SOC investigó una alerta en **TheHive** (Plataforma de Respuesta a Incidentes de Seguridad) relacionada con la creación de un archivo sospechoso llamado `checkme.txt` en la raíz de un servidor web. Tras la investigación, descubrieron que fue colocado deliberadamente allí como una firma: _"SilentJackal estuvo aquí"_. Este artefacto inusual desencadenó una investigación más profunda. Lo que hizo la situación más compleja fue que el equipo SOC se dio cuenta entonces de que dos grupos de actores de amenazas diferentes estaban activos en el mismo entorno. Mientras el primer grupo todavía estaba explorando y desplegando mecanismos de persistencia, un segundo actor ya había comprometido una aplicación PHP vulnerable anteriormente, exfiltrado datos sensibles de investigación de mercado y reducido significativamente su actividad después de lograr su objetivo, dejando solo conexiones ocasionales a una IP externa.

#### Actores de Amenazas

- **Crimson Fox (Actor de amenaza principal):** Un grupo con vínculos conocidos con ataques a la cadena de suministro de la industria de TI, sospechoso de tener respaldo estatal. Se especializan en robo de credenciales y persistencia a largo plazo para la exfiltración de datos. Es un grupo capaz y persistente conocido por varios ataques exitosos anteriores relacionados con la cadena de suministro y la inteligencia corporativa.

- **Silent Jackal (Actor secundario):** Un grupo criminal poco organizado centrado en desfiguraciones de sitios web (_defacements_) oportunistas e intrusiones de prueba de concepto, no necesariamente motivados financieramente pero sí disruptivos. Los miembros de este grupo son intrusos web de baja habilidad.


#### Entorno y Activos Importantes

**Internet Público**

- **Aplicación Web Externa (`manage.insightnexus.com`):** La aplicación web ManageEngine ADManager Plus proporciona la capacidad de gestión de Active Directory a los administradores de sistemas de la organización. HTTPS (puerto 443) era accesible desde Internet (portal de gestión).
- **Portal de Reportes de Clientes (`portal.insightnexus.com`):** Un portal de informes de clientes basado en PHP (carga de archivos habilitada para informes).

**Estructura del entorno interno**

- **Controlador de Dominio:** `DC01.insight.local`
- **Servidor de Archivos:** `FS01.insight.local` (recurso compartido de archivos: `\fs01\projects`)
- **Servidor de Base de Datos:** `DB01.insight.local` contiene bases de datos sensibles.
- **Estaciones de trabajo:** Esto incluye la flota de desarrolladores (desde DEV-001 hasta DEV-120), incluidas algunas estaciones de trabajo con permisos para permitir conexiones RDP entrantes. Se descubrió una máquina Windows con exposición RDP externa durante el reconocimiento: `DEV-021` (mal configurada).

**Seguridad**

- Firewall perimetral con registro predeterminado (sin integración con Inteligencia de Amenazas).
- IDS básico con alta tasa de falsos positivos.
- Agentes **Wazuh** en la mayoría de los hosts de Windows (cobertura parcial).
- SIEM centralizado (**Wazuh**) ingiriendo Sysmon de Windows, Seguridad de Windows, registros de servidor web y registros de firewall (retención limitada).
- **TheHive** se utiliza para la gestión de casos, con Cortex disponible para el enriquecimiento.

#### Análisis del Incidente

Un administrador del sistema notó conexiones salientes inusuales desde el servidor ManageEngine a una dirección IP en Europa del Este mientras trabajaba en el servidor para mantenimiento programado. Llamó al equipo SOC y colaboró con ellos para investigar las alertas y encontrar algo sospechoso. Uno de los analistas del SOC comenzó a investigar las alertas y encontró una alerta mencionando un archivo sospechoso `checkme.txt` en el mismo servidor.

**Brecha de Detección:** Hubo demasiadas alertas sobre la creación de nuevos archivos en los servidores, y esta alerta no se escaló debido a la fatiga de alertas. Necesitan reducir algunos falsos positivos y agregar más filtros.

El equipo SOC comenzó a investigar este incidente y encontró muchos intentos de reconocimiento en las aplicaciones web externas.
![[Análisis de la Brecha de Insight Nexus-2.png]]

Tras una investigación más profunda, los respondedores encontraron que el **2025-10-01 03:12:02**, el actor de amenazas Crimson Fox obtuvo acceso inicial vía ManageEngine. Inicialmente, realizaron intentos de inicio de sesión dirigidos contra `manage.insightnexus.com`. Encontraron que las credenciales predeterminadas (es decir, _admin/admin_) funcionaban, lo que significa que o bien los administradores del sistema olvidaron cambiar las credenciales predeterminadas después de una actualización o dejaron la aplicación web accesible a todos en el internet público. El resultado fue desafortunado para la organización, y los actores de amenazas realizaron un inicio de sesión web interactivo vía HTTPS. El informe de auditoría de inicio de sesión muestra esta actividad de inicio de sesión exitosa.

**Descuido Organizacional:** A pesar de los avisos del proveedor, las credenciales predeterminadas nunca se cambiaron. La autenticación multifactor no se aplicó, y no hubo inspección de WAF en el endpoint. Los eventos de inicio de sesión de la aplicación web no se enviaban a un SIEM centralizado.
![[Análisis de la Brecha de Insight Nexus-3.png]]

Hubo una vulnerabilidad web de Java relacionada con el producto ManageEngine ADManager Plus donde la ejecución remota de código sin autenticación era posible. El actor utilizó esto y estableció un C2 saliente sobre HTTPS hacia `103.112.60.117` (un host controlado por el atacante en la nube), haciéndose pasar por tráfico de actualización. Se registró el siguiente **Sysmon Event ID 3** (Conexión de Red detectada):

**Análisis de la Brecha de Insight Nexus**
```Plaintext
Event 3, Sysmon 

Network Connection detected:
UtcTime: 2025-10-01 03:18:32.557
Image: C:\ManageEngine\jre\bin\java.exe
DestinationIp: 103.112.60.117
DestinationPort: 443
```

El **2025-10-02 04:02:11**, los atacantes enumeraron usuarios y computadoras del dominio a través de consultas desde la consola de ManageEngine. Usando el punto de apoyo en ManageEngine, también crearon una nueva cuenta de Administrador de Dominio. Durante la enumeración de Active Directory, encontraron que una máquina Windows 10 (`DEV-021`) tenía un puerto RDP expuesto públicamente. Esta máquina de escritorio es utilizada ocasionalmente por desarrolladores para realizar tareas de desarrollo y lanzamiento tomando RDP directamente en su IP pública mientras trabajan desde casa. El atacante tomó RDP directamente hacia esta máquina usando la cuenta de Administrador de Dominio recién creada.
![[Análisis de la Brecha de Insight Nexus-4.png]]

Para esta actividad, se creó el siguiente registro de eventos en los Registros de Eventos de Windows con **Event ID 4624**.

**Análisis de la Brecha de Insight Nexus**
```Plaintext
An account was successfully logged on.

 Subject:
    Security ID: SYSTEM
    Account Name: DEV-021$
    Account Domain: INSIGHT
    Time: 2025-10-04T02:03:12Z

 Logon Information:
    Logon Type: 10

 Network Information:
    Workstation Name: DEV-021
    Source Network Address: 103.112.60.117

 New Logon:
    SubjectUserName: insight\svc_deployer
    SourceNetworkAddress: 103.112.60.117
```

Después de un inicio de sesión exitoso, los atacantes realizaron algún reconocimiento del dominio. Encontraron algunos recursos compartidos de archivos interesantes en el servidor de archivos, a los cuales intentaron acceder varias veces. En el servidor de archivos, localizaron carpetas de proyectos de clientes que contenían borradores de informes, datos de encuestas y pronósticos de mercado.
![[Análisis de la Brecha de Insight Nexus-5.png]]

En el servidor de archivos, se crearon múltiples registros de eventos, como **5140(S, F):** Se accedió a un objeto de recurso compartido de red. Sin embargo, no se crearon reglas para generar alertas específicamente para estos eventos RDP desde IPs públicas.

Este tipo de registros de eventos pueden detectarse utilizando la siguiente regla **Sigma**, por ejemplo:
```YAML
title: External Remote RDP Logon from Public IP
id: 259a9cdf-c4dd-4fa2-b243-2269e5ab18a2
related:
    - id: 78d5cab4-557e-454f-9fb9-a222bd0d5edc
      type: derived
status: test
description: Detects successful logon from public IP address via RDP. This can indicate a publicly-exposed RDP port.
references:
    - https://www.inversecos.com/2020/04/successful-4624-anonymous-logons-to.html
    - https://twitter.com/Purp1eW0lf/status/1616144561965002752
author: Micah Babinski (@micahbabinski), Zach Mathis (@yamatosecurity)
date: 2023-01-19
modified: 2024-03-11
tags:
    - attack.initial-access
    - attack.credential-access
    - attack.t1133
    - attack.t1078
    - attack.t1110
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4624
        LogonType: 10
    filter_main_local_ranges:
        IpAddress|cidr:
            - '::1/128'  # IPv6 loopback
            - '10.0.0.0/8'
            - '127.0.0.0/8'
            - '172.16.0.0/12'
            - '192.168.0.0/16'
            - '169.254.0.0/16'
            - 'fc00::/7'  # IPv6 private addresses
            - 'fe80::/10'  # IPv6 link-local addresses
    filter_main_empty:
        IpAddress: '-'
    condition: selection and not 1 of filter_main_*
falsepositives:
    - Legitimate or intentional inbound connections from public IP addresses on the RDP port.
level: medium
```

Después de explorar y observar durante una semana, comenzaron a comprimir y exfiltrar datos seleccionados. Los atacantes empaquetaron materiales robados de clientes en un archivo llamado `diagnostics_data.zip`, un nombre de archivo elegido para parecer telemetría de rutina. El archivo comprimido fue luego subido al host controlado por el atacante a través de HTTPS. Debido a que el nombre del archivo se parecía a datos de diagnóstico legítimos y la carga utilizaba HTTPS estándar, no levantó alarmas inmediatamente. Esta táctica aumenta la probabilidad de los atacantes de exfiltrar datos antes de que los defensores escalen el incidente.
![[Análisis de la Brecha de Insight Nexus-6.png]]

Luego, el **2025-10-04 02:10:45**, desde `DEV-021`, ejecutaron algunos scripts de PowerShell que usaban credenciales de administrador de dominio para crear un Objeto de Política de Grupo (GPO) que empuja un paquete MSI (`java-update.msi`) a través del dominio. Este paquete MSI creó una tarea programada para ejecutar un proceso que realiza espionaje y exfiltración de datos en las máquinas.

Estos eventos también fueron capturados en los registros de eventos, como la creación de un nuevo archivo .msi como **Sysmon Event ID 11**.

**Análisis de la Brecha de Insight Nexus**
```Plaintext
Sysmon Event 11: TargetFilename: C:\Windows\Temp\java-update.msi
```

También, **Sysmon Event ID 1** captura la línea de comandos para la ejecución del archivo .msi en segundo plano.

**Análisis de la Brecha de Insight Nexus**
```Plaintext
Sysmon Event 1: Image: C:\Windows\System32\msiexec.exe CommandLine: "msiexec /i C:\Windows\Temp\java-update.msi /quiet"
```

Este malware, con capacidades de espionaje y exfiltración de datos, se despliega en todas las máquinas del dominio usando GPO.
![[Análisis de la Brecha de Insight Nexus-7.png]]

Aproximadamente al mismo tiempo, otro actor de amenazas, **Silent Jackal**, también realizó algunas actividades en un portal de informes separado basado en PHP. Este servidor tenía una vulnerabilidad de carga de archivos sin parchear, que fue explotada por el actor de amenazas para ganar acceso a este servidor. Silent Jackal subió un archivo en el directorio raíz del servidor web. Sus actividades parecieron limitarse a dejar el archivo marcador `checkme.txt`. Esto creó ruido en el entorno y proporcionó a los defensores la primera pista del compromiso.
![[Análisis de la Brecha de Insight Nexus-8.png]]

Sin embargo, el actor de amenazas no procedió más allá de su acceso inicial. Esto fue probablemente una intrusión de baja habilidad destinada a señalar presencia en lugar de causar daño inmediato.

**Descuido Organizacional:** Sin monitoreo de firewall de aplicaciones web y sin evaluaciones de vulnerabilidad regulares de los portales orientados a Internet.

Crimson Fox redujo las operaciones de alta actividad, con solo "beacons" (balizas) ocasionales de baja tasa hacia `103.112.60.117` para verificar nuevas instrucciones. Silent Jackal redujo de manera similar la actividad.

#### Acciones de Respuesta Inmediata al Incidente

El primer descubrimiento tangible fue `checkme.txt` por un analista SOC. Ese archivo por sí solo normalmente sería de baja prioridad, pero el analista SOC realizando la correlación vio que la misma ventana de tiempo tenía eventos de ManageEngine con tráfico saliente inusual y múltiples eventos de inicio de sesión desde una IP extranjera desconocida.

La correlación de lo siguiente se realizó de la siguiente manera:
- Inicios de sesión de administrador exitosos en ManageEngine desde IPs extranjeras.
- Creación de procesos Sysmon de `msiexec` instalando un MSI en muchos hosts.
- Registros de enumeración LDAP y cambios en GPO.
- Registros de compresión y carga de archivos en el servidor de archivos.
- HTTPS saliente a una dirección IP inusual.

Después de la correlación, el analista SOC escaló inmediatamente el incidente al equipo de respuesta a incidentes y abrió un caso en TheHive. Las siguientes acciones y hallazgos completaron la investigación y respuesta:

- **Creación y triaje del caso**
    - El SOC creó un caso en TheHive titulado "Insight Nexus — ManageEngine Compromise", vinculó todas las alertas relacionadas (inicios de sesión admin ManageEngine, eventos Sysmon msiexec, enumeración LDAP, cargas en servidor de archivos y el evento del portal checkme.txt), y asignó roles: Analista de Triaje, Líder Forense, Líder de Contención y Líder de Comunicaciones.
    - La prioridad se estableció en **Crítica** debido a la exfiltración de datos confirmada.

- **Contención — controles de red**
    - Se bloqueó el tráfico saliente a `103.112.60.117` en el firewall perimetral y en los firewalls basados en host. Se agregaron reglas de bloqueo de egreso temporal para las IPs de los atacantes.
    - Se agregó una firma IDS para alertar sobre conexiones a `103.112.60.117` y endpoints similares.

- **Contención — acciones de credenciales y cuentas**
    - Se deshabilitó la cuenta de administrador de ManageEngine y se rotaron todas las credenciales de alto privilegio expuestas en los registros (cuentas de servicio, cuentas de desplegador y cualquier cuenta que mostrara actividad sospechosa).
    - Se restringió la consola web de ManageEngine para ser accedida solo internamente.
    - Se implementaron cambios forzados de contraseña y revocación inmediata de sesiones activas donde fuera posible.

- **Aislamiento de hosts**
    - Se aisló `manage.insightnexus.com`, `DEV-021` y cualquier máquina que mostrara evidencia de instalación de MSI de la red de producción para recolección forense (acceso a red bloqueado, pero preservado de una manera que permitiera el análisis).
    - Se suspendieron las tareas programadas y se deshabilitaron los despliegues iniciados por GPO hasta la confirmación de la remediación.

- **Recolectar artefactos forenses**
    - En los hosts aislados, se recolectó memoria volátil, listas de procesos, colmenas de registro (registry hives) e imágenes de disco. Se exportaron los registros de auditoría de ManageEngine y los registros de acceso del servidor web con marcas de tiempo completas.
    - Se preservaron copias del archivo MSI (`java-update.msi`), el paquete exfiltrado comprimido (`diagnostics_data.zip`) y cualquier archivo de web shell encontrado en los directorios de la aplicación de gestión.

#### Mapeo a MITRE ATT&CK

- **Reconocimiento:** Escaneo de activos públicos; MITRE T1595 (Active Scanning).
- **Armamento / Acceso Inicial:** Credenciales predeterminadas de ManageEngine (T1078.004 - Valid Accounts), Explotación de carga PHP (T1190 - Exploit Public-Facing Application).
- **Entrega / Explotación:** Cargas de web shell, ejecución de comandos de consola; (T1505 - Server Software Component).
- **Instalación / Persistencia:** Tareas programadas, servicios, MSI desplegado por GPO (T1547, T1543, T1069).
- **Comando y Control:** HTTPS a IP controlada por el atacante (T1071.001 - Web Protocols).
- **Acción sobre el Objetivo / Exfiltración:** Comprimir y subir datos del proyecto (T1560/T1041).