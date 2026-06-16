---
aliases:
  - uniq
tags:
  - tool/uniq
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

# Comando `uniq`

### Definición 

> [!INFO] uniq
>Se utiliza para filtrar o encontrar líneas únicas (o líneas duplicadas) en un archivo de texto.
^definicion

### Sintaxis básica:
```
uniq [opciones] [archivo]
```

### Opciones comunes:
- `-c`: Muestra el número de ocurrencias de cada línea junto con la línea.
- `-d`: Muestra solo las líneas duplicadas, es decir, aquellas que aparecen más de una vez consecutivamente.
- `-i`: Ignora las diferencias entre mayúsculas y minúsculas al comparar líneas.
- `-u`: Muestra solo las líneas que no están duplicadas, es decir, aquellas que aparecen solo una vez.

### Ejemplos de uso:

1. **Mostrar líneas únicas en un archivo:**
   ```
   uniq archivo.txt
   ```

2. **Mostrar líneas únicas y contar ocurrencias:**
   ```
   uniq -c archivo.txt
   ```

3. **Mostrar solo líneas duplicadas:**
   ```
   uniq -d archivo.txt
   ```

4. **Mostrar solo líneas únicas (sin duplicados):**
   ```
   uniq -u archivo.txt
   ```

### Ejemplo detallado:

Supongamos que tenemos un archivo llamado `frutas.txt` con el siguiente contenido:

```
manzana
naranja
manzana
pera
naranja
pera
```

- Para mostrar solo las líneas únicas:
  ```
  uniq frutas.txt
  ```
  Salida:
  ```
  manzana
  naranja
  manzana
  pera
  naranja
  pera
  ```

- Para mostrar las líneas únicas y contar las ocurrencias:
  ```
  uniq -c frutas.txt
  ```
  Salida:
  ```
      1 manzana
      1 naranja
      2 manzana
      1 pera
      1 naranja
      1 pera
  ```

- Para mostrar solo las líneas duplicadas:
  ```
  uniq -d frutas.txt
  ```
  Salida:
  ```
  manzana
  naranja
  ```

- Para mostrar solo las líneas únicas (sin duplicados):
  ```
  uniq -u frutas.txt
  ```
  Salida:
  ```
  naranja
  pera
  ```
