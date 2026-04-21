---
aliases:
tags:
  - type/cheatsheet
  - vuln/sqli
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Cláusula Union

Hasta ahora, solo hemos estado manipulando la consulta original para subvertir la lógica de la aplicación web y eludir la autenticación, utilizando el operador `OR` y comentarios. Sin embargo, otro tipo de inyección SQL consiste en inyectar consultas SQL enteras que se ejecutan junto con la consulta original.

Esta sección demostrará esto utilizando la cláusula `Union` de MySQL para realizar una Inyección SQL Union.

## Union

Antes de comenzar a aprender sobre la Inyección Union, primero debemos aprender más sobre la cláusula SQL `Union`. La cláusula Union se utiliza para combinar resultados de múltiples declaraciones `SELECT`. Esto significa que, a través de una inyección UNION, podremos hacer un `SELECT` y volcar (_dump_) datos de todo el DBMS, desde múltiples tablas y bases de datos.

Intentemos usar el operador `UNION` en una base de datos de muestra. Primero, veamos el contenido de la tabla `ports`:
```SQL
mysql> SELECT * FROM ports;

+----------+-----------+
| code     | city      |
+----------+-----------+
| CN SHA   | Shanghai  |
| SG SIN   | Singapore |
| ZZ-21    | Shenzhen  |
+----------+-----------+
3 rows in set (0.00 sec)
```

A continuación, veamos la salida de la tabla `ships`:
```SQL
mysql> SELECT * FROM ships;

+----------+-----------+
| Ship     | city      |
+----------+-----------+
| Morrison | New York  |
+----------+-----------+
1 rows in set (0.00 sec)
```

Ahora, intentemos usar `UNION` para combinar ambos resultados:
```SQL
mysql> SELECT * FROM ports UNION SELECT * FROM ships;

+----------+-----------+
| code     | city      |
+----------+-----------+
| CN SHA   | Shanghai  |
| SG SIN   | Singapore |
| Morrison | New York  |
| ZZ-21    | Shenzhen  |
+----------+-----------+
4 rows in set (0.00 sec)
```

Como podemos ver, `UNION` combinó la salida de ambas declaraciones `SELECT` en una sola, por lo que las entradas de la tabla `ports` y la tabla `ships` se combinaron en una única salida con cuatro filas. Como se observa, algunas de las filas pertenecen a la tabla `ports` mientras que otras pertenecen a la tabla `ships`.

> **Nota:** Los tipos de datos de las columnas seleccionadas en todas las posiciones deben ser los mismos.

## Columnas Pares (Even Columns)

Una declaración `UNION` solo puede operar sobre declaraciones `SELECT` con un número igual de columnas. Por ejemplo, si intentamos hacer un `UNION` de dos consultas que tienen resultados con un número diferente de columnas, obtenemos el siguiente error:
```SQL
mysql> SELECT city FROM ports UNION SELECT * FROM ships;

ERROR 1222 (21000): The used SELECT statements have a different number of columns
```

La consulta anterior resulta en un error, ya que el primer `SELECT` devuelve una columna y el segundo `SELECT` devuelve dos. Una vez que tenemos dos consultas que devuelven el mismo número de columnas, podemos usar el operador `UNION` para extraer datos de otras tablas y bases de datos.

Por ejemplo, si la consulta es:
```SQL
SELECT * FROM products WHERE product_id = 'user_input'
```

Podemos inyectar una consulta `UNION` en la entrada (_input_), de tal manera que se devuelvan filas de otra tabla:
```SQL
SELECT * from products where product_id = '1' UNION SELECT username, password from passwords-- '
```

La consulta anterior devolvería las entradas de `username` y `password` de la tabla `passwords`, asumiendo que la tabla `products` tiene dos columnas.

## Columnas Desiguales (Un-even Columns)

Descubriremos que la consulta original generalmente no tendrá el mismo número de columnas que la consulta SQL que queremos ejecutar, así que tendremos que buscar una solución alternativa. Por ejemplo, supongamos que solo teníamos una columna. En ese caso, si queremos hacer un `SELECT`, podemos poner datos basura para las columnas restantes requeridas para que el número total de columnas con las que estamos haciendo el `UNION` siga siendo el mismo que el de la consulta original.

Por ejemplo, podemos usar cualquier cadena (_string_) como nuestros datos basura, y la consulta devolverá la cadena como su salida para esa columna. Si hacemos `UNION` con la cadena "junk", la consulta `SELECT` sería `SELECT "junk" from passwords`, lo cual siempre devolverá junk. También podemos usar números. Por ejemplo, la consulta `SELECT 1 from passwords` siempre devolverá 1 como salida.

> **Nota:** Al rellenar otras columnas con datos basura, debemos asegurarnos de que el tipo de datos coincida con el tipo de datos de las columnas; de lo contrario, la consulta devolverá un error. Para simplificar, usaremos números como nuestros datos basura, lo cual también será útil para rastrear las posiciones de nuestros payloads, como discutiremos más adelante.

> **Tip:** Para inyecciones SQL avanzadas, tal vez queramos simplemente usar `'NULL'` para rellenar otras columnas, ya que `'NULL'` se adapta a todos los tipos de datos.

La tabla `products` tiene dos columnas en el ejemplo anterior, por lo que tenemos que hacer `UNION` con dos columnas. Si solo quisiéramos obtener una columna (por ejemplo, `username`), tenemos que hacer `username, 2`, de tal manera que tengamos el mismo número de columnas:
```SQL
SELECT * from products where product_id = '1' UNION SELECT username, 2 from passwords
```

Si tuviéramos más columnas en la tabla de la consulta original, tenemos que agregar más números para crear las columnas restantes requeridas. Por ejemplo, si la consulta original usó `SELECT` en una tabla con cuatro columnas, nuestra inyección `UNION` sería:
```SQL
UNION SELECT username, 2, 3, 4 from passwords-- '
```

Esta consulta devolvería:
```SQL
mysql> SELECT * from products where product_id UNION SELECT username, 2, 3, 4 from passwords-- '

+-----------+-----------+-----------+-----------+
| product_1 | product_2 | product_3 | product_4 |
+-----------+-----------+-----------+-----------+
|   admin   |    2      |    3      |    4      |
+-----------+-----------+-----------+-----------+
```

Como podemos ver, nuestra salida deseada de la consulta `UNION SELECT username from passwords` se encuentra en la primera columna de la segunda fila, mientras que los números rellenaron las columnas restantes.