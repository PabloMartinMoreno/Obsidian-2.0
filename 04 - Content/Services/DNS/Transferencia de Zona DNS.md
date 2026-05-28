---
aliases:
tags:
kind: Concept
linked:
  - "[[DNS]]"
  - "[[dnsenum]]"
---
# Transferencia de Zona

***

Una **transferencia de zona DNS** (también conocida por el nombre de su protocolo, **AXFR**) es un mecanismo crítico que permite replicar las bases de datos de registros DNS entre diferentes servidores de nombres.

Su objetivo principal es garantizar la **redundancia y la disponibilidad**: si un servidor falla, los otros servidores secundarios tienen una copia actualizada de toda la información de la zona para seguir respondiendo consultas.

**Es un método menos invasivo y potencialmente más eficiente para descubrir subdominios de la zona DNS.**

![[Transferencia de Zona DNS.png]]

---

## Conceptos Fundamentales

Para entender cómo funciona, primero debemos distinguir los roles de los servidores:

- **Servidor Maestro (Primary):** Es el servidor donde se aloja la copia original y "maestra" del archivo de zona. Los cambios (como añadir un nuevo subdominio) se hacen aquí.
- **Servidor Esclavo (Secondary):** Son servidores que mantienen copias de lectura de la zona. Obtienen su información directamente del maestro mediante la transferencia de zona.
- **Archivo de Zona:** Un archivo de texto que contiene todos los registros DNS (A, MX, CNAME, TXT, etc.) de un dominio específico.


---

## El Proceso de Transferencia: AXFR vs. IXFR

Existen dos tipos principales de transferencia de zona:

### **AXFR (Full Zone Transfer)**

Es la transferencia completa. El servidor secundario solicita **todo** el archivo de zona al maestro. Es común cuando un servidor secundario se configura por primera vez o si los datos están muy desincronizados.

### **IXFR (Incremental Zone Transfer)**

Es más eficiente. En lugar de enviar todo el archivo, el maestro solo envía los **cambios** realizados desde la última actualización. Esto ahorra ancho de banda y recursos de CPU.

---

## ¿Cómo sabe un servidor que debe actualizarse?

El proceso no ocurre al azar; se rige por el registro **SOA (Start of Authority)**. Este registro contiene valores temporales clave:

1. **Serial Number:** Es el número de versión de la zona. Cada vez que cambias algo en el DNS, debes aumentar este número.
2. **Refresh:** El tiempo (en segundos) que el secundario espera antes de preguntar al maestro si hay cambios.
3. **Retry:** Si el maestro no responde, cuánto tiempo debe esperar el secundario para reintentar.
4. **Expire:** Si el secundario no puede contactar al maestro durante este tiempo, deja de responder consultas para esa zona (considera que los datos están obsoletos).


**El mecanismo NOTIFY:** En lugar de esperar al intervalo de "Refresh", los servidores modernos usan el mensaje DNS NOTIFY. Cuando el maestro detecta un cambio, envía un "aviso" proactivo a los secundarios para que inicien la transferencia de inmediato.


---

## El Flujo de Comunicación (Paso a paso)

1. **Detección:** El servidor secundario nota un incremento en el _Serial Number_ del maestro (ya sea por el intervalo de Refresh o por un mensaje NOTIFY).
2. **Solicitud:** El secundario envía una consulta de tipo `AXFR` o `IXFR` al maestro a través del **puerto TCP 53**. (Nota: A diferencia de las consultas normales que usan UDP, las transferencias usan TCP para garantizar la entrega de datos).
3. **Respuesta:** El maestro verifica si la IP del secundario está autorizada. Si lo está, comienza a enviar los registros de la zona.
4. **Finalización:** Una vez recibidos los datos, el secundario actualiza su base de datos local y comienza a servir la nueva información.


---
