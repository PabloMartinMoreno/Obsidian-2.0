---
aliases:
  - "SSL"
  - "TLS (Transport Layer Security)"
  - "Protocolo TLS/SSL"
  - "openssl"
  - SSL/TLS
  - TLS
tags:
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: Concept
linked:
---
#  Protocolo SSL

## Definición 

> [!INFO] SSL (**S**ecure **S**ockets **L**ayer)
> Es un protocolo criptográfico diseñado para proporcionar comunicación segura a través de una red informática, como Internet. Fue desarrollado por Netscape en la década de 1990 y ha sido reemplazado por su sucesor, TLS (Transport Layer Security), aunque el término "SSL" todavía se utiliza comúnmente para referirse a ambos protocolos.

## Principios Fundamentales de SSL

1. **Cifrado**: SSL utiliza cifrado para proteger los datos transmitidos entre un cliente y un servidor, asegurando que la información sea ilegible para cualquier persona que intente interceptarla.

2. **Autenticación**: SSL utiliza certificados digitales para autenticar la identidad del servidor (y opcionalmente del cliente), asegurando que los datos se envían al destinatario correcto y no a un impostor.

3. **Integridad**: SSL utiliza códigos de autenticación de mensajes (MAC) para verificar la integridad de los datos, asegurando que no hayan sido alterados durante la transmisión.

## Funcionamiento de SSL

### 1. **Handshake de SSL**

   - **Inicio del Handshake**: El cliente envía un mensaje "ClientHello" al servidor, indicando la versión de SSL/TLS soportada, las opciones de cifrado (cipher suites), y datos aleatorios generados por el cliente.
   - **Respuesta del Servidor**: El servidor responde con un mensaje "ServerHello" que contiene la versión de SSL/TLS, la cipher suite seleccionada, y datos aleatorios generados por el servidor.
   - **Autenticación del Servidor**: El servidor envía su certificado digital al cliente. El cliente verifica este certificado usando la cadena de confianza hasta una autoridad certificadora (CA) de confianza.
   - **Intercambio de Claves**: Dependiendo de la cipher suite seleccionada, el cliente y el servidor intercambian claves para establecer una clave secreta compartida. En SSL, esto a menudo implica el uso de RSA o Diffie-Hellman.
   - **Finalización del Handshake**: El cliente y el servidor envían mensajes "Finished" para indicar que el handshake ha concluido y que la comunicación segura puede comenzar.

### 2. **Cifrado de Datos**

   - **Comunicación Segura**: Una vez que el handshake ha terminado, el cliente y el servidor utilizan la clave secreta compartida para cifrar y descifrar los datos transmitidos. Esto asegura que la comunicación sea confidencial y segura.

## Versiones de SSL/TLS

- **SSL 1.0**: Nunca fue lanzado públicamente debido a problemas de seguridad.
- **SSL 2.0**: Publicado en 1995, pero rápidamente considerado inseguro.
- **SSL 3.0**: Publicado en 1996, solucionó muchos problemas de SSL 2.0 pero también fue eventualmente considerado inseguro.
- **TLS 1.0**: Publicado en 1999 como sucesor de SSL 3.0. Proporciona mejoras de seguridad y es considerado seguro con configuraciones adecuadas.
- **TLS 1.1 y 1.2**: Publicados en 2006 y 2008 respectivamente, ofrecen mejoras adicionales en seguridad y rendimiento.
- **TLS 1.3**: Publicado en 2018, simplifica el handshake, mejora la seguridad y el rendimiento, y elimina soporte para algoritmos obsoletos.

## Vulnerabilidades y Ataques Comunes

- **Heartbleed**: Una vulnerabilidad en la biblioteca OpenSSL que permitía a los atacantes leer la memoria del servidor, exponiendo datos sensibles.
- **POODLE**: Un ataque que explota el uso de SSL 3.0, permitiendo a los atacantes descifrar datos cifrados.
- **BEAST**: Un ataque que explota una vulnerabilidad en el cifrado CBC (Cipher Block Chaining) en TLS 1.0.
- **CRIME**: Un ataque que explota la compresión TLS para revelar información sensible.

## Implementaciones de SSL/TLS

