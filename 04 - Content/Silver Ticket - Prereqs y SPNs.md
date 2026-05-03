---
aliases:
  - Silver Ticket Prerequisites
  - Silver Ticket SPNs
tags:
  - type/cheatsheet
  - technique/persistence
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[Silver Ticket]]"
---

# Silver Ticket - Prereqs y SPNs

***

## Requisitos mínimos

| **Requisito** | **Cómo obtener** | **Cuándo** |
|:---:|:---:|:---:|
| NT hash o AES key del service/computer account | Kerberoast crack / DCSync / LSASS / reg save | Pre-forge. |
| Domain SID (`S-1-5-21-x-y-z`) | `impacket-lookupsid` / `whoami /user` / BloodHound | Pre-forge. |
| SPN del servicio objetivo | `impacket-GetUserSPNs` / `setspn -Q */*` / BloodHound | Pre-forge. |
| FQDN del host target | DNS, `nslookup`, BloodHound | Pre-forge. |
^st-pre-req

```bash
# Domain SID
impacket-lookupsid corp.local/user:'pass'@dc01.corp.local 0
# → S-1-5-21-1234567890-987654321-111222333

# SPNs en el dominio
impacket-GetUserSPNs corp.local/user:'pass'@dc01.corp.local
```

___

## SPN por servicio

| **Servicio** | **SPN** | **Para qué** |
|:---:|:---:|:---:|
| SMB / file share | `cifs/host.corp.local` | dir \\host\c$, psexec |
| WinRM / HTTP | `http/host.corp.local` | PSRemoting, IIS |
| MSSQL | `mssqlsvc/host.corp.local:1433` | SQL login Kerberos |
| LDAP (DCSync sin DA) | `ldap/dc.corp.local` | secretsdump via silver |
| WMI | `host/host.corp.local` + `rpcss/host.corp.local` | wmiexec |
| RPC / DCOM | `host/host.corp.local` | dcomexec, COM objects |
| Scheduled Tasks | `host/host.corp.local` | at/schtasks remoto |
^st-pre-spns

```bash
# Computer account: SPNs automáticos (cifs/, host/, ldap/ para DCs)
# Service account: SPNs manuales (mssqlsvc/, http/, etc.)
impacket-GetUserSPNs corp.local/user:'pass'@dc01.corp.local -request
```

___

## Fuentes del hash

| **Hash source** | **Cuenta** | **Método** |
|:---:|:---:|:---:|
| Kerberoasting + crack | Service account con SPN | `impacket-GetUserSPNs -request` → hashcat |
| DCSync | Computer account (`HOST$`) | `impacket-secretsdump -just-dc-user 'HOST$'` |
| LSASS dump | Service account logueada | `sekurlsa::msv` / pypykatz |
| LSA secrets (reg save) | Computer account local | `impacket-secretsdump LOCAL` de SECURITY/SYSTEM |
^st-pre-sources

___

## Diferencia clave con Golden

| | **Silver** | **Golden** |
|:---:|:---:|:---:|
| Key usada | Service/computer account hash | krbtgt hash |
| Tipo de ticket | TGS (para servicio específico) | TGT (cualquier servicio) |
| Scope | 1 servicio en 1 host | Todo el dominio |
| Interacción DC | Ninguna (TGS validado local) | Sí (genera 4769 en DC) |
| Ruido | Solo 4624 en target | 4768 + 4769 en DC |
| Invalidación | Rotation de la service/computer account | Doble rotation de krbtgt |
^st-pre-vs-golden

***
