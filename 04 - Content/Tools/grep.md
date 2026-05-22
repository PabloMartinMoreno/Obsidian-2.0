---
aliases:
tags:
  - estado/completo
  - tool/grep
kind: Tool
linked:
---
# grep

> [!info]
> Búsqueda por regex en texto. En pentest: filtrar output, hunt credenciales en filesystem, parse logs, extraer patrones.

***

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `grep -r 'password' /var/www` | Recursive search | Hunt credentials en webroot |
| `grep -rIn 'api_key' .` | Recursive + ignore binary + show line nums | Secrets en source code |
| `grep -E 'pattern1\|pattern2' file` | OR regex extendido | Múltiples patrones |
| `grep -v '#' file \| grep -v '^$'` | Excluir comentarios + líneas vacías | Limpiar config files |
| `grep -A 3 -B 1 'error' log` | Contexto: 3 líneas after, 1 before | Análisis logs |
| `grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file` | Solo match (sin línea completa) | Extraer IPs |
| `grep -l 'pattern' *.md` | Solo nombres de archivo matched | Filtrar archivos |
| `grep -c 'pattern' file` | Contar matches | Stats |

***

## Recon patterns útiles

```bash
# Hunt credentials en filesystem
grep -rIn -E 'password\s*=|api_key|secret\s*=|token' /var/www /opt /home

# Extract IPs
grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file

# Extract emails
grep -oE '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' file

# Buscar en bash history
grep -rE 'curl|wget|ssh|nc' ~/.bash_history /root/.bash_history 2>/dev/null
```

***

## Notas Relacionadas

- [[find]]
- [[Linux PrivEsc - SUID y SGID]]
