---
aliases:
  - Trust Types AD
  - Forest Trust
  - External Trust
  - Parent-Child Trust
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - Domain & Forest Trusts]]"
---
# AD - Domain & Forest Trusts - Trust Types

***

## Intra-Forest Trusts (Within Same Forest)

| **Type** | **Description** | **Notas** |
|:---:|:---:|:---:|
| Parent-Child | Auto-created when child domain added | Default + transitive + bidirectional. |
| Tree-Root | Root of new tree in forest | Auto-created + transitive. |
| Shortcut (Cross-Link) | Manual — improve auth path | Optional + transitive. |
| Auto-creation | OS handles parent-child / tree-root | No manual setup. |
| Same krbtgt forest-wide | Single krbtgt per domain | Standard. |
| Trust password rotation | 30 days default | Standard. |
| Same forest = SID Filtering off | Default | Standard. |
| Cross-domain group membership allowed | "Domain Local" in target | Standard. |
| TGT delegation enabled by default | Within forest | Standard. |
| Universal groups span forest | Forest-wide membership | Standard. |
| Global Catalog forest-wide | All users searchable | Standard. |
| Schema Admins forest-wide | Tier 0 forest-level | Privileged. |
| Enterprise Admins forest-wide | Tier 0 forest-level | Privileged. |
| Replication via ForestDnsZones | Auto | Standard. |
| Trust attribute: TRUST_ATTRIBUTE_WITHIN_FOREST | Bit 0x20 | Detection. |
| Cross-forest impossible without forest trust | Different relationships | Adjacent. |
^ad-types-intraforest

### Intra-forest trust example

```powershell
# Forest with multiple domains
Get-ADForest | Select Domains
# Output: child1.dom.local, child2.dom.local, dom.local

# Each parent-child trust
Get-ADTrust -Filter * | Where {$_.Source -eq "DC=dom,DC=local"} |
  Select Name,TrustType,Direction,IsTransitive
# Type: ParentChild
# Direction: BiDirectional
# Transitive: True
```

___

## Inter-Forest Trusts (Cross-Forest)

| **Type** | **Description** | **Notas** |
|:---:|:---:|:---:|
| External Trust | Pre-2003 cross-forest | One-way OR two-way, non-transitive. |
| Forest Trust | Modern cross-forest (2003+) | Two-way OR one-way, forest-transitive. |
| Realm Trust | Non-Windows Kerberos (Unix MIT KDC) | Edge. |
| External vs Forest trust | Forest = transitive across forest | Major diff. |
| SID Filtering enabled by default | Inter-forest | Defense. |
| TGT delegation disabled by default (post-2019) | Inter-forest | Defense. |
| Forest-wide auth vs Selective Auth | Configurable | Hardening. |
| Allowed-To-Authenticate ACE | Selective Auth principal | Granular. |
| Trust account `<NETBIOS>$` per side | Each side has TDO | Standard. |
| Trust password rotation | 30 days default | Auto. |
| Trust account hash | Crackeable like krbtgt | Privesc target. |
| Cross-forest universal group denied | Different forest = different GC | Edge. |
| Foreign Security Principals (FSP) | SIDs from foreign forest | Edge container. |
| Trust account user object | `<NETBIOS>$@<other>` | Identifies trust. |
| Routed trust (transitive forest) | Multi-hop trust resolution | Edge. |
| Trust shortcut creation | Improve cross-forest path | Optional. |
^ad-types-interforest

### Forest trust attributes

```powershell
# Forest trusts
Get-ADTrust -Filter {ForestTransitive -eq $true}

# External trusts (legacy, less common)
Get-ADTrust -Filter {TrustType -eq "Uplevel"} | 
  Where {$_.ForestTransitive -eq $false}

# Realm trusts
Get-ADTrust -Filter {TrustType -eq "Kerberos"}

# Trust attributes flags
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,@{n='AttrFlags';e={'0x{0:X}' -f $_.trustAttributes}}
```

___

## Trust Type Decoded (LDAP `trustType`)

