---
aliases:
  - PingCastle
  - PingCastle Healthcheck
  - PingCastle Audit
  - PingCastle Modes
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
# AD - Health & Security Auditing - PingCastle

***

## PingCastle Modes

| **Mode** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Healthcheck | `PingCastle.exe --healthcheck --server DC` | Comprehensive audit. |
| Healthcheck XML/HTML | `--no-enum-limit --healthcheck` | Detailed. |
| Carto | `PingCastle.exe --carto` | Forest map | Trust topology. |
| Conso | `PingCastle.exe --conso` | Consolidate multiple reports. |
| Scanner | `PingCastle.exe --scanner <type> --server DC` | Specific scan. |
| ADConf | `PingCastle.exe --adconf --server DC` | Specific AD config. |
| HCRules | `PingCastle.exe --hcrules` | Rule list | Standard. |
| HealthcheckLog | `--healthcheck --log` | Log to file | Standard. |
| Interactive mode | `PingCastle.exe` (no args) | Menu-driven | Standard. |
| Multi-domain support | Per-domain | Standard. |
| Free version (community) | Limited | Standard. |
| Pro version (commercial) | Full features | Adjacent. |
| Modern Healthcheck v3.x | Updated | Tool. |
| Per-quarter audit | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| Defender + red team usage | Both | Standard. |
^ad-pingcastle-modes

### PingCastle quick start

```cmd
:: Comprehensive Healthcheck
PingCastle.exe --healthcheck --server DC --no-enum-limit

:: Output:
::   ad_hc_<domain>.xml (detailed)
::   ad_hc_<domain>.html (visual)

:: Trust map (forest-wide)
PingCastle.exe --carto --server DC

:: Specific scanner
PingCastle.exe --scanner null_session --server DC
PingCastle.exe --scanner share --server DC
PingCastle.exe --scanner zerologon --server DC
```

___

## Healthcheck Sections

| **Section** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Domain Information | Basic info | Standard. |
| Stale Objects | Inactive accounts | Standard. |
| Privileged Accounts | Tier 0 audit | Critical. |
| Trust Information | Domain trusts | Standard. |
| Anomalies | Misconfigs detected | Critical. |
| Password Policy | Default + PSO | Standard. |
| krbtgt password age | Stale check | Critical. |
| Service accounts | SPN audit | Standard. |
| ACL anomalies | Per-object | Standard. |
| GPO security | Per-GPO | Standard. |
| ADCS configuration | Modern | Tool. |
| LAPS deployment | Modern | Tool. |
| Authenticated Users in priv | Critical | Audit. |
| Pre-Windows 2000 group | Legacy audit | Standard. |
| OS version compliance | Standard | Audit. |
| Each rule has score impact | Standard | Standard. |
^ad-pingcastle-sections

___

## Score Interpretation

| **Score Range** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| 0-30 | Excellent | Best practice. |
| 30-50 | Good | Standard. |
| 50-70 | Average | Improvement needed. |
| 70-100 | Poor | Critical issues. |
| Lower = better | Standard | Standard. |
| Per-section subscores | Standard | Standard. |
| Trend over time | Per-quarter comparison | Standard. |
| Compare to industry baseline | Adjacent | Standard. |
| Per-rule severity | Standard | Standard. |
| Critical rules priority | Standard | Standard. |
| Cleanup recommendations | Per-rule | Standard. |
| Modern: continuous PingCastle | Defender side | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit log retention | Standard | Adjacent. |
| Modern: per-quarter trend | Standard | Compliance. |
^ad-pingcastle-score

### Score check

```cmd
:: Generate report
PingCastle.exe --healthcheck --server DC --no-enum-limit

:: Open ad_hc_<domain>.html in browser
:: View global score + section scores
:: Click rules for remediation guidance
```

___

## Common PingCastle Findings

| **Finding** | **Severity** | **Notas** |
|:---:|:---:|:---:|
| krbtgt password >180 days | High | Critical. |
| GPP cpassword found | Critical | Pre-MS14-025. |
| Reversible encryption | High | Critical. |
| Anonymous SAMR enabled | High | Audit. |
| Authenticated Users with priv ACE | Critical | Audit. |
| LAPS not deployed | Medium | Modern. |
| LAPSv1 only (not v2) | Low | Adjacent. |
| Unconstrained delegation non-DC | High | Critical. |
| ADCS ESC1-ESC15 vulnerabilities | Critical | Modern. |
| Stale users in priv groups | Medium | Standard. |
| Schema Admins not empty | Low | Best practice. |
| Pre-Windows 2000 populated | Low | Legacy. |
| Cross-trust SID Filtering off | High | Critical. |
| TGT Delegation cross-forest | High | Pre-2019. |
| EDITF_ATTRIBUTESUBJECTALTNAME2 | Critical | ESC6. |
| Password not required | Medium | Audit. |
^ad-pingcastle-findings

___

## Specific Scanners

