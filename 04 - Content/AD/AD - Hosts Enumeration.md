---
aliases:
  - "Network Device Fingerprinting"
  - AD Hosts Enumeration
  - AD Host Discovery
  - DC Discovery
  - Computer Objects Recon
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
  - "[[AD - Hosts Enumeration - DC Discovery]]"
  - "[[AD - Hosts Enumeration - Sites Subnets y Topology]]"
  - "[[AD - Hosts Enumeration - Computer Objects via LDAP]]"
  - "[[AD - Hosts Enumeration - OUs y Containers]]"
  - "[[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing]]"
  - "[[AD - Hosts Enumeration - Tooling]]"
  - "[[AD - DNS & SRV Records]]"
  - "[[BloodHound & SharpHound]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Hosts Enumeration

***

## Cheatsheet

### 🔍 DC Discovery

````tabs
tab: **DNS SRV Records**
![[AD - Hosts Enumeration - DC Discovery#^ad-dc-srv]]

tab: **NetBIOS / nbtscan / Broadcast**
![[AD - Hosts Enumeration - DC Discovery#^ad-dc-netbios]]

tab: **LDAP namingContexts (Anonymous)**
![[AD - Hosts Enumeration - DC Discovery#^ad-dc-ldap]]

tab: **SMB Banner / Signing Discovery**
![[AD - Hosts Enumeration - DC Discovery#^ad-dc-smb]]

tab: **DC Locator Service / nltest**
![[AD - Hosts Enumeration - DC Discovery#^ad-dc-locator]]
````

### 🌐 Sites, Subnets & Topology

````tabs
tab: **Sites Discovery**
![[AD - Hosts Enumeration - Sites Subnets y Topology#^ad-topology-sites]]

tab: **Subnets per Site**
![[AD - Hosts Enumeration - Sites Subnets y Topology#^ad-topology-subnets]]

tab: **Site Links & Replication**
![[AD - Hosts Enumeration - Sites Subnets y Topology#^ad-topology-replication]]

tab: **DC Roles & FSMO**
![[AD - Hosts Enumeration - Sites Subnets y Topology#^ad-topology-fsmo]]

tab: **Global Catalog & RODCs**
![[AD - Hosts Enumeration - Sites Subnets y Topology#^ad-topology-gcrodc]]
````

### 🖥️ Computer Objects via LDAP

````tabs
tab: **Bulk Computer Listing**
![[AD - Hosts Enumeration - Computer Objects via LDAP#^ad-computers-bulk]]

tab: **Critical Computer Attributes**
![[AD - Hosts Enumeration - Computer Objects via LDAP#^ad-computers-attrs]]

tab: **High-Value Targets ID**
![[AD - Hosts Enumeration - Computer Objects via LDAP#^ad-computers-hvtargets]]

tab: **Stale Computer Accounts**
![[AD - Hosts Enumeration - Computer Objects via LDAP#^ad-computers-stale]]

tab: **Bulk Profile Live Targets**
![[AD - Hosts Enumeration - Computer Objects via LDAP#^ad-computers-bulk-profile]]
````

### 🏢 OUs & Containers

````tabs
tab: **OU Tree Discovery**
![[AD - Hosts Enumeration - OUs y Containers#^ad-ou-tree]]

tab: **Default Containers (Built-in)**
![[AD - Hosts Enumeration - OUs y Containers#^ad-ou-defaults]]

tab: **OU Contents Enumeration**
![[AD - Hosts Enumeration - OUs y Containers#^ad-ou-contents]]

tab: **OU Permissions & GPO Inheritance**
![[AD - Hosts Enumeration - OUs y Containers#^ad-ou-permissions]]

tab: **Naming Conventions / Fingerprint**
![[AD - Hosts Enumeration - OUs y Containers#^ad-ou-naming]]
````

### 📡 RPC / SMB / NetBIOS Probing

````tabs
tab: **Anonymous SMB / Null Session**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-nullsmb]]

tab: **Anonymous RPC Enumeration**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-anonenum]]

tab: **RID Brute Force**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-ridbrute]]

tab: **enum4linux-ng / Comprehensive**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-enum4linux]]

tab: **SMB Share Spider**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-shares]]

tab: **SMB Signing & Relay Prep**
![[AD - Hosts Enumeration - RPC SMB y NetBIOS Probing#^ad-rpc-signing]]
````

### 🛠️ Tooling

````tabs
tab: **netexec (nxc)**
![[AD - Hosts Enumeration - Tooling#^ad-tool-netexec]]

tab: **ldapsearch / Linux LDAP**
![[AD - Hosts Enumeration - Tooling#^ad-tool-ldapsearch]]

tab: **PowerView / pywerview**
![[AD - Hosts Enumeration - Tooling#^ad-tool-powerview]]

tab: **ADRecon / Bulk Reports**
![[AD - Hosts Enumeration - Tooling#^ad-tool-bulk]]

tab: **SharpHound / RustHound**
![[AD - Hosts Enumeration - Tooling#^ad-tool-sharphound]]

tab: **Wordlists & Recursos**
![[AD - Hosts Enumeration - Tooling#^ad-tool-wordlists]]
````

___

## Overview

**AD Hosts Enumeration** = primera fase de recon dentro de un dominio Active Directory. Cubre el descubrimiento de Domain Controllers, computer objects, topología (sites/subnets/links), estructura organizacional (OUs/containers), y propiedades técnicas críticas (signing SMB, delegation flags, OS, sessions activas).

Sin esta fase, ataques posteriores (Kerberoasting, NTLM Relay, ACL abuse, lateral movement) son ciegos. La calidad de la enumeración define qué tan rápido se llega a Domain Admin.

### Cuándo es alto impacto

| Hosts enum solo (info-only) | Hosts enum como input para chains |
|---|---|
| DC location reveals attack surface | NTLM Relay candidates → ADCS ESC8 → DA |
| Computer list with OS versions | Vulnerabilities matched per host |
| Sites/topology mapping | Lateral movement planning |
| Signing-off hosts identified | Coercion + relay → SMB takeover |
| Unconstrained delegation flag | Capture TGTs → DCSync → DA |
| Stale computers + LAPS readable | Cred path → lateral foothold |

### Diferencia con otras fases

| | **Hosts Enum** | **Users Enum** | **ACL Enum** |
|---|---|---|---|
| Foco | Computer objects + topología | User identities + groups | Permissions per object |
| Output | Hostname/FQDN/OS list | Usernames/SPN/UAC list | DACL findings |
| Auth required | Anonymous parcial / authenticated | Auth typical | Auth always |
| Tooling | netexec, nltest, dsquery | netexec, ldapsearch, RID brute | PowerView, BH, dsacls |
| Combine con | NTLM Relay, lateral, BH ingest | Kerberoast, AS-REP, spray | ACL abuse, BH paths |

### Por qué importa para chains

- DC discovery → todo otro paso (LDAP/Kerberos queries).
- SMB signing status → NTLM Relay viability.
- Unconstrained delegation flag → TGT capture path.
- Stale computers + LAPS readable → free lateral.
- OU mapping → understand tier model + GPO scope.
- FSMO holders → high-value targets per role.

___

## Workflow de explotación

```
1. External recon (sin foothold):
   - DNS SRV records (_ldap._tcp.dc._msdcs.<dom>)
   - Subdomain enum (dnsrecon, fierce)
   - LDAP namingContexts anonymous

2. Network presence (initial foothold):
   - nbtscan / responder passive listen
   - SMB banner sweep (nxc smb 10.0.0.0/24)
   - Identify DCs via NetBIOS suffix <1C> or SMB role

3. Anonymous probes:
   - rpcclient -U "" DC -N + lsaquery + getdompwinfo
   - nxc smb DC -u '' -p '' --shares
   - LDAP RootDSE — RootDSE often allows anonymous

4. Post-credential bulk enum:
   - nxc ldap DC -u user -p pass --computers --users --groups
   - Get-ADComputer -Filter * (RSAT)
   - SharpHound / RustHound full collection

5. Identify high-value:
   - Unconstrained delegation computers
   - Constrained delegation + RBCD
   - Servers with stale pwd + LAPS readable
   - Hosts with signing not required (relay candidates)

6. Topology mapping:
   - Sites + subnets → segment lateral planning
   - FSMO holders → priority targets
   - GC vs RODC distinction

7. OU structure:
   - Tier 0 / Tier 1 / Tier 2 OU identification
   - Service Accounts OU + privileged user OUs
   - Linked GPOs per OU (subset-take inheritance)

8. Bulk profile live targets:
   - nxc smb hosts.txt -u u -p p (Pwn3d! check)
   - --laps --gmsa --shares
   - Identify lateral foothold candidates
```

___

## Detección rápida

### Indicadores en logs / SIEM (defender side)

```text
# Heavy LDAP queries from non-admin
Event ID 1644 (Active Directory: Field Engineering log)

# SAMR enum (RID brute, enumdomusers)  
Event ID 4661 (Object access — SAM)

# SMB share enum
Event ID 5145 (Network share access)

# Bulk computer enumeration
Event ID 4662 (Object access — DS)
```

### Probes mínimos

```bash
# 1. Identify DC
DC_IP=$(dig +short SRV _ldap._tcp.dc._msdcs.dom.local | awk '{print $4}' | head -1 | xargs dig +short A | head -1)
echo "DC: $DC_IP"

# 2. Anonymous probe
nxc smb $DC_IP
nxc smb $DC_IP -u '' -p '' --shares
rpcclient -U "" $DC_IP -N -c 'lsaquery; getdompwinfo'

# 3. After cred acquisition
nxc smb $DC_IP -u user -p pass --pass-pol
nxc ldap $DC_IP -u user -p pass --computers > computers.txt

# 4. Identify relay candidates (signing not required)
nxc smb computers.txt --gen-relay-list relay.txt

# 5. Bulk profile
nxc smb computers.txt -u user -p pass --shares --sessions --loggedon-users
```

___

## Impacto

- **Foundation para todo otro AD attack** — sin enum, ataques son ciegos.
- **NTLM Relay candidates** — hosts con signing not required → relay → SMB admin → DA chain.
- **Unconstrained delegation discovery** — computer compromise → capture TGT de DA → DCSync.
- **Constrained delegation / RBCD** — privilege escalation paths.
- **LAPS readable hosts** — direct local admin password → lateral.
- **Stale computers** — abandoned hosts often weak password / no patches.
- **OU tier mapping** — understand defender's segmentation → plan attack.
- **FSMO holder ID** — single point of compromise for forest control.
- **Site/subnet mapping** — pivot planning, network segments.
- **Anonymous null session** — sometimes still reveals users + policy on legacy.
- **GC enumeration** — forest-wide data via single GC query.

___

## Mitigación (defender)

- **Disable null sessions** — `RestrictAnonymous=2`, `RestrictAnonymousSAM=1` en HKLM\SYSTEM\CurrentControlSet\Control\Lsa.
- **LDAP signing required** — GPO `Domain Controller: LDAP server signing requirements = Require signing`.
- **LDAP channel binding** — modern hardening — `LdapEnforceChannelBinding=2`.
- **SMB signing required** en TODOS los hosts:
  ```
  GPO: Computer Configuration > Policies > Windows Settings > Security Settings > 
       Local Policies > Security Options > 
       Microsoft network server: Digitally sign communications (always) = Enabled
  ```
- **Restrict anonymous** — disable `Pre-Windows 2000 Compatible Access` group membership.
- **Disable LLMNR + NBT-NS** — modern AD doesn't need:
  ```
  Computer Configuration > Administrative Templates > Network > 
  DNS Client > Turn off multicast name resolution = Enabled
  ```
- **Tier 0 isolation** — Domain Controllers OU + Tier 0 user OU strict ACL.
- **Disable RODC password caching for Tier 0** — Authenticated Users denied via `msDS-NeverRevealGroup`.
- **Audit Domain Admins / Enterprise Admins members** — no service accounts, no nested groups.
- **Computer account password rotation** — enforce 30-day default rotation.
- **Limit delegation flags** — `Account is sensitive and cannot be delegated` for Tier 0 users.
- **Detection alerts** — SIEM on bulk LDAP queries, SAMR enum, RID brute patterns.
- **PingCastle / Purple Knight** — periodic health audits.
- **Microsoft ATA / Defender for Identity** — anomalous enumeration detection.

___

## Para entender AD Hosts Enumeration

**Por qué AD expone tanta info por defecto:**

AD diseñado para **interoperabilidad** — apps necesitan listar usuarios, computers, groups, sites. LDAP base anónima permite RootDSE para que cliente identifique server. Default permissions amplias para Authenticated Users (read most attributes). Hardening = trade-off contra app compatibility.

**Por qué SRV records no se pueden ocultar:**

Kerberos + LDAP **necesitan** SRV records para clientes encontrar DC. `_ldap._tcp.dc._msdcs.<dom>` es el primer SRV que cualquier cliente domain-joined consulta al boot. Removerlos = clientes no pueden auth. So discovery via DNS es **necesario** para operación.

**Por qué SMB signing import:**

NTLM challenge-response es replay-able if signing not enforced. Atacante captura NTLM auth (responder/coercion) → relay a otro host. Si target requiere signing, relay falla (no puede firmar). Si no, atacante actúa como user → SMB admin → lateral foothold. Modern Windows enforces signing per default — pero misconfigurations + legacy hosts dejan gaps.

**Por qué unconstrained delegation es crítico:**

`TRUSTED_FOR_DELEGATION` flag = cuando user auth a este host con Kerberos, su TGT se cachea en LSASS del host. Atacante con admin local en ese host = mimikatz extrae TGTs → impersona cualquier user que loggea (incluyendo DA si DA logs there). Servers privilegiados con UD = single-host compromise → DA.

**Por qué FSMO matters:**

5 roles: Schema Master, Domain Naming Master (forest), PDC Emulator, RID Master, Infrastructure Master (domain). PDC = time sync, password sync, GPO modifications. Schema Master = schema modifications (Schema Admins). Compromise PDC + Schema = forest control. Single host with FSMO = high-value target.

**Por qué OU mapping reveals defender intent:**

OUs reflect organizational design. "Tier 0 Admins" / "Servers" / "Workstations" = Microsoft tiered admin model. `Disabled Accounts` OU = audit candidates. `Service Accounts` OU = lateral targets. `External` / `Vendors` = trust risk. Reading OU names = reading defender's mental model.

**Por qué bulk LDAP query es loud pero often necessary:**

Bulk `(objectCategory=computer)` query returns all computers — defender SIEM flags large queries (Event 1644). Trade-off: speed vs stealth. Stealthier: paged queries, targeted filters, DC-only collection (BloodHound `-c DCOnly`). Operational discipline: only query what's needed when needed.

___

## Recursos

- [HackTricks - AD Methodology](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology) — referencia.
- [The Hacker Recipes - AD Recon](https://www.thehacker.recipes/ad/recon) — comprehensive.
- [ADSecurity (Sean Metcalf)](https://adsecurity.org/) — defender intel.
- [BloodHound docs](https://bloodhound.specterops.io/) — tool docs.
- [PowerView Cheat Sheet](https://github.com/HarmJ0y/CheatSheets/blob/master/PowerView.pdf) — PV reference.
- [SharpHound docs](https://support.bloodhoundenterprise.io/hc/en-us/articles/17481151861019-All-SharpHound-Flags) — collector flags.
- [LDAP Filter Syntax (Microsoft)](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax) — bitwise filters.
- [RFC 4515 - LDAP String Filters](https://datatracker.ietf.org/doc/html/rfc4515) — spec.
- [Microsoft AD Schema](https://learn.microsoft.com/en-us/windows/win32/adschema/active-directory-schema) — attribute reference.
- [PingCastle](https://www.pingcastle.com/) — health audit.
- [Purple Knight (Semperis)](https://www.semperis.com/purple-knight/) — defender + recon.
- [ADRecon repo](https://github.com/adrecon/ADRecon) — XLSX reports.
- [windapsearch repo](https://github.com/ropnop/windapsearch) — Linux wrapper.
- [LDAP Domain Dump](https://github.com/dirkjanm/ldapdomaindump) — HTML reports.

***