| **Value** | **Type** | **Notas** |
|:---:|:---:|:---:|
| 1 | Downlevel (Windows NT) | Pre-AD legacy. |
| 2 | Uplevel (Active Directory) | Standard. |
| 3 | MIT Kerberos | Realm trust (Unix). |
| 4 | DCE | Old DCE/RPC realm. |
| `TRUST_TYPE_DOWNLEVEL` constant | NT-style | Edge. |
| `TRUST_TYPE_UPLEVEL` constant | AD-to-AD | Modern. |
| `TRUST_TYPE_MIT` constant | Cross-realm Kerberos | Unix. |
| Default for parent-child | Uplevel (2) | Standard. |
| Default for forest trust | Uplevel (2) | Standard. |
| Realm trust | MIT (3) | Unix only. |
| Old NT4 trust | Downlevel (1) | Legacy. |
| Modern installations | Always Uplevel | Standard. |
| Pre-Win 2000 compat | Downlevel | Edge legacy. |
| Cross-realm with Linux KDC | MIT | Linux realm. |
| Heimdal Kerberos compat | MIT | Linux. |
| Microsoft AD as KDC | Uplevel | Standard. |
^ad-types-trusttype

### trustType field check

```bash
# LDAP raw query
ldapsearch -h DC -D 'dom\user' -w pass \
  -b "CN=System,DC=dom,DC=local" \
  "(objectClass=trustedDomain)" \
  cn trustType trustDirection trustAttributes

# Decode
# trustType: 1 = Downlevel (NT), 2 = Uplevel (AD), 3 = MIT, 4 = DCE
```

___

## Trust Attributes Flags Decoded

| **Flag** | **Hex** | **Significado** |
|:---:|:---:|:---:|
| TRUST_ATTRIBUTE_NON_TRANSITIVE | 0x1 | Trust does NOT cascade. |
| TRUST_ATTRIBUTE_UPLEVEL_ONLY | 0x2 | Win 2000+ only. |
| TRUST_ATTRIBUTE_QUARANTINED_DOMAIN | 0x4 | SID filtering enforced. |
| TRUST_ATTRIBUTE_FOREST_TRANSITIVE | 0x8 | Forest trust transitive. |
| TRUST_ATTRIBUTE_CROSS_ORGANIZATION | 0x10 | Cross-org trust (auth marker). |
| TRUST_ATTRIBUTE_WITHIN_FOREST | 0x20 | Intra-forest trust. |
| TRUST_ATTRIBUTE_TREAT_AS_EXTERNAL | 0x40 | SID filtering treats as external. |
| TRUST_ATTRIBUTE_USES_RC4_ENCRYPTION | 0x80 | Edge — RC4 only. |
| TRUST_ATTRIBUTE_USES_AES_KEYS | 0x100 | AES keys (modern). |
| TRUST_ATTRIBUTE_CROSS_ORGANIZATION_NO_TGT_DELEGATION | 0x200 | TGT delegation disabled. |
| TRUST_ATTRIBUTE_PIM_TRUST | 0x400 | PIM trust (Privileged Identity Mgmt). |
| TRUST_ATTRIBUTE_CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION | 0x800 | TGT delegation enabled (legacy). |
| Combined flags | Bitwise OR | Standard. |
| Default forest trust | 0x8 (FOREST_TRANSITIVE) | Standard. |
| Default external trust | 0x4 (QUARANTINED) typically | Standard. |
| Default parent-child | 0x20 (WITHIN_FOREST) | Standard. |
^ad-types-attributes

### Decode trustAttributes

```python
def decode_trust_attributes(attr):
    flags = []
    if attr & 0x1: flags.append("NON_TRANSITIVE")
    if attr & 0x2: flags.append("UPLEVEL_ONLY")
    if attr & 0x4: flags.append("QUARANTINED (SID filtering)")
    if attr & 0x8: flags.append("FOREST_TRANSITIVE")
    if attr & 0x10: flags.append("CROSS_ORGANIZATION")
    if attr & 0x20: flags.append("WITHIN_FOREST")
    if attr & 0x40: flags.append("TREAT_AS_EXTERNAL")
    if attr & 0x80: flags.append("USES_RC4")
    if attr & 0x100: flags.append("USES_AES")
    if attr & 0x200: flags.append("NO_TGT_DELEGATION")
    if attr & 0x400: flags.append("PIM_TRUST")
    if attr & 0x800: flags.append("ENABLE_TGT_DELEGATION")
    return flags

# Example
print(decode_trust_attributes(0x20))  # ['WITHIN_FOREST']
print(decode_trust_attributes(0xC))   # ['QUARANTINED', 'FOREST_TRANSITIVE']
```

