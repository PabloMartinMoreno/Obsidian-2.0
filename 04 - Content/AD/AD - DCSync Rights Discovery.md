---
aliases:
  - AD DCSync Rights Discovery
  - DCSync ACL Audit
  - Replication Rights Recon
  - GetChanges GetChangesAll
tags:
  - type/vulnerability
  - vuln/ad-enumeration
  - technique/discovery
  - technique/credential-access
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
  - "[[AD - DCSync Rights Discovery - DCSync Rights Definition]]"
  - "[[AD - DCSync Rights Discovery - Default vs Non-Default Holders]]"
  - "[[AD - DCSync Rights Discovery - ACL Audit on Domain Root]]"
  - "[[AD - DCSync Rights Discovery - Common Misconfigs]]"
  - "[[AD - DCSync Rights Discovery - BloodHound DCSync Edges]]"
  - "[[AD - DCSync Rights Discovery - Tooling]]"
  - "[[AD - ACL Enumeration]]"
  - "[[DCSync]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - DCSync Rights Discovery

***

## Cheatsheet

### 🔍 DCSync Rights Definition

````tabs
tab: **Replication Extended Rights**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-rights]]

tab: **DCSync Mechanism**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-mechanism]]

tab: **Default DCSync Holders**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-defaults]]

tab: **Storage Location**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-location]]

tab: **Detection Considerations**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-detection]]

tab: **RODC Filtered Set**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-rodc]]

tab: **DCSync vs DC Replication**
![[AD - DCSync Rights Discovery - DCSync Rights Definition#^ad-dcsync-vs-replication]]
````

### 🎯 Default vs Non-Default Holders

````tabs
tab: **Expected Default Holders**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-defaults]]

tab: **Common Misconfigurations**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-misconfigs]]

tab: **Exchange Legacy DCSync**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-exchange]]

tab: **Custom Tier 0 Groups**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-custom]]

tab: **Cross-Trust DCSync**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-crosstrust]]

tab: **Stale ACE Detection**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-stale]]

tab: **Continuous Audit**
![[AD - DCSync Rights Discovery - Default vs Non-Default Holders#^ad-dcsyncdef-continuous]]
````

### 🛡️ ACL Audit on Domain Root

````tabs
tab: **PowerShell DCSync Audit**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-pwsh]]

tab: **PowerView DCSync ACL**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-pv]]

tab: **Linux DCSync ACL**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-linux]]

tab: **BloodHound DCSync Edges**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-bh]]

tab: **Native dsacls**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-dsacls]]

tab: **Per-Quarter Compliance**
![[AD - DCSync Rights Discovery - ACL Audit on Domain Root#^ad-dcsyncacl-quarterly]]
````

### 💉 Common Misconfigs

````tabs
tab: **Authenticated Users / Domain Users**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-authusers]]

tab: **Service Accounts**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-svc]]

tab: **Exchange Legacy (CVE-2019-1040)**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-exchange]]

tab: **Cross-Trust Foreign Principals**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-crosstrust]]

tab: **Stale / Disabled Principals**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-stale]]

tab: **Recursive Group Membership**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-recursive]]

tab: **AdminSDHolder Modify**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-asdh]]

tab: **Per-Trust Audit**
![[AD - DCSync Rights Discovery - Common Misconfigs#^ad-dcsyncmisc-pertrust]]
````

### 📋 BloodHound DCSync Edges

````tabs
tab: **DCSync-Related Edges**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-edges]]

tab: **Shortest Path Queries**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-paths]]

tab: **Cross-Correlate Priv**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-correlate]]

tab: **Pre-Built BHCE Queries**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-prebuilt]]

tab: **Collection Considerations**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-collection]]

tab: **Custom Cypher (Compliance)**
![[AD - DCSync Rights Discovery - BloodHound DCSync Edges#^ad-dcsyncbh-compliance]]
````

### 🛠️ Tooling

````tabs
tab: **RSAT / PowerShell**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-rsat]]

tab: **PowerView (Adversary)**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-powerview]]

tab: **BloodHound / SharpHound**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-bh]]

tab: **bloodyAD (Linux)**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-bloodyad]]

tab: **DCSync Execution Tools**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-execution]]

tab: **Linux / Impacket Helpers**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-linux]]

tab: **Microsoft Defender for Identity**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-defender]]

