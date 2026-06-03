---
aliases:
tags:
  - estado/incompleto
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: Concept
linked:
  - "[[HTTPS]]"
---
# Flujo de Comunicación HTTPS

---

## Cheatsheet

- **Puerto por defecto:** TCP 443.
- **Componentes clave:** [[Protocolo TLS/SSL]], [[Cifrado Asimétrico]] (apretón de manos), [[Cifrado Simétrico]] (transferencia de datos), [[Certificado Digital X.509]].
- **Fases principales:**
    1. _Handshake TCP:_ Establecimiento de la conexión básica.
    2. _Handshake TLS:_ Negociación de seguridad, autenticación y acuerdo de claves.
    3. _Transferencia de datos:_ Intercambio seguro mediante cifrado simétrico.
    4. _Cierre:_ Finalización de la sesión segura.

## Overview

El protocolo HTTPS (Hypertext Transfer Protocol Secure) es la versión segura de HTTP. Utiliza el protocolo criptográfico [[TLS (Transport Layer Security)]] (o históricamente [[SSL]]) para cifrar toda la comunicación entre el cliente (navegador) y el servidor. Este flujo garantiza tres pilares fundamentales en la seguridad de la información: **confidencialidad** (nadie puede leer los datos), **integridad** (los datos no pueden ser modificados sin ser detectados) y **autenticación** (se verifica la identidad del servidor).

![[Flujo HTTPS.png]]
### El Proceso Detallado del Flujo (Handshake)

El ciclo de vida de una conexión HTTPS se divide en etapas críticas que van desde la negociación inicial hasta la transmisión de datos sensibles.

#### Conexión Inicial TCP

Antes de aplicar la capa de seguridad, se debe establecer un canal de transporte confiable.
- Se realiza el clásico _Three-Way Handshake_ de [[TCP]] (SYN, SYN-ACK, ACK).

#### El Apretón de Manos TLS (TLS Handshake)

Una vez abierto el canal TCP, comienza la negociación criptográfica. Este es el núcleo del flujo HTTPS:
- **Client Hello:** El cliente envía una lista de las versiones de TLS soportadas, los algoritmos de cifrado compatibles (_Cipher Suites_) y un número aleatorio generado por el cliente (_Client Random_).
- **Server Hello:** El servidor responde seleccionando la versión de TLS y la _Cipher Suite_ más segura que ambos tengan en común, junto con su propio número aleatorio (_Server Random_).
- **Envío del Certificado:** El servidor envía su [[Certificado Digital]] (que incluye su clave pública) firmado por una [[Autoridad de Certificación (CA)]] de confianza.
- **Verificación del Certificado:** El cliente valida el certificado contra su propio almacén de CA confiables. Verifica que el dominio coincida, que no esté expirado ni revocado.
- **Intercambio de Clave (Pre-Master Secret):** El cliente genera un tercer valor aleatorio llamado _Pre-Master Secret_, lo cifra utilizando la **clave pública** del servidor (obtenida del certificado) y se lo envía.
- **Generación de la Clave de Sesión:** * El servidor descifra el _Pre-Master Secret_ usando su **clave privada**.
    - Ahora, tanto el cliente como el servidor tienen el _Client Random_, _Server Random_ y el _Pre-Master Secret_.
    - Mediante un algoritmo común, ambos generan de forma independiente la misma **Clave de Sesión Simétrica**.
- **Finalización del Handshake:** Ambos extremos se envían mensajes cifrados de prueba (_Finished_) para confirmar que el canal simétrico funciona correctamente.

#### Transmisión Segura de Datos

A partir de este momento, el cifrado asimétrico (más costoso a nivel computacional) se deja de lado.
- Toda la carga útil de HTTP (cabeceras, cookies, métodos POST/GET, HTML) se cifra y descifra utilizando la **Clave de Sesión Simétrica**.

### Estructura de una Cipher Suite Común

Durante el flujo se negocian combinaciones específicas de algoritmos. Un estándar moderno en [[TLS 1.3]] simplifica esta estructura:
```Plaintext
TLS_AES_256_GCM_SHA384
 └── Protocolo: TLS
      └── Cifrado Simétrico: AES de 256 bits en modo GCM
           └── Algoritmo de Hash (Integridad): SHA-384
```

### Conceptos Relacionados

- [[Mecanismo HSTS (HTTP Strict Transport Security)]]
- [[Infraestructura de Clave Pública (PKI)]]
- [[Diferencias entre TLS 1.2 y TLS 1.3]]
- [[Ataques Man-in-the-Middle (MitM)]]