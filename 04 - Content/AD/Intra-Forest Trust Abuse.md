---
aliases:
  - Child to Parent Domain
tags:
  - technique/privilege-escalation
  - technique/lateral-movement
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
  - "[[Intra-Forest Trust Abuse - Recon]]"
  - "[[Intra-Forest Trust Abuse - ExtraSids]]"
  - "[[Golden Ticket]]"
  - "[[Inter-Forest Trust Abuse]]"
---
# Intra-Forest Trust Abuse

Dentro de un **bosque**, todos los dominios confían entre sí (trusts transitivos) y comparten **Enterprise Admins** (en el dominio raíz). El límite de seguridad real es el **bosque, no el dominio**: comprometer un dominio hijo → escalar al forest root → control de todo. La técnica principal es **SID History injection (ExtraSids)**, viable porque **SID filtering no se aplica intra-forest**.

---

## Cheatsheet

### 1. Recon

````tabs
tab: **Mapear el Bosque**
![[Intra-Forest Trust Abuse - Recon#^intra-recon-map]]

tab: **Reunir Insumos**
![[Intra-Forest Trust Abuse - Recon#^intra-recon-inputs]]
````

### 2. ExtraSids (Escalada)

````tabs
tab: **Forjar con SID History**
![[Intra-Forest Trust Abuse - ExtraSids#^intra-extrasids-forge]]

tab: **Usar el Ticket**
![[Intra-Forest Trust Abuse - ExtraSids#^intra-extrasids-use]]
````

---

## Overview

El error conceptual común es tratar cada dominio como un silo. **No lo es:** ser DA de cualquier dominio hijo lleva a Enterprise Admin porque los trusts intra-forest son transitivos y **SID filtering está deshabilitado** → el SID de EA inyectado en `ExtraSids` se respeta, y el krbtgt del hijo basta para forjar el ticket.

**Resultado:** un dominio hijo comprometido = bosque entero. Por eso el forest es el límite de seguridad; remediar un compromiso de bosque exige reconstruir/rotar todo (cada krbtgt incluido).

> [!tip] Pre-requisito
> DA del dominio hijo (su krbtgt). A partir de ahí, ExtraSids es offline e inmediato. Para cross-**forest** (otro límite) ver [[Inter-Forest Trust Abuse]].

---

## Recursos

- [adsecurity.org — SID History / ExtraSids](https://adsecurity.org/?p=1640) — Sean Metcalf.
- [The Hacker Recipes — Trusts](https://www.thehacker.recipes/ad/movement/trusts)
- [Impacket raiseChild](https://github.com/fortra/impacket/blob/master/examples/raiseChild.py)
