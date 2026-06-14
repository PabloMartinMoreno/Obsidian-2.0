---
aliases:
  - Traffic Light Protocol
  - TLP
tags:
  - topic/threat-intel
  - asset/network
primary categories:
  - "[[Blue Team]]"
secondary categories:
  - "[[SOC]]"
  - "[[Identificación]]"
tertiary categories:
  - "[[SOC Identificación]]"
kind: SubCheatSheet
linked:
  - "[[Threat Intelligence]]"
---
# Threat Intelligence - TLP

> **Traffic Light Protocol**: esquema estándar (FIRST.org) para marcar hasta dónde puede compartirse una pieza de inteligencia. Define la audiencia permitida con colores.

---

## Niveles TLP

| **Color** | **Compartir con** | **Uso** |
|:---|:---|:---|
| 🔴 **TLP:RED** | Solo los destinatarios nombrados, en la reunión/canal donde se entregó | Información muy sensible; no reenviar |
| 🟠 **TLP:AMBER** | La organización del receptor y clientes que necesiten saber | Limitado a la organización |
| 🟠 **TLP:AMBER+STRICT** | Solo la organización del receptor (no clientes) | Variante más restrictiva |
| 🟢 **TLP:GREEN** | La comunidad/ISAC, pero no público | Compartir dentro del sector |
| ⚪ **TLP:CLEAR** | Sin restricción (antes "TLP:WHITE") | Información pública |
^tlp-niveles

> Regla práctica: ante la duda, respetar el color más restrictivo. Compartir un IOC TLP:RED en un feed público puede quemar una operación de IR o exponer a la víctima fuente.
^tlp-regla
