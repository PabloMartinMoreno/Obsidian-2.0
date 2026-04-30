---
aliases:
  - BloodHound Tooling
  - Custom BloodHound Queries
  - BHCE Integrations
  - bloodhound-cli
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
  - "[[BloodHound & SharpHound]]"
---
# BloodHound & SharpHound - Tooling Ecosystem

***

## Custom Query Repos

| **Repo** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| CompassSecurity/BloodHoundQueries | 100+ custom Cypher | Comprehensive. |
| haus3c/bloodhound-Custom-Queries | Adjacent | Standard. |
| ZephrFish/Bloodhound-CustomQueries | Adjacent | Edge. |
| `git clone https://github.com/CompassSecurity/BloodHoundQueries` | Install | Standard. |
| Per-engagement scoped queries | Standard | OPSEC. |
| Compliance baseline queries | Standard | Adjacent. |
| Custom analytics scripts | Tool | Standard. |
| Modern: BHCE 6.x query import | Standard | Tool. |
| Per-domain ingest required | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| OPSEC: targeted queries | Stealth | OPSEC. |
| Detection: heavy queries | Defender | Adjacent. |
| Adjacent: BloodHound CE hub | Cross-ref | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Custom query development | DIY | Standard. |
| Audit baseline | Standard | Compliance. |
^ad-bhtool-customqueries

### Import custom queries

```bash
# Compass Security queries (most comprehensive)
git clone https://github.com/CompassSecurity/BloodHoundQueries

# Per-query: copy-paste into BHCE custom Cypher
# Or programmatic via API
```

___

## bloodhound-cli (Modern Helper)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `bloodhound-cli install` | Auto-install BHCE | Modern. |
| `bloodhound-cli config` | Configure | Standard. |
| `bloodhound-cli upload data.zip` | API ingest | Standard. |
| `bloodhound-cli query "MATCH ..."` | CLI query | Standard. |
| Modern alternative to Web UI | Standard | Tool. |
| Per-engagement automation | Adjacent | Edge. |
| Programmatic ingest | Standard | Standard. |
| Modern BHCE 6.x integration | Standard | Tool. |
| Detection: API access logs | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Custom analytics scripts | Tool. |
| Adjacent: BloodHound CE hub | Cross-ref | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Per-engagement scope | Standard | OPSEC. |
^ad-bhtool-cli

### bloodhound-cli usage

```bash
# Install BHCE via CLI
go install github.com/SpecterOps/bloodhound-cli@latest
bloodhound-cli install

# Configure
bloodhound-cli config

# Upload collection
bloodhound-cli upload collection.zip

# Run query
bloodhound-cli query 'MATCH (u:User) RETURN count(u)'
```

___

## ImpacketGuy / SOAPHound (Stealth)

| **Tool** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| SOAPHound (Falcon Force) | Uses SOAP API not LDAP | Stealth. |
| `SOAPHound -c All --output collection.zip` | Standard usage | Standard. |
| Reduces LDAP query signatures | Edge | OPSEC. |
| Modern alternative to SharpHound | Modern | Tool. |
| Less mature than SharpHound | Adjacent | Edge. |
| BHCE-compatible output | Standard | Tool. |
| Detection: SOAP signatures | Defender | Adjacent. |
| Modern: emerging stealth tool | Standard | Tool. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| OPSEC: stealth mode | Standard | OPSEC. |
| Adjacent: SharpHound | Cross-ref | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Custom analytics | Tool. |
| Audit baseline | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-bhtool-soaphound

### SOAPHound usage

```cmd
:: SOAPHound (FalconForce)
SOAPHound.exe -c All --output collection.zip

:: Stealth mode (DC-only, less queries)
SOAPHound.exe --buildcache --output stealth.zip
```

___

## ldeep (Linux LDAP Dump)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `ldeep ldap -u user -p pass -d dom -s ldap://DC -o output_dir all` | Comprehensive | Standard. |
| `ldeep ldap ... users` | Users only | Filter. |
| `ldeep ldap ... groups` | Groups | Filter. |
| `ldeep ldap ... computers` | Computers | Filter. |
| `ldeep ldap ... trusts` | Trusts | Filter. |
| `ldeep ldap ... gpo` | GPOs | Filter. |
| Output: structured JSON | Standard | Tool. |
| Modern alternative to ADRecon | Linux | Standard. |
| Compatible with BloodHound JSON ingest | Adjacent | Edge. |
| Adjacent: bloodhound-python | Standard | Adjacent. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Custom analytics | Tool. |
| Audit baseline | Standard | Compliance. |
^ad-bhtool-ldeep

### ldeep usage

```bash
# Install
pip install ldeep

# Comprehensive dump
ldeep ldap -u user -p pass -d dom.local -s ldap://DC -o ./loot/ all

# Specific category
ldeep ldap -u user -p pass -d dom.local -s ldap://DC -o ./loot/ users
ldeep ldap -u user -p pass -d dom.local -s ldap://DC -o ./loot/ groups
ldeep ldap -u user -p pass -d dom.local -s ldap://DC -o ./loot/ trusts
ldeep ldap -u user -p pass -d dom.local -s ldap://DC -o ./loot/ gpo
```

