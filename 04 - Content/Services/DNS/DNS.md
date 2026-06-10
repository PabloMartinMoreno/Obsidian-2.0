---
aliases:
  - Domain Name System
  - Servidor DNS
tags:
  - service/dns
  - asset/network
  - cert/cwes
kind: Concept
linked:
  - "[[DNS (53) - Enumeración]]"
  - "[[DNS - Herramientas]]"
  - "[[Subdominio]]"
  - "[[Transferencia de Zona DNS]]"
---
# DNS: El Sistema de Nombres de Dominio

El **DNS** (_Domain Name System_) es el sistema encargado de traducir nombres de dominio legibles para humanos (como `google.com`) en direcciones IP numéricas (como `142.250.190.46`) que las computadoras entienden.

Es, esencialmente, la **libreta de contactos de Internet**.

---

##  La Estructura Jerárquica del DNS

El DNS no es una base de datos centralizada, sino que funciona como una estructura de árbol invertida:

1. **Punto Raíz (Root Level):** El nivel superior (representado por un punto invisible al final de cada URL).
2. **TLD (Top-Level Domains):** Extensiones como `.com`, `.org`, `.net` o territoriales como `.es`, `.mx`.
3. **Dominios de Segundo Nivel:** El nombre que compras (ej. `wikipedia`).
4. **Subdominios:** Variaciones del dominio principal (ej. `es.wikipedia.org`).


---

## El Proceso de Resolución (Paso a Paso)

Cuando escribes una URL en tu navegador, ocurren los siguientes pasos:

1. **DNS Query (Consulta):** Tu PC busca primero en su **caché local**. Si no está, pregunta al **Recursive Resolver** (normalmente el de tu ISP o Google `8.8.8.8`).
2. **Root Server:** El resolvedor pregunta al servidor raíz: "¿Dónde está el servidor para `.com`?".
3. **TLD Server:** El servidor raíz responde con la dirección de los servidores de `.com`.
4. **Authoritative Nameserver:** El resolvedor pregunta al servidor del TLD por el dominio específico. Este servidor tiene la "verdad absoluta" y entrega la **IP**.
5. **Respuesta:** El resolvedor le da la IP a tu navegador y este carga la web.


---

## Tipos de Registros DNS Comunes

Dentro de la configuración de un dominio, existen diferentes "etiquetas" según lo que queramos direccionar:

|**Registro**|**Propósito**|**Ejemplo**|
|---|---|---|
|**A**|Apunta un nombre a una dirección **IPv4**.|`google.com` -> `142.250.1.1`|
|**AAAA**|Apunta un nombre a una dirección **IPv6**.|`2001:db8::ff00:42:8329`|
|**CNAME**|Un alias. Apunta un dominio a otro dominio.|`www.tusitio.com` -> `tusitio.com`|
|**MX**|Define los servidores de **correo electrónico**.|`aspmx.l.google.com`|
|**TXT**|Notas de texto (usado para verificar propiedad o seguridad [[SPF]], [[DKIM]]).|`v=spf1 include:_spf...`|
|**NS**|Delega la zona a los **nameservers** autoritativos.|`example.com NS ns1.example.com`|
|**SOA**|Info administrativa de la zona (primario, serial, timers).|`ns1.example.com admin... 2024060301`|
|**SRV**|Host + puerto de un **servicio** específico.|`_sip._udp SRV 10 5 5060 sip.example.com`|
|**PTR**|**Reverse DNS**: mapea IP → nombre.|`1.2.0.192.in-addr.arpa PTR www.example.com`|

---

## Conceptos Clave para Obsidian

- **TTL (Time To Live):** Es el tiempo (en segundos) que un registro DNS permanece en caché antes de ser actualizado. Si cambias de servidor, un TTL alto hará que el cambio tarde horas en reflejarse.
- **Propagación:** El tiempo que tardan todos los servidores del mundo en actualizar la información de un nuevo registro (puede tardar hasta 48 horas).
- **DNS Cache Poisoning:** Un ataque donde se introduce información falsa en un resolvedor para redirigir a los usuarios a sitios maliciosos.


---

## El archivo Hosts

Resolución **manual y local** que saltea el DNS — mapea hostname→IP en un archivo de texto, y precede al DNS en el orden de resolución.

- **Ubicación:** `/etc/hosts` (Linux/macOS) · `C:\Windows\System32\drivers\etc\hosts` (Windows).
- **Formato:** `<IP>    <hostname> [alias...]`
- **Uso ofensivo:** acceder a un **VHost sin registro DNS público** mapeándolo a mano (ej. `10.10.10.5  target.htb`). Ver [[Virtual Host]].

^dns-hosts-file

---

## DNS para Web Recon

Los registros DNS son una mina de info en recon:
- **Descubrir activos:** subdominios, mail servers (MX), nameservers (NS); un CNAME a un host obsoleto → sistema vulnerable / [[Subdomain Takeover]].
- **Mapear infraestructura:** NS revela el proveedor de hosting; un A de `loadbalancer.` o `vpn.` señala puntos de entrada.
- **Monitoreo:** subdominios nuevos = superficie nueva; TXT con `_1password=` / SPF delata stack y vendors (pretexting/phishing).

Comandos → [[DNS - Herramientas]] · [[DNS (53) - Enumeración]]. Replicación abierta → [[Transferencia de Zona DNS]].

^dns-web-recon

---

## Notas Relacionadas

- [[Protocolos de Red]]
- [[Direccion IP]]
- [[WHOIS]]
- [[Servidores Web]]


---
