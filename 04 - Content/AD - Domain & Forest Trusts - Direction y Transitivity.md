---
aliases:
  - Trust Direction
  - Transitive Trust
  - One-Way Trust
  - Two-Way Trust
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
# AD - Domain & Forest Trusts - Direction & Transitivity

***

## Trust Direction Decoded

| **Direction Value** | **Meaning** | **Notas** |
|:---:|:---:|:---:|
| 0 | Disabled | Edge — should not exist. |
| 1 | Inbound (incoming) | Trusting domain accepts auth from trusted domain. |
| 2 | Outbound (outgoing) | Trusting domain trusts another. |
| 3 | Bidirectional (two-way) | Both 1+2 combined. |
| `trustDirection` LDAP attribute | 0/1/2/3 | Standard. |
| `Get-ADTrust -Property Direction` | `BiDirectional`/`Inbound`/`Outbound`/`Disabled` | RSAT decoded. |
| Inbound = "they trust us" | Foreign accepts our credentials | Outbound from our perspective seen from foreign. |
| Outbound = "we trust them" | We accept foreign credentials | Inbound from foreign perspective. |
| Bidirectional = both | Most common | Default for parent-child / forest. |
| Direction asymmetric examples | One-way external | Common legacy. |
| Modern forest trust default | Two-way | Standard. |
| External trust default | One-way (incoming) | Common. |
| Realm trust direction | Configurable | Edge. |
| Cross-org trust | Often one-way | Vendor scenarios. |
| Bidirectional vs two one-way | Almost equivalent | Standard. |
| Directional impact for attacks | One-way limits attack vectors | Strategy. |
^ad-direction-decoded

### Direction interpretation

```powershell
# RSAT decoded direction
Get-ADTrust -Filter * | Select Name,Direction,Source,Target

# LDAP raw
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=System,DC=dom,DC=local" \
  "(objectClass=trustedDomain)" \
  trustPartner trustDirection

# trustDirection: 1 = Inbound (we accept from them)
#                 2 = Outbound (we trust them)
#                 3 = Bidirectional
```

```bash
# nltest output flags
nltest /domain_trusts /v

# Look for:
# DIRECT_OUTBOUND  -> we trust them (we issue tickets)
# DIRECT_INBOUND   -> they trust us
# Both flags = bidirectional
```

___

## Transitivity Concept

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Transitive trust | A trusts B, B trusts C → A trusts C | Cascades. |
| Non-transitive trust | A trusts B, B trusts C → A does NOT trust C | Isolated. |
| `IsTransitive` property | True/False | RSAT. |
| `trustAttributes & 0x1` (NON_TRANSITIVE) | Non-transitive flag | LDAP. |
| `trustAttributes & 0x8` (FOREST_TRANSITIVE) | Forest-level transitivity | Specific. |
| Default intra-forest | Transitive | Standard. |
| Default external trust | Non-transitive | Edge. |
| Default forest trust | Transitive within forest scope | Standard. |
| Realm trust transitivity | Configurable | Edge. |
| Shortcut trust | Transitive (improves auth path) | Standard. |
| Transitivity + direction interplay | Multiple combinations | Complex. |
| Walking trust graph | Transitivity allows multi-hop | Recon scope. |
| Foreign forest cascade | Forest A → Forest B → Forest C with transitive | Multi-hop attacks. |
| Trust loops impossible (auto-detect) | Cycle detection | Edge. |
| Path-of-Trust (BloodHound) | Visual transitive paths | Tool. |
| Schema Master cross-forest | Transitive scope | Forest. |
^ad-direction-transitive

### Transitivity interpretation

```powershell
# Trusts categorized by transitivity
Get-ADTrust -Filter * | 
  Select Name,Direction,IsTransitive,ForestTransitive

# Transitive trusts only
Get-ADTrust -Filter {IsTransitive -eq $true}

# Non-transitive (potentially less risky externally)
Get-ADTrust -Filter {IsTransitive -eq $false}
```

```bash
# nltest output transitivity hint
nltest /domain_trusts /v
# FOREST_TRANSITIVE flag = transitive forest trust
# Absence = non-transitive
```

