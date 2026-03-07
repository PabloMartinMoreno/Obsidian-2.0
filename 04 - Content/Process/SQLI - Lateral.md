---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLI - Lateral

***

## Cheatsheet

|**Vector de Explotación**|**Parámetro / Entorno**|**Payload Estructural (Ejemplo Oracle)**|**Contexto y Mecánica de Ejecución**|
|---|---|---|---|
|Manipulación de Sesión|`NLS_DATE_FORMAT`|`ALTER SESSION SET NLS_DATE_FORMAT = '"'' AND 1=1--"';`|Modifico variables de entorno de la base de datos a nivel de sesión. Cuando el aplicativo invoca `SYSDATE` o realiza conversiones implícitas, el formato inyectado detona la carga útil.|
|Conversiones Implícitas|Tipos `DATE` o `NUMBER`|`SELECT TO_CHAR(SYSDATE) FROM dual;` (Bajo el contexto alterado previamente)|Evade las sanitizaciones tradicionales. El aplicativo confía ciegamente en que las variables tipadas rígidamente (fechas o números) no pueden contener código malicioso.|
|Procedimientos Almacenados|Parámetros `OUT` o `IN OUT`|Inyección anidada dentro de variables de retorno esperadas como fechas.|Aprovecha paquetes PL/SQL vulnerables que construyen SQL dinámico (ej. `EXECUTE IMMEDIATE`) concatenando variables locales que heredan formatos de sesión corruptos.|
|Truncamiento de Cadenas|Límites de `VARCHAR` / `CHAR`|`A` x 4000 caracteres + `' OR 1=1--`|Fuerza el desbordamiento o truncamiento lógico en variables temporales internas, provocando que se eliminen comillas de cierre dinámicas y el payload adjunto escape al contexto de ejecución.|


___

## Overview

El [[Lateral SQL Injection]] es un vector de ataque avanzado, documentado principalmente en entornos [[Oracle]], que rompe el paradigma clásico de la inyección de cadenas de texto. En lugar de atacar directamente los campos de entrada de la aplicación, mi objetivo es envenenar el entorno de ejecución de la sesión de la base de datos o explotar tipos de datos considerados "seguros", como `DATE` o `NUMBER`.

Al alterar dinámicamente parámetros de configuración globales de mi sesión (por ejemplo, el formato de fecha mediante `ALTER SESSION`), provoco que cualquier conversión posterior realizada por el sistema (como un `TO_CHAR(SYSDATE)`) concatene e interprete mi código malicioso oculto en el esquema de formato. Esto me permite evadir los WAFs y los filtros de validación de entrada, ya que la aplicación web asume erróneamente que los datos que no son de tipo `VARCHAR` son inherentemente inmunes a la inyección.


***
