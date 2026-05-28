---
aliases:
  - graphw00f
  - InQL
  - clairvoyance
  - graphql-cop
  - GraphiQL
tags:
  - vuln/graphql
  - technique/discovery
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
  - "[[Burp Suite]]"
---
# GraphQL - Tooling

***

## graphw00f (Engine Fingerprint)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/dolevf/graphw00f && pip install -r graphw00f/requirements.txt` | Install graphw00f | Primera vez. |
| `python main.py -t https://target -d` | Endpoint discovery + engine fingerprint | Recon inicial. |
| `python main.py -t https://target/graphql -f` | Solo fingerprint con endpoint conocido | Skip discovery. |
| `python main.py -t https://target -d -o report.json` | Save report JSON | Reportable. |
| `python main.py -t https://target -d --proxy http://127.0.0.1:8080` | Routing por Burp | Inspección manual. |
| `python main.py -t https://target -d --header "Cookie: session=..."` | Authenticated fingerprint | Si endpoint requiere auth. |
| `python main.py -t https://target -d -v` | Verbose con todos los probes | Debug fingerprinting. |
^graphql-tool-graphw00f

___

## InQL (Burp Extension)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "InQL Scanner" → Install | Install extension | Setup inicial. |
| Right-click GraphQL request → "Send to InQL" | Schema dump via introspection | Post-detección endpoint. |
| InQL tab → seleccionar type → "Generate Query" | Auto-genera query con todos los fields | Manual testing. |
| InQL tab → seleccionar mutation → "Generate Mutation" | Auto-genera mutation con todos los inputs | Mass assignment fuzzing. |
| Right-click query generada → "Send to Repeater" | Replay con auth | Standard exploit workflow. |
| `pip install inql && inql -t https://target/graphql` | InQL standalone CLI | Sin Burp. |
| `inql -t https://target/graphql -o schema.json` | Export schema JSON | Visualization. |
| InQL tab → "Cycles" panel | Detecta type cycles | DoS pre-check. |
^graphql-tool-inql

___

## clairvoyance (Schema Recovery sin Introspection)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install clairvoyance` | Install | Primera vez. |
| `clairvoyance https://target/graphql -o schema.json` | Schema reconstruido sin introspection | Introspection deshabilitada pero suggestions on. |
| `clairvoyance https://target/graphql -w custom.txt` | Wordlist de field names custom | Defaults insuficiente. |
| `clairvoyance https://target/graphql -H "Cookie: session=..."` | Recovery autenticado | Schema oculto detrás de auth. |
| `clairvoyance https://target/graphql --proxy http://127.0.0.1:8080` | Route por Burp | Inspección. |
| `clairvoyance https://target/graphql -t 20` | 20 threads concurrent | Speed up. |
| Cargar `schema.json` en https://graphql-kit.com/graphql-voyager/ | Visualización del schema | Manual review. |
^graphql-tool-clairvoyance

___

## graphql-cop (Security Audit)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `pip install graphql-cop` | Install | Primera vez. |
| `graphql-cop -t https://target/graphql` | Audit completo (introspection, debug, suggestions, batching, depth, GET, CSRF, alias overload) | Recon vuln-class rápido. |
| `graphql-cop -t https://target/graphql -o report.json` | Output JSON | Reportable. |
| `graphql-cop -t https://target/graphql -H "Authorization: Bearer ..."` | Audit autenticado | Schema detrás de auth. |
| `graphql-cop -t https://target/graphql -x http://127.0.0.1:8080` | Routing por Burp | Inspección. |
| `docker run dolevf/graphql-cop -t https://target/graphql` | Containerized | Sin python local. |
| `graphql-cop -t ... \| grep -i vuln` | Solo vulns confirmadas | Filter output. |
^graphql-tool-cop

### graphql-cop output ejemplo

```bash
graphql-cop -t https://target/graphql -v

[VULN] Introspection is enabled at /graphql
[VULN] Field suggestions enabled (security risk)
[VULN] Verbose error messages reveal stack traces
[VULN] No depth limit detected (DoS possible)
[VULN] GET method allowed for mutations (CSRF possible)
[INFO] Aliases limit OK (max 15)
```

___

## GraphiQL / Altair / Postman (Clients Manuales)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browse a `https://target/graphql` o `/graphiql` | UI integrada de GraphiQL | Si dev mode habilitado. |
| Download Altair desde https://altair.sirmuel.design/ | Cliente desktop full-featured | Sin Burp / sin dev mode. |
| Altair → Headers → `Authorization: Bearer ...` | Requests autenticados | Schema autenticado. |
| Altair → "Docs" panel → introspect | Visual schema explorer | Mejor que JSON raw. |
| Postman → New → GraphQL → URL + query | GraphQL desde Postman | Si ya usás Postman. |
| Hoppscotch en https://hoppscotch.io/graphql | Cliente browser sin install | Quick test. |
| `npm install -g graphiql && graphiql --port 3000` | Local GraphiQL standalone | Custom config. |
^graphql-tool-clients

### Manual workflow con curl

```bash
# 1. Endpoint discovery
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}' https://target/graphql

# 2. Introspection completa
curl -X POST -H "Content-Type: application/json" \
  -d @introspection.json https://target/graphql > schema.json

# 3. Convert JSON to SDL legible
npx graphql-json-to-sdl schema.json > schema.graphql

# 4. Run targeted query
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"query{user(id:1){email phone}}"}' \
  https://target/graphql
```

***
