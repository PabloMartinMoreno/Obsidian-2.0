---
aliases:
  - PKI
  - Public Key Infrastructure
  - Autoridad de Certificación (CA)
  - CA
  - Certificate Authority
tags:
  - asset/network
  - service/http
primary categories:
  - "[[Cryptography]]"
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[Certificados SSL-TLS]]"
  - "[[Criptografía Simétrica vs. Asimétrica]]"
  - "[[HTTPS]]"
---
# Infraestructura de Clave Pública (PKI)

Sistema que **liga identidades a claves públicas** mediante certificados firmados por entidades de confianza. Es lo que hace posible que tu navegador confíe en la clave pública de un server sin haberla intercambiado antes: la **CA** actúa de tercero confiable. Base de HTTPS, S/MIME, code signing y AD CS.

---

## Componentes

| **Componente** | **Rol** |
|---|---|
| **CA (Autoridad de Certificación)** | Emite y firma certificados. Su firma = "garantizo que esta clave pública pertenece a este dominio/identidad". |
| **Root CA** | Raíz de confianza, en el trust store del SO/navegador. Firma offline, protegida al máximo. |
| **Intermediate CA** | Firmada por la Root; emite los certs de entidad final (así la Root no se expone). |
| **RA (Registration Authority)** | Valida la identidad del solicitante antes de que la CA emita. |
| **Certificado (X.509)** | El artefacto que liga clave pública ↔ identidad. Ver [[Certificados SSL-TLS]]. |
| **CRL / OCSP** | Mecanismos de **revocación**: listar/consultar certs invalidados antes de expirar. |
| **Trust Store** | Lista de Root CA en las que el cliente confía ciegamente. |

^pki-componentes

---

## Jerarquía de Confianza

```
Root CA  (trust store del cliente)
   └── Intermediate CA  (firmada por Root)
          └── Certificado de Entidad Final  (el del server)
```

El cliente valida la **cadena** hasta una Root en la que confía. Si algún eslabón falla (expirado, revocado, firmante desconocido) → conexión no confiable.

---

## Ángulo Ofensivo

- **CA comprometida / mis-issuance** → emitir certs válidos para cualquier dominio → MITM transparente. Ver [[Ataques Man-in-the-Middle (MitM)]].
- **Revocación débil** (OCSP soft-fail) → cert revocado sigue siendo aceptado.
- **Root CA propia inyectada** en el trust store de la víctima (post-explotación) → interceptar todo su TLS.
- **AD CS** (ESC1-ESC8) → escalada de privilegios vía templates mal configurados.

^pki-ofensivo

---

## Notas relacionadas
- [[Certificados SSL-TLS]] · [[SSL - TLS]] · [[Criptografía Simétrica vs. Asimétrica]] · [[HTTPS]]
