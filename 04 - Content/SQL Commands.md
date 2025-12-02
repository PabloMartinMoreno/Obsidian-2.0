---
aliases:
tags:
  - type/cheatsheet
  - service/mysql
  - service/sql
  - meta/commands
  - meta/examples
  - tool/mysql
  - tool/mysql-client
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# Comandos SQL

***

## Cheatsheet

### Conexión y Gestión de Bases de Datos

|**Comando**|**Descripción**|
|---|---|
|`mysql -u root -h docker.hackthebox.eu -P 3306 -p`|Login a la base de datos remota.|
|`SHOW DATABASES;`|Listar bases de datos disponibles.|
|`USE users;`|Cambiar a la base de datos `users`.|

### Definición de Datos (DDL) - Tablas

|**Comando**|**Descripción**|
|---|---|
|`SHOW TABLES;`|Listar tablas en la DB actual.|
|`DESCRIBE logins;`|Ver columnas y propiedades de una tabla.|
|`CREATE TABLE logins (id INT, ...);`|Crear una tabla nueva.|
|`DROP TABLE logins;`|Eliminar una tabla.|
|`ALTER TABLE logins ADD newCol INT;`|Agregar una columna nueva.|
|`ALTER TABLE logins RENAME COLUMN old TO new;`|Renombrar una columna.|
|`ALTER TABLE logins MODIFY col DATE;`|Cambiar el tipo de dato de una columna.|
|`ALTER TABLE logins DROP col;`|Eliminar una columna.|

### Manipulación de Datos (DML/DQL) - Consultas

|**Comando**|**Descripción**|
|---|---|
|`SELECT * FROM table_name;`|Mostrar todas las columnas.|
|`SELECT col1, col2 FROM table;`|Mostrar columnas específicas.|
|`INSERT INTO table VALUES (val1,..);`|Insertar valores.|
|`UPDATE table SET col1=val1 WHERE <cond>;`|Actualizar valores existentes.|
|`SELECT * FROM table ORDER BY col1;`|Ordenar resultados.|
|`SELECT * FROM table ORDER BY col1 DESC;`|Ordenar descendente.|
|`SELECT * FROM table LIMIT 1, 2;`|Mostrar 2 resultados saltando el primero (offset 1).|
|`SELECT * FROM table WHERE name LIKE 'adm%';`|Buscar por patrón (wildcard).|

### Precedencia de Operadores

```
División `/`, Multiplicación `*`, Módulo `%`
Suma `+`, Resta `-`
Comparación `=`, `>`, `<`, `!=`, `LIKE`
NOT `!`
AND `&&`
OR `||`
```

---


