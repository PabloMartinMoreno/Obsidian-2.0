---
aliases:
  - Password Policy Audit
  - Weak Policy Detection
  - Reversible Encryption
  - Compliance Standards
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
# AD - Password Policy Enumeration - Audit & Misconfiguraciones

***

## Weak Min Length / No Complexity

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-ADDefaultDomainPasswordPolicy).MinPasswordLength` | Min length DDP | <12 = audit fail moderno (NIST 800-63B recomienda ≥8 con MFA, ≥14 sin). |
| `(Get-ADDefaultDomainPasswordPolicy).ComplexityEnabled` | Complejidad ON/OFF | False = critical. |
| `Get-ADFineGrainedPasswordPolicy -Filter {MinPasswordLength -lt 12}` | PSOs con length débil | Audit. |
| `Get-ADFineGrainedPasswordPolicy -Filter {ComplexityEnabled -eq $false}` | PSOs sin complejidad | Audit. |
| `Get-ADFineGrainedPasswordPolicy -Filter * -Pr AppliesTo \| ? AppliesTo -match "Domain Users"` | PSO global débil | Wide blast radius. |
^ad-audit-weakness

```powershell
# Comprehensive weakness audit
$DDP = Get-ADDefaultDomainPasswordPolicy
$Issues = @()

if ($DDP.MinPasswordLength -lt 12) { $Issues += "DDP MinLen: $($DDP.MinPasswordLength)" }
if (-not $DDP.ComplexityEnabled)   { $Issues += "DDP Complexity OFF" }
if ($DDP.LockoutThreshold -eq 0)   { $Issues += "DDP No Lockout" }
if ($DDP.PasswordHistoryCount -lt 12) { $Issues += "DDP History: $($DDP.PasswordHistoryCount)" }

Get-ADFineGrainedPasswordPolicy -Filter * | % {
  if ($_.MinPasswordLength -lt 12) { $Issues += "PSO $($_.Name) MinLen: $($_.MinPasswordLength)" }
  if (-not $_.ComplexityEnabled)   { $Issues += "PSO $($_.Name) Complexity OFF" }
  if ($_.LockoutThreshold -eq 0)   { $Issues += "PSO $($_.Name) No Lockout" }
}

$Issues
```

___

## Reversible Encryption

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-ADDefaultDomainPasswordPolicy).ReversibleEncryptionEnabled` | DDP reversible global | True = todos users con flag = cleartext recoverable. |
| `Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true}` | Users con UAC `ENCRYPTED_TEXT_PWD_ALLOWED` (0x80) | DCSync recovera cleartext. |
| `Get-ADFineGrainedPasswordPolicy -Filter {ReversibleEncryptionEnabled -eq $true}` | PSOs con reversible | Audit. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc-user <victim>` | Recovery cleartext via DCSync | Privesc + lateral. |
^ad-audit-reversible

**Output secretsdump si reversible:**
```
victim:CLEARTEXT_PASSWORD:RealPasswordInClear!
```

```powershell
# Hunt + count
$rev = Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true} -Properties AdminCount
"Users con reversible: $($rev.Count) (priv: $($rev.Where({$_.AdminCount -eq 1}).Count))"
```

___

## krbtgt Stale Password

| **Comando** | **Qué obtenés** | **Acción** |
|:---:|:---:|:---:|
| `Get-ADUser krbtgt -Properties PasswordLastSet,msDS-KeyVersionNumber` | Age + KVNO | >180d = audit fail. |
| `(Get-ADForest).Domains \| % { Get-ADUser krbtgt -Server $_ -Pr PasswordLastSet }` | Forest-wide krbtgt | Multi-domain audit. |
| `.\New-KrbtgtKeys.ps1 -OperationalMode -OneStep` (Microsoft GitHub) | Reset 1× | Necesita 2× con 24h gap. |
^ad-audit-krbtgt

**Reset workflow correcto:**
1. `New-KrbtgtKeys.ps1 -OperationalMode -OneStep` → reset 1.
2. Wait 24h (replicación full forest + KDCs todos sirven KVNO nuevo).
3. `New-KrbtgtKeys.ps1 -OperationalMode -OneStep` → reset 2.
4. Golden Tickets viejos invalidados (KVNO -1 ya no aceptado).

```powershell
# Forest krbtgt audit
foreach ($d in (Get-ADForest).Domains) {
  $k = Get-ADUser krbtgt -Server $d -Properties PasswordLastSet,msDS-KeyVersionNumber
  $age = ((Get-Date) - $k.PasswordLastSet).Days
  [PSCustomObject]@{
    Domain = $d
    AgeDays = $age
    KVNO = $k.'msDS-KeyVersionNumber'
    Status = if ($age -gt 180) { "STALE" } else { "OK" }
  }
}
```

___

## No-Lockout / Lockout=0

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-ADDefaultDomainPasswordPolicy).LockoutThreshold` | =0 → spray ilimitado | Critical. |
| `Get-ADFineGrainedPasswordPolicy -Filter {LockoutThreshold -eq 0}` | PSOs sin lockout | Audit. |
| `Get-ADFineGrainedPasswordPolicy -Filter {LockoutThreshold -gt 0 -and LockoutThreshold -lt 5}` | Threshold muy bajo (1-4) | DOS risk (lockout fácil de triggers). |
^ad-audit-nolockout

