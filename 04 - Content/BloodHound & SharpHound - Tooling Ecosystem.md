---
aliases:
  - BloodHound Tooling
  - Custom BloodHound Queries
  - BHCE Integrations
  - bloodhound-cli
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[BloodHound & SharpHound]]'
---
# BloodHound & SharpHound - Tooling Ecosystem

***

## Custom Query Repos

| **Repo** | **URL** | **Cuándo** |
|:---:|:---:|:---:|
| `BloodHoundQueries` (Specter Ops) | `https://github.com/SpecterOps/BloodHoundQueries` | Standard custom queries pack. |
| `bloodhound-customqueries` | `https://github.com/CompassSecurity/BloodHoundQueries` | Audit-style queries. |
| `Plumhound` | `https://github.com/PlumHound/PlumHound` | Reporting via Cypher. |
| `BHE-Wrappers` | Custom org-specific repos | Internal team. |
^ad-bhtool-customqueries

```bash
# Import custom queries en BHCE
git clone https://github.com/SpecterOps/BloodHoundQueries
# UI → Cypher panel → Import → seleccionar JSON con queries
```

___

## bloodhound-cli (Modern)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodhound-cli install` | Instalar BHCE | Setup. |
| `bloodhound-cli config` | Configure URL/credentials | Setup. |
| `bloodhound-cli ingest <zip>` | Upload collection | Pipeline. |
| `bloodhound-cli cypher "<query>"` | Run Cypher via CLI | Automation. |
| `bloodhound-cli list users` | Quick list | Reporting. |
^ad-bhtool-cli

```bash
# Install
go install github.com/SpecterOps/bloodhound-cli/cmd/bloodhound-cli@latest

bloodhound-cli config
bloodhound-cli cypher "MATCH (u:User {owned:true}) RETURN u.name"
```

___

## SOAPHound (Stealth)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SOAPHound.exe -c All --buildcache --cachefilename cache.bin` | Build cache via ADWS (no LDAP queries) | Stealth alternativo. |
| `SOAPHound.exe -c All --bhdump --cachefilename cache.bin --output bhdata.zip` | Generate BH-compatible JSON desde cache | Post-cache. |
| `SOAPHound.exe -c CertServices` | ADCS-specific stealth | Targeted. |
^ad-bhtool-soaphound

**Por qué SOAPHound:** usa **ADWS** (Active Directory Web Services SOAP API, port 9389) en lugar de LDAP. Bypass de detection rules basadas en bulk LDAP queries.

```cmd
:: Pipeline standard
SOAPHound.exe -c All --buildcache --cachefilename cache.bin
SOAPHound.exe -c All --bhdump --cachefilename cache.bin --output bhdata.zip
```

___

## ldeep (Linux LDAP Dump)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldeep ldap -u u -p pass -d corp.local -s ldap://<DC> all output` | Bulk LDAP dump (incluye todo) | Linux. |
| `ldeep ldap -u u -p pass -d corp.local -s ldap://<DC> users` | Solo users | Targeted. |
| `ldeep ldap -u u -p pass -d corp.local -s ldap://<DC> --resolve` | Resolve SIDs/GUIDs | Detail. |
| `ldeep cache -d <output-dir>` | Local cache queries | Post-dump. |
^ad-bhtool-ldeep

```bash
git clone https://github.com/franc-pentest/ldeep
pip install ldeep
ldeep ldap -u auditor -p 'Pass!' -d corp.local -s ldap://<DC> all output -o ./loot/
```

___

## ADRecon Bulk Reports

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1 -DomainController <DC> -OutputType Excel` | Excel multi-sheet | Auditor-friendly. |
| `.\ADRecon.ps1 -OutputType CSV -OutputDir .\report` | CSV per category | Pipeline. |
| Cross-correlate ADRecon CSVs con BHCE Cypher | Bidirectional analysis | Comprehensive. |
^ad-bhtool-adrecon

___

## OpenGraph (BHCE 6.x)

| **Concept** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Hybrid identity correlation | AD on-prem + Entra ID + Azure | Hybrid envs. |
| Cross-platform paths | User AAD → User AD via UPN | Path. |
| `MATCH (u:AzureUser)-[:SyncedTo]->(local:User)` | Cypher hybrid | Standard. |
| Required: AzureHound + SharpHound ZIPs | Both ingested | Setup. |
^ad-bhtool-opengraph

___

## BHCE Integrations

| **Tool** | **Integration** | **Cuándo** |
|:---:|:---:|:---:|
| Slack/Teams alerts | Webhook on new owned/highvalue | Team workflow. |
| SIEM (Splunk/Sentinel) ingest BHCE alerts | API integration | Defender. |
| Atomic Red Team scenarios | Test detection rules | Validation. |
| Plumhound for Cypher reporting | Auto-generate audit reports | Compliance. |
| Excel export | UI → table view → export | Reportable. |
^ad-bhtool-integrations

___

## Specter Ops Tools

| **Tool** | **URL** | **Cuándo** |
|:---:|:---:|:---:|
| BloodHound CE | `https://github.com/SpecterOps/BloodHound` | Standard. |
| BloodHound Enterprise | Commercial | Continuous attack path monitoring. |
| SharpHound | `https://github.com/BloodHoundAD/SharpHound` | Default collector. |
| BloodHound Operator (PowerShell) | `https://github.com/SpecterOps/BloodHound-Operator` | Helper. |
| AzureHound | `https://github.com/SpecterOps/AzureHound` | Cloud. |
| Forest Druid (Semperis) | `https://www.semperis.com/forest-druid/` | Tier 0 paths visual alt. |
^ad-bhtool-specterops

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| BloodHound CE docs | `https://bloodhound.specterops.io/` |
| BloodHound Cypher reference | `https://bloodhound.specterops.io/resources/cypher` |
| Edge reference | `https://bloodhound.specterops.io/resources/edges` |
| BHCE Slack | `https://specterops.slack.com` |
| `awesome-bloodhound` (community) | `https://github.com/Stuart-StD/Awesome-BloodHound` |
| Specter Ops blog | `https://posts.specterops.io` |
| HackTricks BloodHound | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/bloodhound` |
| The Hacker Recipes — BloodHound | `https://www.thehacker.recipes/ad/recon/bloodhound` |
| GOAD lab (practice) | `https://github.com/Orange-Cyberdefense/GOAD` |
^ad-bhtool-resources

***
