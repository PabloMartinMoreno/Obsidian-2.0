---
aliases:
tags:
  - type/cheatsheet
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

# Well-Known URIs

El estándar **.well-known**, definido en el **RFC 8615**, sirve como un directorio estandarizado dentro del dominio raíz de un sitio web.  
Esta ubicación designada —normalmente accesible a través de la ruta `/.well-known/` en un servidor web— centraliza metadatos críticos del sitio, incluyendo archivos de configuración e información relacionada con servicios, protocolos y mecanismos de seguridad.

Al establecer un punto de ubicación consistente para estos datos, **.well-known** simplifica el proceso de descubrimiento y acceso para navegadores, aplicaciones y herramientas de seguridad.  
Gracias a este enfoque unificado, los clientes pueden localizar y recuperar automáticamente configuraciones específicas construyendo la URL adecuada.  
Por ejemplo, para acceder a la política de seguridad de un sitio, un cliente podría solicitar:

```
https://example.com/.well-known/security.txt
```

La **IANA (Internet Assigned Numbers Authority)** mantiene un registro de las URIs bajo `.well-known`, cada una con un propósito específico definido por diferentes estándares y especificaciones.

## Ejemplos comunes de URIs Well-Known

|URI Suffix|Descripción|Estado|Referencia|
|---|---|---|---|
|**security.txt**|Contiene información de contacto para que investigadores de seguridad reporten vulnerabilidades.|Permanente|[RFC 9116](https://datatracker.ietf.org/doc/html/rfc9116)|
|**change-password**|Proporciona una URL estándar para redirigir a los usuarios a una página de cambio de contraseña.|Provisional|[W3C Specification](https://w3c.github.io/webappsec-change-password-url/#the-change-password-well-known-uri)|
|**openid-configuration**|Define detalles de configuración para _OpenID Connect_, una capa de identidad sobre el protocolo OAuth 2.0.|Permanente|[OpenID Connect Discovery](http://openid.net/specs/openid-connect-discovery-1_0.html)|
|**assetlinks.json**|Se usa para verificar la propiedad de activos digitales (por ejemplo, apps) asociados a un dominio.|Permanente|[Digital Asset Links](https://github.com/google/digitalassetlinks/blob/master/well-known/specification.md)|
|**mta-sts.txt**|Especifica la política para _SMTP MTA Strict Transport Security (MTA-STS)_, mejorando la seguridad del correo electrónico.|Permanente|[RFC 8461](https://datatracker.ietf.org/doc/html/rfc8461)|

Estos son solo algunos ejemplos de las muchas URIs registradas en IANA.  
Cada una ofrece pautas y requisitos específicos para su implementación, asegurando un uso estandarizado del mecanismo **.well-known** en distintas aplicaciones.

## .well-known en el reconocimiento web

En **reconocimiento web (web recon)**, las URIs bajo `.well-known` pueden ser extremadamente valiosas para descubrir _endpoints_ y detalles de configuración que luego pueden explorarse durante una prueba de penetración.  
Una de las más útiles es **openid-configuration**.

## openid-configuration

La URI **openid-configuration** forma parte del protocolo _OpenID Connect Discovery_, una capa de identidad construida sobre OAuth 2.0.  
Cuando una aplicación cliente desea usar OpenID Connect para autenticación, puede obtener la configuración del proveedor de identidad accediendo a:

```
https://example.com/.well-known/openid-configuration
```

Este _endpoint_ devuelve un documento **JSON** con metadatos sobre los endpoints del proveedor, los métodos de autenticación compatibles, la emisión de tokens, y más.

```json
{
  "issuer": "https://example.com",
  "authorization_endpoint": "https://example.com/oauth2/authorize",
  "token_endpoint": "https://example.com/oauth2/token",
  "userinfo_endpoint": "https://example.com/oauth2/userinfo",
  "jwks_uri": "https://example.com/oauth2/jwks",
  "response_types_supported": ["code", "token", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"]
}
```

## Información útil obtenida del endpoint openid-configuration

El contenido de este endpoint puede revelar información clave para análisis y enumeración:

- **Descubrimiento de endpoints:**
    - _Authorization Endpoint:_ URL utilizada para solicitudes de autorización de usuario.
    - _Token Endpoint:_ URL donde se emiten los tokens.
    - _Userinfo Endpoint:_ Endpoint que devuelve la información del usuario autenticado.

- **JWKS URI:**  
    El campo `jwks_uri` apunta al _JSON Web Key Set_, que contiene las claves criptográficas usadas por el servidor.
    
- **Scopes y tipos de respuesta:**  
    Indican qué permisos y flujos de autenticación están soportados, lo cual ayuda a entender el alcance y las limitaciones de la implementación de OpenID Connect.
    
- **Detalles de algoritmos:**  
    Los algoritmos de firma soportados (por ejemplo, `RS256`) permiten analizar las medidas de seguridad implementadas.


## Conclusión

Explorar el registro de IANA y experimentar con las distintas URIs bajo `.well-known` es una excelente práctica para ampliar las oportunidades de reconocimiento web.  
Como se ve con el endpoint **openid-configuration**, estas URIs estandarizadas ofrecen acceso estructurado a metadatos y configuraciones críticas, lo que permite a los profesionales de seguridad construir un mapa más completo del entorno de seguridad de un sitio web.