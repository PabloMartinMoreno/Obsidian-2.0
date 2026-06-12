---
aliases:
  - AD Groups Enumeration
  - Group Discovery AD
  - Privileged Group Recon
  - Group Membership Analysis
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
  - "[[AD - Groups Enumeration - Group List Extraction]]"
  - "[[AD - Groups Enumeration - Privileged Built-in Groups]]"
  - "[[AD - Groups Enumeration - Recursive Membership]]"
  - "[[AD - Groups Enumeration - Foreign y Cross-Trust Membership]]"
  - "[[AD - Groups Enumeration - High-Value Group Identification]]"
  - "[[AD - Groups Enumeration - Tooling]]"
  - "[[AD - Users Enumeration]]"
  - "[[BloodHound & SharpHound]]"
  - "[[ACL Abuse]]"
  - "[[netexec]]"
---
# AD - Groups Enumeration

---

## Cheatsheet

### 1. Recon Rápido (Probes)

#### Probes mínimos

```bash
DC="dc01.dom.local"

# 1. Anonymous (test always)
nxc smb $DC -u '' -p '' --groups
rpcclient -U "" $DC -N -c 'enumdomgroups'

# 2. Authenticated bulk
USER="user"; PASS="pass"
nxc ldap $DC -u $USER -p $PASS --groups > groups.txt

# 3. Tier 0 enumeration
for g in "Domain Admins" "Enterprise Admins" "Schema Admins" "Backup Operators" "Server Operators" "Account Operators" "DnsAdmins"; do
  echo "=== $g ==="
  nxc smb $DC -u $USER -p $PASS --groups "$g"
done

# 4. Foreign principals (PowerView Windows)
Find-ForeignUser
Find-ForeignGroup

# 5. BloodHound (best for visual)
bloodhound-python -d dom.local -u $USER -p $PASS -ns $DC -c All --zip
# Ingest in BloodHound CE → analyze paths
```

---

### 2. Enumeración

#### 🔍 Group List Extraction

````tabs
tab: **Bulk Group Listing**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-bulk]]

tab: **Group Properties & Attributes**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-attrs]]

tab: **Direct Members Query**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-members]]

tab: **Groups by Scope**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-scope]]

tab: **Anonymous Group Enumeration**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-anon]]

tab: **Cross-Domain (Forest-Wide)**
![[AD - Groups Enumeration - Group List Extraction#^ad-grouplist-forest]]
````

#### 🛡️ Privileged Built-in Groups

````tabs
tab: **Tier 0 Domain-Level Groups**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-tier0]]

tab: **Domain Admins (DA)**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-da]]

tab: **Enterprise Admins (EA)**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-ea]]

tab: **Schema Admins**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-schema]]

tab: **Built-in Groups (Domain Local)**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-builtin]]

tab: **DnsAdmins (Legacy RCE)**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-dnsadmins]]

tab: **Exchange-Related Groups (Legacy DCSync)**
![[AD - Groups Enumeration - Privileged Built-in Groups#^ad-priv-exchange]]
````

#### 🔄 Recursive Membership

````tabs
tab: **Direct vs Recursive**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-direct]]

tab: **Nested Group Patterns**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-patterns]]

tab: **Foreign Security Principals**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-fsp]]

tab: **tokenGroups Calculation**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-tokengroups]]

tab: **primaryGroupID Edge Cases**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-primary]]

tab: **Group Membership Audit**
![[AD - Groups Enumeration - Recursive Membership#^ad-recursive-audit]]
````

#### 🌐 Foreign / Cross-Trust Membership

````tabs
tab: **Foreign Security Principals (FSP)**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-fsp]]

tab: **Find-ForeignUser / Find-ForeignGroup**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-pwview]]

tab: **Cross-Domain Group Membership**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-cross]]

tab: **Authenticated Users / Everyone**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-implicit]]

tab: **Trust Account Group Membership**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-trustaccount]]

tab: **sIDHistory Cross-Trust**
![[AD - Groups Enumeration - Foreign y Cross-Trust Membership#^ad-foreign-sidhistory]]
````

#### 🎯 High-Value Group Identification

````tabs
tab: **Tier 0 (Forest/Domain Critical)**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-tier0]]

tab: **Backup Operators (NTDS Path)**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-backup]]

