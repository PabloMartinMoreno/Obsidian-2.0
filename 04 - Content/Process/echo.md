# Comando `echo`

### Definición 

> [!INFO] echo
>Se utiliza para mostrar un texto o una cadena en la terminal. Es especialmente útil para scripts y para mostrar mensajes o resultados de comandos.
^definicion

### Sintaxis Básica

```sh
echo [opciones] [cadena]
```

### Subcomandos y Opciones Más Usados

1. **-n**: No imprime la nueva línea al final del texto.
    ```sh
    echo -n "Hola, mundo"
    ```
    Salida: `Hola, mundo` (sin salto de línea)

2. **-e**: Habilita la interpretación de secuencias de escape.
    ```sh
    echo -e "Hola\nmundo"
    ```
    Salida:
    ```
    Hola
    mundo
    ```

3. **-E**: Deshabilita la interpretación de secuencias de escape (habilitado por defecto).
    ```sh
    echo -E "Hola\nmundo"
    ```
    Salida: `Hola\nmundo`

### Ejemplos

1. **Mostrar un mensaje simple**
    ```sh
    echo "Hola, mundo"
    ```
    Salida: `Hola, mundo`

2. **Mensaje sin nueva línea al final**
    ```sh
    echo -n "Hola, mundo"
    ```
    Salida: `Hola, mundo` (sin salto de línea)

3. **Usar secuencias de escape**
    ```sh
    echo -e "Línea 1\nLínea 2"
    ```
    Salida:
    ```
    Línea 1
    Línea 2
    ```

4. **Incluir una variable en el mensaje**
    ```sh
    nombre="Juan"
    echo "Hola, $nombre"
    ```
    Salida: `Hola, Juan`

5. **Redirigir la salida a un archivo**
    ```sh
    echo "Hola, mundo" > saludo.txt
    ```
    Esto creará (o sobrescribirá) un archivo llamado `saludo.txt` con el contenido `Hola, mundo`.

6. **Agregar contenido a un archivo existente**
    ```sh
    echo "Otro saludo" >> saludo.txt
    ```
    Esto agregará `Otro saludo` al final del archivo `saludo.txt`.

### Resumen de Opciones Comunes

- **`-n`**: No imprime nueva línea al final del texto.
- **`-e`**: Habilita secuencias de escape como `\n` (nueva línea), `\t` (tabulación), etc.
- **`-E`**: Deshabilita secuencias de escape (predeterminado).

### Usos Comunes

- Mostrar mensajes en scripts.
- Imprimir valores de variables.
- Generar archivos de texto.
- Mostrar salidas formateadas.

## Uso en variables de entorno del sistema

También se utiliza junto con variables de entorno y expansiones de shell para mostrar información útil sobre el entorno del sistema. Algunos ejemplos comunes:

1. **`echo $?`**: Esto muestra el código de retorno del último comando ejecutado. Por lo general, un valor de `0` indica éxito, mientras que un valor distinto de `0` indica un error. Por ejemplo:
   ```bash
   ls /ruta/no/existente
   echo $?
   ```
   La salida será `2`, que indica que el comando `ls` falló porque la ruta especificada no existe.

2. **`echo $PATH`**: Muestra la lista de directorios donde el sistema busca ejecutables de comandos. Cada directorio está separado por dos puntos (`:`). Por ejemplo:
   ```bash
   echo $PATH
   ```
   La salida podría ser algo como `/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games`, mostrando los directorios donde el sistema busca programas ejecutables.

3. **`echo $SHELL`**: Muestra la ruta del intérprete de comandos (shell) actualmente utilizado por el usuario. Por ejemplo:
   ```bash
   echo $SHELL
   ```
   La salida podría ser `/bin/bash` si estás usando Bash como tu shell.

4. **`echo $HOME`**: Muestra la ruta del directorio personal del usuario actual. Por ejemplo:
   ```
   echo $HOME
   ```
   La salida sería algo como `/home/nombredeusuario`, mostrando el directorio personal del usuario actual.

5. **`echo $USER`**: Muestra el nombre de usuario del usuario actual. Por ejemplo:
   ```bash
   echo $USER
   ```
   La salida sería el nombre de usuario actual, como `nombredeusuario`.

6. **`echo $HOSTNAME`**: Muestra el nombre del host (nombre de la máquina) en la red. Por ejemplo:
   ```bash
   echo $HOSTNAME
   ```
   La salida podría ser el nombre del host de la máquina, como `mi-ordenador`.

7. **`echo $LANG`**: Muestra la configuración de idioma y codificación utilizada por el sistema. Por ejemplo:
   ```bash
   echo $LANG
   ```
   La salida podría ser algo como `en_US.UTF-8`, indicando que el idioma es inglés (en) y la codificación UTF-8.
