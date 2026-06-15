# Herramienta xxd

### Definición 

> [!INFO] xxd
>Se utiliza para crear un volcado hexadecimal de un archivo o una entrada estándar. Es útil para analizar archivos binarios, ver el contenido de archivos en formato hexadecimal y convertir entre formatos binarios y hexadecimales. 
^definicion

### Sintaxis Básica
```bash
xxd [opciones] [archivo]
```

### Opciones Comunes

1. **`-r`**: Esta opción invierte el proceso de volcado hexadecimal, convirtiendo el formato hexadecimal de nuevo a su formato binario original.
   ```bash
   xxd -r archivo.hex > archivo.bin
   ```

2. **`-p`**: Produce un volcado hexadecimal en formato continuo, sin direcciones ni ASCII.
   ```bash
   xxd -p archivo.bin
   ```

3. **`-c`**: Especifica el número de bytes por línea en el volcado hexadecimal (por defecto es 16).
   ```bash
   xxd -c 32 archivo.bin
   ```

4. **`-l`**: Limita el volcado a los primeros N bytes del archivo.
   ```bash
   xxd -l 64 archivo.bin
   ```

5. **`-s`**: Comienza el volcado en la posición especificada.
   ```bash
   xxd -s 128 archivo.bin
   ```

### Ejemplos de Uso

1. **Volcado Hexadecimal Básico**
   ```bash
   xxd archivo.bin
   ```
   Este comando mostrará el contenido de `archivo.bin` en formato hexadecimal.

2. **Convertir un Archivo a Hexadecimal y Luego Invertir el Proceso**
   ```bash
   xxd archivo.bin > archivo.hex
   xxd -r archivo.hex > archivo_recuperado.bin
   ```

3. **Volcado en Formato Continuo**
   ```bash
   xxd -p archivo.bin
   ```
   Este comando mostrará el contenido de `archivo.bin` en formato hexadecimal continuo, sin direcciones ni ASCII.

4. **Volcado con 32 Bytes por Línea**
   ```bash
   xxd -c 32 archivo.bin
   ```

5. **Volcado Limitado a los Primeros 64 Bytes**
   ```bash
   xxd -l 64 archivo.bin
   ```

6. **Volcado a Partir de una Posición Específica**
   ```bash
   xxd -s 128 archivo.bin
   ```

7. **Usar `xxd` con Entrada Estándar**
   ```bash
   echo "Hola Mundo" | xxd
   ```
   Este comando muestra el volcado hexadecimal de la cadena "Hola Mundo".

### Detalle del Formato de Salida

El volcado hexadecimal producido por `xxd` generalmente tiene la siguiente estructura:

```plaintext
00000000: 5468 6973 2069 7320 616e 2065 7861 6d70  This is an examp
00000010: 6c65 206f 6620 6865 7820 6461 7461 2e0a  le of hex data..
```

- **Columna de Dirección**: La primera columna (p.ej., `00000000`) muestra la dirección de inicio de la línea en el archivo.
- **Columna de Datos Hexadecimales**: Las columnas siguientes muestran los datos en formato hexadecimal.
- **Columna de Texto ASCII**: La última columna muestra la representación ASCII de los datos hexadecimales, si es imprimible.

### Conclusión

El comando `xxd` es una herramienta poderosa para cualquier administrador de sistemas o desarrollador que necesite analizar o manipular datos binarios. Su flexibilidad permite no solo la conversión de archivos a formato hexadecimal, sino también la capacidad de revertir esa conversión, proporcionando una manera eficaz de manejar y visualizar datos binarios.