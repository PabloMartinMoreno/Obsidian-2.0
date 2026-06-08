---
aliases:
  - Introspection Query
  - GraphQL Schema Recovery
tags:
  - vuln/graphql
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[GraphQL Injection]]"
---
# GraphQL - Introspection y Schema Discovery

---

## Introspection Query Completa

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{__schema{types{name}}}` | Schema básico | Lista todos los types. |
| Schema completo | Query introspection canonical (ver abajo) | Dump full schema. |
| `{__schema{queryType{name fields{name}}}}` | Query type | Top-level Query fields. |
| `{__schema{mutationType{name fields{name}}}}` | Mutation type | Top-level Mutations. |
| `{__schema{subscriptionType{name fields{name}}}}` | Subscription type | WS subscriptions. |
| `{__type(name:"User"){name fields{name type{name}}}}` | Type info | Detalle de tipo específico. |
| `{__type(name:"Role"){enumValues{name}}}` | Enum values | Listar enums. |
| `{__type(name:"UserInput"){inputFields{name type{name}}}}` | Input types | Mutation inputs. |
| Disabled introspection probe | Si `__schema` retorna error → introspection off | Move to suggestions. |
| Bypass via GET | Si POST bloqueado → `?query={__schema{...}}` | Engine lax. |
| Bypass via batching | Embed introspection en query batched | Engine confunde. |
^graphql-introspect-query

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

## Field Suggestions (Typo Trick)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concepto | Engine acepta typo y sugiere field correcto en error | Disclosure parcial sin introspection. |
| `{usr}` → "Did you mean user?" | Probe básico | Single field. |
| `{abc}` → ver lista de sugerencias top | Multi-field probe | Más data. |
| `{a}`, `{b}`, ... `{z}` | Iteración por prefix | Fuerza fields starting con cada letra. |
| `{aa}`, `{ab}`... | Iteración con 2 chars | Más profundo. |
| Suggestions inputs | Mutation con typo en input field | Discover input fields. |
| `{user(idx: 1)}` → "Did you mean id?" | Suggestions arguments | Argument names. |
| Suggestions enums | Pasar enum value typo | Discover enum values. |
| Suggestions types | Reference type typo en variable | Type discovery. |
| Disabled suggestions | Engines patcheados los desactivan | Apollo Server v4+. |
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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `clairvoyance https://target/graphql -o schema.json` | clairvoyance | Auto-recover schema sin introspection. |
| `https://graphql-kit.com/graphql-voyager/` | GraphQL Voyager | Visualizar schema cargando JSON. |
| InQL Burp | Right-click request → "InQL Scanner" | Burp ext built-in. |
| `npm install -g graphql-schema-utilities` | graphql-schema-utilities | Convertir formats. |
| `get-graphql-schema` | `npx get-graphql-schema https://target/graphql > schema.graphql` | Si introspection enabled. |
| Apollo Studio | Carga schema importado | Visual exploration. |
| GraphiQL Explorer | UI que muestra schema | Dev mode interactive. |
| Altair GraphQL Client | UI Mac/Linux/Windows | Manual query building. |
| Postman GraphQL support | Postman tab para GraphQL | Familiar UI. |
| Manual recovery | Loop con clairvoyance + manual review | Si tool falla. |
| `python graphqlmap.py -u https://target/graphql -v --method GET` | graphqlmap | Old but useful. |
| `gq https://target/graphql --introspect` | graphqurl | CLI Hasura. |
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
