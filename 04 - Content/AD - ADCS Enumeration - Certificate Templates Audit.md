---
aliases:
  - Cert Template Audit
  - pKICertificateTemplate
  - Template ACL
  - msPKI-Certificate-Name-Flag
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[AD - ADCS Enumeration]]'
---
# AD - ADCS Enumeration - Certificate Templates Audit

***

## Template Object Class

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -SearchBase "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).rootDomainNamingContext)" -Filter "objectClass -eq 'pKICertificateTemplate'" -Pr *` | Templates raw | Standard. |
| `Get-CertificateTemplate` (PSPKI) | Templates wrapper amigable | Native. |
| `certutil -dsTemplate` | Templates raw native | Sin RSAT. |
| `certipy find -u u -p pass -dc-ip <DC> -text` | Templates parseados Linux | Standard Linux. |
^ad-tmpl-class

___

## Critical Template Attributes

| **Atributo** | **Significado** | **Para qué sirve** |
|:---:|:---:|:---:|
| `cn` / `name` | Template name | ID. |
| `displayName` | UI display name | Standard. |
| `pkiExtendedKeyUsage` | EKU OIDs (Client Auth, Smart Card Logon, etc) | Auth capability. |
| `msPKI-Certificate-Name-Flag` | Bitfield: `ENROLLEE_SUPPLIES_SUBJECT` (ESC1!) | Critical. |
| `msPKI-Enrollment-Flag` | Bitfield: `PEND_ALL_REQUESTS` (manager approval), `NO_SECURITY_EXTENSION` (ESC9) | Audit. |
| `msPKI-RA-Signature` | Manager approvals required (>0 = harder) | Mitigation indicator. |
| `nTSecurityDescriptor` | DACL — quien puede enroll/write | ESC4 hunt. |
| `msPKI-Certificate-Application-Policy` | Application Policy OIDs | Adjacent EKU. |
| `pkiCriticalExtensions` | Extensiones críticas | Standard. |
| `revision` | Schema version | Compatibility. |
^ad-tmpl-attrs

```powershell
# Audit completo todos templates
Get-CertificateTemplate | Select Name,DisplayName,
  @{n='EKU';e={$_.ExtendedKeyUsage.FriendlyName -join ';'}},
  @{n='NameFlag';e={'0x{0:X}' -f [int]$_.NameFlags}},
  @{n='EnrollFlag';e={'0x{0:X}' -f [int]$_.EnrollmentFlags}},
  @{n='Approvals';e={$_.RASignature}}
```

___

## msPKI-Certificate-Name-Flag

| **Hex** | **Flag** | **Qué hace** |
|:---:|:---:|:---:|
| `0x1` | `ENROLLEE_SUPPLIES_SUBJECT` | **CRITICAL — ESC1**: requestor especifica SAN. |
| `0x2` | `OLD_CERT_SUPPLIES_SUBJECT` | Legacy renewal. |
| `0x8` | `ENROLLEE_SUPPLIES_SUBJECT_REQUIRE_DIRECTORY_PATH` | Edge. |
| `0x10000` | `SUBJECT_ALT_REQUIRE_DOMAIN_DNS` | Auto-include. |
| `0x80000` | `SUBJECT_ALT_REQUIRE_DIRECTORY_GUID` | Edge. |
| `0x100000` | `SUBJECT_ALT_REQUIRE_UPN` | Auto. |
| `0x200000` | `SUBJECT_ALT_REQUIRE_EMAIL` | Auto. |
| `0x400000` | `SUBJECT_ALT_REQUIRE_DNS` | Auto. |
| `0x40000000` | `SUBJECT_REQUIRE_DIRECTORY_PATH` | Edge. |
^ad-tmpl-namesflag

```bash
# ESC1 hunt — templates que permiten requestor SAN
certipy find -u u -p pass -dc-ip <DC> -vulnerable -stdout | grep -A2 "ESC1"

# LDAP raw filter
ldapsearch -h <DC> -D 'corp\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" \
  "(&(objectClass=pKICertificateTemplate)(msPKI-Certificate-Name-Flag:1.2.840.113556.1.4.803:=1))" \
  cn pkiExtendedKeyUsage
