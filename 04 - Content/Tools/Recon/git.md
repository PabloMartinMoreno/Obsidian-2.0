---
aliases:
tags:
  - estado/completo
  - tool/git
kind: Tool
linked:
  - "[[git-dumper]]"
---
# git

> [!info]
> Sistema de control de versiones. En pentest: enumeración de repos expuestos (`.git/`), recuperación de source code, análisis de history para credenciales.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `git clone http://target/.git` | Clonar repo expuesto si listing activo | `.git/` accesible vía HTTP |
| `git log --all --oneline` | Histórico commits | Buscar credenciales en commits viejos |
| `git log -p --all -S<keyword>` | Buscar en diffs por keyword | Hunt secrets (password, api_key, token) |
| `git show <hash>` | Ver commit específico | Auditoría puntual |
| `git diff <hash1> <hash2>` | Diff entre commits | Cambios entre versiones |
| `git branch -a` | Listar todas branches (local + remote) | Buscar dev/staging branches |
| `git stash list` + `git stash show -p <n>` | Cambios stashed | A veces contienen secretos |

***

## Recon de repos expuestos

```bash
# Detectar .git/ expuesto
curl -s http://target/.git/HEAD
curl -s http://target/.git/config

# Dump completo
git-dumper http://target/.git/ output/

# Análisis post-dump
cd output
git log --all --oneline
git log -p --all -Spassword
git log -p --all -Sapi_key
```

Ver [[git-dumper]] para extracción automática.

***

## Notas Relacionadas

- [[git-dumper]]
- [[GitHub Dorking]]
- [[GitLab Enumeration]]
