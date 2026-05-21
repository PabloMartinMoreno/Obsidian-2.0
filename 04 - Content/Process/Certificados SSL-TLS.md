---
aliases:
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[HTTPS]]"
  - "[[Criptografía Simétrica vs. Asimétrica]]"
  - "[[http-flow]]"
---
# Certificados SSL/TLS

Un certificado **SSL/TLS** (Secure Sockets Layer / Transport Layer Security) es un archivo digital que cumple dos funciones críticas: autenticar la identidad de un sitio web y permitir el uso de [[Criptografía Simétrica vs. Asimétrica|cifrado asimétrico]] para iniciar una conexión segura.2

___

## ¿Qué contiene un certificado?

Un certificado no es solo una clave; es un paquete de datos que incluye:

- **Nombre del dominio:** Para qué sitio fue emitido (ej. `google.com`).
- **Clave Pública:** La parte necesaria para iniciar el cifrado asimétrico.
- **Autoridad de Certificación (CA):** Quién firmó y validó el certificado.
- **Fechas de validez:** Cuándo expira (suelen durar entre 90 días y 1 año).
- **Firma Digital:** Una prueba matemática de que el certificado no ha sido alterado.

---

## La Cadena de Confianza (Chain of Trust)

¿Por qué tu navegador confía en un certificado? Por la jerarquía de confianza:

1. **Certificado Raíz (Root CA):** Tu sistema operativo tiene una lista de entidades en las que confía ciegamente (ej. DigiCert, IdenTrust).
2. **Certificado Intermedio:** Las Root CA firman certificados para otras entidades más pequeñas para no exponer su clave principal.3
3. **Certificado de Entidad Final:** El certificado que el servidor de la web te entrega a ti.4

> [!IMPORTANT] Validación
> 
> Si la cadena se rompe (ej. un certificado expirado o firmado por alguien desconocido), el navegador mostrará el famoso aviso rojo: "Tu conexión no es privada".

---

## Tipos de Certificados por Validación

No todos los certificados requieren el mismo nivel de investigación por parte de la CA:

|**Tipo**|**Siglas**|**Nivel de Confianza**|**Descripción**|
|---|---|---|---|
|**Domain Validation**|**DV**|Básico|Solo prueba que tienes control sobre el dominio. Es el que ofrece Let's Encrypt gratis.|
|**Organization Validation**|**OV**|Medio|La CA verifica que la empresa es real y legal.|
|**Extended Validation**|**EV**|Alto|Requiere una auditoría profunda de la empresa.|

---

## Cómo funciona en el Handshake

Cuando entras a una web por [[HTTPS]]:

1. El servidor te envía su certificado.
2. Tu navegador mira quién lo firmó.
3. El navegador usa la **Clave Pública** del certificado para enviarle al servidor un mensaje secreto.
4. Si el servidor puede descifrarlo (porque tiene la **Clave Privada** correspondiente), se demuestra su identidad.

---

**Notas relacionadas:**

- [[HTTPS]]
- [[Criptografía Simétrica vs. Asimétrica]]
- [[http-flow|Flujo HTTP]]
