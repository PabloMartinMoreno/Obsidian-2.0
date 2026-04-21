---
aliases:
tags:
  - type/cheatsheet
  - technique/recon/active
  - technique/recon/passive
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Fingerprinting

El **fingerprinting** se enfoca en extraer detalles técnicos sobre las tecnologías que impulsan un sitio web o una aplicación web. De manera similar a cómo una huella dactilar identifica de forma única a una persona, las “huellas digitales” de los servidores web, sistemas operativos y componentes de software pueden revelar información crítica sobre la infraestructura del objetivo y posibles debilidades de seguridad. Este conocimiento permite a los atacantes adaptar sus ataques y explotar vulnerabilidades específicas de las tecnologías identificadas.

El fingerprinting es una piedra angular del reconocimiento web por varias razones:

- **Ataques dirigidos:** al conocer las tecnologías específicas en uso, los atacantes pueden concentrar sus esfuerzos en exploits y vulnerabilidades conocidas para esos sistemas, aumentando significativamente las probabilidades de éxito.
    
- **Identificación de configuraciones incorrectas:** el fingerprinting puede exponer software desactualizado o mal configurado, configuraciones por defecto u otras debilidades que podrían pasar desapercibidas con otros métodos.
    
- **Priorización de objetivos:** ante múltiples posibles blancos, el fingerprinting ayuda a priorizar los esfuerzos identificando los sistemas más propensos a ser vulnerables o contener información valiosa.
    
- **Construcción de un perfil completo:** combinar los datos del fingerprinting con otros hallazgos del reconocimiento permite crear una visión integral de la infraestructura del objetivo, ayudando a entender su postura general de seguridad y posibles vectores de ataque.


---

## Técnicas de Fingerprinting

Existen varias técnicas utilizadas para el fingerprinting de servidores web y tecnologías:

### Banner Grabbing

Consiste en analizar los banners que presentan los servidores web u otros servicios. Estos banners suelen revelar el software del servidor, números de versión y otros detalles.

### Análisis de cabeceras HTTP

Las cabeceras HTTP que se envían con cada solicitud y respuesta contienen mucha información.  
La cabecera `Server` suele indicar el software del servidor web, mientras que `X-Powered-By` puede revelar tecnologías adicionales como lenguajes de scripting o frameworks.

### Sondeo con respuestas específicas

Enviar solicitudes especialmente diseñadas puede provocar respuestas únicas que revelen tecnologías o versiones concretas.  
Por ejemplo, ciertos mensajes de error o comportamientos son característicos de determinados servidores o componentes.

### Análisis del contenido de la página

La estructura, scripts y otros elementos de una página web pueden dar pistas sobre las tecnologías subyacentes.  
A veces hay encabezados de copyright que mencionan el software utilizado.

---

## Herramientas comunes para Fingerprinting

|Herramienta|Descripción|Características|
|---|---|---|
|**Wappalyzer**|Extensión de navegador y servicio en línea para perfilar tecnologías web.|Identifica una amplia gama de tecnologías, incluyendo CMS, frameworks, herramientas de análisis, etc.|
|**BuiltWith**|Perfilador de tecnologías web que ofrece reportes detallados sobre la pila tecnológica de un sitio.|Planes gratuitos y pagos con distintos niveles de detalle.|
|**WhatWeb**|Herramienta de línea de comandos para fingerprinting de sitios web.|Usa una gran base de firmas para identificar múltiples tecnologías.|
|**Nmap**|Escáner de red versátil usado para diversas tareas de reconocimiento, incluyendo fingerprinting de servicios y sistemas operativos.|Puede usar scripts (NSE) para fingerprinting más especializado.|
|**Netcraft**|Ofrece servicios de seguridad web, incluyendo fingerprinting y reportes de seguridad.|Proporciona información detallada sobre tecnología, hosting y postura de seguridad.|
|**wafw00f**|Herramienta de línea de comandos diseñada para identificar Firewalls de Aplicaciones Web (WAF).|Detecta la presencia, tipo y configuración de un WAF.|

