---
aliases:
tags:
  - tool/githack
kind: Tool
linked:
  - "[[git-dumper]]"
  - "[[git]]"
---
# githack

> [!info]
> Tool Python para reconstruir source code desde `.git/` directory expuesto. Alternativa a git-dumper, soporta múltiples threads.

***

## Uso

```bash
# Clone
git clone https://github.com/BugScanTeam/GitHack.git
cd GitHack

# Run
python GitHack.py http://target/.git/

# Output en dist/<target>/
```

Reconstruye:
- Source files
- Commit history
- Config + remote URLs

***

## Workflow post-dump

```bash
cd dist/target/

# Buscar credentials en history
git log -p --all -Spassword
git log -p --all -Sapi_key
git log -p --all -Ssecret

# Ver branches
git branch -a

# Stashes (a veces tienen secrets dropped)
git stash list
git stash show -p

# Mostrar archivos borrados
git log --all --diff-filter=D --name-only
```

***

## Alternativas

- [[git-dumper]] — más maduro, default choice
- `dumper` (Ruby)
- Manual via curl: `curl -s http://target/.git/HEAD` + reconstruct refs

***

## Notas Relacionadas

- [[git]]
- [[git-dumper]]
- [[GitHub Dorking]]
- [[GitLab Enumeration]]
