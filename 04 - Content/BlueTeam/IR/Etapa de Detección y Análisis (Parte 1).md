---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
---

### Etapa de Detección y Análisis (Parte 1)

En este punto, hemos creado procesos y procedimientos, y tenemos pautas sobre cómo actuar ante incidentes de seguridad.

La etapa de **Detección y Análisis** abarca todos los aspectos de la detección de un incidente, tales como la utilización de sensores, registros (_logs_) y personal capacitado. También incluye el intercambio de información y conocimiento, así como el uso de inteligencia de amenazas (_threat intelligence_) basada en el contexto. La segmentación de la arquitectura y tener una comprensión clara y visibilidad dentro de la red son también factores importantes.

Las amenazas se introducen en la organización a través de un número infinito de vectores de ataque, y su detección puede provenir de fuentes como:

- Un empleado que nota un comportamiento anormal.
- Una alerta de una de nuestras herramientas (EDR, IDS, Firewall, SIEM, etc.).
- Actividades de caza de amenazas (_Threat Hunting_).
- Una notificación de terceros informándonos que descubrieron señales de que nuestra organización ha sido comprometida.

Es muy recomendable crear niveles de detección categorizando lógicamente nuestra red de la siguiente manera:

- **Detección en el perímetro de la red** (usando firewalls, sistemas de detección/prevención de intrusiones orientados a internet, zona desmilitarizada o DMZ, etc.).
- **Detección a nivel de red interna** (usando firewalls locales, sistemas de detección/prevención de intrusiones en host, etc.).
- **Detección a nivel de endpoint** (usando sistemas antivirus, sistemas de detección y respuesta en endpoints - EDR, etc.).
- **Detección a nivel de aplicación** (usando logs de aplicaciones, logs de servicios, etc.).

#### Investigación Inicial

Cuando se detecta un incidente de seguridad, debemos realizar una investigación inicial y **establecer el contexto** antes de reunir al equipo y convocar una respuesta a incidentes a nivel de toda la organización. Piensa en cómo se presenta la información en el caso de una cuenta administrativa conectándose a una dirección IP a las HH:MM:SS. Sin saber qué sistema está en esa dirección IP y a qué zona horaria se refiere la hora, podemos llegar fácilmente a una conclusión errónea sobre de qué trata este evento. En resumen, debemos apuntar a recopilar tanta información como sea posible en esta etapa sobre lo siguiente:

- Fecha/Hora en que se reportó el incidente. Además, ¿quién detectó el incidente y/o quién lo reportó?
- ¿Cómo se detectó el incidente?
- ¿Qué fue el incidente? ¿Phishing? ¿Indisponibilidad del sistema? etc.
- Armar una lista de sistemas impactados (si es relevante).
- Documentar quién ha accedido a los sistemas impactados y qué acciones se han tomado. Tomar nota de si este es un incidente en curso o si la actividad sospechosa se ha detenido.
- Ubicación física, sistemas operativos, direcciones IP y nombres de host, propietario del sistema, propósito del sistema, estado actual del sistema.
- Lista de direcciones IP, si hay malware involucrado, hora y fecha de detección, tipo de malware, sistemas impactados, exportación de archivos maliciosos con información forense sobre ellos (tales como hashes, copias de los archivos, etc.).

Con esa información a mano, podemos tomar decisiones basadas en el conocimiento que hemos reunido. ¿Qué significa esto? Probablemente tomaríamos acciones diferentes si supiéramos que la computadora portátil del CEO fue comprometida en comparación con la de un pasante.

Con la información reunida inicialmente, podemos comenzar a construir una **línea de tiempo del incidente**. Esta línea de tiempo nos mantendrá organizados a lo largo del evento y proporcionará una imagen general de lo que sucedió. Los eventos en la línea de tiempo se ordenan según cuándo ocurrieron. Ten en cuenta que durante el proceso de investigación posterior, no necesariamente descubriremos evidencia en este orden cronológico. Sin embargo, cuando ordenamos la evidencia basándonos en cuándo ocurrió, obtendremos contexto de los eventos separados que tuvieron lugar. La línea de tiempo también puede arrojar luz sobre si la evidencia recién descubierta es parte del incidente actual. Por ejemplo, imagina que lo que pensábamos que era el _payload_ inicial de un ataque se descubrió más tarde que estaba presente en otro dispositivo hace dos semanas. Encontraremos situaciones donde los datos que estamos mirando son extremadamente relevantes y situaciones donde los datos no están relacionados y estamos buscando en el lugar equivocado. En general, la línea de tiempo debe contener la información descrita en las siguientes columnas:

