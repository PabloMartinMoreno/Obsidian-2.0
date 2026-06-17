---
aliases:
  - MitM
  - Man-in-the-Middle
  - MITM
tags:
  - technique/mitm
  - asset/network
  - service/http
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
kind: Technique
linked:
  - "[[HTTPS]]"
  - "[[HSTS]]"
  - "[[SSL - TLS]]"
  - "[[Protocolos de Red]]"
---
# Ataques Man-in-the-Middle (MitM)

El atacante se interpone entre cliente y server, **leyendo y/o modificando** el tráfico sin que ninguno lo note. Rompe la **confidencialidad** y la **integridad**. TLS bien configurado lo previene (autentica al server); el ataque vive de degradar o saltear esa autenticación.

---

## Vectores

| **Vector** | **Cómo** | **Capa** |
|---|---|---|
| **ARP Spoofing** | Envenenar la tabla ARP de la LAN → el tráfico pasa por vos | L2 |
| **DNS Spoofing** | Responder consultas DNS con tu IP | L3/7 |
| **Rogue AP / Evil Twin** | AP wifi falso con el mismo SSID | L2 |
| **SSL Strip** | Forzar downgrade de HTTPS→HTTP en claro (si no hay [[HSTS]]) | L7 |
| **Downgrade TLS** | Forzar versión/cipher débil negociable | L7 |
| **Cert falso** | Cert inválido aceptado por el cliente (o CA comprometida, ver [[Infraestructura de Clave Pública (PKI)|PKI]]) | L7 |

^mitm-vectores

---

## Tooling

| **Tool** | **Uso** |
|---|---|
| `bettercap` | Suite moderna: ARP/DNS spoof, SSL strip, sniffing |
| `ettercap` | Clásico de ARP poisoning + filtros |
| `mitmproxy` | Proxy interactivo HTTP/HTTPS (inspección/modificación) |
| `responder` | LLMNR/NBT-NS poisoning → MitM en redes Windows ([[LLMNR & NBT-NS Poisoning]]) |

^mitm-tooling

---

## Defensas

- **TLS con validación estricta** de certificado (rechazar self-signed / CN mismatch).
- **[[HSTS]]** (+ preload) → mata el SSL strip.
- **Certificate Pinning** → el cliente solo acepta un cert/clave conocido.
- Segmentación L2, DHCP snooping, Dynamic ARP Inspection.

^mitm-defensas

---

## Notas relacionadas
- [[HTTPS]] · [[HSTS]] · [[SSL - TLS]] · [[Infraestructura de Clave Pública (PKI)]] · [[Protocolos de Red]]
