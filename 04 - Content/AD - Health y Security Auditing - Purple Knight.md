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

## Purple Knight Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Vendor | Semperis | Standard. |
| License | Free community | Standard. |
| Target | AD + Entra ID | Modern. |
| GUI-based | `PurpleKnight.exe` | Standard. |
| Per-category indicators | 100+ rules | Comprehensive. |
| Per-rule severity | Critical/Warning/Info | Standard. |
| Output: PDF + Excel | Standard | Tool. |
| Cross-correlate PingCastle | Adjacent | Standard. |
| Focus: IoE (Indicators of Exposure) | Pre-attack | Standard. |
| Focus: IoC (Indicators of Compromise) | Post-attack | Critical. |
| Modern: Entra ID hybrid coverage | Cloud | Modern. |
| Detection: PK binary + LDAP queries | Defender | Adjacent. |
| Compliance: per-quarter audit | Standard | Adjacent. |
| Audit log retention | Standard | Compliance. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Adjacent: Semperis DSP/ADFR | Commercial | Adjacent. |
^ad-pk-overview

### Purple Knight quick start

```cmd
:: Download Purple Knight
:: https://www.purple-knight.com/

:: Run as Domain User (no admin needed for most checks)
PurpleKnight.exe

:: GUI:
::   1. Select environment (AD / Entra ID / Hybrid)
::   2. Select indicator categories
::   3. Run assessment
::   4. Export PDF + XLSX report
```

___

## Indicator Categories

| **Category** | **Foco** | **Notas** |
|:---:|:---:|:---:|
| AD Delegation | Unconstrained, RBCD anomalies | Critical. |
| AD Infrastructure Security | DC config, replication | Standard. |
| Account Security | Stale, password policy | Standard. |
| Group Policy Security | GPP, GPO ACLs | Standard. |
| Hybrid Identity | Sync, Entra ID | Modern. |
| Kerberos Security | krbtgt, encryption | Critical. |
| ADCS Security | ESC1-ESC15 | Critical. |
| LAPS Security | Deployment, ACLs | Modern. |
| Trust Security | SID Filtering, transitive | Audit. |
| Cross-correlate priv tier | Standard | Audit. |
| Per-rule remediation | Standard | Tool. |
| Per-rule MITRE ATT&CK mapping | Standard | Modern. |
| Modern: continuous PK | Defender side | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Detection: PK queries (LDAP bulk) | Defender | Adjacent. |
| Audit baseline | Standard | Compliance. |
^ad-pk-categories

___

## Common IoE Findings

| **IoE** | **Severidad** | **Notas** |
|:---:|:---:|:---:|
| Anonymous LDAP bind | Critical | Standard. |
| krbtgt password >180d | High | Critical. |
| Unconstrained delegation non-DC | High | Critical. |
| ADCS template ESC1-ESC15 | Critical | Modern. |
| SID History abuse path | High | Cross-trust. |
| Kerberoastable priv user | High | Standard. |
| Pre-auth disabled (AS-REProast) | Medium | Standard. |
| Reversible encryption | High | Standard. |
| LAPS not deployed | Medium | Modern. |
| Authenticated Users with priv ACE | Critical | Audit. |
| Pre-Win2000 compatibility | Low | Legacy. |
| GPP cpassword found | Critical | MS14-025. |
| Computer accounts in priv groups | Medium | Audit. |
| Stale priv accounts | Medium | Standard. |
| MachineAccountQuota = 10 | Medium | Default. |
| Cross-trust SID Filtering off | High | Critical. |
^ad-pk-ioe

___

## Common IoC Findings

| **IoC** | **Severidad** | **Notas** |
|:---:|:---:|:---:|
| DCSync rights to non-DC | Critical | Backdoor. |
| Recently modified AdminSDHolder | Critical | Persistence. |
| GoldenGMSA marker | Critical | Modern. |
| krbtgt recently modified | Critical | Golden Ticket prep. |
| New ADCS template (suspicious) | High | Modern. |
| Skeleton Key marker | Critical | Mimikatz. |
| Recent Schema modification | High | Persistence. |
| Default Domain Policy modified | High | Persistence. |
| New Domain Admin recently | Medium | Audit. |
| Service account priv escalation | High | Standard. |
| KRBTGT replication anomaly | Critical | Modern. |
| Modern: cross-correlate MDI | Standard | Defender. |
| Detection: post-compromise | Defender | Modern. |
| Compliance: IR triage | Adjacent | Standard. |
| Audit log retention | Standard | Compliance. |
| Cross-correlate with engagement | Per-engagement | Standard. |
^ad-pk-ioc

