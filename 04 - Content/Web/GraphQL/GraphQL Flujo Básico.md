---
aliases:
tags:
  - estado/incompleto
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: Technique
linked:
  - "[[GraphQL Injection]]"
  - "[[GraphQL Estructura]]"
---
# Flujo básico de GraphQL para pentesting

---

La idea es siempre seguir el mismo camino:

```text
1. Encontrar el endpoint GraphQL
2. Ver si la introspección está habilitada
3. Enumerar Queries
4. Enumerar Mutations
5. Enumerar tipos y campos
6. Obtener datos
7. Buscar información sensible
8. Buscar IDOR y fallos de autorización
9. Buscar inyecciones
10. Buscar vectores de DoS
```

## 1. Identificar GraphQL
Primero debes encontrar el endpoint.

Algunas rutas comunes:
```text
/graphql
/api/graphql
/query
/graphiql
/playground
```

Una prueba rápida es enviar:
```graphql
query {
  __typename
}
```

Si responde algo parecido a:
```json
{
  "data": {
    "__typename": "Query"
  }
}
```

ya sabes que estás frente a un servidor GraphQL.

---

## 2. Probar introspección

La introspección te permite descubrir cómo está construido el esquema.

Prueba:
```graphql
query {
  __schema {
    types {
      name
    }
  }
}
```

Si funciona, obtendrás una lista enorme de tipos.

También puedes averiguar cuál es el punto de entrada principal:
```graphql
query {
  __schema {
    queryType {
      name
    }
  }
}
```

Normalmente devolverá algo como:
```json
{
  "data": {
    "queryType": {
      "name": "Query"
    }
  }
}
```

---

## 3. Enumerar las consultas disponibles

Ahora quieres saber qué consultas existen.
```graphql
query {
  __type(name: "Query") {
    fields {
      name
    }
  }
}
```

Ejemplo:
```json
{
  "data": {
    "__type": {
      "fields": [
        {
          "name": "user"
        },
        {
          "name": "users"
        },
        {
          "name": "posts"
        }
      ]
    }
  }
}
```

Ya sabes qué funcionalidades ofrece la API.

---

## 4. Descubrir los parámetros de cada consulta

Supongamos que existe una consulta llamada `user`.

Ahora necesitas saber qué argumentos acepta.
```graphql
query {
  __type(name: "Query") {
    fields {
      name
      args {
        name
      }
    }
  }
}
```

Ejemplo:
```json
{
  "name": "user",
  "args": [
    {
      "name": "id"
    }
  ]
}
```

Esto indica que debes proporcionar un parámetro `id`.

---

## 5. Consultar datos

Una vez conocidos los parámetros:
```graphql
query {
  user(id: 1) {
    id
    username
  }
}
```

Ejemplo de respuesta:
```json
{
  "data": {
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

---

## 6. Descubrir campos ocultos

Aquí suele estar gran parte de la diversión en HTB.

Si obtienes esto:
```graphql
query {
  user(id: 1) {
    id
    username
  }
}
```

pregunta qué campos tiene realmente el tipo `User`:
```graphql
query {
  __type(name: "User") {
    fields {
      name
    }
  }
}
```

Podrías obtener:
```json
[
  {
    "name": "id"
  },
  {
    "name": "username"
  },
  {
    "name": "email"
  },
  {
    "name": "password"
  }
]
```

Entonces pruebas:
```graphql
query {
  user(id: 1) {
    id
    username
    email
    password
  }
}
```

Muchos laboratorios se resuelven exactamente así.

---

## 7. Enumerar Mutations

Las Mutations son equivalentes a acciones que modifican datos.

Primero identifica si existen:
```graphql
query {
  __schema {
    mutationType {
      name
    }
  }
}
```

Luego enumera sus funciones:
```graphql
query {
  __type(name: "Mutation") {
    fields {
      name
    }
  }
}
```

Ejemplo:
```json
[
  {
    "name": "login"
  },
  {
    "name": "register"
  },
  {
    "name": "changePassword"
  }
]
```

---

## 8. Enumerar argumentos de las Mutations

Ahora averigua qué parámetros esperan.
```graphql
query {
  __type(name: "Mutation") {
    fields {
      name
      args {
        name
      }
    }
  }
}
```

Ejemplo:
```json
{
  "name": "login",
  "args": [
    {
      "name": "username"
    },
    {
      "name": "password"
    }
  ]
}
```

---

## 9. Buscar IDOR

Uno de los problemas más comunes.

Si existe:
```graphql
query {
  user(id: 1) {
    username
  }
}
```

Prueba otros IDs:
```graphql
query {
  user(id: 2) {
    username
  }
}
```

```graphql
query {
  user(id: 3) {
    username
  }
}
```

```graphql
query {
  user(id: 4) {
    username
  }
}
```

Si puedes acceder a información de otros usuarios, probablemente encontraste un IDOR.

---

## 10. Buscar vulnerabilidades típicas

Cuando ya conoces el esquema, empieza la fase ofensiva.

Revisa:

* Information Disclosure
* IDOR
* Broken Access Control
* SQL Injection
* NoSQL Injection
* Mass Assignment
* Alias Overloading
* Query Batching
* DoS por profundidad excesiva
* DoS por recursión
* Introspection Exposure

---

## Consultas que debes memorizar

Estas son las que más vas a usar:

Obtener tipos:
```graphql
query {
  __schema {
    types {
      name
    }
  }
}
```

Obtener Queries:
```graphql
query {
  __type(name: "Query") {
    fields {
      name
    }
  }
}
```

Obtener Mutations:
```graphql
query {
  __type(name: "Mutation") {
    fields {
      name
    }
  }
}
```

Obtener campos de un tipo:
```graphql
query {
  __type(name: "User") {
    fields {
      name
    }
  }
}
```

Obtener argumentos:
```graphql
query {
  __type(name: "Query") {
    fields {
      name
      args {
        name
      }
    }
  }
}
```

Si dominas estas cuatro consultas de introspección, ya puedes empezar a resolver la mayoría de laboratorios básicos e intermedios de GraphQL en HTB.
