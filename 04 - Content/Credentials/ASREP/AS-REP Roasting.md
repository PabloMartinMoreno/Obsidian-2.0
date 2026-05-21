---
aliases:
  - Kerberos AS-REP Roasting
  - AS-REP Roast
  - ASREP Roasting
tags:
  - type/vulnerability
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[AS-REP Roasting - Discovery]]"
  - "[[AS-REP Roasting - Roast Without Auth]]"
  - "[[AS-REP Roasting - Roast With Auth y Crack]]"
  - "[[AS-REP Roasting - Targeted Roasting]]"
  - "[[AS-REP Roasting - Username Enumeration]]"
  - "[[AS-REP Roasting - Tooling]]"
  - "[[Kerberoasting]]"
  - "[[Pass-the-Hash]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AS-REP Roasting

***

## Cheatsheet

### 🔍 Discovery

````tabs
tab: **LDAP Filter (UAC bit 4194304)**
![[AS-REP Roasting - Discovery#^asrep-discovery-ldap]]

tab: **Privileged AS-REP Roastable**
![[AS-REP Roasting - Discovery#^asrep-discovery-priv]]

tab: **BloodHound Query**
![[AS-REP Roasting - Discovery#^asrep-discovery-bh]]

tab: **UAC Bitfield Context**
![[AS-REP Roasting - Discovery#^asrep-discovery-uac]]

tab: **Cross-Trust Discovery**
![[AS-REP Roasting - Discovery#^asrep-discovery-cross]]

tab: **Pre-Attack Validation**
![[AS-REP Roasting - Discovery#^asrep-discovery-validate]]

tab: **Auditoría Defender**
![[AS-REP Roasting - Discovery#^asrep-discovery-audit]]
````

### 🚪 Roast Without Auth

````tabs
tab: **Concept**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-concept]]

tab: **Impacket GetNPUsers**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-impacket]]

tab: **netexec Unauth**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-nxc]]

tab: **Username List Generation**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-userlist]]

tab: **Per-User Single Test**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-single]]

tab: **OPSEC Considerations**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-opsec]]

tab: **Common Errors**
![[AS-REP Roasting - Roast Without Auth#^asrep-unauth-errors]]
````

### 🎫 Roast With Auth & Crack

````tabs
tab: **Impacket GetNPUsers Auth**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-impacket]]

tab: **Rubeus asreproast**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-rubeus]]

tab: **netexec asreproast**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-nxc]]

tab: **Hashcat Cracking**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-hashcat]]

tab: **John the Ripper**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-john]]

tab: **Wordlists**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-wordlists]]

tab: **Post-Crack Verification**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-verify]]

tab: **Common Errors**
![[AS-REP Roasting - Roast With Auth y Crack#^asrep-auth-errors]]
````

### 🎯 Targeted Roasting

````tabs
tab: **Concept**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-concept]]

tab: **ACL Required**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-acl]]

tab: **Attack Workflow**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-workflow]]

tab: **bloodyAD Targeted**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-bloodyad]]

tab: **XOR Method (Legacy)**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-xor]]

tab: **Post-Crack Privesc**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-postcrack]]

tab: **OPSEC**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-opsec]]

tab: **BloodHound Edges**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-bh]]

tab: **Common Errors**
![[AS-REP Roasting - Targeted Roasting#^asrep-targeted-errors]]
````

### 👥 Username Enumeration

````tabs
tab: **kerbrute userenum**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-kerbrute]]

tab: **Username List Sources**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-sources]]

tab: **OSINT Pipeline**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-osint]]

tab: **Common Naming Patterns**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-patterns]]

tab: **OPSEC: Kerbrute vs Bulk**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-opsec]]

