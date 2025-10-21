---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[Web Server Enumeration]]"
---
# Tomcat Enumeration

***

## Cheatsheet

| **Action**                                               | **Description**                                                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -s http://<tomcat-root>:8080/docs/ \| grep Tomcat` | **(CURL, GREP)** Se revela la versión de Tomcat. La versión también puede identificarse frecuentemente a partir del encabezado de respuesta del servidor. |
| [[Web Server Enumeration]]                               | Herramientas como Wappalyzer y WhatWeb pueden tener dificultades para identificar Tomcat de forma efectiva.                                               |
| Check `/docs` directory                                  | Acceder directamente al directorio `/docs` para confirmar la versión de Tomcat.                                                                           |

## Overview

[Apache Tomcat](https://tomcat.apache.org/) es un servidor web de código abierto diseñado para alojar aplicaciones basadas en Java. Originalmente creado para ejecutar Java Servlets y Jakarta Server Pages (anteriormente JavaServer Pages o JSP), con el tiempo se convirtió en un estándar para desplegar frameworks Java como Spring y herramientas como Gradle.

Durante pruebas de intrusión internas es común encontrar múltiples instancias de Tomcat dentro de una red. Muchas están mal configuradas; al menos una instancia suele usar credenciales débiles o por defecto. Esta mala configuración puede facilitar el acceso no autorizado a interfaces administrativas como `/manager`.

Si se consigue una **vulnerabilidad de lectura de archivos locales** en el objetivo, se podrán leer ficheros de configuración críticos como `conf/tomcat-users.xml` o `WEB-INF/web.xml`, revelando información sensible incluyendo nombres de usuario, contraseñas en texto claro, descriptores de despliegue y rutas de la aplicación.

Tomcat se encuentra más comúnmente en los puertos **8080 (HTTP)** y **8443 (HTTPS)**.

## Sensitive Files

```
<tomcat-root>/
├── ...
├── conf/
│   ├── tomcat-users.xml  # Almacena credenciales en texto claro para el acceso de gestión de Tomcat
│   └── ...
├── webapps/
│   └── <app-name>/
│       └── WEB-INF/       # Configuración y archivos core
│           ├── jsp/       # Jakarta Server Pages para la lógica de frontend
│           ├── web.xml    # Descriptor de despliegue; define servlets, seguridad y patrones de URL
│           ├── lib/       # Librerías externas (JARs) usadas por la app
│           ├── classes/   # Clases Java compiladas (servlets, filters, etc.)
│           └── ...
└── ...
```

## The default Tomcat root directory can vary

- Linux/macOS: `/usr/local/tomcat` o `/opt/tomcat`
- Windows: `C:\Program Files\Apache Software Foundation\Tomcat x.x`