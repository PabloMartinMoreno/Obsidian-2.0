---
aliases:
tags:
  - type/concept
  - tool/elasticsearch
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Introducción al Elastic Stack

#### ¿Qué es el Elastic Stack?

El **Elastic Stack** (anteriormente conocido como ELK Stack), creado por Elastic, es una colección de código abierto de principalmente tres aplicaciones (**Elasticsearch**, **Logstash** y **Kibana**) que trabajan en armonía para ofrecer a los usuarios capacidades integrales de búsqueda y visualización para el análisis y la exploración en tiempo real de fuentes de archivos de registro (_logs_).
![[Pasted image 20260108144708.png]]

La arquitectura de alto nivel del Elastic Stack puede mejorarse en entornos intensivos en recursos con la adición de **Kafka**, **RabbitMQ** y **Redis** para el almacenamiento en búfer (_buffering_) y la resiliencia, y **nginx** para la seguridad.
![[Pasted image 20260108144725.png]]

El flujo de datos típico es: Los **Beats** recopilan datos de fuentes (como Filebeat y Metricbeat), los envían a **Logstash** o a una Cola de Mensajería (Kafka, Redis), luego a **Elasticsearch** para su procesamiento (nodos Maestros, de Ingesta, de Datos), y finalmente a **Kibana** para su visualización.

Profundicemos en cada componente del Elastic Stack:

- **Elasticsearch:** Es un motor de búsqueda distribuido y basado en JSON, diseñado con APIs RESTful. Como componente central del Elastic Stack, maneja la indexación, el almacenamiento y las consultas. Elasticsearch permite a los usuarios realizar consultas sofisticadas y operaciones de análisis sobre los registros de archivos de log procesados por Logstash.
    
- **Logstash:** Es responsable de recopilar, transformar y transportar registros de archivos de log. Su fortaleza radica en su capacidad para consolidar datos de varias fuentes y normalizarlos. Logstash opera en tres áreas principales:
    1. **Procesar entrada (Input):** Ingesta registros desde ubicaciones remotas, convirtiéndolos a un formato legible por máquinas (desde archivos planos, sockets TCP, mensajes syslog, etc.).
    2. **Transformar y enriquecer (Filter):** Modifica el formato y contenido del registro. Los _plugins_ de filtrado pueden realizar procesamiento intermedio basado en condiciones predefinidas.
    3. **Enviar registros (Output):** Utiliza _plugins_ de salida para transmitir los registros a Elasticsearch.

- **Kibana:** Sirve como la herramienta de visualización para los documentos de Elasticsearch. Los usuarios pueden ver los datos almacenados y ejecutar consultas. Además, simplifica la comprensión de los resultados mediante tablas, gráficos y tableros (_dashboards_) personalizados.

- **Beats:** Es un componente adicional. Son agentes de envío de datos ligeros y de propósito único (_single-purpose data shippers_) diseñados para instalarse en máquinas remotas y reenviar logs y métricas directamente a Logstash o Elasticsearch.


**Flujos de datos comunes:**

- _Beats -> Logstash -> Elasticsearch -> Kibana_ (Para procesamiento/transformación compleja).
    ![[Pasted image 20260108144749.png]]
- _Beats -> Elasticsearch -> Kibana_ (Para ingestión directa y rápida).
    ![[Pasted image 20260108144758.png]]

---

### El Elastic Stack como solución SIEM

El Elastic Stack se puede utilizar como una solución de **Gestión de Eventos e Información de Seguridad (SIEM)** para recopilar, almacenar, analizar y visualizar datos relacionados con la seguridad de varias fuentes (firewalls, IDS/IPS, endpoints).

![[Pasted image 20260108144836.png]]

Para detectar incidentes de seguridad, Elasticsearch se utiliza para realizar búsquedas y correlaciones en los datos recopilados. Como analistas del Centro de Operaciones de Seguridad (SOC), es probable que usemos **Kibana** extensivamente como nuestra interfaz principal.

---

### Lenguaje de Consultas de Kibana (KQL)

**KQL (Kibana Query Language)** es un lenguaje potente y fácil de usar diseñado específicamente para buscar y analizar datos en Kibana. Ofrece un enfoque más intuitivo que el _Query DSL_ nativo de Elasticsearch.

