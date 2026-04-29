---
aliases:
  - Trust Enumeration
  - nltest trusts
  - Get-ADTrust
  - LDAP trustedDomain
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
---
# AD - Domain & Forest Trusts - Trust Discovery

***

## Native Windows Tools

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nltest /domain_trusts` | All trusts with flags | Native quick. |
| `nltest /domain_trusts /all_trusts` | Forest-wide enum | Comprehensive. |
| `nltest /domain_trusts /v` | Verbose | Detailed flags. |
| `nltest /trusted_domains` | Direct trusts only | Local domain. |
| `nltest /server:DC /trusted_domains` | Per-server | Cross-target. |
| `nltest /sc_query:<dom>` | Secure channel status | Trust health. |
| `nltest /sc_verify:<dom>` | Trust verify | Adjacent. |
| `nltest /sc_reset:<dom>` | Reset SC (privileged) | Edge. |
| `Get-ADTrust -Filter *` | RSAT detail | Direction + type. |
| `Get-ADTrust -Filter * -Properties *` | All attributes | Complete. |
| `dsquery * -filter "(objectClass=trustedDomain)"` | Legacy | Old. |
| `netdom query trust` | Native | Adjacent. |
| `netdom query domain` | Adjacent | Quick. |
| `Get-ADForest | Select Domains` | Forest list | Forest scope. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest().Domains` | .NET forest | DotNet. |
| `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain().GetAllTrustRelationships()` | .NET trusts | DotNet. |
^ad-trust-discover-native

### nltest comprehensive

```cmd
:: All trusts with verbose flags
nltest /domain_trusts /all_trusts /v

:: Output flags decoded:
:: PRIMARY      -> Trust originates from this domain
:: NATIVE       -> Native mode trust (vs mixed)
:: TREE_ROOT    -> Forest tree root domain
:: WITHIN_FOREST -> Inter-domain (intra-forest)
:: DIRECT_OUTBOUND -> Outbound only
:: DIRECT_INBOUND  -> Inbound only
:: FOREST_TRANSITIVE -> Forest-level transitive
:: CROSS_ORGANIZATION -> Cross-org (with Selective Auth typical)

:: Per-trust secure channel verify
nltest /sc_verify:trustdomain.com
```

```powershell
# RSAT detailed
Get-ADTrust -Filter * -Properties * | 
  Select Name,Source,Target,Direction,TrustType,IsTransitive,SelectiveAuthentication,TGTDelegation,SIDFilteringForestAware,SIDFilteringQuarantined,UplevelOnly
```

___

## LDAP Trust Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -b "CN=System,DC=dom,DC=local" "(objectClass=trustedDomain)"` | Linux LDAP | Direct. |
| `nxc ldap DC -u u -p p --query "(objectClass=trustedDomain)" "*"` | netexec wrapper | Quick. |
| Trust object location | `CN=System,DC=dom,DC=local` | Always. |
| Object class | `trustedDomain` | LDAP class. |
| Object naming | `CN=trustname.com,CN=System,...` | DN pattern. |
| Critical attrs | `trustDirection`, `trustType`, `trustAttributes`, `trustPartner` | Core fields. |
| `trustPartner` attribute | Other domain FQDN | ID. |
| `flatName` attribute | NetBIOS name | Adjacent. |
| `securityIdentifier` (SID) | Foreign domain SID | Cross-domain SID. |
| `trustAuthIncoming` (binary) | Incoming trust password (if access) | Sensitive. |
| `trustAuthOutgoing` (binary) | Outgoing trust password | Sensitive. |
| `whenCreated` / `whenChanged` | Trust lifecycle | Audit. |
| Trust account in `Users` | `<NETBIOS>$` user object | TDO related. |
| Computer-style auth account | `<dom>$@<peer>` | Trust auth principal. |
| Cross-trust references | Adjacent domains | Map. |
| Cross-forest TrustedDomain in Configuration NC | `CN=Cross-Ref,CN=Partitions,CN=Configuration,...` | Forest-level. |
^ad-trust-discover-ldap

### LDAP trust dump

