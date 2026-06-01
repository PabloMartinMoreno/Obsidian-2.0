---
aliases:
tags:
  - tool/xargs
kind: Tool
---
# xargs

> [!info]
> Construye y ejecuta comandos pasando stdin como argumentos. Esencial para chains: `find | xargs grep`, `cat list | xargs nmap`, etc.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `find . -name '*.log' \| xargs grep 'error'` | Grep en múltiples files | Chain básico |
| `find . -name '*.log' -print0 \| xargs -0 grep 'error'` | Idem con null delim | Filenames con espacios |
| `cat ips.txt \| xargs -I {} curl http://{}/` | Sustituir token | Per-item command |
| `cat ips.txt \| xargs -P 10 -I {} nmap -sV {}` | Paralelizar 10 jobs | Recon masivo |
| `cat hashes.txt \| xargs -L 1 hashid` | Una arg per ejecución | Tools que no aceptan stdin |
| `find /var/log -name '*.gz' \| xargs -n 1 zcat` | Procesar uno a uno | Stream |
| `echo 'one two three' \| xargs -n 1` | Split args | Convertir args en lines |
| `cat creds.txt \| xargs -I{} sh -c 'curl -u {} http://target/'` | Shell wrap | Multi-arg compleja |

***

## Patterns útiles

```bash
# Parallel port scan
cat ips.txt | xargs -P 20 -I {} nmap -p- --open {}

# Mass curl GET
cat urls.txt | xargs -P 10 -I {} curl -s -o /dev/null -w "%{http_code} {}\n" {}

# Mass cred test SMB
cat ips.txt | xargs -P 10 -I {} netexec smb {} -u admin -p 'Spring2024!'

# Delete tons of files safely
find . -name '*.tmp' -print0 | xargs -0 rm -v

# Encode list of strings en base64
cat list.txt | xargs -I {} sh -c 'echo -n "{}" | base64'
```

***

## Notas Relacionadas

- [[grep]]
- [[find]]
- [[awk]]
