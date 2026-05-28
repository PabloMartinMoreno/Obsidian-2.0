---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


---

# Gestión de Incidentes (Incident Handling)

## Definición y Alcance de la Gestión de Incidentes

La gestión de incidentes (IH, por sus siglas en inglés) se ha convertido en una parte importante de la capacidad defensiva de una organización contra el cibercrimen. Si bien se implementan constantemente medidas de protección para prevenir o reducir el número de incidentes de seguridad, una capacidad de gestión de incidentes es innegablemente necesaria para cualquier organización que no pueda permitirse comprometer la confidencialidad, integridad o disponibilidad de sus datos. Algunas organizaciones optan por implementar esta capacidad internamente, mientras que otras confían en proveedores externos para apoyarlos, ya sea de forma continua o cuando sea necesario. Antes de sumergirnos en el mundo de los incidentes de seguridad, definamos algunos términos y establezcamos una comprensión común de los mismos.

Un **evento** es una acción que ocurre en un sistema o red. Ejemplos de eventos incluyen:
- Un usuario enviando un correo electrónico.
- Un clic del mouse.
- Un firewall permitiendo una solicitud de conexión.

Un **incidente** es un evento con una consecuencia negativa. Un ejemplo de incidente es una caída del sistema. Otro ejemplo es el acceso no autorizado a datos sensibles. Los incidentes también pueden ocurrir debido a desastres naturales, fallas de energía, etc.

No existe una única definición de lo que es un incidente de seguridad de TI, y por lo tanto varía entre organizaciones. Definimos un **incidente de seguridad de TI** como un evento con una clara intención de causar daño que se realiza contra un sistema informático. Ejemplos de incidentes incluyen:
- Robo de datos.
- Robo de fondos.
- Acceso no autorizado a datos.
- Instalación y uso de malware y herramientas de acceso remoto.

La **gestión de incidentes** es un conjunto claramente definido de procedimientos para gestionar y responder a incidentes de seguridad en un entorno informático o de red.

![[Proceso de Gestión de Accidentes-1.png]]

Es importante notar que la gestión de incidentes no se limita solo a incidentes de intrusión.

Otros tipos de incidentes, como los causados por **insiders maliciosos** (empleados internos), problemas de disponibilidad y pérdida de propiedad intelectual, también caen dentro del alcance de la gestión de incidentes. Un plan integral de gestión de incidentes debe abordar varios tipos de incidentes y proporcionar las medidas adecuadas para identificar, contener, erradicar y recuperarse de ellos para restaurar las operaciones comerciales normales lo más rápida y eficientemente posible.

Ten en cuenta que puede no ser inmediatamente claro que un evento es un incidente hasta que se realice una investigación inicial. Dicho esto, hay algunos eventos sospechosos que deben tratarse como incidentes hasta que se demuestre lo contrario.

## Valor de la Gestión de Incidentes y Notas Generales

Los incidentes de seguridad de TI frecuentemente involucran el compromiso de datos personales y comerciales, y por lo tanto es crucial responder rápida y eficazmente. En algunos incidentes, el impacto puede limitarse a unos pocos dispositivos, mientras que en otros, una gran parte del entorno puede verse comprometida. Un gran beneficio de tener un equipo de gestión de incidentes (a menudo referido como "equipo de respuesta a incidentes" o CSIRT/CERT) manejando eventos es que una fuerza laboral capacitada responderá sistemáticamente y, por lo tanto, se tomarán las acciones apropiadas. De hecho, el objetivo de tales equipos es minimizar el robo de información o la interrupción de servicios que el incidente está causando. Esto se logra realizando investigaciones y pasos de remediación, que discutiremos más a fondo en breve. En general, las decisiones que se toman antes, durante y después de un incidente afectarán su impacto.

Debido a que diferentes incidentes tendrán diferentes impactos en la organización, necesitamos entender la importancia de la **priorización**. Los incidentes con mayor gravedad requerirán atención inmediata y recursos asignados a ellos, mientras que otros clasificados más bajo también pueden requerir una investigación inicial para determinar si son, de hecho, incidentes de seguridad de TI con los que estamos tratando.

El equipo de gestión de incidentes está dirigido por un **Gerente de Incidentes** (Incident Manager). Este rol a menudo se asigna a un gerente de SOC, CISO/CIO, o un proveedor externo (de confianza), y esta persona generalmente tiene la capacidad de dirigir también a otras unidades de negocio. El gerente de incidentes debe ser capaz de obtener información o tener el mandato de requerir a cualquier empleado de la organización que realice una actividad de manera oportuna, si es necesario. El gerente de incidentes es el punto único de comunicación que rastrea las actividades realizadas durante la investigación y su estado de finalización.

