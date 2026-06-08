---
aliases:
  - Stale Users
  - PASSWD_NOTREQD
  - DONT_EXPIRE_PASSWORD
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Users Enumeration]]"
  - "[[AD - Password Policy Enumeration - Audit y Misconfiguraciones]]"
---
# AD - Users Enumeration - Stale & Misconfigured Users

---

## Stale Accounts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly` | Users inactivos 90d | Cleanup target. |
| `Get-ADUser -Filter {LastLogonDate -lt (Get-Date).AddDays(-180) -and Enabled -eq $true}` | Active accounts inactivos 180d | Spray candidates. |
| `Get-ADUser -Filter {LastLogonDate -lt (Get-Date).AddDays(-180) -and AdminCount -eq 1}` | Priv users stale (CRITICAL) | Audit critical. |
| `Get-ADUser -Filter {-not LastLogonDate -and Enabled -eq $true}` | Never-logged-in habilitados | Pre-position / honey-token. |
| `Get-ADUser -Filter {PasswordLastSet -lt (Get-Date).AddYears(-1)}` | Password >1 año | Spray prep. |
| `Get-ADUser -Filter {PasswordLastSet -lt (Get-Date).AddYears(-1) -and AdminCount -eq 1}` | Priv + pwd stale | Critical spray. |
| `Search-ADAccount -PasswordExpired` | Cuentas con pwd expirada | Cleanup. |
| `Search-ADAccount -LockedOut` | Lockeados ahora | Triage. |
^ad-misc-stale

```powershell
# Pipeline audit completo stale
$Stale = (Get-Date).AddDays(-180)
Get-ADUser -Filter {LastLogonDate -lt $Stale -and Enabled -eq $true} `
  -Properties LastLogonDate,PasswordLastSet,AdminCount,Description,MemberOf |
  Select Name,SamAccountName,AdminCount,LastLogonDate,PasswordLastSet,Description |
  Sort LastLogonDate
```

---

## PASSWD_NOTREQD (No Password Required)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {PasswordNotRequired -eq $true -and Enabled -eq $true}` | Users con flag (login con pwd vacío posible) | Trivial vuln. |
| `nxc ldap <DC> -u u -p p --password-not-required` | Lista vía netexec | Quick. |
| `ldapsearch ... "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=32))" samAccountName` | LDAP filter raw | Linux. |
| `nxc smb <target> -u <victim> -p ''` | Test login con pwd vacío | Validation. |
^ad-misc-passwdnotreqd

**UAC bit:** `0x20` (decimal 32) = `PASSWD_NOTREQD`. Account permite empty password — login directo sin creds.

```powershell
# Audit users only (excluye computers/trusts)
Get-ADUser -Filter {PasswordNotRequired -eq $true -and Enabled -eq $true} `
  -Properties PasswordNotRequired,Description,LastLogonDate,AdminCount |
  Where { $_.objectClass -eq 'user' }
```

---

## DONT_EXPIRE_PASSWORD

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Search-ADAccount -PasswordNeverExpires -UsersOnly` | Users con pwd que nunca expira | Audit completo. |
| `Get-ADUser -Filter {PasswordNeverExpires -eq $true -and AdminCount -eq 1}` | Priv users con flag | Critical audit. |
| `Get-ADUser -Filter {PasswordNeverExpires -eq $true -and ServicePrincipalName -like "*"}` | Service accounts con flag | Common combo (spray). |
| `Get-ADUser -Filter {PasswordNeverExpires -eq $true -and PasswordLastSet -lt (Get-Date).AddYears(-2)}` | Pwd never expires + viejo (>2y) | Spray candidate. |
^ad-misc-dontexpire

**UAC bit:** `0x10000` (decimal 65536). Common en service accounts pero **debería estar en gMSA** (auto-rotation), no users normales.

```powershell
# Service accounts con never-expires + pwd viejo (spray prep)
Get-ADUser -Filter {PasswordNeverExpires -eq $true -and ServicePrincipalName -like "*"} `
  -Properties PasswordLastSet,LastLogonDate,Description,ServicePrincipalName |
  Sort PasswordLastSet
