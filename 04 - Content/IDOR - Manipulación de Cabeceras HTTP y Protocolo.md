---
aliases:
tags:
  - type/cheatsheet
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Web Explotación]]"
type: CheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Manipulación de Cabeceras HTTP y Protocolo

***

## Cheatsheet

| **Técnica**                                                    | **Descripción**                                                                                                                                                                                               | **Cabecera Original (Ejemplo)**               | **Cabecera Modificada (Ejemplo)**                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| <br>**Inyección en Cabeceras Personalizadas (Custom Headers)** | <br>Modificación de cabeceras no estándar (típicamente prefijadas con `X-`) que el backend o los microservicios utilizan internamente para identificar al usuario o el contexto.<br><br>                      | <br><br>`X-User-Id: 105`                      | <br><br>`X-User-Id: 106`                                      |
| <br>**Spoofing de la Cabecera Referer**                        | <br>Alteración del `Referer` cuando la aplicación valida la autorización para acceder a un objeto basándose en la página desde la cual se originó la petición.<br><br>                                        | <br>`Referer: https://app.com/user/105`       | <br>`Referer: https://app.com/user/106`                       |
| <br>**Manipulación de Enrutamiento (Tenant IDOR)**             | <br>Cambio en cabeceras utilizadas en arquitecturas SaaS para identificar a qué organización (Tenant) pertenece la petición, permitiendo el cruce de datos entre clientes.<br><br>                            | <br><br>`X-Tenant-Id: org_A`                  | <br><br>`X-Tenant-Id: org_B`                                  |
| <br>**HTTP Method Override**                                   | <br>Uso de cabeceras específicas para engañar al enrutador de la API y forzar la ejecución de un método HTTP diferente, evadiendo controles de acceso a nivel de ruta y accediendo al objeto.<br><br>         | <br>`POST /api/user/105` <br>`(Sin cabecera)` | <br>`POST /api/user/106`<br><br>`X-HTTP-Method-Override: PUT` |
| <br>**Content-Type Juggling**                                  | <br>Cambio del tipo de contenido declarado para forzar al servidor a usar un analizador (_parser_) alternativo que pueda tener reglas de autorización más laxas sobre los identificadores procesados.<br><br> | <br>`Content-Type: application/json`          | <br>`Content-Type: application/xml`                           |
| <br>**Bypass de Confianza de Proxy**                           | <br>Falsificación de cabeceras de proxy para simular que la petición proviene de un servicio interno de confianza o una IP administrativa, obteniendo acceso a identificadores restringidos.<br><br>          | <br><br>`(Sin cabecera de proxy)`             | <br>`X-Forwarded-For: 127.0.0.1`<br>`X-Internal-Access: true` |
^idor-http

## Estrategias de Evaluación y Testing

Durante la revisión de la postura de seguridad y el análisis de [[API Security]], el escrutinio de las cabeceras HTTP requiere inspeccionar más allá de la superficie documentada de la API:
- Analizar el tráfico de red en busca de cabeceras ocultas o no documentadas que se envían desde el cliente hacia el servidor, especialmente en aplicaciones de una sola página (SPA) o clientes móviles.
- Utilizar herramientas de fuerza bruta de directorios o fuzzing para descubrir cabeceras ocultas como `X-Account-Id`, `X-Profile-Id` o `X-Role` que podrían estar siendo procesadas por un proxy inverso o un [[API Gateway]].
- Probar la eliminación total de cabeceras de autorización secundarias para observar si el sistema realiza un _fail-open_ (permite el acceso por defecto al fallar la validación) sobre el objeto referenciado en la URL o el cuerpo.

### Principios de Mitigación

La protección contra la manipulación a nivel de protocolo exige una arquitectura de confianza cero ([[Zero Trust]]) en la frontera de la aplicación:
- Tratar todas las cabeceras HTTP entrantes como entradas de usuario no confiables, del mismo modo que se trata la URL o el cuerpo de la petición.
- Establecer la identidad del usuario y sus permisos exclusivamente a través de mecanismos de sesión seguros e inalterables desde el lado del cliente (como un [[JWT Atacks]] validado).
- Configurar los proxies inversos y los balanceadores de carga para que eliminen sistemáticamente cualquier cabecera interna de enrutamiento o autorización (`X-User-Id`, `X-Forwarded-For`) si la petición proviene directamente del internet público, reescribiéndolas solo de manera controlada dentro de la red privada.

***
