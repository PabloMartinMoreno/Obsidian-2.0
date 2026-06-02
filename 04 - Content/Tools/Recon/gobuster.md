---
aliases:
  - GoBuster
tags:
  - tool/gobuster
  - technique/enumeration
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Tool
linked:
  - "[[Directory Fuzzing]]"
  - "[[Subdomain & VHost Fuzzing]]"
  - "[[Parameter Fuzzing]]"
  - "[[ffuf]]"
  - "[[feroxbuster]]"
---
# gobuster

---

## Cheatsheet

| Modo | Comando |
| --- | --- |
| **dir** | `gobuster dir -u http://host/ -w wordlist.txt -x php,html,js -t 50` |
| **vhost** | `gobuster vhost -u http://host -w vhosts.txt --append-domain -t 200` |
| **dns** | `gobuster dns -d dom.local -w subs.txt --no-error` |
| **fuzz** | `gobuster fuzz -u 'http://host/page.php?FUZZ=v' -w params.txt -b 0` |
| **s3** | `gobuster s3 -w bucketnames.txt` |
| **gcs** | `gobuster gcs -w bucketnames.txt` |

---

## Concepto

Brute-forcer Go — rápido, single-binary, no recursivo (usar [[feroxbuster]] si hace falta recursión).

Modos: `dir` (paths HTTP), `vhost` (Host header), `dns` (subdomains), `fuzz` (FUZZ genérico), `s3`/`gcs` (buckets).

## 1. Fuzzing de directorios y archivos

| Comando | Descripción |
| --- | --- |
| `gobuster dir -u http://host/ -w wordlist.txt` | Básico — wordlist única, sin extensiones. |
| `gobuster dir -u http://host/ -w wordlist.txt -x php,html,js,txt,bak` | Con extensiones (`-x` csv). |
| `gobuster dir -u http://host/FUZZ.php -w filenames.txt` | Extensión fija (template-style con ffuf-like `FUZZ`). |
| `gobuster dir -u http://host/ -w w.txt -s 200,204,301,302,307,403` | Whitelist status codes (`-s`). |
| `gobuster dir -u http://host/ -w w.txt -b 404,500` | Blacklist status codes (`-b`). |
| `gobuster dir -u http://host/ -w w.txt -k` | Ignorar cert TLS inválido. |
| `gobuster dir -u http://host/ -w w.txt -c 'session=ABC'` | Cookie auth. |
| `gobuster dir -u http://host/ -w w.txt -H 'Authorization: Bearer X'` | Header custom. |
| `gobuster dir -u http://host/ -w w.txt -U user -P pass` | Basic auth. |
| `gobuster dir -u http://host/ -w w.txt -e` | Expanded mode — print full URL. |
^gobuster-fuzzing-directorios

gobuster no recurse por defecto. Para recursión → [[feroxbuster]] o script chain.

## 2. Fuzzing de parámetros

| Comando | Contexto |
| --- | --- |
| `gobuster fuzz -u 'http://host/admin.php?FUZZ=test' -w params.txt -t 50` | GET — param name discovery. |
| `gobuster fuzz -u 'http://host/admin.php' -w params.txt --method POST --data 'FUZZ=test' -H 'Content-Type: application/x-www-form-urlencoded' -t 50` | POST — body param name. |
| `gobuster fuzz -u 'http://host/page.php?id=FUZZ' -w values.txt -b 0` | Value fuzzing — baseline filter con `-b` (exclude size). |
| `gobuster fuzz -u 'http://host/FUZZ' -w paths.txt --exclude-length 1234` | Exclude length-filter manual. |
^gobuster-fuzzing-parametros

Filtros (flags `-b length,length2`) son críticos — sin ellos, output trivial.

## 3. Virtual host discovery

```bash
gobuster vhost -u http://target.com -w vhosts.txt --append-domain -t 200
# --append-domain concatena: word.target.com
```

| Opción | Uso |
| --- | --- |
| `--append-domain` | `{word}.target.com` en vez de solo `{word}`. |
| `--exclude-length 1234` | Filtrar respuestas de ese size (wildcard default). |
| `--domain target.com` | Baseline domain explícito. |
^gobuster-enum-vhost

## 4. DNS subdomain enum

```bash
gobuster dns -d target.com -w subs.txt --no-error -t 50

# Wildcard check + show IPs
gobuster dns -d target.com -w subs.txt -i --wildcard
```

| Opción | Uso |
| --- | --- |
| `-d` | Domain target. |
| `-r` | Custom resolver DNS (`-r 1.1.1.1:53`). |
| `-i` | Mostrar IPs resueltas. |
| `--wildcard` | Permitir wildcards (default excluye). |
| `--no-error` | Silenciar errores DNS. |

## 5. S3 / GCS bucket enum

```bash
# AWS S3
gobuster s3 -w bucket-names.txt -t 50

# GCP GCS
gobuster gcs -w bucket-names.txt
```

Output incluye status (public/forbidden/not-found).

## 6. Tips opsec / performance

- `-t 50` default razonable; `-t 200` agresivo (WAF-prone).
- `--delay 200ms` rate-limit para evadir detection.
- `-o output.txt` guardar resultados.
- `--no-progress` para scripting.
- `-z` quiet mode (sin banner).
- Gobuster **no** soporta HTTP/2, rate-limiting adaptativo, ni recursión — si hace falta, usar [[ffuf]] o [[feroxbuster]].

## Comparativa

| Feature | gobuster | [[ffuf]] | [[feroxbuster]] |
| --- | --- | --- | --- |
| Velocidad | Alta | Muy alta | Muy alta |
| Recursión | No | Manual | **Sí (default)** |
| Filtros (matchers) | Básicos | **Avanzados** | Medios |
| Modos pitchfork/clusterbomb | No | **Sí** | No |
| Subdomain DNS | **Sí** | Con wordlist | No |
| Bucket enum (S3/GCS) | **Sí** | No | No |

## Recursos

- [gobuster GitHub](https://github.com/OJ/gobuster)

---
