---
aliases:
  - ADCS Discovery
  - Enterprise CA Discovery
  - NTAuth Store
  - Configuration NC PKI
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
# AD - ADCS Enumeration - ADCS Discovery

***

## ADCS Architecture Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ADCS = Active Directory Certificate Services | Microsoft PKI | Standard. |
| Enterprise CA | Domain-integrated PKI | Standard. |
| Standalone CA | Non-domain | Edge. |
| Root CA + Subordinate CA | Hierarchy | Standard. |
| Configuration NC storage | `CN=Public Key Services,CN=Services,CN=Configuration,DC=...` | Standard. |
| Certificate Templates | `CN=Certificate Templates,CN=Public Key Services,...` | Standard. |
| Enrollment Services | `CN=Enrollment Services,CN=Public Key Services,...` | CA list. |
| NTAuth Certificates | `CN=NTAuthCertificates,CN=Public Key Services,...` | Auth-trust certs. |
| AIA (Authority Information Access) | `CN=AIA,CN=Public Key Services,...` | Trust anchors. |
| CDP (CRL Distribution Points) | `CN=CDP,CN=Public Key Services,...` | Revocation. |
| OID (Object Identifier) | Adjacent | Edge. |
| Per-CA Web Enrollment | `https://CA/certsrv` | ESC8 vector. |
| Per-CA NDES (SCEP) | Network Device Enrollment | Edge. |
| ADCS forest-wide | Standard | Standard. |
| Cross-domain ADCS | Edge | Adjacent. |
| Detection: ADCS modify events | Defender | Adjacent. |
^ad-adcs-architecture

### ADCS discovery

```bash
# Enrollment Services (CAs)
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKIEnrollmentService)" \
  cn dnsHostName cACertificate

# Certificate Templates
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKICertificateTemplate)" \
  cn displayName

# NTAuth Certificates (auth-trusted)
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  -s base "(objectClass=*)" cACertificate
```

```powershell
# RSAT
Get-ADObject -SearchBase "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" -Filter * |
  Select Name,DistinguishedName
```

___

## Enterprise CA Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `certutil -config - -ping` | List CAs (interactive) | Native. |
| `certutil -CAInfo` | CA detail | Standard. |
| `certipy find -u user -p pass` | Bulk discovery | Linux. |
| `certipy find -u user -p pass -dc-ip DC -enabled` | Enabled templates only | Standard. |
| `certipy find -u user -p pass -dc-ip DC -vulnerable` | Vulnerable templates | Critical. |
| `Get-CertificationAuthority` | PSPKIAudit | Standard. |
| `Get-AdcsServiceObject` | Native | Adjacent. |
| `pkiview.msc` | GUI | Adjacent. |
| Enrollment Services container | LDAP | Direct. |
| Per-CA properties | dnsHostName, cACertificate | Standard. |
| Multiple CAs forest | Per-CA inventory | Standard. |
| Detection: bulk ADCS queries | Defender | Adjacent. |
| Modern: BloodHound ADCS | Tool | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| Audit baseline | Standard | Compliance. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
^ad-adcs-cadiscovery

### CA discovery

```bash
# certipy comprehensive
certipy find -u user@dom.local -p pass -dc-ip DC -text -stdout

# Output sections:
# Certificate Authorities (CAs)
# Certificate Templates (enabled + vulnerable)
# CA configuration
# Misconfigurations identified

# JSON output
certipy find -u user -p pass -dc-ip DC -json
```

```cmd
:: Native Windows
certutil -config - -ping
certutil -CAInfo all
```

___

## Certificate Templates Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `certipy find -u u -p p -enabled` | Enabled templates | Standard. |
| `certipy find -u u -p p -vulnerable` | Vulnerable templates (ESC1-15) | Critical. |
| LDAP `(objectClass=pKICertificateTemplate)` | Direct | Standard. |
| Per-template properties | extensive (50+ attrs) | Detailed. |
| `pkiview.msc` GUI | Native | Adjacent. |
| `Get-CertificateTemplate` (PSPKIAudit) | Standard | Standard. |
| `Get-CertificateTemplateAcl` | Per-template ACL | Standard. |
| Default templates (User, Computer, etc.) | Standard | Standard. |
| Custom templates per-org | Audit | Audit. |
| Per-template enabled per-CA | Adjacent | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| BloodHound CertTemplate nodes | Modern | Tool. |
| Detection: template modify events | Defender | Adjacent. |
| Audit: per-template review | Standard | Compliance. |
| Modern: minimal templates | Best practice | Standard. |
| OPSEC: targeted query | Stealth | OPSEC. |
^ad-adcs-templates

