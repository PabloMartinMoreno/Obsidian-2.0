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
type: Technique
linked:
  - '[[File Inclusion]]'
---
# LFI To RCE - Phar Deserialization

***

## Cheatsheet

|              **Técnica**              |                                            **Descripción**                                             |                                        **Payload**                                        |
| :-----------------------------------: | :----------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------: |
|        <br><br>**Phar básico**        |     <br>Crear un archivo PHAR con metadata serializada maliciosa y accederlo via `phar://`<br><br>     |                      <br>`phar:///var/www/uploads/evil.phar`<br><br>                      |
|   <br>**Phar disfrazado de imagen**   |            <br>Renombrar el .phar a extensión de imagen para evadir validaciones de upload             | <br>Upload: `evil.jpg` (contenido PHAR) → LFI: `phar:///var/www/uploads/evil.jpg`<br><br> |
|    <br>**Phar con polyglot JPEG**     |           <br>Construir un archivo que sea JPEG válido y PHAR válido simultáneamente<br><br>           |              <br>Polyglot JPEG/PHAR que pasa validaciones de imagen<br><br>               |
|     <br>**Phar con polyglot GIF**     |                 <br>Lo mismo pero con formato GIF usando magic bytes `GIF89a`<br><br>                  |                   <br>`GIF89a` + stub PHAR + metadata maliciosa<br><br>                   |
| <br>**Phar con polyglot PNG**<br><br> |                      <br>Construir un polyglot PNG/PHAR que pase re-renderización                      |               <br>PNG válido con PHAR embebido en chunks auxiliares<br><br>               |
| <br>**Phar + gadget chain conocida**  |            <br>Usar gadget chains de frameworks populares (Laravel, Symfony, etc.)<br><br>             |           <br>Metadata con objetos serializados del framework objetivo<br><br>            |
|         <br>**Phar + phpggc**         |                           <br>Generar el payload automáticamente con phpggc                            |             <br>`phpggc Laravel/RCE1 system id -p phar -o evil.phar`<br><br>              |
|    <br>**Phar + file operations**     | <br>Triggear la deserialización con funciones que no son `include` (file_exists, is_dir, etc.)<br><br> |       <br>`file_exists('phar:///tmp/evil.phar')` triggerea deserialización<br><br>        |
|   <br>**Phar con metadata anidada**   |     <br>Anidar múltiples objetos serializados para construir cadenas complejas de gadgets<br><br>      |                <br>Metadata con objetos encadenados tipo POP chain<br><br>                |
|     <br>**Phar + tar/zip format**     |            <br>Usar formatos alternativos de PHAR (tar o zip) para evadir detección<br><br>            |            <br>PHAR en formato TAR que no tiene la signature estándar<br><br>             |
^lfi-deserialization


***

## Overview

Phar Deserialization es la técnica más avanzada de LFI → RCE. Los archivos PHAR (PHP Archive) contienen una sección de metadata que se almacena como un objeto PHP serializado. Cuando cualquier operación de filesystem de PHP procesa una ruta que usa el wrapper `phar://`, automáticamente deserializa esa metadata, incluso funciones aparentemente inofensivas como `file_exists()`, `is_dir()` o `filesize()`. Si el atacante logra subir un archivo PHAR al servidor (aunque sea disfrazado como imagen) y existe una gadget chain disponible en las clases cargadas por la aplicación, puede lograr RCE. Requiere conocimiento de serialización PHP, análisis de código para encontrar gadget chains, y la capacidad de subir un archivo al servidor. Herramientas como `phpggc` simplifican la generación de payloads para frameworks conocidos, pero en aplicaciones custom el atacante debe construir la cadena manualmente analizando el código fuente.


***