___

## Direction × Transitivity Matrix

| **Trust Type** | **Default Direction** | **Default Transitive** | **Notas** |
|:---:|:---:|:---:|:---:|
| Parent-Child | Bidirectional | Yes | Auto-created. |
| Tree-Root | Bidirectional | Yes | Auto-created. |
| Shortcut (intra-forest) | Bidirectional or one-way | Yes | Manual. |
| External | Often One-way | No | Legacy/manual. |
| Forest | Bidirectional or one-way | Yes (within forest scope) | Modern. |
| Realm | Configurable | Configurable | Edge. |
| Most secure: One-way + non-transitive | External | Limited blast | Defense. |
| Least secure: Two-way + transitive | Forest | Wide blast | Convenience. |
| Direction affects authentication path | One-way blocks reverse | Standard. |
| Transitivity affects multi-hop | Cascade or isolated | Standard. |
| Can be modified post-creation | Some properties yes | Edge. |
| Trust break = full re-establishment | After modification | Operational. |
| Best practice: Selective Auth + non-transitive | High-risk trusts | Hardening. |
| Best practice: minimum-privilege trust | Need-to-know basis | Hardening. |
| Detection: trust modification events | Defender SIEM | Adjacent. |
| Audit: periodic trust review | Compliance | Adjacent. |
^ad-direction-matrix

### Trust matrix audit

```powershell
# Categorize all trusts
Get-ADTrust -Filter * | ForEach-Object {
  [PSCustomObject]@{
    Trust = $_.Name
    Source = $_.Source
    Target = $_.Target
    Direction = $_.Direction
    Type = $_.TrustType
    Transitive = $_.IsTransitive
    ForestTransitive = $_.ForestTransitive
    Risk = if ($_.Direction -eq "BiDirectional" -and $_.IsTransitive) {"High"} 
           elseif ($_.IsTransitive) {"Medium"} 
           else {"Low"}
  }
} | Sort Risk -Descending
```

___

## Direction Impact on Attacks

| **Scenario** | **Direction Required** | **Attack** |
|:---:|:---:|:---:|
| Attack from local → foreign | Outbound from local | Standard. |
| Attack from foreign → local | Inbound from local (= outbound from foreign) | Standard. |
| Cross-forest privesc | Bidirectional or specific | Standard. |
| Forest trust abuse (SID History) | Outbound from victim domain | Standard. |
| Forest takeover via krbtgt of forest root | Bidirectional convenience | Path. |
| Selective Auth bypass | Direction agnostic | Different defense. |
| Cross-trust Kerberoast | Outbound from attacker side | Auth path. |
| Cross-trust ASREP roast | Outbound from attacker side | Same. |
| Cross-trust ACL chains | Direction dependent | Path. |
| ForeignSecurityPrincipal abuse | Outbound (to foreign forest) | Cross-trust. |
| Trust account hash crack | DCSync local → forge cross-trust TGT | Direction limit. |
| Inter-realm TGT delegation | Direction dependent | Edge. |
| External one-way limits attacker | Defender preferred | Defense. |
| Two-way default = both directions exploitable | Convenience trade-off | Standard. |
| Modern: TGT delegation disabled (post-2019) | Reduced attack surface | Defense. |
| BloodHound trust paths | Direction-aware queries | Tool. |
^ad-direction-attacks

### Direction-aware attack planning

```cypher
// BloodHound: cross-trust paths from current domain to foreign
MATCH (u:User {owned: true})
MATCH (a:Domain)-[r:Trusts]->(b:Domain)
WHERE u.domain = a.name
MATCH p=shortestPath((u)-[*1..]->(da:Group))
WHERE da.name CONTAINS "DOMAIN ADMINS" AND da.domain = b.name
RETURN p

// Identify domains we can attack via trusts
MATCH (a:Domain {name: "OURDOMAIN"})-[r:Trusts]->(b:Domain)
WHERE r.direction IN ["Outbound", "BiDirectional"]
RETURN b.name AS AttackableDomain
```

___

