---
aliases:
  - Anonymous getdompwinfo
  - Null Session Policy
  - Pre-Auth Policy Recon
  - enum4linux Policy
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
  - "[[AD - Password Policy Enumeration]]"
---
# AD - Password Policy Enumeration - Anonymous Policy Discovery

***

## RPC Anonymous (rpcclient)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `rpcclient -U "" DC -N -c 'getdompwinfo'` | Anonymous policy | Standard. |
| `rpcclient -U "" DC -N -c 'querydominfo'` | Domain info incl. policy | Adjacent. |
| `rpcclient -U guest%'' DC -c 'getdompwinfo'` | Guest fallback | Edge. |
| `rpcclient -U "" DC -N` (interactive) | Multi-command | Standard. |
| Modern Server 2019+ | Often blocks | Hardened. |
| Legacy Server 2008-2012 | Often allows | Audit. |
| Output: min length + properties bitfield | Direct | Standard. |
| Properties bitfield decode | Bit 0x1 = complexity | Standard. |
| Min/max age via querydominfo | Adjacent | Standard. |
| Lockout via querydominfo | Adjacent | Standard. |
| Authenticated alternative | Always works | Fallback. |
| Bulk via subnet sweep | Test all DCs | OPSEC. |
| Detection: SAMR bulk events | Defender | Adjacent. |
| `lsaquery` adjacent | Domain SID + name | Adjacent. |
| `enumdomains` adjacent | Domain list | Adjacent. |
| Enum4linux-ng wrapper | Comprehensive | Helper. |
^ad-anon-rpcclient

### rpcclient anonymous

```bash
DC="dc01.dom.local"

# Anonymous getdompwinfo
rpcclient -U "" $DC -N -c 'getdompwinfo'

# Output:
# min_password_length: 7
# password_properties: 0x00000001 DOMAIN_PASSWORD_COMPLEX

# Anonymous querydominfo (broader)
rpcclient -U "" $DC -N -c 'querydominfo'

# Output includes lockout, age, etc.

# Multi-command
rpcclient -U "" $DC -N -c 'getdompwinfo; querydominfo; lsaquery'
```

___

## netexec / crackmapexec Anonymous

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u '' -p '' --pass-pol` | Anonymous policy | Quick. |
| `nxc smb DC -u 'guest' -p '' --pass-pol` | Guest fallback | Edge. |
| `crackmapexec smb DC -u '' -p '' --pass-pol` | Older name | Same. |
| Bulk subnet | `nxc smb 10.0.0.0/24 -u '' -p '' --pass-pol` | Sweep. |
| Per-DC variation | Same domain → same policy | Standard. |
| Output identical to authenticated | Standard | Standard. |
| Hardened systems block | Modern default | Standard. |
| Test always | Quick win check | OPSEC. |
| Combined with --users null | Comprehensive null | Standard. |
| Combined with --groups null | Same | Standard. |
| Verbose `-v` | Debug | Standard. |
| Output to file | Standard | Reportable. |
| Quick spray prep | Pre-spray check | OPSEC. |
| Cross-correlate with --signing | Adjacent | Adjacent. |
| Multi-DC same domain | Standard | Standard. |
| Detection: bulk null query | Defender | Adjacent. |
^ad-anon-netexec

### netexec anonymous

```bash
# Quick null check
nxc smb DC -u '' -p '' --pass-pol

# Bulk null sweep
nxc smb 10.0.0.0/24 -u '' -p '' --pass-pol

