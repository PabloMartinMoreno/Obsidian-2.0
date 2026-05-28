---
aliases:
  - AD gMSA Enumeration
  - Group Managed Service Account
  - msDS-GroupManagedServiceAccount
  - gMSA Recon
tags:
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
  - "[[AD - gMSA Enumeration - gMSA Discovery]]"
  - "[[AD - gMSA Enumeration - Password Read Permissions]]"
  - "[[AD - gMSA Enumeration - gMSA Password Dump]]"
  - "[[AD - gMSA Enumeration - sMSA y dMSA]]"
  - "[[AD - gMSA Enumeration - Privileged gMSA Identification]]"
  - "[[AD - gMSA Enumeration - Tooling]]"
  - "[[AD - LAPS Enumeration]]"
  - "[[Kerberoasting]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
---
# AD - gMSA Enumeration

***

## Cheatsheet

### 🔍 gMSA Discovery

````tabs
tab: **Schema Detection**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-schema]]

tab: **gMSA Account Discovery**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-discovery]]

tab: **gMSA Critical Attributes**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-attrs]]

tab: **KDS Root Key**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-kdskey]]

tab: **Container Storage**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-container]]

tab: **Anonymous Discovery (Limited)**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-anonymous]]

tab: **Forest-Wide gMSA**
![[AD - gMSA Enumeration - gMSA Discovery#^ad-gmsa-multidomain]]
````

### 🔑 Password Read Permissions

````tabs
tab: **msDS-GroupMSAMembership**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-membership]]

tab: **Recursive Group Expansion**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-recursive]]

tab: **ACL on gMSA Object**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-acl]]

tab: **Computer Accounts as Readers**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-computers]]

tab: **Privileged gMSA Identification**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-privileged]]

tab: **BloodHound gMSA Edges**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-bh]]

tab: **Common Misconfigurations**
![[AD - gMSA Enumeration - Password Read Permissions#^ad-gmsa-perm-misconfig]]
````

### 💉 gMSA Password Dump

````tabs
tab: **msDS-ManagedPassword Blob**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-blob]]

tab: **gMSADumper (Python)**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-tool]]

tab: **netexec --gmsa**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-netexec]]

tab: **GoldenGMSA Technique**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-goldengmsa]]

tab: **Native PowerShell Read**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-pwsh]]

tab: **NT Hash Extraction**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-nthash]]

tab: **Pivot Post-Dump**
![[AD - gMSA Enumeration - gMSA Password Dump#^ad-gmsadump-pivot]]
````

### 📋 sMSA & dMSA

````tabs
tab: **sMSA (Standalone)**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-smsa-arch]]

tab: **sMSA Password Read**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-smsa-read]]

tab: **dMSA (Server 2025)**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-dmsa-arch]]

tab: **sMSA vs gMSA vs dMSA**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-msa-comparison]]

tab: **Migration Patterns**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-msa-migration]]

tab: **Cross-Correlate with Hosts**
![[AD - gMSA Enumeration - sMSA y dMSA#^ad-msa-correlate]]
````

### 🎯 Privileged gMSA Identification

````tabs
tab: **gMSA in Privileged Groups**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-groups]]

tab: **Kerberoastable gMSAs**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-kerberoast]]

tab: **gMSA with Delegation Flags**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-delegation]]

tab: **Password Read Cross-Correlation**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-correlate]]

tab: **gMSA Naming Patterns**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-naming]]

tab: **High-Value Summary**
![[AD - gMSA Enumeration - Privileged gMSA Identification#^ad-gmsapriv-summary]]
````

### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-netexec]]

tab: **gMSADumper (Python)**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-gmsadumper]]

tab: **GoldenGMSA**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-goldengmsa]]

tab: **DSInternals (PowerShell)**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-dsinternals]]

tab: **Native PowerShell (RSAT)**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-rsat]]

tab: **BloodHound gMSA**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-bh]]

tab: **Linux / Impacket**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-linux]]

