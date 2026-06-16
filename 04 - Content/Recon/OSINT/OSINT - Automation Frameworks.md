---
aliases:
  - OSINT - Frameworks de Automatización
  - SpiderFoot
  - Maltego
  - recon-ng
tags:
  - technique/recon/passive
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
kind: CheatSheet
linked:
  - "[[OSINT]]"
  - "[[Passive Infrastructure Identification]]"
---
# OSINT - Automation Frameworks

> [!info] Overview
> Automatizan la recolección y correlación sobre una **semilla** (dominio, IP, email, persona). Para cuando ya dominás lo manual: la herramienta acelera, no piensa por vos (la **verificación sigue siendo obligatoria**).

---

## Las Herramientas

| **Framework** | **Uso** | **Para qué** |
|:---|:---|:---|
| **SpiderFoot** | `python3 sf.py -l 127.0.0.1:5001` | Motor automatizado: cientos de módulos sobre una semilla + correlación. Modo **pasivo** disponible. |
| **Maltego** (CE) | GUI | **Análisis de enlaces visual**: entidades + transforms → grafo de relaciones (personas/cuentas/infra). Estándar de la industria. |
| **recon-ng** | `modules load ...; options set SOURCE x; run` | Framework estilo Metasploit: módulos, workspaces, base de datos. Foco dominio/host/org. |
| **theHarvester** | `theHarvester -d dom.com -b all` | Cosecha emails, subdominios, hosts y nombres de fuentes públicas. |
^auto-tools

## Cuál usar para qué

| **Objetivo** | **Herramienta** |
|:---|:---|
| Recon de dominio/infra/organización | **recon-ng / theHarvester** |
| Red amplia automatizada sobre una semilla | **SpiderFoot** |
| Ver y manejar relaciones de un caso complejo (personas + cuentas + infra) | **Maltego** |
^auto-cual

> [!warning] Caveats
> - **Activo vs pasivo a escala:** algunos módulos *tocan* el objetivo (DNS brute, lookups contra la infra) → solo sobre lo propio o con autorización. Configurar modo **pasivo**.
> - **Verificación:** la correlación automática genera falsos positivos. El analista verifica, no confía en el grafo a ciegas.
> - **API keys / rate limits:** muchos módulos rinden con claves gratuitas (Shodan, HIBP); machacar las fuentes te banea.
