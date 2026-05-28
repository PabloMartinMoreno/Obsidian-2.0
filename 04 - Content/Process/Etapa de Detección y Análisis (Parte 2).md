---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Etapa de Detección y Análisis (Parte 2)

Cuando se inicia una investigación, nuestro objetivo es comprender qué sucedió y cómo sucedió. Para analizar los datos relacionados con el incidente de manera adecuada y eficiente, los miembros del equipo de gestión de incidentes necesitan un profundo conocimiento técnico y experiencia en el campo. Uno podría preguntarse: _"¿Por qué nos importa cómo ocurrió un incidente? ¿Por qué no simplemente reconstruimos los sistemas afectados y básicamente olvidamos que sucedió?"_.

Si no sabemos cómo ocurrió un incidente o qué se vio afectado, entonces cualquier medida correctiva que tomemos no garantizará que el atacante no pueda repetir sus acciones para recuperar el acceso. Si, por otro lado, sabemos exactamente cómo entró el adversario, qué herramientas utilizó y qué sistemas se vieron afectados, entonces podemos planificar nuestra remediación para asegurar que esta ruta de ataque no pueda ser replicada.

#### La Investigación

La investigación comienza basándose en la información recopilada inicialmente (y limitada) que contiene lo que sabemos sobre el incidente hasta el momento. Con estos datos iniciales, comenzaremos un proceso cíclico de 3 pasos que se iterará una y otra vez a medida que evolucione la investigación. Este proceso incluye:

1. Creación y uso de **Indicadores de Compromiso (IOCs)**.
2. Identificación de nuevas pistas y sistemas impactados.
3. Recopilación y análisis de datos de las nuevas pistas y sistemas impactados.

![[Etapa de Detección y Análisis (Parte 2)-1.png]]

Permítenos ahora elaborar más sobre el proceso representado arriba.

#### Datos de la Investigación Inicial

Para llegar a una conclusión, una investigación debe basarse en pistas válidas que se hayan descubierto no solo durante esta fase inicial, sino a lo largo de todo el proceso de investigación. El equipo de gestión de incidentes debe presentar constantemente nuevas pistas y no centrarse únicamente en un hallazgo específico, como una herramienta maliciosa conocida. Limitar una investigación a una actividad específica a menudo resulta en hallazgos limitados, conclusiones prematuras y una comprensión incompleta del impacto general.

#### Creación y Uso de IOCs

Un indicador de compromiso (IOC) es una señal de que ha ocurrido un incidente. Los IOCs se documentan de manera estructurada, lo que representa los artefactos del compromiso. Ejemplos de IOCs pueden ser direcciones IP, valores hash de archivos y nombres de archivos. De hecho, debido a que los IOCs son tan importantes para una investigación, se han desarrollado lenguajes especiales como **OpenIOC** para documentarlos y compartirlos de manera estándar. Otro estándar ampliamente utilizado para IOCs es **YARA**. Existe una serie de herramientas gratuitas que se pueden utilizar, como el **Editor de IOC de Mandiant**, para crear o editar IOCs. Usando estos lenguajes, podemos describir y usar los artefactos que descubrimos durante una investigación de incidentes. Incluso podemos obtener IOCs de terceros si el adversario o el ataque son conocidos. Por ejemplo, CISA publica los IOCs en un formato llamado **STIX** (_Structured Threat Information eXpression_). STIX es un lenguaje de código abierto legible por máquina y un formato de serialización, principalmente en JSON, utilizado para intercambiar inteligencia de amenazas cibernéticas (CTI) de una manera estandarizada y consistente.

Como ejemplo, en este reporte, podemos verificar la sección "Downloadable copy of IOCs associated with this malware" para obtener el archivo STIX, que contiene los IOCs en formato JSON.
```JSON
...SNIP...
        {
            "type": "file",
            "spec_version": "2.1",
            "id": "file--474454e8-d393-5a4f-9069-19631ea9d397",
            "hashes": {
                "MD5": "40e609840ef3f7fea94d53998ec9f97f",
                "SHA-1": "141af6bcefdcf6b627425b5b2e02342c081e8d36",
                "SHA-256": "3461da3a2ddcced4a00f87dcd7650af48f97998a3ac9ca649d7ef3b7332bd997",
                "SHA-512": "deaed6b7657cc17261ae72ebc0459f8a558baf7b724df04d8821c7a5355e037a05c991433e48d36a5967ae002459358678873240e252cdea4dcbcd89218ce5c2",
                "SSDEEP": "384:cMQLQ5VU1DcZugg2YBAxeFMxeFAReF9ReFj4U0QiKy8Mg3AxeFaxeFAReFLxTYma:ElHh1gtX10u5A"
            },
            "size": 13373,
            "name": "osvmhdfl.dll",
            "object_marking_refs": [
                "marking-definition--94868c89-83c2-464b-929b-a1a8aa3c8487",
                "marking-definition--d896763f-3f6f-4917-86e8-1a4b043d9771"
            ],
            "extensions": {
                "windows-pebinary-ext": {
                    "pe_type": "dll",
                    "number_of_sections": 4,
                    "time_date_stamp": "2025-07-22T08:33:22Z",
                    "size_of_optional_header": 512,
                    "sections": [
...SNIP...
```

En **TheHive**, podemos agregar IOCs en la sección de _observables_ de una alerta.
![[Etapa de Detección y Análisis (Parte 2)-2.png]]

Para aprovechar los IOCs, tendremos que implementar una herramienta de obtención/búsqueda de IOCs (nativa o de terceros y posiblemente a escala). Un enfoque común es utilizar **WMI** o **PowerShell** para operaciones relacionadas con IOCs en entornos Windows.

