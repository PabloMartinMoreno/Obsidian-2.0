---
aliases:
  - UI Redress
  - Clickjacking
tags:
  - type/vulnerability
  - vuln/clickjacking
  - technique/initial-access
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Vulnerability
---

# Clickjacking

UI redress: superponer página víctima en iframe casi invisible sobre UI atacante. El user clickea creyendo interactuar con la decoy, pero los clicks van al iframe → submits, transfers, password changes, OAuth grants ejecutados sin awareness.

***

## Detección y Reconocimiento

```tabs
tab: Headers Anti-Framing
![[Clickjacking - Deteccion y Reconocimiento#^cj-detect-headers]]

tab: CSP frame-ancestors
![[Clickjacking - Deteccion y Reconocimiento#^cj-detect-csp]]

tab: Test de Framing Real
![[Clickjacking - Deteccion y Reconocimiento#^cj-detect-framing]]
```

## Vectores Básicos

```tabs
tab: Opacity Overlay
![[Clickjacking - Vectores Basicos#^cj-vector-opacity]]

tab: Decoy Reposicionado
![[Clickjacking - Vectores Basicos#^cj-vector-decoy]]

tab: Doble Iframe Anidado
![[Clickjacking - Vectores Basicos#^cj-vector-double-iframe]]

tab: Fullscreen API
![[Clickjacking - Vectores Basicos#^cj-vector-fullscreen]]
```

## Variantes Avanzadas

```tabs
tab: Drag & Drop Jacking
![[Clickjacking - Variantes Avanzadas#^cj-advanced-dragdrop]]

tab: Cursor Jacking
![[Clickjacking - Variantes Avanzadas#^cj-advanced-cursorjacking]]

tab: Scroll Jacking
![[Clickjacking - Variantes Avanzadas#^cj-advanced-scrolljacking]]

tab: Touch Jacking
![[Clickjacking - Variantes Avanzadas#^cj-advanced-touchjacking]]

tab: Stroke Jacking
![[Clickjacking - Variantes Avanzadas#^cj-advanced-strokejacking]]
```

## Bypass de Anti-Framing

```tabs
tab: JS Frame-Busting
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-jsbusting]]

tab: Sandbox Attribute
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-sandbox]]

tab: X-Frame-Options
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-xfo]]

tab: CSP frame-ancestors
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-csp]]

tab: Browser Quirks
![[Clickjacking - Bypass de Anti-Framing#^cj-bypass-quirks]]
```

## Chains con Otras Vulns

```tabs
tab: Self-XSS → Stored
![[Clickjacking - Chains con Otras Vulns#^cj-chain-xss]]

tab: SameSite Lax CSRF
![[Clickjacking - Chains con Otras Vulns#^cj-chain-csrf]]

tab: OAuth Consent
![[Clickjacking - Chains con Otras Vulns#^cj-chain-oauth]]

tab: WebRTC Hijack
![[Clickjacking - Chains con Otras Vulns#^cj-chain-webrtc]]

tab: Subdomain Takeover
![[Clickjacking - Chains con Otras Vulns#^cj-chain-subtakeover]]
```

## Tooling

```tabs
tab: Burp + Clickbandit
![[Clickjacking - Tooling#^cj-tool-burp]]

tab: PoC Generators
![[Clickjacking - Tooling#^cj-tool-generators]]

tab: Scanners
![[Clickjacking - Tooling#^cj-tool-scanners]]

tab: Browser DevTools
![[Clickjacking - Tooling#^cj-tool-devtools]]

tab: Wordlists & Repos
![[Clickjacking - Tooling#^cj-tool-wordlists]]
```

***

## Notas relacionadas

- [[Cross-Site Scripting (XSS)]] — chain Self-XSS → Stored via clickjack del submit.
- [[Cross-Site Request Forgery (CSRF)]] — técnica análoga sin UI; clickjack bypassea SameSite=Lax.
- [[Open Redirect]] — combo OAuth consent + redirect_uri controlado.
- [[HTML Injection]] — inyección estática que puede habilitar self-framing.
