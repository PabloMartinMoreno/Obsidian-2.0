---
aliases:
  - AD Trusts Enumeration
  - Domain Trusts
  - Forest Trusts
  - Trust Discovery
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
kind: CheatSheet
linked:
  - "[[AD - Domain & Forest Trusts - Trust Discovery]]"
  - "[[AD - Domain & Forest Trusts - Trust Types]]"
  - "[[AD - Domain & Forest Trusts - Direction y Transitivity]]"
  - "[[AD - Domain & Forest Trusts - Authentication y SID Filtering]]"
  - "[[AD - Domain & Forest Trusts - Trust Recon para Ataques]]"
  - "[[AD - Domain & Forest Trusts - Tooling]]"
  - "[[Trust Abuse]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - Domain & Forest Trusts

---

## Cheatsheet

### 1. Recon Rápido (Probes)

#### Probes mínimos

```bash
# 1. Quick trust discovery
nltest /domain_trusts /all_trusts /v

# 2. Detail per trust
Get-ADTrust -Filter * -Properties trustAttributes |
  Select Name,Direction,IsTransitive,@{n='Attrs';e={'0x{0:X}' -f $_.trustAttributes}}

# 3. SID Filtering check (CRITICAL)
Get-ADTrust -Filter * |
  Select Name,SIDFilteringForestAware,SIDFilteringQuarantined

# 4. Foreign principals in privileged groups
foreach ($g in @("Domain Admins","Enterprise Admins","Schema Admins")) {
  Get-ADGroupMember $g -Recursive |
    Where {$_.distinguishedName -match "ForeignSecurityPrincipals"}
}

# 5. BloodHound cross-trust paths
# MATCH p=shortestPath((u:User {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@FOREIGN-DOM"}))
```

---

### 2. Enumeración

#### 🔍 Trust Discovery

````tabs
tab: **Native Windows Tools**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-native]]

tab: **LDAP Trust Discovery**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-ldap]]

tab: **PowerView / pywerview**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-powerview]]

tab: **BloodHound Trust Edges**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-bh]]

tab: **Cross-Forest / Forest Discovery**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-forest]]

tab: **Anonymous / Pre-Auth**
![[AD - Domain & Forest Trusts - Trust Discovery#^ad-trust-discover-anon]]
````

#### 🌐 Trust Types

````tabs
tab: **Intra-Forest Trusts**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-intraforest]]

tab: **Inter-Forest Trusts**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-interforest]]

tab: **Trust Type Decoded (trustType)**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-trusttype]]

tab: **Trust Attributes Flags**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-attributes]]

tab: **Trust Account Objects (TDO)**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-tdo]]

tab: **Trust Operational Tests**
![[AD - Domain & Forest Trusts - Trust Types#^ad-types-tests]]
````

#### ➡️ Direction & Transitivity

````tabs
tab: **Trust Direction Decoded**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-decoded]]

tab: **Transitivity Concept**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-transitive]]

tab: **Direction × Transitivity Matrix**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-matrix]]

tab: **Direction Impact on Attacks**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-attacks]]

tab: **Selective Authentication**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-selective]]

tab: **TGT Delegation Across Trusts**
![[AD - Domain & Forest Trusts - Direction y Transitivity#^ad-direction-tgtdelegation]]
````

#### 🔐 Authentication & SID Filtering

````tabs
tab: **Authentication Types Cross-Trust**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-types]]

tab: **Selective Authentication (Hardening)**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-selective]]

tab: **SID Filtering**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-sidfilter]]

tab: **SID History**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-sidhistory]]

tab: **Forging Inter-Realm TGT**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-tgtforge]]

