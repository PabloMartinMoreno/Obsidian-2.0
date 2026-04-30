---
aliases:
  - CA ACL Audit
  - Manage CA
  - Manage Certificates
  - EDITF Flags
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
# AD - ADCS Enumeration - CA ACL Audit

***

## CA Object DACL

| **Right** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| Manage CA | ESC7 abuse | Critical. |
| Manage Certificates | ESC7 abuse | Critical. |
| Read | View CA | Standard. |
| Enroll | Request cert from CA | Standard. |
| AutoEnroll | Auto-request | Adjacent. |
| Manage CA: approve/deny pending | Atacante: approve manually | Critical. |
| Manage Certificates: revoke/recover | Adjacent | Critical. |
| Default holders: Domain Admins, Enterprise Admins | Standard | Standard. |
| Custom: PKI admins | Per-org | Audit. |
| Per-CA granular | Standard | Standard. |
| BloodHound `ManageCA`, `ManageCertificates` edges | Modern | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: CA ACL modify | Defender | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| Per-quarter CA ACL review | Standard | Compliance. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
^ad-caacl-rights

### CA ACL discovery

```bash
# Per-CA DACL via LDAP
CA_DN="CN=CA-Name,CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local"

ldapsearch -h DC -D 'dom\u' -w pass \
  -b "$CA_DN" -s base nTSecurityDescriptor

# certipy includes CA ACL in find
certipy find -u user -p pass -dc-ip DC -text -stdout
```

```powershell
# RSAT
$caDN = (Get-ADObject -SearchBase "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" -Filter * | Select-Object -First 1).DistinguishedName

Get-Acl "AD:$caDN" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|SYSTEM|BUILTIN"
  } |
  Select IdentityReference,ActiveDirectoryRights
```

___

## ESC7: Manage CA / Manage Certificates

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ESC7 = Manage CA right | Atacante manages CA | Critical. |
| Approve pending requests | Atacante approves own | Standard. |
| Add Officer permission to self | Edge | Standard. |
| `certipy ca` operations | Standard | Tool. |
| `certipy ca -ca CA -add-officer attacker` | Standard | Tool. |
| `certipy ca -ca CA -enable-template VulnTemplate` | Standard | Tool. |
| Certificate request manipulation | Adjacent | Adjacent. |
| BloodHound `ManageCA` edge | Modern | Tool. |
| BloodHound `ManageCertificates` edge | Adjacent | Tool. |
| Cross-correlate with vulnerable templates | Standard | Audit. |
| Detection: CA permission changes | Defender | Adjacent. |
| Modern: minimal Manage CA holders | Hardening | Standard. |
| Per-CA documented baseline | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
| Audit: per-quarter CA ACL | Standard | Compliance. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
^ad-caacl-esc7

### ESC7 detection + abuse

```bash
# certipy CA enumeration with ACL
certipy find -u user -p pass -dc-ip DC -stdout |
  grep -A 20 "Certificate Authorities"

# Look for "Manage CA" / "Manage Certificates" non-default holders

# ESC7 abuse
certipy ca -ca CA-Name -u user -p pass -dc-ip DC \
  -add-officer attacker

certipy ca -ca CA-Name -u user -p pass -dc-ip DC \
  -enable-template VulnTemplate
```

___

## EDITF Flags Audit

| **Flag** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| EDITF_ATTRIBUTESUBJECTALTNAME2 | Allow SAN in cert request | ESC6 critical. |
| EDITF_ATTRIBUTEENDDATE | Allow end date in request | Edge. |
| EDITF_REQUESTEXTENSIONLIST | Allow extensions | Standard. |
| EDITF_DISABLEEXTENSIONLIST | Disable extension list | Edge. |
| EDITF_ADDOLDKEYUSAGE | Add old key usage | Edge. |
| EDITF_ATTRIBUTEEKU | Allow EKU in request | Edge. |
| EDITF_ENABLECHASECLIENTDNS | Chase client DNS | Edge. |
| EDITF_ENABLEUPNMAP | Enable UPN mapping | Edge. |
| EDITF_ENABLEDEFAULTSMIME | Default SMIME | Edge. |
| Per-CA registry key | `HKLM\SYSTEM\CurrentControlSet\Services\CertSvc\Configuration\<CA>\PolicyModules\<...>\EditFlags` | Standard. |
| `certutil -getreg policy\EditFlags` | Native query | Standard. |
| `certipy find` shows EDITF | Standard | Standard. |
| Cross-correlate with templates | Standard | Audit. |
| Detection: EDITF modification | Defender | Adjacent. |
| Modern: EDITF_ATTRIBUTESUBJECTALTNAME2 disabled | Hardening | Standard. |
| Audit: per-CA EDITF check | Standard | Compliance. |
^ad-caacl-editf