#### Estructura Básica

Las consultas KQL se componen de pares `campo:valor`.

**Ejemplo:**
```YAML
event.code:4625
```

Esta consulta filtra los datos para mostrar eventos con el código de evento de Windows **4625**, asociado con **intentos de inicio de sesión fallidos**. Esto ayuda a identificar ataques de fuerza bruta o adivinación de contraseñas. Si refinamos la consulta (agregando IP de origen, usuario, hora), podemos obtener información más específica.

#### Búsqueda de Texto Libre

Permite buscar un término específico en múltiples campos sin especificar un nombre de campo.

Ejemplo:
```YAML
"svc-sql1"
```

Devuelve registros que contienen la cadena "svc-sql1" en cualquier campo indexado.

#### Operadores Lógicos

KQL soporta AND, OR y NOT.

Ejemplo:
```YAML
event.code:4625 AND winlog.event_data.SubStatus:0xC0000072
```

Esta consulta busca intentos de inicio de sesión fallidos (4625) donde el `SubStatus` es `0xC0000072`. En Windows, este sub-estado indica que **la cuenta está deshabilitada**. Identificar intentos de acceso a cuentas deshabilitadas es crucial para detectar comportamientos sospechosos.

#### Operadores de Comparación

Soporta :, :>, :>=, :<, :<=, y :!.

Ejemplo:
```YAML
event.code:4625 AND winlog.event_data.SubStatus:0xC0000072 AND @timestamp >= "2023-03-03T00:00:00.000Z" AND @timestamp <= "2023-03-06T23:59:59.999Z"
```

Esto filtra los eventos mencionados anteriormente dentro de un rango de fechas específico.

#### Comodines (Wildcards)

Soporta comodines para buscar patrones.

Ejemplo:
```YAML
event.code:4625 AND user.name: admin*
```

Busca fallos de inicio de sesión donde el nombre de usuario comienza con "admin" (ej. "admin", "administrator", "admin123").

---

### Cómo identificar los datos disponibles

¿Cómo sabemos qué campos usar (como `event.code` o `winlog.event_data.SubStatus`)?

#### Enfoque 1: Aprovechar la búsqueda de texto libre de KQL

Usando la función **Discover** de Kibana:

1. Buscamos en Google sobre logs de Windows y encontramos que el error 4625 es clave.

2. En Kibana, buscamos simplemente `"4625"`.

3. En los resultados devueltos, observamos los campos disponibles:
    - `event.code` (relacionado con ECS).
    - `winlog.event_id` (relacionado con Winlogbeat).
![[Pasted image 20260108144903.png]]
4. Para cuentas deshabilitadas, buscamos `"0xC0000072"` y descubrimos el campo `winlog.event_data.SubStatus`.
![[Pasted image 20260108144918.png]]

#### Enfoque 2: Aprovechar la documentación de Elastic

Es ideal familiarizarse con la documentación antes de explorar. Recursos clave incluyen:
- **Elastic Common Schema (ECS)**
- Campos de Winlogbeat y Filebeat.

---

### Elastic Common Schema (ECS)

El **Elastic Common Schema (ECS)** es un vocabulario compartido y extensible para eventos y logs en todo el Elastic Stack.

**Ventajas clave de usar campos ECS:**
1. **Vista de Datos Unificada:** Permite vistas unificadas a través de múltiples fuentes de datos (Windows, tráfico de red, nube) usando los mismos nombres de campo.
2. **Eficiencia de Búsqueda Mejorada:** Estandariza los nombres, simplificando la escritura de consultas KQL sin tener que recordar nombres específicos para cada fuente.
3. **Correlación Mejorada:** Facilita la correlación de eventos (ej. una dirección IP en logs de firewall vs logs de endpoint).
4. **Mejores Visualizaciones:** Los dashboards se vuelven más fáciles de crear y más intuitivos.
5. **Interoperabilidad:** Asegura compatibilidad con funciones avanzadas como _Elastic Security_ y _Machine Learning_.
6. **Preparación para el Futuro:** Asegura compatibilidad con nuevas mejoras en el ecosistema Elastic.