tab: **Trust Account Compromise Chain**
![[AD - Domain & Forest Trusts - Authentication y SID Filtering#^ad-auth-trustchain]]
````

#### 💉 Trust Recon para Ataques

````tabs
tab: **Identify Attackable Trust Surfaces**
![[AD - Domain & Forest Trusts - Trust Recon para Ataques#^ad-trustrecon-surfaces]]

tab: **Foreign Group Membership Audit**
![[AD - Domain & Forest Trusts - Trust Recon para Ataques#^ad-trustrecon-foreign]]

tab: **Cross-Trust Reachability Mapping**
![[AD - Domain & Forest Trusts - Trust Recon para Ataques#^ad-trustrecon-mapping]]

tab: **Trust Account Discovery (DCSync)**
![[AD - Domain & Forest Trusts - Trust Recon para Ataques#^ad-trustrecon-tdo]]

tab: **Cross-Trust Kerberoast / AS-REP**
![[AD - Domain & Forest Trusts - Trust Recon para Ataques#^ad-trustrecon-roast]]
````

#### 🛠️ Tooling

````tabs
tab: **nltest (Native Windows)**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-nltest]]

tab: **RSAT / PowerShell**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-rsat]]

tab: **PowerView / pywerview**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-powerview]]

tab: **BloodHound / SharpHound**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-bh]]

tab: **Impacket / Linux Tools**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-impacket]]

tab: **Wordlists & Recursos**
![[AD - Domain & Forest Trusts - Tooling#^ad-trusttool-wordlists]]
````

---

## Overview

**AD Domain & Forest Trusts** = relaciones de confianza entre dominios/forests que permiten autenticación y autorización cross-domain. Trusts pueden ser intra-forest (parent-child, tree-root, shortcut) o inter-forest (external, forest, realm), con direction (one-way / bidirectional) y transitivity (transitive / non-transitive) configurables.

Para atacantes: trusts expanden la superficie de ataque. Identificar todos los trusts reachables, sus tipos, direcciones, transitividad, y configuración de SID Filtering / Selective Auth determina qué ataques cross-domain son viables.

### Cuándo es alto impacto

| Trust enum solo (info) | Trust enum como input para chains |
|---|---|
| Mapping forest scope | Forest takeover via SID History injection (CVSS Critical) |
| Identify foreign principals in privileged groups | Cross-forest privesc (CVSS Critical) |
| Trust direction + transitivity | Multi-hop attack planning |
| Trust account discovery | Forge inter-realm TGT (CVSS Critical) |
| TGT Delegation enabled | Cross-forest unconstrained delegation (CVSS High) |
| SID Filtering disabled | Forest takeover (CVSS Critical) |
| Selective Auth bypass | Cross-trust resource access (CVSS Medium-High) |

### Diferencia con otros enum hubs

| | **Trusts** | **Hosts Enum** | **Users Enum** |
|---|---|---|---|
| Foco | Cross-domain relationships | Computer objects + topology | User identities + groups |
| Output | Trust list + direction + type | Hostname/OS list | Usernames + UAC + SPN |
| Scope | Forest-wide / Cross-forest | Domain | Domain |
| Tooling | nltest, Get-ADTrust, BH | netexec, ldapsearch | netexec, RID brute |
| Combine con | Trust Abuse, Cross-trust attacks | Lateral, NTLM Relay | Kerberoast, AS-REP |
| Critical attrs | trustAttributes, trustDirection | UAC, SPN, OS | UAC, SPN, MemberOf |

### Por qué trusts importan para ataques

- **Forest takeover** — único vector que escala vía cross-forest privesc.
- **Trust accounts crackable** — DCSync local → forge inter-realm TGT.
- **Cross-trust Kerberoast** — service accounts foreign roastable.
- **TGT Delegation legacy** — unconstrained delegation cross-forest.
- **Foreign principals in priv groups** — cross-trust privesc shortcuts.
- **SID History abuse** — bypass SID Filtering para forest compromise.
- **Selective Auth misconfig** — too permissive = cross-trust lateral.

---

## Workflow de explotación

```
1. Discovery (initial):
   - nltest /domain_trusts /all_trusts /v
   - Get-ADTrust -Filter * -Properties *
   - LDAP query (objectClass=trustedDomain)

2. Categorize trusts:
   - Type: Parent-child, Tree-root, External, Forest, Realm
   - Direction: Inbound / Outbound / Bidirectional
   - Transitive: Yes / No
   - SID Filter: Enabled / Disabled (CRITICAL)
   - TGT Delegation: Default / Enabled (legacy)
   - Selective Auth: Yes / No

3. Map cross-trust reachability:
   - BloodHound trust edges
   - Multi-domain SharpHound runs
   - Cypher: MATCH paths from owned to foreign DA

4. Identify attack vectors per trust:
   a. Trust account compromise (DCSync local → forge TGT)
   b. Cross-trust Kerberoast (foreign service accounts)
   c. Cross-trust AS-REP roast (foreign DONT_REQ_PREAUTH users)
   d. Foreign principals in privileged groups (recursive enum)
   e. SID History injection (if SID Filter disabled)
   f. TGT Delegation abuse (if enabled, foreign UD compromise)

5. Execute cross-trust attacks:
   - DCSync local domain → trust account hash
   - Forge inter-realm TGT (mimikatz/ticketer)
   - With ExtraSids (foreign DA SID)
   - Inject + access foreign domain

6. Lateral within foreign forest:
   - Use forged credentials
   - Foreign DCSync (if rights propagated)
   - Foreign DA → forest root → Schema/Enterprise Admins

7. Persist:
   - Trust account hash valid until rotation
   - Multiple trust paths if multi-domain forest
   - Cleanup tickets after operations
```

---

## Impacto

- **Forest takeover via SID History** — bypass SID Filter → forge TGT con SID Admin foreign.
- **Cross-trust Kerberoast** — foreign service account hashes.
- **Cross-trust AS-REP roast** — foreign accounts without preauth.
- **Trust account compromise** — DCSync local → forge inter-realm TGT.
- **TGT Delegation legacy** — cross-forest unconstrained delegation = capture foreign DA TGTs.
- **Foreign principals in priv groups** — cross-trust direct privesc.
- **Selective Auth bypass** — too-permissive trust ACEs.
- **Schema Admins forest-wide** — single forest = critical for entire forest.
- **Multi-forest cascade** — transitive forest trust = wider blast.
- **Persistence via trust** — long-lived if not rotated.
- **Detection blind spots** — cross-domain logs harder to correlate.

---

## Mitigación (defender)

- **Enable SID Filtering on all external/forest trusts**:
  ```cmd
  netdom trust dom.local /domain:partner.com /quarantine:yes
  ```
- **Disable TGT Delegation on cross-forest trusts** (default post-2019):
  ```powershell
  Set-ADTrust -Identity partner.com -TGTDelegation $false
  ```
- **Enable Selective Authentication** for high-risk trusts:
  ```cmd
  netdom trust dom.local /domain:partner.com /selectivauth:yes
  ```
- **Audit foreign principals in privileged groups**:
  - No foreign user in Domain Admins / Enterprise Admins.
  - No foreign service account in Schema Admins.
- **Rotate trust passwords periodically** — beyond default 30 days for sensitive trusts.
- **Disable trusts no longer needed** — old vendor trusts often persist.
- **Monitor trust modification events**:
  ```
  Event ID 4670 (Trust attribute change)
  Event ID 4716 (Trust removed)
  Event ID 4865 (Trust info added)
  ```
- **Use Tier 0 isolation across forests** — don't share Tier 0 admins across forest trust.
- **PingCastle trust audit** — periodic health check.
- **Microsoft Defender for Identity** — trust attack alerts.
- **Disable RC4 in Kerberos** — force AES for inter-realm tickets:
  ```
  GPO: Computer Configuration > Policies > Windows Settings > Security Settings > 
       Local Policies > Security Options > 
       Network Security: Configure encryption types allowed for Kerberos
  ```
- **Document and review all trusts annually** — compliance.
- **Remove ANONYMOUS LOGON from foreign auth pathways** — restrict.

---

## Para entender Trusts

**Por qué AD usa trusts:**

Multi-domain organizations (mergers, geographic separation, security tiers) need cross-domain auth. Trusts allow user in dom-A to access resources in dom-B without dual accounts. Forest is design abstraction = multiple domains sharing schema + GC + automatic trusts.

**Por qué intra-forest trusts son inherentemente menos seguros que inter-forest:**

Intra-forest = same forest = SID Filtering disabled by default. Means: a user in child domain can craft tickets with ExtraSids targeting parent domain → privesc. Defense: enforce Selective Auth + SID Filtering even within forest (operational pain).

**Por qué SID Filtering matters tanto:**

SID Filtering removes SIDs from inter-realm TGTs that don't belong to trusted forest. Without SID Filtering, atacante puede inject ExtraSids = foreign DA SID = "I am DA of foreign forest" via forged TGT. Forest takeover via single attack.

**Por qué trust accounts son DCSync targets:**

Inter-realm TGT signed with trust password (computer-style account `<NETBIOS>$`). Knowing trust password = forge any inter-realm TGT = act as any user from foreign perspective. DCSync in local domain dumps trust account NT hash. Same as krbtgt but for cross-realm.

**Por qué TGT Delegation matters cross-forest:**

If TGT Delegation enabled (legacy default pre-2019), unconstrained delegation works cross-forest. Compromise foreign UD computer → capture TGTs of users from your forest auth there → use TGT to access your forest's DCs as compromised user. Microsoft disabled by default post-CVE-2019-1040.

**Por qué Selective Auth se ignora en práctica:**

Selective Auth requires explicit ACE on each resource for foreign principals. Operational overhead is high — admins forget to add ACEs, breaking workflows. Often disabled "for convenience" after first complaint. Best practice: granular per-resource Selective Auth on Tier 1+ resources only.

**Por qué Foreign Security Principals exist:**

When foreign user added to local group, their SID is stored in `CN=ForeignSecurityPrincipals` container. Acts as proxy object for cross-trust references. Atacante audit: enumerate FSPs to find privileged foreign principals.

**Por qué realm trusts (MIT) son edge case:**

Realm trusts allow Windows to trust non-Windows Kerberos realms (Linux MIT KDC, Heimdal). Common in mixed-OS enterprises. Trust password = krbtgt of foreign realm. Cross-realm Kerberos works similarly but tooling differs.

---

## Recursos

- [HackTricks - Cross Forest Attack](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/cross-forest) — comprehensive.
- [Will Schroeder - "A Guide To Attacking Domain Trusts"](https://posts.specterops.io/a-guide-to-attacking-domain-trusts-973a40996055) — foundational.
- [Dirk-jan Mollema - Trust Attacks](https://dirkjanm.io/) — research.
- [The Hacker Recipes - Trusts](https://www.thehacker.recipes/ad/movement/trusts) — reference.
- [ADSecurity - Trust Attacks](https://adsecurity.org/?p=1684) — Sean Metcalf research.
- [Microsoft - Trust Documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-trust-types) — vendor.
- [Microsoft - SID Filtering](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc794757(v=ws.10)) — vendor.
- [KB4490425 - TGT Delegation](https://support.microsoft.com/en-us/topic/managing-deployment-of-kerberos-protocol-secure-updates-related-to-cve-2020-17049-94ac8f0c-b176-2998-1f33-fdb17bbda21d) — KB.
- [CVE-2019-1040 NetLogon](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-1040) — patch reference.
- [CVE-2020-1472 Zerologon](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2020-1472) — adjacent.
- [BloodHound trust edges docs](https://bloodhound.readthedocs.io/en/latest/data-analysis/edges.html) — tool docs.
- [PingCastle](https://www.pingcastle.com/) — trust audit.
- [MITRE ATT&CK T1482 - Domain Trust Discovery](https://attack.mitre.org/techniques/T1482/) — framework.

---
