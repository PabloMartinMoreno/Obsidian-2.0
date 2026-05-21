---
aliases:
  - AD ADCS Enumeration
  - Certificate Services Recon
  - PKI Discovery
  - ESC1-ESC15 Discovery
  - AD - Certificate Services (AD CS) Enumeration
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
  - "[[AD - ADCS Enumeration - ADCS Discovery]]"
  - "[[AD - ADCS Enumeration - Certificate Templates Audit]]"
  - "[[AD - ADCS Enumeration - CA ACL Audit]]"
  - "[[AD - ADCS Enumeration - ESC1-ESC15 Identification]]"
  - "[[AD - ADCS Enumeration - Web Enrollment y Relay]]"
  - "[[AD - ADCS Enumeration - Tooling]]"
  - "[[AD CS Abuse]]"
  - "[[NTLM Relay]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - ADCS Enumeration

***

## Cheatsheet

### 🔍 ADCS Discovery

````tabs
tab: **Architecture Overview**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-architecture]]

tab: **Enterprise CA Discovery**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-cadiscovery]]

tab: **Certificate Templates Discovery**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-templates]]

tab: **NTAuth Store**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-ntauth]]

tab: **Web Enrollment / NDES Discovery**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-webenroll]]

tab: **Anonymous ADCS Discovery (Limited)**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-anonymous]]

tab: **Cross-Domain / Forest-Wide ADCS**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-multidomain]]

tab: **Modern Best Practices**
![[AD - ADCS Enumeration - ADCS Discovery#^ad-adcs-bestpractice]]
````

### 📋 Certificate Templates Audit

````tabs
tab: **Template Object Class**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-class]]

tab: **Critical Template Attributes**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-attrs]]

tab: **msPKI-Certificate-Name-Flag**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-namesflag]]

tab: **EKU (Extended Key Usage)**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-eku]]

tab: **msPKI-RA-Signature**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-rasig]]

tab: **Template Enrollment ACL**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-acl]]

tab: **Per-Template Vulnerability**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-vulns]]

tab: **Default vs Custom Templates**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-default]]

tab: **Modern Best Practices**
![[AD - ADCS Enumeration - Certificate Templates Audit#^ad-tmpl-bestpractice]]
````

### 🛡️ CA ACL Audit

````tabs
tab: **CA Object DACL**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-rights]]

tab: **ESC7: Manage CA / Certs**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-esc7]]

tab: **EDITF Flags Audit**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-editf]]

tab: **Web Enrollment ACL**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-webenroll]]

tab: **CA Modification Rights**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-modify]]

tab: **NTAuthCertificates Modify**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-ntauth]]

tab: **Per-CA Configuration**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-config]]

tab: **Authenticated Users / Domain Users**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-authusers]]

tab: **BloodHound CA ACL Edges**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-bh]]

tab: **Mitigations**
![[AD - ADCS Enumeration - CA ACL Audit#^ad-caacl-mitigations]]
````

### 💉 ESC1-ESC15 Identification

````tabs
tab: **ESC1 (SAN + Client Auth)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc1]]

tab: **ESC2 (Any Purpose)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc2]]

tab: **ESC3 (Enrollment Agent)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc3]]

tab: **ESC4 (Vulnerable Template ACL)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc4]]

tab: **ESC5 (Vulnerable PKI Object ACL)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc5]]

tab: **ESC6 (EDITF_ATTRIBUTESUBJECTALTNAME2)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc6]]

tab: **ESC7 (Vulnerable CA ACL)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc7]]

tab: **ESC8 (Web Enrollment Relay)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc8]]

tab: **ESC9 (No Security Extension)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc9]]

tab: **ESC10 (Weak Cert Mappings)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc10]]

tab: **ESC11 (LDAP NO_PROTECTION_POLICY)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc11]]

