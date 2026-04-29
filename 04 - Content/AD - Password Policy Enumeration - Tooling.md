---
aliases:
  - Password Policy Tooling
  - polenum
  - samba-tool passwordsettings
  - PingCastle Policy
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
  - "[[netexec]]"
---
# AD - Password Policy Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| SMB password policy | `nxc smb DC -u u -p p --pass-pol` | Standard. |
| LDAP password policy | `nxc ldap DC -u u -p p --pass-pol` | Same data. |
| Anonymous attempt | `nxc smb DC -u '' -p '' --pass-pol` | Null. |
| Bulk subnet | `nxc smb 10.0.0.0/24 -u u -p p --pass-pol` | Sweep. |
| crackmapexec older name | Same flags | Compat. |
| Output: comprehensive policy | Decoded | Standard. |
| Authenticated reliable | Standard | Reliable. |
| Forest-wide via different DCs | Per-domain | Adjacent. |
| Combine with --users | Pre-spray prep | Workflow. |
| Combine with --groups | Adjacent | Adjacent. |
| Output to file | Standard | Reportable. |
| Verbose `-v` | Debug | Standard. |
| `--continue-on-success` | Multi-host | Standard. |
| BloodHound integration | Adjacent | Adjacent. |
| Per-DC variation | Same domain → same | Standard. |
| Multi-DC same domain | Standard | Standard. |
^ad-pwdpol-tool-netexec

### netexec recipes

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Standard authenticated
nxc smb $DC -u $USER -p $PASS --pass-pol

# Anonymous quick check
nxc smb $DC -u '' -p '' --pass-pol

# LDAP variant
nxc ldap $DC -u $USER -p $PASS --pass-pol

# Bulk sweep (test all DCs)
nxc smb dcs.txt -u $USER -p $PASS --pass-pol

# Combined recon (policy + users + groups)
nxc smb $DC -u $USER -p $PASS --pass-pol --users --groups
```

___

## RSAT / PowerShell

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADDefaultDomainPasswordPolicy` | Default policy | Standard. |
| `Get-ADDefaultDomainPasswordPolicy -Identity dom` | Specific domain | Standard. |
| `Get-ADFineGrainedPasswordPolicy -Filter *` | All PSOs | Standard. |
| `Get-ADFineGrainedPasswordPolicy -Identity X -Properties *` | PSO detail | Standard. |
| `Get-ADFineGrainedPasswordPolicySubject -Identity PSO` | PSO subjects | Standard. |
| `Get-ADUserResultantPasswordPolicy -Identity user` | Per-user effective | Standard. |
| `Get-ADDomain` | Domain info | Adjacent. |
| `Get-ADRootDSE` | Forest info | Adjacent. |
| `New-ADFineGrainedPasswordPolicy` | Create PSO | Privileged. |
| `Set-ADFineGrainedPasswordPolicy` | Modify PSO | Privileged. |
| `Add-ADFineGrainedPasswordPolicySubject` | Add subject | Privileged. |
| `Remove-ADFineGrainedPasswordPolicySubject` | Remove subject | Privileged. |
| `Remove-ADFineGrainedPasswordPolicy` | Delete PSO | Privileged. |
| `Get-DomainPolicy` (PowerView) | Adversary | Same. |
| `Get-DomainPolicyData` (PowerView v3) | Adjacent | Adjacent. |
| `net accounts /domain` | Native quick | Adjacent. |
^ad-pwdpol-tool-rsat

### RSAT comprehensive

```powershell
# Default policy
Get-ADDefaultDomainPasswordPolicy | Select MinPasswordLength,ComplexityEnabled,
  LockoutThreshold,LockoutDuration,LockoutObservationWindow,
  PasswordHistoryCount,MaxPasswordAge,ReversibleEncryptionEnabled

# All PSOs comprehensive
Get-ADFineGrainedPasswordPolicy -Filter * -Properties * |
  Select Name,Precedence,@{n='AppliesTo';e={$_.AppliesTo -join '; '}},
    MinPasswordLength,ComplexityEnabled,LockoutThreshold,LockoutDuration,
    PasswordHistoryCount,MaxPasswordAge,ReversibleEncryptionEnabled

# Per-user effective policy (privileged users)
Get-ADUser -Filter {AdminCount -eq 1} | ForEach-Object {
  $pol = Get-ADUserResultantPasswordPolicy -Identity $_ -ErrorAction SilentlyContinue
  [PSCustomObject]@{
    User = $_.SamAccountName
    PSO = if ($pol) { $pol.Name } else { "DEFAULT" }
    MinLength = if ($pol) { $pol.MinPasswordLength } else { "DEFAULT" }
    Complexity = if ($pol) { $pol.ComplexityEnabled } else { "DEFAULT" }
  }
}
```

