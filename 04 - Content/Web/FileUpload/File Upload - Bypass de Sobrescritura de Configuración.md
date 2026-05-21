---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Bypass de Configuración

***

## Cheatsheet

|        **Categoría del Bypass**         |                         **Técnica / Vector**                         | **Descripción y Ejecución Práctica**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :-------------------------------------: | :------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    <br><br>**Directivas de Apache**     |                 <br><br>Sobrescritura de `.htaccess`                 | <br>Si el servidor es Apache y tiene `AllowOverride All` (o parcial) habilitado, podés subir este archivo oculto para redefinir qué extensiones se ejecutan como PHP.<br><br>_Prueba:_ Subir un archivo llamado `.htaccess` con el contenido: `AddType application/x-httpd-php .txt`. Luego subir tu payload como `shell.txt`. El servidor lo ejecutará como código PHP.<br><br>                                                                                                                                                       |
| <br><br>**Directivas de PHP (CGI/FPM)** |                <br><br>Envenenamiento de `.user.ini`                 | <br>En servidores modernos que corren PHP vía FastCGI, el archivo `.user.ini` permite sobrescribir configuraciones nativas de PHP a nivel de directorio, sin necesitar privilegios de root.<br><br>_Prueba:_ Subir un `.user.ini` con: `auto_prepend_file = "imagen.jpg"`. Luego subir `imagen.jpg` (con código PHP incrustado). Finalmente, visitar **cualquier** archivo `.php` legítimo de ese directorio; el código de tu imagen se ejecutará antes que el script legítimo.<br><br>                                                |
| <br><br>**Directivas de IIS / Windows** |                <br><br>Sobrescritura de `web.config`                 | <br>El equivalente de `.htaccess` pero para entornos Microsoft (Internet Information Services). Permite mapear extensiones personalizadas al motor de ASP.NET.<br><br>_Prueba:_ Subir un `web.config` que contenga reglas en XML para asignar la extensión `.pdf` al manejador `aspq-isapi`. Luego subir tu webshell de ASPX renombrada a `shell.pdf`.<br><br>                                                                                                                                                                         |
| <br><br>**Ataques a Entornos Modernos** | <br><br>Sobrescritura de Dependencias o Templates (Node.js / Python) | <br>En frameworks modernos (Express, Flask, Django), no hay `.htaccess`. El ataque de configuración consiste en aprovechar la subida de archivos (especialmente si hay extracción de `.zip` o Path Traversal) para sobrescribir archivos críticos del entorno.<br><br>_Prueba:_ Subir un archivo renombrado a `../../package.json` para alterar los scripts de inicio en Node, o sobrescribir un archivo de plantilla (ej. `index.html` en la carpeta `templates/` de Flask) inyectando Server-Side Template Injection (SSTI).<br><br> |
^fu-conf

```ad-note
Para que estos ataques funcionen, se tienen que dar dos condiciones clave:

1. El filtro de subida no debe estar bloqueando específicamente los nombres `.htaccess`, `.user.ini` o `web.config`.
2. Los archivos subidos deben guardarse en un directorio que sea **accesible públicamente** y donde el servidor web aplique estas configuraciones (si los guarda en un bucket de S3 o fuera del _web root_, estas configuraciones serán texto muerto).
```


___