**¡Una advertencia!** Durante una investigación, debemos tener mucho cuidado para evitar que las credenciales de nuestros usuarios altamente privilegiados se almacenen en caché al conectarse a sistemas (potencialmente) comprometidos (o a cualquier sistema, en realidad). Más específicamente, debemos asegurarnos de que solo se utilicen protocolos de conexión y herramientas que no almacenen credenciales en caché tras un inicio de sesión exitoso (como **WinRM**). Los inicios de sesión de Windows con tipo de inicio de sesión 3 (Network Logon) generalmente no almacenan credenciales en los sistemas remotos. El mejor ejemplo de "conoce tus herramientas" que me viene a la mente es "**PsExec**". Cuando "PsExec" se usa con credenciales explícitas, esas credenciales se almacenan en caché en la máquina remota. Cuando "PsExec" se usa sin credenciales a través de la sesión del usuario actualmente conectado, las credenciales no se almacenan en caché en la máquina remota. Este es un gran ejemplo para demostrar cómo la misma herramienta deja diferentes rastros, por lo que debemos ser conscientes.

#### Identificación de Nuevas Pistas y Sistemas Impactados

Después de buscar IOCs, esperamos tener algunas coincidencias (_hits_) que revelen otros sistemas con los mismos signos de compromiso. Estas coincidencias pueden no estar directamente asociadas con el incidente que estamos investigando. Nuestro IOC podría ser, por ejemplo, demasiado genérico. Necesitamos identificar y eliminar los **falsos positivos**. También podemos terminar en una posición donde nos encontremos con una gran cantidad de coincidencias. En este caso, debemos priorizar en cuáles nos enfocaremos, idealmente aquellas que puedan proporcionarnos nuevas pistas después de un análisis forense potencial.

#### Recopilación y Análisis de Datos de Nuevas Pistas y Sistemas Impactados

Una vez que hemos identificado los sistemas que incluyen nuestros IOCs, querremos recopilar y preservar el estado de esos sistemas para un análisis posterior con el fin de descubrir nuevas pistas y/o responder preguntas de investigación sobre el incidente. Dependiendo del sistema, existen múltiples enfoques sobre cómo y qué datos recopilar. A veces queremos realizar una "**respuesta en vivo**" (_live response_) en un sistema mientras se está ejecutando, mientras que en otros casos, podemos querer apagar un sistema y luego realizar cualquier análisis en él.

La respuesta en vivo es el enfoque más común, donde recopilamos un conjunto predefinido de datos que generalmente es rico en artefactos que pueden explicar qué sucedió en un sistema. Apagar un sistema no es una decisión fácil cuando se trata de preservar información valiosa porque, en muchos casos, gran parte de los artefactos solo vivirán dentro de la **memoria RAM** de la máquina, que se perderá si la máquina se apaga. Independientemente del enfoque de recopilación que elijamos, es vital asegurar que ocurra una interacción mínima con el sistema para evitar alterar cualquier evidencia o artefacto.

Una vez recopilados los datos, es hora de analizarlos. Este es a menudo el proceso que más tiempo consume durante un incidente. El análisis de malware y la informática forense de disco son los tipos de examen más comunes. Cualquier pista nueva descubierta y validada se agrega a la línea de tiempo, que se actualiza constantemente. Además, ten en cuenta que la **informática forense de memoria** es una capacidad que se está volviendo cada vez más popular y es extremadamente relevante cuando se trata de ataques avanzados.

Ten en cuenta que durante el proceso de recopilación de datos, debemos mantener un registro de la **cadena de custodia** para garantizar que los datos examinados sean admisibles en el tribunal si se van a emprender acciones legales contra un adversario.

#### Uso de la IA en la Detección de Amenazas

La Inteligencia Artificial (IA) está transformando la forma en que las organizaciones detectan, clasifican (_triage_) y responden a incidentes de seguridad. En los flujos de trabajo tradicionales de Respuesta a Incidentes (IR), los analistas revisan manualmente registros, alertas e informes. Este proceso suele llevar horas o días. La IA automatiza gran parte de este análisis, reduciendo el tiempo de respuesta y mejorando la precisión al aprender de incidentes históricos e identificar anomalías de comportamiento más rápido que los humanos.

Por ejemplo: La función "Attack Discovery" de **Elastic Security** utiliza IA generativa para analizar eventos de miles de detecciones, resumiendo y agrupando alertas relacionadas en una historia de ataque.

_AI Attack Discovery_ aprovecha los LLMs (Grandes Modelos de Lenguaje) para analizar alertas en un entorno e identificar amenazas. El resumen representa un ataque y muestra las relaciones entre múltiples alertas para ayudarnos a identificar qué usuarios y hosts están involucrados. Esto también muestra mapeos de **MITRE ATT&CK**. Aquí hay un ejemplo de cómo se ve el descubrimiento de ataques:
![[Etapa de Detección y Análisis (Parte 2)-3.png]]

En este descubrimiento, la IA ayudó revisando múltiples alertas y generó una visión general completa del ataque, identificando las actividades clave que ocurrieron durante el incidente. La IA también puede ayudar en la respuesta a incidentes. Algunos de los casos de uso incluyen:

- Clasificación (_Triage_) automatizada y priorización de alertas.
- Correlación de incidentes y reconstrucción de la línea de tiempo.
- Libros de jugadas (_Playbooks_) de respuesta automatizada.
- Asistencia de IA en el análisis y aprendizaje post-incidente.

#### Resumen

En las dos últimas secciones, hemos repasado los pasos iniciales de la etapa de Detección y Análisis, gestionando procesos vitales y documentando cada uno de los pasos necesarios durante un incidente. Mantenerse enfocado y organizado es una de las cosas clave que necesitamos mantener para llevar a cabo adecuadamente esta etapa.

---
