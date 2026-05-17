---
aliases:
  - Default Domain Password Policy
  - DDP
  - getdompwinfo
  - Get-ADDefaultDomainPasswordPolicy
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Password Policy Enumeration]]'
---
# AD - Password Policy Enumeration - Default Domain Policy

***

## Native Windows Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `net accounts /domain` | Policy default (min len, max age, lockout, history) | Quick desde Windows. |
| `Get-ADDefaultDomainPasswordPolicy` | Policy completo via RSAT | Standard. |
| `Get-ADObject -SearchBase "DC=corp,DC=local" -SearchScope Base -Pr minPwdLength,maxPwdAge,lockoutThreshold,lockoutDuration,pwdHistoryLength,pwdProperties` | Policy attrs raw | Sin RSAT-AD. |
| `gpresult /R /SCOPE COMPUTER` | RSoP del host (incluye policy efectivo) | Effective policy. |
^ad-pwdpol-native

```cmd
net accounts /domain
:: Output:
:: Minimum password age (days):                          1
:: Maximum password age (days):                          90
:: Minimum password length:                              8
:: Length of password history maintained:                24
:: Lockout threshold:                                    5
:: Lockout duration (minutes):                           30
:: Lockout observation window (minutes):                 30
```

___

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u u -p p --pass-pol` | Policy via netexec | Quick post-foothold. |
| `nxc smb <DC> -u '' -p '' --pass-pol` | Anonymous attempt | Test misconfig. |
| `nxc ldap <DC> -u u -p p --pass-pol` | Via LDAP (alt path) | Si SMB blocked. |
^ad-pwdpol-netexec

```bash
nxc smb <DC> -u user -p pass --pass-pol
# Output:
# Minimum password length: 8
# Password history length: 24
# Maximum password age: 90 days
# Account Lockout Threshold: 5
# Reset Account Lockout Counter: 30 minutes
```

___

## RPC Anonymous Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `rpcclient -U "" <DC> -N -c 'getdompwinfo'` | Policy via null session | Test anonymous SAMR. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'getdompwinfo'` | Authenticated | Standard. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'querydominfo'` | Domain info detallado | Alternativa. |
^ad-pwdpol-rpc

```bash
# Anonymous test (legacy DCs)
rpcclient -U "" <DC> -N -c 'getdompwinfo'
# Output:
# min_password_length: 8
# password_properties: 0x00000001
```

___

## LDAP Direct Query

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" -s base "(objectClass=domain)" minPwdLength maxPwdAge minPwdAge lockoutThreshold lockoutDuration lockoutObservationWindow pwdHistoryLength pwdProperties` | Policy attrs raw | LDAP-only. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=domain)" "minPwdLength,lockoutThreshold,pwdProperties"` | Wrapper netexec | Quick. |
^ad-pwdpol-ldap

**Atributos clave:**
- `minPwdLength` — int.
- `maxPwdAge` / `minPwdAge` — int64 negativo (100-ns ticks). `días = -val / 10000000 / 86400`.
- `lockoutThreshold` — int (0 = sin lockout).
- `lockoutDuration` / `lockoutObservationWindow` — int64 negativo.
- `pwdHistoryLength` — int.
- `pwdProperties` — bitfield.

___

## pwdProperties Bitfield

| **Hex** | **Flag** | **Significado** |
|:---:|:---:|:---:|
| 0x1 | `DOMAIN_PASSWORD_COMPLEX` | Complejidad requerida. |
| 0x2 | `DOMAIN_PASSWORD_NO_ANON_CHANGE` | No anon change. |
| 0x4 | `DOMAIN_PASSWORD_NO_CLEAR_CHANGE` | No cleartext change. |
| 0x8 | `DOMAIN_LOCKOUT_ADMINS` | Lockout afecta builtin Administrator. |
| 0x10 | `DOMAIN_PASSWORD_STORE_CLEARTEXT` | Reversible encryption global (CRITICAL). |
| 0x20 | `DOMAIN_REFUSE_PASSWORD_CHANGE` | Refuse password change. |
^ad-pwdpol-properties

**Defaults seguros:** `0x1` (complexity ON). `0x10` set = users con UAC `ENCRYPTED_TEXT_PWD_ALLOWED` recoverable cleartext via DCSync.

```powershell
$pol = Get-ADDefaultDomainPasswordPolicy
[PSCustomObject]@{
  Complexity            = $pol.ComplexityEnabled
  ReversibleEncryption  = $pol.ReversibleEncryptionEnabled
  MinPasswordLength     = $pol.MinPasswordLength
  PasswordHistoryCount  = $pol.PasswordHistoryCount
  LockoutThreshold      = $pol.LockoutThreshold
  LockoutDuration       = $pol.LockoutDuration
}
```

___

## krbtgt Password Age

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser krbtgt -Properties PasswordLastSet,msDS-KeyVersionNumber` | krbtgt last reset + KVNO | Audit critical. |
| `nxc ldap <DC> -u u -p p --query "(samAccountName=krbtgt)" "PasswordLastSet,msDS-KeyVersionNumber"` | Via netexec | Quick. |
| `.\New-KrbtgtKeys.ps1 -OperationalMode -OneStep` (Microsoft) | Reset krbtgt (priv) | Hardening (2× con 24h gap). |
^ad-pwdpol-krbtgt

**Por qué importa:** krbtgt firma todos TGTs. Hash krbtgt comprometido (DCSync) = Golden Tickets persistentes hasta rotación 2×. Best practice: rotar cada 180 días.

```powershell
$k = Get-ADUser krbtgt -Properties PasswordLastSet,msDS-KeyVersionNumber
$age = (Get-Date) - $k.PasswordLastSet
"krbtgt age: $($age.Days)d, KVNO: $($k.'msDS-KeyVersionNumber')"

if ($age.Days -gt 180) { Write-Warning "krbtgt stale — rotate 2× con 24h gap" }
```

___

## Multi-Domain Forest-Wide

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains \| % { Get-ADDefaultDomainPasswordPolicy -Server $_ }` | Policy per-domain | Forest audit. |
| `(Get-ADForest).Domains \| % { Get-ADUser krbtgt -Server $_ -Pr PasswordLastSet }` | krbtgt age per-domain | Forest-wide audit. |
^ad-pwdpol-multidomain

```powershell
# Forest snapshot
foreach ($d in (Get-ADForest).Domains) {
  $p = Get-ADDefaultDomainPasswordPolicy -Server $d
  $k = Get-ADUser krbtgt -Server $d -Properties PasswordLastSet
  [PSCustomObject]@{
    Domain        = $d
    MinLen        = $p.MinPasswordLength
    Complexity    = $p.ComplexityEnabled
    Lockout       = $p.LockoutThreshold
    KrbtgtAgeDays = ((Get-Date) - $k.PasswordLastSet).Days
  }
}
```

***