### Templates discovery

```bash
# certipy enabled templates
certipy find -u user -p pass -dc-ip DC -enabled -stdout

# Output per template:
# Display Name, Name, Enabled, Authorized Signatures Required,
# Schema Version, Validity Period, Renewal Period, Subject Name Format,
# Extended Key Usage (EKU), Certificate Authorities, Permissions

# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKICertificateTemplate)" \
  cn displayName flags pKIDefaultKeySpec pKIExtendedKeyUsage \
  msPKI-Certificate-Name-Flag msPKI-Enrollment-Flag
```

___

## NTAuth Store

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| NTAuthCertificates | Trusted CAs for auth | Standard. |
| `CN=NTAuthCertificates,CN=Public Key Services,...` | LDAP location | Direct. |
| Container with cACertificate attribute | Multi-valued binary | Standard. |
| Certs in NTAuth = trusted for client auth | Standard | Standard. |
| Atacante adds cert to NTAuth = own CA accepted | ESC11 specific | Critical. |
| Modify rights: WriteProperty cACertificate | Privileged | Standard. |
| Default: Enterprise Admins, Domain Admins | Standard | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: NTAuthCertificates modify events | Defender critical alert | Standard. |
| Modern: extreme audit | Best practice | Standard. |
| Cleanup: remove unauthorized | Critical | OPSEC. |
| BloodHound `EnrollOnNTAuthCertStore` adjacent | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit: per-quarter review | Standard | Compliance. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-adcs-ntauth

### NTAuth audit

