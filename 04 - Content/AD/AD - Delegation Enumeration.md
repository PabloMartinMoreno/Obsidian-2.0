---
aliases:
  - AD Delegation Enumeration
  - Kerberos Delegation Recon
  - UD CD RBCD Discovery
  - Shadow Credentials Enum
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - technique/privilege-escalation
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
  - "[[AD - Delegation Enumeration - Unconstrained Delegation]]"
  - "[[AD - Delegation Enumeration - Constrained Delegation S4U]]"
  - "[[AD - Delegation Enumeration - Resource-Based Constrained Delegation]]"
  - "[[AD - Delegation Enumeration - Shadow Credentials]]"
  - "[[AD - Delegation Enumeration - Cross-Trust Delegation]]"
  - "[[AD - Delegation Enumeration - Tooling]]"
  - "[[Unconstrained Delegation]]"
  - "[[Constrained Delegation (S4U)]]"
  - "[[Resource-Based Constrained Delegation (RBCD)]]"
  - "[[Shadow Credentials]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - Delegation Enumeration

---

## Cheatsheet

### 1. Recon Rápido (Probes)

#### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. UD discovery
nxc ldap $DC -u $USER -p $PASS --trusted-for-delegation

# 2. CD discovery (RSAT)
Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} -Properties msDS-AllowedToDelegateTo

# 3. RBCD discovery
Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'}

# 4. Shadow Cred candidates
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'}

# 5. ms-DS-MachineAccountQuota check
(Get-ADObject (Get-ADDomain).DistinguishedName -Properties ms-DS-MachineAccountQuota).'ms-DS-MachineAccountQuota'

# 6. BloodHound full
bloodhound-python -d dom.local -u $USER -p $PASS -ns $DC -c All --zip
```

---

### 2. Enumeración

#### 🔍 Unconstrained Delegation

````tabs
tab: **Concept Overview**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-concept]]

tab: **Computer Objects with UD**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-computers]]

tab: **User Objects with UD (Rare)**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-users]]

tab: **TGT Capture Workflow**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-workflow]]

tab: **Coercion + UD Chain**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-coercion]]

tab: **DCs (Default UD)**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-dcs]]

tab: **Cross-Correlate Priv Tier**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-tier]]

tab: **BloodHound UD Visualization**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-bh]]

tab: **Mitigations & Hardening**
![[AD - Delegation Enumeration - Unconstrained Delegation#^ad-ud-mitigations]]
````

#### 🎭 Constrained Delegation (S4U)

````tabs
tab: **Concept Overview**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-concept]]

tab: **msDS-AllowedToDelegateTo Attribute**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-attr]]

tab: **Use Kerberos Only vs Protocol Transition**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-modes]]

tab: **S4U2Self + S4U2Proxy Chain**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-s4u]]

tab: **Privileged CD Identification**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-privileged]]

tab: **BloodHound CD Visualization**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-bh]]

tab: **Common Misconfigurations**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-misconfig]]

tab: **Mitigations**
![[AD - Delegation Enumeration - Constrained Delegation S4U#^ad-cd-mitigations]]
````

#### 🔄 Resource-Based Constrained Delegation (RBCD)

````tabs
tab: **Concept Overview**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-concept]]

tab: **RBCD vs Classic CD**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-vs-cd]]

tab: **ms-DS-MachineAccountQuota Default**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-quota]]

tab: **RBCD Attack Chain**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-chain]]

tab: **RBCD ACL Audit**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-acl]]

tab: **BloodHound RBCD Edges**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-bh]]

tab: **Cross-Trust RBCD**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-crosstrust]]

tab: **Mitigations**
![[AD - Delegation Enumeration - Resource-Based Constrained Delegation#^ad-rbcd-mitigations]]
````

#### 🔑 Shadow Credentials

````tabs
tab: **Concept Overview**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-concept]]

tab: **msDS-KeyCredentialLink Attribute**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-attr]]

tab: **Shadow Credentials Attack Chain**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-chain]]

tab: **ACL Required**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-acl]]

tab: **BloodHound AddKeyCredentialLink Edge**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-bh]]

tab: **Existing Shadow Credentials Audit**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-audit]]

tab: **Detection & Mitigations**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-detection]]

tab: **Modern: NgC = Windows Hello**
![[AD - Delegation Enumeration - Shadow Credentials#^ad-shadowcred-ngc]]
````

#### 📋 Cross-Trust Delegation

````tabs
tab: **TGT Delegation Across Trusts**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-tgt]]

tab: **Cross-Domain (Intra-Forest)**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-intraforest]]

tab: **Inter-Forest Delegation**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-interforest]]

tab: **Foreign Principal Source**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-foreign]]

tab: **Modern Patches Impact**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-patches]]

tab: **Cross-Trust BloodHound**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-bh]]

tab: **Mitigations**
![[AD - Delegation Enumeration - Cross-Trust Delegation#^ad-crosstrust-mitigations]]
````

#### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-netexec]]

tab: **RSAT / PowerShell**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-rsat]]

tab: **PowerView (Adversary)**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-powerview]]

tab: **BloodHound / SharpHound**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-bh]]

tab: **ldapsearch / Linux**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-ldapsearch]]

tab: **Delegation Attack Tools**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-attack]]

tab: **bloodyAD**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-bloodyad]]

tab: **Wordlists & Recursos**
![[AD - Delegation Enumeration - Tooling#^ad-deleg-tool-resources]]
````

---

## Overview

**AD Delegation Enumeration** = identificar Kerberos delegation configurations: Unconstrained Delegation (TGT cache on hosts), Constrained Delegation (S4U2Self + S4U2Proxy per-SPN), Resource-Based Constrained Delegation (target-controlled), y Shadow Credentials (NgC abuse via msDS-KeyCredentialLink). Foundation crítica para privilege escalation y persistence.

Each delegation type has distinct attack patterns. UD = passive TGT capture (compromise host + wait). CD = active impersonation via S4U. RBCD = atacante-configurable via ms-DS-MachineAccountQuota abuse. Shadow Cred = modern stealthy persistence.

### Cuándo es alto impacto

| Delegation enum (info) | Delegation como input |
|---|---|
| UD computer mapping | TGT capture targets (CVSS Critical) |
| CD principal mapping | S4U impersonation paths (CVSS High) |
| RBCD configured | Direct lateral via S4U (CVSS High) |
| Shadow Cred capability | Stealth persistence (CVSS Critical) |
| Cross-trust delegation | Cross-forest privesc (CVSS Critical) |
| BloodHound delegation paths | Visual planning |
| Service account UD/CD | Common misconfig (CVSS High) |
| Stale delegation | Cleanup hygiene |

### Diferencia con ACL Enumeration

| | **Delegation Enum** | **ACL Enumeration** |
|---|---|---|
| Foco | Kerberos delegation specifically | All DACLs |
| Output | UD/CD/RBCD/ShadowCred lists | Comprehensive ACL findings |
| Attack model | Impersonation via S4U | Direct privesc via ACE |
| Tooling | netexec --trusted-for-delegation, certipy | BloodHound, dsacls |
| Combine con | Coercion, Pass-the-Ticket, ATA | Privesc planning, BloodHound |
| Critical attrs | UAC flags, msDS-AllowedToDelegateTo, KeyCredentialLink | nTSecurityDescriptor |
| Patches: 2019 KB4490425 | Cross-forest | Adjacent |

---

## Workflow

```
1. Schema check + initial enum:
   - UD: Get-ADComputer -Filter {TrustedForDelegation -eq $true}
   - CD: Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"}
   - RBCD: Get-ADComputer -Properties msDS-AllowedToActOnBehalfOfOtherIdentity
   - Shadow Cred: Get-ADUser -Properties msDS-KeyCredentialLink
   - netexec --trusted-for-delegation

