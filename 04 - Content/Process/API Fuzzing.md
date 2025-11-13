# Fuzzing de API

El fuzzing de API es una forma especializada de fuzzing orientada a APIs web. Aunque los principios básicos del fuzzing siguen siendo los mismos —enviar entradas inesperadas o inválidas a un objetivo— el fuzzing de API se centra en la estructura y los protocolos únicos que usan las APIs web.

El fuzzing de API consiste en bombardear una API con una serie de pruebas automatizadas, donde cada prueba envía una solicitud ligeramente modificada a un endpoint de la API. Estas modificaciones pueden incluir:

* Alterar valores de parámetros
* Modificar encabezados (headers) de la solicitud
* Cambiar el orden de los parámetros
* Introducir tipos o formatos de datos inesperados

El objetivo es provocar errores en la API, fallos o comportamientos inesperados que revelen posibles vulnerabilidades como fallas en la validación de entrada, ataques de inyección o problemas de autenticación.

## ¿Por qué fuzzear APIs?

El fuzzing de API es crucial por varias razones:

* **Descubrir vulnerabilidades ocultas:** Las APIs a menudo tienen endpoints y parámetros no documentados que pueden ser susceptibles a ataques. El fuzzing ayuda a descubrir estas superficies de ataque ocultas.
* **Probar la robustez:** El fuzzing evalúa la capacidad de la API para manejar de forma segura entradas inesperadas o mal formadas, asegurando que no se bloquee ni exponga datos sensibles.
* **Automatizar pruebas de seguridad:** Probar manualmente todas las combinaciones posibles de entrada es inviable. El fuzzing automatiza este proceso, ahorrando tiempo y esfuerzo.
* **Simular ataques del mundo real:** El fuzzing puede imitar las acciones de actores maliciosos, permitiendo identificar vulnerabilidades antes de que los atacantes las exploten.

## Tipos de fuzzing de API

Hay 3 tipos principales de fuzzing de API:

* **Fuzzing de parámetros:** Una de las técnicas primarias en fuzzing de API; se centra en probar sistemáticamente distintos valores para los parámetros de la API. Esto incluye parámetros de consulta (query string), encabezados (headers) y cuerpos de la solicitud (request bodies). Al inyectar valores inesperados o inválidos en estos parámetros, los fuzzers pueden exponer vulnerabilidades como ataques de inyección (por ejemplo, SQL injection, command injection), cross-site scripting (XSS) y manipulación de parámetros (parameter tampering).
* **Fuzzing de formato de datos:** Las APIs web frecuentemente intercambian datos en formatos estructurados como JSON o XML. El fuzzing de formato de datos se dirige específicamente a estos formatos manipulando la estructura, el contenido o la codificación de los datos. Esto puede revelar vulnerabilidades relacionadas con errores de parseo, desbordes de buffer o manejo incorrecto de caracteres especiales.
* **Fuzzing de secuencias:** Las APIs a menudo implican múltiples endpoints interconectados, donde el orden y el tiempo de las solicitudes son cruciales. El fuzzing de secuencias examina cómo responde una API a secuencias de solicitudes, descubriendo vulnerabilidades como condiciones de carrera, referencias directas inseguras a objetos (IDOR) o bypasses de autorización. Al manipular el orden, el tiempo o los parámetros de las llamadas a la API, los fuzzers pueden exponer debilidades en la lógica y en la gestión de estado de la API.

## Explorando la API

Para seguir el ejercicio, inicia el sistema objetivo como se indica en la sección de preguntas al final de la página, reemplazando las ocurrencias de IP:PORT por la IP:PORT de tu instancia levantada.

Esta API proporciona documentación generada de forma automática a través del endpoint `/docs`, en `http://IP:PORT/docs`. La siguiente página describe el endpoint documentado de la API.

Interfaz FastAPI mostrando endpoints: `GET /`, `GET /items/{item_id}`, `DELETE /items/{item_id}`, `PUT /items/{item_id}`, `POST /items/`.

La especificación detalla cinco endpoints, cada uno con un propósito y método específico:

