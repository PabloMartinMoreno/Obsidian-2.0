---
aliases:
  - Password Policy Audit
  - Weak Policy Detection
  - Reversible Encryption
  - krbtgt Stale
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
  - "[[AD - Password Policy Enumeration]]"
---
# AD - Password Policy Enumeration - Audit & Misconfigurations

***

## Weak Min Length / No Complexity

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| MinPasswordLength < 7 | Default 7 | Below = weak. |
| MinPasswordLength < 14 (modern) | Below = audit | Best practice 14+. |
| ComplexityEnabled = false | Common dictionary attacks | Spray-friendly. |
| ReversibleEncryptionEnabled = true | DCSync recovers cleartext | Critical. |
| PasswordHistoryCount = 0 | Re-use same password | Audit. |
| PasswordHistoryCount < 24 | Common reuse | Audit. |
| MaxPasswordAge = 0 (never expires) | Stale passwords | Audit. |
| MaxPasswordAge > 365 days | Lax | Audit. |
| MinPasswordAge = 0 | Quick re-rotation | Edge. |
| Per-PSO weakness override | More common than default | Audit. |
| Tier 0 PSO weak = critical | Privileged exposure | Critical. |
| Service account PSO weak | Common practice | Audit. |
| Combine: weak + privileged | Critical | Audit. |
| Default Domain Policy weak | Wide impact | Audit. |
| Detection: policy modify events | Defender | Adjacent. |
| Compliance: PCI-DSS / HIPAA / SOX requirements | Standard | Adjacent. |
^ad-audit-weakness

### Audit script

```powershell
# Default Domain Policy weakness check
$pol = Get-ADDefaultDomainPasswordPolicy

$weaknesses = @()
if ($pol.MinPasswordLength -lt 14) { $weaknesses += "MIN_LENGTH<14: $($pol.MinPasswordLength)" }
if (-not $pol.ComplexityEnabled) { $weaknesses += "COMPLEXITY_OFF" }
if ($pol.ReversibleEncryptionEnabled) { $weaknesses += "REVERSIBLE_ENC" }
if ($pol.PasswordHistoryCount -lt 12) { $weaknesses += "HISTORY<12: $($pol.PasswordHistoryCount)" }
if ($pol.MaxPasswordAge.Days -gt 90) { $weaknesses += "MAX_AGE>90: $($pol.MaxPasswordAge.Days) days" }
if ($pol.LockoutThreshold -eq 0) { $weaknesses += "NO_LOCKOUT" }

if ($weaknesses) {
  Write-Host "Default Domain Policy weaknesses:" -ForegroundColor Red
  $weaknesses | ForEach-Object { Write-Host "  - $_" }
} else {
  Write-Host "Default Domain Policy passes audit" -ForegroundColor Green
}

# All PSOs weakness check
Get-ADFineGrainedPasswordPolicy -Filter * | ForEach-Object {
  $weak = @()
  if ($_.MinPasswordLength -lt 14) { $weak += "MIN_LENGTH<14" }
  if (-not $_.ComplexityEnabled) { $weak += "COMPLEXITY_OFF" }
  if ($_.ReversibleEncryptionEnabled) { $weak += "REVERSIBLE_ENC" }
  if ($_.LockoutThreshold -eq 0) { $weak += "NO_LOCKOUT" }
  
  if ($weak) {
    [PSCustomObject]@{
      PSO = $_.Name
      Weaknesses = $weak -join ', '
      AppliesTo = $_.AppliesTo -join '; '
    }
  }
}
```

___

