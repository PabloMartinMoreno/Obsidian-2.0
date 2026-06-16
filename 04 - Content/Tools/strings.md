---
aliases:
  - strings
tags:
  - tool/strings
  - topic/reversing
  - topic/forensics
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Reverse Engineering]]"
kind: Tool
linked:
  - "[[Hex Dump]]"
  - "[[Common Linux Utilities]]"
---

# Comando `strings`
### Definición 

> [!INFO] strings
>Se utiliza para buscar y mostrar secuencias de caracteres imprimibles en archivos binarios o cualquier otro tipo de archivo. Es particularmente útil para examinar archivos binarios o ejecutables para encontrar texto que pueda estar incrustado en ellos, como mensajes de error, nombres de funciones, etc.
^definicion

### Sintaxis Básica

```bash
strings [opciones] archivo
```

### Opciones Comunes

1. **-a, --all**: Examina todo el archivo en lugar de solo las secciones iniciales.
2. **-o, --octal**: Muestra las posiciones de los caracteres imprimibles encontrados en notación octal.
3. **-t {o,d,x}, --radix={o,d,x}**: Imprime la posición en octal (o), decimal (d), o hexadecimal (x).
4. **-e {s,S,b,l,B,L}**: Define la codificación de caracteres a usar (s: single-byte, S: single-byte, b: big-endian 16-bit, l: little-endian 16-bit, B: big-endian 32-bit, L: little-endian 32-bit).
5. **-n número**: Muestra cadenas con al menos el número de caracteres especificados.
6. **-f archivo, --file archivo**: Lee la lista de archivos desde un archivo.

### Ejemplos de Uso

1. **Básico**: Mostrar todas las cadenas imprimibles en un archivo.
   ```bash
   strings archivo.bin
   ```

2. **Con Longitud Mínima de Cadena**: Mostrar cadenas de al menos 5 caracteres.
   ```bash
   strings -n 5 archivo.bin
   ```

3. **Posiciones en Hexadecimal**: Mostrar posiciones en hexadecimal de las cadenas encontradas.
   ```bash
   strings -t x archivo.bin
   ```

4. **Big-endian 16-bit Codificación**: Usar codificación big-endian de 16 bits.
   ```bash
   strings -e b archivo.bin
   ```

5. **Leer Archivos desde un Archivo de Lista**: Especificar una lista de archivos a procesar.
   ```bash
   strings -f lista_de_archivos.txt
   ```

### Ejemplo Práctico

Supongamos que tienes un archivo ejecutable y quieres ver si hay alguna cadena de texto que pueda proporcionar información sobre su funcionalidad:

```bash
strings -n 4 -t d programa.bin
```
En este ejemplo, `-n 4` asegura que solo se muestren cadenas de al menos 4 caracteres y `-t d` muestra las posiciones de las cadenas en decimal.

### Conclusión

El comando `strings` es una herramienta útil para analizar archivos binarios en busca de texto incrustado, lo que puede ser útil para la ingeniería inversa, la depuración y la auditoría de seguridad. Con sus diversas opciones, puedes ajustar la búsqueda de cadenas imprimibles de acuerdo a tus necesidades específicas.