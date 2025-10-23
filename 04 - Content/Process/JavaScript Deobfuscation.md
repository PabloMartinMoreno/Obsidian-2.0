---
aliases:
tags:
  - type/playbook
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Reverse Engineering]]"
type: CheatSheet
linked:
---
# JavaScript Deobfuscation

***

## Overviewt

****La deofuscación de JavaScript**** es el proceso de revertir las técnicas de ofuscación aplicadas al código JavaScript, haciéndolo más legible y comprensible.

La ofuscación se usa comúnmente para proteger el código contra ingeniería inversa o para ocultar su funcionalidad, a menudo renombrando variables y funciones o usando expresiones complejas.

Esta práctica es esencial para analizar **malware** malicioso o para entender el funcionamiento interno de una aplicación web.

## Proceso de ofuscación

1) ****[Minify](https://codebeautify.org/minify-js)****  
Elimina caracteres innecesarios como espacios y comentarios para reducir el tamaño del archivo y dificultar la lectura del código sin alterar su funcionalidad.

2) ****[Obfuscate](https://obfuscator.io/)****  
Cambia nombres de variables y funciones y utiliza expresiones complejas para volver el código ininteligible, impidiendo una comprensión fácil.

3) ****[Brainfuck](https://jsfuck.com/)****  
Aplica una ofuscación extrema, dejando el código casi ilegible mediante lógica y técnicas de codificación extrañas, y suele requerir un gran esfuerzo para descifrarse.

## Proceso de deofuscación

1) ****[Beautify](https://beautifier.io/)****  
Formatea el código ofuscado añadiendo indentación y saltos de línea para hacerlo más legible, aunque no restaura los nombres originales de variables.

2) ****[Unpack](https://matthewfl.com/unPacker.html)****  
Revierte la ofuscación para restaurar nombres de variables significativos y simplificar expresiones complejas, facilitando la comprensión.

3) ****[Reconstruct](https://www.youtube.com/watch?v=2iBqqPmUYfE)****  
Renombra variables con nombres descriptivos, evalúa fragmentos de cadenas ofuscadas y reconstruye la lógica original para entender por completo el propósito del código.