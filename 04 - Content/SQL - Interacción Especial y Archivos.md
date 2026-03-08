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
# SQL - Interacción Especial y Archivos

***

## Cheatsheet

| **Concepto Clave**                                     | **Sintaxis / Ejemplos (Multimotor)**                                                                         | **Ejemplo Práctico**                                                                                                                           | **Propósito y Comportamiento (Uso Legítimo / DBA)**                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br><br>**Manejo de Errores y Excepciones**            | <br>`TRY...CATCH` *(SQL Server, PG)*<br>`SIGNAL` / `DECLARE HANDLER` *(MySQL)*<br><br>                       | <br><br>`BEGIN TRY UPDATE cuentas SET saldo = saldo - 100; END TRY BEGIN CATCH PRINT 'Error en la transacción'; END CATCH;` _(Ej. SQL Server)_ | <br><br>Permite capturar y gestionar errores estructurados dentro de procedimientos almacenados o transacciones. Es vital para validar reglas de negocio, abortar (hacer _rollback_) operaciones inválidas de forma segura y devolver mensajes claros a la aplicación.<br><br>                                |
| <br><br><br>**Peticiones a Recursos y DBs Externas**   | <br>`Linked Servers` *(SQL Server)*<br>`Foreign Data Wrappers` *(Postgres)*<br>`FEDERATED` *(MySQL)*<br><br> | <br><br><br>`SELECT * FROM OPENQUERY(ServidorRemoto, 'SELECT id FROM ventas');` _(Ej. SQL Server)_                                             | <br><br><br>Mecanismos estándar para consultar bases de datos remotas u orígenes de datos externos como si fueran tablas locales. Es la base arquitectónica para armar sistemas distribuidos, integraciones entre sucursales o migración de datos en vivo.                                                    |
| <br><br><br>**Interacción con el Sistema Operativo**   | <br>`xp_cmdshell` *(SQL Server)*<br>`COPY ... PROGRAM` *(Postgres)*<br>UDFs en C/C++ *(MySQL)*<br><br>       | <br><br><br>`COPY tabla FROM PROGRAM 'unzip -p /ruta/archivo.zip';` _(Ej. PostgreSQL)_                                                         | <br><br>Funciones altamente restringidas que permiten al motor ejecutar comandos directos en el sistema operativo subyacente. Los administradores (DBAs) las usan para automatizar tareas, como disparar scripts de _backup_ o mover archivos. Por seguridad, casi siempre vienen deshabilitadas por defecto. |
| <br><br><br>**Lectura y Escritura Masiva de Archivos** | <br>`COPY ... TO/FROM` *(Postgres)*<br>`BULK INSERT` *(SQL Server)*<br>`INTO OUTFILE` *(MySQL)*<br><br>      | <br><br><br>`COPY logs TO '/var/lib/postgres/logs.csv' WITH CSV HEADER;` _(Ej. PostgreSQL)_                                                    | <br><br>Directivas nativas para la entrada y salida de datos a nivel físico. Son el estándar absoluto para exportar tablas masivas a CSV, hacer volcados estructurados o importar gigabytes de datos desde archivos de texto a una velocidad muchísimo mayor que usando un simple `INSERT`.                   |
^sql-interaccionEspecial

---

## Overview

Ir más allá de las consultas tradicionales implica interactuar con las características avanzadas y, a menudo, documentadas marginalmente del motor de base de datos. Comprender cómo el sistema maneja las excepciones internas o cómo interactúa con el sistema operativo y la red subyacente es la frontera final antes de entrar de lleno en la explotación. Estas interacciones especiales me permiten extraer datos a través de mensajes de diagnóstico del propio servidor o, en escenarios de máxima restricción, obligar a la base de datos a enviar la información directamente a un servidor externo bajo mi control.


___
