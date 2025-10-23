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
---
# Comandos SQL

***

## Cheatsheet

### Enumeration

|Acción|Descripción|
|---|---|
|`SHOW databases;`|Muestra todas las bases de datos.|
|`USE <database>;`|Selecciona una de las bases de datos existentes.|
|`SHOW TABLES;`|Muestra todas las tablas disponibles en la base de datos seleccionada.|
|`DESCRIBE <table>;`|Muestra todas las columnas y su tipo en la tabla seleccionada.|
|`SHOW COLUMNS FROM <table>;`|Muestra todas las columnas de la tabla seleccionada.|

### SELECT Statement

|Comando|Descripción|
|---|---|
|`SELECT * FROM <table>;`|Muestra todas las columnas de la tabla indicada.|
|`SELECT <column_X>, <column_Y> FROM <table>;`|Muestra algunas columnas específicas de la tabla indicada.|
|`SELECT * FROM <table> WHERE <column> = "<string>";`|Busca la cadena necesaria en la tabla indicada (filtra por condición).|

### INSERT Statement

|Comando|Descripción|
|---|---|
|`INSERT INTO <table> VALUES (<column_value_1>, <column_value_2>);`|Inserta valores en una tabla. Las columnas se asumen por orden.|
|`INSERT INTO <table>(<column_X>, <column_Y>) VALUES (<value_X>, <value_Y>);`|Inserta valores para columnas específicas en una tabla. El resto de columnas quedan vacías o con su valor por defecto.|

### UPDATE Statement

|Comando|Descripción|
|---|---|
|`UPDATE <table> SET <column_X>=<value_X>, <column_Y>=<value_Y>, ... WHERE <condition>;`|Actualiza un registro específico en la tabla según una condición.|

### Table Manipulation

|Comando|Descripción|
|---|---|
|`DROP <table>;`|Elimina una tabla de la base de datos.|
|`ALTER TABLE <table> ADD <new-column> <data-type>;`|Agrega una columna a una tabla.|
|`ALTER TABLE <table> RENAME <new-column> <data-type>;`|Cambia el nombre de una columna de la tabla.|

### Results

|Comando|Descripción|
|---|---|
|`<query> ORDER BY <column> <ASC/DESC>`|Ordena el resultado de una consulta por la columna indicada. Si no se especifica, ordena en orden ascendente.|
|`<query> ORDER BY <column_X> <ASC/DESC>, <column_Y> <ASC/DESC>`|Ordena el resultado por múltiples columnas. El orden importa: la primera columna tiene prioridad.|
|`<query> LIMIT <number-of-records>`|Limita el resultado de la consulta a un número de registros.|
|`<query> LIMIT <offset> <number-of-records>`|Limita el resultado a un número de registros empezando desde un índice dado.|
|`<query> WHERE <column> LIKE 'admin%';`|Usado con `WHERE`. `LIKE` hace coincidencia por patrón: `%` es comodín para cualquier cantidad de caracteres, `_` para un solo carácter.|
