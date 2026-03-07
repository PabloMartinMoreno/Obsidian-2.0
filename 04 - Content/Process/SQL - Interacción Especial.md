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

|                **Concepto Clave**                 |            **Sintaxis / Ejemplos (Exclusivo MySQL)**            |                                       **Ejemplo Práctico**                                        | **Propósito y Comportamiento (Uso Legítimo / DBA)** |
| :-----------------------------------------------: | :-------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------: | --------------------------------------------------- |
|    <br><br>**Manejo de Errores y Excepciones**    | <br><br><br>`SIGNAL SQLSTATE`, `DECLARE ... HANDLER`, `CAST()`  |       <br><br><br>`SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Saldo insuficiente';`       | <br><br><br>                                        |
| <br><br>**Peticiones de Red y Recursos Externos** |  <br><br>`LOAD_FILE('\\\\servidor\\ruta')`, Motor `FEDERATED`   |                 <br><br>`SELECT LOAD_FILE('\\\\fs01\\config\\db_settings.txt');`                  | <br><br><br>                                        |
| <br><br>**Interacción con el Sistema Operativo**  | <br><br><br>UDFs (`sys_eval()`, `sys_exec()`), comando `system` | <br><br><br>`SELECT sys_exec('/usr/local/bin/backup_db.sh');` _(Requiere instalar el plugin UDF)_ | <br><br><br>                                        |
|    <br><br>**Lectura y Escritura de Archivos**    |  <br><br><br>`INTO OUTFILE`, `LOAD DATA INFILE`, `LOAD_FILE()`  |          <br><br><br>`SELECT * FROM logs INTO OUTFILE '/var/lib/mysql-files/logs.csv';`           | <br><br><br>                                        |
^sql-interaccionEspecial

---

## Overview

Ir más allá de las consultas tradicionales implica interactuar con las características avanzadas y, a menudo, documentadas marginalmente del motor de base de datos. Comprender cómo el sistema maneja las excepciones internas o cómo interactúa con el sistema operativo y la red subyacente es la frontera final antes de entrar de lleno en la explotación. Estas interacciones especiales me permiten extraer datos a través de mensajes de diagnóstico del propio servidor o, en escenarios de máxima restricción, obligar a la base de datos a enviar la información directamente a un servidor externo bajo mi control.


___