tab: **ESC12-ESC15 (Modern)**
![[AD - ADCS Enumeration - ESC1-ESC15 Identification#^ad-esc12-15]]
````

### 🌐 Web Enrollment & NTLM Relay

````tabs
tab: **Web Enrollment Endpoints**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-endpoints]]

tab: **ESC8 (NTLM Relay)**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-esc8]]

tab: **NDES (SCEP) Endpoint**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-ndes]]

tab: **Channel Binding (EPA)**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-epa]]

tab: **SMB Signing Cross-Correlate**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-smbcross]]

tab: **Coercion Sources**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-coercion]]

tab: **Modern certipy Relay**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-certipy-relay]]

tab: **Mitigations**
![[AD - ADCS Enumeration - Web Enrollment y Relay#^ad-webenroll-mitigations]]
````

### 🛠️ Tooling

````tabs
tab: **certipy (Linux)**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-certipy]]

tab: **PSPKIAudit (Windows)**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-pspki]]

tab: **RSAT / Native Windows**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-native]]

tab: **BloodHound ADCS**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-bh]]

tab: **ldapsearch / Linux LDAP**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-ldapsearch]]

tab: **ADRecon / Bulk Reports**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-bulk]]

tab: **NTLM Relay Tools (ESC8)**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-relay]]

