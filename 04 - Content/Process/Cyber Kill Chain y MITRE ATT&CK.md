# Cyber Kill Chain

___

## ¿Qué es la Cyber Kill Chain?

Antes de empezar a hablar sobre la gestión de incidentes, necesitamos entender el ciclo de vida del ataque (también conocido como **Cyber Kill Chain**). Este ciclo de vida describe cómo se manifiestan los ataques. Comprender este ciclo nos proporcionará información valiosa sobre qué tan lejos ha llegado un atacante en la red y a qué puede tener acceso durante la fase de investigación de un incidente.

La Cyber Kill Chain consta de siete etapas diferentes, como se muestra en la imagen a continuación: 
![[Pasted image 20260106161913.png]]

## Etapas de la Cyber Kill Chain

La etapa de **Reconocimiento (Recon)** es la etapa inicial e involucra la parte donde un atacante elige su objetivo. Además, el atacante realiza una recopilación de información para familiarizarse más con el objetivo y reúne tantos datos útiles como sea posible, los cuales pueden usarse no solo en esta etapa sino también en otras etapas de esta cadena. Algunos atacantes prefieren realizar una recopilación de información pasiva a partir de fuentes web como LinkedIn e Instagram, pero también de la documentación en las páginas web de la organización objetivo. Los anuncios de trabajo y los socios de la empresa a menudo revelan información sobre la tecnología utilizada en la organización objetivo. Pueden proporcionar información extremadamente específica sobre herramientas antivirus, sistemas operativos y tecnologías de red. Otros atacantes van un paso más allá; comienzan a "tantear" y escanean activamente aplicaciones web externas y direcciones IP que pertenecen a la organización objetivo.
![[Pasted image 20260106161922.png]]

En la etapa de **Armamento (Weaponize)**, se desarrolla el malware que se utilizará para el acceso inicial y se incrusta en algún tipo de exploit o carga útil (payload) entregable. Este malware está diseñado para ser extremadamente ligero e indetectable por herramientas antivirus y de detección. Es probable que el atacante haya recopilado información para identificar la tecnología antivirus o EDR presente en la organización objetivo. A gran escala, el único propósito de esta etapa inicial es proporcionar acceso remoto a una máquina comprometida en el entorno objetivo, la cual también tiene la capacidad de persistir a través de reinicios de la máquina y la habilidad de desplegar herramientas y funcionalidades adicionales bajo demanda.

En la etapa de **Entrega (Delivery)**, el exploit o payload se entrega a la(s) víctima(s). Los enfoques tradicionales incluyen correos electrónicos de phishing que contienen un archivo adjunto malicioso o un enlace a una página web. La página web puede servir para dos propósitos: contener un exploit o alojar el payload malicioso para evitar enviarlo a través de herramientas de escaneo de correo electrónico. En algunos casos, la página web también puede imitar un sitio web legítimo utilizado por la organización objetivo en un intento de engañar a la víctima para que ingrese sus credenciales y así recolectarlas. Algunos atacantes llaman a la víctima por teléfono con un pretexto de ingeniería social intentando convencer a la víctima de ejecutar el payload. En estos casos de ganancia de confianza, el payload se aloja en un sitio web controlado por el atacante que imita un sitio web conocido por la víctima (por ejemplo, una copia del sitio web de la organización objetivo). Es extremadamente raro entregar un payload que requiera que la víctima haga más que un doble clic en un archivo ejecutable o un script (en entornos Windows, esto puede ser `.bat`, `.cmd`, `.vbs`, `.js`, `.hta`, y otros formatos). Finalmente, hay casos donde se utiliza la interacción física para entregar el payload a través de tokens USB y herramientas de almacenamiento similares que se dejan "olvidados" a propósito.

La etapa de **Explotación (Exploitation)** es el momento en que se activa un exploit o un payload entregado. Durante la etapa de explotación de la Cyber Kill Chain, el atacante típicamente intenta ejecutar código en el sistema objetivo para obtener acceso o control.

En la etapa de **Instalación (Installation)**, se ejecuta el _stager_ (cargador) inicial y se está ejecutando en la máquina comprometida. Como ya se discutió, la etapa de instalación se puede llevar a cabo de varias maneras, dependiendo de los objetivos del atacante y la naturaleza del compromiso. Algunas técnicas comunes utilizadas en la etapa de instalación incluyen:

- **Droppers:** Los atacantes pueden usar droppers para entregar malware en el sistema objetivo. Un dropper es una pequeña pieza de código diseñada para instalar malware en el sistema y ejecutarlo. El dropper puede entregarse a través de varios medios, como archivos adjuntos de correo electrónico, sitios web maliciosos o tácticas de ingeniería social.
    