```

___

## EKU (Extended Key Usage)

| **OID** | **EKU** | **Importancia** |
|:---:|:---:|:---:|
| `1.3.6.1.5.5.7.3.2` | Client Authentication | **CRITICAL** — auth as user. |
| `1.3.6.1.5.5.7.3.1` | Server Authentication | Standard server cert. |
| `1.3.6.1.4.1.311.20.2.2` | Smart Card Logon | Auth as user (PKINIT). |
| `1.3.6.1.4.1.311.20.2.1` | Certificate Request Agent (Enrollment Agent) | **ESC3** — request on behalf. |
| `2.5.29.37.0` | `Any Purpose` | **ESC2** — wildcard EKU. |
| `1.3.6.1.5.5.7.3.4` | Email | Standard. |
| `1.3.6.1.4.1.311.10.3.4` | EFS | Edge. |
^ad-tmpl-eku

**Auth-capable EKUs** (= peligrosos cuando combinados con SAN injection):
- Client Authentication
- Smart Card Logon
- Any Purpose
- Certificate Request Agent
- Sin EKU especificado (= cualquier purpose)

```bash
# Templates con auth-capable EKU
certipy find -u u -p pass -dc-ip <DC> -text | grep -E "Client Authentication|Smart Card|Any Purpose|Certificate Request Agent"
```

___

## msPKI-RA-Signature

| **Valor** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `0` | Sin manager approval | Auto-enroll. |
| `1+` | N firmas required | Mitigation. |
^ad-tmpl-rasig

**Mitigation indicator:** templates con `msPKI-RA-Signature > 0` requieren approval manual = atacante no puede auto-enrollar. Default ESC1-style templates suelen tener `0`.

___

## Template Enrollment ACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:CN=<template>,CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).rootDomainNamingContext)").Access` | DACL del template | Per-template audit. |
| `Get-CertificateTemplate -Name <template> \| Get-CertificateTemplateAcl` (PSPKI) | DACL wrapper | Standard. |
| `certipy find -u u -p pass -dc-ip <DC> -text` (incluye ACL en output) | Auto-decoded | Linux. |
^ad-tmpl-acl

**ACEs interesantes:**
- `Certificate-Enrollment` (extended right) — quien puede enrollar.
- `Certificate-AutoEnrollment` — auto-enroll.
- `WriteProperty` / `WriteDacl` — modify template (ESC4).
- `WriteOwner` — take ownership → grant self.

```powershell
# Hunt templates con Authenticated Users / Domain Users en Enrollment ACE
$Templates = Get-CertificateTemplate
foreach ($t in $Templates) {
  $acl = Get-CertificateTemplateAcl -Name $t.Name -EA SilentlyContinue
  $acl.Access | Where {
    $_.IdentityReference -match "Authenticated Users|Domain Users|Everyone" -and
    $_.ActiveDirectoryRights -match "ExtendedRight"
  } | Select @{n='Template';e={$t.Name}},IdentityReference,ActiveDirectoryRights
}
```

___

## Per-Template Vulnerability

| **ESC#** | **Indicador en template** | **Detección rápida** |
|:---:|:---:|:---:|
| ESC1 | `ENROLLEE_SUPPLIES_SUBJECT` (0x1) + auth EKU + Authenticated Users enroll | `certipy find -vulnerable \| grep ESC1`. |
| ESC2 | EKU `Any Purpose` (2.5.29.37.0) + low ACL | `grep ESC2`. |
| ESC3 | EKU `Certificate Request Agent` (1.3.6.1.4.1.311.20.2.1) | `grep ESC3`. |
| ESC4 | DACL escribible por user no-admin | `grep ESC4`. |
| ESC9 | `NO_SECURITY_EXTENSION` flag (0x80000) en EnrollmentFlags | `grep ESC9`. |
| ESC10 | Cert mapping weak en DC registry | KDC config. |
^ad-tmpl-vulns

___

## Default vs Custom Templates

| **Categoría** | **Templates** | **Riesgo** |
|:---:|:---:|:---:|
| **Default safe** | `Workstation`, `Web Server`, `Computer` | Standard, low priv. |
| **Default risky (legacy)** | `User`, `Smartcard User`, `EFS` | Audit en envs viejos. |
| **Default critical (rare default)** | `Domain Controller Authentication`, `Kerberos Authentication` | Solo DCs deberían enrollar. |
| **Custom org-specific** | Variable | Audit always. |
^ad-tmpl-default

___

## Modern Best Practices

| **Práctica** | **Implementación** | **Cuándo** |
|:---:|:---:|:---:|
| Audit `ENROLLEE_SUPPLIES_SUBJECT` quarterly | `certipy find -vulnerable` | Trimestral. |
| Set `msPKI-RA-Signature ≥ 1` en templates auth | Manager approval | Hardening. |
| Restrict `Authenticated Users` enroll → tier-specific groups | Per-template ACL | Hardening. |
| Disable templates legacy no usados | `Disable-CertificateTemplate` (PSPKI) | Cleanup. |
| Patch baseline KB5014754 (Certifried) | StrongCertificateBindingEnforcement | Modern. |
| `EnrollmentFlag NO_SECURITY_EXTENSION` = OFF | Per-template | ESC9 fix. |
^ad-tmpl-bestpractice

***
