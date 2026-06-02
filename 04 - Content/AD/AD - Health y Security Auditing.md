---
aliases:
  - AD Health Auditing
  - AD Security Auditing
  - AD Compliance Audit
  - PingCastle Purple Knight ADRecon
  - AD - Health & Security Auditing
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
kind: CheatSheet
linked:
  - "[[AD - Health y Security Auditing - PingCastle]]"
  - "[[AD - Health y Security Auditing - Purple Knight]]"
  - "[[AD - Health y Security Auditing - ADRecon y ADCollector]]"
  - "[[AD - Health y Security Auditing - Microsoft Defender for Identity]]"
  - "[[AD - Health y Security Auditing - Custom Compliance Scripts]]"
  - "[[AD - Health y Security Auditing - Tooling Ecosystem]]"
  - "[[BloodHound & SharpHound]]"
  - "[[ADCS Abuse]]"
---
# AD - Health & Security Auditing

---

## Cheatsheet

### 🔍 PingCastle

````tabs
tab: **Healthcheck completo**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-healthcheck]]

tab: **Carto (trust topology)**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-carto]]

tab: **Scanners específicos**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-scanners]]

tab: **Hallazgos críticos**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-findings]]

tab: **Consolidación + trends**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-conso]]

tab: **Score interpretation**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-score]]

tab: **Recursos**
![[AD - Health y Security Auditing - PingCastle#^ad-pingcastle-resources]]
````

### 🛡️ Purple Knight

````tabs
tab: **Ejecución**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-exec]]

tab: **Indicators of Exposure (IoE)**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-ioe]]

tab: **Indicators of Compromise (IoC)**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-ioc]]

tab: **Cross-correlate PingCastle**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-correlate]]

tab: **PK vs PingCastle**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-vs-pc]]

tab: **Recursos**
![[AD - Health y Security Auditing - Purple Knight#^ad-pk-resources]]
````

### 📋 ADRecon & ADCollector

````tabs
tab: **ADRecon ejecución**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adrecon-exec]]

tab: **ADRecon sheets**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adrecon-sheets]]

tab: **ADCollector ejecución**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adcollector-exec]]

tab: **ADRecon vs ADCollector**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adrecon-vs-adcoll]]

tab: **Parseo del output**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adrecon-parse]]

tab: **Recursos**
![[AD - Health y Security Auditing - ADRecon y ADCollector#^ad-adrecon-resources]]
````

### 🌐 Microsoft Defender for Identity

````tabs
tab: **Detección desde atacante**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-detect]]

tab: **Identificar MDI activo**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-identify]]

tab: **Honey-tokens**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-honey]]

tab: **MDI lado defensor**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-defender]]

tab: **OPSEC red team**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-opsec]]

tab: **Recursos**
![[AD - Health y Security Auditing - Microsoft Defender for Identity#^ad-mdi-resources]]
````

### 💉 Custom Compliance Scripts

````tabs
tab: **Stale accounts**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-stale]]

tab: **Privileged audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-priv]]

tab: **Password policy**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-pwpolicy]]

tab: **Kerberos health**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-krb]]

tab: **Delegation audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-deleg]]

tab: **ADCS audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-adcs]]

tab: **ACL anomalies**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-acl]]

tab: **GPO audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-gpo]]

tab: **LAPS audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-laps]]

tab: **Trust audit**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-trust]]

tab: **Recursos**
![[AD - Health y Security Auditing - Custom Compliance Scripts#^ad-custom-resources]]
````

### 🛠️ Tooling Ecosystem

````tabs
tab: **Comparativa por uso**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-compare]]

tab: **ADCS-specific**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-adcs]]

tab: **Forest Druid**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-druid]]

tab: **Forensic / IR**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-ir]]

tab: **Cloud / Hybrid**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-cloud]]

tab: **Free vs commercial**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-license]]

tab: **Pipeline por engagement**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-pipeline]]