- **Backdoors (Puertas Traseras):** Una backdoor es un tipo de malware diseñado para proporcionar al atacante un acceso continuo al sistema comprometido. La backdoor puede ser instalada por el atacante durante la etapa de explotación o entregada a través de un dropper. Una vez instalada, la backdoor se puede utilizar para ejecutar más ataques o robar datos del sistema comprometido.
    
- **Rootkits:** Un rootkit es un tipo de malware diseñado para ocultar su presencia en un sistema comprometido. Los rootkits se utilizan a menudo en la etapa de instalación para evadir la detección del software antivirus y otras herramientas de seguridad. El rootkit puede ser instalado por el atacante durante la etapa de explotación o entregado a través de un dropper.


En la etapa de **Comando y Control (C&C)**, el atacante establece una capacidad de acceso remoto a la máquina comprometida. Como se discutió, no es raro usar un _stager_ inicial modular que carga scripts adicionales "sobre la marcha" (_on-the-fly_). Sin embargo, los grupos avanzados utilizarán herramientas separadas para asegurar que múltiples variantes de su malware vivan en una red comprometida, y si una de ellas es descubierta y contenida, todavía tengan los medios para regresar al entorno.

La etapa final de la cadena es la **Acción (Action)** u objetivo del ataque. El objetivo de cada ataque puede variar. Algunos adversarios pueden apuntar a exfiltrar datos confidenciales, mientras que otros pueden querer obtener el nivel más alto de acceso posible dentro de una red para desplegar ransomware. El ransomware es un tipo de malware que hace que todos los datos almacenados en dispositivos finales (endpoints) y servidores sean inutilizables o inaccesibles a menos que se pague un rescate dentro de un plazo limitado (no recomendado).

Es importante entender que los adversarios no operan linealmente (como sugiere la Cyber Kill Chain). Algunas etapas anteriores de la Cyber Kill Chain se repetirán varias veces. Por ejemplo, después de la etapa de Instalación de un compromiso exitoso, el siguiente paso lógico para un adversario es iniciar la etapa de Reconocimiento nuevamente para identificar objetivos adicionales y encontrar vulnerabilidades para explotar, permitiéndoles moverse más profundamente en la red y eventualmente lograr el/los objetivo(s) del ataque.

Nuestro objetivo es detener a un atacante para que no progrese más en la cadena de muerte (kill chain), idealmente en una de las etapas más tempranas.

# Marco MITRE ATT&CK

Otro marco para entender el comportamiento del adversario es el marco **MITRE ATT&CK**. Es una base de conocimientos más granular y basada en matrices de tácticas y técnicas adversarias utilizadas para lograr objetivos específicos. Los profesionales de la ciberseguridad utilizan ambos marcos para comprender y defenderse contra los ciberataques.

La Matriz Empresarial MITRE ATT&CK es una base de conocimientos que documenta el comportamiento del adversario observado en la vida real contra entornos de TI empresariales (Windows, Linux, macOS, nube, red, móvil, etc.). Se presenta como una matriz donde las columnas representan los objetivos del adversario (**tácticas**), y las cel1das son **técnicas** que los atacantes utilizan para lograr esos objetivos. El marco ayuda a los defensores a entender, modelar, detectar y responder al comportamiento del atacante de una manera estructurada.
![[Pasted image 20260106161936.png]]

### Táctica (Tactic)

Una táctica es un objetivo de alto nivel del adversario durante una intrusión (la meta que quieren lograr en esa etapa). Por ejemplo:
- Acceso Inicial (Initial Access).
- Persistencia (Persistence).
- Escalada de Privilegios (Privilege Escalation).

### Técnica (Technique)

Una técnica es un método específico que los adversarios utilizan para lograr una táctica. Las técnicas describen el comportamiento concreto del atacante (herramientas, comandos, APIs, protocolos, etc.).

Las técnicas tienen IDs como T1105 (Transferencia de Herramientas de Ingreso) o T1021 (Servicios Remotos). Por ejemplo:
- **T1105 Ingress Tool Transfer (Transferencia de Herramientas de Ingreso):** Se refiere a las herramientas utilizadas por los atacantes para descargar una herramienta, como `wget`, `curl`, etc., comúnmente comandos/herramientas integradas en el SO.
- **T1021 Remote Services (Servicios Remotos):** Se refiere a los adversarios utilizando protocolos como SSH, RDP y SMB para el movimiento lateral.

### Sub-técnica (Sub-technique)

