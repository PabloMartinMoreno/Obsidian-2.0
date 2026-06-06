---
aliases:
  - graphql-voyager
  - GraphQL Voyager Schema Map
tags:
  - vuln/graphql
  - technique/discovery
  - asset/web-app
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Tool
linked:
  - "[[GraphQL Injection]]"
  - "[[GraphQL - Deteccion y Reconocimiento]]"
  - "[[GraphQL - Introspection y Schema Discovery]]"
  - "[[GraphQL - Tooling]]"
---
# GraphQL Voyager

---

## Paso 1: Encontrar el endpoint GraphQL

Por ejemplo:
```text
https://victima.com/graphql
```
o
```text
https://api.victima.com/graphql
```
sino (graphw00f)
```bash
python3 main.py -d -f -t http://IP/
```

## Paso 2: Verificar si permite introspection

Con curl:
```bash
curl -s -X POST https://victima.com/graphql \
-H "Content-Type: application/json" \
-d '{"query":"{ __schema { types { name } } }"}'
```
Si devuelve tipos (`User`, `Query`, `Mutation`, etc.) entonces la introspection está habilitada. ([Reddit][1])

## Paso 3: Obtener el schema completo

Podés usar herramientas como:
```bash
npx get-graphql-schema https://victima.com/graphql > schema.graphql
```
o guardar la introspection en JSON.

Ejemplo:
```bash
curl -s -X POST https://victima.com/graphql \
-H "Content-Type: application/json" \
-d '{"query":"query IntrospectionQuery { __schema { types { name }}}"}' \
> schema.json
```

## Paso 4: Levantar GraphQL Voyager

Ejecutá:
```bash
graphql-voyager
```
o
```bash
npx graphql-voyager
```
Se abrirá una interfaz web local. GraphQL Voyager está diseñado para representar visualmente el esquema GraphQL como un grafo interactivo. ([GitHub][2])

## Paso 5: Conectar el endpoint

En la interfaz:
1. Seleccioná "Change Schema".
2. Elegí "GraphQL Endpoint".
3. Escribí:
```text
https://victima.com/graphql
```
4. Si requiere autenticación, agregá headers.
Ejemplo:
```json
{
  "Authorization": "Bearer TOKEN"
}
```
Voyager ejecutará automáticamente la introspection y construirá el grafo. ([npmjs.com][3])

## Paso 6: Interpretar el grafo

Vas a ver algo parecido a:
```text
Query
 ├── users
 ├── user
 ├── posts

Mutation
 ├── createUser
 ├── deleteUser
```
Las flechas muestran relaciones entre tipos.

Ejemplo:
```text
User
 ├── id
 ├── email
 └── orders

Order
 ├── id
 ├── amount
 └── user
```
Así descubrís rápidamente qué objetos están relacionados. ([GitHub][2])

## Paso 7: Buscar cosas interesantes

Durante una auditoría suelen llamar la atención:

* Mutations administrativas.
* Mutations de borrado.
* Campos `email`, `password`, `token`.
* Objetos `Admin`, `Role`, `Permission`.
* IDs que podrían ser vulnerables a IDOR.
* Queries ocultas que no aparecen en la aplicación. ([Reddit][4])

Ejemplo:
```graphql
type Mutation {
    deleteUser(id: ID!): Boolean
}
```

Eso ya te da una línea de investigación.

## Paso 8: Construir consultas reales

Si Voyager muestra:
```graphql
user(id: ID!): User
```

y el tipo User tiene:
```graphql
id
username
email
role
```

podés probar:
```graphql
query {
  user(id: 1) {
    id
    username
    email
    role
  }
}
```

## Flujo típico de bug bounty
```text
/graphql encontrado
        ↓
Introspection habilitada
        ↓
Exportar schema
        ↓
Abrir en Voyager
        ↓
Mapear Queries
        ↓
Mapear Mutations
        ↓
Buscar IDOR
        ↓
Buscar BOLA
        ↓
Buscar bypasses de autorización
```



---
