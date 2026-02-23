---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# IDOR - Manipulación del Cuerpo de la Petición

***

## Cheatsheet

| **Técnica**                             | **Descripción**                                                                                                                                                                                | **Body Original (Ejemplo)**                                 | **Body Modificado (Ejemplo)**                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| **Sustitución Directa de ID**           | Reemplazo del identificador del objeto directamente en el payload JSON/XML para acceder o modificar datos de otro usuario.<br><br>                                                             | <br>`{"doc_id": 105, "title": "Nota"}`                      | <br>`{"doc_id": 106, "title": "Nota"}`                        |
| **Inyección de Parámetros Ocultos**     | Adición de campos identificadores que no estaban presentes en la petición original pero que el backend procesa (relacionado con [[Mass Assignment]]).                                          | <br>`{"name": "Alice", "email": "a@a.com"}`<br><br>         | <br>`{"name": "Alice", "email": "a@a.com", "user_id": 106}`   |
| **Type Confusion (Type Juggling)**      | Alteración del tipo de dato esperado (ej. cambiar un entero por un string, un booleano o un array) para eludir validaciones estrictas en el backend.                                           | <br>`{"account_id": 105}`                                   | <br>`{"account_id": "106"}` o `{"account_id": [106]}`<br><br> |
| **Array Payload Injection**             | Envío de una matriz de identificadores en lugar de un valor único. Útil cuando la lógica de validación solo comprueba el primer elemento pero la consulta afecta a todos.                      | <br>`{"id": 105}`                                           | <br>`{"id": [105, 106]}`                                      |
| **Manipulación de Nodos XML**           | Modificación de atributos o valores de nodos que representan identificadores dentro de un payload XML, a menudo evadiendo filtros diseñados solo para JSON o Query Strings.                    | <br>`<user><id>105</id></user>`                             | <br>`<user><id>106</id></user>`                               |
| **Modificación en Multipart/Form-Data** | Alteración de campos ocultos (hidden fields) o identificadores enviados dentro de los _boundaries_ de un formulario multipart, típicamente en subidas de archivos o actualizaciones de perfil. | <br>`Content-Disposition: form-data; name="user_id"\n\n105` | <br>`Content-Disposition: form-data; name="user_id"\n\n106`   |
| **JSON Parameter Pollution**            | Inyección del mismo parámetro varias veces dentro del mismo objeto JSON. Dependiendo del _parser_ del backend, se retendrá el primer o el último valor procesado.                              | <br>`{"id": 105}`                                           | <br>`{"id": 105, "id": 106}`                                  |

## Estrategias de Evaluación y Testing

Al auditar o diseñar pruebas de [[API Security]], la evaluación del cuerpo de la petición requiere un enfoque estructurado para descubrir asunciones implícitas en el código:

- Interceptar cada petición de mutación de estado (POST/PUT/PATCH/DELETE) y aislar todos los parámetros numéricos, UUIDs y campos que referencien recursos.
    
- Intentar inyectar campos comunes como `id`, `user_id`, `account_id`, `role_id` o `org_id` en peticiones donde inicialmente no son requeridos.
    
- Observar detenidamente las diferencias en las respuestas HTTP (códigos de estado, longitud del cuerpo, tiempos de respuesta) al enviar identificadores de objetos pertenecientes a otro contexto de autorización.
    

### Principios de Mitigación

Para prevenir la manipulación del cuerpo de la petición, el sistema no debe depender nunca de los identificadores proporcionados por el cliente para tomar decisiones de autorización. El patrón arquitectónico correcto implica:

- Extraer la identidad del usuario y su contexto de un token seguro y validado criptográficamente del lado del servidor (como un [[JWT]] correctamente implementado).
    
- Utilizar Data Transfer Objects (DTO) estrictos que ignoren cualquier parámetro adicional no esperado en el payload (evitando el _Binding_ automático o _Mass Assignment_).
    
- Validar siempre que el usuario autenticado posee los derechos explícitos sobre el identificador del objeto que se está intentando modificar o consultar.

***

## Overview


***

## Notas Relacionadas


***
