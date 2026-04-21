---
aliases:
tags:
  - type/concept
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### El Proceso de Triaje

#### ¿Qué es el Triaje de Alertas?

El **triaje de alertas**, realizado por un analista del Centro de Operaciones de Seguridad (SOC), es el proceso de evaluar y priorizar las alertas de seguridad generadas por varios sistemas de monitoreo y detección para determinar su nivel de amenaza y el impacto potencial en los sistemas y datos de una organización.1 Implica revisar y categorizar sistemáticamente las alertas para asignar recursos de manera efectiva y responder a incidentes de seguridad.2

La **escalada** (o escalamiento) es un aspecto importante del triaje de alertas en un entorno SOC. El proceso de escalada generalmente implica notificar a supervisores, equipos de respuesta a incidentes o individuos designados dentro de la organización que tienen la autoridad para tomar decisiones y coordinar el esfuerzo de respuesta. El analista del SOC proporciona información detallada sobre la alerta, incluida su gravedad, el impacto potencial y cualquier hallazgo relevante de la investigación inicial. Esto permite a los tomadores de decisiones evaluar la situación y determinar el curso de acción apropiado, como involucrar a equipos especializados, iniciar procedimientos de respuesta a incidentes más amplios o contratar recursos externos si es necesario.

La escalada asegura que las alertas críticas reciban atención inmediata y facilita la coordinación efectiva entre las diferentes partes interesadas, permitiendo una respuesta oportuna y eficiente a posibles incidentes de seguridad. Ayuda a aprovechar la experiencia y las capacidades de toma de decisiones de las personas responsables de gestionar y mitigar amenazas o incidentes de mayor nivel.

#### ¿Cuál es el Proceso de Triaje Ideal?

1. **Revisión Inicial de la Alerta:**
    - Revisar minuciosamente la alerta inicial, incluidos los metadatos, la marca de tiempo, la IP de origen, la IP de destino, los sistemas afectados y la regla/firma que la activó.
    - Analizar los registros (_logs_) asociados (tráfico de red, sistema, aplicación) para comprender el contexto de la alerta.

2. **Clasificación de la Alerta:**
    - Clasificar la alerta según su gravedad, impacto y urgencia utilizando el sistema de clasificación predefinido de la organización.
    
3. **Correlación de Alertas:**
    - Cruzar la alerta con alertas, eventos o incidentes relacionados para identificar patrones, similitudes o posibles indicadores de compromiso (**IOCs**).3
    - Consultar el **SIEM** o el sistema de gestión de logs para recopilar datos de registro relevantes.
    - Aprovechar los feeds de inteligencia de amenazas para verificar patrones de ataque conocidos o firmas de malware.

4. **Enriquecimiento de Datos de la Alerta:**
    - Recopilar información adicional para enriquecer los datos de la alerta y ganar contexto:
        - Recopilar capturas de paquetes de red (**PCAP**), volcados de memoria o muestras de archivos asociados con la alerta.
        - Utilizar fuentes externas de inteligencia de amenazas, herramientas de código abierto (OSINT) o _sandboxes_ para analizar archivos, URLs o direcciones IP sospechosas.
        - Realizar reconocimiento de los sistemas afectados en busca de anomalías (conexiones de red, procesos, modificaciones de archivos).

5. **Evaluación de Riesgos:**
    - Evaluar el riesgo potencial y el impacto en los activos críticos, datos o infraestructura:
        - Considerar el valor de los sistemas afectados, la sensibilidad de los datos, los requisitos de cumplimiento y las implicaciones regulatorias.
        - Determinar la probabilidad de un ataque exitoso o un posible movimiento lateral.

6. **Análisis Contextual:**
    - El analista considera el contexto que rodea a la alerta, incluidos los activos afectados, su criticidad y la sensibilidad de los datos que manejan.
    - Evalúan los controles de seguridad existentes, como firewalls, sistemas de detección/prevención de intrusiones (IDS/IPS) y soluciones de protección de endpoints, para determinar si la alerta indica una posible falla de control o una técnica de evasión.
    - El analista evalúa los requisitos de cumplimiento relevantes para comprender las implicaciones legales y regulatorias.

7. **Planificación de Respuesta a Incidentes:**
    - Iniciar un plan de respuesta a incidentes si la alerta es significativa:
        - Documentar los detalles de la alerta, sistemas afectados, comportamientos observados, posibles IOCs y datos de enriquecimiento.
        - Asignar miembros del equipo de respuesta a incidentes con roles y responsabilidades definidos.
        - Coordinar con otros equipos (operaciones de red, administradores de sistemas, proveedores) según sea necesario.

8. **Consulta con Operaciones de TI:**
    - Evaluar la necesidad de contexto adicional o información faltante consultando con operaciones de TI o departamentos relevantes:
        - Participar en discusiones para obtener información sobre los sistemas afectados, cambios recientes o actividades de mantenimiento en curso.
        - Colaborar para comprender cualquier problema conocido, configuraciones erróneas o cambios en la red que podrían generar alertas de **falso positivo**.
        - Obtener una comprensión holística del entorno y cualquier actividad no maliciosa que pudiera haber activado la alerta.

9. **Ejecución de la Respuesta:**
    - Basado en la revisión de la alerta, la evaluación de riesgos y la consulta, determinar las acciones de respuesta apropiadas.
    - Si el contexto adicional resuelve la alerta o la identifica como un evento no malicioso, tomar las acciones necesarias sin escalar.
    - Si la alerta aún indica posibles problemas de seguridad o requiere más investigación, proceder con las acciones de respuesta a incidentes.

10. **Escalamiento (Escalation):**
    - Identificar los desencadenantes (_triggers_) para la escalada según las políticas de la organización y la gravedad de la alerta:
        - Los desencadenantes pueden incluir el compromiso de sistemas/activos críticos, ataques en curso, técnicas desconocidas/sofisticadas, impacto generalizado o amenazas internas (_insider threats_).
    - Evaluar la alerta frente a los desencadenantes de escalada.
    - Seguir el proceso de escalada interno, notificando a los equipos/gerencia de nivel superior.
    - Proporcionar un resumen completo de la alerta, gravedad, impacto potencial, datos de enriquecimiento y evaluación de riesgos.
    - En algunos casos, escalar a entidades externas (fuerzas del orden, proveedores de respuesta a incidentes, CERTs).

11. **Monitoreo Continuo:**
    - Monitorear continuamente la situación y el progreso de la respuesta al incidente.
    - Mantener una comunicación abierta con los equipos escalados, proporcionando actualizaciones.
    - Colaborar estrechamente para una respuesta coordinada.4

12. **Desescalamiento (De-escalation):**
    - Evaluar la necesidad de desescalar a medida que avanza la respuesta al incidente y la situación está bajo control.
    - Desescalar cuando el riesgo se mitiga, el incidente está contenido y ya no es necesaria una mayor escalada.
    - Notificar a las partes relevantes, proporcionando un resumen de las acciones tomadas, los resultados y las lecciones aprendidas.


---

Revisar y actualizar regularmente el proceso, alineándolo con las políticas de la organización. Adaptar el proceso para abordar amenazas emergentes y necesidades en evolución.