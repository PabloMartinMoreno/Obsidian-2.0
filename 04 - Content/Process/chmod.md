# Comando `chmod`

### Definición 

> [!INFO] chmod
>Se utiliza para cambiar los permisos de acceso de archivos y directorios.
^definicion

```bash
chmod [opciones] modo archivo
```

Donde:
- `opciones`: Son argumentos adicionales que puedes utilizar según tu necesidad.
- `modo`: Es la representación simbólica o numérica de los [[Permisos]] que deseas establecer.
- `archivo`: Es el archivo o directorio al que deseas cambiar los permisos.

### Modo Simbólico

En el modo simbólico, utilizas letras y símbolos para indicar cómo modificar los permisos existentes. Las letras son:

- `u` (usuario/propietario)
- `g` (grupo)
- `o` (otros)
- `a` (todos, equivale a `ugo`)

Los símbolos son:
- + (agregar permiso)
- - (eliminar permiso)
- = (establecer permiso exacto)

#### Ejemplos de Modo Simbólico

- `chmod u+r archivo`: Agrega permiso de lectura al propietario.
- `chmod go-w archivo`: Elimina permiso de escritura para grupo y otros.
- `chmod a+x archivo`: Otorga permiso de ejecución a todos.

#### Ejemplos de Modo Simbólico

- `chmod u+r archivo`: Agrega permiso de lectura al propietario.
- `chmod go-w archivo`: Elimina permiso de escritura para grupo y otros.
- `chmod a+x archivo`: Otorga permiso de ejecución a todos.
### Modo Numérico

En el modo numérico, los permisos se especifican usando un número octal que representa los permisos. Los números octales se usan para representar combinaciones de permisos. Cada cifra en el número octal representa permisos específicos para el propietario del archivo, el grupo y otros usuarios. Por ejemplo:

- `4` (lectura)
- `2` (escritura)
- `1` (ejecución)

Para establecer permisos, estos números se suman:
- `4` para permisos de lectura
- `2` para permisos de escritura
- `1` para permisos de ejecución

Entonces, si deseas establecer permisos de lectura y escritura (pero no ejecución), sumarías `4` y `2`, lo que resulta en `6`.

#### Ejemplos de Modo Numérico (notación octal)

- `chmod 644 archivo`: Esto establece permisos de lectura y escritura para el propietario y solo lectura para el grupo y otros.
- `chmod 755 directorio`: Esto otorga permisos de lectura, escritura y ejecución al propietario, y solo lectura y ejecución a grupo y otros.

### Ejemplos

- `chmod 755 archivo`: Establece permisos de lectura, escritura y ejecución para el propietario, y lectura y ejecución para grupo y otros.
- `chmod u+x,go-w archivo`: Agrega permiso de ejecución al propietario y elimina permisos de escritura para grupo y otros.

### Uso en permisos especiales

[[SUID & SGID]]
[[Sticky Bit]]

### Más información

https://www.ionos.es/digitalguide/servidores/know-how/asignacion-de-permisos-de-acceso-con-chmod/

