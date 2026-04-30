---
aliases:
  - Cert Template Audit
  - pKICertificateTemplate
  - Template ACL
  - Enabled Templates
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
---
# AD - ADCS Enumeration - Certificate Templates Audit

***

## Template Object Class

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `pKICertificateTemplate` | LDAP class | Standard. |
| Storage container | `CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=...` | Forest-wide. |
| Per-template attributes | 50+ attrs | Detailed. |
| Schema version | v1, v2, v3, v4 | Version-specific behavior. |
| `flags` attribute | Bitfield | Standard. |
| `displayName` | UI display | Standard. |
| `cn` (templateName) | Internal ID | Standard. |
| Default templates: User, Computer, Web Server, etc. | Standard | Standard. |
| Custom templates per-org | Audit | Standard. |
| Per-template enabled per-CA | `certificateTemplates` attribute on CA | Standard. |
| Enrollment + Autoenrollment | Per-template | Standard. |
| Detection: template modify events | Defender | Adjacent. |
| Modern: minimal templates | Best practice | Standard. |
| Compliance: per-template documented | Standard | Adjacent. |
| Audit: per-quarter template review | Standard | Compliance. |
| BloodHound CertTemplate nodes | Modern | Tool. |
^ad-tmpl-class

### Template enum

```bash
# All templates (forest-wide)
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKICertificateTemplate)" \
  cn displayName flags
```

```powershell
# RSAT
Get-ADObject -SearchBase "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" `
  -Filter * -Properties * |
  Select Name,DisplayName,
    @{n='Flags';e={'0x{0:X}' -f $_.flags}}
```

___

## Critical Template Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `flags` | Bitfield (autoenroll, etc.) | Standard. |
| `pKIDefaultKeySpec` | Key spec | Standard. |
| `pKIKeyUsage` | Key usage | Standard. |
| `pKIExtendedKeyUsage` (EKU) | Client Auth, etc. | Critical. |
| `msPKI-Certificate-Name-Flag` | Subject Name flags | Critical. |
| `msPKI-Enrollment-Flag` | Enrollment flags | Critical. |
| `msPKI-Private-Key-Flag` | Private key flags | Standard. |
| `msPKI-RA-Signature` | Authorized Signatures Required | Critical. |
| `msPKI-Template-Schema-Version` | Schema version (1-4) | Standard. |
| `msPKI-RA-Application-Policies` | Adjacent | Edge. |
| `revision` | Template version | Standard. |
| `pKICriticalExtensions` | Critical extensions | Edge. |
| `pKIExpirationPeriod` | Validity | Standard. |
| `pKIOverlapPeriod` | Renewal window | Standard. |
| `nTSecurityDescriptor` | DACL | Critical. |
| Per-attribute analysis required | Standard | Standard. |
^ad-tmpl-attrs

### Critical attributes query

```bash
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKICertificateTemplate)" \
  cn displayName \
  pKIExtendedKeyUsage \
  msPKI-Certificate-Name-Flag \
  msPKI-Enrollment-Flag \
  msPKI-RA-Signature \
  msPKI-Template-Schema-Version