Uno de los recursos más utilizados sobre gestión de incidentes es la **Guía de Gestión de Incidentes de Seguridad Informática del NIST**. El documento tiene como objetivo ayudar a las organizaciones a mitigar los riesgos de incidentes de seguridad informática proporcionando pautas prácticas para responder a incidentes de manera efectiva y eficiente.

## Diferentes Tipos de Incidentes del Mundo Real

### Credenciales Filtradas

- **Ataque de Ransomware a Colonial Pipeline:** El Colonial Pipeline, un importante sistema de oleoductos estadounidense, fue víctima de un ataque de ransomware. Este ataque se originó a partir de la contraseña personal de un empleado filtrada, probablemente encontrada en la dark web, en lugar de un ataque directo a la red de la empresa. Los atacantes obtuvieron acceso a los sistemas de la empresa utilizando una contraseña comprometida para una cuenta VPN (Red Privada Virtual) inactiva, que no tenía habilitada la Autenticación Multifactor (MFA).

### Credenciales Predeterminadas / Débiles

- **Botnet Mirai (2016):** La botnet Mirai escaneó dispositivos IoT utilizando credenciales de fábrica o predeterminadas (por ejemplo, admin/admin) y los reclutó en una masiva botnet DDoS. Esto llevó a interrupciones DDoS a gran escala afectando a empresas como Dyn y OVH, con cientos de miles de dispositivos infectados. La causa raíz fue que los dispositivos se enviaron con credenciales predeterminadas sin cambios y una seguridad de acceso remoto deficiente.

- **Incidente de LogicMonitor (2023):** Algunos clientes de LogicMonitor se vieron comprometidos porque el proveedor emitió contraseñas predeterminadas débiles para las cuentas de los clientes. Los clientes afectados experimentaron incidentes posteriores de ransomware o acceso no autorizado. La causa raíz involucró credenciales débiles/predeterminadas asignadas por el proveedor y la aplicación tardía del endurecimiento (hardening) de contraseñas.

### Software Desactualizado / Sistemas Sin Parchear

- **Brecha de Equifax (2017):** Los atacantes explotaron una vulnerabilidad conocida de Apache Struts (CVE-2017-5638) en la aplicación web de Equifax. Esta brecha expuso los datos personales de aproximadamente 143–147 millones de personas, lo que llevó a importantes consecuencias regulatorias y legales. El incidente ocurrió debido a la falta de aplicación oportuna de un parche lanzado públicamente.

- **WannaCry (2017):** El ransomware WannaCry se propagó como un gusano utilizando el exploit SMB EternalBlue, afectando a más de 200,000 sistemas en más de 150 países. Los impactos de alto perfil incluyeron hospitales y empresas. Este incidente se debió a sistemas Windows sin parches, a pesar de que el parche MS17-010 estaba disponible antes del brote.

### Empleado Desleal / Amenaza Interna (Insider Threat)

- **Cash App / Block Inc. (Divulgación 2021; Aviso Público 2022):** Un ex empleado accedió a la información personal de millones de usuarios de Cash App, según se informó en las divulgaciones de la compañía. Aproximadamente 8.2 millones de clientes actuales y anteriores fueron potencialmente afectados, lo que llevó a un escrutinio regulatorio y acuerdos. La causa raíz fue el abuso del acceso legítimo de los empleados y controles internos y monitoreo insuficientes.

### Phishing / Ingeniería Social

- **Tendencia de la Industria y Datos Representativos:** El phishing es un vector generalizado utilizado para obtener credenciales, entregar malware o engañar a los usuarios para que habiliten el acceso remoto. Frecuentemente conduce al compromiso de cuentas, fraude y puntos de apoyo en la red. Una parte significativa de las brechas a lo largo de varios años está vinculada al phishing.

- **Ataque de Phishing al Departamento del Interior de EE. UU.:** Los atacantes utilizaron una técnica de "gemelo malvado" (evil twin) para engañar a las personas para que se conectaran a una red Wi-Fi falsa, permitiendo a los hackers robar credenciales y acceder a la red. Este incidente reveló una falta de infraestructura de red inalámbrica segura y medidas de seguridad insuficientes, incluida una autenticación de usuario débil y pruebas de red inadecuadas.

- **Secuestro de Cuentas de Twitter 2020:** En 2020, muchas cuentas de Twitter de alto perfil fueron comprometidas por partes externas para promover una estafa de bitcoin. Los atacantes obtuvieron acceso a las herramientas administrativas de Twitter, lo que les permitió alterar cuentas y publicar tweets directamente. Parecían haber utilizado ingeniería social para obtener acceso a las herramientas a través de empleados de Twitter.

### Ataque a la Cadena de Suministro (Supply-Chain Attack)

