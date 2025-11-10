
---


## Diferencias principales

| Herramienta  | Tipo de Reconocimiento    | Función principal                                     | Qué obtiene                                                             | Nivel                          |
| ------------ | ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| **whois**    | 🔵 Pasivo                 | Consultar bases de datos de registradores de dominios | Propietario del dominio, fechas, servidores NS, contactos, etc.         | Registro (no DNS directamente) |
| **dig**      | 🟡 Activo                 | Consultar directamente servidores DNS                 | Registros DNS específicos (A, MX, NS, TXT, SOA, etc.)                   | DNS directo                    |
| **nslookup** | 🟡 Activo (aunque simple) | Consultar servidores DNS                              | Igual que `dig`, pero con menos opciones y formato más limitado         | DNS directo                    |
| **dnsrecon** | 🔴 Activo (automatizado)  | Enumerar y mapear dominios con múltiples técnicas     | Brute force de subdominios, transfers de zona, consultas inversas, etc. | Automatizado y avanzado        |

---

## Cuándo usar cada uno

### **1. WHOIS**

* **Objetivo:** obtener información sobre la **propiedad del dominio**.
* **Cuándo usarlo:**

  * Al inicio del reconocimiento pasivo.
  * Cuando querés saber **quién registró el dominio**, **cuándo** y **dónde**.
  * Cuando necesitás los **Name Servers** (para usar luego con `dig` o `dnsrecon`).
* **Ejemplo:**

  ```bash
  whois example.com
  whois -h whois.iana.org example.com
  ```
* **Datos que devuelve:** registrar, emails de contacto, fechas de creación/expiración, servidores NS.

---

### **2. DIG**

* **Objetivo:** consultar directamente el **servidor DNS** de un dominio.
* **Cuándo usarlo:**

  * Cuando querés **ver registros específicos**: A, MX, TXT, SOA, etc.
  * Para **probar distintos servidores** con `@<ns o IP>`.
  * Para analizar respuestas DNS **reales y precisas**.
* **Ejemplo:**

  ```bash
  dig example.com A
  dig example.com MX
  dig @ns1.example.com example.com AXFR
  dig +short example.com
  ```
* **Ventaja:** formato legible, detallado y estándar entre pentesters.

---

### **3. NSLOOKUP**

* **Objetivo:** igual que `dig`, pero más simple y más viejo.
* **Cuándo usarlo:**

  * En entornos donde `dig` no está disponible (Windows).
  * Para consultas rápidas o interactivas.
* **Ejemplo:**

  ```bash
  nslookup example.com
  nslookup -type=MX example.com
  ```
* **Ventaja:** universal, aunque menos potente que `dig`.
* **Nota:** en Linux se prefiere `dig`.

---

### **4. DNSRECON**

* **Objetivo:** herramienta de **enumeración automatizada** de DNS.
* **Cuándo usarlo:**

  * Cuando querés descubrir **subdominios, zonas, hosts internos**, etc.
  * Para pruebas más completas que combinen varios tipos de consulta.
* **Ejemplo:**

  ```bash
  dnsrecon -d example.com -t std
  dnsrecon -d example.com -t brt -D /usr/share/wordlists/subdomains.txt
  dnsrecon -d example.com -t axfr
  ```
* **Ventaja:** combina funciones de `dig` + fuerza bruta + pruebas AXFR.
* **Desventaja:** genera **tráfico activo** y deja trazas.

---

## En resumen práctico

| Etapa                             | Herramienta       | Propósito                                                         |
| --------------------------------- | ----------------- | ----------------------------------------------------------------- |
| **Reconocimiento pasivo**         | `whois`           | Datos del registrante, servidores NS                              |
| **Reconocimiento activo inicial** | `dig`, `nslookup` | Consultas específicas de registros DNS                            |
| **Enumeración activa avanzada**   | `dnsrecon`        | Descubrir subdominios, transferencias de zona, información oculta |

---
