---
aliases:
  - Web Exploitation
  - Explotación Web
tags:
  - technique/exploitation/web
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
kind: Tertiary Category
linked:
  - "[[Web Enumeración]]"
---
# Explotación Web

---

## 💉 Injection Attacks
  Ataques que inyectan datos maliciosos para engañar al intérprete y ejecutar comandos no autorizados.

- [[SQL Injection (SQLi)]]
- [[NoSQL Injection]] (Inyección en bases de datos modernas como MongoDB para evadir autenticación o extraer datos.)
- [[GraphQL Injection]] (Vulnerabilidades específicas de APIs GraphQL: introspection abuse, inyecciones en resolvers, batching para bypass de rate limit, IDOR via global IDs, mass assignment via mutations, DoS por queries recursivas.)
- [[LDAP Injection]] (Manipulación de consultas LDAP para acceder a directorios de usuarios internos.)
- [[OS Command Injection]] (Ejecución directa de comandos del sistema operativo en el servidor.)
- [[Server-Side Template Injection (SSTI)]] (Inyección de código en plantillas web para obtener RCE.)
- [[Server-Side Includes (SSI) Injection]] (Server-Side Includes: Inyección de directivas en servidores web para RCE.)
- [[CRLF Injection]] (Inyección de caracteres `\r\n` en headers/body/protocolos: header injection (Set-Cookie/CSP bypass), HTTP response splitting + XSS, cache poisoning, SMTP email injection, log forgery, HRS combo, Memcached/Redis injection.)
- [[HTTP Parameter Pollution]] (Multiple values del mismo parameter explotando differential entre stacks: WAF bypass via param split, auth bypass front/back diferencial, SQLi en ASP.NET concat, Mass Assignment combo, logic flow manipulation.)
### XML Attacks
- [[XML External Entity (XXE)]] (Abuso del procesamiento XML para leer archivos o realizar SSRF.)
- [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side Injection]] (Inyección de transformaciones maliciosas para RCE o lectura de archivos.)


## 📂 File System & Inclusion
  Manipulación de la entrada para acceder, leer o subir archivos en el servidor.

- [[File Inclusion]] (Inclusión de archivos locales del servidor en la respuesta web.)
- [[Directory Traversal]] (Navegación fuera del directorio raíz web para leer archivos sensibles.)
- [[Remote File Inclusion (RFI)]] (Inclusión de archivos alojados externamente para ejecutar código remoto.)
- [[File Upload - Vulnerabilidades]] (Subida de archivos maliciosos para obtener ejecución de código.)


## 🛡 Access Control & Authentication
  Fallos en la verificación de identidad o en los permisos de acceso a recursos.

- [[Authentication & Authorization Bypass]] (Evasión de mecanismos de login o restricciones de acceso.)
- [[JWT Attacks]] (Manipulación de tokens de sesión: None algorithm, cambio de firmas, fuerza bruta de secretos.)
- [[OAuth 2.0 Misconfigurations]] (Abuso de flujos de autenticación federada para secuestrar cuentas.)
- [[HTTP Brute Forcing]] (Ataques de fuerza bruta contra formularios de login o autenticación básica.)
- [[BOLA - IDOR]] (Referencia directa a objetos inseguros para acceder a datos de otros usuarios.)
- [[Session Hijacking]] (Robo o forge de sesión authenticated: cookie theft via XSS / MITM / sniffing, weak HMAC crack, JWT manipulation, fixation pre-auth, replay long-lived tokens, CSWSH, cookie tossing cross-subdomain.)


## 🎭 Client-Side Attacks
  Ataques que apuntan a los usuarios de la aplicación web.

- [[Cross-Site Scripting (XSS)]] (Ejecución de scripts maliciosos en el navegador de la víctima.)
- [[Cross-Site Request Forgery (CSRF)]] (Forzar al navegador del usuario a realizar acciones no deseadas.)
- [[Clickjacking]] (Uso de iFrames transparentes para engañar al usuario y que haga clic en botones ocultos.)
- [[HTML Injection]] (Inyección de etiquetas HTML para phishing o desfiguración del sitio.)


## 🔌 Server-Side Logic Flaws
 Vulnerabilidades en la lógica de procesamiento del lado del servidor.

- [[Server-Side Request Forgery (SSRF)]] (Forzar al servidor a realizar peticiones a recursos internos o externos.)
- [[Insecure Deserialization]] (Manipulación de datos serializados para ejecutar código o alterar la lógica.)
- [[Prototype Pollution]] (Modificación de `Object.prototype` en runtimes JS para inyectar propiedades heredadas globalmente — habilita RCE, auth bypass, XSS via gadgets.)
- [[Race Conditions]] (Explotación de concurrencia para realizar acciones simultáneas no permitidas, ej: gastar el mismo saldo dos veces.)
- [[Open Redirect]] (Redirección no validada vía parámetro reflejado: phishing UX, OAuth code theft, SSRF chain bypass, XSS via `javascript:`, token leak via Referer.)
- [[Mass Assignment]] (Modificación de campos de objetos internos (ej: `is_admin`) a través de APIs que no filtran la entrada.)
- [[Web Cache Poisoning]] (Manipulación de la caché del servidor para servir contenido malicioso a otros usuarios.)
- [[HTTP Request Smuggling]]
- [[Host Header Injection]]
- [[Subdomain Takeover]] (Reclamo de subdomains con DNS dangling: CNAME a third-party services deleted (S3/Heroku/GitHub Pages), NS takeover, expired domain reclaim — chains con cookie scope, OAuth redirect_uri, CSP bypass, email spoofing.)


## 🎯 Specific Application Exploitation
 Guías de explotación para software web común.

- [[WordPress Exploitation]]
- [[IIS Exploitation]]
- [[Drupal Exploitation]] (Exploits específicos como Drupalgeddon.)
- [[Joomla Exploitation]] (Vulnerabilidades comunes en componentes de Joomla.)
- [[Tomcat & Jenkins Exploitation]] (Ataques específicos a servidores de aplicaciones Java.)



---