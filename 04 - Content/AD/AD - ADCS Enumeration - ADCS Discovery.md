---
aliases:
  - ADCS Discovery
  - Enterprise CA Discovery
  - NTAuth Store
  - Certificate Templates
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ADCS Enumeration]]"
---
# AD - ADCS Enumeration - ADCS Discovery

***

## Architecture Overview

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| Storage location | `CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local` | Forest-wide. |
| CAs | `CN=Enrollment Services,CN=Public Key Services,...` | Enterprise CAs registrados aquí. |
| Templates | `CN=Certificate Templates,CN=Public Key Services,...` | Forest-wide templates. |
| NTAuth Store | `CN=NTAuthCertificates,CN=Public Key Services,...` | CAs trusted para Kerberos auth. |
| AIA / CDP | Per-CA URLs (revocation + cert chain) | Adjacent. |
| Certifried (CVE-2022-26923) | KDC validation patch | Modern requirement. |
^ad-adcs-architecture

___

## Enterprise CA Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certipy find -u u@corp.local -p pass -dc-ip <DC>` | CAs + templates auto-discover | Linux standard. |
| `certipy find -u u@corp.local -p pass -dc-ip <DC> -vulnerable -stdout` | Solo templates vulnerables | Quick attack hunt. |
| `Certify.exe find` (Windows) | CAs + templates | Standard Windows. |
| `Certify.exe find /vulnerable` | Solo vulnerables | Quick. |
| `Get-CertificationAuthority` (PSPKI) | CAs Enterprise | RSAT alt. |
| `certutil -config - -ping` | CA ping | Native check. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" "(objectClass=pKIEnrollmentService)" cn dnsHostName certificateTemplates` | LDAP raw | Linux. |
^ad-adcs-cadiscovery

```bash
# Standard Linux ADCS recon
certipy find -u auditor@corp.local -p 'Pass!' -dc-ip <DC> -text -stdout

# Output: CAs, templates, ACLs, vulnerabilities
```

___

## Certificate Templates Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certipy find -u u -p pass -dc-ip <DC> -output corp.local` | All templates a JSON + text | Audit completo. |
| `Get-CertificateTemplate` (PSPKI) | Templates desde DS | Standard. |
| `certutil -dsTemplate` | Templates raw native | Sin RSAT. |
| `Get-ADObject -SearchBase "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" -Filter *` | LDAP-style RSAT | Generic. |
| `ldapsearch ... -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" "(objectClass=pKICertificateTemplate)" cn pkiExtendedKeyUsage msPKI-Certificate-Name-Flag` | LDAP raw | Linux. |
^ad-adcs-templates

___

## NTAuth Store

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certutil -viewstore -enterprise NTAuth` | Lista certs en NTAuth Store | Native. |
| `certutil -viewstore -enterprise -store NTAuth` | Igual, alternativa | Standard. |
| `Get-ADObject "CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" -Pr cACertificate` | LDAP raw | RSAT. |
| `ldapsearch ... -b "CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" -s base "(objectClass=*)" cACertificate` | LDAP raw Linux | Linux. |
^ad-adcs-ntauth

**Por qué crítico:** NTAuth Store contiene certs de CAs **trusted para Kerberos auth (PKINIT)**. Cert emitido por CA en NTAuth + EKU Client Auth → autenticación válida como cualquier user (con SAN = victim UPN). Cualquier CA agregada al NTAuth Store = forest auth bypass.

___

## Web Enrollment / NDES Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <CA-host> -u u -p p` (con HTTP probing) | Banner host CA | Pre-relay check. |
| `curl -k https://<CA-host>/certsrv/` | Web Enrollment endpoint default | ESC8 prep. |
| `curl -k https://<CA-host>/certsrv/certfnsh.asp` | Cert request endpoint | ESC8. |
| `curl -k https://<CA-host>/certsrv/mscep/mscep.dll` | NDES (SCEP) endpoint | Adjacent. |
| `nmap -p443,80 --script http-title <CA-host>` | HTTP probing | Discovery. |
^ad-adcs-webenroll

```bash
# Probe Web Enrollment (ESC8 surface)
for url in "/certsrv/" "/certsrv/certfnsh.asp" "/certsrv/mscep/mscep.dll" "/certsrv/certrqxt.asp"; do
  echo "=== $url ==="
  curl -ksI "https://<CA-host>$url" | head -3
done
```

___

## Anonymous ADCS Discovery (Limited)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -b "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" "(objectClass=pKIEnrollmentService)"` | Anonymous attempt | Test. |
| `certutil -config - -ping` | Pre-auth CA ping | Si CA reachable. |
^ad-adcs-anonymous

**Realidad:** Configuration NC anónimo casi siempre bloqueado. Auth obligatoria para enum templates/CAs.

___

## Cross-Domain / Forest-Wide ADCS

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certipy find -u u@corp.local -p pass -dc-ip <DC>` (forest scope automático) | Templates forest-wide (Public Key Services es Configuration NC) | Standard. |
| `(Get-ADForest).Domains \| % { ... }` con scope Configuration NC | RSAT cross-domain | Multi-domain. |
^ad-adcs-multidomain

**Key fact:** ADCS storage es en **Configuration NC** (forest-wide), no en domain-specific containers. Una sola query desde cualquier domain del forest captura todos los templates.

___

## Modern Best Practices

| **Práctica** | **Implementación** | **Cuándo** |
|:---:|:---:|:---:|
| Disable EDITF_ATTRIBUTESUBJECTALTNAME2 (ESC6 fix) | `certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2 && net stop certsvc && net start certsvc` | Critical fix. |
| Apply Certifried patch (CVE-2022-26923) | KB5014754 + StrongCertificateBindingEnforcement | Modern auth. |
| Disable Web Enrollment HTTP (force HTTPS + EPA) | IIS config | ESC8 hardening. |
| Restrict Authenticated Users del default Enroll en templates risky | Per-template ACL | Audit. |
| Quarterly `certipy find -vulnerable` audit | Compliance | Standard. |
^ad-adcs-bestpractice

***
