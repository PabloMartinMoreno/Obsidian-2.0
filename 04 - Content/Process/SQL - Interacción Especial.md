---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[SQL Commands]]"
---
# SQL - Interacción Especial

***

## Cheatsheet

|                  **Concepto Clave**                   |               **Sintaxis / Ejemplos (Exclusivo MySQL)**               |                                         **Ejemplo Práctico**                                          | **Propósito y Comportamiento (Uso Legítimo / DBA)**                                                                                                                                                                                                                                                          |
| :---------------------------------------------------: | :-------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|    <br><br><br>**Manejo de Errores y Excepciones**    |    <br><br><br>`SIGNAL SQLSTATE`, `DECLARE ... HANDLER`, `CAST()`     |       <br><br><br><br>`SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Saldo insuficiente';`       | <br>Forzar errores estructurados en MySQL se hace con `SIGNAL` (su equivalente a `RAISERROR`). Se usa dentro de procedimientos almacenados para validar reglas de negocio, abortar transacciones inválidas y devolver mensajes de excepción claros a la aplicación.<br><br>                                  |
| <br><br><br>**Peticiones de Red y Recursos Externos** | <br><br><br><br>`LOAD_FILE('\\\\servidor\\ruta')`, Motor `FEDERATED`  |               <br><br><br><br>`SELECT LOAD_FILE('\\\\fs01\\config\\db_settings.txt');`                | <br>MySQL no tiene funciones nativas HTTP. `LOAD_FILE()` se puede usar legítimamente en servidores Windows para leer configuraciones desde rutas de red compartidas (UNC). Para interactuar con otros servidores, el estándar es usar el motor `FEDERATED` para consultar bases de datos remotas.<br><br>    |
| <br><br><br>**Interacción con el Sistema Operativo**  |  <br><br><br><br>UDFs (`sys_eval()`, `sys_exec()`), comando `system`  | <br><br><br><br>`SELECT sys_exec('/usr/local/bin/backup_db.sh');` _(Requiere instalar el plugin UDF)_ | <br>MySQL **no tiene** ejecución de comandos nativa (no existe `xp_cmdshell`). Para hacerlo desde el motor, un DBA debe instalar plugins en C/C++ llamados _User Defined Functions_ (UDFs) para automatizar tareas (ej. disparar un script de backup). Desde el cliente de consola, se usa `system`.<br><br> |
|          **Lectura y Escritura de Archivos**          | <br><br><br><br><br>`INTO OUTFILE`, `LOAD DATA INFILE`, `LOAD_FILE()` |        <br><br><br><br><br>`SELECT * FROM logs INTO OUTFILE '/var/lib/mysql-files/logs.csv';`         | <br>Directivas nativas para entrada/salida de datos físicos (restringidas por la variable `secure_file_priv`). Son el estándar absoluto para exportar tablas masivas a CSV, hacer volcados estructurados o importar gigabytes de datos desde archivos de texto de forma ultra rápida.<br><br>                |
^sql-interaccionEspecial

---

## Overview

Ir más allá de las consultas tradicionales implica interactuar con las características avanzadas y, a menudo, documentadas marginalmente del motor de base de datos. Comprender cómo el sistema maneja las excepciones internas o cómo interactúa con el sistema operativo y la red subyacente es la frontera final antes de entrar de lleno en la explotación. Estas interacciones especiales me permiten extraer datos a través de mensajes de diagnóstico del propio servidor o, en escenarios de máxima restricción, obligar a la base de datos a enviar la información directamente a un servidor externo bajo mi control.


___
