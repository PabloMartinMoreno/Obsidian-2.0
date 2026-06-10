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

### Resumen del Proceso de Gestión de Incidentes

Ahora que estamos familiarizados con la **Cyber Kill Chain** (Cadena de Muerte Cibernética) y sus etapas, podemos predecir y anticipar mejor los siguientes pasos en un ataque y también sugerir medidas apropiadas contra ellos.

Al igual que la Cyber Kill Chain, existen diferentes etapas al responder a un incidente, definidas como el **Proceso de Gestión de Incidentes** (Incident Handling Process). El Proceso de Gestión de Incidentes define una capacidad para que las organizaciones se preparen, detecten y respondan a eventos maliciosos. Ten en cuenta que este proceso es adecuado para responder a eventos de seguridad de TI, pero sus etapas no corresponden a las etapas de la Cyber Kill Chain de manera uno a uno.
![[Resumen del Proceso de Gestión de Incidentes.png]]

Según lo definido por el **NIST**, el proceso de gestión de incidentes consta de las siguientes cuatro etapas distintas:
- **Preparación**
- **Detección y Análisis**
- **Contención, Erradicación y Recuperación**
- **Actividad Post-Incidente**

Los gestores de incidentes (_incident handlers_) pasan la mayor parte de su tiempo en las dos primeras etapas: preparación y detección y análisis. Aquí es donde nosotros, como gestores de incidentes, pasamos mucho tiempo mejorando nuestras capacidades y buscando el próximo evento malicioso. Cuando se detecta un evento malicioso, pasamos a la siguiente etapa y respondemos al evento (pero siempre debe haber recursos operando en las dos primeras etapas, para que no haya interrupción de las capacidades de preparación y detección).

Como podemos ver en la imagen, el proceso no es lineal, sino cíclico. El punto principal a entender en esta etapa es que, a medida que se descubre nueva evidencia, los siguientes pasos también pueden cambiar. Es vital asegurarse de no saltar pasos en el proceso y de completar un paso antes de pasar al siguiente. Por ejemplo, si descubrimos diez máquinas infectadas, ciertamente no deberíamos proceder a contener solo cinco de ellas y comenzar la erradicación mientras las cinco restantes permanecen en estado infectado. Tal enfoque puede ser ineficaz porque, como mínimo, estamos notificando a un atacante que lo hemos descubierto y que lo estamos cazando, lo cual, como podemos imaginar, puede tener consecuencias impredecibles.

Por lo tanto, la gestión de incidentes tiene dos actividades principales: **investigar** y **recuperar**.

El objetivo de la **investigación** es:
- Descubrir a la víctima inicial ("paciente cero") y crear una línea de tiempo del incidente en curso (si todavía está activo).
- Determinar qué herramientas y malware utilizó el adversario.
- Documentar los sistemas comprometidos y lo que ha hecho el adversario.

Tras la investigación, la actividad de **recuperación** implica crear e implementar un plan de recuperación. Una vez implementado el plan, el negocio debería reanudar las operaciones normales, si es que el incidente causó alguna interrupción.

Cuando un incidente se ha gestionado por completo, se emite un informe que detalla la causa y el costo del incidente. Además, se realizan actividades de "lecciones aprendidas", entre otras cosas, para comprender qué debe hacer la organización para evitar que vuelvan a ocurrir incidentes de un tipo similar.


---