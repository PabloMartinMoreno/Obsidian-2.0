---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[DNS]]"
---
# DNS Pentesting Toolkit

En la fase de **Reconocimiento (Footprinting)**, el DNS es una de las fuentes de información más ricas. Estas herramientas ayudan a descubrir subdominios, registros ocultos y posibles vectores de ataque como transferencias de zona.


| Herramienta                          | Tipo (pasivo/activo)                 | Función principal                             | Qué obtiene / cómo se usa                                                                                                           | Cuándo elegirla                                                                                            |
| ------------------------------------ | ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **whois**                            | 🔵 Pasivo                            | Datos del registrador/propietario             | Información del registrante, NS declarados, fechas, contactos.                                                                      | Inicio de reconocimiento pasivo; contexto administrativo                                                   |
| **dig**                              | 🟡 Activo                            | Consultas DNS puntuales y precisas            | Registros A/AAAA/MX/NS/TXT/SOA, AXFR si está abierto; permite `@<server>`                                                           | Verificar registros, probar un NS específico, depurar resoluciones                                         |
| **nslookup**                         | 🟡 Activo                            | Consultas DNS simples (útil en Windows)       | Igual que `dig` pero formato más básico                                                                                             | Consultas rápidas o entornos donde `dig` no está disponible                                                |
| **dnsrecon**                         | 🔴 Activo (automatizado)             | Enumeración avanzada de DNS                   | Fuerza bruta de subdominios, pruebas AXFR, búsquedas inversas, consulta de registros                                                | Enumeración profunda con wordlists; auditorías en laboratorio/autorizadas                                  |
| **dnsenum**                          | 🔴 Activo (híbrido: pasivo + activo) | Enumeración/colección completa de subdominios | Brute force de subdominios, intentos AXFR, reverse lookup, whois lookup y recolección OSINT; genera listados y puede usar wordlists | Buen complemento cuando querés combinar búsquedas pasivas/osint + fuerza bruta; útil para informes rápidos |
| **theHarvester / amass / sublist3r** | 🔵/🔴 (depende)                      | Enumeración pasiva y activa de subdominios    | Recolectan de motores, cert transparency, APIs y/o fuerza bruta                                                                     | Cuando querés mezclar fuentes OSINT (certs, motores, feeds)                                                |


---

## 1. Herramientas Nativas (CLI)

Las herramientas básicas que todo pentester debe dominar, preinstaladas en la mayoría de sistemas Unix/Linux.

- **[[dig]] (Domain Information Groper):** La navaja suiza para consultas DNS.
    - _Uso:_ `dig axfr @ns1.objetivo.com objetivo.com` (Intento de transferencia de zona).
- **[[nslookup]]:** Aunque más antigua, es útil para consultas rápidas y está disponible en Windows.
- **[[host]]:** Una alternativa simple a `dig` para resoluciones rápidas de IP a nombre y viceversa.

---

## 2. Enumeración de Subdominios (Fuerza Bruta y OSINT)

Descubrir subdominios (`dev.objetivo.com`, `vpn.objetivo.com`) es clave para ampliar la superficie de ataque.

- **Subfinder:** Herramienta extremadamente rápida que utiliza fuentes pasivas (OSINT) para encontrar subdominios.
- **Amass (OWASP):** Quizás la más completa. Combina técnicas activas y pasivas, mapeo de redes y scraping.
    - _Nota:_ Requiere configurar APIs (BinaryEdge, Shodan, etc.) para máxima eficacia.
- **Gobuster / ffuf:** Aunque son fuzzers generales, tienen módulos específicos para DNS mediante fuerza bruta usando diccionarios.
- **Assetfinder:** Una herramienta ligera de TomNomNom para encontrar dominios relacionados.

---

## 3. Transferencia de Zona y Configuración (Audit)

Para detectar errores de configuración graves.

- **DNSRecon:** Una herramienta de Python muy potente que automatiza:
    - Intentos de transferencia de zona (AXFR).
    - Enumeración de registros SRV.
    - Búsqueda de registros `TXT` (SPF/DKIM).
- **Fierce:** Un clásico para localizar espacios de IP y nombres de dominio en redes corporativas.
- **DNSEnum:** Realiza operaciones de Whois, ataques de transferencia de zona y fuerza bruta de subdominios con soporte para multi-hilo.


---

## 4. Análisis de Seguridad Específico

- **DMARC/SPF Checkers:** Herramientas online o scripts para verificar si un dominio puede ser suplantado (Spoofing) por falta de políticas de seguridad en el correo.
- **ZDNS:** Un buscador DNS de alta velocidad capaz de analizar millones de dominios en poco tiempo (ideal para investigaciones a gran escala).
- **DNS Twist:** Detecta **Typosquatting**. Busca dominios similares al de tu objetivo que podrían usarse para ataques de Phishing (ej: `g00gle.com`).


---

## 5. Visualización y Mapas

- **SpiderFoot:** Automatiza el uso de muchas de las herramientas anteriores y genera un gráfico de relaciones entre dominios, IPs y correos.
- **Maltego:** Herramienta gráfica (GUI) clásica para mapear infraestructuras complejas mediante "transforms".


---

## 💡 Checklist

Cuando se audita DNS, asegurar:

- [ ] **Transferencia de zona (AXFR):** ¿Está permitida para cualquier IP?
- [ ] **Registros TXT:** ¿Hay información sensible o claves de servicios?
- [ ] **Configuración SPF/DMARC:** ¿Permite el envío de correos no autorizados?
- [ ] **Subdominios "colgantes":** ¿Hay registros CNAME apuntando a servicios de nube (AWS/Azure) ya borrados? (DNS Takeover).


---