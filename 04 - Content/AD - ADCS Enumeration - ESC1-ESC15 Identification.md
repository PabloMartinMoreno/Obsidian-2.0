---
aliases:
  - ESC1 ESC2 ESC3
  - ADCS Vulnerabilities
  - certipy vulnerable
  - ESC4-ESC15
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - ADCS Enumeration]]"
  - "[[AD CS Abuse]]"
---
# AD - ADCS Enumeration - ESC1-ESC15 Identification

***

## ESC1 (Vulnerable Template - SAN + Client Auth)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| EnrolleeSuppliesSubject flag | `msPKI-Certificate-Name-Flag & 0x1` | Standard. |
| ENROLLEE_SUPPLIES_SAN | `msPKI-Certificate-Name-Flag & 0x10000` | Critical. |
| Client Authentication EKU | `1.3.6.1.5.5.7.3.2` | Standard. |
| Smart Card Logon EKU | `1.3.6.1.4.1.311.20.2.2` | Adjacent. |
| Manager approval not required | `msPKI-RA-Signature = 0` | Critical. |
| Authenticated Users / Domain Users with Enroll | Common misconfig | Critical. |
| Combined = ESC1 vulnerable | All conditions | Critical. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| BloodHound ESC1 query | Cypher | Tool. |
| Atacante: request cert with arbitrary SAN | Direct | Standard. |
| Result: cert as any user (e.g., DA) | Critical | Critical. |
| Mitigation: disable EnrolleeSuppliesSubject | Standard | Hardening. |
| Mitigation: require manager approval | Adjacent | Hardening. |
| Mitigation: restrict Enroll to specific groups | Standard | Hardening. |
| Detection: cert request with SAN | Defender | Adjacent. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
^ad-esc1

### ESC1 detection

```bash
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout | grep -A 20 "ESC1"
```

___

## ESC2 (Any Purpose / Subordinate CA)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Any Purpose EKU | OID `2.5.29.37.0` | Critical. |
| OR no EKU set (Subordinate CA) | Empty pKIExtendedKeyUsage | Critical. |
| Authenticated Users with Enroll | Common | Critical. |
| Manager approval not required | Standard | Critical. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| Atacante: cert with Any Purpose = use for anything | Direct | Standard. |
| Or: subordinate CA cert = forge other certs | Critical | Critical. |
| Combined with ESC3 enrollment agent = critical | Adjacent | Edge. |
| Mitigation: specific EKU only | Standard | Hardening. |
| Mitigation: restrict Enroll | Standard | Hardening. |
| Detection: Any Purpose cert issuance | Defender | Adjacent. |
| Modern: minimal templates with broad EKU | Best practice | Standard. |
| BloodHound ESC2 query | Cypher | Tool. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| Compliance: documented per-template | Standard | Adjacent. |
^ad-esc2

___

## ESC3 (Enrollment Agent Template)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Certificate Request Agent EKU | OID `1.3.6.1.4.1.311.20.2.1` | Standard. |
| Authenticated Users with Enroll | Standard | Audit. |
| Manager approval not required | Adjacent | Standard. |
| Allows enrolling on behalf of others | Standard | Standard. |
| Combined with ESC1/ESC2 = chain | Adjacent | Standard. |
| Atacante: enroll cert + use as agent for victim | Standard chain | Standard. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| BloodHound `EnrollOnBehalfOf` edge adjacent | Modern | Tool. |
| Mitigation: restrict Enrollment Agent template | Standard | Hardening. |
| Mitigation: Authorized Signatures Required | Standard | Hardening. |
| Detection: Enrollment Agent cert issuance | Defender | Adjacent. |
| Modern: minimal Enrollment Agent templates | Best practice | Standard. |
| Cross-correlate with vulnerable target templates | Standard | Audit. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Per-template documented justification | Standard | Compliance. |
| Audit: per-quarter | Standard | Compliance. |
^ad-esc3

