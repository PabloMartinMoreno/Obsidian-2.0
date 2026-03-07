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
# SQLI - Routed

***

## Cheatsheet

|**Componente de Red / Nivel**|**Función en la Arquitectura**|**Manipulación y Evolución del Payload**|**Consideraciones de Evasión**|
|---|---|---|---|
|Gateway / API de Entrada|Punto de contacto inicial. Recibe la petición HTTP y valida el formato.|`{"tenant_id": "5", "query": "1' OR '1'='1"}`|El payload original debe respetar estrictamente la estructura esperada por el gateway (ej. JSON, XML) para evitar rechazos por validación de esquema.|
|Middleware / Broker|Analiza parámetros inocuos (como `tenant_id`) para enrutar la petición al clúster correspondiente.|Empaqueta la carga útil en un nuevo formato de transporte interno o la inserta en una cola de mensajes.|Mi inyección en el campo `query` permanece latente, aprovechando que el middleware solo inspecciona y procesa las variables de enrutamiento.|
|Motor Intermedio (Linked)|Actúa como puente. Ejecuta una consulta para comunicarse con el SGBD final (ej. `dblink` en PostgreSQL u `OpenQuery` en MSSQL).|`SELECT * FROM OPENQUERY(TargetDB, 'SELECT * FROM data WHERE id = ''1'''' OR ''''1''''=''''1''')`|Constituye el desafío principal. Exige inyectar comillas anidadas, escapes múltiples o codificación (Hex) para evitar que el nodo intermedio rompa la sintaxis al reensamblar la consulta.|
|SGBD Objetivo (Target)|Recibe la consulta final desencapsulada y la procesa directamente en su motor.|El payload se ejecuta limpio: `SELECT * FROM data WHERE id = '1' OR '1'='1'`|La vulnerabilidad detona en un entorno aislado. Al carecer de conexión directa con la respuesta HTTP inicial, la confirmación y exfiltración de datos requieren forzosamente técnicas de [[OOB SQLi]].|


___

## Overview

El [[Routed SQLi]] es un vector de ataque diseñado para arquitecturas distribuidas, microservicios o entornos con bases de datos enlazadas. La inyección no ocurre en el primer sistema que procesa la entrada, sino que el payload es transportado como un dato inerte a través de múltiples saltos de red y consultas intermedias hasta alcanzar un motor backend secundario donde finalmente se concatena de forma insegura y se ejecuta.

Mi objetivo en esta técnica es la "supervivencia del payload". Debo prever cómo cada nodo intermedio codificará, escapará o reensamblará mi cadena de texto, construyendo inyecciones con múltiples capas de anidamiento (como comillas cuádruples) que se vayan pelando en cada salto hasta llegar intactas y activas a la base de datos objetivo, ubicada en las capas más profundas de la infraestructura.


***
