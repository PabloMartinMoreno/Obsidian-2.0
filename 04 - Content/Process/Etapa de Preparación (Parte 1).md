---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Etapa de Preparación (Parte 1)

En la etapa de Preparación, tenemos dos objetivos separados. El primero es el establecimiento de una capacidad de **gestión de incidentes** dentro de la organización. El segundo es la capacidad de protegerse contra y prevenir incidentes de seguridad de TI implementando medidas de protección adecuadas. Tales medidas incluyen el endurecimiento (_hardening_) de endpoints y servidores, la división en niveles (_tiering_) del Directorio Activo, la Autenticación Multifactor (MFA), la gestión de accesos privilegiados (PAM), etc. Aunque proteger contra incidentes no es responsabilidad del equipo de gestión de incidentes, esta actividad es fundamental para el éxito general de ese equipo.

#### Prerrequisitos de Preparación

Durante la etapa de preparación, necesitamos asegurarnos de tener:

- **Miembros del equipo de gestión de incidentes cualificados** (los miembros del equipo pueden ser externos/tercerizados, pero es necesaria una capacidad básica y comprensión de la gestión de incidentes dentro de la casa, independientemente de ello).
- **Una fuerza laboral capacitada** (tanto como sea posible, a través de actividades de concienciación sobre seguridad u otros medios de formación).
- **Políticas y documentación claras.*    
- **Herramientas** (software y hardware).

![[Etapa de Preparación (Parte 1).png]]


#### Políticas Claras y Documentación

Algunas de las políticas escritas y documentación deben contener una versión actualizada de la siguiente información:

- Información de contacto y roles de los miembros del equipo de gestión de incidentes.
- Información de contacto del departamento legal y de cumplimiento, equipo directivo, soporte de TI, departamento de comunicaciones y relaciones con los medios, fuerzas de seguridad, proveedores de servicios de internet, gestión de instalaciones y equipo de respuesta a incidentes externo.
- Política, plan y procedimientos de respuesta a incidentes.
- Política y procedimientos de intercambio de información sobre incidentes.
- Líneas base (_baselines_) de sistemas y redes, extraídas de una imagen dorada (_golden image_) y un entorno en estado limpio.
- Diagramas de red.
- Base de datos de gestión de activos de toda la organización.
- Cuentas de usuario con privilegios excesivos que pueden ser utilizadas bajo demanda por el equipo cuando sea necesario (también para sistemas críticos del negocio, que se manejan con las habilidades necesarias para administrar ese sistema específico). Estas cuentas de usuario normalmente se habilitan cuando se confirma un incidente durante la investigación inicial y luego se deshabilitan una vez que ha terminado. También se realiza un restablecimiento de contraseña obligatorio al deshabilitar a los usuarios.
- Capacidad para adquirir hardware, software o un recurso externo sin un proceso de compras completo (compra urgente de hasta una cierta cantidad). Lo último que necesitas durante un incidente es esperar semanas para la aprobación de una herramienta de $500.
- Hojas de referencia rápida (_cheat sheets_) forenses/de investigación.

Algunos de los casos no graves pueden manejarse de manera relativamente rápida y sin demasiada fricción dentro de la organización o fuera de ella. Otros casos pueden requerir notificación a las fuerzas de seguridad y comunicación externa a clientes y proveedores externos, especialmente en casos de preocupaciones legales derivadas del incidente. Por ejemplo, una violación de datos que involucre datos de clientes debe ser reportada a las autoridades dentro de un cierto umbral de tiempo de acuerdo con el RGPD (GDPR). Puede haber muchos requisitos de cumplimiento dependiendo de la ubicación y/o sucursales donde haya ocurrido el incidente, por lo que la mejor manera de entenderlos es discutirlos con tus equipos legales y de cumplimiento base a cada incidente (o proactivamente).

Si bien tener documentación en su lugar es vital, también es importante **documentar el incidente mientras investigamos**. Por lo tanto, durante esta etapa, también tendremos que establecer una capacidad de reporte efectiva. Los incidentes pueden ser extremadamente estresantes, y se vuelve fácil olvidar esta parte a medida que se desarrolla el incidente, especialmente cuando estamos enfocados y moviéndonos extremadamente rápido para resolverlo lo antes posible. Debemos tratar de mantener la calma, tomar notas y asegurarnos de que estas notas contengan marcas de tiempo, la actividad realizada, el resultado de la misma y quién lo hizo. En general, debemos buscar respuestas a **quién, qué, cuándo, dónde, por qué y cómo**.

#### Herramientas (Software y Hardware)

Avanzando, también necesitamos asegurarnos de tener las herramientas adecuadas para realizar el trabajo. Estas incluyen, pero no se limitan a:

- Una computadora portátil adicional o una estación de trabajo forense para cada miembro del equipo de gestión de incidentes para preservar imágenes de disco y archivos de registro (logs), realizar análisis de datos e investigar sin restricciones (sabemos que el malware se probará aquí, por lo que herramientas como el antivirus deben estar deshabilitadas). Estos dispositivos deben manejarse adecuadamente y no de una manera que introduzca riesgos para la organización.
- Herramientas de adquisición y análisis de imágenes forenses digitales.
- Herramientas de captura y análisis de memoria.
- Herramientas de captura y análisis de respuesta en vivo (_live response_).
- Herramientas de análisis de registros (_logs_).
- Herramientas de captura y análisis de red.
- Cables de red y switches.
- Bloqueadores de escritura (_write blockers_).
- Discos duros para imágenes forenses.
- Cables de alimentación.
- Destornilladores, pinzas y otras herramientas relevantes para reparar o desmontar dispositivos de hardware si es necesario.
- Creador de Indicadores de Compromiso (IOC) y la capacidad de buscar IOCs en toda la organización.
- Formularios de cadena de custodia.
- Software de encriptación.
- Sistema de seguimiento de tickets.
- Instalación segura para almacenamiento e investigación.
- Sistema de gestión de incidentes independiente de la infraestructura de su organización.

Muchas de las herramientas mencionadas anteriormente serán parte de lo que se conoce como una **mochila de respuesta rápida** (_jump bag_): siempre lista con las herramientas necesarias para ser recogida y llevada inmediatamente. Sin esta bolsa preparada, reunir todas las herramientas necesarias sobre la marcha puede llevar días o semanas antes de que estemos listos para responder.

Finalmente, queremos enfatizar la importancia de tener nuestro sistema de documentación **completamente independiente de la infraestructura de nuestra organización** y debidamente asegurado. Asume desde el principio que todo nuestro dominio está comprometido y que todos los sistemas pueden volverse inaccesibles. De manera similar, las comunicaciones sobre un incidente deben realizarse a través de canales que no sean parte de los sistemas de la organización; asume que los adversarios tienen control sobre todo y pueden leer canales de comunicación como el correo electrónico.

---
