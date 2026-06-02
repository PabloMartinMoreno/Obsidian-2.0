---
aliases:
  - AFR
  - File Read Vulnerability
tags:
  - asset/web-app
  - technique/discovery
kind: Concept
linked:
  - "[[LFI - Básico]]"
  - "[[Directory Traversal]]"
  - "[[XML External Entity (XXE)]]"
---
# Arbitrary File Read

> [!info]
> Vulnerabilidad que permite leer cualquier archivo del filesystem del server. Usualmente subset de LFI o subset de XXE/SSRF. Impacto: leak de credenciales, source code, configs, claves privadas.

---

## Vectores típicos

| Vector | Mecanismo | Notas |
|---|---|---|
| **LFI** | `?file=/etc/passwd` | [[LFI - Básico]] |
| **Path traversal** | `?img=../../../../etc/passwd` | [[Directory Traversal]] |
| **XXE** | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` | [[XML External Entity (XXE)]] |
| **SSRF + file://** | `?url=file:///etc/passwd` | [[SSRF - Protocolos Alternativos]] |
| **Template injection** | SSTI con read primitives | [[SSTI - Ejecucion por Engine]] |
| **Open redirect → file://** | Raro pero posible | Combo |
| **API endpoint** | `/api/download?file=../../../etc/passwd` | Backend file ops sin sandbox |
| **Excel/CSV formula** | `=cmd('cat /etc/passwd')` en spreadsheet apps | DDE / Formula injection |

---

## Archivos high-value (Linux)

- `/etc/passwd` — usernames + UIDs (legacy: hashes en `/etc/shadow`)
- `/etc/shadow` — pwd hashes (root-only)
- `/etc/hosts`, `/etc/resolv.conf` — network info
- `/home/<user>/.ssh/id_rsa` — SSH keys
- `/home/<user>/.bash_history` — comandos previos (creds leak)
- `/proc/self/environ` — env vars del proceso web
- `/proc/<pid>/cmdline` — args del proceso
- `/var/www/html/wp-config.php` — WordPress DB creds
- `/var/www/html/.env` — env vars de la app
- Webapp source files (`.php`, `.py`) via PHP filter chains

---

## Archivos high-value (Windows)

- `C:\Windows\System32\drivers\etc\hosts`
- `C:\Windows\repair\SAM`, `SECURITY`, `SYSTEM` (backups)
- `C:\Windows\System32\config\SAM` (live, generalmente locked)
- `C:\inetpub\wwwroot\web.config`
- `C:\Users\<user>\NTUSER.DAT`
- `C:\Windows\Panther\Unattend.xml` (cleartext creds setup)
- IIS logs: `C:\inetpub\logs\LogFiles\W3SVC*\*.log`

---

## Escalation paths

AFR → cred leak → reuse → shell → privesc.
AFR → source disclosure → encontrar otra vuln → RCE.

---

## Notas Relacionadas

- [[LFI - Básico]]
- [[LFI - PHP Wrappers]]
- [[LFI To RCE - Log Poisoning]]
- [[Directory Traversal]]
- [[XML External Entity (XXE)]]