## Reversible Encryption (DOMAIN_PASSWORD_STORE_CLEARTEXT)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ReversibleEncryptionEnabled = true | Stored as recoverable cleartext | Critical vuln. |
| Why exists: legacy CHAP / DIGEST auth | Ancient compat | Edge. |
| DCSync recovers cleartext | `secretsdump` direct | Standard. |
| Per-user UAC flag (0x80) | Granular setting | Adjacent. |
| Default Domain Policy global setting | Force on/off | Standard. |
| PSO override per-user/group | Granular | Standard. |
| Modern: should always be FALSE | Hardening | Standard. |
| Detection: policy with reversible ON | Defender alarm | Adjacent. |
| Detection: per-user UAC flag set | Defender | Adjacent. |
| Privileged user with reversible | Critical risk | Critical. |
| Cleanup: disable + force password change | Mitigation | Standard. |
| GPO can enforce force-disable | Hardening | Standard. |
| Compliance violation typically | Audit | Adjacent. |
| Cross-correlate with admin count | Critical | Audit. |
| `secretsdump --just-dc-user user` | Privileged dump | Tool. |
| Output "CLEARTEXT_PASSWORD: ..." | If reversible | Standard. |
^ad-audit-reversible

### Reversible encryption recovery

```powershell
# Domain-level check
(Get-ADDefaultDomainPasswordPolicy).ReversibleEncryptionEnabled

# PSO-level check
Get-ADFineGrainedPasswordPolicy -Filter * | 
  Where ReversibleEncryptionEnabled -eq $true |
  Select Name,AppliesTo

# Per-user UAC flag check (UAC bit 128 = 0x80)
Get-ADUser -Filter * -Properties UserAccountControl |
  Where {$_.UserAccountControl -band 128} |
  Select Name,SamAccountName,UserAccountControl

# Or: AllowReversiblePasswordEncryption boolean
Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true}
```

```bash
# DCSync to recover cleartext (privileged required)
impacket-secretsdump dom.local/admin:pass@DC -just-dc-user victim

# Output (if reversible enabled):
# victim:CLEARTEXT_PASSWORD:hereistheactualpassword
```

___

## krbtgt Stale Password

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| krbtgt holds KDC trust password | Signs all TGTs | Critical. |
| Recommended rotation: 180 days | Microsoft guidance | Standard. |
| Stale krbtgt | Persistent Golden Ticket risk | Critical. |
| `Get-ADUser krbtgt -Properties pwdLastSet` | Direct query | Standard. |
| Rotation requires twice consecutively | Replication delay | Procedure. |
| Cached tickets invalidated post-rotation | Operational | Standard. |
| Detection: krbtgt password change events | Defender | Adjacent. |
| Detection: krbtgt > 180 days | Audit | Defender. |
| Microsoft script: `Reset-KrbtgtKeyInteractive.ps1` | Reference tool | Standard. |
| RODC has separate krbtgt-RODC | Edge | Adjacent. |
| Cross-domain krbtgt independent | Per-domain | Standard. |
| Forest-wide krbtgt audit | Per-domain | Standard. |
| `pwdLastSet` 0 = never set | Edge | Edge. |
| Edge case: krbtgt re-creation | Rare | Edge. |
| BloodHound krbtgt awareness | Tool | Adjacent. |
| Adjacent: trust account passwords | Same concept | Adjacent. |
^ad-audit-krbtgt

### krbtgt audit

```powershell
# Per-domain krbtgt age
$forest = Get-ADForest
foreach ($d in $forest.Domains) {
  $krbtgt = Get-ADUser krbtgt -Server $d -Properties pwdLastSet
  $ageDays = ((Get-Date) - [datetime]::FromFileTime($krbtgt.pwdLastSet)).Days
  
  $color = if ($ageDays -gt 180) {"Red"} elseif ($ageDays -gt 90) {"Yellow"} else {"Green"}
  Write-Host "$d krbtgt: $ageDays days" -ForegroundColor $color
  
  if ($ageDays -gt 180) {
    Write-Warning "  Golden Ticket persistent risk"
  }
}
```

```bash
# Linux LDAP
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=krbtgt,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" pwdLastSet
```

___

