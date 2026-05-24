---
aliases: null
tags:
  - type/concept
  - vuln/command-injection
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Prevención

***

## Secure Coding (nivel aplicación)

| **Código safe** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `subprocess.run(['ping', '-c', '1', host])` (Python, lista de args) | No shell — args pasados como array, no concatenados | Reemplazo de `os.system(f'ping {host}')`. |
| `child_process.execFile('ping', ['-c', '1', host])` (Node.js) | No shell, args separados | Reemplazo de `exec()` con string. |
| `Runtime.getRuntime().exec(new String[]{"ping","-c","1",host})` (Java) | Array form — no parsea shell metacharacters | Reemplazo de `exec(stringConcat)`. |
| `filter_var($ip, FILTER_VALIDATE_IP)` (PHP) | Valida formato IP — devuelve `false` si no es | Validación de input pre-uso. |
| `if (!preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $ip)) die();` | Regex strict — solo IPv4 dotted-quad | Whitelist > blacklist. |
| `preg_replace('/[^A-Za-z0-9.]/', '', $var)` (PHP) | Strip chars no-alfanuméricos | Saneamiento defensivo (última línea). |
| `fsockopen($host, 80)` en vez de `system("ping $host")` | API nativa que no invoca shell | Replace de uso de shell cuando sea posible. |
^ci-prev-app

## Server Hardening

| **Config** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `User www-data` (Apache/nginx) | Web server corre con privs mínimos | Limita daño post-RCE. |
| `disable_functions = system,exec,shell_exec,passthru,popen,proc_open` (php.ini) | Bloquea funciones peligrosas a nivel PHP | Defense-in-depth para apps PHP legacy. |
| `open_basedir = /var/www/html` (php.ini) | Sandbox de filesystem para PHP | Evita lectura de `/etc/passwd` post-RCE. |
| `seccomp` / AppArmor / SELinux profile | LSM bloquea syscalls/paths a nivel kernel | Hardening profundo. |
| `chroot` / containerización (Docker) | Isolation del proceso web | Reduce blast radius. |
| ModSecurity con OWASP CRS | WAF con reglas anti-CI | Detección perimetral. |
| Reject double-encoding / non-ASCII en URL rules | Bloquea bypasses obvios | Layer adicional sobre WAF. |
^ci-prev-server

### Orden correcto en código

```python
# 1. VALIDAR (¿formato esperado?)
if not re.match(r'^(\d{1,3}\.){3}\d{1,3}$', host):
    raise ValueError("Invalid IP format")

# 2. SANEAR (defense-in-depth)
host = re.sub(r'[^0-9.]', '', host)

# 3. EJECUTAR con API segura (no shell)
result = subprocess.run(
    ['ping', '-c', '1', host],
    capture_output=True,
    timeout=5,
    check=False,
)
```

### Antipatrones (NO hacer)

```python
# ❌ Concatenación + shell
os.system(f"ping {host}")
os.system("ping " + host)

# ❌ shell=True con f-string
subprocess.run(f"ping {host}", shell=True)

# ❌ Blacklist incompleta (siempre bypasseable)
if ';' in host or '&' in host:
    pass  # falta `|`, `\n`, $(), backticks, etc.

# ❌ Confiar solo en WAF
# El WAF puede bypassearse — la validación tiene que estar en backend también.
```

### Mitigación capa por capa

| Capa | Control |
|---|---|
| **Input** | Whitelist (regex strict) + type validation. |
| **Processing** | API que no use shell (array args, parameterized). |
| **Runtime** | Least privilege user, disabled dangerous functions. |
| **Filesystem** | chroot/open_basedir/AppArmor — contener si falla todo lo anterior. |
| **Network** | WAF con reglas anti-CI + egress filtering (server no debe poder reverse shell). |

---
