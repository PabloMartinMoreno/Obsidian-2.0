---
aliases:
tags:
  - technique/recon/active
  - asset/web-app
  - tool/git
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Tool
linked:
  - "[[git-dumper]]"
---
# git

> [!info] git
> Sistema de control de versiones distribuido. En **pentest** es un objetivo de recon: un directorio `.git/` expuesto en un servidor web permite reconstruir el código fuente y **buscar secretos en el historial de commits** (passwords, API keys, tokens borrados pero presentes en commits viejos).
^definicion

---

## Cheatsheet (Recon)

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `git clone http://target/.git` | Clona el repo si hay directory listing | `.git/` accesible vía HTTP |
| `git log --all --oneline` | Histórico de commits | Buscar credenciales en commits viejos |
| `git log -p --all -S<keyword>` | Busca en los diffs por keyword | Hunt secrets (`password`, `api_key`, `token`) |
| `git show <hash>` | Ver un commit puntual | Auditoría |
| `git diff <h1> <h2>` | Diff entre commits | Cambios entre versiones |
| `git branch -a` | Todas las branches (local + remoto) | Dev/staging branches |
| `git stash list` + `git stash show -p <n>` | Cambios en stash | A veces traen secretos |
^git-cheatsheet

---

## Recon de Repos Expuestos

```bash
# Detectar .git/ expuesto
curl -s http://target/.git/HEAD
curl -s http://target/.git/config

# Dump completo (aunque no haya directory listing)
git-dumper http://target/.git/ output/

# Análisis post-dump: hunt de secrets en TODO el historial
cd output
git log --all --oneline
git log -p --all -Spassword
git log -p --all -Sapi_key
```

Extracción automática: [[git-dumper]].

---

## Comandos Básicos (referencia)

| **Comando** | **Qué hace** |
|---|---|
| `git init` | Inicializa un repo |
| `git clone <url>` | Copia local de un repo remoto |
| `git status` | Estado de los archivos |
| `git add <file>` / `git add .` | Stage de cambios |
| `git commit -m "msg"` | Guarda un snapshot |
| `git log` | Historial de commits |
| `git checkout -b <rama>` / `git checkout <rama>` | Crea / cambia de rama |
| `git merge <rama>` | Fusiona una rama en la actual |
| `git branch` / `git branch -d <rama>` | Lista / elimina ramas |
| `git push origin <rama>` / `git pull` | Sube / baja cambios del remoto |

---

## Notas Relacionadas

- [[git-dumper]]
- [[GitHub Dorking]]
- [[GitLab Enumeration]]
