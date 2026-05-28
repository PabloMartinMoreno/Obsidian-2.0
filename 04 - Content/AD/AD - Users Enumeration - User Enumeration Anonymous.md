---
aliases:
  - Anonymous User Enum
  - Null Session Users
  - Pre-Auth User Enum
  - kerbrute Userenum
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Users Enumeration]]"
---
# AD - Users Enumeration - Anonymous Discovery

***

## Null Session SAMR

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --users` | Users via null SAMR | Test misconfig. |
| `nxc smb <DC> -u 'guest' -p '' --users` | Fallback Guest | Si null blocked. |
| `nxc smb 10.0.0.0/24 -u '' -p '' --users` | Sweep subnet (rogue hosts) | Bulk discovery. |
| `rpcclient -U "" <DC> -N -c 'enumdomusers'` | Anonymous RPC enum | Direct. |
| `enum4linux-ng -U <DC>` | All-in-one anonymous | Sin nxc. |
| `enum4linux-ng -U -A <DC> -oJ enum.json` | Comprehensive + JSON | Audit reportable. |
| `impacket-samrdump 'corp.local/'@<DC>` | Anonymous SAMR via Impacket | Linux alt. |
| `impacket-lookupsid 'corp.local/'@<DC> 5000` | Anonymous RID brute | Standard. |
^ad-anon-samr

**Hardening defaults:** Win2019+ bloquea null sessions. `RestrictAnonymous=2` y `RestrictAnonymousSAM=1` en registry. Si pega null = legacy/misconfig.

```bash
# Sweep agresivo
nxc smb 10.0.0.0/24 -u '' -p '' --users 2>&1 | tee null_test.txt
enum4linux-ng -U -A <DC> -oJ enum_anon.json
```

___

## Anonymous LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -x -h <DC> -s base -b "" namingContexts` | RootDSE (always allowed) | Bootstrap discovery. |
| `ldapsearch -x -h <DC> -b "DC=corp,DC=local" "(objectCategory=user)" samAccountName` | User dump anonymous (raro funciona) | Test misconfig. |
| `nxc ldap <DC> -u '' -p '' --get-domain-info` | RootDSE compact | Quick. |
| `nmap --script ldap-rootdse -p389 <DC>` | RootDSE via nmap | Sin tools LDAP. |
^ad-anon-ldap

**Errores típicos:**
- `Operations error` → anonymous bind blocked.
- `Authentication required` → necesita creds.
- Datos retornados → vuln (anonymous user enum permitido).

```bash
# Bootstrap completo via RootDSE
ldapsearch -x -h <DC> -s base -b "" \
  namingContexts \
  defaultNamingContext \
  configurationNamingContext \
  schemaNamingContext \
  rootDomainNamingContext \
  domainFunctionality forestFunctionality

# Test anonymous user enum (suele estar bloqueado)
ldapsearch -x -h <DC> -b "DC=corp,DC=local" "(objectCategory=user)" samAccountName 2>&1 | head -5
```

___

## Kerberos Pre-Auth Username Validation (kerbrute)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `kerbrute userenum --dc <DC> -d corp.local users.txt` | Validar users via Kerberos AS-REQ | Sin creds. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -o valid.txt` | Output a file | Pipeline. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt -t 100` | 100 threads | Performance. |
| `kerbrute userenum --dc <DC> -d corp.local users.txt --downgrade` | Forzar RC4 | Edge legacy. |
^ad-anon-kerbrute

**Códigos KDC:**
- `KDC_ERR_PREAUTH_REQUIRED` (24) → user **EXISTE**.
- `KDC_ERR_C_PRINCIPAL_UNKNOWN` (6) → user **NO existe**.
- `KDC_ERR_CLIENT_REVOKED` (18) → user existe pero **disabled**.
- `KDC_ERR_KEY_EXPIRED` (23) → user existe, **password expired**.

**Por qué OPSEC-friendly:** no incrementa `BadPasswordCount`, no triggers lockout. Solo AS-REQ enviado. ~1000 users/seg sin auth.

```bash
# Pipeline OSINT → validate
git clone https://github.com/urbanadventurer/username-anarchy
./username-anarchy -i names.txt > usernames.txt
kerbrute userenum --dc <DC> -d corp.local usernames.txt -o valid.txt
```

___

## RID Cycling (Anonymous)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --rid-brute` | RID brute null (default 4000) | Test misconfig. |
| `nxc smb <DC> -u '' -p '' --rid-brute 10000` | Range custom | Domain grande. |
| `impacket-lookupsid 'corp.local/'@<DC> 10000` | LSARPC null lookup range | Alt method. |
| `enum4linux-ng -R <DC>` | RID cycling all-in-one | Sin nxc. |
^ad-anon-ridcycle

**RIDs estándar:** 500=Administrator, 501=Guest, 502=krbtgt, 512=Domain Admins, 513=Domain Users, 514=Domain Guests, 515=Domain Computers, 516=Domain Controllers, 519=Enterprise Admins. RIDs ≥1000 = creados por usuarios.

```bash
# Anonymous bulk extract
impacket-lookupsid 'corp.local/'@<DC> 10000 |
  grep "SidTypeUser" |
  awk '{print $2}' |
  cut -d'\\' -f2 > users_anon.txt
```

___

## OSINT-Based Username Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 linkedin2username.py -c "Target Co" -u atacante -p pass -n corp.local` | Usernames generados desde LinkedIn | Pre-engagement OSINT. |
| `cewl https://corp.com -d 2 -m 5 -w wordlist.txt` | Wordlist desde web público | Naming patterns. |
| `theHarvester -d corp.com -b google,bing,linkedin` | Multi-source emails + names | OSINT classic. |
| `h8mail -t targetuser@corp.com` | Breach DB lookup | Pwned creds. |
| `dehashed -e corp.com` (CLI) | Emails en breaches públicos | Email + creds históricos. |
^ad-anon-osint

```bash
# Pipeline OSINT → AD validation
git clone https://github.com/initstring/linkedin2username
python3 linkedin2username.py -c "Target Company" -u atacante -p pass -n corp.local

# Output formats:
#   first.last@corp.local
#   flast@corp.local
#   firstl@corp.local

# Validate
kerbrute userenum --dc <DC> -d corp.local linkedin_users.txt -o valid.txt
```

___

## Common Naming Patterns

| **Patrón** | **Ejemplo** | **Frecuencia** |
|:---:|:---:|:---:|
| `firstname.lastname` | `john.smith` | Más común. |
| `firstinitiallastname` | `jsmith` | Común. |
| `firstinitial.lastname` | `j.smith` | Común. |
| `firstnamelastname` | `johnsmith` | Común. |
| `lastnamefirstinitial` | `smithj` | Edge. |
| `firstname` solo | `john` | Edge. |
| Contractor prefix | `c-jsmith`, `con.jsmith` | Org grandes. |
| Numeric suffix | `jsmith123`, `jsmith01` | Duplicates. |
^ad-anon-patterns

```bash
# Generator inline desde "First Last" lines
cat names.txt | while IFS=' ' read first last; do
  fl=$(echo "$first" | tr '[:upper:]' '[:lower:]')
  ll=$(echo "$last" | tr '[:upper:]' '[:lower:]')
  fi=${fl:0:1}
  echo "${fl}.${ll}"
  echo "${fi}.${ll}"
  echo "${fi}${ll}"
  echo "${fl}${ll}"
  echo "${ll}${fi}"
  echo "${fl}"
done | sort -u > usernames.txt

# username-anarchy alt
./username-anarchy -i names.txt > usernames.txt
```

***
