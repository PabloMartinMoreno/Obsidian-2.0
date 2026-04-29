---
aliases:
  - AD LAPS Enumeration
  - LAPS Discovery
  - Local Admin Password Solution Recon
  - msLAPS-Password
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
type: CheatSheet
linked:
  - "[[AD - LAPS Enumeration - LAPS Discovery]]"
  - "[[AD - LAPS Enumeration - Legacy LAPSv1]]"
  - "[[AD - LAPS Enumeration - Windows LAPSv2]]"
  - "[[AD - LAPS Enumeration - LAPS Permission Audit]]"
  - "[[AD - LAPS Enumeration - LAPS Read y Decryption]]"
  - "[[AD - LAPS Enumeration - Tooling]]"
  - "[[AD - ACL Enumeration]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
---
# AD - LAPS Enumeration

***

## Cheatsheet

### 🔍 LAPS Discovery

````tabs
tab: **Schema Detection**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-schema]]

tab: **LAPS Deployment Detection**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-deployment]]

tab: **GPO LAPS Configuration**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-gpo]]

tab: **OU Scope of LAPS**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-scope]]

tab: **LAPSv1 vs LAPSv2 Comparison**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-comparison]]

tab: **Anonymous LAPS Discovery**
![[AD - LAPS Enumeration - LAPS Discovery#^ad-laps-anonymous]]
````

### 📋 Legacy LAPSv1

````tabs
tab: **LAPSv1 Architecture**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-arch]]

tab: **LAPSv1 Read via LDAP**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-read]]

tab: **LAPSv1 ACL Audit**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-acl]]

tab: **LAPSv1 Misconfigurations**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-misconfig]]

tab: **LAPSv1 Read Permissions**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-readers]]

tab: **LAPSv1 Replacement (Migration)**
![[AD - LAPS Enumeration - Legacy LAPSv1#^ad-lapsv1-migration]]
````

### 🆕 Windows LAPSv2 (Modern)

````tabs
tab: **LAPSv2 Architecture**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-arch]]

tab: **Cleartext vs Encrypted**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-encryption]]

tab: **LAPSv2 Read & Decrypt**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-read]]

tab: **Azure AD Backup Mode**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-azuread]]

tab: **LAPSv2 ACL & Permissions**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-acl]]

tab: **LAPSv2 GPO Settings**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-gpo]]

tab: **LAPSv2 Misconfigurations**
![[AD - LAPS Enumeration - Windows LAPSv2#^ad-lapsv2-misconfig]]
````

### 🔓 LAPS Permission Audit

````tabs
tab: **Required Permissions**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-required]]

tab: **Per-Computer ACL Audit**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-acl]]

tab: **Native LAPS Helper Tools**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-native]]

tab: **Recursive Group Membership**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-recursive]]

tab: **BloodHound LAPS Edges**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-bh]]

tab: **Permission Misconfigurations**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-misconfig]]

tab: **LAPS Read Detection**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-detection]]

tab: **Audit Best Practices**
![[AD - LAPS Enumeration - LAPS Permission Audit#^ad-laps-perm-audit]]
````

### 💉 LAPS Read & Decryption

````tabs
tab: **Bulk Read with netexec**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-netexec]]

tab: **Single Host Read (PowerShell)**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-pwsh]]

tab: **LDAP Direct Read**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-ldap]]

tab: **LAPSv2 Decryption**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-decrypt]]

tab: **ACL Bypass Paths**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-bypass]]

tab: **Cross-Correlation with Priv**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-correlate]]

tab: **OPSEC for LAPS Read**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-opsec]]

tab: **Common Read Errors**
![[AD - LAPS Enumeration - LAPS Read y Decryption#^ad-lapsread-errors]]
````

### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-netexec]]

tab: **PowerShell Native LAPS**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-pwsh]]

tab: **ldapsearch / Linux LDAP**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-ldapsearch]]

tab: **BloodHound LAPS**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-bh]]

tab: **LAPSToolkit (Community)**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-laptoolkit]]

tab: **Impacket / Linux Helpers**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-impacket]]

