---
aliases:
  - Trust Types AD
  - Forest Trust
  - External Trust
  - Parent-Child Trust
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Domain & Forest Trusts]]'
---
# AD - Domain & Forest Trusts - Trust Types

***

## Intra-Forest Trusts (Within Forest)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADForest).Domains` | Lista domains del forest | Identificar parent-child. |
| `Get-ADTrust -Filter {ForestTransitive -eq $false -and Direction -eq "BiDirectional"}` | Parent-child trusts (intra) | Filter intra-forest. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x20}` | Trusts con `WITHIN_FOREST` flag | Bitwise filter. |
^ad-types-intraforest

**Tipos intra-forest auto-creados:**
- **Parent-Child** — al crear child domain. Bidirectional + transitive.
- **Tree-Root** — al crear nuevo tree en forest. Bidirectional + transitive.
- **Shortcut (Cross-Link)** — manual, para optimizar auth path. Transitive opcional.

**Defaults intra-forest:**
- SID Filtering = OFF (mismo forest, full trust).
- TGT delegation = ON.
- Universal groups span forest.
- Schema Admins / Enterprise Admins = forest-level Tier 0.

```powershell
# Parent-child trusts del domain actual
Get-ADTrust -Filter * |
  Where { $_.Source -eq (Get-ADDomain).DistinguishedName } |
  Select Name,TrustType,Direction,IsTransitive,trustAttributes
```

___

## Inter-Forest Trusts (Cross-Forest)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter {ForestTransitive -eq $true}` | Forest trusts (modern cross-forest) | Cross-forest mapping. |
| `Get-ADTrust -Filter {TrustType -eq "Uplevel" -and ForestTransitive -eq $false}` | External trusts (legacy) | Pre-2003 cross-forest. |
| `Get-ADTrust -Filter {TrustType -eq "Kerberos"}` | Realm trusts (MIT KDC) | Unix interop. |
| `Get-ADTrust -Filter * -Pr SelectiveAuthentication \| ? SelectiveAuthentication` | Trusts con Selective Auth | Hardening identificado. |
^ad-types-interforest

**Tipos cross-forest:**
- **Forest Trust** — moderno (2003+). Forest-transitive opcional. SID Filtering ON default. TGT Delegation OFF default (post-2019).
- **External Trust** — legacy/granular. Non-transitive. SID Filtering ON.
- **Realm Trust** — Kerberos cross-realm con MIT KDC (Linux/Unix).

**Defaults cross-forest:**
- SID Filtering = ON (defensa critical).
- TGT delegation = OFF (post-CVE-2019-0683).
- Forest-wide auth = default. Selective Auth = hardening manual.

```powershell
# Audit forest trusts hardening
Get-ADTrust -Filter * -Properties * |
  Select Name,TrustType,ForestTransitive,SelectiveAuthentication,
         SIDFilteringForestAware,SIDFilteringQuarantined,TGTDelegation
```

___

## Trust Type Decoded (LDAP `trustType`)

| **Valor** | **Tipo** | **Cuándo** |
|:---:|:---:|:---:|
| 1 | Downlevel (Windows NT) | Pre-AD legacy. |
| 2 | Uplevel (AD) | Default modern. |
| 3 | MIT Kerberos | Realm trust Unix. |
| 4 | DCE | Old DCE/RPC. |
^ad-types-trusttype

```bash
# Ver trustType raw vía LDAP
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "CN=System,DC=corp,DC=local" \
  "(objectClass=trustedDomain)" \
  cn trustType trustDirection trustAttributes
```

___

## Trust Attributes Flags Decoded

| **Hex** | **Constant** | **Significado** |
|:---:|:---:|:---:|
| 0x1 | `NON_TRANSITIVE` | Trust no cascadea. |
| 0x2 | `UPLEVEL_ONLY` | Solo Win2000+. |
| 0x4 | `QUARANTINED_DOMAIN` | SID filtering enforced. |
| 0x8 | `FOREST_TRANSITIVE` | Forest trust transitive. |
| 0x10 | `CROSS_ORGANIZATION` | Cross-org marker. |
| 0x20 | `WITHIN_FOREST` | Intra-forest. |
| 0x40 | `TREAT_AS_EXTERNAL` | SID filter como external. |
| 0x80 | `USES_RC4_ENCRYPTION` | RC4 only (legacy). |
| 0x100 | `USES_AES_KEYS` | AES (modern). |
| 0x200 | `CROSS_ORGANIZATION_NO_TGT_DELEGATION` | TGT delegation OFF. |
| 0x400 | `PIM_TRUST` | Privileged Identity Management. |
| 0x800 | `CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION` | TGT delegation ON (legacy/CVE-2019-0683). |
^ad-types-attributes