| **Scanner** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `null_session` | Anonymous SMB enum | Standard. |
| `share` | Open shares | Standard. |
| `zerologon` | CVE-2020-1472 check | Critical. |
| `smb_v1` | SMBv1 detection | Standard. |
| `printerbug` | PrinterBug coercion test | Adjacent. |
| `petitpotam` | PetitPotam test | Adjacent. |
| `coercion` | Multiple coercion tests | Comprehensive. |
| `laps_bitlocker` | LAPS + BitLocker | Modern. |
| `oxidbindings` | RPC bindings | Edge. |
| `localadmin` | Local admin check | Adjacent. |
| Per-host scanners | Standard | Standard. |
| Bulk scanner | `--scanner all` | Edge. |
| Output: per-scanner XML/HTML | Standard | Standard. |
| Detection: scanner activity | Defender | Adjacent. |
| Modern: integrated in healthcheck | Standard | Tool. |
| Compliance: per-quarter scan | Standard | Adjacent. |
^ad-pingcastle-scanners

### Per-scanner usage

```cmd
:: Zerologon check
PingCastle.exe --scanner zerologon --server DC

:: Coercion tests (PetitPotam, PrinterBug, etc.)
PingCastle.exe --scanner coercion --server DC

:: Null session check
PingCastle.exe --scanner null_session --server DC

:: SMB shares enum
PingCastle.exe --scanner share --server DC
```

___

## Carto (Trust Topology)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `PingCastle.exe --carto` | Forest map | Standard. |
| `--carto --server DC` | Specific DC | Adjacent. |
| Output: visual trust topology | Standard | Tool. |
| Cross-correlate with Get-ADTrust | Standard | Audit. |
| Per-trust attributes | Standard | Standard. |
| BloodHound trust comparison | Adjacent | Tool. |
| Detection: bulk trust queries | Defender | Adjacent. |
| Modern: continuous monitoring | Defender side | Adjacent. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Compliance: documented trust baseline | Standard | Adjacent. |
| Per-quarter trust audit | Standard | Compliance. |
| Cross-correlate priv | Standard | Audit. |
| Stale trusts | Audit | Standard. |
| Modern: BHCE preferred for visual | Standard | Tool. |
| OPSEC: bulk trust enum | Defender | OPSEC. |
| Custom analytics | Tool. |
^ad-pingcastle-carto

### Carto usage

```cmd
:: Forest trust map
PingCastle.exe --carto --server DC --explore-trust 

:: Output: 
::   carto_<forest>.html (visual map)
::   carto_<forest>.xml (data)
```

___

## Reports + Trend Analysis

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-quarter healthcheck | Standard | Standard. |
| Compare reports over time | Trend | Standard. |
| `--conso` consolidates multiple | Standard | Tool. |
| XML for parsing | Adjacent | Standard. |
| HTML for review | Standard | Standard. |
| Per-rule severity tracking | Standard | Standard. |
| Compliance: documented trend | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: continuous monitoring | Defender side | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Per-engagement scoping | Standard | OPSEC. |
| Detection: PingCastle activity | Defender | Adjacent. |
| Adjacent: Purple Knight | Cross-ref | Adjacent. |
| Modern: BHCE cross-correlate | Standard | Adjacent. |
| Per-domain trend | Standard | Compliance. |
| Custom analytics scripts | Tool. |
^ad-pingcastle-reports

### Report consolidation

```cmd
:: Generate multiple reports per-quarter
:: Q1: PingCastle.exe --healthcheck --server DC -o q1_report.xml
:: Q2: PingCastle.exe --healthcheck --server DC -o q2_report.xml
:: ...

:: Consolidate
PingCastle.exe --conso

:: Output: trends + comparisons
```

___

## Defender + Red Team Usage

| **Use** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Defender baseline | Per-quarter | Standard. |
| Red team pre-engagement | Recon | Standard. |
| Red team post-engagement | Document state | Standard. |
| Compliance audit | Per-quarter | Compliance. |
| BHCE alternative | Adjacent | Tool. |
| Microsoft Defender for Identity adjacent | Modern | Defender. |
| Free community edition | Standard | Standard. |
| Pro commercial | Adjacent | Standard. |
| Multi-domain forest | Standard | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Detection: PingCastle binary | Defender | Adjacent. |
| Modern: continuous PingCastle | Defender side | Adjacent. |
| Per-engagement scope | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
^ad-pingcastle-usage

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| PingCastle docs | `www.pingcastle.com` | Tool docs. |
| PingCastle download | `www.pingcastle.com/download/` | Free. |
| Vincent Le Toux blog | Author | Research. |
| HackTricks PingCastle | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes | `thehacker.recipes` | Reference. |
| ADSecurity PingCastle | `adsecurity.org` | Defender intel. |
| Microsoft Defender for Identity | Modern | Defender. |
| Adjacent: Purple Knight | Cross-ref | Adjacent. |
| Modern: continuous PingCastle | Defender side | Adjacent. |
| `awesome-active-directory` | GitHub | Foundation. |
| Compliance: PingCastle baseline | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Per-quarter trend | Standard | Adjacent. |
| Modern: defender side | Standard | Standard. |
| Custom analytics | Tool. |
^ad-pingcastle-resources

***
