---
aliases:
  - Trust Enumeration
  - nltest trusts
  - Get-ADTrust
  - LDAP trustedDomain
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Domain & Forest Trusts - Trust Discovery

***

## Native Windows Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nltest /domain_trusts` | Trusts directos del domain actual | Quick check. |
| `nltest /domain_trusts /all_trusts /v` | Todos los trusts (forest-wide) verbose | Mapping completo. |
| `nltest /trusted_domains` | Solo trusts directos (no transitive) | Subset. |
| `nltest /server:<DC> /trusted_domains` | Trusts vistos desde DC específico | Cross-DC validation. |
| `nltest /sc_query:<dom>` | Estado del secure channel | Trust health. |
| `nltest /sc_verify:<dom>` | Verificar trust funciona | Health check. |
| `Get-ADTrust -Filter *` | Trusts via RSAT con direction + type | Detail completo. |
| `Get-ADTrust -Filter * -Properties SIDFilteringForestAware,SIDFilteringQuarantined,TGTDelegation,SelectiveAuthentication` | Atributos críticos hardening | Audit defender. |
| `netdom query trust` | Trusts via netdom | Native alt. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain().GetAllTrustRelationships()` | Trusts via .NET | Sin RSAT/nltest. |
^ad-trust-discover-native

```powershell
# Audit completo trusts con flags hardening
Get-ADTrust -Filter * -Properties * |
  Select Name,Source,Target,Direction,TrustType,IsTransitive,
         SelectiveAuthentication,TGTDelegation,
         SIDFilteringForestAware,SIDFilteringQuarantined,UplevelOnly
```

```cmd
:: Output flags decoded:
:: PRIMARY            -> Trust originates here
:: NATIVE             -> Native mode
:: TREE_ROOT          -> Tree root domain
:: WITHIN_FOREST      -> Intra-forest
:: DIRECT_OUTBOUND    -> Outbound only
:: DIRECT_INBOUND     -> Inbound only
:: FOREST_TRANSITIVE  -> Forest-level transitive
:: CROSS_ORGANIZATION -> Selective Auth típico
nltest /domain_trusts /all_trusts /v
```

___

## LDAP Trust Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D u -w p -b "CN=System,DC=corp,DC=local" "(objectClass=trustedDomain)" cn flatName trustPartner trustDirection trustType trustAttributes securityIdentifier` | Trusts via LDAP raw (Linux) | Sin RSAT. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=trustedDomain)" "*"` | Wrapper netexec | Quick. |
| `ldapsearch ... -b "CN=Partitions,CN=Configuration,DC=corp,DC=local" "(objectClass=crossRef)"` | Cross-references forest-level | Forest map. |
^ad-trust-discover-ldap

**Atributos clave del `trustedDomain`:**
- `trustPartner` → FQDN del peer
- `flatName` → NetBIOS del peer
- `trustDirection` → 1=inbound, 2=outbound, 3=bidirectional
- `trustType` → 1=Windows NT, 2=Active Directory, 3=Kerberos realm
- `trustAttributes` → bitfield (transitive, forest, selective auth, etc)
- `securityIdentifier` → SID del foreign domain

```bash
# Trust dump completo
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "CN=System,DC=corp,DC=local" \
  "(objectClass=trustedDomain)" \
  cn flatName trustPartner trustDirection trustType trustAttributes \
  securityIdentifier whenCreated whenChanged
```

___

## PowerView / pywerview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainTrust` | Trusts del domain actual | Adversary tool. |
| `Get-DomainTrustMapping` | Crawl multi-domain forest map | Auto-walk trusts. |
| `Get-ForestTrust` | Trusts forest-level | Forest scope. |
| `Get-ForestDomain` | Todos domains del forest | Forest mapping. |
| `Find-ForeignUser` | Users con membership en groups foreign | Cross-trust path discovery. |
| `Find-ForeignGroup` | Groups con miembros foreign | Cross-trust audit. |
| `Get-DomainSID` | Local domain SID | Para resolver SID foreign. |
| `Get-DomainObject -SearchBase "CN=System,DC=corp,DC=local" -LDAPFilter "(objectClass=trustedDomain)" -Properties *` | LDAP trust object detallado | Atributos completos. |
| `pywerview get-domaintrust -u u -p p -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
| `pywerview get-domaintrust-mapping -u u -p p -d corp.local --dc-ip <DC>` | Linux mapping | Linux. |
^ad-trust-discover-powerview

```powershell
# Mapping forest + foreign principals
Import-Module .\PowerView.ps1
Get-DomainTrustMapping
Find-ForeignUser
Find-ForeignGroup
```

___

## BloodHound Trust Edges

| **Cypher Query** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH p=(a:Domain)-[r:Trusts]->(b:Domain) RETURN p` | Visualizar todos trusts | Forest topology. |
| `MATCH p=(a:Domain)-[r:Trusts]->(b:Domain) WHERE r.isTransitive=true RETURN p` | Trusts transitivos solamente | Critical path enum. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group) WHERE u.domain <> g.domain RETURN u.name,u.domain,g.name,g.domain` | Foreign group members | Cross-trust users en priv. |
| `MATCH (foreign:User) WHERE foreign.domain="OTHER-DOM" MATCH (da:Group {name:"DOMAIN ADMINS@LOCAL-DOM"}) MATCH p=shortestPath((foreign)-[*1..]->(da)) RETURN p` | Path foreign user → DA local | Attack path planning. |
^ad-trust-discover-bh

```bash
# SharpHound — collection trust + ACLs
SharpHound.exe -c Trusts,ACL,ObjectProps,Container,LocalGroup --Stealth

# BloodHound.py Linux equivalent
bloodhound-python -d corp.local -u u -p p -ns <DC> -c Trusts --zip
```

___

## Cross-Forest / Forest Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADForest -Current LocalComputer` | Forest object completo | Forest scope. |
| `(Get-ADForest).Domains` | Lista domains del forest | Multi-domain mapping. |
| `(Get-ADForest).GlobalCatalogs` | GCs del forest | Forest queries. |
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | SIDs foreign en local domain | Cross-trust audit. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()` | Forest via .NET | Sin RSAT. |
^ad-trust-discover-forest

```powershell
# Per-domain functional levels (capability matrix)
foreach ($d in (Get-ADForest).Domains) {
  $i = Get-ADDomain -Identity $d
  [PSCustomObject]@{
    Name         = $d
    NetBIOS      = $i.NetBIOSName
    DomainMode   = $i.DomainMode
    ParentDomain = $i.ParentDomain
  }
}
```

___

## Anonymous / Pre-Auth Trust Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "" rootDomainNamingContext` | Forest root identifier | Sin auth. |
| `dig +short SRV _ldap._tcp.dc._msdcs.<foreign-dom>` | DCs del foreign domain via DNS | Pre-auth discovery. |
| `rpcclient -U "" <DC> -N -c 'enumtrust'` | Trusts via null session | Si null permitido. |
| `nltest /server:<foreign-DC> /trusted_domains` | Trusts vistos desde foreign DC | Si reachable. |
^ad-trust-discover-anon

```bash
# Pipeline pre-auth — forest hints
ldapsearch -x -h <DC> -s base -b "" namingContexts rootDomainNamingContext

# DNS hints sobre foreign domains conocidos
for fd in partner.com vendor.local; do
  echo "=== $fd ==="
  dig +short SRV "_ldap._tcp.dc._msdcs.$fd"
done
```

***
