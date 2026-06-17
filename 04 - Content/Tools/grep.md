---
aliases:
tags:
  - env/linux
  - technique/discovery
  - tool/grep
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[find]]"
  - "[[Expresiones regulares]]"
---
# Comando `grep`

> [!info] grep (**G**lobal **R**egular **E**xpression **P**rint)
> Busca líneas que matchean una expresión regular en archivos (o stdin) y las imprime. Sintaxis: `grep [opciones] patrón [archivo(s)]`. Sin archivo, lee de stdin (pipes).
^definicion

---

## Cheatsheet

| **Comando**                                             | **Qué obtenés**                             | **Cuándo**                         |
| ------------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `grep -rIn 'password' /var/www /opt /home`              | Recursivo + ignora binarios + nº de línea   | Hunt de credenciales en filesystem |
| `grep -rIn -E 'password\s*=\|api_key\|secret\|token' .` | Secrets por múltiples patrones              | Source code / config               |
| `grep -i 'admin' file`                                  | Case-insensitive                            | No sabés el casing                 |
| `grep -v '#' file \| grep -v '^$'`                      | Excluye comentarios + líneas vacías         | Limpiar config files               |
| `grep -A3 -B1 'error' log`                              | Contexto: 3 líneas after, 1 before          | Análisis de logs                   |
| `grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file`       | Solo el match (IPs)                         | Extraer IOCs/datos                 |
| `grep -l 'pattern' *.md`                                | Solo nombres de archivo con match           | Filtrar qué archivos tocar         |
| `grep -c 'pattern' file`                                | Cuenta de líneas que matchean               | Stats rápidas                      |
| `grep -vx 'pattern' file`                               | Líneas que **no** son exactamente el patrón | Invertir match de línea completa   |
| `... \| grep -vE 'Wrong\|Please enter'`                 | Filtra ruido de un stream                   | Pipes (nc, curl)                   |
^grep-cheatsheet

---

## Flags de Referencia

| Flag | Qué hace |
|---|---|
| `-i` | Case-insensitive |
| `-v` | Invierte: líneas que **no** matchean |
| `-r` / `-R` | Recursivo en directorios (`-R` sigue symlinks) |
| `-I` | Ignora archivos binarios |
| `-n` | Muestra número de línea |
| `-c` | Cuenta líneas que matchean |
| `-o` | Solo la parte que matchea, no la línea entera |
| `-l` | Solo los nombres de archivo con match |
| `-w` | Palabra completa (equiv. a `\b...\b`) |
| `-x` | Línea completa exacta |
| `-A N` / `-B N` / `-C N` | Contexto: N líneas after / before / ambas |
| `-E` | ERE — regex extendida (`+ ? {} () \|` sin escapar) |
| `-P` | PCRE — Perl regex (`\d`, lazy `.*?`, lookarounds) |
^grep-flags

---

## Recon Patterns

```bash
# Hunt de credenciales en filesystem
grep -rIn -E 'password\s*=|api_key|secret\s*=|token' /var/www /opt /home

# Extraer IPs
grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' file

# Extraer emails
grep -oE '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b' file

# Comandos sensibles en bash history
grep -rE 'curl|wget|ssh|nc|mysql' ~/.bash_history /root/.bash_history 2>/dev/null

# Extraer URLs de un dominio (ordenadas, sin duplicar)
grep -oE 'https?://[^"]+inlanefreight\.com[^"]*' | sort -u
```

---

## Regex en grep

Detalle completo en [[Expresiones regulares]]. Lo grep-específico:

| Patrón | Matchea | Nota |
|---|---|---|
| `^inicio` / `final$` | Inicio / fin de línea | Anclas |
| `^inicio.*final$` | Línea que abre y cierra con esos términos | `.*` = cualquier cosa en medio |
| `[0-9]$` | Línea que termina en dígito | Clase de caracteres |
| `[ \t]$` | Línea que termina en espacio o tab | Detectar trailing whitespace |
| `\bword\b` | `word` como palabra completa | Requiere `-P` (PCRE); o usar `-w` |
| `'.*?'` (lazy) | El match más **corto** entre comillas | Requiere `-P`; sin `?` es greedy (captura todo) |
| `[0-9]{3}-[0-9]{3}-[0-9]{4}` | Cuantificadores `{n}` | Requiere `-E` o `-P` |

> Cuantificadores y alternancia (`+ ? {} () |`) necesitan `-E` (ERE). `\d`, `\b`, lazy `.*?` y lookarounds necesitan `-P` (PCRE).
^grep-regex

---

## Notas Relacionadas

- [[find]]
- [[Expresiones regulares]]
- [[Linux PrivEsc - SUID y SGID]]