tab: **Wordlists & Recursos**
![[AD - ADCS Enumeration - Tooling#^ad-adcstool-resources]]
````

___

## Overview

**AD ADCS Enumeration** = identificar Active Directory Certificate Services (ADCS) infrastructure: Enterprise CAs, certificate templates, NTAuth store, Web Enrollment endpoints, y vulnerabilities ESC1-ESC15. Foundation crítica para cert-based privesc.

ADCS = Microsoft PKI integrado con AD. Vulnerabilities ESC1-ESC15 son foundation de modern AD attacks: ESC1 (SAN + Client Auth), ESC4 (template ACL), ESC7 (CA ACL), ESC8 (Web Enrollment NTLM Relay). Single vulnerable template = direct path to DA via cert request.

### Cuándo es alto impacto

| ADCS enum (info) | ADCS como input |
|---|---|
| CA + template inventory | Identify ESC paths |
| ESC1 vulnerable template | Direct cert-as-DA (CVSS Critical) |
| ESC8 Web Enrollment + Relay | DC compromise via cert (CVSS Critical) |
| ESC7 Manage CA misconfig | Approve own malicious requests (CVSS Critical) |
| ESC11 LDAP signing off | NTLM Relay path (CVSS Critical) |
| Authenticated Users with template enroll | Common ESC1 misconfig (CVSS Critical) |
| BloodHound ADCS paths | Visual privesc planning |

### Diferencia con ACL Enumeration

| | **ADCS Enum** | **ACL Enumeration** |
|---|---|---|
| Foco | Certificate Services specifically | All AD ACLs |
| Output | CAs, templates, ESC vulns | Comprehensive DACL findings |
| Tooling | certipy, PSPKIAudit | BloodHound, dsacls |
| Vulns | ESC1-ESC15 specific | All ACL abuse |
| Combine con | ADCS Abuse, NTLM Relay | Privesc planning |
| Critical attrs | Template flags, EKU, EDITF | nTSecurityDescriptor |
| Modern: extensive ADCS research | Specter Ops "Certified Pre-Owned" | Adjacent |

___

## Workflow

```
1. Schema check + initial enum:
   - Configuration NC: CN=Public Key Services
   - Enrollment Services: CAs list
   - Certificate Templates: pKICertificateTemplate
   - NTAuthCertificates: trusted CAs
   - certipy find -u u -p p -dc-ip DC -text

2. Per-CA discovery:
   - Enabled templates per-CA
   - CA ACL (Manage CA / Manage Certificates holders)
   - EDITF flags (ESC6 critical)
   - Web Enrollment endpoint check

3. Per-template audit:
   - msPKI-Certificate-Name-Flag (ENROLLEE_SUPPLIES_*)
   - pKIExtendedKeyUsage (Client Auth, etc.)
   - msPKI-RA-Signature (manager approval)
   - msPKI-Enrollment-Flag
   - DACL (Enroll permissions)

4. ESC vulnerability identification:
   - certipy find -vulnerable
   - Per-ESC pattern matching
   - Cross-correlate with priv

5. Web Enrollment / NDES discovery:
   - https://CA/certsrv/ probe
   - NTLM auth detection
   - HTTPS + EPA check
   - SMB Signing per-CA cross-correlate

6. NTAuth audit:
   - cACertificate inventory
   - DACL audit (Enterprise Admins / Domain Admins only)

7. BloodHound ADCS visualization:
   - Cypher: ESC1-ESC15 paths
   - Cross-correlate priv tier
   - Visual graph

8. Plan exploitation:
   a. ESC1: cert with arbitrary SAN as DA
   b. ESC4: modify template flags → ESC1
   c. ESC7: approve pending requests
   d. ESC8: coerce + relay → DC$ cert
   e. ESC11: LDAP relay
   f. ESC9/10: UPN spoofing (post-CVE-2022-26923)

9. Cleanup post-engagement:
   - Revoke issued certs
   - Revert template modifications
   - Document changes
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. Comprehensive ADCS recon
certipy find -u $USER -p $PASS -dc-ip $DC -text -stdout

# 2. Vulnerable templates only
certipy find -u $USER -p $PASS -dc-ip $DC -vulnerable -stdout

# 3. JSON output for parsing
certipy find -u $USER -p $PASS -dc-ip $DC -vulnerable -json -output adcs.json

# 4. BloodHound integration
certipy find -u $USER -p $PASS -dc-ip $DC -bloodhound

# 5. Per-CA endpoint check
CAS=$(certipy find -u $USER -p $PASS -dc-ip $DC -json | jq -r '.[].CAs[].DNSHostName')
for ca in $CAS; do
  echo "=== $ca ==="
  curl -sI "http://$ca/certsrv/" 2>&1 | head -3
done
```

___

## Impacto

- **ESC1: cert as DA** — single LDAP write equivalent.
- **ESC4: template modify → ESC1** — convert safe to vulnerable.
- **ESC7: Manage CA** — approve own malicious requests.
- **ESC8: NTLM Relay → DC cert** — DC compromise via coercion + relay.
- **ESC11: LDAP relay** — adjacent NTLM Relay paths.
- **EDITF_ATTRIBUTESUBJECTALTNAME2 (ESC6)** — any cert with Client Auth = DA.
- **Authenticated Users template Enroll** — common ESC1 misconfig.
- **Cross-trust ADCS** — cross-forest privesc.
- **Stale templates** — cleanup hygiene.
- **Service account in CA admin** — common audit finding.
- **Web Enrollment without EPA** — vulnerable to ESC8.
- **NDES exposed** — adjacent vector.

___

## Mitigación

- **Patch CVE-2022-26923 (Certifried)** — modern hardening.
- **Disable EDITF_ATTRIBUTESUBJECTALTNAME2** — ESC6 fix:
  ```cmd
  certutil -config "CA-IP\CA-Name" -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2
  ```
- **Strict template ACL** — minimal Enroll grants.
- **Manager approval required** for sensitive templates.
- **Disable ENROLLEE_SUPPLIES_SUBJECT** unless required.
- **Disable Web Enrollment** if not needed:
  ```powershell
  Uninstall-WindowsFeature ADCS-Web-Enrollment
  ```
- **HTTPS + Channel Binding (EPA)** for Web Enrollment.
- **SMB Signing required** on CA hosts.
- **Patch coercion CVEs** (PetitPotam etc.).
- **NTAuthCertificates strict** — Enterprise/Domain Admins only.
- **Per-quarter ADCS audit** — documented baseline.
- **Detection alerts**:
  ```
  Event ID 4886 (cert request)
  Event ID 4887 (cert issued)
  Event ID 5136 (template modify)
  Event ID 4662 (PKI object access)
  ```
- **Microsoft Defender for Identity ADCS alerts** — modern.
- **BloodHound continuous ADCS audit** — modern.
- **PingCastle / Purple Knight ADCS** — defender.
- **Compliance: documented per-template** — standard.
- **Cleanup: stale templates** — hygiene.
- **AES-only Kerberos** for cert auth.

___

## Para entender ADCS

**Por qué ADCS so vulnerable:**

ADCS allows cert-based authentication. Atacante with vulnerable template → request cert with SAN → cert auth as anyone (including DA). Single misconfiguration in template flags = full domain compromise. Specter Ops research "Certified Pre-Owned" (2021) catalogued ESC1-ESC8 + research continues (ESC9-ESC15).

**Por qué ESC1 most common:**

Default templates often have ENROLLEE_SUPPLIES_SUBJECT flag enabled (legacy compat). Combined with Client Authentication EKU + Authenticated Users Enroll = atacante requests cert with arbitrary SAN. Cert auth as DA via UPN match. Trivial chain.

**Por qué Web Enrollment + Relay (ESC8) critical:**

IIS NTLM auth on `/certsrv/` = relay target. Coerce DC auth (PetitPotam) → relay to certsrv → DC cert (privileged). Mitigation: HTTPS + EPA + SMB Signing. Modern environments often missing EPA = critical.

**Por qué EDITF_ATTRIBUTESUBJECTALTNAME2 (ESC6):**

Allows SAN in cert request from any user, even templates without ENROLLEE_SUPPLIES_SUBJECT. Single CA registry flag = bypass template restrictions. Critical hardening: disable.

**Por qué Manage CA (ESC7) dangerous:**

Manage CA right = approve pending requests + enable templates. Atacante requests cert (denied initially) → approves own request as Manage CA holder → cert issued. Or enables disabled vulnerable templates. Per-CA ACL audit critical.

**Por qué BloodHound ADCS transformative:**

Pre-BHCE 5.x: manual ESC analysis per template. Post-BHCE 5.x: automated graph + Cypher queries. "Find all ESC1 paths from owned to DA" = single query. ADCS attack analysis democratized.

**Por qué post-2022 patches matter:**

CVE-2022-26923 (Certifried) introduced StrongCertificateBindingEnforcement. ESC9/10 patched in mode 2. Legacy environments with mode 0 (compatibility) still vulnerable. Modern: enforce strong mode.

___

## Recursos

- [HackTricks - ADCS](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ad-certificates) — comprehensive.
- [The Hacker Recipes - AD CS](https://www.thehacker.recipes/ad/movement/ad-cs) — reference.
- [SpecterOps - "Certified Pre-Owned"](https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf) — foundational ESC1-8 paper.
- [Will Schroeder - ADCS Research](https://posts.specterops.io/) — ongoing.
- [Lee Christensen - ADCS](https://posts.specterops.io/) — research.
- [Certipy (ly4k)](https://github.com/ly4k/Certipy) — modern tool.
- [PSPKIAudit (GhostPack)](https://github.com/GhostPack/PSPKIAudit) — Windows tool.
- [BloodHound ADCS docs](https://bloodhound.specterops.io/) — tool docs.
- [Microsoft - ADCS Documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/) — vendor.
- [Microsoft Defender for Identity ADCS](https://learn.microsoft.com/en-us/defender-for-identity/) — modern.
- [PingCastle](https://www.pingcastle.com/) — audit.
- [Purple Knight](https://www.semperis.com/purple-knight/) — audit.
- [CVE-2022-26923 (Certifried)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2022-26923) — patch reference.
- [MITRE ATT&CK T1649](https://attack.mitre.org/techniques/T1649/) — Steal or Forge Authentication Certificates.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-active-directory) — curated.

***