- **OpenSSL**: Una implementación ampliamente utilizada que soporta SSL y TLS.
- **GnuTLS**: Una implementación de TLS que forma parte del Proyecto GNU.
- **Microsoft SChannel**: La implementación de Microsoft para Windows.
- **NSS (Network Security Services)**: Una biblioteca desarrollada por Mozilla que soporta SSL y TLS.

## Uso de SSL/TLS

SSL/TLS se utiliza en una variedad de aplicaciones, incluyendo:

- **Navegadores Web**: Para cifrar la comunicación entre el navegador y el servidor web.
- **Correo Electrónico**: Para proteger la comunicación entre clientes de correo y servidores (IMAP, POP3, SMTP).
- **VPNs**: Para cifrar el tráfico de red en túneles seguros.
- **Mensajería Instantánea**: Para asegurar la comunicación entre clientes de mensajería y servidores.

## Resumen

SSL/TLS es fundamental para la seguridad en Internet, proporcionando confidencialidad, integridad y autenticación. Aunque SSL ha sido reemplazado por TLS, el término SSL sigue siendo comúnmente utilizado para referirse a ambos. Las versiones más recientes de TLS, especialmente TLS 1.3, ofrecen un alto nivel de seguridad y rendimiento, siendo esenciales para la protección de datos en tránsito.

---

## Recon TLS

```bash
# Info básica
openssl s_client -connect <target>:443 -showcerts

# SNI específico
openssl s_client -connect <target>:443 -servername <vhost>

# Probar versión TLS específica
openssl s_client -connect <target>:443 -tls1_2

# Listar ciphers soportados
nmap --script ssl-enum-ciphers -p 443 <target>

# testssl.sh (comprehensive)
testssl.sh https://<target>/

# sslyze (rápido + JSON)
sslyze --regular <target>:443
```

---

## Findings comunes

| Hallazgo | Severidad | Notas |
|---|---|---|
| **TLS 1.0 / 1.1 enabled** | Medium | Deprecated por PCI/IETF |
| **SSLv2 / SSLv3** | High | POODLE, DROWN |
| **Weak ciphers** (RC4, DES, 3DES, EXPORT) | Medium-High | Sweet32, FREAK |
| **No HSTS** | Low | Falta `Strict-Transport-Security` |
| **Cert expirado** | Info-High | Cert mgmt issue |
| **Self-signed cert** | Info | Posible MITM target |
| **Wildcard cert** | Info | Reuse cross-subdomain |
| **CN mismatch** | Medium | MITM vector |
| **Heartbleed** (CVE-2014-0160) | Critical | OpenSSL < 1.0.1g |
| **CRIME / BREACH** | Medium | Compression-based info leak |
| **Logjam** | Medium | Weak DH params |
| **ROBOT** | High | RSA padding oracle |

---

## Info recon via cert

```bash
# Subject Alternative Names → subdomains
openssl s_client -connect <target>:443 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -text -noout | grep -A1 "Subject Alternative"

# Cert Transparency logs (alternativa, OSINT)
curl -s "https://crt.sh/?q=<domain>&output=json" | jq -r '.[].name_value'
```

---

## Versiones — TLS 1.2 vs 1.3

|  | **TLS 1.2** | **TLS 1.3** |
|---|---|---|
| Handshake | 2 RTT | 1 RTT (0-RTT con resumption) |
| Cipher suites | Muchas, incluye débiles (RC4, CBC, RSA kex) | Solo AEAD (AES-GCM, ChaCha20-Poly1305) |
| Key exchange | RSA o (EC)DHE | Solo (EC)DHE → **forward secrecy** obligatorio |
| Negociación | En claro | Cifrada antes → menos info leak |
| Legacy | Permite SHA-1, MD5, RSA kex, compresión | Eliminados |

**TLS 1.3** (RFC 8446) es más rápido y seguro por diseño: forward secrecy obligatorio, solo AEAD, menos superficie. **TLS 1.0/1.1** deprecated; **1.2** es el mínimo aceptable hoy.

^tls-versiones

---

## Notas Relacionadas

- [[Certificate Transparency Logs]]
- [[Subdomains Passive Enumeration]]
- [[Web Fingerprinting]]