## No-Lockout / Lockout=0

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| LockoutThreshold = 0 | No lockout | Critical. |
| Free brute force | Direct vuln | Critical. |
| Spray friendly | Attack accelerator | Strategy. |
| Per-PSO disabled | Granular vuln | Audit. |
| Service account PSO no-lockout | Common practice | Audit. |
| Detection: lockout disable event | Defender | Adjacent. |
| Modern hardening: lockout always on | Best practice | Standard. |
| Aggressive lockout: threshold = 3 | Strict | Edge. |
| Lockout admin accounts (DOMAIN_LOCKOUT_ADMINS) | Edge | Standard. |
| Detection: bulk Event 4625 with no 4740 | Inference | Defender. |
| Atacante OPSEC win: identify no-lockout users | Spray candidates | Strategy. |
| Cross-correlate: priv + no-lockout | Critical | Strategy. |
| Authenticated baseline always works | Standard | Reliable. |
| Anonymous detection | Limited info | Edge. |
| OPSEC: test single attempt fail to verify | Pre-spray | Standard. |
| Bypass via auth-only paths | Adjacent | Adjacent. |
^ad-audit-nolockout

### No-lockout detection

```powershell
# Default Domain Policy
$pol = Get-ADDefaultDomainPasswordPolicy
if ($pol.LockoutThreshold -eq 0) {
  Write-Host "DEFAULT POLICY: NO LOCKOUT — critical brute force risk" -ForegroundColor Red
}

# PSO-level
Get-ADFineGrainedPasswordPolicy -Filter * |
  Where LockoutThreshold -eq 0 |
  Select Name,AppliesTo,LockoutThreshold |
  Format-Table

# Per-user effective (find users with no lockout)
Get-ADUser -Filter {AdminCount -eq 1} | ForEach-Object {
  $u = $_
  $pol = Get-ADUserResultantPasswordPolicy -Identity $u -ErrorAction SilentlyContinue
  if ($pol -and $pol.LockoutThreshold -eq 0) {
    Write-Host "$($u.SamAccountName): NO LOCKOUT (privileged + free brute)" -ForegroundColor Red
  }
}
```

___

## Compliance Standards Reference

| **Standard** | **Min Length** | **Other Requirements** |
|:---:|:---:|:---:|
| NIST SP 800-63B (modern 2024) | 8+ (recommended 15+) | No complexity, breach check, no rotation. |
| PCI-DSS v4 | 12+ | Complexity, lockout 10 attempts, 30-day rotation. |
| HIPAA | "Reasonable" — typically 8+ | Per-org policy. |
| SOX | Per-org policy | Adjacent. |
| ISO 27001 | Per-org policy | Adjacent. |
| FISMA | Per-classification | Edge. |
| Microsoft Default | 7 | Outdated. |
| Modern best practice | 14+ | Without complexity (random). |
| Modern best practice (with complexity) | 12+ | Standard. |
| Service accounts | 25+ random | Defender best practice. |
| Tier 0 admins | 16+ random | Strictest. |
| MFA required for privileged | Standard | Modern. |
| Breach detection (HIBP) | Modern requirement | Standard. |
| Lockout: 5-10 attempts | Standard | Standard. |
| Lockout duration: 30 min | Standard | Standard. |
| Rotation: dropped (NIST) | Modern | Adjacent. |
^ad-audit-compliance

### Compliance audit script

