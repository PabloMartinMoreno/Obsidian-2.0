---
aliases:
tags:
  - tool/smbmap
  - service/smb
kind: Tool
linked:
  - "[[SMB (139, 445) - Enumeración]]"
  - "[[smbclient]]"
---
# smbmap

> [!info]
> Enum SMB shares + permisos + spider. Alternativa más conveniente que smbclient para recon masivo.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `smbmap -H <target>` | Listar shares + permisos (anonymous) | Recon inicial |
| `smbmap -H <target> -u <user> -p <pass>` | Listar shares autenticado | Post-creds |
| `smbmap -H <target> -u <user> -p <pass> -d <domain>` | Con dominio AD | Workgroup vs domain |
| `smbmap -H <target> -u <user> -p <pass> -R <share>` | Recursive listing del share | Spider |
| `smbmap -H <target> -u <user> -p <pass> -R <share> --depth 5` | Limit recurse depth | Shares grandes |
| `smbmap -H <target> -u <user> -p <pass> --download '<share>/path/file'` | Download archivo | Exfil |
| `smbmap -H <target> -u <user> -p <pass> --upload <local> <share>/<remote>` | Upload archivo | Drop webshell |
| `smbmap -H <target> -u <user> --pw-nt-hash <NThash>` | Pass-the-Hash | Lateral movement |
| `smbmap -u <user> -p <pass> -d <domain> --host-file targets.txt` | Múltiples targets | Spray |

***

## Permission strings

- `READ ONLY` — listable + readable
- `READ, WRITE` — full access
- `NO ACCESS` — sin permisos
- `(none)` — share oculto / sin acceso conocido

***

## Workflow típico

```bash
# 1. Enum shares anonymous
smbmap -H <target> -u 'guest' -p ''

# 2. Si encontrás algún READ accessible, spider
smbmap -H <target> -u 'guest' -p '' -R <share> --depth 3

# 3. Buscar files interesantes
smbmap -H <target> -u 'guest' -p '' -R <share> -A '.*\\.(conf|cfg|ini|txt|xml|sql|bak)$'

# 4. Download
smbmap -H <target> -u 'guest' -p '' --download '<share>/path/file.txt'
```

***

## Notas Relacionadas

- [[SMB (139, 445) - Enumeración]]
- [[smbclient]]
- [[Spidering SMB Shares]]
- [[netexec]]