- **SolarWinds Orion (2020):** Actores de estado-nación comprometieron el entorno de construcción/lanzamiento de SolarWinds e inyectaron una puerta trasera (backdoor) maliciosa en las actualizaciones de Orion, que se distribuyeron a miles de clientes. Esto causó espionaje de gran alcance y acceso no autorizado en sectores gubernamentales y privados, lo que llevó a esfuerzos prolongados de detección y remediación.

___

## Ejemplo de Informes de Incidentes

Deberíamos ser capaces de documentar un incidente de seguridad del mundo real en un formato secuencial, etapa por etapa, alineado con marcos como la **Cyber Kill Chain** (explicada en la siguiente sección) y el marco **MITRE ATT&CK** (es decir, moviéndose desde el acceso inicial hasta el impacto), tal como se ve en informes profesionales de Mandiant, Palo Alto Unit 42, Proofpoint, etc.

Un ejemplo de un informe de incidente de DFIR Labs es el siguiente:

- **Exploit de Confluence conduce a Ransomware LockBit**

Este informe documenta los hallazgos del incidente de manera secuencial. Cada sección representa una fase distinta de la operación del adversario, es decir, desde el Acceso Inicial y Ejecución hasta la Exfiltración e Impacto. Esto ilustra cómo progresó el ataque a través del entorno.

La plataforma DFIR Labs contiene muchos más informes de incidentes. Puedes verlos aquí.
![[Proceso de Gestión de Accidentes-2.png]]

Página de inicio del Informe DFIR mostrando tres artículos destacados en una cuadrícula debajo de un encabezado rojo con navegación.

Aquí hay otro ejemplo de un informe de incidente de Cybereason.

- **CHAES: Nuevo Malware Dirigido al Comercio Electrónico en América Latina**

Estos son informes específicos de incidentes que se centran en un evento o brote en particular. Por ejemplo, el informe estilo "Exploit de Confluence conduce a Ransomware LockBit" recorre paso a paso lo que sucedió en ese ataque único: cómo el adversario ganó acceso, qué hicieron, cómo fueron detectados, cuál fue el impacto, etc. El objetivo es proporcionar una narrativa forense detallada y hallazgos procesables específicos para ese incidente.

También hay informes globales de respuesta a incidentes (como el informe de Unit 42 de 2025), que agregan datos de cientos de incidentes en una variedad de industrias, geografías y actores de amenazas. Su objetivo es identificar tendencias, patrones, amenazas emergentes y proporcionar conocimientos estadísticos y recomendaciones de alto nivel para los defensores.

**Por ejemplo, el informe de Unit 42 de 2025 declara:**
"En 2024, el 86% de los incidentes a los que respondió Unit 42 involucraron interrupción del negocio — abarcando tiempo de inactividad operativo, daño reputacional, o ambos". Además, "Los ataques a la cadena de suministro de software y a la nube están creciendo tanto en frecuencia como en sofisticación. En una campaña, los atacantes escanearon más de 230 millones de objetivos únicos en busca de información sensible."

Un informe de PaloAlto Unit42 que cubre incidentes globales es el siguiente:
- **Informe Global de Respuesta a Incidentes**

## Escenario de Incidente

A lo largo de este módulo, nos referiremos a un escenario de incidente para comprender algunos desafíos que enfrentan los gestores de incidentes. Este incidente muestra un ejemplo de los patrones observados repetidamente en incidentes del mundo real. La víctima en este escenario es **Insight Nexus**, una firma global de investigación de mercado que maneja datos competitivos sensibles para clientes de alto perfil en el sector de TI. La firma se convierte en el objetivo de dos grupos de amenazas distintos que operan simultáneamente dentro de su entorno.

El diagrama a continuación muestra una visión general de la víctima y los actores de amenazas.
![[Proceso de Gestión de Accidentes-3.png]]

Basado en la información que hemos recopilado, el primer actor de amenaza ganó entrada cuando los administradores del sistema olvidaron cambiar la contraseña predeterminada admin/admin en una aplicación orientada a Internet, es decir, **ManageEngine ADManager Plus**, después de una actualización del producto. Aprovechando esto, los atacantes iniciaron sesión con éxito, realizaron reconocimiento, mapearon usuarios y máquinas, y finalmente crearon nuevas cuentas privilegiadas de Active Directory. Usando una de las cuentas recién creadas, los adversarios pivotaron (se movieron lateralmente) más adentro en el entorno, identificando un servicio RDP externo expuesto por una mala configuración. Explotando ese punto de entrada, escalaron su control y finalmente usaron Objetos de Política de Grupo (GPOs) para desplegar spyware utilizando un paquete MSI en múltiples endpoints.