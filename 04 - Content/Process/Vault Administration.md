---
aliases:
tags:
  - meta/vault
kind: Concept
linked:
  - "[[Obsidian - Custom CSS]]"
  - "[[Obsidian - Plugins]]"
  - "[[Vault Structure and Note Creation]]"
---
# Vault Administration

> [!info]
> Convenciones, configuración y mantenimiento del vault Obsidian Hack.

***

## Estructura

```
Hack/
├── 00 - Resources/     ← imágenes, templates, Templater scripts
├── 01 - Primary Categories/    ← MOCs nivel 1 (Red Team, Blue Team, etc.)
├── 02 - Secondary Categories/  ← MOCs nivel 2 (Active Directory, OffSec, etc.)
├── 03 - Tertiary Categories/   ← MOCs nivel 3 (Enumeración, Explotación, etc.)
├── 04 - Content/       ← notas técnicas (AD, Web, Recon, Tools, etc.)
├── 05 - Writeups/      ← writeups por plataforma (HTB, HMV, OTW, etc.)
└── 06 - Daily/         ← daily notes (templated)
```

***

## Frontmatter canonical

```yaml
---
aliases:
tags:
  - estado/incompleto  # SOLO si sigue en construcción; completo va únicamente en writeups
  - asset/<dominio>  # web-app, active-directory, network, etc.
  - <otros tags taxonómicos>
kind: <Kind>         # CheatSheet, Tool, Technique, Concept, Vulnerability, etc.
linked:
  - "[[Nota Relacionada]]"
---
```

***

## Sistema `kind:`

Property que define la **función/base** de la nota. Determina color en graph + file explorer.

Valores canónicos:
- **CheatSheet** — referencia rápida de comandos/sintaxis
- **SubCheatSheet** — sub-cheatsheet temática
- **Tool** — programa/binario que se ejecuta como utilidad, con su cheatsheet de uso (`curl`, `nmap`, `dig`, `gobuster`, `ffuf`, `BloodHound`, `Wireshark`, `Bash`…)
- **Technique** — técnica abstracta de ataque/defensa
- **Concept** — concepto teórico
- **Command** — nota sobre UN comando/one-liner o setting puntual, NO un programa entero (ej. `PowerShell - FormatEnumerationLimit`)
- **SubCommand** — variante/flag de comando
- **SubNote** — nota auxiliar
- **Vulnerability** — vulnerabilidad clásica
- **Writeup** — writeup CTF/lab
- **Playbook** — secuencia paso-a-paso
- **Payload** — payload reutilizable
- **TTP** — táctica-técnica-procedimiento (MITRE)
- **Primary / Secondary / Tertiary Category** — MOCs

***

## Tags taxonómicos

> [!warning] `type/*` deprecado
> `kind:` (property) es la **única fuente de verdad** para la función de la nota. `type/*` quedó como tag paralelo vestigial — NO usar en notas nuevas. Migración pendiente: ver § Migración `type/*` → `kind:`.

Prefijos en uso:
- ~~`type/*`~~ — **deprecado**, reemplazado por `kind:`
- `asset/*` — dominio (web-app, active-directory, network, db, etc.)
- `technique/*` — MITRE ATT&CK táctica (discovery, execution, lateral-movement, etc.)
- `vuln/*` — vulnerabilidad específica (sqli, xss, xxe, etc.)
- `service/*` — servicio (smb, http, ldap, etc.)
- `cred/*` — tipo de credencial (kerberos, ntlm, jwt)
- `env/*` — entorno (windows, linux, active-directory, cloud-aws)
- `tool/*` — herramienta puntual
- `cert/*` — certificación (oscp, cbbh, etc.)
- `topic/*` — tema transversal cuando no encaja en `asset/*` (forensics, network). Uso acotado.
- `meta/*` — tags del propio vault (index, ctf, daily, vault)
- `estado/*` — `completo` va **solo en writeups** (`05 - Writeups/`). En notas de contenido la completitud se señala **saliendo de `Process/`** (no se taggea). `incompleto` opcional para work-in-progress en Process.

> [!tip] Falsos positivos en el tag pane
> Strings con `#` dentro de code fences / inline-code / callouts (hex CSS `#CF4747`, directivas SSI `<!--#exec -->`, ColdFusion `#var#`) NO son tags reales — Obsidian los ignora. Si una tool MCP los lista como tags, es artefacto del parser, no requiere limpieza.

***

## Convenciones de naming

