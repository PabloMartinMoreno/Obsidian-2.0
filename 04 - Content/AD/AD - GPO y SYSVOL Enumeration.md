---
aliases:
  - AD GPO Enumeration
  - SYSVOL Recon
  - GPP cpassword Hunt
  - Group Policy Discovery
  - AD - GPO & SYSVOL Enumeration
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
  - "[[AD - GPO y SYSVOL Enumeration - GPO Discovery]]"
  - "[[AD - GPO y SYSVOL Enumeration - GPO ACL Audit]]"
  - "[[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery]]"
  - "[[AD - GPO y SYSVOL Enumeration - GPP cpassword]]"
  - "[[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope]]"
  - "[[AD - GPO y SYSVOL Enumeration - Tooling]]"
  - "[[GPO Abuse]]"
  - "[[SYSVOL y GPP cpassword]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
---
# AD - GPO & SYSVOL Enumeration

***

## Cheatsheet

### 🔍 GPO Discovery

````tabs
tab: **GPO Inventory**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-inventory]]

tab: **Per-GPO Content via XML Report**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-content]]

tab: **Linked OUs Discovery**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-linkedous]]

tab: **SYSVOL Storage Path**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-sysvol]]

tab: **GPO Status & Settings**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-status]]

tab: **WMI Filters**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-wmi]]

tab: **Cross-Domain GPO**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-multidomain]]

tab: **Privileged GPO Identification**
![[AD - GPO y SYSVOL Enumeration - GPO Discovery#^ad-gpo-privileged]]
````

### 🛡️ GPO ACL Audit

````tabs
tab: **GPO Object DACL**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-rights]]

tab: **GPO Owner**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-owner]]

tab: **WriteGPLink ACE**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-writegplink]]

tab: **Group Policy Creator Owners**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-gpocreator]]

tab: **ACL Inheritance from Domain Root**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-inherit]]

tab: **SYSVOL File Permissions**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-sysvol]]

tab: **Cross-Correlate Tier 0**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-tier0]]

tab: **BloodHound GPO Edges**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-bh]]

tab: **Mitigations**
![[AD - GPO y SYSVOL Enumeration - GPO ACL Audit#^ad-gpoacl-mitigations]]
````

### 📂 SYSVOL Content Discovery

````tabs
tab: **SYSVOL Mount + Browse**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-mount]]

tab: **GPP Files**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-gppfiles]]

tab: **SYSVOL Scripts Discovery**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-scripts]]

tab: **Embedded Credentials Hunt**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-creds]]

tab: **Logon Script Modification**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-logonmod]]

tab: **NETLOGON Share**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-netlogon]]

tab: **Modern Best Practices**
![[AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery#^ad-sysvol-bestpractice]]
````

### 💉 GPP cpassword

````tabs
tab: **Find cpassword in SYSVOL**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-find]]

tab: **Decrypt cpassword (gpp-decrypt)**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-decrypt]]

tab: **GPP File Patterns**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-patterns]]

tab: **netexec gpp Modules**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-netexec]]

tab: **PowerSploit Get-GPPPassword**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-powersploit]]

tab: **Modern Mitigations**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-mitigations]]

tab: **OPSEC**
![[AD - GPO y SYSVOL Enumeration - GPP cpassword#^ad-cpassword-opsec]]
````

### 🌐 GPO Inheritance & Scope

````tabs
tab: **GPO Application Order**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-order]]

tab: **Per-OU gPLink Discovery**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-gplink]]

tab: **Block Inheritance**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-blockinherit]]

tab: **Enforced GPO Links**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-enforced]]

tab: **RSoP (Resultant Set of Policy)**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-rsop]]

tab: **Site-Linked GPOs**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-site]]

tab: **Cross-Correlate Privileged OUs**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-privou]]

tab: **BloodHound Cypher**
![[AD - GPO y SYSVOL Enumeration - GPO Inheritance y Scope#^ad-gpo-bh]]
````

### 🛠️ Tooling

````tabs
tab: **RSAT / PowerShell**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-rsat]]

