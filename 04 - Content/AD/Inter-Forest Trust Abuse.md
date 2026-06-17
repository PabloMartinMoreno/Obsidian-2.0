---
aliases:
  - Cross-Forest Trust Abuse
  - Forest Trust Attack
tags:
  - technique/lateral-movement
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[Inter-Forest Trust Abuse - Foreign Access]]"
  - "[[Inter-Forest Trust Abuse - Cross-Realm]]"
  - "[[Intra-Forest Trust Abuse]]"
  - "[[AD - Domain & Forest Trusts]]"
---
# Inter-Forest Trust Abuse

Entre **bosques distintos** (forest/external trust), el bosque es el límite de seguridad → **SID filtering SÍ se aplica** por defecto, bloqueando el ExtraSids de [[Intra-Forest Trust Abuse]]. El abuso cross-forest se basa en **acceso explícito concedido** (foreign principals, ACLs), **roasting** cross-forest, **cross-realm TGS**, o un trust **mal configurado** que relaja SID filtering.

---

## Cheatsheet

### 1. Foreign Access

````tabs
tab: **Enumerar Acceso Concedido**
![[Inter-Forest Trust Abuse - Foreign Access#^inter-foreign-enum]]

tab: **Roasting Cross-Forest**
![[Inter-Forest Trust Abuse - Foreign Access#^inter-foreign-roast]]
````

### 2. Cross-Realm

````tabs
tab: **Cross-Realm TGS**
![[Inter-Forest Trust Abuse - Cross-Realm#^inter-crossrealm-tgs]]

tab: **SID Filtering Relajado**
![[Inter-Forest Trust Abuse - Cross-Realm#^inter-crossrealm-sidfilter]]
````

---

## Overview

Cross-forest **no** hay escalada gratis: Microsoft mete **SID filtering** para que el compromiso de un forest no contamine al otro. El atacante busca el acceso que un admin concedió a propósito (o por error):

- Cuentas/grupos foráneos con permisos (foreign principals).
- ACLs cross-forest sobre objetos sensibles.
- Trust con `TGTDelegation` o SID filtering deshabilitado → ExtraSids vuelve a funcionar.
- Servicios alcanzables vía cross-realm TGS y cuentas roasteables.

> [!warning] SID filtering
> Por default, inyectar un SID privilegiado del otro forest en ExtraSids es filtrado → no escala. Solo funciona con misconfig (quarantine off / TGTDelegation on). Verificá `TrustAttributes` primero.

> [!tip] vs Intra-Forest
> Intra-forest = escalada automática (SID filtering off) → child a root trivial. Inter-forest = solo lo concedido explícitamente, salvo misconfig. Ver [[Intra-Forest Trust Abuse]].

---

## Recursos

- [The Hacker Recipes — Trusts](https://www.thehacker.recipes/ad/movement/trusts)
- [Harmj0y — Attacking Domain Trusts](https://posts.specterops.io/a-guide-to-attacking-domain-trusts-971e52cb2944)
- [improsec — SID filtering bypass](https://improsec.com/tech-blog/sid-filter-as-security-boundary-between-domains-part-1)