```python
def decode_trust_attributes(attr):
    flags = []
    if attr & 0x1:   flags.append("NON_TRANSITIVE")
    if attr & 0x2:   flags.append("UPLEVEL_ONLY")
    if attr & 0x4:   flags.append("QUARANTINED")
    if attr & 0x8:   flags.append("FOREST_TRANSITIVE")
    if attr & 0x10:  flags.append("CROSS_ORGANIZATION")
    if attr & 0x20:  flags.append("WITHIN_FOREST")
    if attr & 0x40:  flags.append("TREAT_AS_EXTERNAL")
    if attr & 0x80:  flags.append("USES_RC4")
    if attr & 0x100: flags.append("USES_AES")
    if attr & 0x200: flags.append("NO_TGT_DELEGATION")
    if attr & 0x400: flags.append("PIM_TRUST")
    if attr & 0x800: flags.append("ENABLE_TGT_DELEGATION")
    return flags

print(decode_trust_attributes(0x20))  # ['WITHIN_FOREST']
print(decode_trust_attributes(0xC))   # ['QUARANTINED', 'FOREST_TRANSITIVE']
```

___

## Trust Account Objects (TDO)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {UserAccountControl -band 2048} -Properties UserAccountControl,SamAccountName,Description` | Users con UAC `INTERDOMAIN_TRUST_ACCOUNT` (bit 2048) | Identificar TDOs. |
| `Get-ADObject -SearchBase "CN=System,DC=corp,DC=local" -LDAPFilter "(objectClass=trustedDomain)" -Properties trustAuthIncoming,trustAuthOutgoing,whenCreated` | TDO completo (priv read) | Forensics + auth principals. |
| `secretsdump.py corp/u:p@<DC> -just-dc-user '<NETBIOS>$'` | Hash del trust account (DCSync) | Forging inter-realm TGT. |
^ad-types-tdo

**TDO key facts:**
- Cuenta `<NETBIOS>$` con UAC bit 2048 (`INTERDOMAIN_TRUST_ACCOUNT`).
- `trustAuthIncoming`/`trustAuthOutgoing` = passwords binarios (priv read only).
- Inter-realm TGT firmado con trust password = atacante con hash forja referrals (Golden cross-trust style).
- Rotación default 30 días.

```powershell
# TDOs en el domain
Get-ADUser -Filter {UserAccountControl -band 2048} `
  -Properties UserAccountControl,SamAccountName,Description,whenCreated |
  Select SamAccountName,Description,whenCreated
```

```bash
# Dump trust account hash via DCSync
secretsdump.py 'corp/auditor:Pass!'@<DC> -just-dc-user 'PARTNER$'
# Output:
# PARTNER$:<RID>:aad3b435...:<NTLM-hash>:::
```

___

## Trust Operational Tests

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nltest /sc_verify:<dom>` | Verificar trust funciona | Health check. |
| `runas /user:<other-dom>\user cmd` | Auth cross-trust desde Windows | Test interactive. |
| `runas /netonly /user:<other-dom>\user cmd` | Auth cross-trust con netonly (sin password local profile) | OPSEC red team. |
| `dir \\<foreign-DC>\sysvol` | Test SMB cross-trust | Confirm reachable. |
| `whoami /groups` (post-runas) | Groups efectivos cross-trust | Confirm group membership. |
| `klist` | TGTs + referral tickets | Inter-realm TGT visible. |
| `Get-ADGroupMember -Server <foreign-DC> "Domain Admins"` | Cross-trust group enum | LDAP cross-trust. |
| Event ID 4670 | Modificación TDO | Defender alert. |
| Event ID 4716 | TDO removed | Trust break. |
^ad-types-tests

```cmd
:: Pipeline test cross-trust desde Windows
nltest /sc_verify:partner.com
runas /netonly /user:partner.com\user cmd
:: Dentro shell:
whoami /groups
dir \\partner-dc\sysvol
nltest /server:partner-dc /trusted_domains
klist
```

***
