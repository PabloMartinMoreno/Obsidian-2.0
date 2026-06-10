---
aliases:
  - MITM
  - Man-in-the-Middle
  - Sniffing
tags:
  - technique/mitm
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
kind: Concept
linked:
  - "[[HTTPS]]"
  - "[[SSL - TLS]]"
  - "[[Responder]]"
  - "[[Wireshark]]"
---
# Sniffing & MITM

Dos técnicas de interceptación de tráfico de red:

- **Sniffing (pasivo):** capturar tráfico que pasa por la red sin alterarlo. Efectivo si el atacante está en el mismo segmento (Wi-Fi abierta, hub, puerto espejo).
- **Man-in-the-Middle / MITM (activo):** el atacante se posiciona entre cliente y servidor, reenviando y opcionalmente **alterando** el tráfico de ambos lados.

---

## Por qué importa

Todo lo que viaja en **texto plano** ([[HTTP]] sin TLS, credenciales [[HTTP - Basic Auth|Basic Auth]], cookies sin `Secure`) es legible o robable por un sniffer o un MITM: credenciales, cookies de sesión, datos sensibles.

> [!tip] Mitigación
> [[HTTPS]] (TLS) cifra el canal → el sniffer solo ve bytes cifrados. Por eso Basic Auth o cookies de sesión sobre HTTP plano son críticos.

---

## Vectores comunes

- **ARP spoofing / DHCP spoofing** → redirigir tráfico LAN ([[Responder]], [[mitm6 - IPv6 DHCP Spoofing]]).
- **DNS spoofing** → resolver dominios a la IP del atacante.
- **Rogue AP / Evil Twin** → punto de acceso Wi-Fi malicioso.
- **SSL stripping** → degradar HTTPS a HTTP.

---

## Herramientas

- [[Wireshark]] / `tcpdump` — captura y análisis.
- [[Responder]] — envenenamiento LLMNR/NBT-NS/mDNS.
- `bettercap`, `ettercap` — frameworks MITM.

---

**Notas relacionadas:**
- [[HTTPS]] · [[SSL - TLS]] · [[Responder]] · [[Wireshark]]
