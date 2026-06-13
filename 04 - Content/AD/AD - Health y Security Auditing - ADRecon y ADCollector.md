---
aliases:
  - ADRecon
  - ADCollector
  - AD bulk reports
  - PowerShell AD audit
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - Health y Security Auditing]]"
---
# AD - Health & Security Auditing - ADRecon & ADCollector

---

## ADRecon — ejecución básica

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1` | Reporte completo Excel multi-sheet | Audit inicial. |
| `.\ADRecon.ps1 -DomainController dc01 -Credential corp\auditor` | Auth explícita | Cuenta dedicada. |
| `.\ADRecon.ps1 -OutputType CSV` | CSV por sección | Pipeline / parseo. |
| `.\ADRecon.ps1 -OutputType JSON` | JSON estructurado | Ingest SIEM. |
| `.\ADRecon.ps1 -OutputType STDOUT` | Console output | Debug. |
| `.\ADRecon.ps1 -Method LDAP` | LDAP only (no RSAT) | Sin AD module. |
| `.\ADRecon.ps1 -Method ADWS` | ADWS (RSAT) | Más rápido. |
| `.\ADRecon.ps1 -GenExcel C:\old\ADRecon-Report` | Regen Excel desde CSVs | Rebuild. |
^ad-adrecon-exec

```powershell
# Audit típico — workstation con RSAT
.\ADRecon.ps1 -DomainController dc01.corp.local `
              -OutputDir C:\audit\ADRecon-2026-Q2 `
              -OutputType Excel,CSV

# Output:
#   ADRecon-Report.xlsx
#   CSV-Files\*.csv (por sección)
```

---

## ADRecon — secciones del reporte

| **Sheet** | **Contenido clave** | **Para qué** |
|:---:|:---:|:---:|
| `AboutADRecon` | Versión + comando ejecutado | Repro. |
| `Forest` | FFL, schema version, DCs | Baseline forest. |
| `Domain` | DFL, FSMO, password policy | Baseline domain. |
| `Trusts` | Direction, transitivity, SID filter | Cross-trust audit. |
| `Sites` | Replication topology | Site design audit. |
| `Subnets` | IP ranges per site | Network mapping. |
| `Schema History` | Schema mods con fecha | IoC schema attack. |
| `FineGrainedPasswordPolicy` | PSO config | Password policy gaps. |
| `DomainControllers` | OS version, IP, FSMO roles | DC health. |
| `Users` | Todos users con flags UAC | Stale + priv users. |
| `UserSPNs` | Kerberoastable | Pre-attack list. |
| `PasswordAttributes` | DONT_REQ_PREAUTH, REVERSIBLE, etc | UAC anomalies. |
| `Groups` | Todos groups | Membership audit. |
| `GroupMembers` | Recursión completa | Effective members. |
| `OUs` | OU tree + ACLs | GPO scoping. |
| `GPOs` | GPO list + linked OUs | GPO inventory. |
| `gPLinks` | OU → GPO | Effective GPOs. |
| `DNSZones` | AD-integrated zones | DNS audit. |
| `DNSNodes` | Records | Detalle DNS. |
| `Printers` | Spooler enum | PrintNightmare-adjacent. |
| `Computers` | OS, last logon | Stale hosts. |
| `LAPS` | Coverage de LAPS | LAPS audit. |
| `BitLocker` | Recovery keys | Compliance. |
| `ACLs` | DACLs sobre objetos | Misconfig audit. |
| `GPOReport` | HTML por GPO | Settings inspection. |
^ad-adrecon-sheets

---

## ADCollector — ejecución

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ADCollector.exe` | Output console + log | Recon rápido sin Excel. |
| `ADCollector.exe --Domain corp.local` | Domain específico | Multi-domain. |
| `ADCollector.exe --Server dc01` | DC explícito | Targeted DC. |
| `ADCollector.exe --Ldaps` | LDAPS (636) en vez de LDAP (389) | Defender alerta LDAP cleartext. |
| `ADCollector.exe --Username u --Password p --Domain corp.local` | Auth explícita | Cuenta dedicada. |
| `ADCollector.exe --Spns` | Solo SPNs (rápido) | Kerberoast prep. |
| `ADCollector.exe --Acls` | ACLs criticos | DACL audit rápido. |
| `ADCollector.exe --GroupPolicy` | GPO settings parseados | GPO audit. |
^ad-adcollector-exec

```powershell
# OPSEC: LDAPS + paginated
.\ADCollector.exe --Domain corp.local --Ldaps --Server dc01 > C:\audit\adcollector.log
```

---

## ADRecon vs ADCollector

| **Criterio** | **ADRecon** | **ADCollector** |
|:---:|:---:|:---:|
| Lenguaje | PowerShell | C# (.NET) |
| Output | Excel multi-sheet | Console / log |
| Velocidad | Lento (10-30 min) | Rápido (1-5 min) |
| Targeted queries | No | `--Spns`, `--Acls`, etc |
| Defender footprint | Alto (PS) | Medio (LDAP bulk) |
| Auditor amigable | Sí (Excel) | No (parsing manual) |
| AMSI evasion needed | Sí | No |
| Auth flexibility | RSAT / LDAP | LDAP / LDAPS |
^ad-adrecon-vs-adcoll

---

## Parseo del output

| **Acción** | **Cómo** | **Para qué** |
|:---:|:---:|:---:|
| Diff Q1 vs Q2 Users | `Compare-Object (Import-Csv Q1\Users.csv) (Import-Csv Q2\Users.csv) -Property SamAccountName` | Nuevos/borrados. |
| Stale users | `Import-Csv Users.csv \| ? { $_.LastLogonDate -lt (Get-Date).AddDays(-90) }` | Cleanup. |
| Kerberoastable priv | `Import-Csv UserSPNs.csv \| ? { $_.AdminCount -eq 'TRUE' }` | Pre-attack. |
| ACLs peligrosos | `Import-Csv ACLs.csv \| ? { $_.ActiveDirectoryRights -match 'GenericAll\|WriteDacl' }` | DACL audit. |
| Trust con SID Filter off | `Import-Csv Trusts.csv \| ? { $_.SIDFilteringQuarantined -eq 'FALSE' }` | Cross-trust risk. |
^ad-adrecon-parse

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| ADRecon | `https://github.com/adrecon/ADRecon` |
| ADRecon (sense-of-security fork) | `https://github.com/sense-of-security/ADRecon` |
| ADCollector | `https://github.com/dev-2null/ADCollector` |
| ADRecon-ADCS | `https://github.com/adrecon/ADRecon-ADCS` |
^ad-adrecon-resources

---