tab: **Wordlists & Recursos**
![[AD - LAPS Enumeration - Tooling#^ad-laps-tool-resources]]
````

___

## Overview

**AD LAPS Enumeration** = identificar deployment y read permissions de Local Administrator Password Solution. LAPS rota local admin passwords automáticamente y los almacena en AD (LAPSv1 cleartext, LAPSv2 encrypted). Atacante con read permission obtiene local admin = lateral movement directo a hosts.

LAPSv1 (legacy) usa `ms-Mcs-AdmPwd` cleartext. LAPSv2 (modern, Server 2022+, Win11 22H2+) usa `msLAPS-EncryptedPassword` con encryption to specific principal. Both vulnerable si ACL mal configurado.

### Cuándo es alto impacto

| LAPS enum solo (info) | LAPS read como input |
|---|---|
| Deployment + scope mapping | Identify LAPS-protected hosts |
| ACL audit per-OU | Cross-tier conflation finds (CVSS — input) |
| Authenticated Users with read | Critical misconfig (CVSS Critical) |
| Service accounts as readers | Common audit finding |
| Read LAPS password | Direct local admin (CVSS Critical) |
| Bulk LAPS read across domain | Mass lateral foothold (CVSS Critical) |
| LAPSv2 encrypted (no key) | Useless without principal access |
| LAPSv2 cleartext mode | Same as LAPSv1 risk |
| Cross-trust LAPS read | Cross-forest priv path |
| Encryption principal too broad | Critical (CVSS Critical) |

### Diferencia con otros enum hubs

| | **LAPS Enum** | **Password Policy** | **gMSA Enum** |
|---|---|---|---|
| Foco | Local admin password mgmt | Domain password policy | Service account passwords |
| Output | LAPS-deployed computers + readers | Default policy + PSOs | gMSA accounts + readers |
| Auth | Authenticated typical | Authenticated / null | Authenticated typical |
| Tooling | netexec, Get-LapsADPassword | net accounts, getdompwinfo | Get-ADServiceAccount, gMSADumper |
| Combine con | Lateral movement | Spray planning | Service account compromise |
| Critical attrs | ms-Mcs-AdmPwd, msLAPS-Password | maxPwdAge, lockoutThreshold | msDS-ManagedPassword |

### Por qué importa para chains

- **Local admin = lateral** — LAPS password = SMB/WMI/RDP admin on host.
- **Bulk LAPS reads = mass foothold** — atacante reads many hosts → mass lateral.
- **Cross-correlate priv tier** — helpdesk reading Tier 0 = critical risk.
- **LAPSv2 cleartext mode** — back to LAPSv1 risk despite modernization.
- **Stale ACLs** — old delegations from migrations.
- **Encryption principal broad** — many can decrypt.
- **Cross-trust LAPS read** — cross-forest privesc path.

___

## Workflow de explotación

```
1. Schema detection (initial recon):
   - Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -like 'ms-Mcs-AdmPwd' -or 'msLAPS-*'"
   - Identify LAPSv1, LAPSv2, mixed mode

2. Deployment detection:
   - Computers with ms-Mcs-AdmPwd set → LAPSv1
   - Computers with msLAPS-Password set → LAPSv2 cleartext
   - Computers with msLAPS-EncryptedPassword set → LAPSv2 encrypted
   - Per-OU coverage percentage

3. ACL audit:
   - Find-AdmPwdExtendedRights -Identity OU (LAPSv1)
   - Find-LapsADExtendedRights -Identity OU (LAPSv2)
   - BloodHound ReadLAPSPassword edges
   - Cross-correlate with priv groups

4. Identify attack vectors:
   a. Authenticated Users / Domain Users with LAPS read (critical misconfig)
   b. Helpdesk groups reading Tier 0 OUs (cross-tier)
   c. Service accounts as readers (common audit finding)
   d. Foreign principals reading LAPS (cross-trust)
   e. Encryption principal too broad (LAPSv2 specific)

5. Bulk read execution:
   - nxc smb computers.txt -u u -p p --laps
   - Get-LapsADPassword (LAPSv2 native, auto-decrypt)
   - LDAP raw query (cleartext attrs)
   - Custom LAPSv2 decryption (encrypted blobs)

6. Cross-correlate with priv:
   - LAPS-protected high-value computers (DCs, file servers, etc.)
   - Tier 0 admin reading workstations OK
   - Helpdesk reading servers = audit risk

7. Lateral movement:
   - Use LAPS password to SMB/WMI/RDP admin on host
   - Enumerate cached creds, dump LSASS, etc.
   - Pivot to next host

8. Persistence considerations:
   - LAPS rotates default 30 days
   - Persistent access via Backdoor or stored creds
   - Detection: bulk LAPS reads
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. Schema check
Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
  -Filter "Name -like 'ms-Mcs-AdmPwd' -or Name -like 'msLAPS-*'" |
  Select Name

# 2. Bulk LAPS read
nxc smb computers.txt -u $USER -p $PASS --laps

# 3. Per-OU readers (LAPSv2 native)
Find-LapsADExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"

# 4. BloodHound LAPS query
# MATCH p=(u {owned:true})-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer) RETURN p

# 5. Critical misconfig: Authenticated Users with LAPS read
Get-ADComputer -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $authUsers = $acl.Access | Where {
    $_.IdentityReference -eq "NT AUTHORITY\Authenticated Users" -and
    ($_.ActiveDirectoryRights -match "GenericRead|GenericAll|ReadProperty")
  }
  if ($authUsers) { Write-Host "[!] $($_.Name)" -ForegroundColor Red }
}
```

___

## Impacto

- **Local admin via LAPS read** — direct admin on protected host.
- **Bulk LAPS read** — mass lateral foothold across domain.
- **Cross-tier conflation** — helpdesk reads Tier 0 = critical privesc.
- **LAPSv2 cleartext mode** — same risk as LAPSv1 despite "modern".
- **Encryption principal broad** — many can decrypt encrypted blobs.
- **Cross-trust LAPS read** — cross-forest priv path.
- **Service account readers** — common audit finding leveraging stolen svc account.
- **Stale ACLs** — old delegations forgotten.
- **Authenticated Users misconfig** — domain-wide LAPS read.
- **Per-host explicit override** — anomaly detection signal.
- **OPSEC: LAPS reads logged** — Defender Event 4662.
- **Compliance violation** — many regulations require LAPS minimal readers.
- **Persistence: store LAPS passwords** — read once, use until rotation.

___

## Mitigación (defender)

- **Deploy LAPSv2** (Server 2022+, Win11 22H2+) — modern hardening:
  ```powershell
  # Enable LAPSv2 GPO settings
  # Computer Config > Policies > Admin Templates > LAPS
  ```
- **Enforce encryption mode** — `msLAPS-EncryptedPassword` not cleartext:
  ```
  GPO: "Configure password backup directory" → Active Directory
  GPO: "Enable password encryption" → Enabled
  GPO: "Configure authorized password decryptors" → Tier 0 group
  ```
- **Confidential flag set** on LAPS attrs:
  ```powershell
  # Verify
  Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'msLAPS-Password'" -Properties searchFlags
  ```
- **Minimal read principals** — Tier 0 admins + per-tier helpdesk:
  - Tier 0 admins read all (DCs, file servers).
  - Tier 1 admins read servers.
  - Tier 2 admins read workstations.
  - No cross-tier reads.
- **No Authenticated Users with LAPS read** — critical audit:
  ```powershell
  # Find + remove
  Get-ADComputer -Filter * | ... # see audit script
  ```
- **Encryption principal Tier 0** — not broad groups.
- **GPO scope per-OU** — workstations OU + servers OU separately.
- **Domain Controllers OU excluded** — DCs not LAPS-managed (use other mech).
- **Detection alerts**:
  ```
  Event ID 4662 (Object access) with LAPS GUID
  Bulk LAPS reads = anomaly
  Cross-tier LAPS reads = anomaly
  ```
- **Microsoft Defender for Identity** — LAPS read alerts.
- **PingCastle / Purple Knight** — LAPS section audit.
- **Periodic ACL audit** — quarterly reader review.
- **Stale ACL cleanup** — remove old delegations.
- **Honeypot computers** — alert on LAPS read attempts.
- **Modern: passwordless local admin** — Azure AD-joined + Just-in-Time admin.
- **Migration LAPSv1 → LAPSv2** — modern best practice.

___

## Para entender LAPS

**Por qué LAPS exists:**

Pre-LAPS: same local admin password on every host (golden image deployment). Compromise one host = compromise all (Pass-the-Hash chains). LAPS rotates per-host unique passwords stored in AD. Attack surface dramatically reduced if implemented correctly.

**Por qué Confidential flag matters:**

`searchFlags & 128` (CONFIDENTIAL) = attribute readable only by specific principals (not Authenticated Users default). LAPSv1 default sets this on `ms-Mcs-AdmPwd`. LAPSv2 sets it on `msLAPS-Password` and `msLAPS-EncryptedPassword`. Without flag, anyone in domain reads passwords = critical vuln.

**Por qué LAPSv2 encryption matters:**

LAPSv1 stored cleartext passwords in AD. Compromised LAPS reader = direct password. LAPSv2 encrypts to specific principal SID. Atacante with LDAP read but NOT in encryption principal group = encrypted blob useless. Hardening: limits blast radius even with ACL misconfig.

**Por qué cleartext mode LAPSv2 = LAPSv1 risk:**

LAPSv2 supports both `msLAPS-Password` (cleartext) and `msLAPS-EncryptedPassword` (encrypted) modes. Cleartext mode exists for compatibility but defeats encryption hardening. Common misconfig: deploy LAPSv2 but configure cleartext mode = no improvement over LAPSv1.

**Por qué cross-tier LAPS reads matter:**

Microsoft Tiered Admin Model: Tier 0 (DCs), Tier 1 (servers), Tier 2 (workstations). Helpdesk typically Tier 2 admin. If helpdesk has LAPS read on Tier 0 OU = cross-tier privilege. Atacante compromises helpdesk → reads LAPS on DCs → DC local admin → DA-equivalent. Critical audit pattern.

**Por qué LAPS doesn't apply to DCs:**

DCs run as `Local System` and don't have local admin password in usual sense. Domain credentials govern DC access. LAPS deploys for member servers + workstations only. Audit: any LAPS-set DC = anomaly (likely misconfiguration).

**Por qué Azure AD LAPS is modern:**

Hybrid identity scenarios: Azure AD-joined devices may not have on-prem AD presence. LAPSv2 supports Azure AD backup destination via Microsoft Graph. Read via cloud admin roles (Cloud Device Admin, Intune Admin). Different attack surface than on-prem LDAP.

**Por qué BloodHound LAPS edges matter:**

Pre-BloodHound: manual ACL audit per host. BloodHound 5.x+: `ReadLAPSPassword` edge automatically computed. Visualize entire LAPS reader hierarchy + cross-correlate with privilege paths. Modern audit standard.

___

## Recursos

- [HackTricks - LAPS](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/laps) — reference.
- [The Hacker Recipes - LAPS](https://www.thehacker.recipes/ad/movement/access-control/laps) — comprehensive.
- [Microsoft - LAPS Documentation](https://learn.microsoft.com/en-us/windows-server/identity/laps/) — vendor.
- [Microsoft - LAPSv2 Native Module](https://learn.microsoft.com/en-us/powershell/module/laps/) — modern.
- [Microsoft - Migration LAPSv1 → LAPSv2](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-scenarios-windows-server-active-directory) — vendor.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [LAPSToolkit (community)](https://github.com/leoloobeek/LAPSToolkit) — adversary tool.
- [LAPSv2 Decrypt research (T0X1Cx)](https://github.com/T0X1Cx/) — research.
- [Sean Metcalf - LAPS Best Practices](https://adsecurity.org/?p=4080) — defender intel.
- [Will Schroeder - LAPS Bypass Research](https://posts.specterops.io/) — research.
- [PingCastle](https://www.pingcastle.com/) — audit tool.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit tool.
- [Microsoft Defender for Identity](https://learn.microsoft.com/en-us/defender-for-identity/) — modern detection.
- [MITRE ATT&CK T1003.008](https://attack.mitre.org/techniques/T1003/008/) — adjacent.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-active-directory) — curated.

***