**Trade-off:** threshold=0 → vulnerable a spray. threshold=1 → vulnerable a DOS (lockout intencional). Sweet spot: 5-10 con observation window 30min.

___

## Compliance Standards

| **Standard** | **Recomendación clave** | **Comando audit** |
|:---:|:---:|:---:|
| **NIST 800-63B** (2024) | Min 15 chars, no complejidad obligatoria, no rotation periódica forzada, MFA recomendado | `Get-ADDefaultDomainPasswordPolicy` |
| **CIS Microsoft Windows Server 2022 Benchmark** | Min 14, complexity ON, history 24, max age 60d, lockout 5/30min/30min | Audit + benchmark tool. |
| **PCI-DSS 4.0 (req 8.3.6)** | Min 12, change every 90d, history 4 | Custom audit. |
| **HIPAA** | "Strong" sin numérico (vago) — usually 8+ complex | Custom. |
| **DISA STIG Windows Server 2022** | Min 14, complexity, history 24, lockout 3/15min | Compliance pack. |
^ad-audit-compliance

```powershell
# CIS-style audit
$p = Get-ADDefaultDomainPasswordPolicy
$cis = @{
  MinLen14    = $p.MinPasswordLength -ge 14
  Complexity  = $p.ComplexityEnabled
  History24   = $p.PasswordHistoryCount -ge 24
  MaxAge60    = $p.MaxPasswordAge.Days -le 60 -and $p.MaxPasswordAge.Days -gt 0
  Lockout5    = $p.LockoutThreshold -ge 1 -and $p.LockoutThreshold -le 5
  NoReversible = -not $p.ReversibleEncryptionEnabled
}
$cis
```

___

## Custom PSO Audit

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADFineGrainedPasswordPolicy -Filter * -Pr AppliesTo \| ? {-not $_.AppliesTo}` | PSO sin subjects (huérfano) | Cleanup. |
| `Get-ADFineGrainedPasswordPolicy -Filter * \| Sort Precedence` | PSOs ordenados por precedence | Resolution order. |
| `Get-ADFineGrainedPasswordPolicy -Filter * \| Group-Object Precedence \| ? Count -gt 1` | Multiple PSOs misma precedence (tie) | Resolución por GUID = ambiguo. |
| `Get-ADFineGrainedPasswordPolicy -Filter * -Pr AppliesTo \| ? {$_.AppliesTo -match "(?i)svc\|service"}` | PSOs aplicados a service accounts | Often weaker. |
^ad-audit-customsvcs

```powershell
# PSO inventory completo
Get-ADFineGrainedPasswordPolicy -Filter * -Properties * |
  Select Name,Precedence,MinPasswordLength,LockoutThreshold,
         ComplexityEnabled,ReversibleEncryptionEnabled,
         @{n='Subjects';e={$_.AppliesTo -join '; '}},
         @{n='SubjectCount';e={$_.AppliesTo.Count}} |
  Sort Precedence
```

___

## PingCastle / Purple Knight

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --healthcheck --server <DC> --no-enum-limit` | Audit completo (incluye password policy) | Quarterly audit. |
| Open `ad_hc_corp.local.html` → buscar reglas `S-PwdLen`, `S-PwdNotRequired`, `A-Reversible*`, `A-LockoutDuration` | Findings password policy específicos | Post-PingCastle. |
| Purple Knight GUI → Indicators → "Password" category | IoEs password policy | Cross-check con PingCastle. |
| `Invoke-Locksmith` (PowerShell) | Adjacent — ADCS audit (incluye templates con password issues) | Cross-domain. |
^ad-audit-tools

```cmd
:: PingCastle quarterly audit
PingCastle.exe --healthcheck --server dc01 --no-enum-limit
:: Output: ad_hc_<dom>.html

:: Reglas a buscar:
:: - S-PwdLastSet-90 (krbtgt stale >90d)
:: - S-PwdLastSet-180 (krbtgt stale >180d)
:: - S-Reversible (reversible encryption enabled)
:: - A-LockoutThreshold-0 (no lockout)
:: - S-PwdNotRequired (PASSWD_NOTREQD users)
```

***
