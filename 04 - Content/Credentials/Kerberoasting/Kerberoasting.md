---
aliases:
  - "Kerberos"
  - "Kerberoasting Attack (GetUserSPNs.py)"
  - "Roasting Internal Kerberos"
  - "Timeroasting"
  - Kerberos Kerberoasting
  - Kerberoast
  - SPN Roasting
tags:
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
  - "[[Kerberoasting - SPN Discovery]]"
  - "[[Kerberoasting - Request TGS]]"
  - "[[Kerberoasting - Hash Cracking]]"
  - "[[Kerberoasting - Targeted Kerberoasting]]"
  - "[[Kerberoasting - Cross-Trust y Modern]]"
  - "[[Kerberoasting - Tooling]]"
  - "[[AS-REP Roasting]]"
  - "[[Pass-the-Hash]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# Kerberoasting

***

## Cheatsheet

### 🔍 SPN Discovery

````tabs
tab: **LDAP Filter Discovery**
![[Kerberoasting - SPN Discovery#^kerb-spn-ldap]]

tab: **setspn (Native)**
![[Kerberoasting - SPN Discovery#^kerb-spn-setspn]]

tab: **SPN Class Filtering**
![[Kerberoasting - SPN Discovery#^kerb-spn-classes]]

tab: **Privileged Kerberoastable**
![[Kerberoasting - SPN Discovery#^kerb-spn-priv]]

tab: **BloodHound Query**
![[Kerberoasting - SPN Discovery#^kerb-spn-bh]]

tab: **Computer Accounts (skip)**
![[Kerberoasting - SPN Discovery#^kerb-spn-computers]]

tab: **Hidden SPNs**
![[Kerberoasting - SPN Discovery#^kerb-spn-hidden]]

tab: **Pre-Attack Validation**
![[Kerberoasting - SPN Discovery#^kerb-spn-validate]]
````

### 🎫 Request TGS

````tabs
tab: **Impacket GetUserSPNs**
![[Kerberoasting - Request TGS#^kerb-tgs-impacket]]

tab: **Rubeus kerberoast**
![[Kerberoasting - Request TGS#^kerb-tgs-rubeus]]

tab: **netexec kerberoasting**
![[Kerberoasting - Request TGS#^kerb-tgs-nxc]]

tab: **targetedKerberoast.py**
![[Kerberoasting - Request TGS#^kerb-tgs-targeted]]

tab: **Encryption Type Selection**
![[Kerberoasting - Request TGS#^kerb-tgs-etype]]

tab: **Targeted vs Bulk Roast**
![[Kerberoasting - Request TGS#^kerb-tgs-targetedvsbulk]]

tab: **OPSEC Pre-Roast**
![[Kerberoasting - Request TGS#^kerb-tgs-opsec]]

tab: **Common Errors**
![[Kerberoasting - Request TGS#^kerb-tgs-errors]]
````

### 💥 Hash Cracking

````tabs
tab: **Hashcat Modes**
![[Kerberoasting - Hash Cracking#^kerb-crack-hashcat-modes]]

tab: **Hashcat Standard**
![[Kerberoasting - Hash Cracking#^kerb-crack-hashcat-cmd]]

tab: **John the Ripper**
![[Kerberoasting - Hash Cracking#^kerb-crack-john]]

tab: **Wordlists**
![[Kerberoasting - Hash Cracking#^kerb-crack-wordlists]]

tab: **Rules Comparison**
![[Kerberoasting - Hash Cracking#^kerb-crack-rules]]

tab: **Mask Attack**
![[Kerberoasting - Hash Cracking#^kerb-crack-mask]]

tab: **GPU Acceleration**
![[Kerberoasting - Hash Cracking#^kerb-crack-gpu]]

tab: **Post-Crack Verification**
![[Kerberoasting - Hash Cracking#^kerb-crack-verify]]

tab: **Rate / Time Estimation**
![[Kerberoasting - Hash Cracking#^kerb-crack-rate]]

tab: **Common Errors**
![[Kerberoasting - Hash Cracking#^kerb-crack-errors]]
````

### 🎯 Targeted Kerberoasting

````tabs
tab: **Concept**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-concept]]

tab: **ACL Required**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-acl]]

tab: **Attack Workflow**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-workflow]]

tab: **targetedKerberoast.py**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-tool]]

tab: **bloodyAD Targeted**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-bloodyad]]

tab: **BloodHound Edges**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-bh]]

tab: **Post-Crack Privesc**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-postcrack]]

tab: **OPSEC**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-opsec]]

tab: **Common Errors**
![[Kerberoasting - Targeted Kerberoasting#^kerb-targeted-errors]]
````

### 🌐 Cross-Trust & Modern

````tabs
tab: **Cross-Domain (Intra-Forest)**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-intra]]

tab: **Cross-Forest**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-forest]]

tab: **gMSA NO es Kerberoasteable**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-gmsa]]

tab: **Computer Accounts**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-computer]]

tab: **Protected Users Group**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-protected]]

tab: **msDS-SupportedEncryptionTypes**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-enctypes]]

tab: **RC4 Downgrade Attack**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-downgrade]]

tab: **Cross-Trust Tooling**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-tools]]

tab: **Mitigations**
![[Kerberoasting - Cross-Trust y Modern#^kerb-cross-mitigations]]
````

### 🛠️ Tooling

````tabs
tab: **Impacket-GetUserSPNs**
![[Kerberoasting - Tooling#^kerb-tool-impacket]]

tab: **Rubeus**
![[Kerberoasting - Tooling#^kerb-tool-rubeus]]

tab: **netexec**
![[Kerberoasting - Tooling#^kerb-tool-nxc]]

tab: **targetedKerberoast**
![[Kerberoasting - Tooling#^kerb-tool-targeted]]

tab: **hashcat**
![[Kerberoasting - Tooling#^kerb-tool-hashcat]]

tab: **John the Ripper**
![[Kerberoasting - Tooling#^kerb-tool-john]]

tab: **bloodyAD**
![[Kerberoasting - Tooling#^kerb-tool-bloodyad]]

tab: **BloodHound Queries**
![[Kerberoasting - Tooling#^kerb-tool-bh]]

tab: **Recursos**
![[Kerberoasting - Tooling#^kerb-tool-resources]]
````

___

## Overview

**Kerberoasting** = explotar la propiedad de Kerberos donde **cualquier user authenticado** puede solicitar un TGS para cualquier SPN. El TGS está firmado con el NT hash del service account dueño del SPN. Si la password del service account es débil/humana → crack offline → hash de la cuenta.

**Foundational technique** post-foothold inicial. Solo requiere user del domain con creds (no priv). Tráfico Kerberos baseline = stealth-friendly comparado con NTLM auth.

### Cuándo es alto impacto

| **Target** | **Impacto** |
|---|---|
| Service account con password débil (<14 chars humano) | Crack offline → cred extraction (CVSS High). |
| Service account en `Domain Admins` | Crack → DA direct (CVSS Critical). |
| Service account con DCSync rights | Crack → forest takeover (CVSS Critical). |
| Targeted Kerberoasting (ACL abuse) | Cualquier user con write SPN ACE → privesc (CVSS High). |
| Computer accounts | Skip (128 chars random) (CVSS N/A). |
| gMSA accounts | Skip (240 chars random) (CVSS N/A). |

### Diferencia con AS-REP Roasting

| | **Kerberoasting** | **AS-REP Roasting** |
|---|---|---|
| Required | User authenticado al domain | Sin auth (pre-auth disabled) |
| Hash type | TGS encrypted con service account hash | AS-REP encrypted con user hash |
| Target accounts | Users con SPN | Users con UAC `DONT_REQ_PREAUTH` |
| Hashcat mode | 13100 (RC4) / 19700 (AES) | 18200 |
| Common targets | Service accounts | Legacy users / misconfigured |
| Detection | Event 4769 (TGS) | Event 4768 (AS-REQ) |

___

## Workflow

```
1. Discovery:
   - LDAP filter (servicePrincipalName=*)
   - setspn -Q */*
   - BloodHound Kerberoastable Users query

2. Filter prioritization:
   - Priv kerberoastable (adminCount=1)
   - Stale passwords (PasswordLastSet old)
   - PasswordNeverExpires
   - Skip computer accounts + gMSA + Protected Users

3. Request TGS:
   - Impacket-GetUserSPNs ... -request
   - Rubeus.exe kerberoast
   - nxc ldap --kerberoasting

4. Crack offline:
   - hashcat -m 13100 (RC4) / -m 19700 (AES)
   - Wordlist (rockyou) + rules (best64/OneRule)
   - Mask attack (custom patterns)

5. Targeted Kerberoasting (alt):
   - Identify ACL WriteProperty SPN sobre user sin SPN
   - Set fake SPN
   - Roast
   - Cleanup SPN
   - Crack

6. Post-crack:
   - Validate password contra service
   - Check effective groups (privesc?)
   - Privesc chain (DCSync si DA, lateral si service host)

7. Cleanup:
   - Remove fake SPNs (targeted)
   - klist purge
```

___

## Detección rápida

```bash
# 1. Discovery
nxc ldap <DC> -u user -p pass --query \
  "(&(objectCategory=user)(servicePrincipalName=*))" \
  "samAccountName,servicePrincipalName,adminCount"

# 2. Bulk roast
nxc ldap <DC> -u user -p pass --kerberoasting roast.hash

# 3. Crack
hashcat -m 13100 roast.hash /usr/share/wordlists/rockyou.txt -O

# 4. Crack con rules si rockyou no pega
hashcat -m 13100 roast.hash rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O

# 5. Validate
hashcat -m 13100 roast.hash --show
```

___

## Impacto

- **Service account con DA membership + weak pwd** = direct DA via crack offline.
- **Service account con DCSync rights** = forest takeover.
- **Service account host-bound** = lateral movement to host (psexec / wmiexec).
- **Targeted Kerberoasting** = cualquier `WriteProperty SPN` ACE → privesc opportunity.
- **Cross-trust kerberoast** = cred extraction cross-forest.
- **Multiple cracked accounts** = cred chain via reuse / shared service infra.

___

## Mitigación (defender)

- **Service account passwords ≥30 chars random** (crack infeasible computacionalmente).
- **Migrate service accounts a gMSA** (240 chars + auto-rotate 30d).
- **Add Tier 0 accounts a `Protected Users`** (AES-only + 4h TGT + no NTLM).
- **Disable RC4 per-account** via `msDS-SupportedEncryptionTypes = 0x18` (AES only).
- **Domain-wide AES-only** via GPO `Network security: Configure encryption types allowed for Kerberos`.
- **Honeypot SPN accounts** con monitoring específico.
- **Detection events**:
  - `Event 4769` con etype 23 (RC4) en domain default-AES = anomaly.
  - Bulk 4769 from single source = MDI alert `Suspected Kerberoasting`.
  - `Event 5136` (LDAP modify) sobre `servicePrincipalName` attr = targeted detect.
- **PingCastle audit** rule `T1-Kerberoast` indicators.
- **MDI alert** `Suspected Kerberoasting`.

___

## Para entender Kerberoasting

**Por qué cualquier user puede roast:** Kerberos no requiere autorización para solicitar TGS. Authenticated user pide TGS → KDC emite. **No checkea si user tiene access al servicio target**. KDC asume que servicio destino verifica autorización en el TGS.

**Por qué TGS es crackeable:** TGS contiene PAC + service ticket data, encrypted con NT hash del service account. Atacante solicita → recibe blob encrypted → crack offline para recuperar password. **Sin auth contra service real** = sin lockout, sin detection en service.

**Por qué computer accounts no son crackeables:** computer account password = 128 chars random auto-rotated. Hash space tan grande que crack offline computacionalmente infeasible incluso con hardware modern.

**Por qué gMSA no es crackeable:** gMSA password = 240 chars random derivado de KDS Root Key. Auto-rotate 30d. Crack space prohibitivo. Path correcto = leer pwd directo via `msDS-ManagedPassword` si tenés `msDS-GroupMSAMembership` ACE.

**Por qué Targeted Kerberoasting existe:** kerberoast clásico requiere user con SPN existente. Pero cualquier user con `WriteProperty SPN` ACE sobre user sin SPN puede:
1. Set fake SPN temporalmente.
2. Roast el user (now con SPN).
3. Clear SPN.

Resulting hash = del user normal con password humana = más crackeable que service account dedicado.

**Por qué Protected Users protege:** members del group:
- Solo AES (no RC4) → harder crack (slow hashcat).
- TGT lifetime 4h → smaller window.
- No NTLM auth (kerberos-only).

Kerberoast technically funciona pero crack mucho más caro.

**Por qué RC4 downgrade existe:** atacantes prefieren RC4 (m13100) sobre AES (m19700) porque crack ~70x más rápido. Rubeus `/tgtdeleg` request TGS con flag indicando solo RC4 support → KDC complies si account permite RC4. Modern domains = audit `msDS-SupportedEncryptionTypes` para forzar AES-only y matar downgrade.

___

## Recursos

- [HackTricks - Kerberoasting](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoast) — comprehensive.
- [The Hacker Recipes - Kerberoast](https://www.thehacker.recipes/ad/movement/kerberos/kerberoast) — reference.
- [HarmJ0y - Kerberoasting Without Mimikatz](https://www.harmj0y.net/blog/powershell/kerberoasting-without-mimikatz/) — foundational.
- [Sean Metcalf - Kerberoasting Detection](https://adsecurity.org/?p=3458) — defender intel.
- [Rubeus](https://github.com/GhostPack/Rubeus) — Kerberos toolkit.
- [Impacket](https://github.com/fortra/impacket) — `GetUserSPNs.py`.
- [targetedKerberoast](https://github.com/ShutdownRepo/targetedKerberoast) — ACL abuse automation.
- [Hashcat modes](https://hashcat.net/wiki/doku.php?id=example_hashes) — reference.
- [OneRuleToRuleThemAll](https://github.com/NotSoSecure/password_cracking_rules) — comprehensive cracking rules.
- [MITRE ATT&CK T1558.003](https://attack.mitre.org/techniques/T1558/003/) — Kerberoasting.

***