___

## ESC4 (Vulnerable Template ACL)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| WriteProperty / WriteDacl / GenericAll / GenericWrite on template | Atacante modify | Critical. |
| Authenticated Users / Domain Users with modify | Critical misconfig | Critical. |
| Atacante converts safe template → ESC1 vulnerable | Modify flags | Critical. |
| Modify msPKI-Certificate-Name-Flag | Add ENROLLEE_SUPPLIES_SUBJECT | Direct. |
| Modify pKIExtendedKeyUsage | Add Client Auth | Direct. |
| Modify msPKI-Enrollment-Flag | Adjacent | Adjacent. |
| Modify Enrollment ACL | Add self | Adjacent. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| BloodHound `WritePKINameFlag`, `WritePKIEnrollmentFlag` edges | Modern | Tool. |
| BloodHound `WriteOwner`, `WriteDacl`, `GenericAll`, `GenericWrite` on template | Standard | Tool. |
| Atacante chain: ESC4 → modify → ESC1 → cert as DA | Critical | Critical. |
| Mitigation: strict template DACL | Standard | Hardening. |
| Mitigation: minimal modify rights | Best practice | Hardening. |
| Detection: template modify events (5136) | Defender | Adjacent. |
| Modern: continuous BloodHound | Tool | Standard. |
| Cleanup: revert template modifications | Standard | OPSEC. |
^ad-esc4

___

## ESC5 (Vulnerable PKI Object ACL)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| WriteProperty on CA / AIA / NTAuthCertificates | Modify trust | Critical. |
| GenericAll on PKI objects | Full | Critical. |
| Authenticated Users with modify | Critical | Critical. |
| Atacante adds own CA to NTAuth | ESC11 adjacent | Critical. |
| Atacante modifies CA policy | Adjacent | Adjacent. |
| Cross-correlate with ESC11 | Standard | Audit. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| BloodHound PKI object ACL edges | Modern | Tool. |
| Mitigation: minimal modify rights | Best practice | Hardening. |
| Modern: extreme audit PKI objects | Critical | Standard. |
| Detection: PKI ACL modify | Defender critical alert | Defender. |
| Per-quarter PKI ACL audit | Standard | Compliance. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Stale ACE on PKI objects | Audit | Standard. |
| Cleanup: revert PKI ACL changes | Critical | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-esc5

___

## ESC6 (EDITF_ATTRIBUTESUBJECTALTNAME2)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| EDITF_ATTRIBUTESUBJECTALTNAME2 enabled on CA | Registry flag | Critical. |
| `certutil -getreg policy\EditFlags` | Native query | Standard. |
| 0x40000 bit in EditFlags | Direct | Standard. |
| Allows SAN in cert request from any user | Critical | Critical. |
| Combined with template having Client Auth EKU | Cert as anyone | Critical. |
| Even templates without ENROLLEE_SUPPLIES_SUBJECT vulnerable | Edge | Critical. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| Atacante: any cert template with Client Auth → cert as DA | Standard | Critical. |
| Patched in 2022 by Microsoft (CVE-2022-26923 partial) | Patched | Adjacent. |
| Mitigation: disable EDITF_ATTRIBUTESUBJECTALTNAME2 | Direct fix | Hardening. |
| `certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2` | Standard | Hardening. |
| Detection: ESC6 cert issuance | Defender | Adjacent. |
| Modern: extreme audit CA registry | Best practice | Standard. |
| Audit: per-quarter EDITF check | Standard | Compliance. |
| Cleanup: re-disable | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-esc6

___