```bash
# Trusts via LDAP (linux)
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=System,DC=dom,DC=local" \
  "(objectClass=trustedDomain)" \
  cn flatName trustPartner trustDirection trustType trustAttributes securityIdentifier whenCreated

# Forest-level cross-references
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=Partitions,CN=Configuration,DC=forest,DC=local" \
  "(objectClass=crossRef)" \
  cn nCName dnsRoot trustParent
```

___

## PowerView / pywerview

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainTrust` | Local trusts | Adversary tool. |
| `Get-DomainTrust -SearchBase "GC://target.local"` | GC-scoped query | Adjacent. |
| `Get-DomainTrustMapping` | Multi-domain crawl | Forest map (slow). |
| `Get-DomainTrustMapping -API` | Use Win32 API | Alt method. |
| `Get-ForestTrust` | Forest-level | Forest-only. |
| `Get-ForestDomain` | All domains in forest | Forest mapping. |
| `Get-ForestGlobalCatalog` | GC list | Adjacent. |
| `Get-DomainSID` | Local domain SID | Cross-trust SID resolution. |
| `Convert-ADName` | Convert formats | Helper. |
| `Get-DomainObject` for trust account | Trust account user object | Detail. |
| pywerview `get-domaintrust` | Linux equivalent | Adjacent. |
| pywerview `get-domaintrust-mapping` | Map | Adjacent. |
| `Get-NetForest` (older PowerView) | Forest object | Legacy. |
| `Find-ForeignUser` | Users in foreign groups | Cross-trust analysis. |
| `Find-ForeignGroup` | Groups containing foreign principals | Adjacent. |
| `Get-DomainGroup -MemberDomain` | Filter by member domain | Cross-trust check. |
^ad-trust-discover-powerview

### PowerView trust mapping

```powershell
# Direct trusts only
Get-DomainTrust

# Walk all reachable trusts (forest map)
Get-DomainTrustMapping

# Forest-level
Get-ForestTrust
Get-ForestDomain

# Find foreign users (e.g., users from other domains in groups here)
Find-ForeignUser
Find-ForeignGroup

# Detailed trust object (LDAP-level)
Get-DomainObject -SearchBase "CN=System,DC=dom,DC=local" -LDAPFilter "(objectClass=trustedDomain)" -Properties *
```

___

## BloodHound Trust Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `TrustedBy` | Inverse of trust direction | Forest map edge. |
| `Domain → Domain` (Trusts) | Outbound trust | Standard. |
| Trust types in BH | External, Forest, ParentChild, TreeRoot, CrossLink, Unknown | Built-in. |
| Trust direction (Inbound/Outbound/Bidirectional) | Edge property | Standard. |
| Pre-2024 BloodHound CE limitation | Post-trust edge processing manual | Older. |
| BHCE 6.x trust edges | Improved automation | Modern. |
| `MATCH (a:Domain)-[r:Trusts]->(b:Domain)` | Cypher query | Standard. |
| Custom Cypher: paths via trust | `MATCH p=shortestPath(...)` cross-trust | Advanced. |
| ForeignGroupMembership (cross-trust group) | Edge | Standard. |
| TrustedToAuth (trust delegation) | TGT delegation enabled | Edge. |
| BloodHound trust collection | `-c Trusts` | Targeted. |
| BloodHound forest-aware queries | Cross-forest enumeration | Modern. |
| Visual: trust graph | Tier-based visualization | Helpful. |
| Pre-trust SID extraction | Required for ACL paths | Process. |
| Manual GPO collection per domain | Cross-domain ingest | Workflow. |
| Bidirectional path | Forest-wide reachability | Use case. |
^ad-trust-discover-bh

### BloodHound trust queries

```cypher
// All trust relationships
MATCH p=(a:Domain)-[r:Trusts]->(b:Domain)
RETURN p

// Find foreign group members (cross-trust)
MATCH p=(u:User)-[:MemberOf]->(g:Group)
WHERE u.domain <> g.domain
RETURN u.name,g.name

// Path from foreign user to local DA
MATCH (foreign:User)
WHERE foreign.domain = "OTHER-DOM"
MATCH (da:Group {name:"DOMAIN ADMINS@LOCAL-DOM"})
MATCH p=shortestPath((foreign)-[*1..]->(da))
RETURN p

