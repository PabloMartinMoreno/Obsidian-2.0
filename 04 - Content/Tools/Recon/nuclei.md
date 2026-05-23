---
aliases:
tags:
  - estado/completo
  - tool/nuclei
kind: Tool
linked:
---
# nuclei

> [!info]
> Template-based vulnerability scanner. Templates en YAML, 4000+ comunidad. Fast, customizable.

## Cheatsheet

| Comando | Qué obtenés |
|---|---|
| `nuclei -u http://target` | Scan default templates |
| `nuclei -l targets.txt` | Multiple targets |
| `nuclei -t cves/ -u http://target` | Solo CVEs |
| `nuclei -t exposures/ -u http://target` | Hunt configs/leaks |
| `nuclei -t technologies/ -u http://target` | Tech fingerprint |
| `nuclei -tags rce,sqli` | Filtro por tags |
| `nuclei -severity critical,high` | Solo críticos |
| `nuclei -u http://target -o results.txt -json` | Output JSON |

## Templates útiles

- `cves/` — CVEs verificables remotamente
- `exposures/` — files/dirs sensibles
- `default-logins/` — creds default
- `misconfigurations/` — headers, CORS, etc.
- `panels/` — admin panels
- `technologies/` — tech detect

## Update templates

```bash
nuclei -update-templates
```

## Notas Relacionadas
- [[searchsploit]]
- [[Web Technology Enumeration]]
