
---

## 1. Cuando encuentras un servicio en la nube "fantasma" (Error 404 de terceros)

Estás haciendo fuerza bruta de subdominios y te topas con que `soporte.objetivo.com` devuelve un error como:

* *"NoSuchBucket"* (Amazon S3)
* *"There is no app here"* (Heroku)
* *"404 Not Found"* (GitHub Pages o Shopify)

**El indicio:** El subdominio apunta a un servicio externo que el cliente ya dio de baja, pero se olvidaron de borrar el registro DNS.
**Tu acción con `dig`:** Corres `dig soporte.objetivo.com CNAME` para confirmar a qué URL externa apunta y verificar si puedes registrar tú ese recurso para suplantarlos (**Subdomain Takeover**).

---

## 2. Cuando el escaneo de Nmap te devuelve una IP pero no un dominio

A veces escaneas un rango de red y encuentras un servidor web en la IP `192.0.2.45` que tiene un panel de login, pero no sabes qué nombre de dominio le pertenece (lo cual necesitas para buscar subdominios o vulnerabilidades asociadas).

**El indicio:** Tienes la IP, pero te falta el contexto del negocio.
**Tu acción con `dig`:** Usas el **mapeo inverso** con el parámetro `-x`. Esto le pregunta al DNS: *"Oye, ¿qué dominio vive en esta IP?"*

```bash
dig -x 192.0.2.45

```

---

## 3. Cuando estás preparando un ataque de Phishing o Ingeniería Social

Si el alcance del pentest incluye simular un ataque de phishing y necesitas saber si puedes clonar el correo de la empresa sin que sus correos reboten o caigan en la bandeja de spam.

**El indicio:** Necesitas medir la madurez de la seguridad del correo del objetivo.
**Tu acción con `dig`:** Revisas los registros de seguridad del correo. Si al lanzar `dig objetivo.com TXT` ves que:

* No hay registro **SPF**, o el que hay termina en `+all` o `?all` (permite que cualquiera envíe correos en su nombre).
* No existe política **DMARC** (`_dmarc.objetivo.com`).

---

## 4. Cuando cambias de red y un sitio "desaparece" o cambia

Estás auditando una empresa. Cuando estás conectado a su VPN, el sitio `interno.empresa.com` resuelve a una IP de clase A (`10.x.x.x`), pero cuando te desconectas, el sitio deja de cargar o resuelve a una IP pública diferente.

**El indicio:** La empresa utiliza **Split-Horizon DNS** (el DNS da respuestas diferentes dependiendo de si estás dentro o fuera de la red).
**Tu acción con `dig`:** Usas `dig` apuntando primero al DNS interno de la empresa y luego a uno público (`@8.8.8.8`) para comparar qué activos ocultan al mundo exterior.

---

## 5. Cuando ves servidores DNS propios en lugar de proveedores grandes

Haces un reconocimiento rápido y ves que los servidores `NS` del objetivo no son de Cloudflare, AWS o GoDaddy, sino algo como `ns1.empresa-local.com`.

**El indicio:** Infraestructura DNS propia o de un proveedor pequeño mal gestionado. Los administradores suelen olvidar capar las transferencias de zona en sus propios servidores.
**Tu acción con `dig`:** Es el momento obligado para intentar un ataque de transferencia de zona (`AXFR`) para intentar clonar toda su base de datos DNS.