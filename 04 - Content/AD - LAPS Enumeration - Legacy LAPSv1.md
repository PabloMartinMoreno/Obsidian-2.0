---
aliases:
  - LAPSv1
  - ms-Mcs-AdmPwd
  - Legacy LAPS
  - Microsoft LAPS legacy
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
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - Legacy LAPSv1

***

## LAPSv1 Architecture

| **Atributo** | **Significado** | **Cuándo** |
|:---:|:---:|:---:|
| `ms-Mcs-AdmPwd` | **Cleartext** local admin password | Almacenado plain en LDAP. |
| `ms-Mcs-AdmPwdExpirationTime` | FILETIME expiration | Trigger rotation. |
| Computer self-write | Computer rota su propio pwd | `Self` ACE permission. |
| GPO `LAPS.admx` | Configuración deployment | `HKLM\Software\Policies\Microsoft Services\AdmPwd`. |
| Default rotation | 30 días | Configurable. |
^ad-lapsv1-arch

**Default state (post-deploy):**
1. Schema extended con `ms-Mcs-AdmPwd*` attrs.
2. GPO con `AdmPwd.dll` deploy.
3. Computer reset password local admin (default `Administrator` o RID 500).
4. Pwd se almacena en `ms-Mcs-AdmPwd` (plain text LDAP).
5. Computer self-rotate cada `ms-Mcs-AdmPwdExpirationTime`.

___

## LAPSv1 Read via LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer <host> -Properties ms-Mcs-AdmPwd,ms-Mcs-AdmPwdExpirationTime` | Single host pwd | RSAT. |
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwd \| ? 'ms-Mcs-AdmPwd'` | Bulk readable pwds | Coverage = ACL grants. |
| `nxc smb hosts.txt -u u -p p --laps` | Bulk read via netexec | Quick. |
| `nxc ldap <DC> -u u -p p --query "(ms-Mcs-AdmPwd=*)" "samAccountName,ms-Mcs-AdmPwd"` | LDAP filter readable | Linux. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(ms-Mcs-AdmPwd=*)" samAccountName ms-Mcs-AdmPwd` | LDAP raw | Linux. |
^ad-lapsv1-read

```bash
# Bulk LAPS dump (solo hosts con read access)
nxc smb hosts.txt -u user -p pass --laps

# Output:
# host01    LAPS    Administrator:abcDef123!
# host05    LAPS    Administrator:xyz9876@@
```

```powershell
# RSAT bulk
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd,ms-Mcs-AdmPwdExpirationTime |
  Where 'ms-Mcs-AdmPwd' |
  Select Name,@{n='AdmPwd';e={$_.'ms-Mcs-AdmPwd'}},
         @{n='Expires';e={[datetime]::FromFileTime($_.'ms-Mcs-AdmPwdExpirationTime')}}
```

___

## LAPSv1 ACL Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<computer-DN>").Access \| ? {$_.ObjectType -eq "ea1b7b93-5e48-46d5-bc6c-4df4fda78a35"}` | ACEs `ExtendedRight` `All-Extended-Rights` (incluye AdmPwd read) | Per-host audit. |
| `Find-AdmPwdExtendedRights -Identity "OU=X,DC=corp,DC=local"` (LAPS PowerShell module) | Quien puede leer LAPS por OU | Native helper. |
| `dsacls "<computer-DN>" \| Select-String "ms-Mcs-AdmPwd"` | DACL específico via dsacls | Sin RSAT. |
| `Get-LapsADExtendedRights -Identity "OU=X,DC=corp,DC=local"` (Win LAPS module) | Native modern wrapper | Si Win LAPS module instalado. |
^ad-lapsv1-acl

**ACE permission necesario para read:**
- `ExtendedRight: All-Extended-Rights` (GUID `00000000-0000-0000-0000-000000000000`) sobre el computer object, OR
- `ReadProperty` específico sobre `ms-Mcs-AdmPwd` attribute.

```powershell
# Native helper LAPSv1
Import-Module AdmPwd.PS
Find-AdmPwdExtendedRights -Identity "OU=Servers,DC=corp,DC=local" |
  Select ObjectDN,@{n='Readers';e={$_.ExtendedRightHolders -join '; '}}
```

___

## LAPSv1 Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<computer-DN>").Access \| ? IdentityReference -match "Authenticated Users\|Domain Users\|Everyone"` | Wide access ACE en LAPS attrs | **CRITICAL** — todos pueden leer. |
| `Find-AdmPwdExtendedRights -Identity "DC=corp,DC=local" \| ? ExtendedRightHolders -match "Authenticated Users\|Domain Users"` | Bulk wide access | Audit. |
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwdExpirationTime \| ? {$_.'ms-Mcs-AdmPwdExpirationTime' -lt (Get-Date).ToFileTime() - (90*24*3600*10000000)}` | Pwds no rotados >90d | Stale rotation. |
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwd,Enabled \| ? {-not $_.'ms-Mcs-AdmPwd' -and $_.Enabled}` | Computers sin LAPS pwd set | Coverage gap. |
| Compare GPO scope vs computer scope | Mismatch | Audit deployment. |
^ad-lapsv1-misconfig

___

## LAPSv1 Read Permissions

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-AdmPwdExtendedRights -Identity <OU>` | Lista users/groups con read | Per-OU audit. |
| `Set-AdmPwdReadPasswordPermission -Identity <OU> -AllowedPrincipals "Group X"` | Grant read (priv) | Hardening / setup. |
| `Set-AdmPwdResetPasswordPermission -Identity <OU> -AllowedPrincipals "Group X"` | Grant reset (priv) | Force rotation. |
^ad-lapsv1-readers

**Default readers** después de install LAPS GPO: solo `Domain Admins` (vía herencia). Hardening = grant read a tier-specific groups (e.g., `T1 Server Admins` para Server OU, no flat `Domain Admins`).

___

## LAPSv1 Replacement (Migration to LAPSv2)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Update-LapsADSchema` (Win LAPS module) | Extender schema con `msLAPS-*` attrs | Pre-migration. |
| `Set-LapsADComputerSelfPermission -Identity <OU>` | Set self-write LAPSv2 ACE | Post-schema. |
| `Set-LapsADReadPasswordPermission -Identity <OU> -AllowedPrincipals <Group>` | Grant read LAPSv2 | Hardening. |
| `Find-LapsADExtendedRights -Identity <OU>` | Audit LAPSv2 ACEs (post-migration) | Verify. |
| `Invoke-LapsPolicyProcessing` (per-host) | Force rotación post-migration | Cleanup pwd LAPSv1. |
^ad-lapsv1-migration

**Migration workflow:**
1. `Update-LapsADSchema` (extender schema con LAPSv2).
2. Deploy LAPSv2 GPO (configurar `BackupDirectory=AD`).
3. Pull legacy LAPSv1 GPO (no remover hasta migration completa).
4. Force rotation: clients usan LAPSv2 attrs.
5. Cleanup `ms-Mcs-AdmPwd*` viejo via `Set-ADObject -Clear`.

***