```powershell
$pol = Get-ADDefaultDomainPasswordPolicy

$compliance = @{
  "PCI-DSS v4" = @{
    MinLength = 12
    Complexity = $true
    History = 4
    MaxAge = 90
    LockoutMin = 10
  }
  "NIST SP 800-63B" = @{
    MinLength = 8
    Complexity = $false  # NIST drops complexity req
    History = 0  # NIST drops history req for breach-tested
    MaxAge = 0  # NIST drops mandatory rotation
    LockoutMin = 5
  }
}

foreach ($std in $compliance.Keys) {
  $req = $compliance[$std]
  Write-Host "`n=== $std ==="
  Write-Host "MinLength: $($pol.MinPasswordLength) vs required $($req.MinLength)" -ForegroundColor $(if ($pol.MinPasswordLength -ge $req.MinLength) {"Green"} else {"Red"})
  Write-Host "Complexity: $($pol.ComplexityEnabled) vs required $($req.Complexity)"
  Write-Host "MaxAge: $($pol.MaxPasswordAge.Days) days"
  Write-Host "LockoutThreshold: $($pol.LockoutThreshold) (min: $($req.LockoutMin))"
}
```

___

## Custom PSO Audit (Service Accounts)

| **Audit** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Service account PSO laxer than default | Common practice | Audit. |
| Tier 0 PSO stricter than default | Best practice | Standard. |
| Cross-correlate user → PSO → settings | Per-user audit | Standard. |
| `Get-ADUserResultantPasswordPolicy` | Per-user effective | Standard. |
| Per-PSO ACL (read permission) | Adjacent | Adjacent. |
| Hidden PSOs via ACL deny | Edge detection | Defender. |
| Stale PSOs (orphaned) | Migration leftover | Audit. |
| Empty `msDS-PSOAppliesTo` | Edge | Edge. |
| Multiple overlapping PSOs | Conflict via precedence | Audit. |
| BloodHound PSO awareness | Modern | Tool. |
| Detection: PSO modify events | Defender | Adjacent. |
| Compliance: every priv user has strict PSO | Standard | Audit. |
| Compliance: every service account has strict PSO | Standard | Audit. |
| Audit log: PSO creation events | Defender | Adjacent. |
| Authentication anomaly cross-PSO | Edge | Adjacent. |
| Honeypot accounts in laxer PSO | Defender plant | Detection. |
^ad-audit-customsvcs

### Service account PSO audit

```powershell
# Service accounts (SPN-bound) + their effective PSOs
$svcUsers = Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName

$svcUsers | ForEach-Object {
  $u = $_
  $pol = Get-ADUserResultantPasswordPolicy -Identity $u -ErrorAction SilentlyContinue
  
  [PSCustomObject]@{
    User = $u.SamAccountName
    AppliedPSO = if ($pol) { $pol.Name } else { "DEFAULT" }
    MinLength = if ($pol) { $pol.MinPasswordLength } else { (Get-ADDefaultDomainPasswordPolicy).MinPasswordLength }
    Lockout = if ($pol) { $pol.LockoutThreshold } else { (Get-ADDefaultDomainPasswordPolicy).LockoutThreshold }
    ComplexityEnabled = if ($pol) { $pol.ComplexityEnabled } else { (Get-ADDefaultDomainPasswordPolicy).ComplexityEnabled }
    SPNs = $u.ServicePrincipalName -join '; '
  }
} | Where {$_.MinLength -lt 25} | Sort MinLength
```

___

## PingCastle / Purple Knight Output

| **Tool** | **Section** | **Notas** |
|:---:|:---:|:---:|
| PingCastle Healthcheck | Password Policy section | Comprehensive. |
| PingCastle krbtgt age | Direct flag | Standard. |
| PingCastle weak PSO | Per-PSO check | Standard. |
| PingCastle Reversible Encryption | Direct flag | Critical. |
| Purple Knight Password section | Comprehensive | Standard. |
| Defender for Identity policy section | Cloud | Modern. |
| AzureADConnectHealth (sync) | Cloud | Edge. |
| ADRecon password sheet | XLSX | Standard. |
| ADCollector | Adjacent | Adjacent. |
| BloodHound `--collect-password-policies` | Adjacent | Tool. |
| Custom audit scripts | DIY | Standard. |
| Microsoft Defender Advanced Threat Protection | Cloud | Modern. |
| Manual ldapsearch + parse | Linux DIY | Standard. |
| Audit baseline scripts | Standard | Compliance. |
| Periodic re-audit | Standard ops | Adjacent. |
| Remediation tracking | Compliance | Adjacent. |
^ad-audit-tools

### PingCastle quick

```cmd
:: PingCastle Healthcheck
PingCastle.exe --healthcheck --server DC

:: Output: HTML report with password policy analysis
:: Key sections:
:: - Domain Password Policy
:: - Fine-Grained Password Policies
:: - krbtgt password age
:: - Reversible Encryption usage
:: - PASSWD_NOTREQD users
:: - DONT_EXPIRE_PASSWORD privileged users
```

***
