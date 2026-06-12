---
aliases:
  - AD Password Policy Enumeration
  - Domain Password Policy
  - Fine-Grained Policy Discovery
  - Lockout Policy Recon
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
  - "[[AD - Password Policy Enumeration - Default Domain Policy]]"
  - "[[AD - Password Policy Enumeration - Fine-Grained Password Policies]]"
  - "[[AD - Password Policy Enumeration - Lockout y Brute Force Implications]]"
  - "[[AD - Password Policy Enumeration - Anonymous Policy Discovery]]"
  - "[[AD - Password Policy Enumeration - Audit y Misconfiguraciones]]"
  - "[[AD - Password Policy Enumeration - Tooling]]"
  - "[[AD - Users Enumeration]]"
  - "[[HTTP Brute Forcing]]"
  - "[[netexec]]"
---
# AD - Password Policy Enumeration

---

## Cheatsheet

### 1. Recon Rápido (Probes)

#### Probes mínimos

```bash
DC="dc01.dom.local"

# 1. Anonymous (test always)
nxc smb $DC -u '' -p '' --pass-pol
rpcclient -U "" $DC -N -c 'getdompwinfo'

# 2. Authenticated baseline
USER="user"; PASS="pass"
nxc smb $DC -u $USER -p $PASS --pass-pol

# 3. RSAT comprehensive (if Windows access)
Get-ADDefaultDomainPasswordPolicy
Get-ADFineGrainedPasswordPolicy -Filter *

# 4. krbtgt age check
$krbtgt = Get-ADUser krbtgt -Properties pwdLastSet
$age = ((Get-Date) - [datetime]::FromFileTime($krbtgt.pwdLastSet)).Days
Write-Host "krbtgt age: $age days"

# 5. Reversible encryption check
(Get-ADDefaultDomainPasswordPolicy).ReversibleEncryptionEnabled
Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true}

# 6. PingCastle audit (defender comprehensive)
PingCastle.exe --healthcheck --server $DC
```

---

### 2. Enumeración

#### 🔍 Default Domain Password Policy

````tabs
tab: **Native Windows Tools**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-native]]

tab: **netexec / crackmapexec**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-netexec]]

tab: **RPC Anonymous Discovery**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-rpc]]

tab: **LDAP Direct Query**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-ldap]]

tab: **pwdProperties Bitfield**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-properties]]

tab: **krbtgt Password Age**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-krbtgt]]

tab: **Multi-Domain Forest-Wide**
![[AD - Password Policy Enumeration - Default Domain Policy#^ad-pwdpol-multidomain]]
````

#### 🎯 Fine-Grained Password Policies (PSO)

````tabs
tab: **PSO Overview**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-overview]]

tab: **PSO Critical Attributes**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-attrs]]

tab: **PSO Scope (msDS-PSOAppliesTo)**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-scope]]

tab: **Resultant Password Policy**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-resultant]]

tab: **PSO Misconfigurations**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-misconfig]]

tab: **PSO Read Permission ACL**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-acl]]

tab: **Anonymous PSO Discovery**
![[AD - Password Policy Enumeration - Fine-Grained Password Policies#^ad-pso-anonymous]]
````

#### ⚙️ Lockout & Brute Force Implications

````tabs
tab: **Lockout Mechanics**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-mechanics]]

tab: **Spray Window Calculation**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-spray]]

tab: **Reverse Spray (1 pwd × N users)**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-reversespray]]

tab: **Bad Password Count Tracking**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-badcount]]

tab: **Pre-Spray Validation**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-prespray]]

tab: **Honeypot Account Detection**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-honeypot]]

tab: **Per-User Lockout Variations**
![[AD - Password Policy Enumeration - Lockout y Brute Force Implications#^ad-lockout-peruser]]
````

#### 🔓 Anonymous Policy Discovery

````tabs
tab: **RPC Anonymous (rpcclient)**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-rpcclient]]

tab: **netexec / crackmapexec Anonymous**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-netexec]]

tab: **enum4linux-ng**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-enum4linux]]

