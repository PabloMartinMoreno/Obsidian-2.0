---
aliases:
  - AD Audit Tooling
  - AD Audit Ecosystem
  - Audit tools comparison
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
# AD - Health & Security Auditing - Tooling Ecosystem

---

## Comparativa por uso

| **Tool** | **Mejor para** | **Output** |
|:---:|:---:|:---:|
| PingCastle | Healthcheck score + scanners CVE | HTML/XML |
| Purple Knight | IoE + IoC + Hybrid (Entra ID) | PDF/XLSX |
| BloodHound CE | Attack paths + Cypher | Neo4j graph |
| ADRecon | Excel multi-sheet inventory | Excel/CSV |
| ADCollector | Recon C# rápido | Console/log |
| Forest Druid | Tier 0 attack paths | Web UI |
| Locksmith | ADCS misconfig específico | Console |
| Certify / Certipy | ADCS abuse + audit | Console |
| Microsoft Defender for Identity | Continuous SOC | Portal/API |
| ADSecurityScanner (commercial) | Compliance frameworks | Dashboard |
^ad-tooling-compare

---

## ADCS-specific tooling

| **Tool** | **Comando** | **Qué hace** |
|:---:|:---:|:---:|
| Certify | `Certify.exe find /vulnerable` | Detecta ESC1-15 desde Windows. |
| Certipy | `certipy find -u u@dom -p pass -dc-ip x.x.x.x` | Detección desde Linux. |
| Certipy vulnerable | `certipy find -u u -p p -dc-ip x.x.x.x -vulnerable -stdout` | Solo templates risky. |
| Locksmith | `Invoke-Locksmith` | ADCS audit PowerShell. |
| PSPKI | `Get-CertificateTemplate` | Templates desde DS. |
| ADCSTemplate | `Get-ADCSTemplate` | Templates con flags. |
^ad-tooling-adcs

```bash
# Linux — ADCS audit completo
certipy find -u auditor@corp.local -p 'pass' -dc-ip 10.10.10.10 \
    -output corp.local -text -stdout -vulnerable
```

---

## Forest Druid (Tier 0 paths)

| **Acción** | **Cómo** | **Cuándo** |
|:---:|:---:|:---:|
| Install | Download from `semperis.com/forest-druid/` | Workstation. |
| Run | GUI → connect to DC | Tier 0 audit. |
| Output | Web UI con graph | Visual. |
| Cross-correlate BloodHound | Importar mismo data | Validation. |
^ad-tooling-druid

---

## Forensic / IR tools

| **Tool** | **Uso** | **Cuándo** |
|:---:|:---:|:---:|
| ADRecon-ADCS | ADCS forensics | Post-compromise ADCS. |
| Hunt-ADBackdoors | Persistence finder | IR. |
| DSInternals | NTDS.dit offline parsing | Forensics. |
| `Get-ADDBAccount -All` (DSInternals) | Dump hashes desde NTDS.dit | IR offline. |
| `Test-PasswordQuality` (DSInternals) | Password reuse / weak | Audit. |
| Mimikatz `lsadump::dcsync` (defender side) | Validar DCSync detection | Tabletop. |
^ad-tooling-ir

```powershell
# DSInternals — audit passwords offline
Install-Module DSInternals
$NTDS = Get-ADDBAccount -All -DBPath 'C:\IFM\Active Directory\ntds.dit' -BootKey (Get-BootKey -SystemHivePath 'C:\IFM\registry\SYSTEM')

# Cuentas con password reusado
$NTDS | Test-PasswordQuality -WeakPasswordHashesSortedFile pwned-hashes.txt
```

---

## Cloud / Hybrid tools

| **Tool** | **Uso** | **Cuándo** |
|:---:|:---:|:---:|
| AzureHound | Entra ID collection para BloodHound | Tenant audit. |
| ROADtools (`roadrecon`) | Entra ID dump + analytics | Recon profundo. |
| ScubaGear (CISA) | M365/Entra compliance baseline | Compliance gov. |
| AADInternals | Entra ID PS module | Audit + offensive. |
| Maester | Entra ID compliance tests Pester | CI/CD compliance. |
^ad-tooling-cloud

```bash
# ROADtools — full tenant dump
pip install roadrecon
roadrecon auth -u auditor@tenant.onmicrosoft.com
roadrecon gather
roadrecon gui  # http://localhost:5000
```

---

## Free vs commercial

| **Tool** | **Free** | **Commercial** |
|:---:|:---:|:---:|
| PingCastle | Healthcheck completo | Pro: continuous monitoring + custom rules |
| Purple Knight | Indicators completos | Semperis DSP: continuous + IR |
| BloodHound CE | Open source | BloodHound Enterprise: continuous attack paths |
| Tenable AD (ex-Alsid) | No free tier | Continuous + alertas |
| ManageEngine ADAudit | Trial 30d | Compliance reports |
| Netwrix Auditor | Trial 20d | Change auditing |
^ad-tooling-license

---

## Pipeline recomendado por engagement

| **Fase** | **Tool primario** | **Tool secundario** |
|:---:|:---:|:---:|
| Pre-engagement recon | PingCastle `--healthcheck` | ADRecon |
| Pre-engagement trust map | PingCastle `--carto` | Forest Druid |
| Attack path planning | BloodHound CE | Certipy `find` |
| Coercion check | PingCastle `--scanner coercion` | Custom NTLM relay test |
| Post-engagement state | Purple Knight | PingCastle re-run |
| IR / forensics | DSInternals | MDI portal |
| Compliance handoff | PingCastle PDF | Purple Knight PDF |
^ad-tooling-pipeline

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| awesome-active-directory | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
| GOAD lab | `https://github.com/Orange-Cyberdefense/GOAD` |
| TheHackerRecipes AD | `https://www.thehacker.recipes/ad/` |
| HackTricks AD | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology` |
| ADSecurity blog | `https://adsecurity.org` |
| Specter Ops blog | `https://posts.specterops.io` |
^ad-tooling-resources

---
