---
aliases:
  - Trust Direction
  - Transitive Trust
  - One-Way Trust
  - Two-Way Trust
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Domain & Forest Trusts - Direction & Transitivity

---

## Trust Direction Decoded

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * \| Select Name,Direction,Source,Target` | Direction decoded (BiDirectional/Inbound/Outbound) | Standard audit. |
| `ldapsearch ... "(objectClass=trustedDomain)" trustPartner trustDirection` | Direction raw (0/1/2/3) | LDAP raw. |
| `nltest /domain_trusts /v` | Flags `DIRECT_INBOUND` / `DIRECT_OUTBOUND` | Native quick. |
^ad-direction-decoded

**Valores `trustDirection`:**
- `0` = Disabled (no debería existir)
- `1` = Inbound — they trust us (foreign accepts our creds; flujo ENTRANTE foreign → local)
- `2` = Outbound — we trust them (we accept foreign creds; flujo SALIENTE local → foreign)
- `3` = Bidirectional (1 + 2)

**Perspectiva:** Direction se mide desde el **trusting side** (el que acepta auth). "Outbound" desde nuestra perspectiva = nosotros aceptamos credenciales externas.

```bash
# LDAP raw — direction value
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "CN=System,DC=corp,DC=local" \
  "(objectClass=trustedDomain)" \
  trustPartner trustDirection
```

---

## Transitivity

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * \| Select Name,Direction,IsTransitive,ForestTransitive` | Transitivity flags | Audit cascade. |
| `Get-ADTrust -Filter {IsTransitive -eq $true}` | Solo transitivos | Walking attack paths. |
| `Get-ADTrust -Filter {IsTransitive -eq $false}` | Solo non-transitive | Limited blast radius. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x1}` | Bitwise NON_TRANSITIVE | LDAP-level. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x8}` | Bitwise FOREST_TRANSITIVE | Forest scope cascade. |
^ad-direction-transitive

**Cascading:**
- **Transitive**: A→B + B→C ⟹ A→C (cascade).
- **Non-transitive**: A→B + B→C ⟹ A NO trust C (isolated).

**Defaults:**
- Parent-Child / Tree-Root → transitive (intra-forest).
- Forest trust → transitive dentro del scope del forest.
- External trust → non-transitive (legacy, granular).

```bash
nltest /domain_trusts /v
# FOREST_TRANSITIVE flag = transitivo cross-forest
```

---

## Direction × Transitivity Matrix

| **Tipo Trust** | **Direction Default** | **Transitive Default** | **Riesgo** |
|:---:|:---:|:---:|:---:|
| Parent-Child | Bidirectional | Yes | Alto (intra-forest = full trust). |
| Tree-Root | Bidirectional | Yes | Alto. |
| Shortcut (intra-forest) | Bi/One-way | Yes | Alto-medio. |
| Forest trust | Bi/One-way | Yes (forest scope) | Medio (SID filter ON default). |
| External | Mostly One-way | No | Bajo-medio. |
| Realm (MIT) | Configurable | Configurable | Edge. |
^ad-direction-matrix

```powershell
# Risk-scored audit
Get-ADTrust -Filter * | % {
  [PSCustomObject]@{
    Trust            = $_.Name
    Source           = $_.Source
    Target           = $_.Target
    Direction        = $_.Direction
    Type             = $_.TrustType
    Transitive       = $_.IsTransitive
    ForestTransitive = $_.ForestTransitive
    Risk = if ($_.Direction -eq "BiDirectional" -and $_.IsTransitive) {"High"}
           elseif ($_.IsTransitive) {"Medium"}
           else {"Low"}
  }
} | Sort Risk -Descending
```

---

## Direction Impact on Attacks

| **Cypher / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (a:Domain {name:"OURDOM"})-[r:Trusts]->(b:Domain) WHERE r.direction IN ["Outbound","BiDirectional"] RETURN b.name` | Domains atacables vía nuestro trust | Attack surface mapping. |
| `MATCH (u:User {owned:true}) MATCH p=shortestPath((u)-[*1..]->(da:Group)) WHERE da.name CONTAINS "DOMAIN ADMINS" AND da.domain <> u.domain RETURN p` | Path cross-trust hacia DA foreign | Attack path planning. |
| `secretsdump.py corp/u:p@<DC> -just-dc-user '<NETBIOS>$'` | Hash trust account → forge inter-realm TGT | Trust account abuse. |
| `Get-ADUser -Server <foreign-DC> -Filter "ServicePrincipalName -ne '$null'"` | Kerberoast cross-trust | Cross-trust pre-attack. |
^ad-direction-attacks

**Attack direction logic:**
- **Outbound (we trust them)** → atacante compromete foreign domain primero, luego entra a nuestro domain. Nosotros somos el target.
- **Inbound (they trust us)** → comprometemos local, lateralmente accedemos a foreign. Foreign es el target.
- **Bidirectional** → ambos vectors viables.

---

## Selective Authentication

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * \| ? SelectiveAuthentication` | Trusts con Selective Auth ON | Hardening identificado. |
| `nltest /domain_trusts /v \| findstr /i "selective"` | Trust property via nltest | Sin RSAT. |
| `(Get-Acl "AD:<resource-DN>").Access \| ? ActiveDirectoryRights -match "ExtendedRight"` | ACEs con `Allowed-To-Authenticate` | Audit per-resource. |
| `dsacls "<DC-DN>" \| findstr /i "Allowed to authenticate"` | ACEs detalladas | Native dsacls. |
^ad-direction-selective

**Cómo funciona:** con Selective Auth, foreign principals **NO pueden autenticarse a recursos locales por default**. Cada recurso (computer, share) necesita ACE explícita con `Allowed-To-Authenticate` extended right hacia el principal foreign.

**Bypasses comunes:**
- ACEs amplias (`Authenticated Users` o `Domain Users` en ACE crítica).
- Nested groups con miembros foreign en ACE Allow.
- Resources sin Selective Auth aplicada (defaults).

```powershell
# Resources con Allowed-To-Authenticate para foreign trust
$Trust = "partner.com"
Get-ADComputer -Filter * | % {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $acl.Access | Where {
    $_.ActiveDirectoryRights -match "ExtendedRight" -and
    $_.IdentityReference -like "*$Trust*"
  } | Select @{n='Computer';e={$_.Name}},IdentityReference,ActiveDirectoryRights
}
```

---

## TGT Delegation Across Trusts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x800}` | Trusts con TGT Delegation re-enabled (legacy/risky) | Audit critical. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x200}` | Trusts con `NO_TGT_DELEGATION` (default modern) | Confirmar hardening. |
| `Set-ADTrust -Identity <trust> -EnableTGTDelegation $false` | Disable TGT delegation cross-forest | Hardening fix. |
^ad-direction-tgtdelegation

**Por qué importa:** TGT Delegation cross-forest permite Unconstrained Delegation desde foreign domain → captura TGT de Tier 0 al pasar por servers cross-forest. **Disabled by default post-CVE-2019-1040 (Bronze Bit / sin patches)**.

**Re-enable risk:** `EnableTGTDelegation = true` (`trustAttributes & 0x800`) re-habilita comportamiento legacy. Crítico audit.

```powershell
# Audit completo TGT delegation status
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,@{n='TGTDelegation';e={
    if ($_.trustAttributes -band 0x200) {"Disabled (modern default)"}
    elseif ($_.trustAttributes -band 0x800) {"ENABLED (RISKY — audit)"}
    else {"Inherits default"}
  }}
```

---
