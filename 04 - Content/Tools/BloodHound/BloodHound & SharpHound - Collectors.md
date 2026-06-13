---
aliases:
  - "BloodHound - SharpHound.exe"
  - SharpHound
  - RustHound
  - BloodHound.py
  - AzureHound
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: SubCheatSheet
linked:
  - "[[BloodHound & SharpHound]]"
---
# BloodHound & SharpHound - Collectors

---

## SharpHound (Default Windows)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c All` | Comprehensive collection | Standard. |
| `SharpHound.exe -c Default` | Default (sessions, ACLs, group, trusts) | Quick. |
| `SharpHound.exe -c DCOnly` | Solo DC-side data (no per-host queries) | Stealth máximo. |
| `SharpHound.exe -c All --Stealth` | Reduce noise (LDAP only para algunas operaciones) | OPSEC. |
| `SharpHound.exe -c All --OutputDirectory C:\loot --ZipFileName collection.zip` | Output custom path | Standard. |
| `SharpHound.exe -c All --Domain corp.local --LdapUsername u --LdapPassword pass` | Auth explícita | Cross-domain. |
| `SharpHound.exe -c All --DomainController dc01.corp.local` | DC específico | Targeted. |
| `SharpHound.exe -c All -Loop --LoopDuration 24:00:00 --LoopInterval 00:30:00` | Loop mode (sessions over time) | Long-term. |
^ad-bh-sharphound

```cmd
:: Pipeline standard
.\SharpHound.exe -c Default --OutputDirectory C:\loot --ZipFileName corp.zip

:: Stealth
.\SharpHound.exe -c DCOnly --OutputDirectory C:\loot
```

---

## SharpHound Collection Methods

| **Method** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Default` | Group, LocalAdmin, Session, Trusts, ACL, ObjectProps, Container | Standard. |
| `All` | Default + GPOLocalGroup, LoggedOn (per-host queries) | Comprehensive. |
| `DCOnly` | LDAP-only (no SMB queries per-host) | Stealth. |
| `Group` | Group memberships only | Targeted. |
| `LocalAdmin` | Local Administrators per-host | Lateral focus. |
| `Session` | Active sessions per-host | Pivot focus. |
| `LoggedOn` | Real-time logged-on users (priv) | Tier discovery. |
| `Trusts` | Domain trusts | Cross-domain. |
| `ACL` | DACL forest-wide | Privesc planning. |
| `ObjectProps` | Object metadata | Detail. |
| `Container` | Container hierarchy | Standard. |
| `GPOLocalGroup` | GPO local group settings | GPO abuse. |
| `SPNTargets` | Kerberoastable SPNs | Pre-attack. |
| `CertServices` | ADCS templates + CAs (BHCE 5.x+) | ADCS audit. |
^ad-bh-methods

---

## RustHound (Cross-Platform)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `rusthound -d corp.local -u u@corp.local -p pass --zip` | Standard collection | Cross-platform fast. |
| `rusthound -d corp.local -u u@corp.local -p pass --zip -o ./loot/` | Output custom | Standard. |
| `rusthound -d corp.local -u u@corp.local -p pass --ldapfqdn dc01.corp.local --zip` | DC explícito | Targeted. |
| `rusthound -d corp.local -u u@corp.local -p pass --ldaps --zip` | LDAPS encrypted | OPSEC. |
^ad-bh-rusthound

**Por qué RustHound:** Rust performance, single binary cross-platform (Win/Linux/Mac), no .NET dependency. Útil cuando SharpHound es bloqueado por AV.

---

## BloodHound.py (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c All --zip` | Standard Linux | Linux. |
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c All --zip -o ./loot/` | Output path | Standard. |
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c DCOnly --zip` | Stealth | OPSEC. |
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c All --zip --auth-method ntlm` | Force NTLM | Sin Kerberos. |
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c All --zip --kerberos` | Kerberos auth | OPSEC. |
| `bloodhound-python -d corp.local -u u -p pass -ns <DC> -c All --zip --use-ldaps` | LDAPS | Encrypted. |
^ad-bh-python

```bash
# Standard Linux pipeline
pip install bloodhound  # o `apt install bloodhound.py`
bloodhound-python -d corp.local -u auditor -p 'Pass!' -ns 10.10.10.10 -c All --zip -o ./loot/
```

---

## AzureHound (Cloud)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `azurehound list -u u@tenant.onmicrosoft.com -p pass -t <tenant-id> -o azure.json` | Entra ID dump | Cloud. |
| `azurehound list -u u@tenant.onmicrosoft.com -p pass -t <tenant-id> --refresh-token <RT> -o azure.json` | Auth con refresh token | Token-based. |
| `azurehound list -u u@tenant.onmicrosoft.com -p pass -t <tenant-id> --service-principal --client-id <id> --client-secret <secret>` | Service Principal auth | OPSEC. |
^ad-bh-azurehound

```bash
# Standard cloud collection
azurehound list -u admin@tenant.onmicrosoft.com -p 'Pass!' -t <tenant-uuid> -o azure.json

# Ingest en BHCE (drag-drop azure.json)
```

---

## Comparison

| **Collector** | **Platform** | **Speed** | **Stealth** | **Modern features** |
|:---:|:---:|:---:|:---:|:---:|
| SharpHound | Windows (.NET) | Slow-medium | Medium | Best (CertServices, modern edges). |
| RustHound | Cross-platform (binary) | Fast | Medium | Modern (active dev). |
| BloodHound.py | Linux (Python) | Medium | Medium-high | Modern (active dev). |
| AzureHound | Cross-platform | Medium | High | Cloud-only. |
^ad-bh-comparison

---

## Collection OPSEC

| **Práctica** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `-c DCOnly` | Sin per-host queries | Stealth máximo. |
| `--Stealth` (SharpHound) | LDAP-only para session enum | Reduce SMB noise. |
| `--Throttle 1000` / `--Jitter 50` (SharpHound) | Pacing | Reduce burst rate. |
| Run desde existing legitimate context | Reduce telemetry signature | OPSEC. |
| Avoid `-c LoggedOn` (requires admin per-host) | High noise + privilege | Skip si no necesario. |
| `--ExcludeDomainControllers` | Skip DC enumeration (less critical) | Targeted. |
| Time-of-day matching | Match legit recon patterns | Stealth. |
^ad-bh-opsec

---

## Cross-Domain Collection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c All -d corp.local; SharpHound.exe -c All -d partner.com` | Run per-domain sequencial | Multi-domain. |
| `bloodhound-python -d corp.local -c All --zip; bloodhound-python -d partner.com -c All --zip` | Linux multi-domain | Linux. |
| BHCE 6.x auto-correlate | Drop ZIPs en UI | Modern. |
^ad-bh-multidomain

```bash
# Multi-domain pipeline
for d in corp.local partner.com vendor.local; do
  DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.$d" | awk '{print $4}' | head -1 | sed 's/\.$//')
  bloodhound-python -d "$d" -u "auditor@$d" -p 'Pass!' -ns "$DC" -c All --zip -o "./loot/$d/"
done
```

---

## Continuous Loop Mode

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Session -Loop --LoopDuration 24:00:00 --LoopInterval 00:30:00` | Session collection loop 24h, cada 30min | Long-term enum. |
| `SharpHound.exe -c LoggedOn -Loop --LoopDuration 12:00:00 --LoopInterval 00:15:00` | Logged-on users loop | Tier-X discovery. |
^ad-bh-loop

**Por qué:** sessions cambian. Single snapshot = miss many sessions. Loop captura sessions sobre tiempo = mejor visibility de Tier 0 logins.

---