2. Filter critical:
   - UD non-DC = critical risk
   - CD with protocol transition = stealthier
   - RBCD configured = active vector
   - Shadow Cred populated = audit

3. Cross-correlate priv tier:
   - Tier 0 server with UD (CRITICAL)
   - Service account in DA + CD (CRITICAL)
   - Helpdesk ACL on Shadow Cred attr
   - Cross-trust delegation (CRITICAL)

4. ms-DS-MachineAccountQuota check:
   - Default 10 = atacante can create computer for RBCD
   - Hardening: set to 0

5. BloodHound visualization:
   - AllowedToDelegate (CD)
   - AllowedToAct + AddAllowedToAct (RBCD)
   - AddKeyCredentialLink (Shadow Cred)
   - Cypher: shortest path via delegation

6. Plan exploitation:
   a. UD: compromise host → mimikatz TGT export → coerce DC auth
   b. CD: compromise principal → Rubeus s4u → impersonate
   c. RBCD: create computer (quota) → write msDS-AllowedToActOnBehalfOfOtherIdentity → S4U
   d. Shadow Cred: certipy shadow → PKINIT auth as victim

7. Cross-trust considerations:
   - TGT delegation cross-forest disabled default post-2019
   - SID Filtering enabled cross-trust default
   - Foreign principal in delegation = critical

8. Cleanup post-engagement:
   - Remove created computers
   - Revert RBCD modifications
   - Remove Shadow Cred entries
