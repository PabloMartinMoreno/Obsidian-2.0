---
aliases:
tags:
  - tool/smbclient
  - service/smb
kind: Tool
linked:
  - "[[SMB (139, 445) - Enumeración]]"
  - "[[Spidering SMB Shares]]"
---
# smbclient

> [!info]
> Cliente SMB CLI estilo FTP. Listar shares, navegar, download/upload, ejecución de comandos. Bundle Samba.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `smbclient -L //<target> -N` | Listar shares anonymous (null session) | Recon inicial |
| `smbclient -L //<target> -U <user>` | Listar shares autenticado | Post-creds |
| `smbclient //<target>/<share> -N` | Acceder share anonymous | Acceso público |
| `smbclient //<target>/<share> -U <user>%<pass>` | Acceder autenticado | Estándar |
| `smbclient //<target>/<share> -U <user> --pw-nt-hash <NThash>` | Pass-the-Hash | [[Pass-the-Hash - SMB Lateral]] |
| `smbclient //<target>/IPC$ -U <user>%<pass>` | Acceso IPC | Enum/ataques RPC |

***

## Sesión interactiva (comandos)

```
smb: \> ls           # listar contenido
smb: \> get <file>   # descargar
smb: \> put <file>   # subir
smb: \> cd <dir>     # navegar
smb: \> pwd          # path actual
smb: \> mget *.txt   # download multiple
smb: \> recurse ON   # modo recursivo
smb: \> prompt OFF   # no prompt en mget/mput
```

***

## Recon flow

```bash
# 1. Discovery shares
smbclient -L //<target> -N
smbclient -L //<target> -U guest -N

# 2. Verificar accesos anonymous
for share in IPC$ ADMIN$ C$ NETLOGON SYSVOL; do
  echo "[*] $share"
  smbclient //<target>/$share -N -c 'ls' 2>&1 | head -5
done

# 3. Descargar share completo
smbclient //<target>/share -N -c 'recurse;prompt;mget *'
```

***

## Notas Relacionadas

- [[SMB (139, 445) - Enumeración]]
- [[Spidering SMB Shares]]
- [[Interacting with SMB from Windows]]
- [[Pass-the-Hash - SMB Lateral]]
- [[netexec]]
