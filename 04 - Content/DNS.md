---
aliases:
  - Domain Name System
tags:
  - type/concept
type: Concept
linked:
  - "[[DNS (53) - Enumeración]]"
  - "[[DNS - Herramientas]]"
  - "[[Subdominios]]"
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

---

## Conceptos Clave para Obsidian

- **TTL (Time To Live):** Es el tiempo (en segundos) que un registro DNS permanece en caché antes de ser actualizado. Si cambias de servidor, un TTL alto hará que el cambio tarde horas en reflejarse.
- **Propagación:** El tiempo que tardan todos los servidores del mundo en actualizar la información de un nuevo registro (puede tardar hasta 48 horas).
- **DNS Cache Poisoning:** Un ataque donde se introduce información falsa en un resolvedor para redirigir a los usuarios a sitios maliciosos.


---

## Notas Relacionadas

- [[Protocolos de Red]]
- [[Direccion IP]]
- [[WHOIS]]
- [[Servidores Web]]


___