```

---

## Impacto

- **UD TGT capture** — compromise UD host + coerce DC = krbtgt TGT.
- **CD S4U2Proxy impersonation** — service-specific impersonation.
- **RBCD via quota abuse** — atacante creates computer + RBCD = lateral.
- **Shadow Cred PKINIT** — stealth persistence without password reset.
- **Cross-forest TGT delegation (legacy)** — cross-forest UD critical.
- **Foreign principal delegation** — cross-trust privesc.
- **Service account in DA + CD** — direct DCSync chain.
- **Tier 0 server with UD** — critical Tier 0 compromise.
- **Helpdesk ACL on KeyCredentialLink** — Shadow Cred privesc.
- **Stale delegation** — cleanup hygiene risk.
- **ms-DS-MachineAccountQuota = 10** — RBCD default risk.

---

## Mitigación (defender)

- **UD on non-DCs: remove** — best practice:
  ```powershell
  Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} |
    Set-ADAccountControl -TrustedForDelegation $false
  ```
- **Add Tier 0 to Protected Users group**:
  ```powershell
  Add-ADGroupMember -Identity "Protected Users" -Members "DA-User1","DA-User2"
  ```
- **`Account is sensitive and cannot be delegated`** for Tier 0 users:
  ```powershell
  Set-ADAccountControl -Identity "DA-User1" -AccountNotDelegated $true
  ```
- **ms-DS-MachineAccountQuota = 0** (block computer creation):
  ```powershell
  Set-ADDomain -Identity dom.local -Replace @{"ms-DS-MachineAccountQuota"=0}
  ```
- **TGT Delegation cross-forest disabled** (default modern):
  ```powershell
  Set-ADTrust -Identity partner.com -TGTDelegation $false
  ```
- **SID Filtering enabled cross-trust** (default modern).
- **Patch KB4490425 + CVE-2019-1040** for legacy environments.
- **Detection alerts**:
  ```
  Event ID 4738 (user account changed — UAC modify)
  Event ID 4742 (computer account changed)
  Event ID 4768 (TGT request — PKINIT for Shadow Cred)
  Event ID 4769 (TGS request — S4U)
  Event ID 5136 (object modified — delegation attrs)
  ```
- **Microsoft Defender for Identity** — delegation alerts.
- **BloodHound continuous** — modern audit baseline.
- **PingCastle / Purple Knight** — delegation section.
- **Per-quarter delegation audit** — documented baseline.
- **AES-only Kerberos** — disable RC4.
- **Credential Guard on Tier 0** — modern protection.
- **Modern: RBCD preferred over CD with protocol transition** — granular.

---

## Para entender Delegation

**Por qué Kerberos delegation exists:**

Multi-tier app: front-end web auth user, back-end DB needs user identity. Without delegation: app uses generic service account (no per-user audit). With delegation: app impersonates user to DB. Original mechanism = UD (full TGT cache). Modern = CD (per-service granular) and RBCD (target-controlled).

**Por qué UD is dangerous:**

User TGT cached on UD host LSASS. Compromise host = mimikatz → all cached TGTs (potentially DA). Combine with coercion (PetitPotam etc.) → force DC auth → capture DC$ TGT → DCSync. Single host compromise → domain compromise. Modern: minimize non-DC UD.

**Por qué CD is more secure:**

Constrained to specific SPNs. Atacante with CD principal can only impersonate to listed services. Plus protocol transition optional (Use Kerberos Only vs Use Any). Granular but still privesc path. Modern: RBCD preferred.

**Por qué RBCD modern preferred:**

CD configured by source (DA required). RBCD configured by target (delegated owner). Per-resource granularity. But: ms-DS-MachineAccountQuota default 10 allows atacante to create computer + configure RBCD. Hardening: quota = 0.

**Por qué Shadow Credentials stealthy:**

Adds cert to victim's `msDS-KeyCredentialLink` = atacante can PKINIT auth as victim. Doesn't reset password (no audit alert). Doesn't add to group (no membership change). Modern: Defender for Identity NgC alerts cover this.

**Por qué ms-DS-MachineAccountQuota matters:**

Default value 10 = any authenticated user can create 10 computers. Atacante creates computer → grants self RBCD on target → S4U2Proxy impersonate. Single LDAP write = full RBCD chain. Hardening: set to 0.

**Por qué cross-forest TGT delegation patched:**

Pre-2019: TGT delegation across forest = cross-forest UD. Compromise foreign forest UD host = capture local domain TGTs = local domain compromise. KB4490425 disabled default. Modern: explicitly re-enable required.

---

## Recursos

- [HackTricks - Constrained Delegation](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/constrained-delegation) — reference.
- [HackTricks - RBCD](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/resource-based-constrained-delegation) — reference.
- [HackTricks - Shadow Credentials](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/shadow-credentials) — reference.
- [The Hacker Recipes - Delegation](https://www.thehacker.recipes/ad/movement/kerberos/delegations) — comprehensive.
- [Will Schroeder - "Wagging the Dog"](https://shenaniganslabs.io/2019/01/28/Wagging-the-Dog.html) — RBCD foundational.
- [Elad Shamir - RBCD Attacks](https://shenaniganslabs.io/) — research.
- [Microsoft - Kerberos Delegation](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/design/role-of-claims) — vendor.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [Certipy (Shadow Credentials)](https://github.com/ly4k/Certipy) — modern tool.
- [Whisker (Shadow Cred Windows)](https://github.com/eladshamir/Whisker) — tool.
- [Microsoft Defender for Identity](https://learn.microsoft.com/en-us/defender-for-identity/) — modern detection.
- [PingCastle](https://www.pingcastle.com/) — audit tool.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit tool.
- [KB4490425 - TGT Delegation Patch](https://support.microsoft.com/en-us/topic/managing-deployment-of-kerberos-protocol-secure-updates-related-to-cve-2020-17049) — Microsoft KB.
- [CVE-2019-1040 NetLogon](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-1040) — patch reference.

---
