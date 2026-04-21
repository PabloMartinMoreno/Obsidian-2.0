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
  - "[[SQL Injection (SQLi)]]"
---
# SQLi - Lateral

***

## Cheatsheet

|   **Vector de Explotación**    |      **Parámetro / Entorno**      |                     **Payload Estructural (Ejemplo Oracle)**                     |                                                                                    **Contexto y Mecánica de Ejecución**                                                                                    |
|:------------------------------:|:---------------------------------:|:--------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|   <br>Manipulación de Sesión   |       <br>`NLS_DATE_FORMAT`       |           <br>`ALTER SESSION SET NLS_DATE_FORMAT = '"'' AND 1=1--"';`            |    <br>Modifico variables de entorno de la base de datos a nivel de sesión. Cuando el aplicativo invoca `SYSDATE` o realiza conversiones implícitas, el formato inyectado detona la carga útil.<br><br>    |
|  <br>Conversiones Implícitas   |    <br>Tipos `DATE` o `NUMBER`    | <br>`SELECT TO_CHAR(SYSDATE) FROM dual;` (Bajo el contexto alterado previamente) |            <br>Evade las sanitizaciones tradicionales. El aplicativo confía ciegamente en que las variables tipadas rígidamente (fechas o números) no pueden contener código malicioso.<br><br>            |
| <br>Procedimientos Almacenados |  <br>Parámetros `OUT` o `IN OUT`  |   <br>Inyección anidada dentro de variables de retorno esperadas como fechas.    |              <br>Aprovecha paquetes PL/SQL vulnerables que construyen SQL dinámico (ej. `EXECUTE IMMEDIATE`) concatenando variables locales que heredan formatos de sesión corruptos.<br><br>              |
|  <br>Truncamiento de Cadenas   | <br>Límites de `VARCHAR` / `CHAR` |                   <br><br>`A` x 4000 caracteres + `' OR 1=1--`                   | <br>Fuerza el desbordamiento o truncamiento lógico en variables temporales internas, provocando que se eliminen comillas de cierre dinámicas y el payload adjunto escape al contexto de ejecución.<br><br> |
^sqli-lateral

___

## Overview

El [[Lateral SQL Injection]] es un vector de ataque avanzado, documentado principalmente en entornos [[Oracle]], que rompe el paradigma clásico de la inyección de cadenas de texto. En lugar de atacar directamente los campos de entrada de la aplicación, mi objetivo es envenenar el entorno de ejecución de la sesión de la base de datos o explotar tipos de datos considerados "seguros", como `DATE` o `NUMBER`.

Al alterar dinámicamente parámetros de configuración globales de mi sesión (por ejemplo, el formato de fecha mediante `ALTER SESSION`), provoco que cualquier conversión posterior realizada por el sistema (como un `TO_CHAR(SYSDATE)`) concatene e interprete mi código malicioso oculto en el esquema de formato. Esto me permite evadir los WAFs y los filtros de validación de entrada, ya que la aplicación web asume erróneamente que los datos que no son de tipo `VARCHAR` son inherentemente inmunes a la inyección.


***
