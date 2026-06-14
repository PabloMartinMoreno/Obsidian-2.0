---
aliases:
  - Etapa de Contención Erradicación y Recuperación
  - IR Containment Eradication Recovery
tags:
  - topic/incident-response
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[Incident Response]]"
  - "[[Respuesta]]"
tertiary categories:
  - "[[IR Respuesta]]"
kind: SubCheatSheet
linked:
  - "[[Gestión de Incidentes]]"
---
# IR - Contención, Erradicación y Recuperación

> Etapa 3 del NIST IR lifecycle. Tras entender el incidente: frenar la propagación (contención), sacar al adversario (erradicación) y volver a producción (recuperación). **Coordinar las acciones simultáneamente** en todos los sistemas — si no, se alerta al atacante y cambia de TTPs.

---

## Contención

| **Tipo** | **Acciones** |
|:---|:---|
| **Corto plazo** (huella mínima) | Aislar en VLAN separada, desconectar cable de red, **sinkholing** del DNS de C2. Permite tomar imágenes forenses y preservar evidencia. |
| **Largo plazo** (cambios persistentes) | Cambiar passwords, reglas de firewall, desplegar HIDS, parchear, apagar sistemas definitivamente. |
^cer-contencion

> Parchear ≠ incidente terminado. La sub-etapa de **respaldo** (forensic imaging) ocurre acá si no se hizo en la investigación.

## Erradicación

Eliminar causa raíz y remanentes; asegurar que el adversario está fuera:

- Eliminar el malware de los sistemas.
- **Reconstruir** sistemas (formateo + reinstalación).
- **Restaurar** desde backups limpios.
- Hardening adicional (no solo en el sistema impactado — a veces toda la red).
^cer-erradicacion

## Recuperación

Volver a operación normal. El negocio **verifica** que el sistema funciona y tiene los datos, recién ahí va a producción. Todo sistema restaurado → **heavy logging & monitoring** (los comprometidos vuelven a ser objetivo). Monitorear:

- Logins inusuales (cuentas que nunca loguearon ahí).
- Procesos inusuales.
- Cambios de registro en ubicaciones típicas de malware.
^cer-recuperacion

> En incidentes grandes la recuperación lleva meses, por fases: primero **quick wins** (low-hanging fruit), luego cambios permanentes a largo plazo.
^cer-fases
