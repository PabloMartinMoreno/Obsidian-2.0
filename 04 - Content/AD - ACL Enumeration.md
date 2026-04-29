---
aliases:
  - AD ACL Enumeration
  - DACL Audit
  - ACL Recon AD
  - Dangerous ACE Discovery
tags:
  - type/vulnerability
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
type: CheatSheet
linked:
  - "[[AD - ACL Enumeration - ACL Inspection Tools]]"
  - "[[AD - ACL Enumeration - Dangerous ACE Patterns]]"
  - "[[AD - ACL Enumeration - ACL Path Patterns]]"
  - "[[AD - ACL Enumeration - Object-Specific Audits]]"
  - "[[AD - ACL Enumeration - ACE Filtering y Bulk Audit]]"
  - "[[AD - ACL Enumeration - Tooling]]"
  - "[[ACL Abuse]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
---
# AD - ACL Enumeration

***

## Cheatsheet

### 🔍 ACL Inspection Tools

````tabs
tab: **RSAT / PowerShell Native**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-rsat]]

tab: **PowerView (Adversary)**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-powerview]]

tab: **BloodHound (Visual)**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-bh]]

tab: **dsacls (Native Windows)**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-dsacls]]

tab: **ldapsearch / Linux**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-linux]]

tab: **ADRecon / Bulk Reports**
![[AD - ACL Enumeration - ACL Inspection Tools#^ad-acl-tools-bulk]]
````

### 🔓 Dangerous ACE Patterns

````tabs
tab: **GenericAll (Full Control)**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-genericall]]

tab: **GenericWrite**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-genericwrite]]

tab: **WriteDACL**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-writedacl]]

tab: **WriteOwner**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-writeowner]]

tab: **ForceChangePassword**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-forcechange]]

tab: **AddSelf / AddMember**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-addself]]

tab: **WriteProperty (Specific Attrs)**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-writeprop]]

tab: **DCSync Rights**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-dcsync]]

tab: **Other Dangerous ACEs**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-other]]

tab: **ACE Inheritance**
![[AD - ACL Enumeration - Dangerous ACE Patterns#^ad-ace-inheritance]]
````

### 🎯 ACL Path Patterns

````tabs
tab: **Direct Privesc Paths**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-direct]]

tab: **Group Membership Chains**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-groups]]

tab: **OU + GPO Chains**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-ougpo]]

tab: **Computer ACL → Lateral**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-computer]]

tab: **DCSync Path**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-dcsync]]

tab: **ADCS ESC1-ESC15 Paths**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-adcs]]

tab: **Anti-Patterns**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-antipatterns]]

tab: **Owns Edge (Ownership)**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-owns]]

tab: **Cypher Workhorse Queries**
![[AD - ACL Enumeration - ACL Path Patterns#^ad-aclpath-cypher]]
````

### 💉 Object-Specific Audits

````tabs
tab: **Domain Root Object**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-domainroot]]

tab: **Privileged Groups (DA, EA, Schema)**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-privgroups]]

tab: **AdminSDHolder Object**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-adminsdholder]]

tab: **Computer Objects**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-computers]]

tab: **OU Objects**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-ous]]

tab: **Group Policy Objects (GPOs)**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-gpos]]

tab: **ADCS Templates & CA**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-adcs]]

tab: **Bulk Forest-Wide Audit**
![[AD - ACL Enumeration - Object-Specific Audits#^ad-objspec-bulk]]
````

### 📋 ACE Filtering & Bulk Audit

````tabs
tab: **Find-InterestingDomainAcl**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-findacl]]

tab: **Custom Bulk Audit Scripts**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-custom]]

tab: **BloodHound Bulk Cypher**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-bhcypher]]

tab: **Foreign Principal Audit**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-foreign]]

tab: **Stale / Old ACE Detection**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-stale]]

tab: **Per-Quarter Compliance**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-quarterly]]

tab: **OPSEC Considerations**
![[AD - ACL Enumeration - ACE Filtering y Bulk Audit#^ad-bulk-opsec]]
````

### 🛠️ Tooling

````tabs
tab: **BloodHound / SharpHound**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-bh]]