___

## Purple Knight vs PingCastle

| **Concepto** | **Purple Knight** | **PingCastle** |
|:---:|:---:|:---:|
| Vendor | Semperis | Vincent Le Toux |
| License | Free | Free + Pro |
| Focus | IoE + IoC | Healthcheck + scoring |
| Output | PDF/XLSX | HTML/XML |
| Hybrid (Entra ID) | Yes | Limited |
| Trust topology | Limited | `--carto` excellent |
| Specific scanners | Limited | `--scanner zerologon` |
| Scoring | Per-rule | Global + per-section |
| Modern integration | Semperis DSP | PingCastle Pro |
| Cross-correlate both tools | Recommended | Standard. |
| Compliance: dual-tool baseline | Standard | Adjacent. |
| Detection: bulk LDAP queries | Both | Adjacent. |
| Modern: continuous monitoring | Defender side | Adjacent. |
| Per-engagement use | Both | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Modern: PK 4.x release | Updated | Tool. |
^ad-pk-vs-pc

___

## Cross-Correlate Output

| **Acción** | **Comando / Tool** | **Notas** |
|:---:|:---:|:---:|
| Export PK XLSX | GUI export | Standard. |
| Parse XLSX | `python-openpyxl` | Tool. |
| Export PingCastle XML | `--healthcheck` | Standard. |
| Parse XML | `xmllint` / `python-lxml` | Tool. |
| Diff per-quarter | Custom script | Standard. |
| Cross-correlate BloodHound | Cypher | Tool. |
| Cross-correlate MDI alerts | Defender | Modern. |
| Per-finding ticket | Compliance | Audit. |
| Per-quarter trend | Standard | Compliance. |
| Detection: PK + PC queries | Defender | Adjacent. |
| Modern: continuous PK + PC | Defender side | Adjacent. |
| Adjacent: Semperis DSP commercial | Modern | Adjacent. |
| Audit log retention | Standard | Compliance. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Compliance: documented findings | Standard | Adjacent. |
| Custom analytics | Tool. |
^ad-pk-correlate

### Per-quarter audit script

```powershell
# Run PK + PC every quarter
$Date = Get-Date -Format "yyyy-MM-dd"
$BaseDir = "C:\Audit\$Date"
New-Item -ItemType Directory -Path $BaseDir -Force

# PingCastle
& "C:\Tools\PingCastle.exe" --healthcheck --server DC --no-enum-limit
Move-Item ad_hc_*.xml,ad_hc_*.html "$BaseDir\"

# Purple Knight (manual export from GUI → save to $BaseDir)
Start-Process "C:\Tools\PurpleKnight\PurpleKnight.exe"
Read-Host "Press ENTER after Purple Knight export complete"

# Compress
Compress-Archive -Path "$BaseDir\*" -DestinationPath "$BaseDir.zip"
```

___

## OPSEC Considerations

| **Aspecto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Bulk LDAP queries | Loud | Defender. |
| Run as Domain User | Standard | Standard. |
| Per-engagement scope | Standard | OPSEC. |
| Detection: PK binary | Defender | Adjacent. |
| Detection: bulk LDAP via 4662 | Defender | Modern. |
| Modern: extreme alerting | Critical | Standard. |
| Per-quarter scheduled run | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit log retention | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
| Modern: continuous PK | Defender side | Adjacent. |
| OPSEC: stealth not the goal | Audit tool | Standard. |
| Adjacent: BloodHound for stealth | Cross-ref | Tool. |
| Modern: BHCE preferred for graph | Standard | Tool. |
| Custom analytics | Tool. |
^ad-pk-opsec

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| Purple Knight download | `www.purple-knight.com` | Free. |
| Semperis blog | `www.semperis.com/blog/` | Research. |
| PK indicator docs | Built-in | Standard. |
| HackTricks AD audit | `book.hacktricks.xyz` | Reference. |
| ADSecurity | `adsecurity.org` | Defender intel. |
| Microsoft Defender for Identity | Modern | Defender. |
| Adjacent: PingCastle | Cross-ref | Tool. |
| Adjacent: Semperis DSP commercial | Modern | Adjacent. |
| Modern: continuous PK | Defender side | Adjacent. |
| Compliance: PK baseline | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Per-quarter trend | Standard | Adjacent. |
| `awesome-active-directory` | GitHub | Foundation. |
| Modern: defender side | Standard | Standard. |
| Custom analytics | Tool. |
^ad-pk-resources

***
