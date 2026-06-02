---
tags:
  - estado/completo
plataforma: "[[OverTheWire]]"
web: https://overthewire.org/wargames/bandit/bandit12.html
dificultad: Fácil
autor:
linked:
  - "[[Descompresor (Bandit 12)]]"
  - "[[xxd]]"
  - "[[Hex dump]]"
  - "[[Bandit 11]]"
  - "[[Bandit 13]]"
---
# Datos

> [!todo] Objetivo
> La contraseña para el siguiente nivel se almacena en el archivo data.txt, que es un hexdump de un archivo que ha sido comprimido repetidamente. Para este nivel puede ser útil crear un directorio bajo /tmp en el que puedas trabajar. Utilice mkdir con un nombre de directorio difícil de adivinar. O mejor, utilice el comando "mktemp -d". Luego copia el archivo de datos usando cp, y renómbralo usando mv (¡lee las páginas de manual!)
^objetivo

>[!tip] Recursos
> **Comandos:**
> grep, sort, uniq, strings, base64, tr, tar, gzip, bzip2, xxd, mkdir, cp, mv, file
> 
> **Material:**
> [Hex dump](https://en.wikipedia.org/wiki/Hex_dump)
^recursos

# Resolución

```bash
xxd -r data.txt
```

A continuación puedo empezar a descomprimir archivo por archivo, algunos usan distintos programas para descomprimirlo dependiendo el formato, pero no lo recomiendo. La herramienta [[7z]] puede con todos los formatos, eso también me permite poder crear un script que descomprima todo con una sola ejecución.

[[Descompresor (Bandit 12)|Descompresor]]

# Bandera(s)

> [!flag] `FO5dwFsc0cbaIiH0h8J2eUks2vdTDwAn`
^bandera
