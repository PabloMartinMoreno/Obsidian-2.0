---
aliases:
  - "DCSync Exploitation - Secretsdump.py"
  - "Abusing WriteDacl in the domain - Granting DCSync Privileges"
  - DC Sync
  - DCSync Attack
  - Directory Replication Attack
tags:
  - technique/credential-access
  - technique/persistence
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[DCSync - Permisos y Discovery]]"
  - "[[DCSync - Linux Execution]]"
  - "[[DCSync - Windows Execution]]"
  - "[[DCSync - ACL Abuse (Grant DCSync)]]"
  - "[[DCSync - Detection y Mitigations]]"
  - "[[DCSync - Tooling]]"
  - "[[Golden Ticket]]"
  - "[[NTDS.dit Extraction]]"
  - "[[LSASS Dumping]]"
  - "[[Pass-the-Hash]]"
---

# DCSync

---

## Cheatsheet

### 🔑 Permisos y Discovery

````tabs
tab: **ACEs requeridos**
![[DCSync - Permisos y Discovery#^dcsync-perms-aces]]

tab: **Holders por defecto**
![[DCSync - Permisos y Discovery#^dcsync-perms-defaults]]

tab: **PowerView**
![[DCSync - Permisos y Discovery#^dcsync-perms-powerview]]

tab: **BloodHound**
![[DCSync - Permisos y Discovery#^dcsync-perms-bloodhound]]

tab: **Test rápido**
![[DCSync - Permisos y Discovery#^dcsync-perms-test]]

tab: **OPSEC pre-ataque**
![[DCSync - Permisos y Discovery#^dcsync-perms-opsec]]
````

### 🐧 Linux Execution

````tabs
tab: **Full NT dump**
![[DCSync - Linux Execution#^dcsync-linux-full]]

tab: **Targeted**
![[DCSync - Linux Execution#^dcsync-linux-targeted]]

tab: **Pass-the-Hash**
![[DCSync - Linux Execution#^dcsync-linux-pth]]

tab: **Kerberos ticket**
![[DCSync - Linux Execution#^dcsync-linux-kerberos]]

tab: **nxc / netexec**
![[DCSync - Linux Execution#^dcsync-linux-nxc]]

tab: **Output format**
![[DCSync - Linux Execution#^dcsync-linux-output]]
````

### 🪟 Windows Execution

````tabs
tab: **mimikatz dcsync**
![[DCSync - Windows Execution#^dcsync-win-mimi]]

tab: **Sin DA (solo ACE)**
![[DCSync - Windows Execution#^dcsync-win-nodaverify]]

tab: **nxc**
![[DCSync - Windows Execution#^dcsync-win-nxc]]

tab: **SharpSecDump**
![[DCSync - Windows Execution#^dcsync-win-sharpsec]]

tab: **On-DC vs Remote**
![[DCSync - Windows Execution#^dcsync-win-ondc]]

tab: **OPSEC**
![[DCSync - Windows Execution#^dcsync-win-opsec]]
````

### ⚡ ACL Abuse (Grant DCSync)

````tabs
tab: **Prerequisito**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-prereq]]

tab: **dacledit (Linux)**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-dacledit]]

tab: **PowerView (Windows)**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-powerview]]

tab: **BloodHound paths**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-bloodhound]]

tab: **Cleanup**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-cleanup]]

tab: **Detection de ACL change**
![[DCSync - ACL Abuse (Grant DCSync)#^dcsync-acl-detection]]
````

### 🛡️ Detection & Mitigations

````tabs
tab: **Detection Events**
![[DCSync - Detection y Mitigations#^dcsync-detect-events]]

tab: **MDI Alerts**
![[DCSync - Detection y Mitigations#^dcsync-detect-mdi]]

tab: **KQL / Sentinel**
![[DCSync - Detection y Mitigations#^dcsync-detect-kql]]

tab: **Mitigations**
![[DCSync - Detection y Mitigations#^dcsync-detect-mitigations]]

tab: **Hardening Checklist**
![[DCSync - Detection y Mitigations#^dcsync-detect-checklist]]

tab: **Bypass Notes**
![[DCSync - Detection y Mitigations#^dcsync-detect-bypass]]
````

### 🛠️ Tooling

````tabs
tab: **impacket-secretsdump**
![[DCSync - Tooling#^dcsync-tool-secretsdump]]

tab: **nxc / netexec**
![[DCSync - Tooling#^dcsync-tool-nxc]]

tab: **mimikatz lsadump**
![[DCSync - Tooling#^dcsync-tool-mimi]]

tab: **SharpSecDump**
![[DCSync - Tooling#^dcsync-tool-sharpsec]]

tab: **dacledit**
![[DCSync - Tooling#^dcsync-tool-dacledit]]

tab: **Recursos**
![[DCSync - Tooling#^dcsync-tool-resources]]
````

---

## Overview

**DCSync** = simular comportamiento de Domain Controller solicitando replicación al DC real via **MS-DRSR** (DRSUAPI). El DC responde con todos los secretos del directorio — NT hashes, AES Kerberos keys, DPAPI keys, password history. No requiere ejecutar código en el DC — es RPC remoto.

Requiere dos ACEs sobre el naming context del dominio: `DS-Replication-Get-Changes` + `DS-Replication-Get-Changes-All`. Por defecto solo Domain Admins, Enterprise Admins, y los propios DCs los tienen.

### DCSync vs NTDS.dit file extraction

| | **DCSync** | **NTDS.dit file** |
|---|---|---|
| Método | DRSUAPI replication call (red) | VSS snapshot + file copy (local) |
| Requiere | DCSync ACE en domain root | DA / Backup Ops / RCE en DC |
| Output | Live — hashes actuales | Static — hashes al momento del snapshot |
| Detection | Event 4662 + MDI "DCSync attempt" | File access events (menos específico) |
| MDI evasion | No (source IP no-DC = alert) | Sí (si método file en DC local) |
| Sin RCE en DC | Sí | No |

---

## Workflow

```
1. Verificar permisos:
   - BloodHound: DCSync / GetChangesAll edges desde owned nodes.
   - PowerView: Get-ObjectAcl en domain root.
   - Test: secretsdump -just-dc-user krbtgt → ¿funciona sin error?

2. Elegir método:
   a. Permisos directos → secretsdump / mimikatz / nxc.
   b. GenericAll/WriteDACL en domain root → dacledit/PowerView grant → DCSync.
   c. RCE en DC → ntdsutil IFM / VSS (evita MDI DCSync alert).

3. Ejecutar:
   - Targeted primero (krbtgt + administrator) — menos ruido.
   - Full dump solo si necesitás hashes masivos.

4. Post-DCSync:
   - krbtgt hash → Golden Ticket.
   - Administrator hash → PtH lateral.
   - AES256 → Silver Ticket / Overpass-the-Hash.
   - Full hashes → hashcat offline crack.

5. Cleanup (si usaste ACL abuse):
   - dacledit remove / Remove-DomainObjectAcl.
```

---

## Detección rápida

```bash
# Standard post-DA (Linux)
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm

# Solo krbtgt
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user krbtgt

# PtH
impacket-secretsdump -hashes :NTHASH corp.local/administrator@dc01.corp.local -just-dc-ntlm
```

```
# Windows
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt
```

---

## Impacto

- **krbtgt hash** → Golden Ticket — persistencia post-DA indefinida.
- **Full NT hashes** → PtH masivo contra todo el dominio.
- **AES256 keys** → Silver Tickets / Overpass-the-Hash sin RC4.
- **Service account hashes** → lateral movement a sistemas dependientes.
- **Trust account hashes** → inter-forest lateral movement.
- **Password history** → patrones organizacionales, spray contra otros sistemas.
- **DPAPI keys** → browser passwords, certificate private keys.

---

## Mitigación (defender)

- **Auditar DCSync ACEs** — solo `ENTERPRISE DOMAIN CONTROLLERS` debería tener GetChangesAll. Scripts de auditoría mensual.
- **Restrict WriteDACL en domain root** — quitar write sobre domain root a cuentas no-admin.
- **MDI en todos los DCs** — detecta DCSync desde non-DC source.
- **Protected Users para DA** — NTLM disabled, RC4 disabled, TGT 4h.
- **Tiered Admin Model** — DA no loguea en Tier 1/2. Hash de DA nunca en workstations.
- **krbtgt double reset** — post-incident: reset x2 con 12h entre resets.
- **Monitorear Event 4662** con GetChangesAll GUID en SIEM.
- **Monitorear Event 5136** — DACL change en domain root (grant DCSync via ACL abuse).

---

## Para entender DCSync

**Por qué los DCs tienen que replicar:** AD es distribuido — múltiples DCs, cada uno con copia del directorio. Replicación es el mecanismo que mantiene consistencia. MS-DRSR es el protocolo RPC que los DCs usan. Si una cuenta tiene los ACEs de replicación, Windows le permite usar ese protocolo — no valida que sea un DC real.

**Por qué "no requiere código en el DC":** A diferencia de LSASS dump o ntds.dit copy (que requieren estar en el DC o tener acceso al filesystem), DCSync es una llamada RPC remota. impacket reimplementa el cliente DRSUAPI — dice "dame las credenciales de este objeto" y el DC responde. Desde la perspectiva del DC, es replicación legítima.

**Por qué existe ACL abuse path:** Un admin puede delegar replication rights a cuentas específicas (backup software, Azure AD Connect). Si podés escribir sobre la DACL del domain root (GenericAll / WriteDACL), podés agregar esos ACEs a cualquier cuenta — incluyendo la tuya o una comprometida. Es un salto de WriteDACL a full domain compromise.

**Por qué MDI detecta DCSync tan bien:** MDI analiza tráfico DRSUAPI en el wire (sensor en DCs). Cualquier GetChangesAll desde una IP que no es un DC conocido = alert inmediato. No hay forma de evadir esto con DCSync network-based si MDI está activo. La única alternativa: usar método file-based (ntdsutil/VSS) directamente en el DC, que no usa DRSUAPI.

---

## Recursos

- [impacket](https://github.com/fortra/impacket) — secretsdump.
- [netexec](https://github.com/Pennyw0rth/NetExec) — `--ntds` flag.
- [HackTricks — DCSync](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync) — comprehensive.
- [The Hacker Recipes — DCSync](https://www.thehacker.recipes/ad/movement/credentials/dumping/dcsync) — reference.
- [ADSecurity — DCSync](https://adsecurity.org/?p=1729) — detection deep-dive.
- [MITRE ATT&CK T1003.006](https://attack.mitre.org/techniques/T1003/006/) — DCSync.

---