## ESC7 (Vulnerable CA ACL)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Manage CA right | Per-CA ACL | Critical. |
| Manage Certificates right | Per-CA ACL | Critical. |
| Authenticated Users / Domain Users with Manage CA | Critical misconfig | Critical. |
| Atacante: approve own pending requests | Standard | Standard. |
| Atacante: enable disabled vulnerable templates | Standard | Standard. |
| Atacante: add self as CA Officer | Edge | Standard. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| `certipy ca -ca CA -add-officer` | Standard | Tool. |
| BloodHound `ManageCA`, `ManageCertificates` edges | Modern | Tool. |
| Mitigation: minimal Manage CA holders | Best practice | Hardening. |
| Mitigation: per-tier CA admin separation | Standard | Hardening. |
| Detection: CA ACL modify events | Defender | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
| Per-quarter CA ACL audit | Standard | Compliance. |
| Adjacent: CA ACL Audit hub | Cross-ref | Adjacent. |
| Cleanup: revert CA ACL changes | Standard | OPSEC. |
^ad-esc7

___

## ESC8 (Web Enrollment NTLM Relay)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| `https://CA/certsrv/` enabled | Web Enrollment | Standard. |
| HTTP NTLM auth | Default | Critical. |
| HTTPS without Channel Binding (EPA) | Vulnerable | Critical. |
| Combined with NTLM Relay | Atacante relays auth → cert | Standard chain. |
| Atacante coerces DC auth → relay to certsrv → DC cert | Critical chain | Critical. |
| `ntlmrelayx --target http://CA/certsrv/certfnsh.asp --adcs --template DomainController` | Standard | Tool. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| BloodHound `EnrollOnTemplate` adjacent | Modern | Tool. |
| Mitigation: disable Web Enrollment | Standard | Hardening. |
| Mitigation: HTTPS + Channel Binding (EPA) | Modern | Hardening. |
| Mitigation: SMB Signing required | Adjacent | Hardening. |
| Detection: relayed cert issuance | Defender | Adjacent. |
| Modern: ADCS over HTTPS only with EPA | Best practice | Standard. |
| Per-CA Web Enrollment audit | Standard | Compliance. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
^ad-esc8

___

## ESC9 (No Security Extension)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| `CT_FLAG_NO_SECURITY_EXTENSION` | msPKI-Enrollment-Flag bit | Standard. |
| 0x80000 bit in msPKI-Enrollment-Flag | Direct | Standard. |
| Cert without security extension | UPN spoofing path | Critical. |
| Combined with `msDS-AllowedToActOnBehalfOfOtherIdentity` | Adjacent | Edge. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| CVE-2022-26923 (Certifried) | Patched | Adjacent. |
| Atacante UPN spoofing chain | Standard | Critical. |
| Mitigation: enable security extension | Direct fix | Hardening. |
| Mitigation: patch CVE-2022-26923 | Standard | Adjacent. |
| Detection: cert without security extension | Defender | Adjacent. |
| Modern: post-patch hardened | Standard | Adjacent. |
| Audit: per-template flag check | Standard | Compliance. |
| Adjacent: ESC10 weak cert mappings | Adjacent | Adjacent. |
| BloodHound ESC9 query | Cypher | Tool. |
| Cleanup post-engagement | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-esc9

___

## ESC10 (Weak Certificate Mappings)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Weak certificate-to-account mapping | Cert binding flexibility | Standard. |
| `StrongCertificateBindingEnforcement` registry | Per-DC | Standard. |
| Pre-2022 default: weak | Patched mode | Adjacent. |
| Post-CVE-2022-26923 mode | StrongCertificateBindingEnforcement = 1 | Modern. |
| Compatibility mode = weak (mode 0) | Edge legacy | Edge. |
| Atacante with cert + UPN match → impersonate | Standard | Standard. |
| Combined with ESC9 | Adjacent | Adjacent. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| Mitigation: StrongCertificateBindingEnforcement = 2 | Standard | Hardening. |
| Mitigation: patch CVE-2022-26923 | Standard | Adjacent. |
| Detection: cert auth anomaly | Defender | Adjacent. |
| Modern: Strong mode default | Standard | Adjacent. |
| Audit: per-DC StrongCertificateBindingEnforcement | Standard | Compliance. |
| Adjacent: ESC9 + ESC10 combined | Adjacent | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-esc10