## Selective Authentication

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default forest auth | All users from foreign forest can auth | Permissive. |
| Selective Auth | Only `Allowed-To-Authenticate` ACE recipients | Hardening. |
| Per-resource ACE | Granular control | Standard. |
| `Allowed-To-Authenticate` extended right | Extended right type | LDAP. |
| Default deny-by-default | When Selective Auth enabled | Whitelist. |
| Group-based | Add group to ACE on resource | Standard. |
| Per-server | Each server explicit | Granular. |
| Admin overhead | Common — disabled in practice | Operational. |
| `quarantineDomain` flag | Adjacent — SID filtering | Different. |
| Bypass: misconfigured ACE | Authenticated Users on important resource | Common. |
| Bypass: nested groups | Group A in ACE → User X in Group A | Standard. |
| Bypass: trust account on resource | Trust account in groups | Edge. |
| Bypass: pre-existing tickets | Already-cached auth | Edge. |
| Detection: Event 4625 (logon failure) | Selective Auth blocks | Defender. |
| Detection: Event 5140 (network share access) | Selective Auth context | Defender. |
| Combine with SID filtering | Defense in depth | Hardening. |
| Trust direction × Selective Auth | Per-trust setting | Standard. |
^ad-direction-selective

### Test Selective Auth

```cmd
:: Trust property check
nltest /domain_trusts /v | findstr /i "selective"

:: Cross-trust auth attempt
runas /user:foreign\user cmd
:: If Selective Auth enabled and user not allowed → fail

:: Identify principals allowed cross-trust
Get-ADTrust -Filter * | Where {$_.SelectiveAuthentication -eq $true}
```

```powershell
# Resources allowing cross-trust auth
$trust = "partner.com"
Get-ADComputer -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $acl.Access | Where {
    $_.ActiveDirectoryRights -match "ExtendedRight" -and
    $_.IdentityReference -like "*$trust*"
  } | Select @{n='Computer';e={$_.Name}},IdentityReference
}
```

___

## TGT Delegation Across Trusts

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| TGT Delegation enabled | Default within forest | Standard. |
| TGT Delegation cross-forest | Disabled by default post-2019 (CVE-2019-1040) | Modern default. |
| `TRUST_ATTRIBUTE_CROSS_ORGANIZATION_NO_TGT_DELEGATION` | 0x200 flag | LDAP. |
| Re-enable cross-forest TGT delegation | `Set-ADTrust -EnableTGTDelegation` | Edge. |
| Why disabled? | Unconstrained delegation cross-forest | Risk. |
| Cross-forest unconstrained delegation | Capture foreign TGTs | Critical. |
| Modern: blocked by default | Post-2019 patch | Defense. |
| Legacy: blocking after audit period | Compatibility | Edge. |
| Detection: TGT delegation events | Defender SIEM | Adjacent. |
| Cross-forest constrained delegation | Less impacted | Different. |
| Cross-forest RBCD | Restricted post-2019 | Adjacent. |
| Re-enabling = high risk | Audit before | Compliance. |
| Trust account TGT signing | Inter-realm TGT | Different from delegation. |
| Cross-org TGT delegation flag | Configurable | Edge. |
| Audit `EnableTGTDelegation` | Defender | Standard check. |
| Microsoft KB on TGT delegation | KB4490425 | Reference. |
^ad-direction-tgtdelegation

### TGT delegation status check

```powershell
# Per-trust TGT delegation status
Get-ADTrust -Filter * -Properties msDS-IngressClaimsTransformationPolicy,msDS-EgressClaimsTransformationPolicy,msDS-TrustForestTrustInfo |
  Select Name,@{n='TGTDelegation';e={
    if ($_.trustAttributes -band 0x200) {"Disabled (default)"}
    elseif ($_.trustAttributes -band 0x800) {"Enabled (legacy)"}
    else {"Default behavior"}
  }}

# Trusts with TGT delegation re-enabled (risky)
Get-ADTrust -Filter * -Properties trustAttributes |
  Where {$_.trustAttributes -band 0x800} |
  Select Name,Source,Target
```

***