### EDITF audit

```cmd
:: certutil per-CA
certutil -config "CA-IP\CA-Name" -getreg policy\EditFlags

:: Output flags decoded:
:: EDITF_ENABLEREQUESTEXTENSIONS -- 2
:: EDITF_REQUESTEXTENSIONLIST -- 4
:: EDITF_ATTRIBUTESUBJECTALTNAME2 -- 0x40000  <- ESC6 if set
```

```bash
# certipy includes EDITF check
certipy find -u user -p pass -dc-ip DC -stdout | grep -A 5 "EDITF"
```

___

## Web Enrollment ACL

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `https://CA/certsrv/` IIS auth | NTLM default | Critical. |
| ESC8: NTLM Relay to certsrv | Standard chain | Critical. |
| HTTPS without Channel Binding | Vulnerable | Critical. |
| HTTPS with EPA | Mitigated | Hardening. |
| Per-CA Web Enrollment optional | Sometimes disabled | Audit. |
| `nmap -p 80,443 --script http-* CA` | Discovery | Standard. |
| `curl -I https://CA/certsrv/` | Probe | Standard. |
| Default IIS settings | Audit | Standard. |
| BloodHound `EnrollOnTemplate` adjacent | Modern | Tool. |
| Cross-correlate with vulnerable templates | Standard | Audit. |
| Detection: bulk certsrv requests | Defender | Adjacent. |
| Modern: HTTPS + EPA mandatory | Hardening | Standard. |
| Cleanup: disable Web Enrollment if not needed | Hardening | Adjacent. |
| Per-CA Web Enrollment audit | Standard | Compliance. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
^ad-caacl-webenroll

### Web Enrollment audit

```bash
# Per-CA endpoint check
CAS=$(certipy find -u user -p pass -dc-ip DC -json | jq -r '.[].CAs[].CA')
for ca in $CAS; do
  echo "=== $ca ==="
  curl -sI "http://$ca/certsrv/" 2>&1 | head -5
  curl -sI "https://$ca/certsrv/" 2>&1 | head -5
done

# IIS auth method check (manual on CA host)
# Get-WebApplication -Site "Default Web Site" -Name "CertSrv"
# (Get-WebConfiguration -Filter "system.webServer/security/authentication/windowsAuthentication" -PSPath "IIS:\Sites\Default Web Site\CertSrv").enabled
```

___

## CA Modification Rights

| **Right** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| WriteProperty on CA object | ESC5 path | Standard. |
| GenericAll on CA | Full control | Critical. |
| GenericWrite on CA | Modify attrs | Critical. |
| WriteDACL on CA | Self-grant | Critical. |
| WriteOwner on CA | 2-step | Adjacent. |
| Per-CA DACL audit | Standard | Standard. |
| Cross-correlate with NTAuth modify | Adjacent | Audit. |
| Modify CA = forge cert templates | Critical | Critical. |
| Atacante modifies CA config | Standard chain | Standard. |
| BloodHound `Owns`, `WriteOwner`, `WriteDacl`, `GenericAll`, `GenericWrite` on CA | Modern | Tool. |
| Detection: CA object modify | Defender | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| Per-CA DACL documented | Standard | Compliance. |
| Audit: per-quarter | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-caacl-modify

### CA object DACL audit

```powershell
$caDN = "CN=CA-Name,CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)"

Get-Acl "AD:$caDN" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|WriteProperty") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  } |
  Select IdentityReference,ActiveDirectoryRights
```

