---
aliases:
  - Cross-Forest Delegation
  - TGT Delegation Trust
  - CVE-2019-1040
  - Inter-Forest Delegation
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
  - "[[AD - Delegation Enumeration]]"
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Delegation Enumeration - Cross-Trust Delegation

***

## TGT Delegation Across Trusts

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| TGT Delegation Within Forest | Default enabled | Standard. |
| TGT Delegation Cross-Forest | Disabled by default post-2019 | Modern hardening. |
| `TRUST_ATTRIBUTE_CROSS_ORGANIZATION_NO_TGT_DELEGATION` (0x200) | Disabled flag | LDAP. |
| `TRUST_ATTRIBUTE_CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION` (0x800) | Re-enabled flag | LDAP. |
| Modern Microsoft default | Disabled | Hardening. |
| Re-enable cross-forest TGT delegation | `Set-ADTrust -EnableTGTDelegation` | Privileged. |
| Why disabled? | Unconstrained delegation cross-forest | Critical risk. |
| Cross-forest UD = capture foreign TGTs | Standard chain | Critical. |
| KB4490425 patch | Microsoft | Reference. |
| CVE-2019-1040 NetLogon | Adjacent | Adjacent. |
| Detection: TGT delegation cross-forest | Defender | Adjacent. |
| Modern: extreme audit cross-trust | Best practice | Standard. |
| Compliance: documented cross-trust delegation | Standard | Adjacent. |
| Cleanup: revert TGT delegation | Standard | OPSEC. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Modern: SID Filtering + TGT delegation off | Hardening | Standard. |
^ad-crosstrust-tgt

### TGT delegation status check

```powershell
# Cross-forest trusts with TGT delegation status
Get-ADTrust -Filter * -Properties trustAttributes | ForEach-Object {
  $tgtDelegation = if (($_.trustAttributes -band 0x200) -ne 0) {"Disabled (default modern)"}
                    elseif (($_.trustAttributes -band 0x800) -ne 0) {"Enabled (legacy/risky)"}
                    else {"Default behavior"}
  
  [PSCustomObject]@{
    Trust = $_.Name
    Direction = $_.Direction
    Type = $_.TrustType
    TGTDelegation = $tgtDelegation
  }
}
```

___

## Cross-Domain (Intra-Forest) Delegation

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Intra-forest = same forest, different domain | Standard | Standard. |
| TGT delegation enabled by default | Forest-wide | Standard. |
| UD across domains in forest | Standard | Standard. |
| CD across domains in forest | Standard | Standard. |
| RBCD cross-domain | Edge | Edge. |
| SID Filtering disabled intra-forest | Default | Standard. |
| Cross-domain compromise via delegation | Standard chain | Standard. |
| Forest takeover via parent-child trust | Adjacent | Adjacent. |
| Detection: cross-domain delegation events | Defender | Adjacent. |
| Modern: minimize cross-domain delegation | Best practice | Standard. |
| Adjacent: Trust Abuse hub | Cross-ref | Adjacent. |
| Compliance: per-cross-domain audit | Standard | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| BloodHound cross-domain delegation paths | Modern | Tool. |
| Cypher: cross-domain queries | Custom | Tool. |
| Audit baseline | Standard | Compliance. |
^ad-crosstrust-intraforest

### Intra-forest delegation audit

```powershell
$forest = Get-ADForest

foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  
  # UD computers per domain
  Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
    -Server $d -Properties TrustedForDelegation |
    Select Name,@{n='Domain';e={$d}}
  
  # CD per domain
  Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} -Server $d `
    -Properties msDS-AllowedToDelegateTo |
    Select Name,@{n='Domain';e={$d}},@{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}
}
```

___

## Inter-Forest (Cross-Forest) Delegation

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Inter-forest = different forests | Edge | Adjacent. |
| TGT delegation cross-forest disabled default | Modern | Standard. |
| CD cross-forest limited | Modern | Adjacent. |
| RBCD cross-forest limited | Modern | Adjacent. |
| SID Filtering enabled by default | Cross-forest | Hardening. |
| Pre-2019 patches: cross-forest UD critical | Patched | Adjacent. |
| Modern: post-2019 patches limit | Standard | Adjacent. |
| Adjacent: KB4490425 | Reference | Adjacent. |
| Adjacent: CVE-2019-1040 | Adjacent | Adjacent. |
| Detection: cross-forest delegation | Defender | Adjacent. |
| Modern: extreme audit cross-forest | Best practice | Standard. |
| Audit: per-trust delegation | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| BloodHound inter-forest paths | Modern | Tool. |
| Cypher: cross-forest queries | Custom | Tool. |
^ad-crosstrust-interforest

### Inter-forest delegation audit

```powershell
# Cross-forest trusts
$forestTrusts = Get-ADTrust -Filter {ForestTransitive -eq $true}

