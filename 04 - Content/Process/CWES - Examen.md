[[CWES]] [[Web Enumeración]] [[Web Explotación]]

IP: 
```
10.129.4.187
```

Agregue al /etc/hosts: 
```
10.129.4.187    trilocor.local www.trilocor.local
```

Hice un escaneo de hosts:
```
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -H "Host: FUZZ.trilocor.local" -u http://10.129.4.185/ -fw 5194 -t 100
```
y encontré: `admin` el cual agregué también al /etc/hosts: 
```
10.129.4.187    trilocor.local www.trilocor.local admin.tricolor.local
```