___

## NTAuthCertificates Modify

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| NTAuthCertificates container | Trusted CAs for auth | Standard. |
| Modify cACertificate attribute | Add own CA cert | Critical. |
| ESC11 path | Modify NTAuth | Critical. |
| Default holders: Enterprise Admins, Domain Admins | Standard | Standard. |
| WriteProperty cACertificate | Direct modify | Critical. |
| GenericAll on NTAuthCertificates | Full | Critical. |
| BloodHound NTAuth modify edges | Modern | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: NTAuth modify events | Defender critical alert | Defender. |
| Modern: extreme alerting | Critical | Standard. |
| Modern: minimal modify rights | Hardening | Standard. |
| Per-quarter NTAuth review | Standard | Compliance. |
| Adjacent: ADCS ESC11 | Cross-ref | Adjacent. |
| Cleanup: revert NTAuth changes | Critical | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-caacl-ntauth

### NTAuth audit

```powershell
$ntauthDN = "CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)"

# DACL
Get-Acl "AD:$ntauthDN" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  } |
  Select IdentityReference,ActiveDirectoryRights

# Trusted certs in NTAuth
Get-ADObject $ntauthDN -Properties cACertificate |
  Select -ExpandProperty cACertificate |
  ForEach-Object {
    [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($_)
  } | Select Subject,Issuer,Thumbprint,NotAfter
```

___

## Per-CA Configuration Audit

| **Setting** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| EDITF_ATTRIBUTESUBJECTALTNAME2 | ESC6 critical | Standard. |
| Web Enrollment enabled | ESC8 vector | Audit. |
| HTTPS Channel Binding | EPA | Hardening. |
| Authentication methods | NTLM, Kerberos, Certificate | Audit. |
| IF_FLAG_NO_PROTECTION_POLICY | LDAP relay (ESC11) | Modern. |
| Per-CA template list | Different per-CA | Standard. |
| CA logging level | Adjacent | Adjacent. |
| Audit policy on CA | Adjacent | Adjacent. |
| `certutil -getreg` | Native query | Standard. |
| `certutil -CAInfo` | CA detail | Standard. |
| BloodHound CA properties | Modern | Tool. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: CA config modify | Defender | Adjacent. |
| Modern: documented baseline | Standard | Compliance. |
| Per-CA hardening checklist | Standard | Adjacent. |
| Audit: per-quarter CA review | Standard | Compliance. |
^ad-caacl-config

### Per-CA config check

```cmd
:: All CA settings
certutil -config "CA-IP\CA-Name" -getreg

:: Specific: EditFlags
certutil -config "CA-IP\CA-Name" -getreg policy\EditFlags

:: CA info
certutil -config "CA-IP\CA-Name" -CAInfo
```

___

## Cross-Correlate with Authenticated Users / Domain Users

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users with Manage CA | CRITICAL | Critical. |
| Domain Users with Manage Certificates | CRITICAL | Critical. |
| Authenticated Users with WriteProperty cACertificate | CRITICAL | Critical. |
| Authenticated Users with Enroll on vulnerable template | Standard ESC1 path | Critical. |
| Domain Users with template modify | ESC4 | Critical. |
| Helpdesk on Manage CA | Cross-tier | Audit. |
| Service account on Manage CA | Common | Audit. |
| Stale ACE | Old delegation | Audit. |
| Cross-trust principal | Cross-forest | Critical. |
| Detection: bulk CA ACL changes | Defender | Adjacent. |
| Modern: minimal | Best practice | Standard. |
| BloodHound CA paths | Modern | Tool. |
| Cypher: priv CA paths | Custom | Tool. |
| Cleanup: revert CA ACL | Standard | OPSEC. |
| Audit: per-quarter | Standard | Compliance. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-caacl-authusers

### Authenticated Users audit

```powershell
# CA objects with Authenticated Users / Domain Users non-trivial rights
$caObjects = Get-ADObject -SearchBase "CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" `
  -Filter * -SearchScope Subtree