tab: **PowerView (Adversary)**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-powerview]]

tab: **BloodHound / SharpHound**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-bh]]

tab: **SharpGPOAbuse (Privesc)**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-sharpgpoabuse]]

tab: **netexec / crackmapexec**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-netexec]]

tab: **Get-GPPPassword (PowerSploit)**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-getgpp]]

tab: **Snaffler (Auto-Discovery)**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-snaffler]]

tab: **bloodyAD (Linux)**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-bloodyad]]

tab: **Linux SMB Tools**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-linuxsmb]]

tab: **Wordlists & Recursos**
![[AD - GPO y SYSVOL Enumeration - Tooling#^ad-gpotool-resources]]
````

___

## Overview

**AD GPO & SYSVOL Enumeration** = identificar Group Policy Objects (GPOs), su scope (linked OUs), ACL (modify rights), SYSVOL content (scripts, GPP files), y vulnerabilities (cpassword legacy, embedded credentials). Foundation crítica para GPO Abuse y SYSVOL credential theft.

GPOs control machine + user configurations vía SYSVOL files. Modify permissions on GPO + linked Tier 0 OU = mass compromise. SYSVOL contains scripts and legacy GPP cpassword XMLs (pre-2014 patch). Atacante cred hunt + GPO modify chains.

### Cuándo es alto impacto

| GPO/SYSVOL enum (info) | GPO/SYSVOL como input |
|---|---|
| GPO inventory + linked OUs | Identify privesc paths |
| GPP cpassword found | Direct cleartext password (CVSS Critical) |
| Authenticated Users with GPO modify | Mass compromise (CVSS Critical) |
| GPO modify + linked Tier 0 OU | Tier 0 compromise (CVSS Critical) |
| Embedded creds in scripts | Direct credentials (CVSS High) |
| Group Policy Creator Owners populated | Backdoor potential (CVSS High) |
| BloodHound GPO paths | Visual privesc planning |
| Stale GPO modify rights | Cleanup hygiene |

### Diferencia con ACL Enumeration

| | **GPO/SYSVOL Enum** | **ACL Enumeration** |
|---|---|---|
| Foco | GPO + SYSVOL specifically | All AD ACLs |
| Output | GPO list + SYSVOL content + cpassword | Comprehensive DACL findings |
| Tooling | Get-GPO, SharpGPOAbuse, Snaffler | BloodHound, dsacls |
| Combine con | GPO Abuse, lateral via scripts | Privesc planning |
| Critical attrs | gPLink, gpcFileSysPath, cpassword | nTSecurityDescriptor |
| Patches: MS14-025 | GPP cpassword removed | Adjacent |

___

## Workflow

```
1. GPO inventory:
   - Get-GPO -All
   - Per-OU Get-GPInheritance
   - LDAP (objectClass=groupPolicyContainer)

2. ACL audit:
   - Per-GPO DACL (modify rights)
   - WriteGPLink on OUs
   - Group Policy Creator Owners group
   - Cross-correlate Tier 0 linked OUs

3. SYSVOL spider:
   - Mount //DC/SYSVOL
   - find/grep for sensitive files
   - Snaffler / nxc spider_plus
   - Per-extension targeted (xml, ini, ps1, bat, vbs)

4. GPP cpassword hunt:
   - findstr /S /M cpassword
   - nxc -M gpp_password (auto-decrypt)
   - Get-GPPPassword (PowerSploit)
   - Decrypt with gpp-decrypt or custom Python

5. Embedded creds hunt:
   - Snaffler comprehensive
   - Manual grep patterns
   - Per-script review

6. Inheritance + scope:
   - Block inheritance OUs
   - Enforced GPOs
   - RSoP per-host
   - Cross-correlate priv OUs

7. BloodHound visualization:
   - GpLink edges
   - GPO modify paths
   - Cross-correlate priv tier

8. Plan exploitation:
   a. GPP cpassword: decrypt + use
   b. Embedded creds: direct use
   c. SharpGPOAbuse: add user rights / scheduled task
   d. Logon script modify: persistence
   e. GPO + linked OU: mass compromise

9. Cleanup post-engagement:
   - Revert GPO modifications
   - Remove added scripts/tasks
   - Document changes
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. GPO inventory
nxc ldap $DC -u $USER -p $PASS --gpo

# 2. GPP cpassword auto-discover
nxc smb $DC -u $USER -p $PASS -M gpp_password

# 3. SYSVOL bulk spider
nxc smb $DC -u $USER -p $PASS -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1,vbs

# 4. Linux mount + cred hunt
sudo mount -t cifs //$DC/SYSVOL /mnt/sysvol -o user=$USER,pass=$PASS,domain=dom
grep -r "cpassword" /mnt/sysvol --include="*.xml"
grep -ri "password\|secret\|pwd" /mnt/sysvol

# 5. GPO modify ACL audit (Windows)
Get-GPO -All | ForEach-Object {
  $aclPath = "AD:CN={$($_.Id)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"
  Get-Acl $aclPath | Select -ExpandProperty Access | 
    Where {$_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|SYSTEM" -and 
           $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL"} |
    Select @{n='GPO';e={$_.DisplayName}},IdentityReference,ActiveDirectoryRights
}

# 6. BloodHound full
bloodhound-python -d dom.local -u $USER -p $PASS -ns $DC -c All --zip
```

___

## Impacto

- **GPP cpassword decryption** — cleartext passwords from XML.
- **GPO modify + linked Tier 0** — mass compromise (DC, all servers).
- **Embedded creds in SYSVOL scripts** — direct credentials.
- **SharpGPOAbuse user rights** — privesc on OU members.
- **Logon script modification** — persistence per-user logon.
- **GPO + linked Domain Controllers OU** — DC compromise.
- **Authenticated Users with GPO modify** — domain-wide privesc.
- **Group Policy Creator Owners populated** — atacante creates new GPO.
- **WriteGPLink** — link new malicious GPO.
- **Cross-trust GPO** — cross-forest impact.
- **Stale GPO ACE** — cleanup hygiene.
- **Service account with GPO modify** — common audit finding.
- **NETLOGON scripts with creds** — adjacent vector.

___

## Mitigación (defender)

- **Patch MS14-025** — GPP cpassword removed from new GPOs.
- **Audit existing GPP files** — pre-patch leftover cleanup.
- **Strict GPO DACL** — minimal modify rights:
  ```powershell
  Get-GPO -All | ForEach-Object {
    Set-GPPermission -Name $_.DisplayName -PermissionLevel GpoEdit -TargetName "Tier 0 Admins" -TargetType Group
  }
  ```
- **Empty Group Policy Creator Owners** — best practice.
- **Tier 0 GPO modify minimal** — Domain/Enterprise Admins only.
- **Per-quarter SYSVOL cred audit** — cpassword + embedded creds.
- **Modern: avoid GPP for credentials** — use gMSA + LAPS.
- **Signed scripts (AuthentiCode)** — hardening.
- **AppLocker on scripts** — hardening.
- **PowerShell Constrained Language** — adjacent hardening.
- **Detection alerts**:
  ```
  Event ID 5136 (GPO modify)
  Event ID 4719 (GPO creation)
  Event ID 4663 (SYSVOL access)
  ```
- **Microsoft Defender for Identity GPO alerts** — modern.
- **BloodHound continuous GPO audit** — modern.
- **PingCastle / Purple Knight GPO** — defender.
- **Compliance: documented per-GPO** — standard.
- **Stale GPO cleanup** — hygiene.
- **Cross-correlate priv tier** — standard audit.
- **Modern: continuous monitoring** — defender.

___

## Para entender GPO/SYSVOL

**Por qué GPO sensitive:**

GPOs control configuration across thousands of hosts. Modify GPO linked to Domain Controllers OU = control all DCs. Modify GPO linked to Workstations OU = mass compromise. Single ACE on GPO = wide impact. Tier 0 GPO modify = critical.

**Por qué cpassword legacy critical:**

Pre-2014, Group Policy Preferences allowed setting passwords (local admin, scheduled task run-as) via XML. cpassword field encrypted with AES-256 BUT key was public (Microsoft documented in MS-GPPREF spec). Anyone with SYSVOL read = decrypt all cpassword values. MS14-025 patched (May 2014) — cpassword removed from new GPOs. Legacy environments often have leftover XMLs.

**Por qué SYSVOL is broad attack surface:**

SYSVOL hosts:
- GPO files (XML, registry, scripts)
- Logon/logoff/startup scripts
- NETLOGON share (replicated)
- Adminstrator scripts often with embedded creds

Default Authenticated Users read = anyone in domain can hunt for creds. Snaffler-equivalent tools = fast discovery.

**Por qué SharpGPOAbuse dangerous:**

With WriteProperty on GPO + linked OU containing victims:
- Add user rights (e.g., SeDebugPrivilege on Tier 0)
- Add scheduled task running as SYSTEM
- Add startup/logon script
- Add registry settings (e.g., debugger key for accessibility tools)

Atacante modify + wait for `gpupdate` (or force) → mass compromise.

**Por qué Group Policy Creator Owners matters:**

Members can create new GPOs. Combined with WriteGPLink on OU = atacante creates malicious GPO + links to victim OU. Default empty. Any member is audit risk. Hardening: keep empty.

**Por qué WriteGPLink critical:**

Modify gPLink on OU = attach existing GPO (or new). Combined with Group Policy Creator Owners = create + link chain. Per-OU ACL audit critical.

**Por qué BloodHound transformative:**

Pre-BHCE: manual GPO ACL + linked OU correlation. Post-BHCE 5.x: GpLink edge + automated graph. "Find all paths via GPO modify to Tier 0" = single Cypher query. Modern audit standard.

**Por qué post-2014 still vulnerable:**

MS14-025 patches GPP cpassword in NEW GPOs. Pre-2014 XMLs persist in SYSVOL until manually cleaned. Many environments never audited + cleaned. Atacante finds cpassword XMLs from 2010-2013 era still in SYSVOL.

___

## Recursos

- [HackTricks - GPO Abuse](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/grouppolicypreferences) — comprehensive.
- [The Hacker Recipes - Group Policy](https://www.thehacker.recipes/ad/movement/group-policy) — reference.
- [PayloadsAllTheThings - GPO](https://github.com/swisskyrepo/PayloadsAllTheThings) — payloads.
- [SharpGPOAbuse](https://github.com/FSecureLABS/SharpGPOAbuse) — privesc tool.
- [PowerSploit Get-GPPPassword](https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Get-GPPPassword.ps1) — tool.
- [Snaffler](https://github.com/SnaffCon/Snaffler) — auto-discovery.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool.
- [Microsoft - Group Policy Documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy-management-tools) — vendor.
- [MS14-025 (GPP cpassword patch)](https://msrc.microsoft.com/update-guide/vulnerability/MS14-025) — KB reference.
- [MS-GPPREF Spec (cpassword key)](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-gppref/) — public spec.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [Microsoft Defender for Identity GPO alerts](https://learn.microsoft.com/en-us/defender-for-identity/) — modern.
- [PingCastle](https://www.pingcastle.com/) — audit.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit.
- [MITRE ATT&CK T1484.001](https://attack.mitre.org/techniques/T1484/001/) — Domain Policy Modification.
- [MITRE ATT&CK T1552.006](https://attack.mitre.org/techniques/T1552/006/) — Group Policy Preferences.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-active-directory) — curated.

***