___

## rpcclient / Native Linux

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `rpcclient -U "" DC -N -c 'getdompwinfo'` | Anonymous policy | Standard. |
| `rpcclient -U user%pass DC -c 'getdompwinfo'` | Authenticated | Standard. |
| `rpcclient -U "" DC -N -c 'querydominfo'` | Domain info | Adjacent. |
| `rpcclient -U "" DC -N -c 'lsaquery'` | Domain SID | Adjacent. |
| `samba-tool domain passwordsettings show` | Linux Samba DC | Edge. |
| `samba-tool domain passwordsettings set` | Privileged set | Privileged. |
| Multi-command interactive | rpcclient prompt | Standard. |
| `polenum` (Python) | Wrapper around rpcclient | Adjacent. |
| `polenum.py 'dom/u:p'@DC` | Authenticated wrap | Standard. |
| `polenum.py 'dom/'@DC` | Anonymous | Standard. |
| Modern alternative: `nxc smb DC --pass-pol` | Better | Standard. |
| Output bitfield decode | pwdProperties | Standard. |
| Anonymous fallback path | Edge | Standard. |
| Authenticated reliable | Standard | Standard. |
| Cross-correlate with multiple tools | Standard | Adjacent. |
| Detection: bulk RPC events | Defender | Adjacent. |
^ad-pwdpol-tool-rpc

### rpcclient + polenum

```bash
# rpcclient anonymous + interactive
rpcclient -U "" DC -N
> getdompwinfo
> querydominfo
> lsaquery
> exit

# Single-line
rpcclient -U "" DC -N -c 'getdompwinfo; querydominfo'

# polenum (older but still useful)
polenum.py 'dom.local/'@DC  # anonymous
polenum.py 'dom.local/user:pass'@DC  # authenticated
```

___

## enum4linux / enum4linux-ng

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `enum4linux -P DC` | Legacy policy enum | Old. |
| `enum4linux-ng -P DC` | Modern | Better. |
| `enum4linux-ng -P -A DC` | Comprehensive | Standard. |
| `enum4linux-ng -P -u user -p pass DC` | Authenticated | Standard. |
| `enum4linux-ng -P -oJ pol.json` | JSON output | Parseable. |
| `enum4linux-ng -P -oY pol.yaml` | YAML | Edge. |
| `enum4linux-ng -P -d` | Debug | Adjacent. |
| Anonymous + authenticated | Both supported | Flexible. |
| Output: comprehensive | Decoded | Standard. |
| Cross-correlate with other tools | Standard | Standard. |
| Verbose `-v` | Standard | Standard. |
| Bulk via shell loop | Standard | Adjacent. |
| Detection: bulk SMB/RPC | Defender | Adjacent. |
| Legacy enum4linux scripts | Old | Adjacent. |
| Modern resilience | Hardened systems | Standard. |
| Combined sections | -A all categories | Comprehensive. |
^ad-pwdpol-tool-enum4linux

### enum4linux-ng usage

```bash
# Anonymous policy only
enum4linux-ng -P DC -oJ pol_anon.json

# Authenticated + comprehensive
enum4linux-ng -P -A -u user -p pass DC -oJ enum_auth.json

# Parse JSON output
cat pol_anon.json | jq '.policy'
```

___

## PingCastle / Purple Knight / ADRecon

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| PingCastle healthcheck | `PingCastle.exe --healthcheck --server DC` | Defender comprehensive. |
| PingCastle ADConf | `--adconf --server DC` | Adjacent. |
| Purple Knight | GUI tool, run on DC | Standard. |
| ADRecon | `.\ADRecon.ps1 -Method LDAP -DomainController DC` | XLSX output. |
| ADRecon section: Password Policy | XLSX sheet | Standard. |
| ADCollector (.NET) | `.\ADCollector.exe` | Faster. |
| `pingcastle --healthcheck-secret-store` | Adjacent | Edge. |
| Microsoft Defender for Identity | Cloud | Modern. |
| Azure AD Connect Health | Sync-related | Edge. |
| BloodHound `--collect-password-policies` | Adjacent | Tool. |
| ldapdomaindump `ldd` | HTML reports | Standard. |
| `adscan` (community) | Adjacent | Edge. |
| Custom Python LDAP audit | DIY | Flexible. |
| Audit baseline scripts | Standard | Compliance. |
| Periodic re-audit | Standard | Defender ops. |
| Remediation tracking | Standard | Adjacent. |
^ad-pwdpol-tool-pingcastle