// Trust attacks possible (transitive)
MATCH p=(:Domain)-[r:Trusts]->(:Domain)
WHERE r.istransitive = true
RETURN p
```

___

## Cross-Forest / Forest Discovery

| **Concepto** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Forest root domain | First domain created in forest | Top tier. |
| Tree root domains | Top of each tree (multiple trees) | Standard. |
| `Get-ADForest -Identity <forest>` | Forest object | RSAT. |
| `Get-ADForest -Current LocalComputer` | Current forest | RSAT. |
| `[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()` | .NET | Adjacent. |
| Trees in forest | `Get-ADForest \| Select Domains` | List. |
| Cross-forest trust | External or Forest type | Specific. |
| Inter-forest two-way | Bidirectional cross-forest | Standard. |
| One-way external (legacy) | Pre-2003 cross-forest | Legacy. |
| Forest-wide auth (default) | All users from foreign forest can auth | Permissive. |
| Selective Auth | Only Allowed-To-Authenticate principals | Hardening. |
| Per-forest Schema Master | Forest-level FSMO | Tier 0. |
| Forest functional level | Determines features | Capability. |
| GC required for forest queries | Adjacent | Forest-aware. |
| Cross-forest queries via referrals | LDAP referral chasing | Standard. |
| Foreign Security Principals container | `CN=ForeignSecurityPrincipals,DC=...` | SIDs from foreign domains. |
^ad-trust-discover-forest

### Forest discovery

```powershell
# Current forest info
Get-ADForest -Current LocalComputer | Select Name,RootDomain,Domains,GlobalCatalogs

# All domains in forest
Get-ADForest -Current LocalComputer | Select -ExpandProperty Domains

# Per-domain functional level
foreach ($d in (Get-ADForest -Current LocalComputer).Domains) {
  $domInfo = Get-ADDomain -Identity $d
  [PSCustomObject]@{
    Name = $d
    NetBIOSName = $domInfo.NetBIOSName
    DomainMode = $domInfo.DomainMode
    ParentDomain = $domInfo.ParentDomain
  }
}

# Foreign Security Principals (cross-trust SIDs in local domain)
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  Select Name,DistinguishedName
```

___

## Anonymous / Pre-Auth Trust Discovery

| **Vector** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| LDAP RootDSE (anonymous) | `ldapsearch -x -h DC -s base namingcontexts` | Sometimes shows trust partitions. |
| Forest naming context | `rootDomainNamingContext` | Forest root identifier. |
| Cross-references in Configuration NC | `CN=Partitions` | Forest map (auth typically required). |
| DNS-based trust hints | Foreign domain SRV records | Indirect. |
| Public DNS for `_msdcs.<foreign>` | Foreign domain discovery | OSINT. |
| Conditional forwarders | Trust DNS hints | Indirect. |
| GC enumeration | Forest-wide via single query | Adjacent. |
| `nltest /trusted_domains` from non-domain host | Edge | Limited. |
| RPC enum trust list (legacy) | rpcclient enumtrust | Anonymous if allowed. |
| Hostname patterns (cross-domain) | `vendor.partner.com` | OSINT. |
| Email domain hints | `user@vendor.com` MX record | OSINT. |
| Public DNS NS records | Cross-org DNS hosting | OSINT. |
| Wayback / cert transparency | Historical trust hints | OSINT. |
| Internal share names with foreign domains | `\\foreigndomain\share` | Indirect. |
| Cross-forest GC query | Adjacent | Adjacent. |
| `nltest /server:foreign-DC /trusted_domains` | If reachable | Cross-target. |
^ad-trust-discover-anon

### Anonymous trust hints

```bash
# Anonymous LDAP namingContexts
ldapsearch -x -h DC -s base -b "" namingContexts

# Forest hint via rootDomainNamingContext
ldapsearch -x -h DC -s base -b "" rootDomainNamingContext

# DNS-based cross-domain hints
dig +short SRV _ldap._tcp.dc._msdcs.partner.com
dig +short MX dom.local

# Conditional forwarders revealed via DNS query (if anonymous DNS access)
dig +trace partner.com @DC
```

***
