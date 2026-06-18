[[CWES]] [[Web Enumeración]] [[Web Explotación]]

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

El servidor es: 
```
curl -Iv http://www.trilocor.local/

Apache/2.4.41 (Ubuntu)
```

Me encuentro con un wordpress 6.0.2 y astra 3.9.2

También encuentro esto en `robots.txt`: 
```
http://admin.trilocor.local/robots.txt

User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: http://admin.trilocor.local/wp-sitemap.xml
```