---

## Fingerprinting de inlanefreight.com

Apliquemos nuestro conocimiento de fingerprinting para descubrir el “ADN digital” del host de práctica **inlanefreight.com**, usando técnicas manuales y automáticas para recopilar información sobre su servidor web, tecnologías y posibles vulnerabilidades.

---

### Banner Grabbing

El primer paso es obtener información directamente del servidor web usando `curl` con la opción `-I` (o `--head`) para recuperar solo las cabeceras HTTP, sin el contenido completo de la página.

```bash
curl -I inlanefreight.com
```

```
HTTP/1.1 301 Moved Permanently
Date: Fri, 31 May 2024 12:07:44 GMT
Server: Apache/2.4.41 (Ubuntu)
Location: https://inlanefreight.com/
Content-Type: text/html; charset=iso-8859-1
```

Esto revela que el sitio usa **Apache/2.4.41 en Ubuntu**. Además, redirige a `https://inlanefreight.com/`, por lo que se debe analizar también ese banner:

```bash
curl -I https://inlanefreight.com
```

```
HTTP/1.1 301 Moved Permanently
Date: Fri, 31 May 2024 12:12:12 GMT
Server: Apache/2.4.41 (Ubuntu)
X-Redirect-By: WordPress
Location: https://www.inlanefreight.com/
Content-Type: text/html; charset=UTF-8
```

Ahora se observa que **WordPress** realiza la redirección.  
Al consultar la URL final:

```bash
curl -I https://www.inlanefreight.com
```

```
HTTP/1.1 200 OK
Date: Fri, 31 May 2024 12:12:26 GMT
Server: Apache/2.4.41 (Ubuntu)
Link: <https://www.inlanefreight.com/index.php/wp-json/>; rel="https://api.w.org/"
Content-Type: text/html; charset=UTF-8
```

La ruta `wp-json` confirma que el sitio usa **WordPress**.

---

### Detección de WAF con wafw00f

Los **WAF (Web Application Firewalls)** protegen las aplicaciones web contra varios tipos de ataques.  
Antes de continuar, conviene saber si el sitio usa uno, ya que podría interferir o bloquear nuestras solicitudes.

```bash
wafw00f inlanefreight.com
```

```
[+] The site https://inlanefreight.com is behind Wordfence (Defiant) WAF.
```

El análisis revela que el sitio está protegido por **Wordfence**, un WAF desarrollado por **Defiant**.  
Esto indica una capa de seguridad adicional que podría filtrar nuestras pruebas.

---

### Fingerprinting con Nikto

**Nikto** es un escáner de servidores web de código abierto que, además de buscar vulnerabilidades, ofrece capacidades de fingerprinting útiles.

Ejecutar solo los módulos de identificación de software:

```bash
nikto -h inlanefreight.com -Tuning b
```

---

#### Resultados del análisis

- **IPs detectadas:** `134.209.24.248` (IPv4) y `2a03:b0c0:1:e0::32c:b001` (IPv6)
- **Servidor:** Apache/2.4.41 (Ubuntu)
- **CMS:** WordPress (detectada la página `/wp-login.php`)
- **Archivos expuestos:** `license.txt`
- **Cabeceras faltantes o inseguras:**
    - Falta `Strict-Transport-Security`
    - Falta `X-Content-Type-Options`
    - Cabecera `x-redirect-by: WordPress` sin seguridad adecuada

---

## Conclusión

El análisis muestra un **sitio WordPress sobre Apache en Ubuntu**, protegido por un **WAF Wordfence**, con **algunas cabeceras inseguras y software desactualizado**.


## Ejercicios 

```bash
curl -s -I http://app.inlanefreight.local
curl -s http://app.inlanefreight.local | grep '<meta name="generator"'
nikto -h http://dev.inlanefreight.local -Tuning b
```