___

## ADRecon Bulk Reports

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1 -Method LDAP` | Default | Standard. |
| `.\ADRecon.ps1 -Method LDAP -DomainController DC` | Specific DC | Adjacent. |
| `.\ADRecon.ps1 -Collect Users,Groups,Computers,GPOs,ACLs,Trusts,ADCS,...` | Targeted | Standard. |
| Output: XLSX comprehensive | Standard | Tool. |
| Per-section CSV output | Adjacent | Standard. |
| Modern alternative to ADCollector | Standard | Standard. |
| Compatibility with BHCE? | Manual ingest required | Edge. |
| Comprehensive forest snapshot | Standard | Standard. |
| Detection: bulk LDAP | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Per-quarter bulk audit | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: continuous BHCE preferred | Standard | Tool. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit log retention | Standard | Adjacent. |
| Modern: defender side | Adjacent | Adjacent. |
^ad-bhtool-adrecon

### ADRecon

```powershell
# Comprehensive
.\ADRecon\ADRecon.ps1 -Method LDAP -DomainController DC -Credential (Get-Credential)

# Output: ADRecon-Report-YYYYMMDDHHMMSS\
#   Forest.xlsx, Domains.xlsx, Trusts.xlsx, etc.
```

___

## OpenGraph Custom Data (BHCE 6.x)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| OpenGraph format | Custom node + edge ingest | Modern. |
| Custom data sources | Per-engagement | Adjacent. |
| Hybrid identity ingest | Modern | Tool. |
| Per-org custom edges | Standard | Tool. |
| OpenGraph schema | JSON-based | Standard. |
| BHCE 6.x ingest endpoint | API | Standard. |
| Custom integrations | DIY | Standard. |
| Modern: emerging custom data | Standard | Tool. |
| Compliance: documented per-engagement | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Adjacent: BHCE 6.x changelog | Reference | Tool. |
| Custom analytics | Tool. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Detection: custom ingest events | Defender | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| OPSEC: custom data scope | Per-engagement | OPSEC. |
^ad-bhtool-opengraph

___

## BHCE Integrations

| **Integration** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Microsoft Defender for Identity | Continuous monitoring | Modern. |
| Microsoft Sentinel | SIEM | Modern. |
| Splunk | SIEM | Standard. |
| Elastic / ELK | SIEM | Standard. |
| MISP | Threat intel | Adjacent. |
| ServiceNow | ITSM | Edge. |
| Custom webhooks | Per-org | Standard. |
| Slack alerts | Modern | Standard. |
| Email notifications | Standard | Standard. |
| API automation | Standard | Standard. |
| Per-engagement integrations | Standard | Adjacent. |
| Compliance: documented integrations | Standard | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| OPSEC: scoped integrations | Per-engagement | OPSEC. |
| Audit baseline | Standard | Compliance. |
^ad-bhtool-integrations

___

## Specter Ops Pre-Built Tools

| **Tool** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| BloodHound CE | Open source | Standard. |
| BloodHound Enterprise | Commercial | Adjacent. |
| AzureHound | Cloud | Modern. |
| SharpHound | Windows collector | Standard. |
| BloodHound.py | Python | Standard. |
| RustHound | Modern | Tool. |
| `awspx` (AWS) | Cloud adjacent | Edge. |
| `gcphound` (GCP) | Cloud adjacent | Edge. |
| Custom analytics | Tool. |
| Compliance baseline tools | Standard | Adjacent. |
| Per-engagement custom | DIY | Standard. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Adjacent: BloodHound Enterprise docs | Reference | Standard. |
| Audit baseline | Standard | Compliance. |
| Detection: BHCE collection events | Defender | Adjacent. |
^ad-bhtool-specterops

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| BloodHound CE docs | `bloodhound.specterops.io` | Tool docs. |
| BloodHound CE GitHub | `github.com/SpecterOps/BloodHound` | Source. |
| Compass Security queries | `github.com/CompassSecurity/BloodHoundQueries` | Custom queries. |
| haus3c queries | `github.com/haus3c/bloodhound-Custom-Queries` | Adjacent. |
| Specter Ops blog | `posts.specterops.io` | Research. |
| HackTricks BloodHound | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes BloodHound | `thehacker.recipes/ad/recon` | Reference. |
| `awesome-active-directory` | GitHub | Foundation. |
| Will Schroeder research | Specter Ops | Adversary. |
| Modern: BHCE 6.x changelog | Per-release | Tool. |
| BloodHound Slack | Community | Discussion. |
| SOAPHound (FalconForce) | `github.com/FalconForceTeam/SOAPHound` | Stealth. |
| ldeep | `github.com/franc-pentest/ldeep` | Linux LDAP dump. |
| ADRecon | `github.com/adrecon/ADRecon` | Bulk reports. |
| Microsoft Defender for Identity | Modern detection | Defender. |
| Compliance: red team standard | Standard | Industry. |
^ad-bhtool-resources

***
