---
aliases:
  - Purple Knight
  - Semperis Purple Knight
  - PK Audit
  - Purple Knight Indicators
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - Health y Security Auditing]]"
---
# AD - Health & Security Auditing - Purple Knight

***

## Ejecución

| **Acción** | **Cómo** | **Cuándo** |
|:---:|:---:|:---:|
| GUI assessment | `PurpleKnight.exe` → Run | Audit ad-hoc desde workstation. |
| Auth como Domain User | Run as user del dominio | Sin necesidad de DA. |
| Auth con cuenta auditor | Shift+Right-Click → Run as different user | Cuenta dedicada. |
| Target AD on-prem | GUI → Active Directory checkbox | Audit estándar. |
| Target Entra ID | GUI → Entra ID + token | Tenant cloud. |
| Target Hybrid | Ambos checkboxes | Sync AD ↔ Entra ID. |
| Export PDF | GUI → Export Report | Compartir con management. |
| Export XLSX | GUI → Export Data | Parseo programático. |
^ad-pk-exec

___

## Indicators of Exposure (IoE) — pre-attack

| **IoE** | **Detección** | **Remediación** |
|:---:|:---:|:---:|
| `Anonymous LDAP bind` | LDAP `dsHeuristics` bit 7 | `Set-ADObject` clear bit. |
| `krbtgt password >180d` | `Get-ADUser krbtgt -Pr PasswordLastSet` | `Reset-KrbTgt` 2× con 24h gap. |
| `Unconstrained delegation non-DC` | `userAccountControl & 0x80000` | Migrar a RBCD o Constrained. |
| `ADCS ESC1 template` | `mspki-certificate-name-flag = 1` | Disable `ENROLLEE_SUPPLIES_SUBJECT`. |
| `Kerberoastable priv user` | SPN en cuenta de DA | Mover SPN a gMSA. |
| `Pre-auth disabled` | `userAccountControl & 0x400000` | Quitar flag DONT_REQ_PREAUTH. |
| `Reversible encryption` | `userAccountControl & 0x80` | Quitar flag + force change. |
| `LAPS not deployed` | `ms-Mcs-AdmPwd` schema attribute missing | Deploy LAPSv2. |
| `GPP cpassword in SYSVOL` | `findstr /S cpassword \\dc\sysvol` | Borrar GPO + rotar passwords. |
| `Authenticated Users priv ACE` | DACL audit en priv objects | Limpiar ACE. |
| `MachineAccountQuota = 10` | `(Get-ADDomain).ms-DS-MachineAccountQuota` | Set a 0. |
| `Cross-trust SID Filtering off` | `Get-ADTrust -Pr SIDFilteringQuarantined` | `netdom trust /quarantine:yes`. |
^ad-pk-ioe

___

## Indicators of Compromise (IoC) — post-attack

| **IoC** | **Detección** | **Acción IR** |
|:---:|:---:|:---:|
| `DCSync rights non-DC user` | `Get-ACL` con `GetChanges` + `GetChangesAll` | Revocar ACE + audit krbtgt. |
| `AdminSDHolder modificado <30d` | `Get-ADObject CN=AdminSDHolder -Pr WhenChanged` | Revertir + check priv groups. |
| `krbtgt modificado <30d sin reset planeado` | `Get-ADUser krbtgt -Pr PasswordLastSet` | Forzar reset 2× + IR. |
| `GoldenGMSA marker` | KDS Root Key access anómalo | Rotar KDS Root + audit gMSA. |
| `Skeleton Key marker` | LSASS hook en DC | Reboot DC + IR. |
| `Schema modificado <30d` | `Get-ADObject -SearchBase "CN=Schema..."` | Audit cambios + revertir. |
| `Default Domain Policy modificado` | `gpotool` versión + ACL | Revertir + audit GPO ACLs. |
| `New ADCS template suspicious` | `Get-CATemplate` recientes | Disable + audit emisiones. |
| `KRBTGT replication anómala` | DRSReplica events 4928/4929 | Audit replicación cross-DC. |
| `New DA <30d` | `Get-ADGroupMember "Domain Admins"` | Validar legitimidad. |
^ad-pk-ioc

___

## Cross-correlate con PingCastle

| **Acción** | **Cómo** | **Para qué** |
|:---:|:---:|:---:|
| Run ambos en mismo audit | PK GUI + `PingCastle.exe --healthcheck` | Cobertura cruzada. |
| Parse PK XLSX | `python -c "import openpyxl; ..."` | Automatizar diff. |
| Parse PC XML | `xmllint --xpath '//Rules' ad_hc_*.xml` | Comparar findings. |
| Diff per-quarter | Custom script PowerShell | Trend analysis. |
^ad-pk-correlate

```powershell
# Audit trimestral combinado
$Q = "2026-Q2"
$Out = "C:\audit\$Q"
New-Item -ItemType Directory -Path $Out -Force

# PingCastle (CLI)
PingCastle.exe --healthcheck --server dc01 --no-enum-limit
Move-Item ad_hc_*.* $Out

# Purple Knight (GUI manual)
Start-Process "C:\Tools\PurpleKnight\PurpleKnight.exe"
Read-Host "ENTER cuando PK termine y exportes XLSX a $Out"

# Diff IoE entre PK + PC
.\compare-audits.ps1 -PCXml "$Out\ad_hc_corp.local.xml" -PKXlsx "$Out\PK_Report.xlsx"
```

___

## PK vs PingCastle (cuándo usar cada uno)

| **Criterio** | **Purple Knight** | **PingCastle** |
|:---:|:---:|:---:|
| Trust topology | Limitado | `--carto` excelente. |
| Scanners CVE específicos | No | `--scanner zerologon` + coercion. |
| Hybrid (Entra ID) | Nativo | Limitado. |
| IoC post-compromiso | Fuerte | Débil. |
| Score numérico | Por regla | Global 0-100 + per-section. |
| Output máquina | XLSX | XML. |
| Trend automation | Manual | `--conso`. |
| MITRE ATT&CK mapping | Por regla | No. |
^ad-pk-vs-pc

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Purple Knight download | `https://www.purple-knight.com/` |
| Indicator reference | Built-in PK GUI |
| Semperis blog | `https://www.semperis.com/blog/` |
| Forest Druid (companion tool) | `https://www.semperis.com/forest-druid/` |
^ad-pk-resources

***
