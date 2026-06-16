---
aliases:
  - tr
tags:
  - tool/tr
  - env/linux
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

# Comando `tr`

### Definición 

> [!INFO] tr (Translate)
>Se utiliza para traducir o eliminar caracteres de la entrada estándar (stdin) y escribir el resultado en la salida estándar (stdout). Es especialmente útil para transformar texto y manipular cadenas de caracteres.
^definicion

### Sintaxis

```sh
tr [opciones] set1 [set2]
```

### Opciones Comunes

1. **`-d`**: Elimina los caracteres en `set1` de la entrada.
2. **`-s`**: Reemplaza secuencias de un carácter repetido que están en `set1` con un solo carácter.
3. **`-c`**: Complementa `set1` (usa todos los caracteres excepto los que están en `set1`).
4. **`-t`**: Trunca `set1` para que tenga la misma longitud que `set2`.

### Ejemplos

#### 1. Convertir minúsculas a mayúsculas

```sh
echo "hello world" | tr 'a-z' 'A-Z'
```

Salida:
```
HELLO WORLD
```

#### 2. Eliminar dígitos

```sh
echo "my password is 1234" | tr -d '0-9'
```

Salida:
```
my password is 
```

#### 3. Comprimir espacios en blanco

```sh
echo "too    many   spaces" | tr -s ' '
```

Salida:
```
too many spaces
```

#### 4. Sustituir caracteres

```sh
echo "Hello World" | tr 'e' 'a'
```

Salida:
```
Hallo World
```

#### 5. Complementar y eliminar

Para eliminar todos los caracteres excepto letras y números:

```sh
echo "hello!@# 123" | tr -cd 'a-zA-Z0-9'
```

Salida:
```
hello123
```

#### 6. Usar `tr` con `-c` para eliminar caracteres no alfabéticos

```sh
echo "hello123" | tr -cd 'a-zA-Z'
```

Salida:
```
hello
```

#### 7. Rotar 13 caracteres

```sh
echo "Texto a rotar" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```
- `'A-Za-z'`: Especifica el rango de caracteres que deben ser traducidos. En este caso, se incluyen todas las letras mayúsculas (A-Z) y minúsculas (a-z).
- `'N-ZA-Mn-za-m'`: Especifica el rango de caracteres a los que deben ser traducidos los caracteres en el primer rango. Las letras A-M se rotan a N-Z y las letras N-Z se rotan a A-M. Lo mismo se aplica a las letras minúsculas (a-m y n-z).

**Como ROT13 es un cifrado simétrico, aplicar el mismo proceso a un texto cifrado lo decifra de nuevo, esto se debe a que son 26 las letras del alfabeto.**

### Extra

ROT13 es útil principalmente para ocultar texto fácilmente legible, como spoilers o respuestas a acertijos, pero no es seguro para protección de datos sensible debido a su simplicidad y facilidad de descifrado.