tab: **Recursos**
![[AD - Health y Security Auditing - Tooling Ecosystem#^ad-tooling-resources]]
````

---

## Overview

**AD Health & Security Auditing** = ejecutar tooling estandarizado (PingCastle, Purple Knight, ADRecon) sobre el dominio para producir reportes con score, IoE/IoC, y ACL/Tier-0 findings. Red team usa para pre-engagement recon + post-engagement state. Defender usa para baseline trimestral + detection.

### Cuándo usar qué

| **Objetivo** | **Tool primario** |
|---|---|
| Score numérico + scanners CVE | PingCastle |
| IoE + IoC + Hybrid (Entra ID) | Purple Knight |
| Inventory Excel multi-sheet | ADRecon |
| Recon C# rápido y silencioso | ADCollector |
| Continuous SOC | Microsoft Defender for Identity |
| Compliance scripts custom | RSAT + PowerShell |
| Tier 0 attack paths | BloodHound + Forest Druid |

---

## Workflow

```
1. Discovery inicial:
   - PingCastle --healthcheck (score + ad_hc_*.html)
   - PingCastle --carto (trust map)
   - ADRecon (Excel inventory)

2. CVE-specific scanners:
   - PingCastle --scanner zerologon
   - PingCastle --scanner coercion (PetitPotam + PrinterBug)
   - PingCastle --scanner null_session

3. Indicator-based audit:
   - Purple Knight (IoE + IoC)
   - Custom scripts (krbtgt, AdminSDHolder, GPP cpassword)

4. ADCS-specific:
   - certipy find -vulnerable
   - Locksmith (PowerShell)

5. Identify defender presence:
   - Service AATPSensor en DCs (MDI)
   - Honey-tokens (lastLogon=0 + adminCount=1)

6. Cross-correlate:
   - PingCastle XML + Purple Knight XLSX diff
   - BloodHound graph para attack paths
   - Forest Druid para Tier 0

7. Trend analysis:
   - PingCastle --conso (Q1 vs Q2)
   - Custom diff scripts

8. Output handoff:
   - PingCastle HTML + PDF para management
   - Purple Knight PDF
   - Findings priorizados High/Critical primero
```

---

## Detección rápida

```cmd
:: Pipeline trimestral mínimo desde workstation con RSAT

:: PingCastle healthcheck + carto
PingCastle.exe --healthcheck --server dc01 --no-enum-limit
PingCastle.exe --carto --explore-trust

:: Coercion + Zerologon
PingCastle.exe --scanner coercion --server dc01
PingCastle.exe --scanner zerologon --server dc01

:: Purple Knight (GUI export manual)
PurpleKnight.exe

:: ADRecon (Excel completo)
.\ADRecon.ps1 -DomainController dc01 -OutputType Excel
```

```bash
# Linux
certipy find -u auditor@corp.local -p pass -dc-ip 10.10.10.10 -vulnerable -stdout
```

---

## Impacto del audit

- **PingCastle score 70-100** → IR triage probable.
- **GPP cpassword found** → cleartext password (Critical).
- **ADCS ESC1-15** → domain takeover via cert (Critical).
- **krbtgt >180d** → Golden Ticket persistence risk.
- **Authenticated Users priv ACE** → mass compromise vector.
- **Cross-trust SID Filtering off** → forest takeover.
- **Unconstrained delegation non-DC** → TGT capture.
- **DCSync rights non-DC user** → Golden Ticket prep IoC.
- **MDI honey-token hit** → IR escalation.
- **AdminSDHolder modificado <30d** → persistence backdoor.

---

## Mitigación (defender)

```powershell
# krbtgt reset 2× con 24h gap
.\New-KrbtgtKeys.ps1 -OperationalMode -OneStep
# wait 24h, esperar replicación completa
.\New-KrbtgtKeys.ps1 -OperationalMode -OneStep

# Disable EDITF_ATTRIBUTESUBJECTALTNAME2 (ESC6)
certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2
net stop certsvc && net start certsvc

# SID Filtering en cross-forest trusts
netdom trust corp.local /domain:partner.local /quarantine:yes

# Disable Anonymous LDAP
Set-ADObject "CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=corp,DC=local" `
  -Replace @{dsHeuristics='000000000100000002000000001'}

# MachineAccountQuota = 0
Set-ADDomain -Identity corp.local -Replace @{"ms-DS-MachineAccountQuota"="0"}
```

- **PingCastle Pro / Semperis DSP** → continuous monitoring.
- **Microsoft Defender for Identity** → behavioural alerting.
- **BloodHound Enterprise** → continuous attack path analysis.
- **Audit Subcategory `Directory Service Access` verbose** → catch bulk LDAP.
- **Honey-token deploy** → tripwire para discovery.

---

## Para entender el ecosistema

**PingCastle vs Purple Knight no son redundantes.**

PingCastle nació en 2017 (Vincent Le Toux) con foco scoring + scanners CVE. Comando `--carto` mapea trusts visualmente, `--scanner zerologon/coercion/petitpotam` chequea CVEs específicos. Output XML/HTML, free + Pro commercial.

Purple Knight nació en 2021 (Semperis) con foco IoE/IoC + Hybrid (Entra ID). 100+ indicators con MITRE ATT&CK mapping. Output PDF/XLSX, free + Semperis DSP commercial.

Cobertura no se solapa al 100%: PingCastle catch CVEs concretos (Zerologon, PetitPotam), Purple Knight catch IoCs post-compromiso (AdminSDHolder, krbtgt anomalías). Audit serio = ambos.

**ADRecon es inventory, no audit.**

ADRecon dump completo a Excel multi-sheet (Forest, Domain, Users, Groups, ACLs, GPOs, LAPS, BitLocker, Computers, Trusts). No tiene scoring ni findings — el auditor parsea para encontrar anomalías. Útil como baseline de inventory + diff trimestral.

**ADCollector es ADRecon en C#.**

Mismo concepto pero binario .NET (rápido, sin AMSI overhead). Output console/log, no Excel. Útil red-team para recon silencioso y rápido cuando no querés footprint PowerShell.

**MDI es continuous, no point-in-time.**

PingCastle/Purple Knight/ADRecon corren manual o scheduled. MDI corre como service en DCs (`AATPSensor`) parseando ETW + LDAP en tiempo real. Detecta techniques (DCSync, Kerberoast, Golden Ticket). Red team identifica MDI antes de actuar (`Get-Service AATPSensor`).

**Forest Druid es BloodHound focalizado en Tier 0.**

BloodHound general-purpose attack paths. Forest Druid (Semperis) específicamente Tier 0 inbound paths (quien puede llegar a Domain Admins). Web UI más amigable para defender.

**krbtgt reset 2× obligatorio.**

KVNO incrementa de a 1. Si reseteás 1 vez, attacker con Golden Ticket viejo puede usar nuevo password (todavía aceptado para descifrar tickets con KVNO previo). Reset 2× con replicación entre = invalida Golden Ticket viejo. Wait 24h entre resets = replicación full forest.

**ESC6 (`EDITF_ATTRIBUTESUBJECTALTNAME2`) ≠ ESC1.**

ESC6 = flag global del CA permitiendo SAN injection en cualquier template. ESC1 = template específico con `ENROLLEE_SUPPLIES_SUBJECT`. Ambos critical, distintas mitigaciones.

**MS14-025 patch ≠ cpassword removal.**

Patch impide CREAR nuevos GPP con cpassword. XMLs viejos en SYSVOL persisten hasta cleanup manual. PingCastle + Purple Knight detectan ambos.

---

## Recursos

- [PingCastle](https://www.pingcastle.com/) — healthcheck + scanners.
- [Purple Knight](https://www.purple-knight.com/) — Semperis IoE/IoC.
- [ADRecon](https://github.com/adrecon/ADRecon) — Excel inventory.
- [ADCollector](https://github.com/dev-2null/ADCollector) — C# recon.
- [Forest Druid](https://www.semperis.com/forest-druid/) — Tier 0 paths.
- [Locksmith](https://github.com/TrimarcJake/Locksmith) — ADCS audit PS.
- [Certipy](https://github.com/ly4k/Certipy) — ADCS abuse + audit Linux.
- [DSInternals](https://github.com/MichaelGrafnetter/DSInternals) — NTDS.dit forensics.
- [Microsoft Defender for Identity docs](https://learn.microsoft.com/defender-for-identity/) — vendor.
- [New-KrbtgtKeys.ps1 (Microsoft)](https://github.com/microsoft/New-KrbtgtKeys.ps1) — krbtgt reset.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [SpecterOps blog](https://posts.specterops.io) — research.
- [GOAD lab](https://github.com/Orange-Cyberdefense/GOAD) — practice.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-activedirectory) — curated.

---
