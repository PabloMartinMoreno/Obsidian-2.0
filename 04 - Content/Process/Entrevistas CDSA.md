#### 1. ¿Qué es un SIEM y para qué se utiliza?

Un **SIEM** (Security Information and Event Management) es una solución centralizada que recolecta, agrega y analiza logs de múltiples fuentes (firewalls, servidores, antivirus). Se utiliza para detectar amenazas mediante correlación de eventos en tiempo real, gestionar incidentes y cumplir con normativas de auditoría.

#### 2. ¿Qué diferencia hay entre un evento y una alerta?

Un **evento** es cualquier registro de actividad en un sistema (ej. "usuario logueado", "archivo abierto"). Una **alerta** es un evento (o conjunto de eventos) que ha sido analizado y marcado como sospechoso o malicioso, requiriendo atención o acción humana inmediata.

#### 3. ¿Cuál es la diferencia entre IDS e IPS?

El **IDS** (Intrusion Detection System) solo monitoriza y _alerta_ sobre tráfico sospechoso (es pasivo). El **IPS** (Intrusion Prevention System) se coloca en línea con el tráfico y puede _bloquear_ activamente los paquetes maliciosos para prevenir el ataque.

#### 4. ¿Cuál es la CIA TRIAD?

Es el modelo fundamental de la seguridad de la información:
- **Confidencialidad:** Solo las personas autorizadas pueden acceder a la información.
- **Integridad:** La información no ha sido alterada ni manipulada.
- **Disponibilidad:** La información y los sistemas están accesibles cuando se necesitan.

#### 5. ¿Qué es un incidente de ciberseguridad?

Es cualquier evento que comprometa la confidencialidad, integridad o disponibilidad de un sistema de información, o que viole las políticas de seguridad de la organización (ej. un malware, un acceso no autorizado o una filtración de datos).

#### 6. ¿Cuál es el objetivo principal de un SOC?

El objetivo principal es **monitorizar, detectar, investigar y responder** a las amenazas de ciberseguridad de una organización para minimizar el impacto de los incidentes.


#### 7. ¿Qué es el phishing y cómo se lo identifica?

Es un ataque de ingeniería social que intenta engañar al usuario para que revele información sensible. Se identifica revisando:
    - El remitente (direcciones de correo extrañas o suplantadas).
    - La urgencia en el lenguaje ("¡Hágalo ya!").
    - Enlaces sospechosos (URLs que no coinciden con el sitio oficial).
    - Archivos adjuntos inesperados.

#### 8. ¿Qué puerto usa el protocolo HTTPS?

El puerto **443** (TCP).

#### 9. ¿Cuál es el puerto por defecto de Syslog?

El puerto **514** (UDP es el estándar clásico, aunque también se usa TCP para mayor fiabilidad).

#### 10. ¿Qué herramientas conoces para realizar análisis de logs?

"He trabajado con **Splunk** para búsquedas y dashboards, **ELK Stack** (Elasticsearch, Logstash, Kibana), y conozco **Wireshark** para análisis de paquetes a nivel de red".

#### 11. ¿Cómo investigarías un posible incidente de exfiltración de datos?

1. Revisaría los logs del **DLP** (Data Loss Prevention) y del Proxy/Firewall.
2. Buscaría transferencias de archivos grandes o conexiones inusuales hacia IPs externas o servicios de almacenamiento en la nube (Google Drive, Dropbox).
3. Analizaría si la transferencia ocurrió en horarios inusuales.
4. Verificaría qué usuario y desde qué endpoint se originó el tráfico.

#### 12. ¿Explicar qué es un Indicador de Compromiso (IoC) y dar un ejemplo?

Un IoC es una evidencia digital que sugiere que un sistema ha sido comprometido. Ejemplos:
- Un **hash MD5/SHA256** de un archivo malicioso conocido.
- Una **dirección IP** asociada a un servidor de Comando y Control (C2).
- Un nombre de dominio malicioso.

#### 13. ¿Qué es un playbook en un SOC?

Es un documento o flujo de trabajo estandarizado que detalla los pasos exactos que un analista debe seguir para responder a un tipo específico de incidente (ej. "Playbook de Phishing", "Playbook de Ransomware") para asegurar una respuesta consistente y efectiva.

#### 14. ¿Cómo se interpreta un log de autenticación fallida sospechoso?