```powershell
# NTAuth Certificates content
Get-ADObject "CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" `
  -Properties cACertificate |
  Select -ExpandProperty cACertificate |
  ForEach-Object {
    [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($_)
  } | Select Subject,Issuer,Thumbprint,NotAfter

# DACL audit on NTAuth
Get-Acl "AD:CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" |
  Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow" |
  Select IdentityReference,ActiveDirectoryRights
```

___

## Web Enrollment / NDES Discovery

| **Endpoint** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `https://CA/certsrv/` | Web Enrollment portal | ESC8 vector. |
| `https://CA/certsrv/certfnsh.asp` | Cert finish endpoint | ESC8. |
| `https://CA/certsrv/certrqxt.asp` | Cert request | ESC8. |
| `https://CA/certsrv/mscep/` | MSCEP/NDES | Edge. |
| `https://CA/certsrv/CertEnroll/` | Enrollment files | Adjacent. |
| HTTP vs HTTPS | NTLM vs Kerberos | Critical. |
| Endpoint requires authentication | Standard | Standard. |
| ESC8: NTLM Relay to certsrv → cert | Critical chain | Critical. |
| Default IIS auth: NTLM | Vuln combo | Critical. |
| Modern: HTTPS + Channel Binding | Hardening | Standard. |
| `nmap -p 80,443 --script http-enum CA` | Discovery | Adjacent. |
| `curl -I https://CA/certsrv/` | Probe | Standard. |
| Per-CA may not have Web Enrollment | Edge | Edge. |
| Detection: bulk Web Enrollment requests | Defender | Adjacent. |
| Modern: Web Enrollment disabled if not needed | Hardening | Standard. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
^ad-adcs-webenroll

### Web enrollment discovery

```bash
# Per-CA endpoint check
CAS=$(certipy find -u user -p pass -dc-ip DC -json | jq -r '.[].CAs[].CA')
for ca in $CAS; do
  echo "=== $ca ==="
  curl -sI "http://$ca/certsrv/" 2>&1 | head -3
  curl -sI "https://$ca/certsrv/" 2>&1 | head -3
done

# nmap scan
nmap -p 80,443 --script http-enum,http-headers CA-IP
```

___

## Anonymous ADCS Discovery (Limited)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Anonymous LDAP read | Often blocked | Hardened. |
| Modern Server 2019+ | Anonymous bind disabled | Standard. |
| Configuration NC anonymous | Sometimes allowed | Edge. |
| RootDSE anonymous | Always | Standard. |
| ADCS endpoints sometimes pre-auth | Edge | Adjacent. |
| Web Enrollment `/certsrv/` requires auth | Standard | Standard. |
| Authenticated baseline preferred | Standard | Reliable. |
| OSINT: ADCS naming patterns | OSINT | Edge. |
| Public DNS for CA | Edge | Edge. |
| Cert transparency logs | Public certs | OSINT. |
| BloodHound passive | Authenticated required | Tool. |
| Detection: anonymous ADCS attempts | Defender | Adjacent. |
| Compliance: authenticated only | Standard | Audit. |
| Pre-auth ADCS recon | Limited | Edge. |
| Authenticated `certipy find` | Reliable | Standard. |
| Modern: BloodHound CE 5.x+ ADCS | Standard | Tool. |
^ad-adcs-anonymous

### Anonymous ADCS probe

```bash
# Try anonymous LDAP for ADCS containers
ldapsearch -x -h DC \
  -b "CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  -s subtree "(objectClass=pKIEnrollmentService)" \
  cn dnsHostName

# Common: "Operations error" (anonymous blocked)
# Modern: authenticated required

# Authenticated baseline
certipy find -u user@dom.local -p pass -dc-ip DC -text
```

___

## Cross-Domain / Forest-Wide ADCS

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ADCS forest-wide | Configuration NC | Standard. |
| Per-domain CAs possible | Edge enterprise | Standard. |
| Cross-domain enrollment | Standard | Adjacent. |
| Cross-forest ADCS | Edge | Adjacent. |
| Forest root CA | Tier 0 forest-level | Critical. |
| Subordinate CAs per-domain | Common | Standard. |
| BloodHound forest ADCS | Modern | Tool. |
| Per-CA discovery | Per-DC iterate | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| Detection: cross-forest enrollment | Defender | Adjacent. |
| Modern: extreme audit cross-forest | Best practice | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Forest-wide template inventory | Standard | Compliance. |
| Stale cross-domain CAs | Audit | Standard. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
^ad-adcs-multidomain

### Forest-wide ADCS

```bash
# certipy forest-wide
certipy find -u user@dom.local -p pass -dc-ip DC -text -stdout

# Per-domain iterate
for dom in $(echo "domA.local domB.local"); do
  certipy find -u user@$dom -p pass -dc-ip "dc.$dom" -text -stdout
done
```

```powershell
$forest = Get-ADForest
foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ==="
  Get-ADObject -SearchBase "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" `
    -Filter * -Server $d |
    Select Name,DistinguishedName
}
```

___

## ADCS Modern Best Practices

| **Best Practice** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Minimal CAs | Per-org | Hardening. |
| Per-CA tier alignment | Tier 0 typically | Standard. |
| Strict template ACL | Per-template | Hardening. |
| Disabled Web Enrollment if not needed | Reduces ESC8 | Hardening. |
| HTTPS-only with Channel Binding | Modern hardening | Standard. |
| EDITF flags audit | Critical setting | Standard. |
| EDITF_ATTRIBUTESUBJECTALTNAME2 disabled | Critical hardening | Standard. |
| Modern: Defender for Identity ADCS alerts | Modern | Defender. |
| BloodHound ADCS continuous | Modern | Tool. |
| Per-quarter ADCS audit | Standard | Compliance. |
| Documented per-template justification | Standard | Compliance. |
| Patch CVE-2022-26923 (Certifried) | Adjacent | Adjacent. |
| Patch ADCS templates per Microsoft guidance | Standard | Adjacent. |
| Modern: extreme alerting | Defender | Standard. |
| Compliance: NIST PKI guidance | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | OPSEC. |
^ad-adcs-bestpractice

### ADCS hardening

```bash
# certipy comprehensive vulnerability scan
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout

# Output per ESC vulnerability identified:
# - ESC1: Vulnerable templates (SAN + Client Auth)
# - ESC2: Any Purpose templates
# - ESC3: Enrollment Agent templates
# - ESC4: Vulnerable template ACL
# - ESC6: EDITF_ATTRIBUTESUBJECTALTNAME2
# - ESC7: Vulnerable CA ACL (Manage CA)
# - ESC8: Web Enrollment NTLM Relay
# ... etc.
```

```powershell
# Microsoft hardening
# Disable EDITF_ATTRIBUTESUBJECTALTNAME2 on CA
certutil -config "CA-IP\CA-Name" -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2

# Enable HTTPS Channel Binding
# IIS Web Enrollment: Authentication settings
```

***