foreach ($t in $forestTrusts) {
  Write-Host "`n=== Forest trust: $($t.Target) ==="
  Write-Host "Direction: $($t.Direction)"
  Write-Host "SID Filtering: $($t.SIDFilteringForestAware)"
  Write-Host "Quarantined: $($t.SIDFilteringQuarantined)"
  
  $tgtFlag = if (($t.trustAttributes -band 0x200) -ne 0) {"DISABLED (default)"}
              elseif (($t.trustAttributes -band 0x800) -ne 0) {"ENABLED (RISKY)"}
              else {"DEFAULT"}
  Write-Host "TGT Delegation: $tgtFlag"
}
```

___

## Foreign Principal as Delegation Source

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Foreign principal in CD `msDS-AllowedToDelegateTo` | Cross-trust | Critical. |
| Foreign principal in RBCD `msDS-AllowedToActOnBehalfOfOtherIdentity` | Cross-trust | Critical. |
| FSP referenced in delegation | Cross-trust | Critical. |
| Modern Microsoft post-2019 limits | Standard | Adjacent. |
| Detection: cross-trust delegation grants | Defender | Adjacent. |
| BloodHound foreign delegation edges | Modern | Tool. |
| Audit: foreign principals in delegation | Standard | Compliance. |
| Stale cross-trust delegation | Old | Audit. |
| Cleanup post-engagement | Standard | OPSEC. |
| Compliance: documented cross-trust | Standard | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
| Cross-correlate FSP container | Standard | Audit. |
| Cross-correlate trust attributes | Standard | Audit. |
| Cypher: foreign delegation queries | Custom | Tool. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Modern: post-2019 patches | Standard | Adjacent. |
^ad-crosstrust-foreign

### Foreign delegation audit

```powershell
$localDomain = (Get-ADDomain).Name

# Foreign principals in CD
Get-ADComputer -Filter * -Properties msDS-AllowedToDelegateTo |
  Where {$_.'msDS-AllowedToDelegateTo'} |
  ForEach-Object {
    foreach ($spn in $_.'msDS-AllowedToDelegateTo') {
      if ($spn -notmatch ".*\.$localDomain\." -and $spn -notmatch "^[^/]+/[^.]+$") {
        [PSCustomObject]@{
          Source = $_.Name
          ForeignTarget = $spn
        }
      }
    }
  }
```

___

## Modern Patches Impact

| **Patch** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| KB4490425 (March 2019) | Cross-forest TGT delegation disabled default | Modern. |
| CVE-2019-1040 NetLogon | Adjacent NTLM hardening | Adjacent. |
| CVE-2020-1472 Zerologon | Adjacent NetLogon | Adjacent. |
| CVE-2021-42278/9 sAMAccountName Spoofing | Adjacent | Adjacent. |
| CVE-2022-26923 ADCS | Adjacent | Adjacent. |
| Modern Server 2019+ | Hardened defaults | Standard. |
| RFC 9207 Authorization Server Issuer Identification | OAuth adjacent | Adjacent. |
| Audit: patch status | Standard | Compliance. |
| Cross-correlate with delegation | Standard | Audit. |
| Modern: continuous patch monitoring | Defender | Standard. |
| BloodHound CE 6.x patch awareness | Modern | Tool. |
| Compliance: documented patch baseline | Standard | Adjacent. |
| Detection: pre-patch delegation patterns | Defender | Adjacent. |
| Cleanup: post-patch verification | Standard | Adjacent. |
| Compliance: per-patch impact analysis | Standard | Adjacent. |
| Modern: extreme caution legacy | Best practice | Standard. |
^ad-crosstrust-patches

### Patch status verification

```powershell
# Check installed patches related to delegation
$patches = @(
  "KB4490425",  # TGT delegation disabled default
  "KB4493509",  # Adjacent NTLM
  "KB4502496"   # CVE-2019-1040
)

