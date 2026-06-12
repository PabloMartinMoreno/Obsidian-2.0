---
aliases:
  - Hypertext Transfer Protocol Secure
tags:
  - service/http
  - asset/web-app
  - cert/cwes
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Web]]"
tertiary categories:
  - "[[Web Fundamentals]]"
kind: Concept
linked:
  - "[[HTTP]]"
  - "[[SSL - TLS]]"
  - "[[Certificados SSL-TLS]]"
  - "[[Criptografía Simétrica vs. Asimétrica]]"
  - "[[HTTP - Headers]]"
  - "[[HTTP - Cookies y Sesiones]]"
  - "[[Flujo de Comunicación HTTPS]]"
  - "[[URL Encode - Characters]]"
---
# HTTPS: Hypertext Transfer Protocol Secure

**HTTPS** es [[HTTP]] envuelto en una capa de cifrado **[[SSL - TLS|TLS]]**. Mismo protocolo, pero protege la confidencialidad e integridad de los datos durante el [[Flujo de Comunicación HTTPS|flujo]].

---

## Referencia rápida

````tabs
tab: **Cifrado (Sim. vs Asim.)**
![[Criptografía Simétrica vs. Asimétrica#^cripto-comparativa]]

tab: **Certificados SSL/TLS**
![[Certificados SSL-TLS#^cert-contiene]]
````

---

## ¿Qué garantiza?

1. **Cifrado:** nadie puede "escuchar" la conversación.
2. **Integridad:** los datos no se alteran sin que se detecte.
3. **Autenticación:** demostrás que hablás con el sitio real, no un impostor.

---

## Cifrado: asimétrico + simétrico

El handshake usa cifrado **asimétrico** para acordar una clave de sesión; luego pasa a **simétrico** (más rápido) para los datos. Detalle en [[Criptografía Simétrica vs. Asimétrica]] (tabla en Referencia rápida).

---

## Certificados

El servidor prueba su identidad con un **[[Certificados SSL-TLS|certificado SSL/TLS]]** firmado por una **CA** (Let's Encrypt, DigiCert…). Si la cadena de confianza se rompe (expirado, self-signed), el navegador alerta (tabla en Referencia rápida).

---

## Comparativa: HTTP vs HTTPS

| **Característica**     | **HTTP**                   | **HTTPS**             |
| ---------------------- | -------------------------- | --------------------- |
| **Puerto por defecto** | `80`                       | `443`                 |
| **Seguridad**          | Texto plano (Vulnerable)   | Cifrado (Seguro)      |
| **Certificado**        | No requiere                | Obligatorio           |
| **SEO / Confianza**    | Penalizado por navegadores | Favorecido por Google |

^https-comparativa

> [!WARNING] Importancia de HTTPS
> Sin HTTPS, cualquier persona en tu misma red Wi-Fi podría ver tus contraseñas, datos bancarios o cookies de sesión mediante un ataque [[Sniffing & MITM|Man-in-the-Middle]].

---

## Métodos y Códigos

HTTPS transporta mensajes HTTP idénticos: mismos métodos y códigos de estado que [[HTTP]].

![[HTTP - Métodos#^http-metodos]]

![[HTTP - Códigos de Estado#^http-estado]]

---

## Pentest TLS

Recon de versiones, ciphers y certificados (TLS 1.0/SSLv3, weak ciphers, Heartbleed, CN mismatch): ver [[SSL - TLS]].

---

**Notas relacionadas:**
- [[HTTP]] · [[SSL - TLS]] · [[Certificados SSL-TLS]] · [[Criptografía Simétrica vs. Asimétrica]]
- [[Flujo de Comunicación HTTPS|Flujo HTTPS]]