Las sub-técnicas son "hijas" de las técnicas que capturan una implementación o un objetivo particular. Los IDs de sub-técnica extienden la técnica principal: T1003.001 (Volcado de Credenciales -> Memoria LSASS), T1021.002 (Servicios Remotos -> SMB/Recursos compartidos de administración de Windows). Por ejemplo:
- **T1003.001 - OS Credentials: LSASS Memory:** Se refiere a los adversarios volcando credenciales directamente de la memoria del proceso LSASS cuando logran los privilegios necesarios.
- **T1021.002 - Remote Services: SMB/Windows Admin Shares:** Se refiere a los adversarios interactuando con recursos compartidos utilizando credenciales válidas.

Esto permite una detección, atribución e informes precisos (podemos decir "Detectamos T1003.001 — volcado de memoria LSASS" en lugar de solo T1003).

## Pirámide del Dolor (Pyramid of Pain)

En el diagrama a continuación, la Pirámide del Dolor ilustra cuánto esfuerzo le toma a un adversario cambiar sus tácticas cuando los defensores detectan y bloquean diferentes tipos de indicadores. En la base de la pirámide hay indicadores simples como valores hash, direcciones IP y nombres de dominio — estos son fácilmente cambiados por los atacantes (bajo dolor).
![[Pasted image 20260106161953.png]]

Por ejemplo, bloquear una IP maliciosa en un escenario de "Comando y Control" (T1071) de MITRE ATT&CK solo ralentizará ligeramente al adversario, ya que pueden cambiar rápidamente a un nuevo servidor C2. Moviéndose hacia arriba, los artefactos de red y host (como claves de registro, nombres de mutex o nombres de archivos) corresponden a técnicas específicas en ATT&CK (por ejemplo, T1547.001 – Claves de Ejecución de Registro/Carpeta de Inicio). Estos requieren más esfuerzo para cambiar y son indicadores más resistentes para los defensores.

En la cima de la pirámide están las **Herramientas, Tácticas, Técnicas y Procedimientos (TTPs)** — estos se alinean directamente con el núcleo de MITRE ATT&CK. Detectar e interrumpir estos (por ejemplo, identificar el abuso de PowerShell bajo T1059 o la inyección de procesos bajo T1055) obliga al adversario a cambiar fundamentalmente cómo opera — causando el máximo dolor.

En resumen:
- Detecciones de Hash/IP = fáciles de evadir.
- Detecciones de comportamiento de TTPs (basadas en MITRE) = difíciles de evadir, mayor costo para el atacante y mayor madurez de defensa.

Los analistas mapean eventos e indicadores observados a técnicas y tácticas de ATT&CK para comprender rápidamente la intención del adversario y los probables próximos pasos. Usualmente, también se utiliza para priorizar alertas basadas en técnicas que apuntan a activos de alto valor. Además, se puede utilizar para referirse a las acciones de mitigación y contención/erradicación que interrumpen la cadena de muerte del atacante.

## Integración de MITRE ATT&CK en TheHive

**TheHive** es una plataforma de gestión de casos diseñada para que los equipos de ciberseguridad manejen incidentes de manera eficiente procesando alertas. Los usuarios pueden crear casos y vincular múltiples alertas relevantes dentro de ellos. Esta plataforma sirve como un centro centralizado para recopilar y gestionar todas las alertas de seguridad de varios dispositivos en una sola página completa. Además, TheHive ofrece la capacidad de importar todas las Tácticas, Técnicas y Procedimientos (TTPs) del Marco MITRE ATT&CK en su sistema de gestión de alertas. Esta integración enriquece el análisis de incidentes al asociar patrones de ataque descubiertos con las alertas.

Para acceder a la plataforma TheHive, navega a `http://TARGET_IP:9000` y usa las siguientes credenciales:
- **Usuario:** htb-analyst
- **Contraseña:** P3n#31337@LOG

Al iniciar sesión, se mostrará el panel de control (dashboard). Podemos ver la página de alertas como se muestra en la captura de pantalla a continuación, permitiéndonos ver y gestionar alertas de manera efectiva.

### Ejemplo de Mapeo MITRE ATT&CK

La tabla a continuación muestra algunas de las técnicas (MITRE ATT&CK) que se observaron durante el incidente.

|**Táctica (Tactic)**|**Técnica (Technique)**|**ID**|**Descripción**|
|---|---|---|---|
|**Acceso Inicial**|Explotar Aplicación Orientada al Público|T1190|CVE de Confluence explotado|
|**Ejecución**|Intérprete de Comandos y Scripts: PowerShell|T1059.001|PowerShell usado para descarga de payload|
|**Persistencia**|Servicio de Windows|T1543.003|Servicio de Windows para persistencia|
|**Acceso a Credenciales**|Volcado de Memoria LSASS|T1003.001|Credenciales extraídas|
|**Movimiento Lateral**|Protocolo de Escritorio Remoto (RDP)|T1021.001|Movimiento lateral vía RDP|
|**Impacto**|Datos Encriptados para Impacto|T1486|Ransomware LockBit|