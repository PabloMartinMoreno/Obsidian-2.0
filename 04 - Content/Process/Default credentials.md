---
aliases:
  - Default Credentials
  - Credenciales por defecto
tags:
  - estado/completo
  - technique/credential-access
  - cred/brute-force
kind: Technique
linked:
  - "[[Creds]]"
  - "[[Password Reuse]]"
---
# Default credentials

> [!info]
> Credenciales de fábrica/instalación que admins no cambian. Primer check rápido contra cualquier servicio expuesto. Listas públicas extensas — checkeo low-cost, high-reward.

***

## Targets típicos

| Servicio | Default común | Notas |
|---|---|---|
| **Tomcat Manager** | `tomcat:tomcat`, `admin:admin`, `admin:password` | Después PUT WAR file para RCE |
| **Jenkins** | sin auth si exposed, o `admin:admin` | Script Console → RCE |
| **Jira/Confluence** | `admin:admin` con installer skipped | Plugins exploit |
| **GitLab** | `root:5iveL!fe` (legacy) | Default root pre-setup |
| **MSSQL** | `sa` con pwd vacía o `sa:sa` | xp_cmdshell → RCE |
| **MySQL/MariaDB** | `root` sin pwd local | Bind a `0.0.0.0` |
| **MongoDB** | sin auth pre-3.6 | Dump direct |
| **Redis** | sin auth | `CONFIG SET dir` → SSH key write |
| **Elasticsearch** | sin auth pre-X-Pack | Direct query/dump |
| **PRTG** | `prtgadmin:prtgadmin` | RCE notification |
| **Splunk** | `admin:changeme` | RCE via apps |
| **Jenkins/Tomcat/etc.** | Listas oficiales por vendor |  |
| **Printers** | `admin:admin`, `admin:1234` | PJL abuse |
| **Routers** | vendor-specific | `routersploit` |
| **IPMI/iLO/iDRAC** | `ADMIN:ADMIN`, `root:calvin` | RAKP hash, IPMI 2.0 anon |
| **SSH** | `root:root`, `root:toor`, `pi:raspberry` | Pi/IoT |

***

## Tools

```bash
# creds — busca defaults por servicio
creds <service>

# nmap default creds scripts
nmap --script=http-default-accounts <target>
nmap --script=ssh-brute --script-args userdb=users.txt,passdb=passwords.txt <target>

# hydra con SecLists default credentials
hydra -C SecLists/Passwords/Default-Credentials/<vendor>.txt <target> <service>
```

***

## Wordlists

- `SecLists/Passwords/Default-Credentials/` — split por vendor
- `routersploit` DB
- DefaultCreds-cheat-sheet (GitHub)
- CIRT.net database

***

## Notas Relacionadas

- [[Creds]]
- [[Password Reuse]]
- [[HTTP Brute Forcing]]