- **Sub-cheatsheets**: `Hub - Subtema.md` (guion-espacio). Ej: `SQLi - Union based.md`, `XSS - Payloads Polyglot.md`, `AD - ACL Enumeration - Tooling.md`. El hub embebe sub-notas vía `![[Sub#^anchor]]` en tabs.
- **Enumeración de servicios**: `Servicio (puertos) - Enumeración.md` en `Services/`. Ej: `SMB (139, 445) - Enumeración.md`.
- **Carpetas Web**: una por vuln en CamelCase (`FileUpload/`, `SSRF/`), hub con nombre completo + sigla dentro (`Server-Side Request Forgery (SSRF).md`).
- **Tools**: nombre del binario en minúscula tal cual se invoca (`nmap.md`, `evil-winrm.md`), excepto productos con nombre propio (`Burp Suite.md`, `Wireshark.md`).

## Principios de contenido

> [!important] Atomicidad y cero duplicación
> - **Una idea = una nota.** Cuanto más atómica, mejor. Si un concepto ya existe, NO se re-explica en otra nota.
> - **Nunca duplicar contenido.** La info vive en un solo lugar (su nota atómica). Las demás notas la **transcluyen** (`![[ ]]`), no la copian.
> - **Referenciar secciones por block-id `^`, no por heading.** Agregar `^nombre` al bloque destino (tabla, lista, párrafo) y llamarlo con `![[Nota#^nombre]]` (embed) o `[[Nota#^nombre]]` (link). Los `^id` sobreviven a cambios de título; los `#Heading` se rompen.
>
> Ej: `HTTP` y `HTTPS` embeben `![[HTTP - Métodos#^http-metodos]]` y `![[HTTP - Códigos de Estado#^http-estado]]` en vez de repetir las tablas.

***

## Migración `type/*` → `kind:`

Mapeo para limpiar el tag vestigial. Si la nota ya tiene `kind:` correcto, solo borrar el `type/*`; si difieren, gana el más específico (`kind:` describe función, no contenido).

| Tag viejo | `kind:` |
|---|---|
| `type/cheatsheet` | CheatSheet |
| `type/tool` | Tool |
| `type/concept` | Concept |
| `type/technique` | Technique |
| `type/vulnerability` | Vulnerability |
| `type/writeup` | Writeup |
| `type/playbook` | Playbook |
| `type/command` | Command |
| `type/sub-command` | SubCommand |
| `type/sub-note` | SubNote |
| `type/payload` | Payload |
| `type/ttp` | TTP |
| `type/moc/primary` | Primary Category |
| `type/moc/secondary` | Secondary Category |
| `type/moc/tertiary` | Tertiary Category |

***

## Plugins clave

- **Templater** — templates con JS dinámico (folder_templates auto-aplican)
- **QuickAdd** — quick-create vía hotkeys (Alt+W writeup, Alt+T type, Alt+C category)
- **Dataview** — queries en Markdown
- **Supercharged Links** — colorea links según `kind:`
- **Style Settings** — UI para CSS variables
- **Obsidian Git** — auto-backup commit cada ~30min
- **Colored Tags** — colorea tag pills
- **Omnisearch** — search avanzado (Alt+S)

Ver [[Obsidian - Plugins]].

***

## Snippets CSS activos

`.obsidian/snippets/`:
- `type-colors.css` — colorea links + tabs por kind
- `supercharged-links-gen.css` — generado por plugin
- `custom-callouts.css` — callouts personalizados ([!flag], [!like])
- `colored-sidebar-items.css` — folders coloreados por prefix numérico

***

## Dashboards

- [[000 - Global Index|Global Index]] — entrada principal
- [[Hack the Box]] — HTB stats + máquinas
- [[Incompletos]] — pendientes por dominio
- [[Todo Round-Up]] — callouts `[!todo]` activos
- [[Tools]] — MOC de herramientas

***

## Backup

- **Obsidian Git plugin** — commits automáticos cada ~30min con mensaje `vault backup: TIMESTAMP`.
- Remote: GitHub `PabloMartinMoreno/Obsidian-2.0`. `git push` manual o auto-push del plugin.
- Backup tarball ad-hoc: `tar -czf /tmp/hack-backup-$(date +%F).tar.gz --exclude='.git' --exclude='00 - Resources/Images' .`

***

## Notas Relacionadas

- [[Vault Structure and Note Creation]]
- [[Obsidian - Custom CSS]]
- [[Obsidian - Plugins]]
- [[Obsidian Git]]
