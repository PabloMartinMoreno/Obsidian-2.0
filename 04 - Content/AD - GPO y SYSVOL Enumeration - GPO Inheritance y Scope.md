---
aliases:
  - GPO Inheritance
  - Block Inheritance
  - Enforced GPO
  - RSoP
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Concept
linked:
  - '[[AD - GPO y SYSVOL Enumeration]]'
---
# AD - GPO y SYSVOL Enumeration - GPO Inheritance & Scope

***

## GPO Application Order

**Orden de aplicación (LSDOU):**
1. **L**ocal Policy (per-host)
2. **S**ite GPOs
3. **D**omain root GPOs
4. **O**rganizational Unit GPOs (top-down hasta target OU)

**Conflict resolution:** último aplicado gana (overrides previos). Excepción: GPO con flag `Enforced` no puede ser overridden.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `gpresult /R /SCOPE COMPUTER` | RSoP del host actual (computer scope) | Effective policy. |
| `gpresult /R /USER <user>` | RSoP per-user | Effective policy. |
| `gpresult /H rsop.html` | Full RSoP HTML report | Reportable. |
| `Get-GPResultantSetOfPolicy -ReportType Html -Path rsop.html -User <user> -Computer <host>` | Modeling sin estar logueado | Predict impact. |
^ad-gpo-order

___

## Per-OU gPLink Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "<OU-DN>"` | GPOs aplicados (linked + inherited) | Standard. |
| `(Get-ADOrganizationalUnit "<OU-DN>" -Pr gPLink).gPLink` | Raw `gPLink` attribute | LDAP-level. |
| `Get-ADOrganizationalUnit -Filter * -Pr gPLink \| ? gPLink` | Bulk OUs con GPOs | Forest scan. |
^ad-gpo-gplink

```powershell
# Decode gPLink raw
$ou = Get-ADOrganizationalUnit "OU=Servers,DC=corp,DC=local" -Properties gPLink
$ou.gPLink -split '\]\[' | % {
  if ($_ -match '\{([\w-]+)\}') {
    $g = Get-GPO -Guid $matches[1] -EA SilentlyContinue
    if ($g) { $g.DisplayName }
  }
}
```

___

## Block Inheritance

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "<OU-DN>" \| Select GpoInheritanceBlocked` | Block status | Audit. |
| `(Get-ADOrganizationalUnit "<OU-DN>" -Pr gPOptions).gPOptions -band 1` | Bitwise check (1 = blocked) | Raw check. |
| `Set-GPInheritance -Target "<OU-DN>" -IsBlocked Yes` (priv) | Habilitar block | Hardening. |
^ad-gpo-blockinherit

___

## Enforced GPO Links

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "<OU-DN>" \| Select -Expand GpoLinks \| ? Enforced` | Enforced GPO links | Standard. |
| `Set-GPLink -Name "<GPO>" -Target "<OU-DN>" -Enforced Yes` (priv) | Force enforcement | Hardening. |
^ad-gpo-enforced

**Por qué importa:** Enforced GPOs **NO pueden ser overridden** por OUs descendientes con Block Inheritance. Tier 0 GPOs deberían ser Enforced para garantizar aplicación.

___

## RSoP (Resultant Set of Policy)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `gpresult /R` | Quick RSoP per-host | Standard. |
| `gpresult /R /SCOPE COMPUTER` | Solo computer scope | Targeted. |
| `gpresult /H rsop.html` | HTML full report | Reportable. |
| `gpresult /Z` | Verbose extreme | Debug. |
| `Get-GPResultantSetOfPolicy -ReportType Html -Path rsop.html -User <u> -Computer <c>` | Modeling RSAT | Predict. |
| `Get-GPResultantSetOfPolicy -ReportType Xml -Path rsop.xml ...` | XML parseable | Pipeline. |
^ad-gpo-rsop

```powershell
# Modeling — predecir efecto sin logueo
Get-GPResultantSetOfPolicy -ReportType Html -Path C:\rsop.html `
  -User corp\jsmith -Computer ws01

# Inspect HTML para ver effective policy
```

___

## Site-Linked GPOs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADReplicationSite -Filter * -Pr gPLink` | Sites con GPOs linked | Site-level audit. |
| `(Get-ADReplicationSite -Identity "<site>" -Pr gPLink).gPLink` | Raw site GPOs | Detail. |
| `Get-GPInheritance -Target "CN=<site>,CN=Sites,CN=Configuration,..."` | Site GPO inheritance | Standard. |
^ad-gpo-site

**Site-linked GPOs aplican antes que Domain/OU GPOs** (orden LSDOU). Less common pero impactante para roaming users.

___

## Cross-Correlate Privileged OUs

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "OU=Domain Controllers,$((Get-ADDomain).DistinguishedName)"` | GPOs en DC OU | Critical. |
| `Get-ADOrganizationalUnit -Filter "Name -like '*Tier0*' -or Name -like '*Admin*'" -Pr gPLink` | Tier 0 OUs con GPOs | Audit. |
| `Get-GPInheritance -Target "<T0-OU-DN>" \| Select -Expand GpoLinks` | GPOs efectivos Tier 0 | Privesc surface. |
^ad-gpo-privou

___

## BloodHound Cypher

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (g:GPO)-[:GpLink]->(o:OU) RETURN g.name,o.name` | GPO → OU links | Standard. |
| `MATCH (g:GPO)-[:GpLink]->(o:OU)-[:Contains]->(c:Computer) RETURN g.name,o.name,c.name` | GPO → OU → Computers (mass compromise scope) | Critical. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl]->(g:GPO)-[:GpLink]->(o:OU)-[:Contains]->(c:Computer {highvalue:true}) RETURN p` | Privesc path mass-compromise | Path planning. |
| `MATCH (u {owned:true})-[:WriteProperty]->(o:OU)-[:Contains]->(c:Computer {highvalue:true}) RETURN p` | WriteGPLink path | Adjacent. |
^ad-gpo-bh

***