tab: **Common Errors**
![[AS-REP Roasting - Username Enumeration#^asrep-userenum-errors]]
````

### 🛠️ Tooling

````tabs
tab: **Impacket-GetNPUsers**
![[AS-REP Roasting - Tooling#^asrep-tool-impacket]]

tab: **Rubeus**
![[AS-REP Roasting - Tooling#^asrep-tool-rubeus]]

tab: **netexec**
![[AS-REP Roasting - Tooling#^asrep-tool-nxc]]

tab: **kerbrute**
![[AS-REP Roasting - Tooling#^asrep-tool-kerbrute]]

tab: **hashcat**
![[AS-REP Roasting - Tooling#^asrep-tool-hashcat]]

tab: **John the Ripper**
![[AS-REP Roasting - Tooling#^asrep-tool-john]]

tab: **bloodyAD**
![[AS-REP Roasting - Tooling#^asrep-tool-bloodyad]]

tab: **BloodHound Queries**
![[AS-REP Roasting - Tooling#^asrep-tool-bh]]

tab: **Recursos**
![[AS-REP Roasting - Tooling#^asrep-tool-resources]]
````

___

## Overview

**AS-REP Roasting** = explotar Kerberos pre-authentication disabled (`DONT_REQ_PREAUTH` UAC bit 0x400000). KDC retorna AS-REP encrypted con NT hash del user → crack offline → password recovery.

**Diferencia clave con Kerberoasting:** AS-REP requiere **solo lista de usernames** (sin creds del domain). Hash del **user mismo** (no service account). Pre-foothold inicial vector.

### Cuándo es alto impacto

| **Target** | **Impacto** |
|---|---|
| User con `DONT_REQ_PREAUTH` + password débil | Crack offline → cred extraction (CVSS High). |
| Priv user (DA) con flag set | Direct DA via crack (CVSS Critical). |
| Targeted (ACL abuse `WriteProperty UAC`) | Cualquier user → privesc opportunity (CVSS High). |
| Pre-foothold sin creds | Username list + DC reachable = standalone vector (CVSS High). |
| Cross-trust roast | Foreign domain creds (CVSS High). |

### Diferencia con Kerberoasting

| | **AS-REP Roasting** | **Kerberoasting** |
|---|---|---|
| Required | Username list (sin creds) | User authenticado al domain |
| Hash type | AS-REP encrypted con user hash | TGS encrypted con service account hash |
| Target accounts | Users con `DONT_REQ_PREAUTH` | Users con SPN |
| Hashcat mode | 18200 | 13100 (RC4) / 19700 (AES) |
| Common targets | Legacy migrated / misconfigured | Service accounts |
| Detection | Event 4768 con pre-auth=0 | Event 4769 (TGS) |
| Modern frequency | Rare (default disabled) | Common (service accounts) |

___

## Workflow

```
1. Discovery:
   - LDAP filter (UAC bit 4194304)
   - kerbrute userenum (detect inline)
   - BloodHound AS-REP Roastable query

2. Username list (si pre-foothold):
   - kerbrute userenum
   - linkedin2username
   - SecLists Names + permutations

3. Roast:
   - Unauth: impacket-GetNPUsers ... -no-pass
   - Auth: impacket-GetNPUsers ... -request
   - Rubeus asreproast (Windows)

4. Crack offline:
   - hashcat -m 18200
   - Wordlist (rockyou) + rules (best64/OneRule)
   - Mask attack patterns

5. Targeted (alt):
   - Identify ACL WriteProperty UAC
   - Set DONT_REQ_PREAUTH flag
   - Roast
   - Cleanup flag
   - Crack

6. Post-crack:
   - Validate password
   - Privesc chain (DCSync si DA, lateral si user)

7. Cleanup:
   - Restore UAC flag (targeted)
   - klist purge
```

___

## Detección rápida

```bash
# 1. Discovery
nxc ldap <DC> -u user -p pass --asreproastable

# 2. Bulk roast (auth)
nxc ldap <DC> -u user -p pass --asreproast asrep.hash

# 3. Bulk roast (unauth, post-username-enum)
kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt
awk '{print $NF}' valid.txt | sed 's/@.*//' > clean.txt
impacket-GetNPUsers corp.local/ -dc-ip <DC> -usersfile clean.txt -no-pass -format hashcat -outputfile asrep.hash

# 4. Crack
hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt -O

# 5. Validate
hashcat -m 18200 asrep.hash --show
```

___

## Impacto

- **DA con AS-REP + weak pwd** = direct DA via crack offline.
- **Service account legacy** = cred extraction + lateral.
- **Targeted via ACL** = cualquier `WriteProperty UAC` ACE → privesc.
- **Pre-foothold vector** = AS-REP standalone sin creds del domain.
- **Cross-trust roast** = foreign cred extraction.

___

## Mitigación (defender)

- **Audit `DONT_REQ_PREAUTH` flag** — debería ser 0 users domain-wide.
- **Set strong passwords** en cualquier account con flag (≥14 chars, complexity).
- **Add a `Protected Users`** group (kerberos-only + AES + 4h TGT).
- **Disable RC4** per-account o domain-wide — AS-REP roast usually RC4 default.
- **Detection events**:
  - `Event 4768` con `Pre-Authentication Type: 0` = AS-REQ sin pre-auth = anomaly.
  - Bulk 4768 con pre-auth=0 desde single source = MDI alert `Suspected AS-REP Roasting`.
  - `Event 5136` (LDAP modify) sobre `userAccountControl` setting `DONT_REQ_PREAUTH` = targeted detect.
- **PingCastle** rule `T1-PreAuth` indicators.
- **MDI alert** `Suspected AS-REP roasting`.

___

## Para entender AS-REP Roasting

**Por qué Kerberos pre-auth existe:** sin pre-auth, **cualquier client puede solicitar AS-REP por cualquier user**. KDC responde con blob encrypted con user hash → password recovery vector. Pre-auth requiere client envíar timestamp encrypted con su hash en AS-REQ → KDC valida antes de emitir AS-REP. **Sin pre-auth = AS-REP-roastable**.

**Por qué `DONT_REQ_PREAUTH` existe:** legacy compat con Win NT4 / pre-2000 clients que no soportaban pre-auth. Modern domains = NO need. Cualquier flag set = legacy migrate leftover o misconfig.

**Por qué AS-REP es crackeable:** AS-REP blob contiene timestamp encrypted con NT hash del user. Atacante recibe blob → hashcat brute-forces hash space → match cuando descripta timestamp coherente.

**Por qué Targeted AS-REP es power-multiplier:** modern domains tienen **0 users** con flag set por defecto. Targeted Roasting requiere **solo `WriteProperty userAccountControl` ACE** sobre target → flag temporary → roast → clear. Cualquier user en domain con weak pwd = potential target via ACL chain.

**Por qué pre-foothold viable:** AS-REP roast unauth = solo username list + DC reachable. **No requiere creds del domain**. Standalone vector pre-engagement con OSINT-generated usernames.

**Por qué hashcat 18200 (no 19700/19600):** AS-REP standard usa etype 23 (RC4-HMAC) por compatibility. AES variants raros (account UAC `USE_DES_KEY_ONLY` o `msDS-SupportedEncryptionTypes` específicos). Default = m18200.

___

## Recursos

- [HackTricks - AS-REP Roasting](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/asreproast) — comprehensive.
- [The Hacker Recipes - ASREProast](https://www.thehacker.recipes/ad/movement/kerberos/asreproast) — reference.
- [HarmJ0y - Roasting AS-REPs](https://www.harmj0y.net/blog/activedirectory/roasting-as-reps/) — foundational.
- [Sean Metcalf - Detection](https://adsecurity.org/?p=1729) — defender intel.
- [Rubeus](https://github.com/GhostPack/Rubeus) — Kerberos toolkit.
- [Impacket](https://github.com/fortra/impacket) — `GetNPUsers.py`.
- [kerbrute](https://github.com/ropnop/kerbrute) — username enum + AS-REP detect inline.
- [Hashcat modes](https://hashcat.net/wiki/doku.php?id=example_hashes) — reference.
- [MITRE ATT&CK T1558.004](https://attack.mitre.org/techniques/T1558/004/) — AS-REP Roasting.

***
