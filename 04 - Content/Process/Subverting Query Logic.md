## Subvirtiendo la lógica de la consulta

Ahora que tenemos una idea básica sobre cómo funcionan las sentencias SQL, comencemos con la inyección SQL (SQLi). Antes de empezar a ejecutar consultas SQL enteras, primero aprenderemos a modificar la consulta original inyectando el operador `OR` y utilizando comentarios SQL para subvertir la lógica original de la consulta. Un ejemplo básico de esto es la evasión (bypass) de la autenticación web, lo cual demostraremos en esta sección.

## Evasión de Autenticación

Considera la siguiente página de inicio de sesión de administrador.

Podemos iniciar sesión con las credenciales de administrador `admin` / `p@ssw0rd`.

La página también muestra la consulta SQL que se está ejecutando para entender mejor cómo subvertiremos su lógica. Nuestro objetivo es iniciar sesión como el usuario `admin` sin utilizar la contraseña existente. Como podemos ver, la consulta SQL actual que se ejecuta es:
```SQL
SELECT * FROM logins WHERE username='admin' AND password = 'p@ssw0rd';
```

La página toma las credenciales y luego utiliza el operador `AND` para seleccionar registros que coincidan con el nombre de usuario y la contraseña dados. Si la base de datos MySQL devuelve registros coincidentes, las credenciales son válidas, por lo que el código PHP evaluaría la condición del intento de inicio de sesión como verdadera (true). Si la condición se evalúa como verdadera, se devuelve el registro del administrador y nuestro inicio de sesión es validado. Veamos qué sucede cuando ingresamos credenciales incorrectas.

Como era de esperar, el inicio de sesión falló debido a la contraseña incorrecta, lo que llevó a un resultado falso en la operación `AND`.

## Descubrimiento de SQLi

Antes de comenzar a subvertir la lógica de la aplicación web e intentar evadir la autenticación, primero tenemos que probar si el formulario de inicio de sesión es vulnerable a la inyección SQL. Para hacer eso, intentaremos agregar uno de los _payloads_ (cargas útiles) a continuación después de nuestro nombre de usuario y ver si causa algún error o cambia el comportamiento de la página:

|**Payload**|**Codificado en URL**|
|---|---|
|`'`|`%27`|
|`"`|`%22`|
|`#`|`%23`|
|`;`|`%3B`|
|`)`|`%29`|

> **Nota:** En algunos casos, es posible que tengamos que usar la versión codificada en URL del payload. Un ejemplo de esto es cuando colocamos nuestro payload directamente en la URL (es decir, en una solicitud HTTP GET).

Entonces, comencemos inyectando una comilla simple:

Vemos que se lanzó un error SQL en lugar del mensaje de "Inicio de Sesión Fallido". La página arrojó un error porque la consulta resultante fue:
```SQL
SELECT * FROM logins WHERE username=''' AND password = 'something';
```

Como se discutió en la sección anterior, la comilla que ingresamos resultó en un número impar de comillas, causando un error de sintaxis. Una opción sería comentar el resto de la consulta y escribir el resto de la misma como parte de nuestra inyección para formar una consulta funcional. Otra opción es usar un número par de comillas dentro de nuestra consulta inyectada, de tal manera que la consulta final siga funcionando.

## Inyección OR

Necesitaríamos que la consulta siempre devuelva `true` (verdadero), independientemente del nombre de usuario y contraseña ingresados, para evadir la autenticación. Para hacer esto, podemos abusar del operador `OR` en nuestra inyección SQL.

Como se discutió previamente, la documentación de MySQL sobre la precedencia de operadores establece que el operador `AND` se evaluaría antes que el operador `OR`. Esto significa que si hay al menos una condición VERDADERA en toda la consulta junto con un operador `OR`, la consulta completa se evaluará como VERDADERA, ya que el operador `OR` devuelve VERDADERO si uno de sus operandos es VERDADERO.

Un ejemplo de una condición que siempre devolverá verdadero es `'1'='1'`. Sin embargo, para mantener la consulta SQL funcionando y mantener un número par de comillas, en lugar de usar `('1'='1')`, eliminaremos la última comilla y usaremos `('1'='1)`, de modo que la comilla simple restante de la consulta original quede en su lugar.

Entonces, si inyectamos la condición de abajo y tenemos un operador `OR` entre ella y la condición original, debería devolver siempre verdadero:
```SQL
admin' or '1'='1
```

La consulta final debería ser la siguiente:
```SQL
SELECT * FROM logins WHERE username='admin' or '1'='1' AND password = 'something';
```

Esto significa lo siguiente:

- Si el nombre de usuario es admin
    **OR**
- Si 1=1 devuelve verdadero (lo cual siempre devuelve verdadero)
    **AND**
- Si la contraseña es "something"
![[Pasted image 20251126135330.png]]

Desglosémoslo:

El operador AND se evalúa primero:
1. `'1'='1'` es Verdadero.
2. `password='something'` es Falso.
3. El resultado de la condición `AND` es Falso porque Verdadero Y Falso es Falso.

Luego, se evalúa el operador `OR`:
1. Si `username='admin'` existe, toda la consulta devuelve Verdadero.
2. La condición `'1'='1'` es irrelevante en este contexto porque no afecta el resultado de la condición `AND`.
3. Por lo tanto, la consulta devolverá Verdadero si existe un nombre de usuario 'admin', eludiendo la autenticación.

> **Nota:** El payload que usamos arriba es uno de los muchos payloads de evasión de autenticación que podemos usar para subvertir la lógica. Puedes encontrar una lista completa de payloads de evasión de autenticación SQLi en _PayloadAllTheThings_, cada uno de los cuales funciona en cierto tipo de consultas SQL.

## Evasión de Autenticación con operador OR

Probemos esto como el nombre de usuario y veamos la respuesta.
![[Pasted image 20251126135506.png]]

Pudimos iniciar sesión exitosamente como admin. Sin embargo, ¿qué pasaría si no conociéramos un nombre de usuario válido? Probemos la misma solicitud con un nombre de usuario diferente esta vez.
![[Pasted image 20251126135512.png]]

El inicio de sesión falló porque `notAdmin` no existe en la tabla y resultó en una consulta falsa en general.
![[Pasted image 20251126135454.png]]

Para iniciar sesión exitosamente una vez más, necesitaremos una consulta que sea verdadera en su totalidad. Esto se puede lograr inyectando una condición `OR` en el campo de contraseña, para que siempre devuelva verdadero. Probemos `something' or '1'='1` como la contraseña.
![[Pasted image 20251126135557.png]]

La condición `OR` adicional resultó en una consulta verdadera en general, ya que la cláusula `WHERE` devuelve todo en la tabla, y el usuario presente en la primera fila inicia sesión. En este caso, como ambas condiciones devolverán verdadero, no tenemos que proporcionar un nombre de usuario y contraseña de prueba y podemos comenzar directamente con la inyección `'` e iniciar sesión con solo `' or '1' = '1`.
![[Pasted image 20251126135617.png]]

Esto funciona ya que la consulta se evalúa como verdadera independientemente del nombre de usuario o la contraseña.