tab: **Wordlists & Recursos**
![[AD - gMSA Enumeration - Tooling#^ad-gmsa-tool-resources]]
````

___

## Overview

**AD gMSA Enumeration** = identificar Group Managed Service Accounts (gMSA), sus password readers, deployment + cross-correlate con privilege. gMSA passwords auto-rotated por KDC, almacenados encriptados en `msDS-ManagedPassword`. Atacante con read permission obtiene NT hash directo → impersonar service.

LAPSv1/v2 = local admin password mgmt. gMSA = service account password mgmt. Both critical credential targets para escalation. gMSA en privileged groups = direct privesc path.

### Cuándo es alto impacto

| gMSA enum solo (info) | gMSA dump como input |
|---|---|
| gMSA inventory mapping | Identify priv service accounts |
| ACL audit per-gMSA | Cross-tier conflation finds |
| Authenticated Users with read | Critical misconfig (CVSS Critical) |
| gMSA password dump | Direct service impersonation (CVSS High) |
| gMSA in DA/EA | Direct DCSync chain (CVSS Critical) |
| GoldenGMSA via KDS key | Bypass ACL — atacante derives passwords (CVSS Critical) |
| Cross-trust gMSA reader | Cross-forest priv path |
| Kerberoastable gMSA + weak | Crackable hash (CVSS — long pwds infeasible) |

### Diferencia con otros enum hubs

| | **gMSA Enum** | **LAPS Enum** | **Users Enum** |
|---|---|---|---|
| Foco | Service accounts (multi-host) | Local admin (per-host) | All user identities |
| Output | gMSA + readers + hosts | LAPS-deployed + readers | Username + UAC |
| Auth | Authenticated typical | Authenticated typical | Authenticated / null |
| Dump format | NT hash + AES + cleartext | Cleartext (LAPSv1) / encrypted (LAPSv2) | UAC/SPN per user |
| Tooling | gMSADumper, GoldenGMSA | netexec --laps | netexec, kerbrute |
| Combine con | Service impersonation, Kerberoast | Lateral movement | Spray, Kerberoast |

### Por qué importa para chains

- **Direct service impersonation** — gMSA password = service identity.
- **gMSA en priv groups** — direct DA/EA chain.
- **Multi-host scope** — single gMSA dump = many hosts.
- **GoldenGMSA bypass ACL** — atacante with KDS key derives passwords.
- **Kerberoastable gMSA** — service account hashes (long pwds usually safe).
- **Cross-correlate with priv** — service account misconfigured in DA = critical.

___

## Workflow de explotación

```
1. Schema detection (initial recon):
   - Schema: msDS-GroupManagedServiceAccount class
   - KDS Root Key existence
   - Identify deployment level (gMSA only, sMSA legacy, dMSA modern)

2. gMSA inventory:
   - Get-ADServiceAccount -Filter *
   - nxc ldap DC -u u -p p --gmsa
   - LDAP filter (objectClass=msDS-GroupManagedServiceAccount)

3. Per-gMSA detail:
   - PrincipalsAllowedToRetrieveManagedPassword (readers)
   - HostComputers (bound hosts)
   - ServicePrincipalNames (Kerberoastable)
   - MemberOf (privileged groups)
   - msDS-ManagedPasswordInterval (rotation)

4. Cross-correlate priv:
   - gMSA in DA / EA / BackupOp / ServerOp
   - gMSA with TRUSTED_FOR_DELEGATION
   - gMSA with adminCount=1
   - Custom priv group membership

5. ACL audit:
   - Recursive expand reader groups
   - Authenticated Users / Domain Users misconfig (critical)
   - Foreign principals reading priv gMSAs (cross-trust)
   - Stale ACL members

6. Password dump strategy:
   a. Direct: nxc ldap --gmsa or gMSADumper.py (need authorized read)
   b. Indirect via host: compromise gMSA host → SYSTEM → read password
   c. GoldenGMSA: KDS Root Key + msDS-ManagedPasswordId (bypass ACL)
   d. DSInternals: ConvertFrom-ADManagedPasswordBlob

7. Pivot post-dump:
   - Pass-the-Hash: nxc smb host -u 'gMSA$' -H NTHASH
   - WMI/WinRM as gMSA
   - Service-context attacks
   - DCSync if gMSA in DA

8. Detection considerations:
   - Bulk gMSA reads = SIEM alert
   - Bulk Kerberos TGS for gMSA SPNs
   - KDS Root Key access (GoldenGMSA)
   - msDS-ManagedPassword read events
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. Schema check
Get-ADObject -SearchBase "CN=Schema,..." `
  -Filter "Name -like '*group-managed-service-account*'" |
  Select Name

# 2. KDS Root Key
Get-KdsRootKey

# 3. gMSA discovery
Get-ADServiceAccount -Filter * | Select Name,SamAccountName

# 4. Bulk dump
nxc ldap $DC -u $USER -p $PASS --gmsa

# 5. Privileged gMSAs
Get-ADServiceAccount -Filter * -Properties MemberOf |
  Where {$_.MemberOf -match "Domain Admins|Enterprise Admins"}

# 6. Authenticated Users with read (CRITICAL)
Get-ADServiceAccount -Filter * `
  -Properties PrincipalsAllowedToRetrieveManagedPassword |
  Where {
    $_.PrincipalsAllowedToRetrieveManagedPassword -match "Authenticated Users|Domain Users"
  }

# 7. Linux gMSADumper
python3 gMSADumper.py -u $USER -p $PASS -d dom.local
```

___

## Impacto

- **Direct service impersonation** — gMSA NT hash = service identity.
- **gMSA in DA/EA** — direct DCSync chain.
- **Bulk gMSA dump** — multi-service compromise.
- **Cross-tier conflation** — helpdesk reads Tier 0 gMSA = critical.
- **GoldenGMSA** — bypass ACL via KDS Root Key.
- **Kerberoastable gMSA** — TGS hash crack (rarely succeeds — long pwds).
- **Cross-trust gMSA read** — cross-forest priv path.
- **Multi-host scope** — single gMSA dump = many hosts.
- **Stale gMSAs** — old delegations forgotten.
- **Authenticated Users misconfig** — domain-wide read.
- **Service account in priv group** — common misconfig.
- **Cross-correlate with delegation** — gMSA + UD = critical.

___

## Mitigación (defender)

- **Minimal gMSA password readers** — strict ACL:
  ```powershell
  Set-ADServiceAccount -Identity gMSA-svc01 `
    -PrincipalsAllowedToRetrieveManagedPassword "IT-Servers"
  ```
- **No Authenticated Users in PrincipalsAllowedToRetrieveManagedPassword** — critical audit:
  ```powershell
  Get-ADServiceAccount -Filter * -Properties PrincipalsAllowedToRetrieveManagedPassword |
    Where {$_.PrincipalsAllowedToRetrieveManagedPassword -match "Authenticated Users"}
  ```
- **gMSA NOT in privileged groups** — separate Tier 0 service accounts:
  ```powershell
  Get-ADGroupMember "Domain Admins" -Recursive |
    Where {$_.ObjectClass -eq "msDS-GroupManagedServiceAccount"}
  ```
- **Protect KDS Root Key** — DCSync rights only:
  - Audit who has DCSync (`GetChanges` + `GetChangesAll`).
  - GoldenGMSA requires KDS key + msDS-ManagedPasswordId.
- **Rotate KDS Root Key periodically** — per-org policy.
- **Detection alerts**:
  ```
  Event ID 4662 (Object access) with msDS-ManagedPassword GUID
  Bulk gMSA reads = anomaly
  KDS key access = critical alert
  msDS-GroupMSAMembership modify = audit
  ```
- **Microsoft Defender for Identity** — gMSA anomaly detection.
- **PingCastle / Purple Knight** — gMSA section audit.
- **gMSA Confidential flag set** — `searchFlags & 128`.
- **Periodic ACL audit** — quarterly reader review.
- **Stale gMSA cleanup** — remove unused.
- **AES-only encryption** — disable RC4 for gMSA Kerberos.
- **Long passwords (default 240 chars)** — uncrackable.
- **Compliance: documented gMSA inventory** — per-org baseline.
- **Modern: dMSA migration** — Server 2025+.

___

## Para entender gMSA

**Por qué gMSA exists:**

Pre-gMSA: service accounts had static passwords (operational pain to rotate). sMSA = single-host (limited). gMSA = multi-host with auto-rotation. Microsoft's solution to "service accounts in DA with PasswordNeverExpires=true".

**Por qué KDS Root Key matters:**

KDS = Key Distribution Service. Root key is forest-wide crypto key used to derive all gMSA passwords. Without KDS key, gMSA can't generate passwords. With KDS key + msDS-ManagedPasswordId blob, atacante can derive password offline (GoldenGMSA technique). Rotating KDS key invalidates derived passwords.

**Por qué Confidential flag matters:**

`searchFlags & 128` (CONFIDENTIAL) prevents Authenticated Users default read of msDS-ManagedPassword. Without flag, anyone in domain reads gMSA passwords. Default modern: flag set. Legacy: may be missing. Audit critical.

**Por qué gMSA password not crackable:**

Default gMSA password length: 240+ Unicode characters. Effectively infinite entropy. Even with TGS hash from Kerberoast, crack infeasible. Hardening: rely on length, AES encryption preferred over RC4.

**Por qué multi-host scope dangerous:**

gMSA bound to multiple computers via `HostComputers` attribute. Any of those computers = SYSTEM context = read gMSA password. Compromise weakest host = compromise gMSA = compromise all bound hosts. Scale risk.

**Por qué GoldenGMSA bypass ACL:**

GoldenGMSA derives password offline using:
1. KDS Root Key (forest-wide, replicated)
2. msDS-ManagedPasswordId (per-gMSA blob, LDAP-readable usually)

Atacante with DCSync rights → KDS key → bypass `msDS-GroupMSAMembership` ACL → derive any gMSA password. Critical attack chain.

**Por qué dMSA emerging:**

Server 2025 introduces dMSA (Delegated MSA). Combines best of sMSA + gMSA: per-computer + group readers. Better Azure AD Connect integration. Modern hardening. Tooling support emerging.

**Por qué cross-correlate with privilege:**

Single highest-impact finding: gMSA member of Domain Admins with Authenticated Users in PrincipalsAllowedToRetrieveManagedPassword. Result: any domain user reads gMSA password → DA. Critical audit.

___

## Recursos

- [HackTricks - gMSA](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/gmsa) — reference.
- [The Hacker Recipes - gMSA](https://www.thehacker.recipes/ad/movement/access-control/gmsa) — comprehensive.
- [Microsoft - gMSA Documentation](https://learn.microsoft.com/en-us/windows-server/security/group-managed-service-accounts/group-managed-service-accounts-overview) — vendor.
- [Microsoft - KDS Root Key](https://learn.microsoft.com/en-us/windows-server/security/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key) — vendor.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [gMSADumper (Micah Van Deusen)](https://github.com/micahvandeusen/gMSADumper) — main tool.
- [GoldenGMSA (Semperis)](https://github.com/Semperis/GoldenGMSA) — KDS-based attack.
- [DSInternals (Michael Grafnetter)](https://github.com/MichaelGrafnetter/DSInternals) — PowerShell tool.
- [Sean Metcalf - gMSA Best Practices](https://adsecurity.org/) — defender intel.
- [Will Schroeder - gMSA Research](https://posts.specterops.io/) — research.
- [Microsoft Defender for Identity](https://learn.microsoft.com/en-us/defender-for-identity/) — modern detection.
- [PingCastle](https://www.pingcastle.com/) — audit tool.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit tool.
- [MITRE ATT&CK T1003](https://attack.mitre.org/techniques/T1003/) — Credential Access.
- [Microsoft - Server 2025 dMSA](https://learn.microsoft.com/en-us/windows-server/) — modern.

***