tab: **PowerView (Adversary)**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-powerview]]

tab: **RSAT / PowerShell**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-rsat]]

tab: **bloodyAD (Linux)**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-bloodyad]]

tab: **ldapsearch / Linux**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-ldapsearch]]

tab: **ADRecon / Bulk Reports**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-adrecon]]

tab: **Custom Audit Tools**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-custom]]

tab: **Wordlists & Recursos**
![[AD - ACL Enumeration - Tooling#^ad-acl-tool-resources]]
````

___

## Overview

**AD ACL Enumeration** = identificar Discretionary Access Control Lists (DACLs) en objetos AD, dangerous ACE patterns, y privilege escalation paths via ACL chains. Foundation crítica para BloodHound attack path analysis y todo ACL Abuse.

ACEs típicamente otorgadas para administración legítima pero misconfigurations crean privesc paths. GenericAll, WriteDACL, WriteOwner, ForceChangePassword, AddMember en objetos privilegiados = direct path to Domain Admins.

### Cuándo es alto impacto

| ACL enum solo (info) | ACL como input para chains |
|---|---|
| Per-object DACL audit | Identify dangerous ACEs (CVSS — input) |
| BloodHound ACL graph | Visual privesc paths (CVSS — input) |
| Foreign principals in priv ACE | Cross-trust privesc (CVSS Critical) |
| Authenticated Users with priv ACE | Domain-wide privesc (CVSS Critical) |
| Helpdesk Tier 0 ACE | Cross-tier privesc (CVSS Critical) |
| Service account in priv ACL | Common audit finding (CVSS High) |
| WriteDACL on AdminSDHolder | Tier 0 persistence (CVSS Critical) |
| GetChanges + GetChangesAll on domain | DCSync (CVSS Critical) |

### Diferencia con otros enum hubs

| | **ACL Enum** | **Users Enum** | **Groups Enum** |
|---|---|---|---|
| Foco | Permissions per object | User identities + UAC | Group structure + members |
| Output | DACL findings | Username + UAC + SPN | Group hierarchy |
| Tooling | BloodHound, PowerView, dsacls | netexec, GetADUsers | Get-ADGroup, BH |
| Combine con | ACL Abuse, BH paths | Kerberoast, AS-REP, spray | Privilege analysis |
| Critical attrs | nTSecurityDescriptor | userAccountControl | groupType, member |
| Output volume | Massive (per-object × per-ACE) | Per-user | Per-group |

### Por qué importa para chains

- **BloodHound foundation** — visual privesc analysis requires ACL ingest.
- **GenericAll/WriteDACL paths** — direct privesc.
- **WriteOwner = 2-step privesc** — stealthier.
- **DCSync via ACL** — foundation for Golden Ticket.
- **AdminSDHolder ACL** — persistence backdoor.
- **GPO ACL** — mass compromise via GPO Abuse.
- **ADCS template ACL** — ESC4 / ESC7 attacks.

___

## Workflow de explotación

```
1. Initial collection (post-foothold):
   - SharpHound -c All / RustHound / bloodhound-python
   - ACL collection automatic in default mode

2. Visual analysis (BloodHound):
   - Cypher: shortest path from owned to DA
   - Cypher: dangerous ACL paths (filter edges)
   - Per-domain ingest

3. Object-specific audits:
   - Domain root (DCSync rights, GenericAll)
   - AdminSDHolder (Tier 0 persistence)
   - DA / EA / Schema groups
   - DCs (computer ACL)
   - High-value OUs (Tier 0 OU)
   - GPOs (Default Domain, DC Policy)
   - ADCS templates + CA

4. Identify dangerous ACEs:
   - GenericAll (full control)
   - GenericWrite (modify attrs)
   - WriteDACL (modify ACL)
   - WriteOwner (take ownership)
   - ForceChangePassword (reset pwd)
   - AddSelf / AddMember (group manipulation)
   - WriteProperty SPN / KeyCred / UAC (specific abuses)
   - GetChanges + GetChangesAll (DCSync)

5. Filter for high-value targets:
   - Authenticated Users / Domain Users with priv ACE (CRITICAL)
   - Helpdesk on Tier 0 (cross-tier)
   - Service accounts as principals
   - Foreign principals (cross-trust)

6. Plan exploitation chain:
   a. Direct path: ACE → reset pwd / addmember → impersonate
   b. 2-step: WriteDACL → grant self GenericAll → exploit
   c. 3-step: WriteOwner → take owner → grant self → exploit
   d. DCSync via group membership chain
   e. AdminSDHolder modify → SDProp propagation → Tier 0 persistence

7. BloodHound query refinement:
   - shortestPath / allShortestPaths
   - Custom Cypher for org-specific chains
   - Foreign principal cross-trust paths

8. Cleanup:
   - Revert ACL modifications
   - Remove added group members
   - Document changes for compliance
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. BloodHound full collection
bloodhound-python -d dom.local -u $USER -p $PASS -ns $DC -c All --zip

# 2. PowerView dangerous ACL filter
# Find-InterestingDomainAcl -ResolveGUIDs

# 3. Per-object critical audit (RSAT)
# Domain root, AdminSDHolder, DA group ACL

# 4. Authenticated Users with priv ACE (CRITICAL)
# Get-DomainObjectAcl ... | Where IdentityReference -match "Authenticated Users"

# 5. Foreign principals with priv ACE
# Get-DomainObjectAcl ... | Where IdentityReferenceDomain -ne $localDomain
```

___

## Impacto

- **BloodHound paths to DA** — visual privesc planning.
- **Direct privesc via single ACE** — GenericAll, ForceChangePassword.
- **2-step WriteDACL** — self-grant arbitrary permissions.
- **3-step WriteOwner** — stealthier ownership chain.
- **DCSync via ACL** — domain compromise.
- **AdminSDHolder modify** — Tier 0 persistence.
- **GPO ACL** — mass compromise (GPO Abuse hub).
- **ADCS template ACL** — ESC4/ESC7 attack paths.
- **Cross-trust ACL** — cross-forest privesc.
- **Foreign principals in priv** — common merger leftover.
- **Authenticated Users misconfig** — domain-wide privesc.
- **Helpdesk Tier 0** — cross-tier conflation.
- **Service account in priv ACL** — common audit finding.

___

## Mitigación (defender)

- **Tier 0 isolation** — Microsoft tiered admin model:
  - Tier 0: AD admins, DCs, ADFS, ADCS, KMS
  - Tier 1: Servers, applications
  - Tier 2: Workstations, end-users
  - No cross-tier ACL or admin reuse
- **Minimal ACL grants** — least privilege:
  - Document required ACEs per role
  - Periodic audit + cleanup
  - No "GenericAll for convenience"
- **Protect Tier 0 objects** — strict ACL:
  - Domain root (DCSync rights minimal)
  - AdminSDHolder (no non-default ACEs)
  - DA / EA / Schema groups (no service accounts)
- **Detection alerts**:
  ```
  Event ID 4670 (object permissions modified)
  Event ID 4738 (user account changed)
  Event ID 5136 (directory service object modified)
  Event ID 4662 (object access — replication GUID = DCSync)
  ```
- **Monitor priv group changes** — Event 4728/4732/4756.
- **Microsoft Defender for Identity** — anomalous ACL detection.
- **PingCastle / Purple Knight** — ACL section audit.
- **BloodHound continuous** — modern audit baseline.
- **AdminSDHolder hardening** — modify only by Tier 0.
- **Compliance: per-quarter ACL audit** — documented baseline.
- **Stale ACE cleanup** — periodic.
- **Privileged Access Workstations (PAWs)** — Tier 0 isolation.
- **Just Enough Administration (JEA)** — modern role-based.
- **Microsoft tiered admin reference** — adsecurity.org guidance.

___

## Para entender ACL Enumeration

**Por qué AD ACLs are complex:**

AD has 50+ different right types (GenericAll, WriteDACL, ForceChangePassword, AllExtendedRights, WriteProperty per attribute, etc.). Each AD object has DACL with multiple ACEs. ACEs inheritable from parent OUs. Result: enumerating effective permissions = combinatorial explosion. Pre-BloodHound: manual, error-prone. Post-BloodHound: automated graph analysis.

**Por qué BloodHound transformed AD attacks:**

Pre-BloodHound: red teamers manually queried per-object ACLs, traced chains in spreadsheets. Path-finding to DA = days/weeks. BloodHound: automated graph + Cypher path queries. "Find shortest path from owned principal to DA" = single query, instant result. Game-changer for offensive AD.

**Por qué GenericAll dangerous:**

Equivalent to NTFS "Full Control". Includes: GenericRead, GenericWrite, GenericExecute, ReadControl, WriteDACL, WriteOwner, ExtendedRights, Delete, etc. Holder can do anything: reset password, modify attributes, change ACL, take ownership. Single ACE = total compromise of object.

**Por qué WriteDACL is special:**

Modify ACL itself. Self-grant any right. 2-step privesc: WriteDACL → grant self GenericAll → exploit. Stealthier than direct GenericAll grant (defender sees ACL change rather than direct exploit). Common via service account misconfig.

**Por qué WriteOwner uniquely powerful:**

Owner has implicit modify rights. Take ownership → grant self GenericAll → exploit. 3-step but stealthier: defender sees ownership change (often missed) rather than ACL change. AdminSDHolder ownership = Tier 0 persistence.

**Por qué DCSync via ACL:**

`GetChanges` + `GetChangesAll` extended rights on domain root = replication permissions. Allows DCSync attack: pull all password hashes including krbtgt. Critical: any non-default holder = potential DCSync. Common misconfigs: Exchange (legacy), service accounts, cross-trust principals.

**Por qué AdminSDHolder is interesting target:**

DACL template propagated to all protected groups + members every 60min via SDProp. Modify AdminSDHolder ACL → modify reflected on ALL Tier 0 groups + their members. Persistent backdoor: even if removed from group, AdminSDHolder propagation can re-grant. Detection: AdminSDHolder modify events critical.

**Por qué cross-tier ACL = critical:**

Microsoft Tier model: helpdesk = Tier 2 admin. If helpdesk has ACL on Tier 0 objects → cross-tier privesc. Example: helpdesk has ForceChangePassword on Domain Admin user → atacante compromises helpdesk → resets DA password → DA. Critical audit pattern.

**Por qué foreign principal ACL = cross-trust risk:**

Cross-trust users with ACL on local objects = forest-wide privesc paths. Common via mergers (cleanup forgotten). With SID Filtering disabled, atacante can forge inter-realm TGT with foreign SID → use foreign principal's ACL on local. Critical to audit.

___

## Recursos

- [HackTricks - AD ACL Persistence Abuse](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse) — comprehensive.
- [The Hacker Recipes - DACL](https://www.thehacker.recipes/ad/movement/dacl) — reference.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [PowerView Cheat Sheet](https://github.com/HarmJ0y/CheatSheets/blob/master/PowerView.pdf) — reference.
- [Microsoft - DACL Documentation](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists) — vendor.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [Will Schroeder - "An ACE Up The Sleeve"](https://specterops.io/wp-content/uploads/sites/3/2022/06/an_ace_up_the_sleeve.pdf) — research.
- [Microsoft - AdminSDHolder](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/appendix-c--protected-accounts-and-groups-in-active-directory) — vendor.
- [BloodHound Custom Queries](https://github.com/CompassSecurity/BloodHoundQueries) — community queries.
- [Microsoft Defender for Identity](https://learn.microsoft.com/en-us/defender-for-identity/) — modern detection.
- [PingCastle](https://www.pingcastle.com/) — audit tool.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit tool.
- [bloodyAD](https://github.com/CravateRouge/bloodyAD) — Linux tool.
- [DSInternals](https://github.com/MichaelGrafnetter/DSInternals) — PowerShell tool.
- [MITRE ATT&CK T1098 - Account Manipulation](https://attack.mitre.org/techniques/T1098/) — framework.

***
