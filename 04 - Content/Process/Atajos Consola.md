---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# Atajos Consola

***

### Repetir el último comando
- **`!!`**: Ejecuta el último comando. Por ejemplo, si acabas de ejecutar `ls`, escribir `!!` ejecutará nuevamente `ls`.

### Repetir el último comando con `sudo`
- **`sudo !!`**: Ejecuta el último comando como superusuario. Es útil si olvidaste usar `sudo` en el comando anterior.

### Repetir el último comando que comienza con una cadena específica
- **`!cadena`**: Ejecuta el último comando que empieza con `cadena`. Por ejemplo, `!ls` ejecutará el último comando que empieza con `ls`.

### Repetir el último comando que contiene una cadena específica
- **`!?cadena`**: Ejecuta el último comando que contiene `cadena`. Por ejemplo, `!?grep` ejecutará el último comando que contiene `grep`.

### Ejecutar el comando anterior modificando un argumento
- **`^old^new^`**: Reemplaza `old` con `new` en el último comando ejecutado. Por ejemplo, si el último comando fue `grep oldfile`, escribir `^old^new^` ejecutará `grep newfile`.

### Usar el historial de comandos
- **`history`**: Muestra el historial de comandos ejecutados. Puedes buscar y reutilizar comandos anteriores a partir de la lista.

### Navegar por el historial de comandos
- **`↑`** y **`↓`**: Navega hacia arriba y abajo en el historial de comandos. Permite editar y volver a ejecutar comandos previos.

### Buscar en el historial de comandos
- **`Ctrl + r`**: Inicia una búsqueda inversa en el historial de comandos. Empieza a escribir para buscar el comando que deseas reutilizar.

