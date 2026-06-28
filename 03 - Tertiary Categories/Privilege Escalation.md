---
aliases:
  - Escalada de Privilegios
  - Local Privilege Escalation
tags:
  - technique/privilege-escalation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
kind: Tertiary Category
---

# Privilege Escalation

---

## Overview

Escalada de privilegios **local** sobre un host ya comprometido (user estándar → root/SYSTEM). Dos ejes según el OS. Regla transversal: **enumerar primero** (automatizada + manual), explotar misconfig de alto ROI, dejar kernel exploits como último recurso (ruidosos, crashean boxes).

> Si el host está unido a dominio, la escalada local puede ser innecesaria — atacar directo el dominio: [[Active Directory Explotación]].

---

## 🐧 Linux

Roadmap completo y checklist de triage en el hub:

- [[Linux Privilege Escalation]] (Hub: enum automatizada, creds en disco, sudo, SUID/SGID, cron, PATH, servicios, kernel, NFS, permisos FS.)

Vectores atómicos:

- [[Linux PrivEsc - SUID y SGID]] (Binarios con bit SUID/SGID + GTFOBins shell-escape; capabilities.)
- [[Linux PrivEsc - Abusing Sudoers]] (`sudo -l`, GTFOBins, `LD_PRELOAD`, versiones vulnerables.)
- [[Linux PrivEsc - Cron Jobs]] (Scripts cron escribibles, wildcard injection, `pspy` para cron oculto.)
- [[Linux PrivEsc - PATH Hijacking]] (Binarios SUID que invocan comandos sin path absoluto.)
- [[Wildcard Injection]] (Abuso de `tar *`, `chown *` y otros wildcards en tareas root.)
- [[Permisos]] (Permisos de archivos críticos: `/etc/passwd`, `/etc/shadow`, sudoers.)
- [[doas]] (Alternativa a sudo en BSD/Linux — misconfig en `doas.conf`.)

---

## 🪟 Windows

Roadmap completo y checklist de triage en el hub:

- [[Windows Privilege Escalation]] (Hub: enum automatizada, creds en disco, token privileges, servicios, programados, kernel/BYOVD, UAC bypass, EDR.)

Vectores atómicos:

- [[Abuso de SeImpersonatePrivilege]] (Potato family: JuicyPotato, PrintSpoofer, GodPotato, EfsPotato.)
- [[Windows PrivEsc Payloads]] (Payloads listos para lanzar en escalada Windows.)
- [[Malicious SCF and LNK Files]] (Captura de hashes / ejecución vía archivos SCF y LNK.)
- [[Evil Windows Library File]] (Abuso de archivos `.Library-ms` maliciosos.)
- [[Evil Microsoft Office Macro]] (Macros maliciosas para ejecución/escalada.)
- [[AppLocker evasion]] (Bypass de políticas AppLocker para ejecutar binarios.)

---

## 🔧 Cross-platform / Enumeración

- [[PrivEsc Enumeration Tools]] (linpeas/winpeas, pspy, Seatbelt, PowerUp, exploit suggesters.)
- [[Escalada de Privilegios - Comandos Comunes]] (Comandos rápidos de triage para ambos OS.)

---

## Recursos

- [GTFOBins](https://gtfobins.github.io/) — shell-escapes Linux por binario.
- [LOLBAS](https://lolbas-project.github.io/) — living-off-the-land binaries Windows.
- [HackTricks - Privilege Escalation](https://book.hacktricks.xyz/) — referencia exhaustiva ambos OS.

---
