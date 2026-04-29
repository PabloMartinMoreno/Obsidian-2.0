---
aliases:
  - Privileged gMSA
  - gMSA in DA
  - Kerberoastable gMSA
  - High-Value MSAs
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
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - Privileged gMSA Identification

***

## gMSA in Privileged Groups

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| gMSA in Domain Admins | Direct privesc | Critical. |
| gMSA in Enterprise Admins | Forest-wide privesc | Critical. |
| gMSA in Schema Admins | Schema modification | Critical. |
| gMSA in Built-in Administrators | Per-host admin | Critical. |
| gMSA in Backup Operators | NTDS dump path | Critical. |
| gMSA in Server Operators | DC privesc | Critical. |
| gMSA in Account Operators | Tier 1 privesc | High. |
| gMSA in Print Operators | Legacy RCE | Critical (legacy). |
| gMSA in DnsAdmins | Legacy CVE-2017 | Critical (legacy). |
| gMSA in GPO Creator Owners | GPO Abuse | High. |
| gMSA in Cert Publishers | ADCS adjacent | Adjacent. |
| gMSA in Exchange Trusted Subsystem | Pre-2019 DCSync | Critical (legacy). |
| gMSA in custom privileged group | Per-org | Audit. |
| Recursive group membership | Hidden privilege | Standard. |
| Cross-correlate adminCount=1 | Standard marker | Audit. |
| Detection: gMSA in priv group event | Defender | Adjacent. |
^ad-gmsapriv-groups

### Privileged gMSA audit

```powershell
# All gMSAs + their privileged group memberships (recursive)
Get-ADServiceAccount -Filter * -Properties MemberOf,AdminCount |
  ForEach-Object {
    $gmsa = $_
    
    # Direct privileged groups
    $directPriv = $gmsa.MemberOf | ForEach-Object {
      $g = Get-ADGroup $_ -Properties AdminCount -ErrorAction SilentlyContinue
      if ($g.AdminCount -eq 1) { $g.Name }
    }
    
    # Recursive (transitive) priv via tokenGroups computed
    if ($directPriv -or $gmsa.AdminCount -eq 1) {
      [PSCustomObject]@{
        gMSA = $gmsa.SamAccountName
        AdminCount = $gmsa.AdminCount
        DirectPrivGroups = $directPriv -join '; '
        UAC = $gmsa.UserAccountControl
      }
    }
  }
```

___

## Kerberoastable gMSAs

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| gMSA with SPN | Kerberoast target | Standard. |
| `servicePrincipalName=*` filter | All SPN-bound | Standard. |
| Default gMSAs SPN-bound | Common | Standard. |
| Crack TGS hash offline | Standard | Adjacent. |
| Modern: AES preferred | RC4 weakest | Hardening. |
| AES-256 strong (default 32+ chars) | Crack infeasible | Standard. |
| RC4 fallback | Edge weakness | Edge. |
| `nxc ldap DC --kerberoasting` | Bulk dump | Standard. |
| Filter for gMSA + SPN | Custom query | Standard. |
| Cross-correlate priv | gMSA priv + Kerberoast = ATO | Critical. |
| Per-gMSA crack effort | Long passwords | Standard. |
| Default gMSA password 240+ chars | Effectively uncrackable | Hardening. |
| Force RC4 only via `msDS-SupportedEncryptionTypes` | Edge misconfig | Edge. |
| Detection: bulk TGS requests | Defender | Adjacent. |
| OPSEC: targeted Kerberoast | Stealthier | OPSEC. |
| Adjacent: Kerberoasting hub | Cross-ref | Adjacent. |
^ad-gmsapriv-kerberoast

### Kerberoastable gMSA discovery

```bash
# All SPN-bound gMSAs (Kerberoast targets)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectClass=msDS-GroupManagedServiceAccount)(servicePrincipalName=*))" \
  cn samAccountName servicePrincipalName

# netexec
nxc ldap DC -u user -p pass --kerberoasting kerb.txt | grep "msDS-GroupManagedServiceAccount"

# Get TGS for specific gMSA (Kerberoast)
impacket-GetUserSPNs -request -outputfile gmsa_kerb.txt 'dom/user:pass'
```

```powershell
# RSAT
Get-ADServiceAccount -Filter {ServicePrincipalNames -like "*"} -Properties ServicePrincipalNames |
  Select Name,SamAccountName,@{n='SPNs';e={$_.ServicePrincipalNames -join '; '}}
```

___

