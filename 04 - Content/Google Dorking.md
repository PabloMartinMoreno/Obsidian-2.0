---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/passive
  - asset/domain
  - asset/web-app
  - meta/osint
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Passive Reconnaissance & OSINT]]"
type: CheatSheet
linked:
---
# Google Dorking

***

## Cheatsheet

| **Operador**           | **Descripción**                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `site:<target-domain>` | Restringe los resultados de búsqueda a un dominio específico.                                                                                                |
| `intext:<string>`      | Restringe los resultados a páginas que contengan el texto especificado en cualquier parte del cuerpo.                                                        |
| `filetype:<extension>` | Restringe los resultados para incluir solo archivos de cierto tipo, basado en su tipo MIME o extensión. Ej.: `txt`, `pdf`, `php`, etc.                       |
| `ext:<extension>`      | Restringe los resultados basándose estrictamente en la extensión de archivo, en lugar del tipo MIME. Ej.: `txt`, `pdf`, `php`, etc.                          |
| `intitle:<string>`     | Restringe los resultados que contienen una cadena específica dentro del título. Ej.: `intitle:"index of"` puede encontrar páginas de listado de directorios. |
| `inurl:<string>`       | Restringe los resultados a URLs que contienen la cadena especificada. Ej.: `.env`, `admin`                                                                   |
| `-<operator>`          | Niega un operador anteponiéndole un signo menos, excluyendo resultados que coincidan con el criterio dado.                                                   |

Se pueden combinar operadores en una sola consulta para búsquedas más refinadas.

La [Google Hacking Database](https://www.exploit-db.com/google-hacking-database) es un recurso valioso para técnicas de búsqueda adicionales.

## Descripción general

El _Google dorking_ es la práctica de usar operadores de búsqueda avanzados para encontrar información específica o vulnerabilidades en la web que no son fácilmente accesibles mediante consultas de búsqueda estándar.

Esta técnica consiste en crear consultas precisas usando los operadores de Google para descubrir datos sensibles o ocultos, como bases de datos expuestas, páginas de inicio de sesión y archivos sin protección.

## Todos los atajos

| Operador              | Descripción                                                                    | Ejemplo                                             | Descripción del Ejemplo                                                            |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `site:`               | Limita los resultados a un sitio web o dominio específico.                     | `site:example.com`                                  | Encuentra todas las páginas públicas en example.com.                               |
| `inurl:`              | Busca páginas con un término específico en la URL.                             | `inurl:login`                                       | Busca páginas de inicio de sesión en cualquier sitio web.                          |
| `filetype:`           | Busca archivos de un tipo particular.                                          | `filetype:pdf`                                      | Encuentra documentos PDF descargables.                                             |
| `intitle:`            | Busca páginas con un término específico en el título.                          | `intitle:"confidential report"`                     | Busca documentos con el título “confidential report” o similares.                  |
| `intext:` o `inbody:` | Busca un término dentro del texto del cuerpo de las páginas.                   | `intext:"password reset"`                           | Identifica páginas que contienen el término “password reset”.                      |
| `cache:`              | Muestra la versión en caché de una página web (si está disponible).            | `cache:example.com`                                 | Ve la versión en caché de example.com para observar su contenido anterior.         |
| `link:`               | Encuentra páginas que enlazan a una página específica.                         | `link:example.com`                                  | Identifica sitios que enlazan a example.com.                                       |
| `related:`            | Encuentra sitios web relacionados con una página específica.                   | `related:example.com`                               | Descubre sitios similares a example.com.                                           |
| `info:`               | Proporciona un resumen de información sobre una página web.                    | `info:example.com`                                  | Obtiene detalles básicos sobre example.com (título, descripción, etc.).            |
| `define:`             | Muestra definiciones de una palabra o frase.                                   | `define:phishing`                                   | Obtiene definiciones del término “phishing” de distintas fuentes.                  |
| `numrange:`           | Busca números dentro de un rango específico.                                   | `site:example.com numrange:1000-2000`               | Encuentra páginas en example.com con números entre 1000 y 2000.                    |
| `allintext:`          | Encuentra páginas que contienen todas las palabras especificadas en el cuerpo. | `allintext:admin password reset`                    | Busca páginas con las palabras “admin” y “password reset” en el texto.             |
| `allinurl:`           | Encuentra páginas que contienen todas las palabras especificadas en la URL.    | `allinurl:admin panel`                              | Busca páginas con “admin” y “panel” en la URL.                                     |
| `allintitle:`         | Encuentra páginas que contienen todas las palabras especificadas en el título. | `allintitle:confidential report 2023`               | Busca páginas con “confidential”, “report” y “2023” en el título.                  |
| `AND`                 | Restringe los resultados requiriendo que todos los términos estén presentes.   | `site:example.com AND (inurl:admin OR inurl:login)` | Busca páginas de admin o login exclusivamente en example.com.                      |
| `OR`                  | Amplía los resultados incluyendo páginas con cualquiera de los términos.       | `"linux" OR "ubuntu" OR "debian"`                   | Busca páginas que mencionen Linux, Ubuntu o Debian.                                |
| `NOT`                 | Excluye resultados que contengan el término especificado.                      | `site:bank.com NOT inurl:login`                     | Encuentra páginas en bank.com que no incluyan login.                               |
| `*` (comodín)         | Representa cualquier carácter o palabra.                                       | `site:socialnetwork.com filetype:pdf user* manual`  | Busca manuales de usuario (user guide, user handbook) en PDF en socialnetwork.com. |
| `..` (rango)          | Busca resultados dentro de un rango numérico.                                  | `site:ecommerce.com "price" 100..500`               | Busca productos con precios entre 100 y 500 en un sitio de e-commerce.             |
| `" "` (comillas)      | Busca frases exactas.                                                          | `"information security policy"`                     | Encuentra documentos que contengan la frase exacta “information security policy”.  |
| `-` (signo menos)     | Excluye términos de los resultados.                                            | `site:news.com -inurl:sports`                       | Busca artículos en news.com excluyendo contenido deportivo.                        |
