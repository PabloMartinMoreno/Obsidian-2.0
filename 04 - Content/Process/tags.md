---
aliases:
  - Taxonomía
  - Tag Schema
tags:
  - meta/reference
---

# Categorías y tags canónicos del vault

> Estado: post-cleanup 2026-05-18. Refleja taxonomía real (no aspiracional).

## type/ — Forma de la nota

| Tag | Uso |
|---|---|
| `type/moc/primary` | Categoría principal (Red Team, Blue Team, Cloud Security, Cryptography, Development, Reporting) |
| `type/moc/secondary` | Sub-categoría (AD, Information Gathering, Lateral Movement, etc.) |
| `type/moc/tertiary` | Sub-sub-categoría (Web Explotación, AD Enumeración, etc.) |
| `type/moc` | MOC nivel-contenido (4th — agrupa sub-notas de un tema, ej: Web Technology Enumeration) |
| `type/cheatsheet` | Hub con tabs y embeds de sub-notas (patrón SQLi/SSI/etc.) |
| `type/concept` | Definición/explicación abstracta |
| `type/technique` | Técnica MITRE-style (Pass-the-Hash, NTLM Relay, AMSI Bypass) |
| `type/tool` | Herramienta (nmap, ffuf, mimikatz, evil-winrm) |
| `type/vulnerability` | Clase de vulnerabilidad (SQLi, XSS, SSI) |
| `type/writeup` | Solución de máquina/lab |
| `type/playbook` | Procedimiento secuencial (CheckList AD Compromise) |
| `type/payload` | Payload reutilizable (Evil Macro, PrivEsc Payloads) |
| `type/command` | Doc de un comando individual (host, nslookup, Bash) |
| `type/sub-command` | Invocación específica de un comando (Curl - Fuzzing Parámetros) |

## technique/ — MITRE ATT&CK tactic

- `technique/recon/active` — Activo (scanning, enum)
- `technique/recon/passive` — OSINT
- `technique/initial-access` — Foothold inicial
- `technique/execution` — Ejecución de código
- `technique/persistence` — Persistencia
- `technique/privilege-escalation` — Escalada
- `technique/defense-evasion` — Evasión
- `technique/credential-access` — Robo de credenciales
- `technique/discovery` — Discovery post-foothold
- `technique/lateral-movement` — Movimiento lateral
- `technique/collection` — Recolección de datos
- `technique/exfiltration` — Exfiltración
- `technique/impact` — Impacto final
- `technique/command-and-control` — C2
- `technique/post-exploitation` — Post-exploit genérico
- `technique/kerberos` — Específico Kerberos

## tool/ — Herramientas

`tool/nmap`, `tool/bloodhound`, `tool/mimikatz`, `tool/impacket`, `tool/responder`, `tool/burpsuite`, etc.

## asset/ — Tipo de objetivo

`asset/web-app`, `asset/api`, `asset/active-directory`, `asset/database`, `asset/network`, `asset/dns`, `asset/cloud`, etc.

## service/ — Servicio específico

`service/http`, `service/smb`, `service/ssh`, `service/ad-cs`, `service/kerberos`, `service/wordpress`, etc.

## vuln/ — Vulnerabilidad

`vuln/sqli`, `vuln/xss`, `vuln/ssrf`, `vuln/lfi`, `vuln/xxe`, `vuln/csrf`, `vuln/oauth`, etc.

## cred/ — Credenciales

`cred/ntlm`, `cred/kerberos`, `cred/jwt`, `cred/password-cracking`, etc.

## env/ — Entorno

`env/windows`, `env/linux`, `env/active-directory`, `env/cloud-aws`, `env/cloud-azure`, `env/cloud-gcp`

## cert/ — Certificación relacionada

`cert/oscp`, `cert/cbbh`, `cert/cdsa`

## estado/ — Estado de completitud

- `estado/completo` — Nota terminada
- `estado/incompleto` — Nota WIP

## meta/ — Metadata

- `meta/index` — Página índice
- `meta/checklist` — Checklist
- `meta/reference` — Referencia externa
- `meta/ctf` — Contexto CTF/learning

## Convenciones

- Tags multi-valor: una nota puede tener múltiples tags de diferentes namespaces.
- Una nota debería tener UN `type/` principal.
- Kebab-case: `service/ad-cs` no `service/adcs`.
- Lowercase: Obsidian normaliza automáticamente.
- Evitar tags flat sin namespace (ej: `ssh` → `service/ssh`).

## Templates

Ver [00 - Resources/Templates/Type/](00%20-%20Resources/Templates/Type/) para skeleton de cada `type/`.