```

---

## ENCRYPTED_TEXT_PWD_ALLOWED (Reversible Encryption)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true}` | Users con flag (pwd recoverable cleartext via DCSync) | Critical vuln hunt. |
| `ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=128))" samAccountName` | LDAP raw | Linux. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc-user <victim>` | DCSync — output incluye `CLEARTEXT_PASSWORD:` si flag set | Privileged recovery. |
^ad-misc-reversible

**UAC bit:** `0x80` (decimal 128). Storage password en formato reversible (legacy CHAP/Digest). DCSync devuelve **cleartext password** directamente. Modern hardening = 0 users con esto.

```bash
# Pipeline: detect + recover
nxc ldap <DC> -u u -p p --query \
  "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=128))" \
  "samAccountName"

# Recover cleartext (priv DCSync)
secretsdump.py 'corp.local/admin:pass'@<DC> -just-dc-user victim
# Output:
# victim:CLEARTEXT_PASSWORD:RealPasswordInClear!
```

---

## Description / Comment Field Leakage

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr Description \| ? Description -match "(?i)pass\|pwd\|secret\|cred\|temp"` | Description con keywords cred | Cred hunt. |
| `Get-ADUser -Filter * -Pr Description,Comment,Info \| ? {$_.Description -match "(?i)pass" -or $_.Comment -match "(?i)pass" -or $_.Info -match "(?i)pass"}` | Free-text completo (description+comment+info) | Hunt completo. |
| `ldapsearch ... "(&(objectCategory=user)(\|(description=*pass*)(description=*pwd*)(comment=*pass*)(info=*pass*)))" samAccountName description comment info` | LDAP filter | Linux. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(description=*))" "samAccountName,description"` | Bulk description dump | Quick triage. |
^ad-misc-description

```powershell
# Hunt completo + sort por priv
Get-ADUser -Filter * -Properties Description,Comment,Info,AdminCount |
  Where {
    $_.Description -match "(?i)pass|pwd|secret|key|cred|temp|admin" -or
    $_.Comment -match "(?i)pass|pwd|secret|cred" -or
    $_.Info -match "(?i)pass|pwd|secret|cred"
  } |
  Select Name,SamAccountName,AdminCount,Description,Comment,Info |
  Sort AdminCount -Descending
```

---

## Other Misconfig Patterns

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr ServicePrincipalName \| ? {$_.ServicePrincipalName.Count -gt 3}` | Users con muchos SPNs (sospechoso) | Anomaly hunt. |
| `Get-ADUser -Filter * -Pr whenChanged \| ? whenChanged -gt (Get-Date).AddDays(-30)` | Cambios últimos 30d | Recent activity audit. |
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink \| ? msDS-KeyCredentialLink` | Users con Shadow Cred | Persistence hunt. |
| `Get-ADUser -Filter * -Pr sIDHistory \| ? sIDHistory` | Users con SID History | Migration leftover audit. |
| `Get-ADUser -Filter {SmartcardLogonRequired -eq $true -and AdminCount -ne 1}` | Smartcard required en non-priv (misconfig) | Audit. |
| `Get-ADUser -Filter {AccountExpirationDate -lt (Get-Date) -and Enabled -eq $true}` | Expirados pero enabled (bug) | Audit. |
| `Get-ADUser -Filter {LogonCount -eq 0 -and Enabled -eq $true -and whenCreated -lt (Get-Date).AddDays(-90)}` | Creados >90d sin logueo | Honey-token candidates. |
^ad-misc-others

```powershell
# Anomaly snapshot completo
$Recent = (Get-Date).AddDays(-30)
@{
  RecentChanged = (Get-ADUser -Filter * -Properties whenChanged | Where whenChanged -gt $Recent | Measure).Count
  WithKeyCred   = (Get-ADUser -Filter * -Properties msDS-KeyCredentialLink | Where 'msDS-KeyCredentialLink' | Measure).Count
  WithSIDHist   = (Get-ADUser -Filter * -Properties sIDHistory | Where sIDHistory | Measure).Count
  RevEncryption = (Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true} | Measure).Count
  PwdNotReqd    = (Get-ADUser -Filter {PasswordNotRequired -eq $true -and Enabled -eq $true} | Measure).Count
}
```

---
