---
aliases:
tags:
  - type/cheatsheet
  - service/mysql
  - protocol/mysql
  - port/3306
  - tool/mysql
  - tool/nmap
  - meta/db-users
  - meta/credentials
  - meta/schemas
  - technique/credential-access
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# MySQL Enumeration (3306)

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo nmap -sV -sC -p 3306 <target>` (NMAP)|Escaneo con Nmap sobre el servicio MySQL, mostrará el nombre de host y la versión.|
|`mysql -u <user> -p -h <target>` (MYSQL)|Conecta al servidor MySQL.|

---

## Artículos Eelacionados

- [[SQL Commands]]: consultas para interactuar con el servidor MySQL.

---

### Overview

*MySQL es un sistema de gestión de bases de datos relacional (RDBMS) de código abierto, ampliamente utilizado para aplicaciones web.*

MariaDB, una bifurcación popular de MySQL, también es de código abierto y compatible con MySQL.

MySQL almacena datos sensibles como contraseñas, típicamente en forma cifrada, aunque es posible el almacenamiento en texto plano.  

Utiliza comandos SQL para interactuar con bases de datos relacionales, permitiendo a los usuarios consultar, actualizar y administrar datos.

El puerto predeterminado para MySQL es **TCP 3306**.