* `GET /` (Leer raíz): Recupera el recurso raíz. Probablemente devuelve un mensaje de bienvenida o información de la API.
* `GET /items/{item_id}` (Leer ítem): Recupera un ítem específico identificado por `item_id`.
* `DELETE /items/{item_id}` (Eliminar ítem): Elimina un ítem identificado por `item_id`.
* `PUT /items/{item_id}` (Actualizar ítem): Actualiza un ítem existente con los datos proporcionados.
* `POST /items/` (Crear o actualizar ítem): Esta función crea un nuevo ítem o actualiza uno existente si `item_id` coincide.

Aunque la especificación de Swagger detalla explícitamente cinco endpoints, es crucial reconocer que las APIs pueden contener endpoints no documentados u “ocultos” que se omiten intencionalmente de la documentación pública.

Estos endpoints ocultos pueden existir para funciones internas que no están destinadas al uso externo, como un intento equivocado de seguridad por oscuridad, o porque aún están en desarrollo y no listos para uso público.

## Fuzzing de la API

Usaremos un fuzzer que utiliza una wordlist para intentar descubrir estos endpoints no documentados. Ejecuta los comandos para clonar, instalar los requisitos y ejecutar el fuzzer:

```bash
vsoci3tyv@htb[/htb]$ git clone https://github.com/PandaSt0rm/webfuzz_api.git
vsoci3tyv@htb[/htb]$ cd webfuzz_api
vsoci3tyv@htb[/htb]$ pip3 install -r requirements.txt
```

Luego, ejecuta el fuzzer usando la IP y el PORT del objetivo levantado:

```bash
vsoci3tyv@htb[/htb]$ python3 api_fuzzer.py http://IP:PORT
```

Salida de ejemplo:

```
[-] Invalid endpoint: http://localhost:8000/~webmaster (Status code: 404)
[-] Invalid endpoint: http://localhost:8000/~www (Status code: 404)

Fuzzing completed.
Total requests: 4730
Failed requests: 0
Retries: 0
Status code counts:
404: 4727
200: 2
405: 1
Found valid endpoints:
- http://localhost:8000/cz...
- http://localhost:8000/docs
Unusual status codes:
405: http://localhost:8000/items
```

* El fuzzer identifica numerosos endpoints inválidos (devolviendo errores 404 Not Found).
* Se descubren dos endpoints válidos:

  * `/cz...`: Este es un endpoint no documentado ya que no aparece en la documentación de la API.
  * `/docs`: Este es el endpoint documentado de la interfaz Swagger UI.
* La respuesta 405 Method Not Allowed para `/items` sugiere que se usó un método HTTP incorrecto para acceder a ese endpoint (por ejemplo, intentar `GET` en lugar de `POST`).

Podemos explorar el endpoint no documentado mediante `curl` y devolverá una flag:

```bash
vsoci3tyv@htb[/htb]$ curl http://localhost:8000/cz...

{"flag":"<snip>"}
```

Además de descubrir endpoints, el fuzzing puede aplicarse a los parámetros que estos endpoints aceptan. Al inyectar sistemáticamente valores inesperados en los parámetros, puedes provocar errores, fallos o comportamientos inesperados que podrían exponer una amplia gama de vulnerabilidades. Por ejemplo, considera los siguientes escenarios:

* **Autorización a nivel de objeto rota (Broken Object-Level Authorization):** El fuzzing podría revelar casos en los que manipular valores de parámetros permite acceso no autorizado a objetos o recursos específicos.
* **Autorización a nivel de función rota (Broken Function Level Authorization):** El fuzzing podría descubrir situaciones en las que se pueden invocar funciones no autorizadas manipulando parámetros, permitiendo a un atacante realizar acciones que no debería poder.
* **Server-Side Request Forgery (SSRF):** Inyectar valores maliciosos en los parámetros podría engañar al servidor para que realice solicitudes no deseadas a recursos internos o externos, potencialmente exponiendo información sensible o facilitando ataques adicionales.

Para explorar estas y otras vulnerabilidades y ataques contra APIs web con más detalle, consulta el módulo **API Attacks**. Entender estos riesgos es crucial para construir APIs seguras y resilientes.


[[api_fuzzer]]