# Combined null enumeration
nxc smb DC -u '' -p '' --pass-pol --users --groups
```

___

## enum4linux-ng

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `enum4linux-ng -P DC` | Password policy only | Targeted. |
| `enum4linux-ng -A DC` | All categories | Comprehensive. |
| `enum4linux-ng -P -A -u user -p pass DC` | Authenticated | Same. |
| `enum4linux-ng -P -oJ pol.json` | JSON output | Parseable. |
| `enum4linux-ng -P -oY pol.yaml` | YAML | Edge. |
| Modern equivalent of enum4linux | Better | Standard. |
| Anonymous + authenticated | Both supported | Flexible. |
| Output: comprehensive policy | Decoded | Standard. |
| Lockout + complexity + length | All in one | Standard. |
| Cross-correlate with users/groups | Adjacent | Standard. |
| Verbose `-v` | Debug | Standard. |
| `-d` debug | Edge | Standard. |
| Multi-DC iteration | Adjacent | Edge. |
| Bulk via shell loop | Standard | Adjacent. |
| Detection: bulk SMB/RPC events | Defender | Adjacent. |
| Modern Server resilience | Hardened | Standard. |
^ad-anon-enum4linux

### enum4linux-ng usage

```bash
# Anonymous policy only
enum4linux-ng -P DC -oJ pol_anon.json

# Comprehensive anonymous
enum4linux-ng -A DC -oJ enum_anon.json

# Authenticated (if anonymous blocked)
enum4linux-ng -A -u user -p pass DC -oJ enum_auth.json

# Parse JSON output
cat pol_anon.json | jq '.policy'

# Output sections include:
# - Domain password policy (min length, age, lockout)
# - Properties (complexity, reversible)
# - Lockout configuration
```

___

## LDAP Anonymous (Limited)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch -x -h DC -s base namingcontexts` | RootDSE | Standard. |
| `ldapsearch -x -h DC -b "DC=dom,DC=local" -s base "(objectClass=*)" maxPwdAge` | Anonymous attempt | Often blocked. |
| Modern Server 2019+ | Anonymous bind disabled | Hardened. |
| Legacy: anonymous LDAP read | Common gap | Vuln. |
| `dsHeuristics` flag controls | Default = block | Standard. |
| RootDSE always available | Standard | Always. |
| Anonymous schema query | Sometimes allowed | Edge. |
| Anonymous policy attrs query | Often blocked | Edge. |
| Tor / external LDAP scan | DC exposed externally | Critical risk. |
| Cloud-managed AD (Azure AD DS) | Different model | Edge. |
| Anonymous detection | Event 2889 | Defender. |
| RootDSE reveals naming contexts | Forest hint | Standard. |
| Anonymous fallback: try authenticated bind | Edge | Adjacent. |
| Pre-Win 2000 group | Allows anonymous SAMR/LDAP | Edge legacy. |
| `ldap-monitor.py` | Defender adjacent | Adjacent. |
| Authenticated baseline always works | Standard | Reliable. |
^ad-anon-ldap

### Anonymous LDAP probe

```bash
# RootDSE (almost always anonymous)
ldapsearch -x -h DC -s base -b "" namingContexts defaultNamingContext

# Try anonymous policy attribute query (often blocked)
ldapsearch -x -h DC -b "DC=dom,DC=local" -s base "(objectClass=*)" \
  maxPwdAge minPwdLength pwdProperties lockoutThreshold lockoutDuration

# Common errors:
# "Operations error" = anonymous bind blocked
# "Authentication required" = need creds
# Returns data = vuln (anonymous policy read)
```

___

## OPSEC Considerations

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Anonymous probes loud | Bulk = SIEM flag | Defender. |
| Single null attempt low-risk | Quick check | Standard. |
| Bulk subnet scan = detected | Bulk SMB/RPC | Defender. |
| Per-DC test (not bulk) | Stealthier | OPSEC. |
| Detection: Event 4624 (logon success) anonymous | Defender | Adjacent. |
| Detection: Event 4625 (logon fail) bulk | Defender | Adjacent. |
| Detection: SAMR/RPC/LDAP bulk | SIEM | Defender. |
| Authenticated baseline preferred | Standard ops | OPSEC. |
| Throttle if needed | Slow probe | OPSEC. |
| Single-DC test then expand | Strategy | OPSEC. |
| Cross-correlate observed responses | Different DCs same domain | Edge. |
| Time-of-day pacing | Spread enum | Stealth. |
| Honeypot accounts as bait | Defender plant | Risk. |
| Sysmon Event ID 3 (network) | Defender | Adjacent. |
| Microsoft Defender for Identity | Anomalous enum detection | Defender. |
| Audit: bulk policy queries | Defender | Adjacent. |
^ad-anon-opsec