## gMSA with Delegation Flags

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `TRUSTED_FOR_DELEGATION` UAC | Unconstrained delegation | Critical. |
| `msDS-AllowedToDelegateTo` | Constrained delegation | Privileged. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD | Privileged. |
| `TRUSTED_TO_AUTH_FOR_DELEGATION` UAC | Constrained w/protocol transition | Critical. |
| gMSA with UD flag | Critical compromise target | Critical. |
| Compromise gMSA host → capture TGTs | Standard | Standard. |
| gMSA with constrained delegation | Service impersonation | Privileged. |
| gMSA with RBCD configured (rare) | Edge | Edge. |
| Cross-correlate UD + DA login | Direct DA capture path | Critical. |
| `Account is sensitive and cannot be delegated` | Hardening | Defense. |
| Detection: delegation flag changes | Defender | Adjacent. |
| BloodHound delegation edges for gMSA | Modern | Tool. |
| Audit: gMSA delegation justification | Compliance | Standard. |
| Modern: protocol transition discouraged | Hardening | Standard. |
| Cross-tier delegation = critical risk | Strategy | Audit. |
| Adjacent: Delegation Abuse hub | Cross-ref | Adjacent. |
^ad-gmsapriv-delegation

### gMSA delegation audit

```powershell
# Unconstrained delegation gMSAs (CRITICAL)
Get-ADServiceAccount -Filter {TrustedForDelegation -eq $true} `
  -Properties TrustedForDelegation,UserAccountControl |
  Select Name,SamAccountName,UserAccountControl

# Constrained delegation gMSAs
Get-ADServiceAccount -Filter {msDS-AllowedToDelegateTo -like "*"} `
  -Properties msDS-AllowedToDelegateTo,UserAccountControl |
  Select Name,SamAccountName,
    @{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}},
    UserAccountControl

# Cross-correlate priv + delegation (CRITICAL)
Get-ADServiceAccount -Filter * -Properties MemberOf,TrustedForDelegation |
  Where {
    $_.TrustedForDelegation -and
    ($_.MemberOf -match "Domain Admins|Enterprise Admins")
  }
```

___

## gMSA Password Read Cross-Correlation

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Privileged gMSA + broad readers | Critical | Critical. |
| Helpdesk reads Tier 0 gMSA | Cross-tier | Critical. |
| Service accounts as readers | Common | Audit. |
| Foreign principals reading priv gMSA | Cross-trust | Critical. |
| Authenticated Users in reader chain | Critical misconfig | Critical. |
| Domain Computers as readers | All hosts | Audit. |
| BackupOperators reading gMSA in DA | Tier conflation | Critical. |
| Cross-OU reader inheritance | Indirect | Audit. |
| Stale group readers | Old delegations | Audit. |
| Per-host computer reading gMSA | Standard | Standard. |
| Atacante in reader group → password | Direct cred | Standard. |
| BloodHound `ReadGMSAPassword` paths to priv | Strategy | Tool. |
| Detection: cross-tier reads | Defender ML | Modern. |
| Audit: minimal priv gMSA readers | Best practice | Standard. |
| Compliance: documented reader baseline | Standard | Standard. |
| Modern: per-tier reader segregation | Hardening | Standard. |
^ad-gmsapriv-correlate

### Critical: priv gMSA + broad readers

```powershell
# gMSAs in privileged groups + their password readers
$privGmsas = Get-ADServiceAccount -Filter * `
  -Properties MemberOf,PrincipalsAllowedToRetrieveManagedPassword |
  Where {
    $_.MemberOf -match "Domain Admins|Enterprise Admins|Backup Operators|Server Operators"
  }

