[[CWES]] [[Web Enumeración]] [[Web Explotación]]

### ip y hosts

IP: 
```
10.129.4.195
```

Agregue al /etc/hosts: 
```
10.129.4.195    trilocor.local www.trilocor.local
```

Hice un escaneo de hosts:
```
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -H "Host: FUZZ.trilocor.local" -u http://10.129.4.185/ -fw 5194 -t 100
```
y encontré: `admin` el cual agregué también al /etc/hosts: 
```
10.129.4.195    trilocor.local www.trilocor.local admin.trilocor.local
```

### servidor

El servidor es: 
```
curl -Iv http://www.trilocor.local/

Apache/2.4.41 (Ubuntu)
```

Me encuentro con un wordpress 6.0.2 y astra 3.9.2

### robots.txt

También encuentro esto en `robots.txt`: 
```
http://admin.trilocor.local/robots.txt

User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

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

#### resultado
[[resultado wpscan]]

#### usuarios

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

#### fuerza bruta

Les hago fuerza bruta con wp-scan: 
```
wpscan --password-attack xmlrpc -t 20 -U users-wp.txt -P /usr/share/wordlists/rockyou.txt --url http://admin.trilocor.local/ --api-token [REDACTED]
```

