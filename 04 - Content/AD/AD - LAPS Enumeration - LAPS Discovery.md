---
aliases:
  - LAPS Detection
  - ms-Mcs-AdmPwd Schema
  - LAPS Deployment Check
  - msLAPS-Password
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - LAPS Discovery

***

## Schema Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase (Get-ADRootDSE).SchemaNamingContext -Filter {Name -like "*ms-Mcs-AdmPwd*"}` | LAPSv1 schema attrs (legacy) | Test schema extension. |
| `Get-ADObject -SearchBase (Get-ADRootDSE).SchemaNamingContext -Filter {Name -like "msLAPS-*"}` | LAPSv2 schema attrs | Modern. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "CN=Schema,CN=Configuration,DC=corp,DC=local" "(\|(name=ms-Mcs-AdmPwd*)(name=msLAPS-*))" name lDAPDisplayName` | LAPS schema via LDAP | Linux. |
| `nxc ldap <DC> -u u -p p --query "(\|(name=ms-Mcs-AdmPwd*)(name=msLAPS-*))" "name,lDAPDisplayName"` | netexec wrapper | Quick. |
^ad-laps-schema

**Schema attrs:**
- LAPSv1: `ms-Mcs-AdmPwd` (password cleartext) + `ms-Mcs-AdmPwdExpirationTime`.
- LAPSv2: `msLAPS-Password` (JSON: nombre + pwd cleartext, encryption opcional) + `msLAPS-EncryptedPassword` (DPAPI-NG encrypted) + `msLAPS-PasswordExpirationTime` + `msLAPS-EncryptedPasswordHistory`.

```powershell
# Both versions check
$Schema = (Get-ADRootDSE).SchemaNamingContext

@{
  V1 = (Get-ADObject -SearchBase $Schema -Filter {Name -like "ms-Mcs-AdmPwd*"} | Measure).Count -gt 0
  V2 = (Get-ADObject -SearchBase $Schema -Filter {Name -like "msLAPS-*"} | Measure).Count -gt 0
}
```

___

## LAPS Deployment Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwdExpirationTime \| ? 'ms-Mcs-AdmPwdExpirationTime'` | Computers con LAPSv1 deployed | Coverage check. |
| `Get-ADComputer -Filter * -Pr msLAPS-PasswordExpirationTime \| ? 'msLAPS-PasswordExpirationTime'` | Computers con LAPSv2 | Coverage. |
| `(Get-ADComputer -Filter * \| Measure).Count` vs deployed count | Coverage % | Audit gap. |
| `nxc smb hosts.txt -u u -p p --laps` | Bulk check + read si readable | Quick. |
^ad-laps-deployment

```powershell
# Coverage analysis
$Total = (Get-ADComputer -Filter * -Pr Enabled | Where Enabled).Count
$V1 = (Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwdExpirationTime | Where 'ms-Mcs-AdmPwdExpirationTime').Count
$V2 = (Get-ADComputer -Filter * -Pr msLAPS-PasswordExpirationTime | Where 'msLAPS-PasswordExpirationTime').Count

[PSCustomObject]@{
  TotalEnabled = $Total
  LAPSv1       = $V1
  LAPSv2       = $V2
  CoveragePct  = "{0:P1}" -f (($V1 + $V2) / $Total)
}
```

___

## GPO LAPS Configuration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All \| ? DisplayName -match "(?i)laps"` | GPOs LAPS-related (naming) | GPO inventory. |
| `Get-GPRegistryValue -Name "<gpo>" -Key "HKLM\Software\Policies\Microsoft Services\AdmPwd"` | LAPSv1 settings (legacy registry path) | LAPSv1 GPO check. |
| `Get-GPRegistryValue -Name "<gpo>" -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\LAPS\Config"` | LAPSv2 settings | LAPSv2 GPO check. |
| `Get-GPOReport -All -ReportType Xml -Path gpos.xml; Select-String -Path gpos.xml -Pattern "AdmPwd\|msLAPS\|LAPS"` | Buscar LAPS en todos GPOs | Bulk audit. |
^ad-laps-gpo

```powershell
# Find LAPS GPOs + linked OUs
Get-GPO -All | Where DisplayName -match "(?i)laps" | % {
  $g = $_
  $links = (Get-GPInheritance -Target (Get-ADDomain).DistinguishedName).GpoLinks |
    Where { $_.GpoId -eq $g.Id }
  [PSCustomObject]@{
    GPO = $g.DisplayName
    Id  = $g.Id
    LinkedTo = $links.Target -join '; '
  }
}
```

___

## OU Scope of LAPS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwdExpirationTime,DistinguishedName \| ? 'ms-Mcs-AdmPwdExpirationTime' \| Group { ($_.DistinguishedName -split ',OU=')[1] }` | Coverage por OU (LAPSv1) | Identify gaps. |
| `Get-ADOrganizationalUnit -Filter * \| ? { (Get-ADComputer -SearchBase $_.DistinguishedName -Filter * -Pr ms-Mcs-AdmPwdExpirationTime \| ? 'ms-Mcs-AdmPwdExpirationTime' \| Measure).Count -gt 0 }` | OUs con LAPS | OU mapping. |
^ad-laps-scope

```powershell
# Per-OU coverage report
Get-ADOrganizationalUnit -Filter * | % {
  $ou = $_.DistinguishedName
  $total = (Get-ADComputer -SearchBase $ou -Filter * -SearchScope OneLevel | Measure).Count
  $laps = (Get-ADComputer -SearchBase $ou -Filter * -SearchScope OneLevel -Pr ms-Mcs-AdmPwdExpirationTime,msLAPS-PasswordExpirationTime |
           Where { $_.'ms-Mcs-AdmPwdExpirationTime' -or $_.'msLAPS-PasswordExpirationTime' } | Measure).Count
  if ($total -gt 0) {
    [PSCustomObject]@{
      OU = $_.Name
      Total = $total
      LAPS  = $laps
      Pct   = "{0:P0}" -f ($laps / $total)
    }
  }
} | Sort Pct
```

___

## LAPSv1 vs LAPSv2 Comparison

| **Aspecto** | **LAPSv1 (legacy)** | **LAPSv2 (Windows LAPS)** |
|:---:|:---:|:---:|
| Schema attrs | `ms-Mcs-AdmPwd*` | `msLAPS-*` |
| Storage | Cleartext en LDAP | Cleartext OR DPAPI-NG encrypted |
| Encryption | No | Sí (default desde Server 2022 / Win11+) |
| Backup target | AD only | AD + Entra ID (cloud) |
| Password history | No | Sí (`msLAPS-EncryptedPasswordHistory`) |
| Min OS | Win Vista (con MSI) | Win11 22H2 / Server 2019+ patched (KB5025229+) |
| Deprecation | EOL — migrate to v2 | Modern recommended |
| Permission attr | `Self+ExtendedRight ms-Mcs-AdmPwd` | `Self+ExtendedRight msLAPS-Password` |
^ad-laps-comparison

___

## Anonymous LAPS Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -b "CN=Schema,CN=Configuration,DC=corp,DC=local" "(\|(name=ms-Mcs-AdmPwd*)(name=msLAPS-*))"` | Schema attrs anónimo | Test (suele blocked). |
| `nxc ldap <DC> -u '' -p '' --query "(name=ms-Mcs-AdmPwd)" "name"` | Quick anonymous test | Quick. |
^ad-laps-anonymous

**Realidad:** schema query anonymous casi siempre bloqueado Win2019+. Auth obligatoria. Si pega = misconfig grave.

***