foreach ($gmsa in $privGmsas) {
  $readers = $gmsa.PrincipalsAllowedToRetrieveManagedPassword
  
  # Recursive expand readers
  $effectiveReaders = @{}
  foreach ($principal in $readers) {
    try {
      $obj = Get-ADObject -Identity $principal -Properties ObjectClass -ErrorAction SilentlyContinue
      if ($obj.ObjectClass -eq "group") {
        Get-ADGroupMember $obj -Recursive | ForEach-Object {
          $effectiveReaders[$_.SamAccountName] = $_
        }
      } else {
        $effectiveReaders[$obj.Name] = $obj
      }
    } catch {}
  }
  
  Write-Host "`n=== $($gmsa.SamAccountName) (Privileged) ==="
  Write-Host "  In groups: $($gmsa.MemberOf -replace 'CN=([^,]+).*','$1' -join ', ')"
  Write-Host "  Effective readers (recursive):"
  $effectiveReaders.Values | Select Name,SamAccountName,ObjectClass | Format-Table
}
```

___

## gMSA Naming Patterns

| **Pattern** | **Indicator** | **Notas** |
|:---:|:---:|:---:|
| `gMSA-*` prefix | Common | Standard. |
| `*-gMSA` suffix | Common | Standard. |
| `svc-*` prefix | Service-style | Common. |
| `*$` suffix (mandatory) | All gMSAs | Standard. |
| `MSA-*` prefix | Common variant | Edge. |
| Named after service: `gMSA-sql$`, `gMSA-iis$` | Standard | Common. |
| Named after host: `gMSA-srv01$` | Edge | Edge. |
| Named after team: `gMSA-dba$` | Common | Common. |
| Description hints function | Free-text | OSINT. |
| Cross-correlate with SPN | Service identification | Standard. |
| Tier prefix: `Tier0-gMSA-*` | Tiered model | Standard. |
| Environment prefix: `prod-gMSA-*` | Per-env | Common. |
| Cross-correlate with hosts | Per-host pattern | Standard. |
| Atacante: pattern recognition for priv | Strategy | Adjacent. |
| Stale naming (legacy migration) | Audit | Standard. |
| Custom naming convention | Per-org | Edge. |
^ad-gmsapriv-naming

### gMSA pattern analysis

```powershell
# Naming pattern analysis
Get-ADServiceAccount -Filter * -Properties Description |
  Group-Object {
    if ($_.SamAccountName -match "^gMSA-(\w+)") { $Matches[1] }
    elseif ($_.SamAccountName -match "^svc-(\w+)") { $Matches[1] }
    else { "OTHER" }
  } |
  Sort Count -Descending |
  Select Count,Name
```

___

## High-Value gMSA Targets Summary

| **Target Type** | **Identifier** | **Priority** |
|:---:|:---:|:---:|
| gMSA in DA | MemberOf check | Critical. |
| gMSA in EA | MemberOf check (forest root) | Critical. |
| gMSA with UD flag | TRUSTED_FOR_DELEGATION | Critical. |
| gMSA with constrained delegation | msDS-AllowedToDelegateTo | High. |
| gMSA with RBCD | Adjacent | High. |
| gMSA + SPN (Kerberoastable) | servicePrincipalName | Medium-High. |
| gMSA in Backup Operators | DC privesc path | Critical. |
| gMSA in Server Operators | DC privesc path | Critical. |
| gMSA on Tier 0 host | HostComputers in DC OU | Critical. |
| gMSA reading other priv gMSAs | Cascading | Edge. |
| gMSA + Authenticated Users readers | Direct vuln | Critical. |
| Cross-trust gMSA in priv | Cross-forest | Critical. |
| gMSA with adminCount=1 | Tier 0 marker | High. |
| gMSA in custom Tier 0 group | Per-org | Audit. |
| Stale priv gMSA | Old delegation | Audit. |
| BloodHound critical paths via gMSA | Modern visualization | Tool. |
^ad-gmsapriv-summary

### Comprehensive priv gMSA report

```powershell
# All-in-one priv gMSA report
Get-ADServiceAccount -Filter * -Properties * | ForEach-Object {
  $gmsa = $_
  
  $flags = @()
  if ($gmsa.AdminCount -eq 1) { $flags += "adminCount=1" }
  if ($gmsa.TrustedForDelegation) { $flags += "UD" }
  if ($gmsa.'msDS-AllowedToDelegateTo') { $flags += "CD" }
  if ($gmsa.MemberOf -match "Domain Admins") { $flags += "DA" }
  if ($gmsa.MemberOf -match "Enterprise Admins") { $flags += "EA" }
  if ($gmsa.MemberOf -match "Backup Operators") { $flags += "BackupOp" }
  if ($gmsa.MemberOf -match "Server Operators") { $flags += "ServerOp" }
  if ($gmsa.ServicePrincipalNames) { $flags += "SPN" }
  
  if ($flags) {
    [PSCustomObject]@{
      gMSA = $gmsa.SamAccountName
      Flags = $flags -join ', '
      Hosts = $gmsa.HostComputers -join '; '
      Readers = $gmsa.PrincipalsAllowedToRetrieveManagedPassword -join '; '
      SPNs = $gmsa.ServicePrincipalNames -join '; '
    }
  }
} | Format-Table -AutoSize
```

***
