---
aliases:
  - Introspection Query
  - GraphQL Schema Recovery
tags:
  - vuln/graphql
  - technique/discovery
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
---
# GraphQL - Introspection y Schema Discovery

---

## Introspection Query Completa

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__schema{types{name}}}"}' https://target/graphql` | Schema básico — lista todos los types | Probe inicial. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query{__schema{queryType{name}mutationType{name}types{name kind fields{name type{name kind ofType{name}}}}}}"}' https://target/graphql \| jq .` | **Dump del schema** (types + fields + tipos) one-liner | Dump rápido copy-paste. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__schema{queryType{name fields{name}}}}"}' https://target/graphql` | Top-level Query fields | Entrypoints de lectura. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__schema{mutationType{name fields{name}}}}"}' https://target/graphql` | Top-level Mutations | Entrypoints de escritura. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__schema{subscriptionType{name fields{name}}}}"}' https://target/graphql` | Subscriptions (WS) | Real-time endpoints. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__type(name:\"User\"){name fields{name type{name}}}}"}' https://target/graphql` | Detalle de un tipo | Inspección puntual. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__type(name:\"Role\"){enumValues{name}}}"}' https://target/graphql` | Enum values | Listar enums. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{__type(name:\"UserInput\"){inputFields{name type{name}}}}"}' https://target/graphql` | Input fields | Mutation inputs (mass-assignment recon). |
| `curl -sG --data-urlencode 'query={__schema{types{name}}}' https://target/graphql` | Introspection vía GET (bypass) | POST bloqueado, engine lax. |
| `curl -sX POST -H 'Content-Type: application/json' -d '[{"query":"{__schema{types{name}}}"}]' https://target/graphql` | Introspection en batch (bypass) | Introspection filtrada inline. |
^graphql-introspect-query

> Si `__schema` retorna `errors` → introspection deshabilitada, pasar a **Field Suggestions** o **canonical query** (abajo).

### Introspection canonical query

```graphql
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args { ...InputValue }
    }
  }
}
fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args { ...InputValue }
    type { ...TypeRef }
    isDeprecated
    deprecationReason
  }
  inputFields { ...InputValue }
  interfaces { ...TypeRef }
  enumValues(includeDeprecated: true) {
    name description isDeprecated deprecationReason
  }
  possibleTypes { ...TypeRef }
}
fragment InputValue on __InputValue {
  name description type { ...TypeRef } defaultValue
}
fragment TypeRef on __Type {
  kind name
  ofType {
    kind name
    ofType {
      kind name
      ofType {
        kind name
        ofType { kind name ofType { kind name ofType { kind name ofType { kind name }}}}
      }
    }
  }
}
```

### Lanzar introspection con curl

```bash
# Encadenar query inline
INTROSPECTION='{"query":"query IntrospectionQuery { __schema { queryType { name } mutationType { name } types { name kind fields { name type { name kind ofType { name } } } } } }"}'

curl -X POST -H "Content-Type: application/json" \
  -d "$INTROSPECTION" https://target/graphql | jq .
```

---

Con introspection deshabilitada, muchos engines igual **sugieren el field correcto en el mensaje de error** ante un typo ("Did you mean ...?") → permite reconstruir el schema parcialmente. Disabled en Apollo Server v4+.

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{usr}"}' https://target/graphql` | Error `Did you mean "user"?` → confirma field | Probe básico single-field. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{abc}"}' https://target/graphql` | Lista de sugerencias top del root | Multi-field discovery. |
| `for c in {a..z}; do curl -sX POST -H 'Content-Type: application/json' -d "{\"query\":\"{$c}\"}" https://target/graphql; done` | Itera por prefijo → fields que empiezan con cada letra | Enumeración por fuerza bruta. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"mutation{updateUser(input:{usrnam:\"x\"})}"}' https://target/graphql` | Error `Did you mean "username"?` → input fields | Input fields (mass-assignment). |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{user(idx:1){id}}"}' https://target/graphql` | Error `Did you mean "id"?` → nombres de argumentos | Argument discovery. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"{users(role:ADMI){id}}"}' https://target/graphql` | Error `Did you mean "ADMIN"?` → enum values | Enum discovery. |
| `curl -sX POST -H 'Content-Type: application/json' -d '{"query":"query($x:UsrInput){__typename}"}' https://target/graphql` | Error `Did you mean "UserInput"?` → type names | Type discovery via variable. |
^graphql-introspect-suggestions

### clairvoyance — automatizar suggestions

```bash
# Instalar
pip install clairvoyance

# Ejecutar contra endpoint con introspection deshabilitada
clairvoyance -o schema.json https://target/graphql

# Output: schema.json con todo lo que se pudo recuperar via suggestions
```

---

## Schema Recovery con Tools

| **Comando / Acción** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `clairvoyance https://target/graphql -o schema.json` | Schema reconstruido sin introspection | Introspection off pero suggestions on. |
| `npx get-graphql-schema https://target/graphql > schema.graphql` | Dump del schema a SDL | Introspection enabled. |
| `gq https://target/graphql --introspect` | Dump schema (graphqurl CLI) | CLI rápida. |
| `python graphqlmap.py -u https://target/graphql -v --method GET` | Schema dump + injection testing | graphqlmap (old but useful). |
| `npm install -g graphql-schema-utilities` | Convierte entre formatos de schema | Post-procesamiento del dump. |
| InQL (Burp): right-click request → "InQL Scanner" | Schema dump + auto query/mutation gen | Workflow dentro de Burp. |
| Cargar `schema.json` en `graphql-kit.com/graphql-voyager` | Visualización gráfica del schema | Review manual del schema. |
| Importar schema a Apollo Studio / GraphiQL / Altair / Postman | Exploración interactiva, query building | Testing manual con UI. |
^graphql-introspect-tools

### Workflow recovery

```
1. Probar introspection canonical query.
   - Si OK → guardar JSON, visualizar en Voyager.
2. Si bloqueada:
   - Probar GET / form-urlencoded variants (CSRF bypass).
   - Si igual bloqueada → suggestions trick.
3. clairvoyance contra endpoint con suggestions activas.
4. Iterar hasta cobertura estable.
5. Convertir a SDL con utilities → review manual.
```

---