foreach ($obj in $caObjects) {
  $acl = Get-Acl "AD:$($obj.DistinguishedName)" -ErrorAction SilentlyContinue
  $authUsers = $acl.Access | Where {
    $_.IdentityReference -match "Authenticated Users|Domain Users" -and
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner|WriteProperty"
  }
  
  if ($authUsers) {
    [PSCustomObject]@{
      Object = $obj.Name
      Principals = $authUsers.IdentityReference -join '; '
      Rights = $authUsers.ActiveDirectoryRights -join '; '
    }
  }
}
```

___

## BloodHound CA ACL Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `ManageCA` | ESC7 right | Modern. |
| `ManageCertificates` | ESC7 right | Modern. |
| `Enroll` on template | Standard | Modern. |
| `AutoEnroll` on template | Adjacent | Modern. |
| `Owns`, `WriteOwner`, `WriteDacl`, `GenericAll`, `GenericWrite` on CA/Template | ACL combo | Standard. |
| `EnrollOnNTAuthCertStore` | Adjacent | Modern. |
| `WritePKINameFlag`, `WritePKIEnrollmentFlag` | Granular template modify | Modern. |
| Cypher: ESC1-ESC15 paths | Custom | Tool. |
| BHCE 5.x+ ADCS support | Modern | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved ADCS | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Detection: BloodHound ADCS collection | Defender | Adjacent. |
| Compliance: ADCS baseline queries | Standard | Adjacent. |
^ad-caacl-bh

### BloodHound CA queries

```cypher
// All Manage CA holders
MATCH (u)-[:ManageCA]->(c:CA)
RETURN u.name, c.name

// Atacante can manage CA
MATCH (u {owned: true})-[:ManageCA|ManageCertificates|MemberOf*1..]->(c:CA)
RETURN u.name, c.name

// Vulnerable template paths (ESC1)
MATCH (u {owned: true})-[:Enroll|AutoEnroll|MemberOf*1..]->(t:CertTemplate)
WHERE t.enrolleesuppliessubject = true
  AND t.authenticationenabled = true
  AND t.requiresmanagerapproval = false
  AND t.authorizedsignatures = 0
RETURN u.name, t.name

// ESC4: Template modify
MATCH (u {owned: true})-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite|WritePKINameFlag|WritePKIEnrollmentFlag*1..]->(t:CertTemplate)
RETURN u.name, t.name
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Minimal Manage CA / Manage Certificates holders | Best practice | Hardening. |
| Disable EDITF_ATTRIBUTESUBJECTALTNAME2 | ESC6 fix | Standard. |
| Disable Web Enrollment if not needed | ESC8 fix | Standard. |
| HTTPS + Channel Binding (EPA) | Modern hardening | Standard. |
| Strict template ACL | Per-template | Hardening. |
| NTAuthCertificates restrict modify | Tier 0 | Critical. |
| Patch CVE-2022-26923 | Adjacent | Adjacent. |
| Detection: ADCS modify events | Defender | Adjacent. |
| Microsoft Defender for Identity ADCS alerts | Modern | Defender. |
| BloodHound continuous ADCS audit | Modern | Tool. |
| PingCastle / Purple Knight ADCS | Defender | Standard. |
| Per-quarter ADCS audit | Standard | Compliance. |
| AES-only Kerberos for cert auth | Hardening | Standard. |
| Modern: documented per-CA | Standard | Compliance. |
| Audit log retention | Standard | Adjacent. |
| Cleanup: stale CA ACE | Hygiene | Standard. |
^ad-caacl-mitigations

### Hardening commands

```cmd
:: Disable EDITF_ATTRIBUTESUBJECTALTNAME2 (ESC6 fix)
certutil -config "CA-IP\CA-Name" -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2

:: Verify
certutil -config "CA-IP\CA-Name" -getreg policy\EditFlags
```

```powershell
# Audit + cleanup non-default Manage CA
# Manual review required: legitimate PKI admins vs attacker plant

# Disable Web Enrollment if not needed (manual via Server Manager → Roles)
# Or via PowerShell:
# Uninstall-WindowsFeature ADCS-Web-Enrollment
```

***