tab: **Server Operators (DC Logon)**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-serverop]]

tab: **Account Operators**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-accountop]]

tab: **GPO Creator Owners**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-gpocreator]]

tab: **DnsAdmins (Legacy CVE)**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-dnsadmins]]

tab: **Cert Publishers (ADCS)**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-certpub]]

tab: **Custom Privileged Groups**
![[AD - Groups Enumeration - High-Value Group Identification#^ad-hvgroup-custom]]
````

#### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-netexec]]

tab: **RSAT / PowerShell**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-rsat]]

tab: **PowerView / pywerview**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-powerview]]

tab: **BloodHound / SharpHound**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-bh]]

tab: **Impacket / Linux LDAP**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-impacket]]

tab: **Wordlists & Recursos**
![[AD - Groups Enumeration - Tooling#^ad-grouptool-resources]]
````

---

## Overview

**AD Groups Enumeration** = identificar todos los grupos del dominio, su scope (Global/Domain Local/Universal), tipo (Security/Distribution), membership (direct + recursive), y high-value targets (Tier 0 admins, service accounts en grupos privilegiados, foreign principals).

Foundation crítica para BloodHound attack path mapping, ACL abuse, privilege escalation análisis. Sin enum de grupos, no se puede mapear quién tiene qué privilegio.

### Cuándo es alto impacto

| Group enum solo (info) | Group enum como input |
|---|---|
| Group structure mapping | BloodHound attack paths (CVSS — input) |
| Tier 0 group members | Direct privesc target list (CVSS High-Critical) |
| Foreign principals in Tier 0 | Cross-trust privesc (CVSS Critical) |
| Service accounts in DA | Direct ATO via Kerberoast (CVSS High) |
| Backup Operators members | DC logon → NTDS dump → DCSync (CVSS Critical) |
| DnsAdmins members | Legacy RCE on DC (CVSS Critical legacy) |
| GPO Creator Owners + delegated linking | GPO Abuse → SYSTEM (CVSS High) |
| Stale users in priv groups | Spray candidate (CVSS Medium-High) |

### Diferencia con otros enum hubs

| | **Groups Enum** | **Users Enum** | **ACL Enum** |
|---|---|---|---|
| Foco | Group structure + membership | User attributes + UAC | Permissions per object |
| Output | Group list + members + scope | Username + UAC + SPN | DACL findings |
| Auth | Authenticated typical / null partial | Authenticated typical | Authenticated always |
| Tooling | netexec, Get-ADGroup, BH | netexec, GetADUsers, kerbrute | PowerView, dsacls |
| Combine con | BloodHound paths, ACL abuse | Kerberoast, AS-REP, spray | ACL abuse, BH paths |
| Privileged signal | Tier 0 group membership | adminCount=1 | DACL on objects |

### Por qué importa para chains

- **BloodHound foundation** — visual privilege mapping requires groups + ACLs.
- **Privileged group recursive** — find Tier 0 members + nested.
- **DA / EA / Schema Admins members** — direct privesc targets.
- **Backup Operators / Server Operators** — DC privesc paths.
- **DnsAdmins legacy** — pre-CVE-2017 RCE on DC.
- **GPO Creator Owners** — GPO Abuse path.
- **Foreign principals** — cross-trust privesc.
- **AdminSDHolder propagation** — Tier 0 pattern recognition.
- **Service accounts in Tier 0** — Kerberoast ATO chain.

---

## Workflow de explotación

```
1. Anonymous probes (initial recon):
   - nxc smb DC -u '' -p '' --groups (null SAMR)
   - rpcclient -U "" DC -N -c 'enumdomgroups'
   - enum4linux-ng -G DC

2. Authenticated bulk dump (post-cred):
   - nxc ldap DC -u u -p p --groups (LDAP)
   - nxc smb DC -u u -p p --groups (SAMR)
   - Get-ADGroup -Filter * -Properties * (RSAT)

3. Tier 0 deep dive:
   - Domain Admins, Enterprise Admins, Schema Admins
   - Built-in Administrators, Backup/Server/Account Operators
   - DnsAdmins, GPO Creator Owners, Cert Publishers
   - Recursive members per group

4. Foreign principals audit:
   - Find-ForeignUser / Find-ForeignGroup
   - FSPs in CN=ForeignSecurityPrincipals,...
   - Cross-trust principals in privileged groups

5. Recursive membership analysis:
   - Get-ADGroupMember -Recursive
   - tokenGroups computation per user
   - LDAP recursive filter (1.2.840.113556.1.4.1941)
   - Nested chain depth

6. Cross-correlate signals:
   - User in Tier 0 + service account = Kerberoast target
   - User in Tier 0 + AS-REP roastable = direct chain
   - Foreign user in Tier 0 = critical cross-trust
   - Stale user in priv group = spray candidate
   - PASSWD_NOTREQD + privileged = trivial ATO

7. BloodHound ingest:
   - SharpHound -c All
   - Cross-domain runs
   - Cypher: shortest path to DA
   - HighValue tag analysis

8. Plan exploitation:
   a. Tier 0 service account → Kerberoast → ATO
   b. Backup Operators → DC logon → NTDS dump → DCSync
   c. Server Operators → service binPath swap → SYSTEM
   d. DnsAdmins (legacy) → dnscmd plugin → SYSTEM
   e. GPO Creator + linking → GPO Abuse → mass compromise
   f. ACL chain via group ACEs → BloodHound path
```

---

## Impacto

- **BloodHound attack path mapping** — visual privilege hierarchy = strategic planning.
- **Tier 0 direct targets** — DA/EA/Schema Admins members = highest-value.
- **Backup Operators DC logon** — NTDS dump = full domain compromise.
- **Server Operators service swap** — SYSTEM on DC.
- **Account Operators reset non-admin pwds** — Tier 1+ privesc.
- **DnsAdmins legacy** — DLL plugin RCE pre-CVE-2017 patch.
- **GPO Creator + linking** — mass host compromise via GPO.
- **Cert Publishers** — ADCS NTAuth manipulation.
- **Foreign in Tier 0** — cross-trust critical privesc.
- **Service accounts in Tier 0** — Kerberoast → service password → DA.
- **AdminSDHolder protected groups** — atacante audit Tier 0 surface.
- **Recursive nesting** — hidden privilege chains.
- **Stale privileged users** — spray candidates.
- **Custom privileged groups** — per-org Tier 0 markers.

---

## Mitigación (defender)

- **Empty Schema Admins / Enterprise Admins by default** — break-glass only.
- **Minimize Domain Admins membership** — remove service accounts:
  ```powershell
  # Audit: should be very few real admins
  Get-ADGroupMember "Domain Admins" -Recursive |
    Get-ADUser -Properties ServicePrincipalName |
    Where ServicePrincipalName  # service accounts in DA = remove
  ```
- **Tier model isolation** (Microsoft):
  - Tier 0: AD admins, DCs, ADFS, ADCS, PKI infra
  - Tier 1: Servers, applications
  - Tier 2: Workstations, end-users
  - No cross-tier admin reuse
- **Audit DnsAdmins membership** — should be empty or minimal:
  ```powershell
  Get-ADGroupMember "DnsAdmins" -Recursive  # should be empty
  ```
- **Patch CVE-2017-7299** (DnsAdmins DLL plugin) — modern OS patched.
- **Group Policy Creator Owners minimal** — track GPO creation.
- **Cert Publishers minimal** — usually CA computer accounts only.
- **Backup Operators only for backup software accounts** — strict.
- **Server Operators / Account Operators rarely populated** — best practice.
- **AdminSDHolder DACL audit** — monitor for unauthorized changes.
- **Detect adminCount=1 stale** — users no longer in priv group but flag set.
- **Detection alerts**:
  ```
  Event ID 4728 (User added to security group)
  Event ID 4729 (User removed from security group)
  Event ID 4732 (Member added to local security group)
  Event ID 4756 (Member added to universal security group)
  ```
- **Foreign principals cleanup post-merger** — periodic audit.
- **Enable SID Filtering on cross-forest trusts** — defense-in-depth.
- **PingCastle / Purple Knight audits** — automated checks.
- **Microsoft Defender for Identity** — anomalous group membership detection.

---

## Para entender Groups Enumeration

**Por qué AD usa groups:**

Permissions assigned to groups, not individual users (best practice). Groups simplify management — add user to "Domain Admins" instead of granting per-resource. Groups can be nested (group as member of group) → token expansion at logon. Tradeoff: hidden privilege via nesting.

**Por qué Domain Admins is THE target:**

Default DA member = forest's "Administrator" account. Explicit + recursive members of DA = direct domain compromise. DA auto-added to Built-in Administrators on every domain-joined host = local admin everywhere. Single chain target = end-game for atacante.

**Por qué AdminSDHolder propagates DACL:**

Protected groups (DA, EA, Schema, Built-in Administrators, etc.) have permissions enforced via SDProp process. Every 60min, AdminSDHolder's DACL replicated to protected group members + groups. Prevents atacante from delegating per-user permissions on DA member. AdminCount=1 marker remains even after group removal (common bug).

**Por qué Backup Operators puede dumpear NTDS:**

`SeBackupPrivilege` allows reading any file regardless of NTFS DACL. NTDS.dit (AD database) protected by DACL, but Backup Operators bypass via privilege. ntdsutil + IFM creation: native privileged backup of NTDS + SYSTEM hive. Result: offline DCSync without needing DA.

**Por qué Server Operators puede privesc en DC:**

Modify any service via Service Control Manager. `sc.exe config <svc> binPath= cmd.exe` = on next service start, cmd.exe runs as SYSTEM. Default services often run as LocalSystem on DCs. Trivial chain: SO → modify svc binPath → restart svc → SYSTEM on DC.

**Por qué Account Operators isn't quite Tier 0:**

AdminSDHolder protects Tier 0 groups from AO modification. AO can reset non-admin passwords + create users + modify Tier 1 service accounts. AO → reset Tier 1 service account password → service has Tier 1 privileges → privesc to Tier 1. Two-step path to Tier 0 typically requires additional vector.

**Por qué DnsAdmins legacy was so dangerous:**

`dnscmd /serverlevelplugindll \\<unc>\<dll>` loaded arbitrary DLL into DNS Server service. DNS service runs as SYSTEM on DC = SYSTEM RCE. Required only DnsAdmins membership + reach to DC + UNC path control. Patched 2017 (CVE-2017-7299) — modern requires admin local on DC additionally. Legacy environments still vulnerable.

**Por qué Foreign Security Principals exist:**

Cross-trust users added to local groups create FSP entries. FSP DN = `CN=<foreign-SID>,CN=ForeignSecurityPrincipals,...`. Cross-trust user's SID acts as proxy member. Atacante audit: FSPs in privileged groups = cross-trust privesc paths. Common merger leftover.

**Por qué BloodHound transformed group analysis:**

Pre-BloodHound: manual recursive queries + correlation. BloodHound: automated graph + Cypher queries + visual paths. "Find all paths from owned principals to Tier 0" = single query. Foreign principals + cross-domain = visualized. ACL paths via groups = mapped. Game-changer for AD attacking.

---

## Recursos

- [HackTricks - AD Groups](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/active-directory-methodology) — reference.
- [The Hacker Recipes - Groups](https://www.thehacker.recipes/ad/recon/groups) — comprehensive.
- [PayloadsAllTheThings - AD](https://github.com/swisskyrepo/PayloadsAllTheThings) — payloads.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [PowerView Cheat Sheet](https://github.com/HarmJ0y/CheatSheets/blob/master/PowerView.pdf) — reference.
- [Microsoft - Built-in Groups](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-default-user-accounts) — vendor.
- [Microsoft - AdminSDHolder](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/appendix-c--protected-accounts-and-groups-in-active-directory) — defense reference.
- [Sean Metcalf - Tier Model](https://adsecurity.org/?p=4063) — adsecurity.
- [Will Schroeder - "Privileged Accounts and Effective Access"](https://posts.specterops.io/) — research.
- [DnsAdmins Privesc CVE-2017-7299](https://adsecurity.org/?p=4064) — historical.
- [Backup Operators Path](https://www.thehacker.recipes/ad/movement/builtin-groups/backup-operators) — privesc.
- [Server Operators Path](https://www.thehacker.recipes/ad/movement/builtin-groups/server-operators) — privesc.
- [SharpHound flags](https://support.bloodhoundenterprise.io/) — collection options.
- [LDAP Filter Syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax) — bitwise.
- [MITRE ATT&CK T1069.002 - Domain Group Discovery](https://attack.mitre.org/techniques/T1069/002/) — framework.

---
