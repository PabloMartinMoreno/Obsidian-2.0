---
aliases:
  - Cross-Forest Delegation
  - TGT Delegation Trust
  - CVE-2019-1040
tags:
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Delegation Enumeration]]"
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Delegation Enumeration - Cross-Trust Delegation

***

## TGT Delegation Across Trusts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x800}` | Trusts con TGT Delegation **enabled** (legacy/risky) | Critical audit. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x200}` | Trusts con `NO_TGT_DELEGATION` (default modern) | Confirmar hardening. |
| `nltest /domain_trusts /v \| findstr /i "tgt"` | Native check | Quick. |
| `Set-ADTrust -Identity <trust> -EnableTGTDelegation $false` | Disable cross-forest TGT delegation | Hardening fix. |
^ad-crosstrust-tgt

**Bitmasks `trustAttributes`:**
- `0x200` = `CROSS_ORGANIZATION_NO_TGT_DELEGATION` (default modern post-CVE-2019-1040)
- `0x800` = `CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION` (legacy / re-enabled = risky)

```powershell
# Forest-wide audit
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,Direction,@{n='TGTDelegation';e={
    if ($_.trustAttributes -band 0x200) { "Disabled (modern)" }
    elseif ($_.trustAttributes -band 0x800) { "ENABLED (RISKY)" }
    else { "Inherits default" }
  }}
```

___

## Cross-Domain (Intra-Forest)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains \| % { Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Server $_ }` | UD computers per-domain forest | Forest UD audit. |
| `(Get-ADForest).Domains \| % { Get-ADUser -Filter * -Server $_ -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo }` | CD per-domain | Forest CD audit. |
| BloodHound `MATCH p=(u)-[:AllowedToDelegate\|AllowedToAct\|AddKeyCredentialLink]->(t) WHERE u.domain <> t.domain RETURN p` | Cross-domain delegation paths | Visual. |
^ad-crosstrust-intraforest

**Intra-forest:** TGT delegation **siempre habilitada** dentro del forest (`WITHIN_FOREST` flag 0x20). RBCD + Shadow Credentials funcionan cross-domain sin restricciones.

___

## Inter-Forest Delegation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter {ForestTransitive -eq $true} -Pr trustAttributes` | Forest trusts + flags | Cross-forest audit. |
| `Get-ADTrust -Filter * -Pr SelectiveAuthentication` | Selective Auth status (granular delegation defense) | Hardening check. |
| Cross-forest UD (raro post-2019) | Solo si `TGTDelegation` re-enabled | Audit. |
^ad-crosstrust-interforest

**Status post-CVE-2019-1040:**
- TGT Delegation cross-forest **disabled** by default (`NO_TGT_DELEGATION` flag).
- Cross-forest UD bloqueado a menos que admin re-enable manualmente.
- RBCD cross-forest **bloqueado** post-patch (target debe ser intra-forest).
- S4U2Self/S4U2Proxy cross-forest restringido.

___

## Foreign Principal Source

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity' -match "ForeignSecurityPrincipals\|<other-domain>"}` | Foreign principals con RBCD configurado | Cross-trust audit. |
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | FSPs en local domain | Cross-trust principal list. |
| BloodHound `MATCH (u)-[:AllowedToAct]->(c) WHERE u.domain <> c.domain RETURN u,c` | Cross-domain RBCD | Visual. |
^ad-crosstrust-foreign

___

## Modern Patches Impact

| **Patch / CVE** | **Qué fix** | **Status defaults** |
|:---:|:---:|:---:|
| **CVE-2019-1040** (NetLogon NTLM tampering) | Patched July 2019 | Forces SMB signing baseline. |
| **KB4490425** (TGT Delegation) | Disabled cross-forest TGT delegation by default | Modern domains tienen `0x200`. |
| **CVE-2020-1472** (Zerologon) | Patched Aug 2020 | DC computer account auth bypass fix. |
| **CVE-2022-26923** (Certifried) | Patched May 2022 | ADCS template + KDC PKINIT validation. |
| **CVE-2024-37968** (Kerberos forest) | Modern | Forest cross-trust hardening. |
^ad-crosstrust-patches

___

## Cross-Trust BloodHound

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[r:AllowedToDelegate\|AllowedToAct\|AddKeyCredentialLink]->(t) WHERE u.domain <> t.domain RETURN u.name,u.domain,t.name,t.domain,type(r)` | Cross-domain delegation edges | Visual. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true})) WHERE any(n IN nodes(p) WHERE n.domain <> u.domain) RETURN p` | Cross-domain attack paths via delegation | Privesc. |
| `MATCH (u {owned:true,domain:"FOREIGN"})-[*1..]->(t {highvalue:true,domain:"LOCAL"}) RETURN p` | Foreign user attacking local | Cross-forest. |
^ad-crosstrust-bh

___

## Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-ADTrust -Identity <trust> -EnableTGTDelegation $false` | Confirma TGT Delegation OFF cross-forest | Hardening. |
| `Set-ADTrust -Identity <trust> -SelectiveAuthentication $true` | Enable Selective Auth (granular) | Hardening fuerte. |
| `Set-ADTrust -Identity <trust> -SIDFilteringForestAware $true` | SID Filtering ON | Cross-forest defense. |
| `Add-ADGroupMember "Protected Users" -Members <victim>` | Block delegation hacia members | Tier 0. |
| Audit `trustAttributes & 0x800` quarterly | Detect re-enabled TGT Delegation | Compliance. |
| Patch baseline ≥ KB4490425 + Aug 2020 patches | Modern hardening | Compliance. |
^ad-crosstrust-mitigations

***