### PingCastle output sections

```cmd
:: PingCastle comprehensive
PingCastle.exe --healthcheck --server DC --no-enum-limit

:: Output: ad_hc_<domain>.xml + ad_hc_<domain>.html
:: Sections include:
:: - Domain Password Policy
:: - Fine-Grained Password Policies
:: - krbtgt password age
:: - Reversible Encryption usage
:: - PASSWD_NOTREQD users
:: - DONT_EXPIRE_PASSWORD privileged users
:: - Honeytoken accounts
```

___

## Custom Audit Scripts

| **Script** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Custom Python LDAP audit | Flexible | DIY. |
| PowerShell forest-wide audit | RSAT-based | Standard. |
| Bash + ldapsearch | Linux DIY | Standard. |
| BloodHound custom Cypher | Modern | Tool. |
| GitHub `awesome-active-directory` | Curated | Foundation. |
| Microsoft `Compare-PasswordPolicy.ps1` | Reference | Standard. |
| Will Schroeder PowerView scripts | Adversary | Standard. |
| Sean Metcalf scripts | Defender | Reference. |
| `Test-PSO.ps1` (community) | Per-user PSO check | Adjacent. |
| Compliance audit scripts (per standard) | Standard | Compliance. |
| Honeypot account scripts | Defender plant | Detection. |
| krbtgt rotation script (Microsoft) | `Reset-KrbtgtKeyInteractive.ps1` | Standard. |
| Periodic re-audit cron job | Operational | Standard. |
| Per-OU policy audit | Granular | Standard. |
| Cross-domain forest audit | Standard | Adjacent. |
| BloodHound CE custom queries | Modern | Tool. |
^ad-pwdpol-tool-custom

### Forest-wide audit (custom RSAT)

```powershell
$forest = Get-ADForest

$report = @()
foreach ($d in $forest.Domains) {
  Write-Host "Auditing $d ..." -ForegroundColor Cyan
  
  # Default policy
  $pol = Get-ADDefaultDomainPasswordPolicy -Identity $d
  
  # krbtgt age
  $krbtgt = Get-ADUser krbtgt -Server $d -Properties pwdLastSet
  $krbtgtAge = ((Get-Date) - [datetime]::FromFileTime($krbtgt.pwdLastSet)).Days
  
  # PSO count
  $psoCount = (Get-ADFineGrainedPasswordPolicy -Filter * -Server $d).Count
  
  $report += [PSCustomObject]@{
    Domain = $d
    MinLength = $pol.MinPasswordLength
    Complexity = $pol.ComplexityEnabled
    LockoutThreshold = $pol.LockoutThreshold
    LockoutDurationMin = $pol.LockoutDuration.TotalMinutes
    MaxAgeDays = $pol.MaxPasswordAge.Days
    HistoryCount = $pol.PasswordHistoryCount
    Reversible = $pol.ReversibleEncryptionEnabled
    KrbtgtAgeDays = $krbtgtAge
    KrbtgtRisk = if ($krbtgtAge -gt 180) {"STALE"} else {"OK"}
    PSOCount = $psoCount
  }
}

$report | Format-Table -AutoSize
$report | Export-Csv password_policy_audit.csv -NoTypeInformation
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks Password Policy | `book.hacktricks.xyz/windows-hardening/active-directory-methodology` | Reference. |
| The Hacker Recipes | `thehacker.recipes/ad/recon/passwd-policy` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| Microsoft Password Policy Docs | `learn.microsoft.com` | Vendor. |
| NIST SP 800-63B | Authentication Guideline | Compliance. |
| PCI-DSS v4 Requirements | Per-standard | Compliance. |
| HIPAA Security Rule | Per-standard | Compliance. |
| Will Schroeder PowerView | GitHub | Adversary tool. |
| Sean Metcalf - Best Practices | adsecurity.org | Reference. |
| BloodHound docs | `bloodhound.specterops.io` | Tool. |
| PingCastle docs | `www.pingcastle.com` | Defender. |
| Purple Knight docs | Semperis | Defender. |
| `Reset-KrbtgtKeyInteractive.ps1` | Microsoft TechNet | krbtgt rotation. |
| MITRE ATT&CK T1201 | Password Policy Discovery | Framework. |
| OWASP Cheat Sheet on AD | Adjacent | Standard. |
| Microsoft Tier Model | Hardening reference | Standard. |
^ad-pwdpol-tool-resources

***