```

___

## msPKI-Certificate-Name-Flag (Subject Name Source)

| **Flag** | **Hex** | **Significado** |
|:---:|:---:|:---:|
| ENROLLEE_SUPPLIES_SUBJECT | 0x00000001 | Enrollee supplies subject (SAN) — ESC1 vector. |
| OLD_CERT_SUPPLIES_SUBJECT | 0x00000008 | Renew uses old subject | Standard. |
| ENROLLEE_SUPPLIES_SUBJECT_ALT_NAME | 0x00010000 | Enrollee supplies SAN | ESC1 critical. |
| SUBJECT_REQUIRE_DIRECTORY_PATH | 0x40000000 | Subject from AD | Standard. |
| SUBJECT_REQUIRE_COMMON_NAME | 0x40000000 | Common Name from AD | Standard. |
| SUBJECT_REQUIRE_DNS_AS_CN | 0x10000000 | DNS as CN | Edge. |
| SUBJECT_REQUIRE_EMAIL | 0x20000000 | Email required | Edge. |
| SUBJECT_ALT_REQUIRE_DOMAIN_DNS | 0x00400000 | Domain DNS in SAN | Standard. |
| SUBJECT_ALT_REQUIRE_SPN | 0x00800000 | SPN in SAN | Edge. |
| SUBJECT_ALT_REQUIRE_DIRECTORY_GUID | 0x01000000 | GUID in SAN | Edge. |
| SUBJECT_ALT_REQUIRE_UPN | 0x02000000 | UPN in SAN | Common. |
| SUBJECT_ALT_REQUIRE_EMAIL | 0x04000000 | Email in SAN | Edge. |
| SUBJECT_ALT_REQUIRE_DNS | 0x08000000 | DNS in SAN | Standard. |
| ENROLLEE_SUPPLIES_SUBJECT + SAN = ESC1 | Combined critical | Critical. |
| Flag combinations matter | Bitfield decode | Standard. |
| Per-template variation | Adjacent | Standard. |
^ad-tmpl-namesflag

### Flag decode

```python
def decode_name_flag(flag):
    flags = []
    if flag & 0x1: flags.append("ENROLLEE_SUPPLIES_SUBJECT (ESC1 vector)")
    if flag & 0x8: flags.append("OLD_CERT_SUPPLIES_SUBJECT")
    if flag & 0x10000: flags.append("ENROLLEE_SUPPLIES_SAN (ESC1 CRITICAL)")
    if flag & 0x40000000: flags.append("SUBJECT_REQUIRE_DIRECTORY_PATH")
    if flag & 0x10000000: flags.append("SUBJECT_REQUIRE_DNS_AS_CN")
    if flag & 0x20000000: flags.append("SUBJECT_REQUIRE_EMAIL")
    if flag & 0x400000: flags.append("SUBJECT_ALT_REQUIRE_DOMAIN_DNS")
    if flag & 0x800000: flags.append("SUBJECT_ALT_REQUIRE_SPN")
    if flag & 0x1000000: flags.append("SUBJECT_ALT_REQUIRE_DIRECTORY_GUID")
    if flag & 0x2000000: flags.append("SUBJECT_ALT_REQUIRE_UPN")
    if flag & 0x4000000: flags.append("SUBJECT_ALT_REQUIRE_EMAIL")
    if flag & 0x8000000: flags.append("SUBJECT_ALT_REQUIRE_DNS")
    return flags

# Critical: ENROLLEE_SUPPLIES_SUBJECT or ENROLLEE_SUPPLIES_SAN = ESC1 vector
```

___

## EKU (Extended Key Usage)

| **EKU** | **OID** | **Notas** |
|:---:|:---:|:---:|
| Client Authentication | `1.3.6.1.5.5.7.3.2` | ESC1 + ESC4 critical. |
| Smart Card Logon | `1.3.6.1.4.1.311.20.2.2` | Auth-related. |
| PKINIT Client Authentication | `1.3.6.1.5.2.3.4` | Auth-related. |
| Any Purpose | `2.5.29.37.0` | ESC2 critical. |
| Subordinate CA | EKU empty | ESC2 critical. |
| Certificate Request Agent | `1.3.6.1.4.1.311.20.2.1` | ESC3 specific. |
| Server Authentication | `1.3.6.1.5.5.7.3.1` | Standard. |
| Code Signing | `1.3.6.1.5.5.7.3.3` | Edge. |
| Email Protection | `1.3.6.1.5.5.7.3.4` | Edge. |
| Empty EKU = Subordinate CA | ESC2 vector | Critical. |
| Multiple EKUs allowed | Standard | Standard. |
| Per-template EKU set | Direct attribute | Standard. |
| Cross-correlate with name flags | Critical | Audit. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Compliance: minimal EKU | Best practice | Standard. |
| Modern: per-template documented EKU | Standard | Adjacent. |
^ad-tmpl-eku

### EKU analysis

```python
EKU_NAMES = {
  "1.3.6.1.5.5.7.3.2": "Client Authentication",
  "1.3.6.1.4.1.311.20.2.2": "Smart Card Logon",
  "1.3.6.1.5.2.3.4": "PKINIT Client Authentication",
  "2.5.29.37.0": "Any Purpose",
  "1.3.6.1.4.1.311.20.2.1": "Certificate Request Agent",
  "1.3.6.1.5.5.7.3.1": "Server Authentication",
}

# ESC2 indicators:
# - "Any Purpose" EKU (2.5.29.37.0)
# - Empty EKU = treated as Subordinate CA