tab: **Wordlists & Recursos**
![[AD - DCSync Rights Discovery - Tooling#^ad-dcsynctool-resources]]
````

___

## Overview

**AD DCSync Rights Discovery** = identificar principales con `DS-Replication-Get-Changes` + `DS-Replication-Get-Changes-All` rights en domain root. Both rights combined = capability to dump all NTDS via DRSUAPI (DCSync attack). Foundation crítica para identificar attack paths to krbtgt + all user passwords.

DCSync = single-shot domain compromise. Sin enum de DCSync rights, no se sabe qué cuentas comprometer para Golden Ticket. Default holders: DA, EA, Domain Controllers, Administrators, SYSTEM. Cualquier non-default = audit critical.

### Cuándo es alto impacto

| DCSync rights enum (info) | DCSync rights como input |
|---|---|
| Holder mapping | Identify Tier 0 escalation targets |
| Authenticated Users with DCSync | Critical misconfig (CVSS Critical) |
| Service account with DCSync | Common misconfig (CVSS Critical) |
| Exchange legacy CVE-2019-1040 | Patch verification (CVSS Critical legacy) |
| Cross-trust DCSync | Forest takeover path (CVSS Critical) |
| BloodHound paths to DCSync | Visual privesc planning |
| Stale ACE detection | Cleanup hygiene |
| AdminSDHolder modify | Tier 0 persistence (CVSS Critical) |

### Diferencia con ACL Enumeration

| | **DCSync Rights** | **ACL Enumeration** |
|---|---|---|
| Foco | Specific replication rights | All ACEs across all objects |
| Output | DCSync holders list | Comprehensive DACL audit |
| Scope | Domain root + AdminSDHolder | All objects |
| Depth | Specific GUID filter | All right types |
| Combine con | DCSync execution, Golden Ticket | Privesc planning, BloodHound |
| Compliance: per-quarter | Standard | Standard |

___

## Workflow

```
1. Schema check (DCSync GUIDs):
   - 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2 (Get-Changes)
   - 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2 (Get-Changes-All)
   - 89e95b76-444d-4c62-991a-0facbeda640c (Get-Changes-In-Filtered-Set)

2. Domain root ACL audit:
   - Get-Acl on domain DN
   - Filter for DCSync GUIDs
   - List all holders

3. Cross-correlate defaults:
   - DA, EA, Administrators, Domain Controllers, SYSTEM
   - Any non-default = audit risk

4. Identify misconfig patterns:
   a. Authenticated Users / Domain Users (CRITICAL)
   b. Service accounts (common)
   c. Exchange legacy (CVE-2019-1040)
   d. Cross-trust foreign principals (forest-takeover risk)
   e. Stale / disabled accounts
   f. Recursive nesting (hidden via groups)

5. AdminSDHolder audit:
   - DCSync rights on AdminSDHolder = Tier 0 persistence
   - SDProp propagation every 60min

6. BloodHound visualization:
   - GetChanges + GetChangesAll edges
   - Shortest path to DCSync from owned
   - Cross-correlate priv tier

7. Plan exploitation:
   a. Direct DCSync (if member of holder group)
   b. ACL chain → grant self DCSync → exploit
   c. AdminSDHolder modify → propagate → persist
   d. Cross-trust forge inter-realm TGT (with foreign DCSync rights)

8. Cleanup post-engagement:
   - Revert ACL modifications
   - Document changes
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. RSAT direct
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
)

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {$_.ObjectType -in $dcsyncRights} |
  Select IdentityReference,ObjectType

# 2. Native dsacls
dsacls "DC=dom,DC=local" | findstr /i "Replicating Directory"

# 3. PowerView
Get-DomainObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ObjectAceType -match "Replicating Directory"}

# 4. BloodHound
# MATCH (n)-[:GetChanges|GetChangesAll]->(d:Domain) RETURN n.name, type(r), d.name

# 5. Linux bloodyAD
bloodyAD --host $DC -d dom -u $USER -p $PASS \
  get object "DC=dom,DC=local" --resolve-sd
```

___

## Impacto

- **Domain compromise via DCSync** — full NTDS dump including krbtgt.
- **Golden Ticket capability** — krbtgt hash via DCSync.
- **Service account password recovery** — all hashes including service.
- **Trust account hash dump** — cross-trust impact.
- **Authenticated Users misconfig** — anyone in domain owns domain.
- **Exchange legacy CVE-2019-1040** — pre-patch widespread.
- **Cross-trust DCSync** — forest takeover via foreign principal.
- **AdminSDHolder DCSync persistence** — propagated every 60min.
- **Stale DCSync ACEs** — old delegations forgotten.
- **Service accounts as holders** — common misconfig.
- **Recursive group membership hidden** — DCSync via nested groups.

___

## Mitigación

- **Minimal DCSync grants** — DA, EA, Domain Controllers, SYSTEM only.
- **No service accounts with DCSync** — audit + remove.
- **No Authenticated Users with DCSync** — critical alert.
- **Patch CVE-2019-1040** — Exchange legacy DCSync.
- **AdminSDHolder DACL strict** — monitor 24x7.
- **Per-quarter compliance audit** — documented baseline.
- **Source IP whitelist** — DCs only for replication.
- **Detection alerts**:
  ```
  Event ID 4662 with replication GUIDs
  Microsoft Defender for Identity DCSync alert
  Source IP non-DC = critical alert
  Honeytoken accounts read = critical alert
  ```
- **Microsoft Defender for Identity** — modern detection.
- **PingCastle / Purple Knight** — audit tools.
- **BloodHound continuous** — ongoing audit.
- **Cross-trust SID Filtering** — limit foreign principal abuse.
- **TGT delegation cross-forest disabled** — modern default.
- **krbtgt rotation** — every 180 days twice consecutively.
- **Compliance: documented baseline** — per-org standard.

___

## Para entender DCSync Rights

**Por qué specific rights matter:**

DCSync requires BOTH `Get-Changes` AND `Get-Changes-All`. Get-Changes alone = limited (some attributes). Get-Changes-All = full secrets including password hashes. Default holders combine both. Atacante misconfig: accidental grant of just one is harmless; both = critical.

**Por qué AdminSDHolder DCSync = persistence:**

AdminSDHolder DACL propagated every 60min via SDProp to protected groups + members. Modify AdminSDHolder = modify reflected on ALL Tier 0. Add DCSync to AdminSDHolder DACL → atacante DCSync persistent (even if removed from group, propagation re-grants). Critical persistence backdoor.

**Por qué cross-trust DCSync critical:**

Foreign principal (cross-forest) with DCSync rights = atacante in foreign forest can DCSync local domain. Combined with SID Filtering disabled = forest takeover. Modern post-2019 patches limit cross-forest TGT delegation but DCSync via direct ACL still works.

**Por qué service accounts common DCSync:**

Operations: backup software needs replication-style read for full backups. Misconfigured: granted DCSync directly. Atacante compromises service account → DCSync. Common audit finding. Modern: gMSA + minimal scope better.

**Por qué Exchange legacy critical:**

Pre-2019, Exchange Trusted Subsystem + Exchange Windows Permissions had WriteDACL on domain root → could grant any rights including DCSync. CVE-2019-1040 + modern split permission model patched. Legacy environments still vulnerable. Audit Exchange permissions critical.

**Por qué BloodHound transformed audit:**

Pre-BloodHound: manual ACL queries + correlate group nesting in spreadsheets. BloodHound: automated graph + Cypher path queries. "Find all paths to DCSync from non-Tier 0" = single query. Game-changer for offensive + defensive audit.

___

## Recursos

- [HackTricks - DCSync](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync) — comprehensive.
- [The Hacker Recipes - DCSync](https://www.thehacker.recipes/ad/movement/credentials/dumping/dcsync) — reference.
- [ADSecurity (Sean Metcalf) - DCSync](https://adsecurity.org/?p=1729) — research.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool.
- [Microsoft - DRSUAPI](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-drsr/) — vendor.
- [Will Schroeder - "An ACE Up The Sleeve"](https://specterops.io/wp-content/uploads/sites/3/2022/06/an_ace_up_the_sleeve.pdf) — ACL research.
- [Microsoft Defender for Identity](https://learn.microsoft.com/en-us/defender-for-identity/) — modern detection.
- [PingCastle](https://www.pingcastle.com/) — audit.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit.
- [Impacket secretsdump](https://github.com/fortra/impacket) — DCSync execution.
- [Mimikatz dcsync](https://github.com/gentilkiwi/mimikatz) — Windows execution.
- [MITRE ATT&CK T1003.006](https://attack.mitre.org/techniques/T1003/006/) — DCSync technique.
- [CVE-2019-1040](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-1040) — Exchange legacy patch.
- [bloodyAD](https://github.com/CravateRouge/bloodyAD) — Linux ACL tool.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-active-directory) — curated.

***