tab: **LDAP Anonymous (Limited)**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-ldap]]

tab: **OPSEC Considerations**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-opsec]]

tab: **Cross-Correlation with Spray Results**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-correlation]]

tab: **Defender Hardening Indicators**
![[AD - Password Policy Enumeration - Anonymous Policy Discovery#^ad-anon-defender]]
````

#### 📊 Audit & Misconfiguraciones

````tabs
tab: **Weak Min Length / No Complexity**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-weakness]]

tab: **Reversible Encryption**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-reversible]]

tab: **krbtgt Stale Password**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-krbtgt]]

tab: **No-Lockout / Lockout=0**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-nolockout]]

tab: **Compliance Standards**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-compliance]]

tab: **Custom PSO Audit**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-customsvcs]]

tab: **PingCastle / Purple Knight**
![[AD - Password Policy Enumeration - Audit y Misconfiguraciones#^ad-audit-tools]]
````

#### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-netexec]]

tab: **RSAT / PowerShell**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-rsat]]

tab: **rpcclient / Native Linux**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-rpc]]

tab: **enum4linux / enum4linux-ng**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-enum4linux]]

tab: **PingCastle / Purple Knight / ADRecon**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-pingcastle]]

tab: **Custom Audit Scripts**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-custom]]

tab: **Wordlists & Recursos**
![[AD - Password Policy Enumeration - Tooling#^ad-pwdpol-tool-resources]]
````

---

## Overview

**AD Password Policy Enumeration** = identificar default domain password policy + Fine-Grained Password Policies (PSO) + lockout configuration. Crítico para planificar password spray, identificar weak settings (reversible encryption, no lockout, weak min length), y auditar compliance.

Sin este enum, password spray es ciego: ¿cuántos intentos antes de lockout? ¿qué password complexity requerida? ¿reversible encryption habilitada (DCSync recovers cleartext)? Foundation para todo ataque basado en credentials.

### Cuándo es alto impacto

| Policy enum solo (info) | Policy enum como input |
|---|---|
| Domain policy mapping | Spray pacing calculation (CVSS — input) |
| PSO discovery + scope | Identify weakest target groups |
| Lockout threshold known | Safe spray strategy (avoid lockout DoS) |
| Reversible encryption flag | DCSync recovers cleartext (CVSS Critical) |
| krbtgt password age >180d | Persistent Golden Ticket risk (CVSS Critical) |
| PSO with no lockout | Free brute force (CVSS Critical) |
| Service account PSO laxer | Spray candidates (CVSS High) |
| Compliance gaps | Audit findings (CVSS — info) |

### Diferencia con otros enum hubs

| | **Password Policy** | **Users Enum** | **ACL Enum** |
|---|---|---|---|
| Foco | Policy + lockout config | User identities | Permissions per object |
| Output | Policy + PSOs list | Username + UAC + SPN | DACL findings |
| Auth | Authenticated typical / null partial | Authenticated / null | Authenticated always |
| Tooling | netexec, rpcclient, polenum | netexec, kerbrute, GetADUsers | PowerView, dsacls |
| Combine con | Spray pacing, brute planning | Kerberoast, AS-REP, spray | ACL abuse, BH paths |
| Critical attrs | Lockout, reversible, complexity | UAC, SPN, MemberOf | DACL |

### Por qué importa para chains

- **Spray pacing** — without policy, spray triggers lockout DoS.
- **Reversible encryption** — direct cleartext recovery via DCSync.
- **krbtgt stale** — persistent Golden Ticket viability.
- **PSO weakness** — privileged users with weak settings.
- **No-lockout policies** — free brute force.
- **Compliance audit** — defender baseline.
- **Honeypot detection** — avoid OPSEC failure during spray.

---

## Workflow de explotación

```
1. Anonymous probes (initial recon):
   - rpcclient -U "" DC -N -c 'getdompwinfo'
   - nxc smb DC -u '' -p '' --pass-pol
   - enum4linux-ng -P DC

2. Authenticated bulk dump (post-cred):
   - nxc smb DC -u u -p p --pass-pol (most reliable)
   - Get-ADDefaultDomainPasswordPolicy (RSAT)

3. PSO discovery (authenticated):
   - Get-ADFineGrainedPasswordPolicy -Filter *
   - LDAP query (objectClass=msDS-PasswordSettings)
   - Identify weakest PSO (lowest min length, no lockout, reversible)

4. Per-user effective policy:
   - Get-ADUserResultantPasswordPolicy per privileged user
   - Cross-correlate priv group + lax PSO = critical

5. krbtgt audit:
   - pwdLastSet on krbtgt
   - >180 days = persistent Golden Ticket risk

6. Pre-spray validation:
   - Confirm lockout threshold
   - Test single user 1 wrong attempt → verify badPwdCount
   - Calculate spray pacing
   - Identify honeypots in user list

7. Spray strategy:
   a. Conservative: 1 attempt × N users per LOW window
   b. Aggressive: (LT-1) × N users per LOW
   c. Multi-password rotation with full LOW gap
   d. Reverse spray (1 pass × many users) to avoid per-user lockout

8. Cross-correlate with priv users:
   - Priv users in laxer PSO = high-value spray candidates
   - Service accounts with no-lockout PSO = brute targets
   - Reversible encryption + privileged = DCSync direct cleartext

9. Compliance audit:
   - PCI-DSS / NIST / HIPAA mapping
   - Identify gaps, recommend hardening
   - Periodic re-audit
```

---

## Impacto

- **Spray planning** — without policy, spray triggers mass lockout DoS.
- **Reversible encryption** — DCSync recovers cleartext password (CVSS Critical).
- **krbtgt stale (>180d)** — persistent Golden Ticket risk.
- **No-lockout PSO** — unlimited brute attempts on specific users.
- **Weak min length** — common dictionary attacks succeed.
- **No complexity** — common patterns (Spring2026!, CompanyName!) succeed.
- **Per-PSO weakness on Tier 0** — direct privilege spray candidates.
- **Service account PSO laxness** — Kerberoast crackable.
- **Compliance violations** — audit findings.
- **Honeypot account detection** — OPSEC failure if missed.
- **Multi-domain forest-wide variation** — weakest domain = pivot.
- **Cross-correlate with priv groups** — critical privileged + weak.

---

## Mitigación (defender)

- **Modern password policy** — NIST SP 800-63B 2024:
  - Min 8 characters (recommended 15+)
  - No mandatory complexity (random ≥15 chars)
  - No mandatory rotation (breach-detect via HIBP)
  - Lockout 5-10 attempts
- **Disable Reversible Encryption** — should always be FALSE:
  ```powershell
  Set-ADDefaultDomainPasswordPolicy -Identity dom -ReversibleEncryptionEnabled $false
  Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true} | 
    Set-ADUser -AllowReversiblePasswordEncryption $false
  ```
- **Rotate krbtgt password every 180 days** (twice consecutively):
  ```powershell
  # Use Microsoft TechNet: Reset-KrbtgtKeyInteractive.ps1
  ```
- **PSO for Tier 0** — strict (16+ char random, lockout 3, complexity required).
- **PSO for service accounts** — strict (25+ char random, gMSA preferred).
- **Lockout always enabled** — minimum threshold = 5.
- **MFA mandatory** for privileged accounts — bypass lockout via different factor.
- **Honeypot accounts** — alert on any badPwdCount > 0.
- **Microsoft Defender for Identity** — anomalous spray detection.
- **PingCastle / Purple Knight** — periodic audits.
- **Compliance baseline** — PCI-DSS / NIST / HIPAA per-org.
- **Detection alerts**:
  ```
  Event ID 4625 (logon failure) bulk = spray
  Event ID 4740 (account locked) = lockout triggered
  Event ID 4767 (account unlocked) = manual unlock
  Event ID 4738 (user account changed) = policy modify
  Event ID 4739 (domain policy changed) = critical
  ```
- **Continuous monitoring** — bad password count, locked accounts, policy changes.
- **Privileged Access Workstations (PAWs)** — Tier 0 isolation.

---

## Para entender Password Policy Enumeration

**Por qué default policy matters:**

Default Domain Policy applies to ALL users without PSO override. Weak defaults (MinLength 7, no complexity) = entire domain weak. Modern hardened orgs use 14+ char + complexity, but legacy environments often have 7-char defaults from 2003-era setup.

**Por qué PSO complicate spray:**

Same domain may have multiple password policies via PSO. Tier 0 PSO strict (16+ random). Service account PSO laxer (8 chars). Default policy mid-tier. Atacante must enumerate PSO to know which spray candidates safe vs lockout-prone. Per-user query (`Get-ADUserResultantPasswordPolicy`) gives effective settings.

**Por qué reversible encryption es crítico:**

`AllowReversiblePasswordEncryption` flag stores password as recoverable cleartext (encrypted with system key, but decryptable by KDC). Why exists: legacy CHAP/Digest auth protocols required cleartext. Modern: should always be FALSE. If TRUE: DCSync (`secretsdump --just-dc-user`) returns cleartext password directly. Critical vuln.

**Por qué krbtgt stale = Golden Ticket persistent:**

krbtgt holds KDC trust password — signs all TGTs. Atacante with DCSync access dumps krbtgt NT hash → forge arbitrary TGTs (Golden Ticket). Rotation invalidates Golden Tickets. Stale krbtgt (>180 days) = persistent Golden Ticket viability if ever compromised. Microsoft recommends rotation twice consecutively (replication delay considerations).

**Por qué lockout calculation matters:**

Lockout policy: threshold + duration + observation window. Atacante calculates safe spray pace: (LT-1) attempts per LOW per user. Reverse spray (1 pass × N users) avoids per-user lockout. Without policy info, spray triggers mass lockouts → DoS users + alerts defenders. Pre-spray validation = confirm policy via single test fail.

**Por qué PSO precedence matters:**

Multiple PSOs may apply to same user (group-based + direct). Lower precedence value wins. Atacante audit: per-user effective policy via `Get-ADUserResultantPasswordPolicy`. Defender: ensure Tier 0 users get strict PSO precedence over laxer group PSOs.

**Por qué anonymous policy probes matter:**

Pre-credentials, anonymous RPC `getdompwinfo` may reveal default policy without auth. Modern hardened DCs block. Legacy systems often allow. Atacante wins: knows lockout policy before spray. Defender: `RestrictAnonymous=2` + LDAP signing required.

**Por qué cross-correlate priv + weak PSO:**

Single highest-impact finding: Tier 0 user (DA, EA) with weak PSO override (e.g., service account user in DA group with no-lockout PSO). Result: free brute force on direct privesc target. Critical audit task.

---

## Recursos

- [HackTricks - AD Password Policy](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/active-directory-methodology) — reference.
- [The Hacker Recipes - Password Policy](https://www.thehacker.recipes/ad/recon/passwd-policy) — comprehensive.
- [PayloadsAllTheThings - AD](https://github.com/swisskyrepo/PayloadsAllTheThings) — payloads.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [Microsoft - Password Policy](https://learn.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/password-policy) — vendor.
- [Microsoft - PSO](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/how-to-configure-password-settings) — vendor.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) — modern auth standard.
- [PingCastle](https://www.pingcastle.com/) — audit tool.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit tool.
- [Reset-KrbtgtKeyInteractive Script (Microsoft)](https://github.com/microsoft/New-KrbtgtKeys.ps1) — krbtgt rotation.
- [Sean Metcalf - krbtgt Best Practices](https://adsecurity.org/?p=2011) — research.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool.
- [MITRE ATT&CK T1201](https://attack.mitre.org/techniques/T1201/) — Password Policy Discovery.
- [HaveIBeenPwned API](https://haveibeenpwned.com/Passwords) — breach DB integration.
- [PCI-DSS v4 Requirements](https://www.pcisecuritystandards.org/) — compliance.

---