___

## Trust Account Objects (TDO)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Trust Domain Object (TDO) | Stored as `trustedDomain` LDAP object | LDAP class. |
| Auth account | `<NETBIOS>$` user object | Cross-trust auth. |
| `trustAuthIncoming` | Incoming password (binary) | Privileged read. |
| `trustAuthOutgoing` | Outgoing password (binary) | Privileged read. |
| Auth principal | Inter-realm TGT signed with this | Kerberos. |
| Trust password rotation | 30 days default | Standard. |
| Account flags | `INTERDOMAIN_TRUST_ACCOUNT` UAC flag | UAC. |
| Trust account in `Users` | `<NETBIOS>$` user typically | Standard. |
| Cross-trust TGT (referral ticket) | Signed with trust password | Forging target. |
| krbtgt-style attack on trust account | Forge inter-realm TGT | Specific attack. |
| Trust account hash dump | Privileged (Domain Admins) only | DCSync target. |
| Hash format: ntds-style hash | Standard | DCSync output. |
| Forest trust = bidirectional auth account | Both sides | Standard. |
| External trust auth account | One per direction | Standard. |
| TDO modification = trust break | Critical | Defender alarm. |
| Inter-realm TGT cracking | If hash leaked | Critical. |
^ad-types-tdo

### TDO inspection

```powershell
# Trust account user objects
Get-ADUser -Filter {UserAccountControl -band 2048} -Properties UserAccountControl,SamAccountName,Description |
  Select SamAccountName,Description
# UAC flag 2048 = INTERDOMAIN_TRUST_ACCOUNT

# TDO via DCSync (privileged)
# secretsdump dom/user:pass@DC -just-dc
# Look for entries like: TRUSTNAME$:hash:...
```

___

## Trust Operational Tests

| **Test** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Trust health | `nltest /sc_query:<dom>` | Local domain SC. |
| Trust verify | `nltest /sc_verify:<dom>` | Bidirectional check. |
| Authentication test | `runas /user:<dom>\user cmd` | Cross-trust login. |
| Cross-trust file access | `dir \\foreign-DC\share` | SMB test. |
| Cross-trust LDAP query | `ldapsearch -h foreign-DC -D 'local\user' -w pass` | Cross-domain auth. |
| Cross-trust GC query | Forest-aware | Forest scope. |
| Foreign group membership | `whoami /groups` | Cross-trust groups. |
| TGT request to foreign domain | `klist` after foreign access | Kerberos. |
| Referral ticket | `klist` shows ms-srv-realm | Inter-realm TGT. |
| Trust password expiry | `lastTrustExchangeTime` | Adjacent. |
| Trust as user | `runas /netonly` for cross-realm | Edge. |
| `whoami /upn` | UPN reveals trust scope | Identification. |
| Cross-trust group enum | `Get-ADGroupMember` from foreign | Adjacent. |
| `Get-ADTrust -Identity dom.local` | Per-trust detail | Standard. |
| Trust monitoring (defender) | Event 4670 (Trust modify) | Defender. |
| Trust break event | Event 4716 (TDO removed) | Defender. |
^ad-types-tests

### Trust verification + cross-trust auth test

```cmd
:: Verify trust
nltest /sc_verify:partner.com

:: Auth across trust
runas /user:partner.com\user cmd

:: From new shell:
whoami /groups
:: Should show foreign domain groups + Authenticated Users

:: Access foreign DC
dir \\partner-dc\sysvol
nltest /server:partner-dc /trusted_domains
```

***