Busco patrones:
- **Volumen:** ¿Son 2 intentos (error humano) o 500 intentos en un minuto (fuerza bruta)?
- **Origen:** ¿La IP es interna o viene de un país inusual?
- **Resultado:** ¿Hubo un "Success" después de muchos fallos? (Esto es crítico: indica que el ataque tuvo éxito).

#### 15. ¿Qué harías si recibes mil alertas de tráfico por SSH en menos de 5 minutos?

1. Esto indica un probable ataque de fuerza bruta.
2. Verificaría inmediatamente si alguna conexión tuvo éxito.
3. Bloquearía la IP de origen en el firewall.
4. Si hubo éxito, aislaría el servidor afectado y escalaría el incidente para respuesta a incidentes (IR).

#### 16. ¿Qué información buscarías en un log de firewall?

Los 5 campos clave (tupla): **IP de Origen, IP de Destino, Puerto de Origen, Puerto de Destino y Acción** (Allow/Deny). También miraría el protocolo y la hora (Timestamp).

#### 17. ¿Qué es MITRE ATT&CK y cómo se aplica?

Es una base de conocimiento global que describe las **Tácticas, Técnicas y Procedimientos (TTPs)** que usan los atacantes. En un SOC, se usa para mapear las alertas y entender en qué fase del ataque está el adversario (ej. ¿están haciendo "Reconocimiento" o "Movimiento Lateral"?).

#### 18. ¿Cuál es la diferencia entre malware y ransomware?

**Malware** es el término general para _cualquier_ software malicioso (virus, troyanos, spywware). **Ransomware** es un tipo específico de malware diseñado para cifrar los archivos de la víctima y exigir un pago (rescate) para recuperarlos.

#### 19. ¿Qué significa cuando un endpoint se comunica con una dirección IP en lista negra?

Significa que un dispositivo interno probablemente está infectado y está intentando contactar a un servidor de **Comando y Control (C2)** controlado por atacantes para recibir instrucciones o descargar más malware. Es una alerta de prioridad alta.

#### 20. ¿Cuál es el propósito de un DSM en QRadar?

Un **DSM (Device Support Module)** en IBM QRadar es un módulo que permite al SIEM "entender" y **parsear** (analizar) los logs que vienen de dispositivos específicos. Sin el DSM correcto, QRadar vería los logs como texto sin formato y no podría categorizarlos ni correlacionarlos correctamente.

#### 21. ¿Qué es el Three-Way Handshake de TCP?

Es el proceso de tres pasos mediante el cual se establece una conexión fiable entre un cliente y un servidor.
1. SYN: El cliente envía un paquete de sincronización para iniciar la conexión.
2. SYN-ACK: El servidor recibe el paquete y responde confirmando la solicitud.
3. ACK: El cliente envía una confirmación final y la conexión queda establecida.

#### 22. ¿Cómo funciona el DNS y qué puerto utiliza?

