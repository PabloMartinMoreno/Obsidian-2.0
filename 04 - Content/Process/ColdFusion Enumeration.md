---
aliases:
tags:
  - type/cheatsheet
  - pentesting/recon/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# ColdFusion Enumeration

***

## CheatSheet

| Acción                                                                                                                                                                                                                                           | Descripción                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sudo nmap -sS --open -p 80,443,1935,25,8500,5500 <target>`                                                                                                                                                                                      | Escanea puertos comunes relacionados con ColdFusion que estén abiertos.                                                                                                                               |
| `curl <coldfusion-root> \| grep -i ‘ColdFusion’`                                                                                                                                                                                                 | ColdFusion instala archivos por defecto como `admin.cfm`.                                                                                                                                             |
| <br>`curl <coldfusion-root>/CFIDE/administrator/index.cfm`                                                                                                                                                                                       | ColdFusion instala archivos por defecto como `CFIDE/administrator/index.cfm`; su presencia puede indicar una aplicación basada en ColdFusion y además pueden revelar la versión exacta.               |
| Buscando archivos `.cfm` y `.cfc`:<br><br>`ffuf -w /usr/share/dirb/wordlists/common.txt -u <coldfusion-root>/FUZZ.cfm` **(archivos CFM)**<br><br>`ffuf -w /usr/share/dirb/wordlists/common.txt -u <coldfusion-root>/FUZZ.cfc` **(archivos CFC)** | <br><br>Las aplicaciones ColdFusion usan extensiones `.cfm` (ColdFusion Markup) y `.cfc` (ColdFusion Components). Encontrar estos archivos puede indicar que la aplicación está hecha con ColdFusion. |
| <br>Prestar atención a errores                                                                                                                                                                                                                   | Si una aplicación basada en ColdFusion muestra errores, los mensajes pueden hacer referencia a etiquetas o funciones específicas de ColdFusion, revelando más detalles del sistema.                   |

## Descripción general

ColdFusion es una plataforma de desarrollo de aplicaciones web y un lenguaje de scripting usado para construir sitios dinámicos e integrar bases de datos.

ColdFusion se encuentra comúnmente en los siguientes puertos:

- `80` (HTTP): comunicación HTTP no segura entre servidor web y navegador.
    
- `443` (HTTPS): comunicación HTTP segura (cifrada).
    
- `1935` (RPC): facilita comunicación cliente-servidor (Remote Procedure Call).
    
- `25` (SMTP): usado para enviar correos mediante SMTP.
    
- `8500` (SSL): comunicación del servidor sobre SSL (puerto administrativo por defecto en algunas instalaciones).
    
- `5500` (Server Monitor): soporte para administración remota del servidor ColdFusion.
    

## ColdFusion Markup Language (CFML)

ColdFusion Markup Language (CFML) es un lenguaje de scripting propietario usado en ColdFusion para construir aplicaciones web dinámicas, con una sintaxis similar a HTML que lo hace accesible para desarrolladores web.

CFML provee etiquetas y funciones integradas para tareas comunes como interacción con bases de datos, servicios web y envío de correo.

Ejemplo (traducción directa del ejemplo):

```cfml
<cfquery name="exampleQuery" datasource="exampleDataSource">
  SELECT * FROM exampleTable
</cfquery>

<cfloop query="exampleQuery">
  <p>#exampleQuery.columnA# #exampleQuery.columnB#</p>
</cfloop>
```

---

**Nota importante:** Esta información provista es una traducción del contenido que enviaste. Tené en cuenta que las técnicas descritas son de naturaleza dual (pueden usarse para auditorías autorizadas o para actividades no autorizadas). Usalas únicamente en entornos que controlás o con permiso explícito del propietario del sistema. Si querés, puedo ayudarte a reformular el documento para un contexto defensivo (por ejemplo, para un taller de auditoría interna o una guía de mitigación). ¿Lo hago?