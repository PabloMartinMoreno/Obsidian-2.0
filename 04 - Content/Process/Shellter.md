---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Pre-Exploitation]]"
tertiary categories:
  - "[[Payload Generation]]"
type: CheatSheet
linked:
---
# Shellter

***

## Cheatsheet

| **Acción**                                                                                                                                              | **Descripción**                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `sudo apt install shellter`<br>`sudo apt install wine`<br>`sudo dpkg --add-architecture i386`<br>`sudo apt-get update`<br>`sudo apt-get install wine32` | <br><br><br>**Instala Shellter, Wine y el soporte de 32 bits** necesario para ejecutarlo en Linux.                             |
| `shellter`                                                                                                                                              | Lanza **Shellter**. No es necesario anteponer `wine`, se ejecuta a través de Wine automáticamente.                             |
| `A`                                                                                                                                                     | Selecciona el **modo automático**. Shellter se encarga de todo por vos.                                                        |
| `N/A`                                                                                                                                                   | Proporcioná la ruta a un ejecutable Windows benigno. **Buenos ejemplos:** WinRar, Putty, Notepad++… Usá uno distinto cada vez. |
| `Y`                                                                                                                                                     | Habilita **stealth mode** para mantener el comportamiento normal del binario tras la inyección.                                |
| `L`                                                                                                                                                     | Elegir un **payload estándar**.                                                                                                |
| `C`                                                                                                                                                     | **Payload personalizado:** elegir un reverse shell integrado o inyectar un payload custom (p. ej. generado con MSFVenom).      |
| `N/A`                                                                                                                                                   | Shellter verifica la inyección comprobando si la ejecución alcanza el inicio del payload.                                      |

---

**Notas**:****Se ha observado que solo los payloads Meterpreter funcionan de forma consistente en objetivos con Windows 11.**** Probar exhaustivamente si se usa otro tipo de payload.  
****TODO: probar múltiples combinaciones y versionado de payloads.****

---

## Overview

**Shellter** es una herramienta de inyección dinámica de shellcode diseñada para **incrustar shellcode en aplicaciones Windows nativas**.

Con Shellter podés insertar un payload de reverse shell dentro de un ejecutable legítimo. Cuando ese ejecutable se ejecute, además de comportarse como se espera, **disparará silenciosamente** el payload.

Lo que hace efectiva a Shellter es que **trabaja dentro de la estructura original del archivo PE**, evitando cambios evidentes (como modificar permisos de memoria o añadir secciones sospechosas con acceso RWX). Esto ayuda a mantenerlo fuera del radar durante análisis de antivirus.

Shellter no es open source, pero ofrece una **Community Edition gratuita**.

---