# ESC3 indicators:
# - "Certificate Request Agent" EKU (1.3.6.1.4.1.311.20.2.1)

# ESC1 indicators (combined with name flags):
# - "Client Authentication" / "Smart Card Logon" / "PKINIT" + ENROLLEE_SUPPLIES_SUBJECT
```

___

## msPKI-RA-Signature (Manager Approval)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msPKI-RA-Signature` = 0 | No manager approval | Standard. |
| `msPKI-RA-Signature` >= 1 | Manager approval required | Hardening. |
| Authorized Signatures Required | UI label | Standard. |
| ESC1 prerequisite: `msPKI-RA-Signature` = 0 | Standard | Critical. |
| ESC1 vulnerable: no manager approval + SAN flag | Combined | Critical. |
| Modern hardening: require approval for sensitive | Best practice | Standard. |
| Per-template setting | Granular | Standard. |
| Detection: template modify events | Defender | Adjacent. |
| Audit: per-template approval status | Standard | Compliance. |
| Adjacent: Enrollment Agent (ESC3) | Adjacent | Adjacent. |
| Modern: documented per-template | Standard | Adjacent. |
| Compliance: minimal templates without approval | Standard | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| BloodHound template analysis | Modern | Tool. |
| Cypher: filter by ESC criteria | Custom | Tool. |
| Modern: Defender for Identity template alerts | Modern | Defender. |
^ad-tmpl-rasig

### Manager approval audit

```bash
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(&(objectClass=pKICertificateTemplate)(!(msPKI-RA-Signature=*)))" \
  cn displayName

# Templates without manager approval:
# - msPKI-RA-Signature = 0 or unset
# - Combined with ESC1 conditions = critical
```

___

## Template Enrollment Permissions (ACL)

| **Permission** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| Enroll | Required to request cert | Standard. |
| Autoenroll | Auto-enrollment | Adjacent. |
| Read | View template | Standard. |
| Write | Modify template (ESC4) | Critical. |
| Full Control | All | Critical. |
| Per-principal granular | Standard | Standard. |
| Default Authenticated Users sometimes Enroll | Permissive | Audit. |
| Custom: per-OU enrollment | Standard | Standard. |
| BloodHound `Enroll`, `AutoEnroll`, `Owns`, `WriteOwner`, `WriteDacl`, `GenericWrite`, `GenericAll` edges | Modern | Tool. |
| Authenticated Users with Enroll on vulnerable template | Critical | Critical. |
| Domain Users with Enroll on vulnerable | Critical | Critical. |
| ACL inheritance | Standard | Adjacent. |
| Detection: template ACL modify | Defender | Adjacent. |
| Audit: per-template ACL review | Standard | Compliance. |
| Cleanup: stale enrollment grants | Hygiene | Standard. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-tmpl-acl

### Template ACL audit

```powershell
# Per-template DACL audit
$templatesPath = "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)"

Get-ChildItem "AD:$templatesPath" | ForEach-Object {
  $tmpl = $_.Name
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  
  $enrollers = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ActiveDirectoryRights -match "ExtendedRight|GenericAll|GenericWrite|WriteDACL|WriteOwner"
  }
  
  if ($enrollers) {
    [PSCustomObject]@{
      Template = $tmpl
      NonDefaultPrincipals = ($enrollers.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## Per-Template Vulnerability Assessment

| **Vulnerability Pattern** | **Indicators** | **Mapping** |
|:---:|:---:|:---:|
| ESC1 | EnrolleeSuppliesSubject + ClientAuth EKU + No Manager Approval + Auth Users Enroll | Critical. |
| ESC2 | "Any Purpose" EKU OR empty EKU + Auth Users Enroll | Critical. |
| ESC3 | Certificate Request Agent EKU + Auth Users Enroll | Standard. |
| ESC4 | WriteProperty/GenericAll on template + Auth Users | Critical. |
| ESC5 | WriteProperty on PKI objects (CA, AIA) | Standard. |
| ESC6 | EDITF_ATTRIBUTESUBJECTALTNAME2 enabled on CA | Critical. |
| ESC7 | Manage CA / Manage Certificates ACL | Critical. |
| ESC8 | Web Enrollment + NTLM auth + Channel Binding off | Critical. |
| ESC9 | No security extension (UPN spoofing) | Modern. |
| ESC10 | Weak cert mappings (weak certificate-to-account binding) | Modern. |
| ESC11 | LDAP IF_FLAG_NO_PROTECTION_POLICY | Modern. |
| ESC12 | Smart card via TPM (debugging) | Edge. |
| ESC13 | OID Group Link manipulation | Modern. |
| ESC14 | LDAP IF_FLAG_NO_REVOCATION_CHECK | Modern. |
| ESC15 | EKUwu (cert request manipulation) | Modern. |
| Combined patterns | Multi-attribute analysis | Standard. |
^ad-tmpl-vulns

### certipy vulnerability scan

```bash
# Comprehensive vulnerability scan
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout

# Output per template:
# Template Name: VulnTemplate
# Display Name: VulnTemplate
# Certificate Authorities: CA01
# Enabled: True
# Client Authentication: True
# Enrollment Agent: False
# Any Purpose: False
# Enrollee Supplies Subject: True       <- ESC1 indicator
# Authorized Signatures Required: 0      <- ESC1 indicator
# Permissions:
#   Enrollment Permissions:
#     Enrollment Rights: Domain Users   <- ESC1 critical
# Vulnerabilities:
#   ESC1
```

___

## Default vs Custom Templates

| **Pattern** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Default Microsoft templates | Standard set | Standard. |
| Custom org templates | Per-org | Audit. |
| Default User template | Standard usage | Edge ESC1. |
| Default Computer template | Standard | Standard. |
| Default Web Server template | Standard | Edge. |
| Default Domain Controller Authentication | Tier 0 | Standard. |
| Custom service templates | Audit | Standard. |
| Custom legacy templates | Audit | Standard. |
| Templates flagged disabled | Edge | Standard. |
| Template inheritance: superseded | Edge | Edge. |
| Per-template enabled per-CA | Different across CAs | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| BloodHound default template detection | Modern | Tool. |
| Detection: custom template addition | Defender | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: minimize custom templates | Best practice | Standard. |
^ad-tmpl-default

### Default vs custom

```powershell
$templates = Get-ADObject -SearchBase "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" `
  -Filter * -Properties displayName,whenCreated

$defaults = "User","Administrator","Computer","DomainController","WebServer","SmartcardUser",
             "EFS","BasicEFS","CodeSigning","TrustListSigning","SmartcardLogon"

$custom = $templates | Where {$defaults -notcontains $_.Name}
$custom | Select Name,displayName,whenCreated | Sort whenCreated -Descending
```

___

## Modern Template Best Practices

| **Practice** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Manager approval for sensitive | `msPKI-RA-Signature` >= 1 | Hardening. |
| Subject built from AD | Avoid ENROLLEE_SUPPLIES | Hardening. |
| Disable Web Enrollment if not needed | Reduces ESC8 | Hardening. |
| HTTPS-only Web Enrollment with EPA | Modern | Standard. |
| Strict Enrollment ACL (per-OU) | Granular | Hardening. |
| Audit: per-template review per-quarter | Standard | Compliance. |
| Patch CVE-2022-26923 | Adjacent | Adjacent. |
| Modern: documented per-template | Standard | Adjacent. |
| Defender for Identity template alerts | Modern | Defender. |
| BloodHound continuous template audit | Modern | Tool. |
| Per-template MFA enforcement | Modern | Hardening. |
| Cross-correlate with priv tier | Standard | Audit. |
| Stale templates cleanup | Hygiene | Standard. |
| Compliance: NIST PKI guidance | Standard | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Adjacent: Microsoft ADCS hardening guide | Reference | Standard. |
^ad-tmpl-bestpractice

### Hardening commands

```bash
# certipy ESC vulnerability scan + remediation guidance
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout

# Per-vulnerability:
# ESC1: Disable ENROLLEE_SUPPLIES_SUBJECT or require manager approval
# ESC2: Remove "Any Purpose" EKU, use specific
# ESC4: Audit template ACL, remove non-tier 0 modify rights
# ESC8: Disable Web Enrollment OR enable HTTPS + Channel Binding
```

```powershell
# Disable ENROLLEE_SUPPLIES_SUBJECT flag (manual via certtmpl.msc or LDAP)
# Set msPKI-RA-Signature to 1 (require approval)
# Restrict Enroll permission to specific groups
```

***
