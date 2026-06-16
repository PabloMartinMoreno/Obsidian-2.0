---
aliases:
  - ssh
tags:
  - tool/ssh
  - env/linux
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---

# Comando `ssh`

## Definición 

> [!INFO] _**S**ecure **Sh**ell_
> Es el nombre de un [[03 - Conceptos/SSH|SSH]] y del [[#Comando SSH|Programa]] que lo implementa cuya principal función es el acceso remoto a un servidor por medio de un canal seguro en el que toda la información está cifrada.
^Definicion
## Sintaxis Básica

```sh
ssh [opciones] usuario@servidor
```

## Opciones Comunes

- `-p puerto`: Especifica el puerto del servidor al que deseas conectarte. Por defecto, `ssh` utiliza el puerto 22.
  ```sh
  ssh -p 2222 usuario@servidor
  ```
  
- `-i archivo_clave`: Especifica un archivo de clave privada para la autenticación.
  ```sh
  ssh -i ~/.ssh/id_rsa usuario@servidor
  ```
  
- `-L puerto_local:destino:puerto_destino`: Crea un túnel SSH (redirección de puertos) desde un puerto local a un destino remoto.
  ```sh
  ssh -L 8080:localhost:80 usuario@servidor
  ```
  
- `-R puerto_remoto:destino:puerto_destino`: Crea un túnel SSH inverso (redirección de puertos) desde un puerto remoto a un destino local.
  ```sh
  ssh -R 9090:localhost:90 usuario@servidor
  ```

- `-C`: Habilita la compresión de datos, útil para conexiones lentas.
  ```sh
  ssh -C usuario@servidor
  ```
  
- `-N`: No ejecuta comandos remotos; solo establece el túnel.
  ```sh
  ssh -N -L 8080:localhost:80 usuario@servidor
  ```

- `-f`: Envía el comando SSH al fondo después de pedir la contraseña.
  ```sh
  ssh -f -N -L 8080:localhost:80 usuario@servidor
  ```

## Ejemplo Completo

Supongamos que quieres conectarte a un servidor remoto llamado `mi-servidor.com` con el usuario `juan`, en el puerto 2222, usando una clave privada almacenada en `~/.ssh/mi_clave`, y quieres redirigir el puerto 8080 de tu máquina local al puerto 80 en el servidor:
```sh
ssh -p 2222 -i ~/.ssh/mi_clave -L 8080:localhost:80 juan@mi-servidor.com
```