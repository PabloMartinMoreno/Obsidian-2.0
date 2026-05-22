---
aliases:
  - "FTP Exploitation Techniques"
  - "ProFTPD 1.3.3c Exploit"
  - "vsftpd 2.3.4 Exploit"
tags:
  - estado/completo
  - tool/ftp
  - service/ftp
kind: Tool
linked:
  - "[[FTP (21) - Enumeración]]"
---
# ftp

> [!info]
> Cliente FTP CLI. En pentest: dump anonymous shares, upload de webshells, recon de filesystem expuesto. Puerto default 21 (control), 20 (data).

***

## Conexión

```bash
# Anonymous
ftp <target>
# Usuario: anonymous, password: cualquiera (a veces email)

# Auth con creds
ftp -u <user> <target>
```

***

## Comandos intra-sesión

```
ls / dir          # listar
cd <dir>          # navegar
pwd               # path actual
get <file>        # download
mget *.txt        # download multiple
put <file>        # upload
mput *            # upload multiple
binary            # modo binario (importante para no corromper archivos)
ascii             # modo texto
passive / pasv    # modo pasivo (cliente abre data port)
prompt off        # sin prompt en mget/mput
recv <remote> <local>  # download con rename
quit              # exit
```

***

## Wget/curl alternatives

```bash
# Wget recursive
wget -r --user=anonymous --password=anon ftp://<target>/

# Curl
curl ftp://<target>/ -u anonymous:anon

# Download single file
curl -O ftp://<target>/file.txt -u anonymous:anon

# Upload via curl
curl -T file.txt ftp://<target>/ -u user:pass
```

***

## Vectores típicos

- **Anonymous read**: leer files públicos sin auth
- **Anonymous write**: subir webshell a webroot mapeado
- **Cleartext credentials**: sniff en LAN (FTP no cifrado)
- **Bounce attack**: PORT command para scan via FTP server
- **Brute force**: hydra, medusa contra `21/tcp`

***

## Notas Relacionadas

- [[FTP (21) - Enumeración]]
- [[File Transfers]]