___

## ESC11 (LDAP IF_FLAG_NO_PROTECTION_POLICY)

| **Indicator** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| LDAP IF_FLAG_NO_PROTECTION_POLICY enabled | LDAP signing requirement off | Critical. |
| `LDAPServerIntegrity` registry | Per-DC | Standard. |
| Allows LDAP without signing | Vulnerable to relay | Critical. |
| Combined with NTLM Relay | LDAP relay path | Standard chain. |
| Atacante relays NTLM auth to LDAP → modify AD | Standard | Standard. |
| `ntlmrelayx -t ldap://DC -wh attacker` | Standard | Tool. |
| Combined with ADCS Web Enrollment | Edge | Adjacent. |
| `certipy find -vulnerable` detects | Standard | Tool. |
| Mitigation: enable LDAP signing required | Direct fix | Hardening. |
| `LdapEnforceChannelBinding=2` | Modern hardening | Standard. |
| Detection: LDAP relay attempts | Defender | Adjacent. |
| Modern: extreme audit LDAP signing | Best practice | Standard. |
| Per-DC LDAP signing check | Standard | Compliance. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Cross-correlate per-DC | Standard | Audit. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-esc11

___

## ESC12-ESC15 (Modern Vulnerabilities)

| **ESC** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| ESC12 | Smart card via TPM (debugging) | Edge. |
| ESC13 | OID Group Link manipulation | Modern. |
| ESC14 | LDAP IF_FLAG_NO_REVOCATION_CHECK | Modern. |
| ESC15 | EKUwu (cert request manipulation, SAN) | Modern. |
| Discovered post-2023 | Newer research | Adjacent. |
| `certipy` modern versions detect | Standard | Tool. |
| BloodHound CE 6.x ADCS support | Modern | Tool. |
| Mitigation: per-ESC patch | Standard | Adjacent. |
| Detection: per-ESC events | Defender | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Audit: per-quarter ADCS review | Standard | Compliance. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-esc12-15

___

## Comprehensive certipy Vulnerability Scan

```bash
# Comprehensive ESC1-ESC15 detection
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout

# Output sections per CA:
# - Certificate Authorities (CAs)
# - Certificate Templates (enabled)
# - Vulnerable Certificate Templates (per ESC)
# - CA misconfigurations (EDITF flags, ACL)
# - Web Enrollment status

# Per-vulnerability:
# Template Name: VulnTemplate
# Vulnerabilities:
#   ESC1
#   ESC2
#   ESC4

# JSON output for parsing
certipy find -u user -p pass -dc-ip DC -vulnerable -json -output adcs_audit.json

# Per-template detail
cat adcs_audit.json | jq '.[].Templates[] | select(.["[!] Vulnerabilities"])'
```

___

## BloodHound ADCS Cypher

```cypher
// All ESC1 vulnerable templates
MATCH (t:CertTemplate)
WHERE t.enrolleesuppliessubject = true
  AND t.authenticationenabled = true
  AND t.requiresmanagerapproval = false
  AND t.authorizedsignatures = 0
RETURN t.name

// Owned principal can ESC1
MATCH (u {owned: true})-[:Enroll|AutoEnroll|MemberOf*1..]->(t:CertTemplate)
WHERE t.enrolleesuppliessubject = true
  AND t.authenticationenabled = true
  AND t.requiresmanagerapproval = false
RETURN u.name, t.name

// ESC4: template ACL paths
MATCH (u {owned: true})-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite|WritePKINameFlag|WritePKIEnrollmentFlag*1..]->(t:CertTemplate)
RETURN u.name, t.name

// ESC7: Manage CA paths
MATCH (u {owned: true})-[:ManageCA|ManageCertificates|MemberOf*1..]->(c:CA)
RETURN u.name, c.name
```

***