### OPSEC-aware probes

```bash
# Single DC test (stealthy)
DC="dc01.dom.local"
rpcclient -U "" $DC -N -c 'getdompwinfo' 2>&1

# If blocked, fall back to authenticated:
nxc smb $DC -u user -p pass --pass-pol

# Avoid bulk subnet sweeps unless OPSEC permits
# Avoid combining --users + --groups + --pass-pol in single bulk call
```

___

## Cross-Correlation with Observed Spray Results

| **Concept** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Spray response variation per user | Indicates PSO presence | Indirect. |
| Bulk failures all return same | Default policy applied | Inference. |
| Per-user different lockout response | PSO inferred | Inference. |
| Honeypot account = single attempt locks | Defender plant | Detection. |
| Real user = standard behavior | Baseline | Standard. |
| Time between failures impact | Counter reset window | Inference. |
| Cross-DC observation | Replication delay | Edge. |
| Failed attempt timing | Spray pacing inference | Strategy. |
| Authenticated read confirms inference | Validate hypothesis | Standard. |
| Defender: analyze spray patterns | Detection signal | Defender. |
| Anomaly detection: per-user PSO inference | Atacante OPSEC concern | Defender. |
| BloodHound PSO awareness | Modern | Tool. |
| Pre-spray validation step | Standard ops | OPSEC. |
| Test single user 1 wrong before mass spray | Confirm threshold | Pre-spray. |
| Bulk policy query alternative | Authenticated baseline | Reliable. |
| Combined recon faster than spray-and-infer | Standard | OPSEC. |
^ad-anon-correlation

### Inference workflow

```
1. Try anonymous getdompwinfo (single DC, single attempt)
2. If blocked, authenticated nxc --pass-pol (most reliable)
3. Confirm via single test user (1 fail attempt)
4. Verify badPwdCount went up via authenticated query
5. Plan spray pacing from observed thresholds
6. If PSO suspected: test multiple users for variation
7. Identify spray window edge → schedule
```

```bash
# Combined inference + verify pipeline
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Step 1: Anonymous probe
echo "=== Anonymous policy ==="
nxc smb $DC -u '' -p '' --pass-pol 2>&1

# Step 2: Authenticated baseline
echo "=== Authenticated policy ==="
nxc smb $DC -u $USER -p $PASS --pass-pol

# Step 3: PSO discovery (authenticated)
nxc ldap $DC -u $USER -p $PASS --query "(objectClass=msDS-PasswordSettings)" "*"
```

___

## Defender Hardening Indicators

| **Indicator** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Anonymous SAMR blocked | RestrictAnonymous=2 | Standard hardening. |
| Anonymous LDAP blocked | Modern default | Standard. |
| Authenticated read tightly controlled | Edge hardening | Edge. |
| LDAP signing required | Modern default | Hardening. |
| LDAPS only (no LDAP) | Modern default | Hardening. |
| Per-PSO restricted read | Edge hardening | Edge. |
| Honeypot accounts deployed | Defender plant | Detection. |
| Defender for Identity active | Anomaly detection | Modern. |
| Sysmon DNS + Network logs | Per-host | Adjacent. |
| Bulk query alerts | SIEM | Defender. |
| Pre-Windows 2000 group empty | Hardening | Standard. |
| Network segmentation isolate DCs | Hardening | Architecture. |
| RPC interface filter | Edge hardening | Edge. |
| Privileged Access Workstations (PAWs) | Hardening | Best practice. |
| Just Enough Administration (JEA) | Hardening | Best practice. |
| Continuous monitoring + alerting | Defender ops | Standard. |
^ad-anon-defender
