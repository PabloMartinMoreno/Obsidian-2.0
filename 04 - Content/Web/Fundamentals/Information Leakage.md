---
aliases:
  - "Sensitive Information Exposure"
  - "Finding out the PIN (Werkzeug Debugger)"
  - "Source Code Disclosure"
  - ".ds_store"
  - Info Disclosure
  - Information Disclosure
tags:
  - estado/completo
  - asset/web-app
  - technique/discovery
kind: Concept
linked:
  - "[[Fingerprinting Web Technologies]]"
  - "[[GitHub Dorking]]"
  - "[[Google Dorking]]"
  - "[[LDAP Injection - Info Disclosure y Blind]]"
---
# Information Leakage

> [!info]
> Exposición no intencional de información sensible que asiste al atacante en fase de recon o explotación. Rara vez crítica por sí sola — combustible para otros ataques.

***

## Resumen

Cualquier output del sistema que revele detalles sobre stack, paths internos, versiones, credenciales, lógica de negocio, datos PII, etc. Útil para:
- Construir wordlist específica del target.
- Identificar CVEs conocidos.
- Bypass de validaciones via conocimiento del backend.

***

## Vectores comunes

| Fuente | Qué se filtra | Notas |
|---|---|---|
| **Error messages** | Stack trace, paths, queries SQL | [[SSTI - Deteccion y Fingerprinting]] |
| **HTTP headers** | Server, X-Powered-By, framework versions | [[Fingerprinting Web Technologies]] |
| **robots.txt / sitemap.xml** | Endpoints ocultos | [[Fuzzing Directories & Pages]] |
| **`.git/`, `.svn/`, `.env`** | Source code + credenciales | [[git-dumper]] |
| **API verbose** | Trace IDs, internal IPs | [[GraphQL - Introspection y Schema Discovery]] |
| **OSINT / dorking** | Credentials in pastes/repos | [[GitHub Dorking]], [[Google Dorking]] |
| **Directory listing** | Backup files, dev artifacts | [[Fuzzing Directories & Pages]] |
| **Comments HTML/JS** | Dev notes, TODOs, credentials | view-source |
| **LDAP attributes** | User enumeration, email patterns | [[LDAP Injection - Info Disclosure y Blind]] |
| **Cache headers** | Last-Modified, ETag → version inference | manual |
| **Banner grabbing** | Service version | nmap `-sV`, [[netexec]] |
| **JWT alg/header** | Algoritmo, kid → ataque | [[JWT - Deteccion y Reconocimiento]] |

***

## Impacto downstream

- Selección de exploit específico (versión exacta del CMS, framework).
- Construcción de wordlist (usernames con patrón corporativo).
- Identificación de tech stack para SSTI engine ([[SSTI - Ejecucion por Engine]]).
- Mapeo de attack surface oculto.

***

## Notas Relacionadas

- [[Passive Infrastructure Identification]]
- [[Certificate Transparency Logs]]
- [[Subdomains Passive Enumeration]]
