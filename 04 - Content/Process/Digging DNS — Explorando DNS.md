---
aliases:
tags:
  - type/concept
  - service/dns
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


## Herramientas DNS

El reconocimiento DNS consiste en usar herramientas especializadas para consultar servidores DNS y extraer información útil. Abajo están algunas de las herramientas más populares y versátiles para recon web:

| **Herramienta**                    |                                                                                             **Características clave** | **Casos de uso**                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `dig`                              | Herramienta de consulta DNS versátil que soporta muchos tipos de consultas (A, MX, NS, TXT, etc.) y salida detallada. | Consultas DNS manuales, transferencias de zona (si están permitidas), resolución de problemas DNS y análisis en profundidad de registros. |
| `nslookup`                         |                                        Herramienta más simple para consultas DNS, enfocada en registros A, AAAA y MX. | Consultas DNS básicas, comprobaciones rápidas de resolución de dominios y registros de correo.                                            |
| `host`                             |                                                                Herramienta de consulta DNS ligera con salida concisa. | Verificación rápida de registros A, AAAA y MX.                                                                                            |
| `dnsenum`                          |     Enumeración DNS automatizada: ataque por diccionario, fuerza bruta, transferencias de zona (si están permitidas). | Descubrimiento eficiente de subdominios y recolección de información DNS.                                                                 |
| `fierce`                           |       Herramienta de reconocimiento DNS y enumeración de subdominios con búsqueda recursiva y detección de comodines. | Interfaz amigable para reconocimiento DNS, identificación de subdominios y posibles objetivos.                                            |
| `dnsrecon`                         |                                 Combina múltiples técnicas de reconocimiento DNS y soporta varios formatos de salida. | Enumeración DNS completa, identificación de subdominios y recolección de registros DNS para análisis posterior.                           |
| `theHarvester`                     |           Herramienta OSINT que recopila info desde varias fuentes, incluyendo registros DNS (direcciones de correo). | Recolección de direcciones de correo, información de empleados y otros datos asociados a un dominio desde múltiples fuentes.              |
| Servicios de consulta DNS en línea |                                                                      Interfaces gráficas para realizar consultas DNS. | Consultas DNS rápidas y sencillas cuando no hay herramientas CLI disponibles; comprobar disponibilidad de dominios o info básica.         |

## The Domain Information Groper (`dig`)

El comando `dig` (Domain Information Groper) es una utilidad potente y flexible para consultar servidores DNS y recuperar distintos tipos de registros. Su salida detallada y personalizable lo convierte en la opción predilecta.

### Comandos comunes de `dig`

| **Comando**                     | **Descripción**                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `dig domain.com`                | Consulta por defecto del registro A del dominio.                                                                 |
| `dig domain.com A`              | Recupera la dirección IPv4 (registro A) del dominio.                                                             |
| `dig domain.com AAAA`           | Recupera la dirección IPv6 (registro AAAA) del dominio.                                                          |
| `dig domain.com MX`             | Encuentra los servidores de correo (registros MX) responsables del dominio.                                      |
| `dig domain.com NS`             | Identifica los servidores de nombres autoritativos del dominio.                                                  |
| `dig domain.com TXT`            | Recupera registros TXT asociados al dominio.                                                                     |
| `dig domain.com CNAME`          | Recupera el nombre canónico (registro CNAME) del dominio.                                                        |
| `dig domain.com SOA`            | Recupera el registro SOA (start of authority).                                                                   |
| `dig @1.1.1.1 domain.com`       | Especifica un servidor de nombres concreto para la consulta (ej.: 1.1.1.1).                                      |
| `dig +trace domain.com`         | Muestra la ruta completa de resolución DNS (iterativa desde la raíz).                                            |
| `dig -x 192.168.1.1`            | Búsqueda inversa sobre la IP 192.168.1.1 para encontrar el nombre asociado (puede requerir servidor específico). |
| `dig +short domain.com`         | Respuesta corta y concisa (solo la respuesta).                                                                   |
| `dig +noall +answer domain.com` | Muestra únicamente la sección de respuesta del output.                                                           |
| `dig domain.com ANY`            | Recupera todos los registros disponibles (nota: muchos servidores ignoran ANY por RFC 8482).                     |

**Precaución:** Algunos servidores detectan y bloquean consultas DNS excesivas. Respeta límites de tasa y obtén permiso antes de realizar reconocimiento DNS extensivo sobre un objetivo.

---

## Interpretación del output de `dig` (ejemplo)

Ejemplo de comando y salida:

```bash
vsoci3tyv@htb[/htb]$ dig google.com

; <<>> DiG 9.18.24-0ubuntu0.22.04.1-Ubuntu <<>> google.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 16449
;; flags: qr rd ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             0       IN      A       142.251.47.142

;; Query time: 0 msec
;; SERVER: 172.23.176.1#53(172.23.176.1) (UDP)
;; WHEN: Thu Jun 13 10:45:58 SAST 2024
;; MSG SIZE  rcvd: 54
```

Esta salida se puede dividir en cuatro secciones clave:

### Cabecera

- `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 16449` — indica el tipo de operación (QUERY), el estado (NOERROR) y un identificador único (16449).
    
- `;; flags: qr rd ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0` — describe las banderas:
    - `qr`: respuesta a consulta (indica que esto es una respuesta).
    - `rd`: recursion desired (se solicitó recursión).
    - `ad`: authentic data (el resolvedor considera los datos auténticos).
    - Los números indican la cantidad de entradas en cada sección: 1 pregunta, 1 respuesta, 0 autoridades, 0 adicionales.
- `;; WARNING: recursion requested but not available` — se solicitó recursión, pero el servidor no la soporta.

### Sección de pregunta

- `;google.com. IN A` — la pregunta: “¿Cuál es la dirección IPv4 (registro A) de google.com?”

### Sección de respuesta

- `google.com. 0 IN A 142.251.47.142` — respuesta: la IP asociada al dominio es `142.251.47.142`. El `0` es el TTL (time-to-live).

### Pie / meta

- `;; Query time: 0 msec` — tiempo de la consulta.
- `;; SERVER: 172.23.176.1#53(172.23.176.1) (UDP)` — servidor DNS que respondió y el protocolo.
- `;; WHEN: Thu Jun 13 10:45:58 SAST 2024` — marca temporal de la consulta.
- `;; MSG SIZE rcvd: 54` — tamaño del mensaje recibido (54 bytes).

> Nota: A veces aparece una seudo-sección `OPT` en la salida de `dig` debido a EDNS (Extension Mechanisms for DNS), que permite características adicionales como mensajes más grandes y soporte para DNSSEC.


---

## Respuesta corta (solo la IP)

Si solo querés la respuesta sin el resto de la información, usá `+short`:

```bash
vsoci3tyv@htb[/htb]$ dig +short hackthebox.com

104.18.20.126
104.18.21.126
```
