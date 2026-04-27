---
aliases:
  - graphw00f
  - InQL
  - clairvoyance
  - graphql-cop
  - GraphiQL
tags:
  - type/cheatsheet
  - vuln/graphql
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[GraphQL Injection]]'
  - '[[Burp Suite]]'
---
# GraphQL - Tooling

***

## graphw00f (Engine Fingerprint)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `git clone https://github.com/dolevf/graphw00f` | Python — engine fingerprinter. |
| Detect endpoint + engine | `python main.py -t https://target -d` | Auto-discover + identify. |
| Solo fingerprint con endpoint conocido | `python main.py -t https://target -f` | Skip detection, fingerprint directo. |
| Output detallado | `python main.py -t https://target -d -v` | Verbose mode. |
| Save report | `python main.py -t https://target -d -o report.json` | JSON output. |
| Engines reconocidos | Apollo, AWS AppSync, Graphene, Hasura, Strawberry, Relay, Lighthouse, etc | 30+ engines. |
| Custom user-agent | `--user-agent "..."` | Avoid detection. |
| Proxy | `--proxy http://127.0.0.1:8080` | Burp routing. |
| Headers extras | `--header "Authorization: Bearer ..."` | Authenticated targets. |
| Detect known CVEs | Por engine + version | Lookup. |
^graphql-tool-graphw00f

___

## InQL (Burp Extension)

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Instalar | Burp → Extensions → BApp Store → "InQL Scanner" | Free. |
| Auto-detect endpoints | Pasivo en historial | Identifies GraphQL automáticamente. |
| Introspection scan | Right-click GraphQL request → "Scan" | Dump schema con introspection canonical. |
| Schema visualizer | Tab "InQL Scanner" muestra types + queries + mutations | Manual exploration. |
| Generate queries | Right-click type → "Generate query" | Auto-build queries con todos los fields. |
| Generate mutations | Same para mutations | Standard payload generation. |
| Send to Repeater | Click "Send to Repeater" | Standard workflow Burp. |
| InQL Standalone | CLI mode si no Burp | `inql -t target` |
| Save schema | Export como SDL / JSON | Reportable. |
| Cycle detector | Detecta cycles en schema | DoS pre-check. |
| BCheck (Burp Pro) | Reglas automatizadas para GraphQL vulns | Pasivo + activo. |
^graphql-tool-inql

___

## clairvoyance (Schema Recovery)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `pip install clairvoyance` | Recovery sin introspection. |
| Recovery básico | `clairvoyance https://target/graphql -o schema.json` | Default wordlist. |
| Custom wordlist | `clairvoyance https://target/graphql -w custom.txt` | Custom field names. |
| Auth header | `clairvoyance https://target/graphql -H "Cookie: session=..."` | Authenticated. |
| Proxy | `--proxy http://127.0.0.1:8080` | Burp. |
| Verbose | `-v` | Debug. |
| Threads | `-t 10` | Speed. |
| Config | Custom config TOML | Avanzado. |
| Cómo funciona | Suggestions engine — usa errors "Did you mean..." para discover fields | Sin introspection oficial. |
| Mejor con suggestions on | Engines con suggestions desactivadas → menos eficaz | Limitación. |
| Visualize output | Cargar JSON en GraphQL Voyager | https://graphql-kit.com/graphql-voyager/ |
^graphql-tool-clairvoyance

___

## graphql-cop (Security Audit)

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `pip install graphql-cop` o git clone | Python audit suite. |
| Audit completo | `graphql-cop -t https://target/graphql` | All checks. |
| Output reportable | `graphql-cop -t ... -o report.json` | JSON. |
| Specific check | `graphql-cop -t ... -c introspection` | Single check. |
| Auth | `graphql-cop -t ... -H "Authorization: Bearer ..."` | Authenticated. |
| Checks incluidos | Introspection enabled, debug mode, suggestions, batching, depth limit, GET method, CSRF, alias overload | Comprehensive. |
| Cleartext password support | Probe de field passwords plain | Edge. |
| Custom payloads | Config file per check | Avanzado. |
| Dockerfile | `docker run dolevf/graphql-cop -t target` | Containerized. |
| CI/CD integration | Output JUnit XML | DevSecOps. |
^graphql-tool-cop

### graphql-cop output ejemplo

```bash
graphql-cop -t https://target/graphql -v

[INFO] Checking introspection...
[VULN] Introspection is enabled at /graphql

[INFO] Checking suggestions...
[VULN] Field suggestions enabled (security risk)

[INFO] Checking debug mode...
[VULN] Verbose error messages reveal stack traces

[INFO] Checking depth limit...
[VULN] No depth limit detected (DoS possible)

[INFO] Checking GET method...
[VULN] GET method allowed for mutations (CSRF possible)

[INFO] Checking aliases limit...
[INFO] Aliases limit OK (max 15)
```

___

## GraphiQL / Altair / Postman (Clients Manuales)

| **Tool** | **Setup** | **Uso** |
|:---:|:---:|:---:|
| GraphiQL | `https://target/graphql` (si dev mode) | UI built-in. |
| GraphiQL standalone | `npm install -g graphiql` | Local instance. |
| Altair GraphQL Client | https://altair.sirmuel.design/ | Mac/Linux/Windows. |
| Postman GraphQL tab | Built-in | Familiar para REST users. |
| Insomnia GraphQL | UI similar | Free + simple. |
| Hoppscotch (web) | https://hoppscotch.io/graphql | Browser. |
| Apollo Studio | apollostudio.com | Cloud-based explorer. |
| Authenticated requests | Set headers en client | Bearer / Cookie. |
| Save queries | Workspace per project | Organizar. |
| Subscriptions support | WebSocket panel | Real-time. |
| Schema upload | Upload SDL JSON manualmente | Si no introspection. |
| Variables auto-suggest | UI suggestions con tipo | Faster query building. |
^graphql-tool-clients

### Manual workflow con curl

```bash
# 1. Endpoint discovery
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}' https://target/graphql

# 2. Introspection
curl -X POST -H "Content-Type: application/json" \
  -d @introspection.json https://target/graphql > schema.json

# 3. Convert JSON to SDL
npx graphql-json-to-sdl schema.json > schema.graphql

# 4. Visualizar
# Abrir https://graphql-kit.com/graphql-voyager/ y subir schema.json

# 5. Run targeted query
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"query{user(id:1){email phone}}"}' \
  -H "Authorization: Bearer $TOKEN" \
  https://target/graphql
```

***