El DNS (Sistema de Nombres de Dominio) funciona como una guía telefónica de internet, traduciendo nombres de dominio legibles para humanos (como https://www.google.com/search?q=google.com) a direcciones IP (como 142.250.1.1) que las máquinas pueden entender. Utiliza el puerto 53 (generalmente UDP, aunque usa TCP para transferencias de zona).

#### 23. ¿Qué es el modelo OSI y cuáles son sus capas?

Es un modelo conceptual que estandariza las funciones de comunicación de un sistema informático. Tiene 7 capas, que van desde lo físico hasta el usuario final:
1. Física
2. Enlace de datos
3. Red
4. Transporte
5. Sesión
6. Presentación
7. Aplicación

#### 24. ¿Dónde buscarías persistencia en un sistema Windows?

La persistencia es la técnica que usa el malware para sobrevivir a un reinicio del sistema. Los lugares más comunes para buscar son:
- Las claves Run y RunOnce en el Registro de Windows.
- La carpeta de Inicio (Startup) en el menú de programas.
- Las Tareas Programadas (Task Scheduler).
- Los Servicios de Windows.

#### 25. ¿Cuál es la diferencia entre Hashing y Encriptación?

La diferencia principal es la reversibilidad. La encriptación es bidireccional; los datos se ocultan pero pueden recuperarse a su estado original si se tiene la clave correcta. El hashing es unidireccional; convierte los datos en una cadena de caracteres única y fija que no puede revertirse a su forma original. Se usa para verificar la integridad de archivos o contraseñas.

#### 26. ¿Qué es una inyección SQL (SQLi)?

Es una vulnerabilidad web en la que un atacante interfiere con las consultas que una aplicación hace a su base de datos. Permite al atacante ver datos que no debería (como contraseñas de otros usuarios), modificar datos o incluso borrarlos, inyectando código SQL malicioso en los campos de entrada.

#### 27. ¿Qué diferencia hay entre un Falso Positivo y un Falso Negativo?

Un Falso Positivo ocurre cuando el sistema de seguridad genera una alerta por una actividad que en realidad es benigna o legítima. Es molesto pero no peligroso.

Un Falso Negativo ocurre cuando hay un ataque real pero el sistema de seguridad falla en detectarlo y no genera ninguna alerta. Este es mucho más peligroso porque la amenaza pasa desapercibida.

#### 28. ¿Cuáles son los pasos del ciclo de vida de Respuesta a Incidentes (PICERL)?

Son los pasos estandarizados para manejar un incidente de seguridad:

1. Preparación: Tener las herramientas y equipos listos antes de que pase algo.
2. Identificación: Detectar que está ocurriendo un incidente.
3. Contención: Limitar el daño (aislar sistemas).
4. Erradicación: Eliminar la causa raíz del incidente (borrar el malware).
5. Recuperación: Restaurar sistemas y volver a la normalidad.
6. Lecciones Aprendidas: Analizar qué pasó para mejorar en el futuro.

#### 29. ¿Qué es el protocolo ARP y por qué es importante?

ARP (Protocolo de Resolución de Direcciones) se encarga de asociar una dirección IP (lógica) con una dirección MAC (física). Es fundamental porque los switches y dispositivos en una red local se comunican usando direcciones MAC. Si este protocolo es manipulado (ARP Spoofing), un atacante puede interceptar el tráfico de la red.

#### 30. ¿Qué es una DMZ y para qué sirve?

Una DMZ (Zona Desmilitarizada) es una subred física o lógica que actúa como zona de amortiguación entre la red interna segura de una organización y una red insegura como internet. Allí se colocan los servicios que deben ser accesibles desde fuera (como servidores web o de correo) para que, si son comprometidos, el atacante no tenga acceso directo a la red interna principal.

#### 31. ¿Qué es un ataque de fuerza bruta vs un ataque de diccionario?

En un ataque de fuerza bruta, el atacante prueba todas las combinaciones posibles de caracteres hasta encontrar la contraseña correcta. Es lento pero seguro.

En un ataque de diccionario, el atacante utiliza una lista predefinida de palabras comunes o contraseñas filtradas anteriormente. Es mucho más rápido pero solo funciona si la contraseña es débil o común.

#### 32. ¿Qué significa hacer Hardening en un sistema?

El hardening o endurecimiento es el proceso de asegurar un sistema reduciendo su superficie de ataque. Esto incluye acciones como cerrar puertos innecesarios, desinstalar software que no se usa, cambiar contraseñas por defecto, aplicar parches de seguridad y configurar correctamente los permisos de usuarios.

#### 33. ¿Qué información te da el comando netstat?

El comando netstat es una herramienta de línea de comandos que muestra las conexiones de red activas (tanto entrantes como salientes), las tablas de enrutamiento y las estadísticas de las interfaces de red. Es muy útil para identificar si un malware está estableciendo conexiones con el exterior.

#### 34. ¿Qué es el DHCP y el proceso DORA?

DHCP es el protocolo que asigna automáticamente direcciones IP a los dispositivos en una red. El proceso de asignación se conoce como DORA:
- Discovery: El cliente busca un servidor DHCP.
- Offer: El servidor ofrece una IP.
- Request: El cliente acepta la oferta y la solicita.
- Acknowledge: El servidor confirma la asignación y la IP queda reservada para ese cliente.

#### 35. ¿Cómo identificarías si un correo electrónico es spoofing?

El spoofing de correo consiste en falsificar el remitente para que parezca que viene de una fuente confiable. Para identificarlo técnicamente, se deben analizar los encabezados del correo (headers) y verificar los registros SPF, DKIM y DMARC. Si la IP de origen del correo no está autorizada en el registro SPF del dominio que dice ser, es muy probable que sea un correo falsificado.