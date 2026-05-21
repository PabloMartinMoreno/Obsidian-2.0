---
aliases:
  - SearchSploit
  - Exploit-DB CLI
  - exploitdb
tags:
  - type/tool
  - technique/initial-access
  - tool/searchsploit
  - tool/exploit-db
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Pre-Exploitation]]"
tertiary categories:
  - "[[Payloads]]"
kind: Atomic
linked:
  - "[[nmap]]"
  - "[[Metasploit]]"
---
# searchsploit

***

## Cheatsheet
^searchsploit

| Acción | Comando |
| --- | --- |
| **Update DB** | `searchsploit -u` (o `--update`) |
| **Búsqueda básica** | `searchsploit apache 2.4` |
| **Por CVE** | `searchsploit --cve 2021-41773` |
| **Case-sensitive** | `searchsploit -c OpenSSH` |
| **Exact match** | `searchsploit -e "wordpress 5.7.0"` |
| **Título only** | `searchsploit -t "sudo"` |
| **Nmap XML input** | `searchsploit --nmap scan.xml` |
| **Copiar exploit** | `searchsploit -m 50383` (por EDB-ID o path) |
| **Ver exploit** | `searchsploit -x 50383` |
| **URLs Exploit-DB** | `searchsploit -w openssl` |
| **Exclude terms** | `searchsploit linux kernel --exclude="(PoC)\|/dos/"` |
| **Papers mode** | `searchsploit -p apache` |

***

## Concepto

**searchsploit** es CLI para buscar la copia offline de [Exploit-DB](https://www.exploit-db.com/) (repo `exploitdb`). Indispensable en engagements sin internet confiable o para trabajar rápido post-enum sin ir al navegador.

Paquete en Kali: `exploitdb`. Repo manual: `/opt/exploitdb/` o `/usr/share/exploitdb/`.

## 1. Instalación y update

```bash
# Kali (preinstalado)
sudo apt install exploitdb

# Manual (clone + symlink)
git clone https://gitlab.com/exploit-database/exploitdb.git /opt/exploitdb
ln -sf /opt/exploitdb/searchsploit /usr/local/bin/searchsploit

# Update DB (fetches latest exploits + papers)
searchsploit -u
```

Config: `~/.searchsploit_rc` — override paths, enable colors, etc.

## 2. Búsqueda

### Keywords

```bash
# AND lógico — todos los términos deben aparecer
searchsploit apache 2.4.49

# Regex-style (usa POSIX)
searchsploit "openssh 7.[0-5]"

# Stripping automático (ignora versiones minor)
searchsploit --strip apache 2.4.49.1
```

### Filtros refinadores

```bash
# Exacto en título (rechaza fuzzy)
searchsploit -e "Apache 2.4.49"

# Case sensitive
searchsploit -c OpenSSH

# Solo título (ignora autor/type)
searchsploit -t kernel

# Exclude (útil para filtrar DoS / PoCs sin utilidad)
searchsploit linux kernel --exclude="(PoC)|/dos/"

# JSON output (parseo automatizado)
searchsploit -j apache
```

### Por CVE

```bash
searchsploit --cve 2021-41773
searchsploit --cve 2021-41773 --cve 2021-42013
```

## 3. Workflow post-nmap

```bash
# 1. nmap con service detection → XML
nmap -sV -oX scan.xml 10.10.10.5

# 2. Feed a searchsploit
searchsploit --nmap scan.xml

# 3. Salida por servicio detectado
# [i] Possible Exploits:
# Apache 2.4.49 - Path Traversal (CVE-2021-41773) | multiple/webapps/50383.py
```

Combinar con output estructurado:
```bash
searchsploit --nmap scan.xml -j > exploits.json
jq '.RESULTS_EXPLOIT[] | {title: .Title, path: .Path}' exploits.json
```

## 4. Inspeccionar / copiar exploits

```bash
# Ver código del exploit en terminal (no abre editor)
searchsploit -x 50383
searchsploit -x multiple/webapps/50383.py

# Copiar al CWD (para editar sin tocar DB)
searchsploit -m 50383
# → copia 50383.py al directorio actual

# Mirror completo (exploit + binaries adjuntos)
searchsploit -m 50383 -o /tmp/exploit-workdir
```

El path relativo corresponde a `/usr/share/exploitdb/exploits/<path>`. Binarios adjuntos viven en `/usr/share/exploitdb/exploits/<path>-*.zip` si existen.

## 5. Papers (whitepapers)

```bash
searchsploit -p wordpress
# Busca en /usr/share/exploitdb/papers/
```

Papers son writeups / research PDFs — útil para entender clase de vuln antes de adaptar PoC.

## 6. URLs online (cuando sí hay internet)

```bash
# Mostrar URLs Exploit-DB además de paths locales
searchsploit -w apache
# https://www.exploit-db.com/exploits/50383
```

## 7. Filtrado rápido (common patterns)

```bash
# Solo Windows privesc
searchsploit windows/local | grep -v "dos\|denial"

# Kernel Linux specific
searchsploit linux kernel 4.4 --exclude="(PoC)|/dos/"

# RCE web específico
searchsploit wordpress plugin rce

# SUID privesc shortcut
searchsploit sudo privilege escalation
```

## 8. Integración con otras tools

| Tool | Combinación |
| --- | --- |
| **nmap** | `searchsploit --nmap scan.xml` |
| **Metasploit** | Copiar PoC → `msfconsole` → `use exploit/multi/handler` para catch shell. |
| **AutoRecon** | AutoRecon corre searchsploit automático sobre servicios enumerados. |
| **nuclei** | Complementa — searchsploit = PoC code, nuclei = templated scans. |

## 9. Gotchas

- **DB desactualizada**: `searchsploit -u` regularmente. Kali package a veces atrasado vs upstream git.
- **False positives** en `--nmap`: matchea por service name + version string literal, puede dar PoCs no aplicables al build exacto.
- **Exploit modifications**: muchos PoCs requieren editar IP/port/payload antes de correr — siempre `-m` (copy) y `-x` (review) antes de ejecutar.
- **Compilados**: algunos PoCs viejos son C para glibc antigua — compilar con `-m32` / `-static` o actualizar headers.

## 10. Organización del repo

```
/usr/share/exploitdb/
├── exploits/        # PoCs por OS/type
│   ├── linux/
│   ├── windows/
│   ├── multiple/
│   └── ...
├── shellcodes/      # Raw shellcodes
├── papers/          # Research / writeups
└── files_exploits.csv   # Index
```

## Recursos

- [Exploit-DB](https://www.exploit-db.com/)
- [exploitdb GitLab](https://gitlab.com/exploit-database/exploitdb)
- [searchsploit wiki](https://www.exploit-db.com/searchsploit)

***
