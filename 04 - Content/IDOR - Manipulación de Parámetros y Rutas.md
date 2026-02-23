---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Manipulación de Parámetros y Rutas

***

## Cheatsheet

| **Técnica**                                | **Descripción**                                                                                                                                                                              | **Request Original (Ejemplo)**           | **Request Modificado (Ejemplo)**                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| <br>**Cambio de ID Secuencial**            | <br>Alteración directa de un valor predecible en el parámetro de la URL.<br><br>                                                                                                             | <br>`GET /profile?user_id=105`<br><br>   | <br>`GET /profile?user_id=106`                   |
| <br>**Parameter Pollution (HPP)**          | <br>Inyección de múltiples parámetros con el mismo nombre. El backend puede validar el primero pero procesar el segundo. Relacionado con [[HTTP Parameter Pollution]].<br><br>               | <br><br>`GET /api/messages?id=105`       | <br><br>`GET /api/messages?id=105&id=106`        |
| <br><br>**Array Injection**                | <br>Modificación del parámetro para que sea interpretado como una matriz, lo que a menudo provoca fallos o derivaciones en la lógica de validación.<br><br>                                  | <br><br>`GET /view?doc=105`              | <br><br>`GET /view?doc[]=105&doc[]=106`          |
| <br>**Manipulación de Rutas REST**         | <br>Sustitución del ID directamente en el _path_ de la URL cuando la arquitectura es RESTful.<br><br>                                                                                        | <br>`GET /api/v1/users/105/data`<br><br> | <br>`GET /api/v1/users/106/data`                 |
| <br>**Path Traversal combinado**           | <br>Uso de secuencias de salto de directorio para escapar del contexto del usuario actual y alcanzar el _path_ de otros IDs. Relacionado con [[Path Traversal]]<br><br>                      | <br>`GET /api/users/105/profile`         | <br>`GET /api/users/105/../../users/106/profile` |
| <br>**Inyección de Wildcards**             | <br>Uso de comodines (`*`, `%`) en los parámetros para forzar a la base de datos a devolver todos los registros o comportarse de manera inesperada.<br><br>                                  | <br><br>`GET /report?id=105`             | <br><br>`GET /report?id=*` (o `id=%`)            |
| <br>**Bypass por Extensión**               | <br>Alteración de la extensión del endpoint. A veces las reglas de autorización del framework se aplican a `.html` o al _path_ base, pero ignoran `.json` o `.xml`.<br><br>                  | <br><br>`GET /users/105.html`            | <br><br>`GET /users/106.json`                    |
| <br><br>**Alteración de Case Sensitivity** | <br>Cambio de mayúsculas a minúsculas en el nombre del parámetro. Útil si el [[WAF]] filtra identificadores específicos, pero el backend los procesa sin importar la capitalización.<br><br> | <br><br>`GET /account?id=105`            | <br><br>`GET /account?Id=106` o `ID=106`         |
| <br>**Encapsulamiento JSON en GET**        | <br>Si el servidor acepta el _payload_ en texto crudo o formato JSON en lugar del parámetro estándar.<br><br>                                                                                | <br>`GET /data?id=105`                   | <br>`GET /data?id={"id":106}`<br><br>            |
^idor-parametros

## Estrategias de Evaluación y Testing

Para aplicar estas técnicas de manera sistemática durante una auditoría o en la construcción de modelos de amenazas para la arquitectura de [[API Security]]:
- Interceptar y mapear todos los endpoints que reciben un identificador. Esto aplica tanto para enteros secuenciales, como para hashes débiles o un [[UUID]] mal implementado.
- Probar el acceso a un objeto utilizando siempre una matriz de control de acceso: registrar las respuestas con dos sesiones de usuario diferentes (Usuario A y Usuario B) interactuando con objetos cruzados.
- Analizar cómo se comporta el backend frente a tipos de datos atípicos o manipulados. Por ejemplo, enviar un _string_ donde se espera un _integer_, o enviar identificadores negativos y en cero como `id=-1` o `id=0`.

### Principios de Mitigación

La solución definitiva a estos vectores de ataque no reside en la ofuscación de las rutas de la API, sino en la implementación estructural de un sistema de [[Control de Acceso Basado en Roles]] (RBAC) o basado en Atributos (ABAC). Siempre se debe evaluar, a nivel del modelo o del controlador, que el usuario autenticado (extraído del token de sesión, no de la petición del cliente) posee permisos de lectura, escritura o eliminación sobre el objeto específico que está solicitando.


***
