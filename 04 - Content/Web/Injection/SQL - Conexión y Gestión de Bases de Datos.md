---
aliases:
tags:
  - type/cheatsheet
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Commands]]"
---
# SQL - Conexión y Gestión de Bases de Datos

***

## Cheatsheet

|        **Concepto Clave**         |           **Sintaxis Básica / Símbolo**           |                      **Ejemplo Práctico**                      | **Propósito y Comportamiento**                                                                                                                                         |
|:---------------------------------:|:-------------------------------------------------:|:--------------------------------------------------------------:| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   <br>**Conexión al Servidor**    | <br>`mysql -u [usuario] -h [host] -P [puerto] -p` | <br>`mysql -u root -h docker.hackthebox.eu -P 3306 -p`<br><br> | <br>Establece la conexión inicial desde la terminal hacia el motor de base de datos, especificando credenciales y destino.<br><br>                                     |
|   <br>**Listar Bases de Datos**   |               <br>`SHOW DATABASES;`               |                     <br>`SHOW DATABASES;`                      | <br>Muestra todos los esquemas (bases de datos) alojados en el servidor a los que el usuario actual tiene permiso de acceso.<br><br>                                   |
| <br>**Seleccionar Base de Datos** |            <br><br>`USE [nombre_bd];`             |               <br><br>`USE information_schema;`                | <br>Cambia el contexto de trabajo a una base de datos específica. Es un paso obligatorio antes de poder interactuar con las tablas directamente.<br><br>               |
|       <br>**Listar Tablas**       |                <br>`SHOW TABLES;`                 |                       <br>`SHOW TABLES;`                       | <br>Despliega una lista con todas las tablas y vistas contenidas dentro de la base de datos que está actualmente en uso.<br><br>                                       |
|  <br>**Inspeccionar Estructura**  |  <br>`DESCRIBE [nombre_tabla];`<br>_(o `DESC`)_   |                   <br><br>`DESCRIBE users;`                    | <br>Devuelve el esquema interno de una tabla. Muestra los nombres de las columnas, sus tipos de datos (int, varchar, etc.), claves y si aceptan valores nulos.<br><br> |
|       <br>**Cerrar Sesión**       |             <br>`exit`, `quit` o `\q`             |                           <br>`exit`                           | <br>Cierra la conexión de forma segura y devuelve el control a la terminal del sistema operativo.<br><br>                                                              |
^sql-conexion

***

## Overview



***
