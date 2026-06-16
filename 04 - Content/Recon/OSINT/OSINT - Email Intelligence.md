---
aliases:
  - OSINT - Correos Electrónicos
  - Email Intelligence
  - Email OSINT
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[OSINT - Username Enumeration]]"
---
# OSINT - Email Intelligence

> [!info] Overview
> Un email es un identificador **único y persistente** (se cambia menos que un username). Desde una dirección se saca en qué filtraciones apareció, en qué servicios está registrada, y muchas veces el dueño real. Los corporativos siguen **patrones predecibles** (`nombre.apellido@`).

---

## Herramientas

| **Herramienta** | **Uso** | **Qué obtenés** |
|:---|:---|:---|
| **Have I Been Pwned** | `haveibeenpwned.com` | En qué filtraciones apareció el email (defensa + confirma que es real). |
| **Holehe** | `holehe email@dom.com` | En qué sitios está registrado, **sin notificar** al dueño (`megadose/holehe`). |
| **Epieos** | `epieos.com` (web) | Cuenta de Google asociada (nombre, foto), servicios, checks tipo Holehe. |
| **GHunt** | `ghunt email email@gmail.com` | Datos públicos de cuenta Google (nombre, foto, Maps, actividad) (`mxrch/GHunt`). |
| **Hunter.io** | web | Revela el **patrón** de correos de un dominio + verifica si existe. |
| **Gravatar** | hash MD5 del email | Avatar/perfil global si la persona lo usa. |
| **EmailRep.io** | `emailrep.io/email` | Reputación: presencia social, si está marcado malicioso. |
^email-tools

## Cómo funcionan (Holehe/Epieos)

Abusan de los flujos de **registro / recuperar contraseña**: muchos sitios responden distinto si el email ya está registrado ("ya existe" vs "te enviamos link"). La herramienta automatiza ese chequeo en decenas de sitios en silencio.
^email-funcionamiento

## Verificar existencia

Consultar registros **MX** del dominio y validar vía SMTP (lo que automatiza Hunter.io). Ojo con dominios **catch-all** (aceptan cualquier dirección → falsos positivos).
^email-verificar

## Pivote

| **Desde el email** | **Pivot a** |
|:---|:---|
| `"email@dom.com"` entre comillas en Google | Dónde quedó escrito (foros, CVs, repos) → [[Google Dorking]] |
| Parte antes del `@` | Username → [[OSINT - Username Enumeration]] |
| Foto de Google/Gravatar | [[OSINT - Reverse Image Search]] |
^email-pivote

> [!warning] Línea roja
> Motores de filtraciones (Dehashed, IntelX) muestran datos de brechas **incluidas contraseñas**. Consultarlos sobre la propia exposición o la de un cliente autorizado es legítimo; usar credenciales ajenas filtradas es acceso ilegítimo (delito). Ver no habilita usar.