|**Fecha**|**Hora del evento**|**Nombre de host**|**Descripción del evento**|**Fuente de datos**|
|---|---|---|---|---|

Tomemos un evento y completemos la tabla de ejemplo de arriba. Se vería así:

|**Fecha**|**Hora del evento**|**Nombre de host**|**Descripción del evento**|**Fuente de datos**|
|---|---|---|---|---|
|09/09/2021|13:31 CET|SQLServer01|Herramienta hacker 'Mimikatz' fue detectada|Software Antivirus|

Como puedes inferir, la línea de tiempo se enfoca principalmente en el comportamiento del atacante, por lo que las actividades registradas describen cuándo ocurrió el ataque, cuándo se estableció una conexión de red para acceder a un sistema, cuándo se descargaron archivos, etc. Es importante asegurarse de capturar dónde se detectó o descubrió la actividad y los sistemas asociados con ella.

También podemos ver una alerta relacionada con este registro de eventos en la **Plataforma de Gestión de Casos TheHive**.
![[Etapa de Detección y Análisis (Parte 1).png]]


Naveguemos hasta la parte inferior de esta sección y hagamos clic en _"Click here to spawn the target system!"_ (Clic aquí para desplegar el sistema objetivo). Luego, abramos la p2ágina web de TheHive en "Target IP:9000" en el puerto 9000 usando las credenciales proporcionadas para ver las alertas.

Podemos asignarnos la alerta a nosotros mismos, crear un caso, trabajar en él, agregar más detalles sobre el incidente en el caso y luego, una vez completada la investigación, podemos documentar todos los hallazgos y lecciones en el caso y cerrarlo.

#### Preguntas sobre Severidad y Alcance del Incidente

Al gestionar un incidente de seguridad, también debemos tratar de responder las siguientes preguntas para tener una idea de la severidad y el alcance del incidente:

- ¿Cuál es el impacto de la explotación?
- ¿Cuáles son los requisitos de explotación?
- ¿Puede algún sistema crítico para el negocio verse afectado por el incidente?
- ¿Hay pasos de remediación sugeridos?
- ¿Cuántos sistemas han sido impactados?
- ¿El exploit está siendo utilizado "in the wild" (activamente en la naturaleza)?
- ¿Tiene el exploit alguna capacidad tipo gusano (_worm-like_)?

Las últimas dos pueden indicar posiblemente el nivel de sofisticación de un adversario.

Como puedes imaginar, los incidentes de alto impacto se manejarán con prontitud, y los incidentes con un alto número de sistemas impactados tendrán que ser escalados.

#### Confidencialidad y Comunicación del Incidente

Los incidentes son temas muy confidenciales y, como tal, toda la información recopilada debe mantenerse bajo el principio de **necesidad de saber** (_need-to-know basis_), a menos que las leyes aplicables o una decisión de la dirección nos indiquen lo contrario. Hay múltiples razones para esto. El adversario puede ser, por ejemplo, un empleado de la compañía, o si ha ocurrido una brecha, la comunicación a partes internas y externas debe ser manejada por la persona designada de acuerdo con el departamento legal.

Cuando se inicia una investigación, estableceremos algunas expectativas y objetivos. Estos a menudo incluyen el tipo de incidente que ocurrió, las fuentes de evidencia que tenemos disponibles y una estimación aproximada de cuánto tiempo necesita el equipo para la investigación. También, basándonos en el incidente, estableceremos expectativas sobre si podremos descubrir al adversario o no. Por supuesto, mucho de lo anterior puede cambiar a medida que la investigación evoluciona y se descubren nuevas pistas. Es importante mantener a todos los involucrados y a la dirección informados sobre cualquier avance y expectativa.

---
