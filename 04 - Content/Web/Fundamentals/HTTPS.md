---
aliases:
  - Hypertext Transfer Protocol Secure
tags:
  - service/http
  - asset/web-app
  - cert/cwes
  - estado/completo
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[Flujo de Comunicación HTTP]]"
  - "[[Criptografía Simétrica vs. Asimétrica]]"
  - "[[curl]]"
  - "[[URL]]"
  - "[[Códigos de Estado HTTP]]"
  - "[[Cookies y Sesiones]]"
  - "[[Protocolos de Red]]"
  - "[[HTTP Headers]]"
  - "[[Métodos HTTP]]"
---
# HTTPS: Hypertext Transfer Protocol Secure

**HTTPS** es la versión segura de [[HTTP]]. Es el mismo protocolo, pero envuelto en una capa de cifrado llamada **SSL/TLS**. Su objetivo es proteger la confidencialidad e integridad de los datos durante el [[Flujo de Comunicación HTTP]].

___

## Los Tres Pilares de HTTPS

Para que una conexión se considere segura, HTTPS garantiza tres cosas:

1. **Cifrado (Encryption):** Se codifican los datos intercambiados para que nadie pueda "escuchar" la conversación.
2. **Integridad de los datos:** Los datos no pueden modificarse ni corromperse durante la transferencia sin que el sistema lo detecte.
3. **Autenticación:** Demuestra que el usuario se está comunicando con el sitio web previsto y no con un impostor.


---

## El Handshake TLS (Apretón de manos)

Antes de enviar cualquier dato HTTP, se realiza un proceso de negociación de seguridad:

1. **Client Hello:** El navegador envía las versiones de TLS y algoritmos de cifrado que soporta.
2. **Server Hello:** El servidor responde y envía su **Certificado SSL**.
3. **Validación:** El navegador verifica con una entidad externa (CA) que el certificado es válido.
4. **Intercambio de claves:** Se genera una "clave de sesión" única para esa visita que ambos usarán para cifrar los mensajes.


---

## Componentes Técnicos

### Certificados SSL/TLS

Es un archivo digital que vincula una clave criptográfica con los datos de una organización. Es lo que permite que aparezca el "candado" en la barra de direcciones.

### Autoridades de Certificación (CA)

Son entidades de confianza (como Let's Encrypt o DigiCert) que validan que el dueño de un dominio es quien dice ser y emiten el certificado.


---

## Comparativa: HTTP vs HTTPS

|**Característica**|**HTTP**|**HTTPS**|
|---|---|---|
|**Puerto por defecto**|`80`|`443`|
|**Seguridad**|Texto plano (Vulnerable)|Cifrado (Seguro)|
|**Certificado**|No requiere|Obligatorio|
|**SEO / Confianza**|Penalizado por navegadores|Favorecido por Google|

---

> [!WARNING] Importancia de HTTPS
> 
> Sin HTTPS, cualquier persona en tu misma red Wi-Fi podría ver tus contraseñas, datos bancarios o cookies de sesión mediante un ataque de tipo Man-in-the-Middle.

___

**Notas relacionadas:**
- [[HTTP]]
- [[Flujo de Comunicación HTTP|Flujo HTTP]]
- [[Certificados SSL/TLS]]
