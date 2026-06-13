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
kind: Concept
linked:
  - "[[GraphQL Injection]]"
  - "[[GraphQL Flujo Básico]]"
---
# GraphQL Estructura

---

## Query

Se usa para leer datos.
```graphql
query {
  user(id: 1) {
    username
    email
  }
}
```
"Quiero el usuario cuyo id es 1, y de ese usuario quiero su username y su email."

Aquí:
* `query` → tipo de operación.
* `user` → campo que estamos consultando.
* `id: 1` → argumento.
* `username`, `email` → campos solicitados.

---

## Mutation

Se usa para modificar datos.
```graphql
mutation {
  changePassword(
    userId: 1,
    password: "NuevaPass123"
  ) {
    success
  }
}
```

Normalmente encontrarás:
* Login
* Register
* CreateUser
* UpdateUser
* DeleteUser
* ChangePassword

---

## Subscription

Permite recibir datos en tiempo real.
```graphql
subscription {
  newMessages {
    content
    sender
  }
}
```

Es menos común en laboratorios de pentesting.

---

## Campos (Fields)

Son los datos que pides.
```graphql
query {
  user(id:1){
    id
    username
    email
  }
}
```

Los campos son:
```text
id
username
email
```

En pentesting muchas veces intentas descubrir campos ocultos.

---

## Argumentos (Arguments)

Son parámetros que recibe un campo.
```graphql
query {
  user(id:1){
    username
  }
}
```

Argumento:
```text
id:1
```

Otros ejemplos:
```graphql
user(username:"admin")
post(postId:15)
search(term:"test")
```

---

## Tipos (Types)

Definen la estructura de los objetos.

Por ejemplo:
```graphql
type User {
  id: ID
  username: String
  email: String
}
```

Cuando haces:
```graphql
query {
  __type(name:"User"){
    fields{
      name
    }
  }
}
```

estás inspeccionando un tipo.

---

## Variables

Sirven para enviar datos dinámicos.

Consulta:
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    username
  }
}
```

Variables:
```json
{
  "id": 1
}
```

Muchos escáneres y clientes GraphQL usan este formato.

---

## Fragmentos (Fragments)

Permiten reutilizar grupos de campos.
```graphql
query {
  user(id:1){
    ...UserFields
  }
}

fragment UserFields on User {
  username
  email
}
```

En auditorías suelen aparecer cuando observas tráfico de aplicaciones complejas.

---

## Alias

Permiten ejecutar la misma consulta varias veces con distintos nombres.
```graphql
query {
  user1: user(id:1){
    username
  }

  user2: user(id:2){
    username
  }
}
```

Respuesta:
```json
{
  "data": {
    "user1": {
      "username": "admin"
    },
    "user2": {
      "username": "carlos"
    }
  }
}
```

Los alias son importantes porque pueden utilizarse en ataques de sobrecarga (Alias Overloading).

---

## Directivas

Modifican el comportamiento de la consulta.
```graphql
query {
  user(id:1){
    username
    email @include(if: true)
  }
}
```

Las más comunes:
```text
@include
@skip
```

---

## Introspection

Es el mecanismo que permite descubrir el esquema.

Ejemplos clásicos:
```graphql
__schema
```

```graphql
__type
```

```graphql
__typename
```

Estas tres palabras son las más importantes para reconocimiento y enumeración.

---

Cuando veas una consulta como esta:
```graphql
query {
  user(id:1){
    username
    email
  }
}
```

descompónla mentalmente así:
```text
query        -> Operación
user         -> Campo principal
id:1         -> Argumento
username     -> Campo solicitado
email        -> Campo solicitado
User         -> Tipo que devuelve la consulta
```

Esa forma de leer GraphQL te ayudará mucho cuando empieces a enumerar esquemas durante laboratorios de HTB o auditorías reales.