foreach ($kb in $patches) {
  $installed = Get-HotFix -Id $kb -ErrorAction SilentlyContinue
  if ($installed) {
    Write-Host "✓ $kb installed: $($installed.InstalledOn)" -ForegroundColor Green
  } else {
    Write-Host "✗ $kb NOT installed" -ForegroundColor Red
  }
}
```

___

## Cross-Trust BloodHound Analysis

| **Edge** | **Cross-Trust Use** | **Notas** |
|:---:|:---:|:---:|
| `AllowedToDelegate` cross-domain | Standard | Tool. |
| `AddAllowedToAct` cross-domain | RBCD modify | Tool. |
| `AllowedToAct` cross-domain | RBCD configured | Tool. |
| `AddKeyCredentialLink` cross-trust | Shadow Cred cross-forest | Tool. |
| `Trusts` edge | Trust relationship | Standard. |
| Cypher: cross-domain delegation paths | Custom | Tool. |
| BloodHound CE 5.x+ trust support | Modern | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Cross-trust path analysis | Custom | Tool. |
| Detection: BloodHound cross-domain queries | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: cross-trust baseline | Standard | Adjacent. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Cross-correlate trust direction + delegation | Standard | Audit. |
^ad-crosstrust-bh

### Cross-trust delegation queries

```cypher
// Cross-domain CD paths
MATCH (src)-[:AllowedToDelegate]->(target)
WHERE src.domain <> target.domain
RETURN src.name, src.domain, target.name, target.domain

// Cross-trust RBCD
MATCH (src)-[:AddAllowedToAct|AllowedToAct]->(target)
WHERE src.domain <> target.domain
RETURN src.name, src.domain, target.name, target.domain

// Cross-trust Shadow Cred
MATCH (src)-[:AddKeyCredentialLink]->(target:User)
WHERE src.domain <> target.domain
RETURN src.name, src.domain, target.name, target.domain

// Path: owned in dom-A → cross-trust delegation → DA in dom-B
MATCH (u {owned: true}), (target)
WHERE target.adminCount = true AND u.domain <> target.domain
MATCH p=shortestPath((u)-[:AllowedToDelegate|AddAllowedToAct|AllowedToAct|AddKeyCredentialLink|MemberOf*1..]->(target))
RETURN p
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Patch KB4490425 + CVE-2019-1040 | Standard | Hardening. |
| TGT Delegation cross-forest disabled (default modern) | Standard | Hardening. |
| SID Filtering enabled cross-trust | Default | Hardening. |
| Per-trust audit | Standard | Compliance. |
| Detection: cross-forest delegation events | Defender | Adjacent. |
| Microsoft Defender for Identity cross-trust alerts | Modern | Defender. |
| BloodHound continuous cross-trust audit | Modern | Tool. |
| Modern: minimize cross-trust delegation | Best practice | Standard. |
| Audit log retention | Standard | Adjacent. |
| Cleanup: stale cross-trust | Hygiene | Standard. |
| Compliance: documented per-trust | Standard | Adjacent. |
| AES-only Kerberos | Hardening | Standard. |
| Modern: continuous monitoring | Defender | Standard. |
| Cross-correlate trust attributes | Standard | Audit. |
| Audit: per-quarter cross-trust review | Standard | Compliance. |
| Modern: extreme alerting | Critical | Standard. |
^ad-crosstrust-mitigations

### Cross-trust hardening

```powershell
# Disable TGT delegation on all cross-forest trusts
Get-ADTrust -Filter {ForestTransitive -eq $true} | ForEach-Object {
  Set-ADTrust -Identity $_ -TGTDelegation $false
  Write-Host "Disabled TGT delegation on trust: $($_.Name)"
}

# Enable SID Filtering quarantine
Get-ADTrust -Filter {ForestTransitive -eq $true} | ForEach-Object {
  netdom trust dom.local /domain:$($_.Target) /quarantine:yes
}

# Verify modern patches installed
@("KB4490425","KB4502496","KB5004442","KB5008383") | ForEach-Object {
  Get-HotFix -Id $_ -ErrorAction SilentlyContinue
}
```

***
