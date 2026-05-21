---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
kind: CheatSheet
linked:
---
# Base de NVIM

## Operadores de Edición y Cambio

### d (delete/borrar):
- **Uso:** Borra el texto determinado por un movimiento.
- **Ejemplos:**
    - `dw`: Borra desde el cursor hasta el final de la palabra.
    - `dd`: Borra la línea completa.

### c (change/cambiar):
- **Uso:** Elimina el texto abarcado por el movimiento y entra en modo inserción para que puedas escribir el reemplazo.
- **Ejemplos:**
    - `cw`: Cambia la palabra desde el cursor hasta su final.
    - `ci(`: Cambia el contenido dentro de paréntesis.

### y (yank/copiar):
- **Uso:** Copia el texto determinado por el movimiento al registro.
- **Ejemplos:**
    - `yw`: Copia la palabra.
    - `yy`: Copia la línea completa.

### s (substitute/reescribir):
- **Uso:** Borra el carácter bajo el cursor y entra en modo inserción (similar a `cl`).

### cc (cambiar línea):
- **Uso:** Borra la línea entera y entra en modo inserción para reemplazarla.

### ~ (cambio de mayúsculas/minúsculas):
- **Uso:** Invierte el caso del carácter bajo el cursor. Si se utiliza con un movimiento, actúa sobre el rango seleccionado.

### gu y gU (modificar el caso):
- **Uso:**
    - `gu{motion}`: Convierte a minúsculas el rango indicado.
    - `gU{motion}`: Convierte a mayúsculas el rango indicado.

### g~{motion} (invertir caso en un rango):
- **Uso:** Invierte el caso en el rango determinado por el movimiento.

### . (punto de repetición):
- **Uso:** Repite la última acción de cambio, lo que es muy útil para aplicar la misma modificación en varias partes del texto.

---

## Movimientos y Navegación

### 0:
- **Uso:** Mueve el cursor al inicio de la línea.
### ^:
- **Uso:** Mueve el cursor al primer carácter no blanco de la línea.
### $:
- **Uso:** Mueve el cursor al final de la línea.
### w:
- **Uso:** Salta al inicio de la siguiente palabra.
### e:
- **Uso:** Mueve el cursor al final de la palabra actual.
### b:
- **Uso:** Salta al inicio de la palabra anterior.
### { y }:
- **Uso:** Permiten saltar entre párrafos o bloques de texto separados por líneas en blanco.
### gg:
- **Uso:** Lleva el cursor al principio del archivo.
### G:
- **Uso:** Lleva el cursor al final del archivo o a una línea numérica específica (por ejemplo, `50G` para ir a la línea 50).
### H, M y L:
- **Uso:**
    - `H`: Mueve el cursor a la parte superior de la ventana.
    - `M`: Mueve el cursor a la línea central de la ventana.
    - `L`: Mueve el cursor a la parte inferior de la ventana.
### %:
- **Uso:** Salta entre caracteres emparejados, como `(` y `)`, o `{` y `}`.
### \*:
- **Uso:** Busca la siguiente aparición de la palabra bajo el cursor.
### #:
- **Uso:** Busca la aparición anterior de la palabra bajo el cursor.

---

## Comandos de Búsqueda y Reemplazo

### /pattern:
- **Uso:** Inicia una búsqueda hacia adelante del patrón especificado.
### ?pattern:
- **Uso:** Inicia una búsqueda hacia atrás del patrón especificado.
### n:
- **Uso:** Repite la búsqueda en la misma dirección que la última búsqueda.
### N:
- **Uso:** Repite la búsqueda en la dirección opuesta a la última búsqueda.
### :s/patrón/reemplazo/[flags]:
- **Uso:** Realiza la sustitución en la línea actual, reemplazando el patrón por el texto indicado.
### :%s/patrón/reemplazo/[flags]:
- **Uso:** Realiza la sustitución en todo el archivo.
### &:
- **Uso:** Repite la última sustitución en la línea actual.
### g&:
- **Uso:** Repite la última sustitución de forma global (por ejemplo, en todo el archivo o en el rango seleccionado).

---

## Modos Visuales y Selección de Texto

### v:
- **Uso:** Entra en modo visual (selección carácter por carácter).
### V:
- **Uso:** Entra en modo visual línea a línea.
### Ctrl+v:
- **Uso:** Entra en modo visual por bloques (selección rectangular).
### gv:
- **Uso:** Reselecciona el último bloque de texto que se había seleccionado en modo visual, facilitando aplicar otra operación.
### o (en modo visual):
- **Uso:** Permite cambiar el extremo activo de la selección mientras estás en modo visual.

---

## Formateo y Unión de Líneas

### J:
- **Uso:** Une la línea actual con la siguiente, insertando un espacio entre ambas si es necesario.
- **Ejemplo:**  
    Si tienes:
    ```
    Hola,
    mundo!
    ```
    Al presionar `J`, el resultado será:
    ```
    Hola, mundo!
    ```
### gJ:
- **Uso:** Une la línea actual con la siguiente sin insertar ningún espacio adicional.
- **Ejemplo:**  
    Con el mismo contenido anterior, `gJ` dará:
    ```
    Hola,mundo!
    ```
### gq:
- **Uso:** Formatea (o “reflowea”) el párrafo, ajustando los saltos de línea según la opción `textwidth` o el programa configurado en `formatprg`.
### = (operador de indentación):
- **Uso:** Indenta el texto.
- **Ejemplos:**
    - \==: Indenta la línea actual.
    - `=ap`: Indenta el párrafo completo.

---

## Manejo de Archivos, Buffers y Ventanas

### :e nombre_del_archivo:
- **Uso:** Abre (edita) un archivo especificado.
### gf:
- **Uso:** Abre el archivo cuyo nombre esté bajo el cursor, utilizando la opción `path` para buscarlo.
### Ctrl+^ (o Ctrl+6):
- **Uso:** Alterna entre el archivo actual y el último archivo editado.
### :bnext y :bprev:
- **Uso:** Permiten navegar entre buffers abiertos.
### :ls o :buffers:
- **Uso:** Muestra una lista de todos los buffers activos.
### :split o :sp:
- **Uso:** Divide la ventana horizontalmente y abre una copia del archivo en la nueva división.
### :vsplit o :vsp:
- **Uso:** Divide la ventana verticalmente y abre una copia del archivo en la nueva división.
### Ctrl+w h/j/k/l:
- **Uso:** Navega entre ventanas:
    - `Ctrl+w h`: Mueve el foco a la ventana izquierda.
    - `Ctrl+w j`: Mueve el foco a la ventana inferior.
    - `Ctrl+w k`: Mueve el foco a la ventana superior.
    - `Ctrl+w l`: Mueve el foco a la ventana derecha.

---

## Macros y Repetición de Acciones

### q{registro}:
- **Uso:** Inicia la grabación de una macro en el registro especificado (por ejemplo, `qa` para grabar en el registro `a`).
### q (para finalizar la grabación):
- **Uso:** Finaliza la grabación de la macro.
### @{registro}:
- **Uso:** Ejecuta la macro almacenada en el registro indicado (por ejemplo, `@a`).
### @@:
- **Uso:** Repite la última macro ejecutada.
### . (punto de repetición):
- **Uso:** Repite la última acción de cambio, facilitando la edición repetitiva.


___

# Vim-Surround (plugin)

### ys (You Surround)
- **Uso:** Agrega un delimitador (o "surround") alrededor de un objeto seleccionado.
- **Ejemplo:**
    - `ysiw)`
        - **Explicación:**
            - `ys` indica “you surround”.
            - `iw` es el objeto: la palabra actual (inner word).
            - `)` es el delimitador que se agregará (se colocarán paréntesis alrededor de la palabra).
        - **Resultado:**  
            La palabra `ejemplo` se transforma en `(ejemplo)`.
### ds (Delete Surround)
- **Uso:** Elimina el delimitador que rodea al objeto.
- **Ejemplo:**
    - `ds"`
        - **Explicación:**  
            Si tienes `"texto"` y el cursor está en cualquier parte del objeto, al ejecutar `ds"`, se eliminarán las comillas.
        - **Resultado:**  
            Se obtiene `texto` sin los delimitadores.
### cs (Change Surround)
- **Uso:** Cambia el delimitador actual por uno nuevo.
- **Ejemplo:**
    - `cs"'`
        - **Explicación:**  
            Si tienes `"texto"` y deseas cambiar las comillas dobles por simples, `cs"'` reemplazará las comillas dobles con comillas simples.
        - **Resultado:**  
            El texto se transformará en `'texto'`.
### yss (You Surround Entire Line)
- **Uso:** Rodea **toda** la línea con el delimitador especificado.
- **Ejemplo:**
    - `yss"`
        - **Explicación:**  
            Si la línea es `texto` y ejecutas `yss"`, la línea quedará rodeada por comillas dobles.
        - **Resultado:**  
            La línea se convierte en `"texto"`.
### yS (You Surround en modo visual)
- **Uso:** Permite, estando en modo visual, rodear la selección con un delimitador.
- **Ejemplo:**
    - Selecciona un bloque de texto en modo visual y luego presiona `S)` para rodearlo con paréntesis.
        - **Resultado:**  
            El bloque seleccionado se encierra entre `(` y `)`.

___

# Tecla G

1. **g(Movimiento)**
   - `gj`: Mueve el cursor a la siguiente línea visual, independientemente de la longitud real de la línea.
   - `gk`: Mueve el cursor a la línea visual anterior.
   - `g0`: Mueve el cursor al primer carácter de la línea visual actual.
   - `g$`: Mueve el cursor al último carácter de la línea visual actual.
   - `g^`: Mueve el cursor al primer carácter no en blanco de la línea visual actual.
   - `g*`: Busca la siguiente aparición de la palabra bajo el cursor, considerando solo palabras completas.
   - `g#`: Busca la aparición anterior de la palabra bajo el cursor, considerando solo palabras completas.
   - `g&`: Repite el último comando de sustitución en todo el archivo.
   - `gv`: Selecciona de nuevo la última selección visual.

2. **g{carácter}**
   - `ga`: Muestra el valor ASCII/Unicode del carácter bajo el cursor.
   - `g~`: Invierte el caso de los caracteres en el rango seleccionado.
   - `gu`: Convierte el rango seleccionado a minúsculas.
   - `gU`: Convierte el rango seleccionado a mayúsculas.
   - `gd`: Salta a la definición local de la palabra bajo el cursor.
   - `gD`: Salta a la definición global de la palabra bajo el cursor.
   - `gf`: Abre el archivo cuyo nombre está bajo el cursor.
   - `gF`: Abre el archivo cuyo nombre está bajo el cursor en una nueva ventana.

3. **g{Número}**
   - `g;`: Salta al siguiente punto de cambio en la lista de cambios.
   - `g,`: Salta al punto de cambio anterior en la lista de cambios.

4. **Otras combinaciones**
   - `g<Ctrl-G>`: Muestra información detallada sobre el archivo actual.
   - `gI`: Inserta texto en la columna cero, sin importar la indentación de la línea.
   - `gJ`: Une líneas sin insertar espacios adicionales.
   - `gQ`: Formatea el texto seleccionado usando el formateador predeterminado.

___

# Comando de sustitución

### Sintaxis básica

La sintaxis básica del comando de sustitución es:

```
:[rango]s/patrón/reemplazo/[flags]
```

- `rango`: Especifica el rango de líneas donde se aplicará la sustitución. Si se omite, solo afecta la línea actual.
- `patrón`: Es la expresión regular que describe el texto a buscar.
- `reemplazo`: Es el texto que reemplazará el patrón encontrado.
- `flags`: Modificadores opcionales que cambian el comportamiento del comando.

### Ejemplos básicos

1. **Sustituir en la línea actual:**
   ```
   :s/viejo/nuevo/
   ```
   Reemplaza la primera aparición de "viejo" por "nuevo" en la línea actual.

2. **Sustituir todas las apariciones en la línea actual:**
   ```
   :s/viejo/nuevo/g
   ```
   El modificador `g` (global) indica que se deben reemplazar todas las ocurrencias en la línea actual.

3. **Sustituir en un rango específico de líneas:**
   ```
   :3,5s/viejo/nuevo/
   ```
   Reemplaza la primera aparición de "viejo" por "nuevo" en las líneas de la 3 a la 5.

4. **Sustituir en todo el archivo:**
   ```
   :%s/viejo/nuevo/g
   ```
   El símbolo `%` representa todo el archivo. Con `g`, se reemplazan todas las ocurrencias en todo el archivo.

### Flags comunes

- `g`: Reemplaza todas las apariciones en cada línea especificada.
- `c`: Solicita confirmación antes de cada sustitución. Esto es útil para revisar los cambios antes de aplicarlos.
- `i`: Ignora mayúsculas y minúsculas al buscar el patrón.
- `I`: No ignora mayúsculas y minúsculas (es el comportamiento por defecto, pero puede ser útil si `ignorecase` está habilitado en la configuración de Vim).
- `n`: Muestra el número de sustituciones realizadas sin hacer cambios.

### Ejemplos avanzados

1. **Sustitución con confirmación:**
   ```
   :%s/viejo/nuevo/gc
   ```
   Reemplaza todas las apariciones de "viejo" por "nuevo" en todo el archivo, pero pide confirmación antes de cada sustitución.

2. **Sustitución con expresión regular compleja:**
   ```
   :%s/\<viejo\>/nuevo/g
   ```
   Reemplaza solo las palabras exactas "viejo" por "nuevo". Los delimitadores `\<` y `\>` aseguran que "viejo" se trate como una palabra completa.

3. **Sustitución ignorando mayúsculas:**
   ```
   :%s/viejo/nuevo/gi
   ```
   Reemplaza todas las ocurrencias de "viejo" por "nuevo", ignorando la diferencia entre mayúsculas y minúsculas.

4. **Contar sustituciones sin cambiar nada:**
   ```
   :%s/viejo/nuevo/gn
   ```
   Muestra cuántas sustituciones se harían, pero no realiza ningún cambio.

### Rango y contexto

- `:s/`: Aplica la sustitución solo en la línea actual.
- `:%s/`: Aplica la sustitución en todo el archivo.
- `:1,10s/`: Aplica la sustitución desde la línea 1 hasta la 10.
- `:'<,'>s/`: Aplica la sustitución en la selección visual.

---

# Registros

### " (Registro por defecto):
- **Uso:**  
    Es el registro que se utiliza de manera predeterminada cuando no se especifica otro registro.
- **Ejemplo:**  
    Al ejecutar `yy` para copiar una línea, el texto se guarda en este registro; al usar `p` se pega desde allí.

### 0 (Registro de Yank):
- **Uso:**  
    Almacena el último texto copiado mediante el comando `y` (yank) que no provenga de una operación de borrado.
- **Ejemplo:**  
    Después de usar `yy`, puedes pegar el contenido con `"0p`.

### 1 al 9 (Registros Numéricos):
- **Uso:**  
    Se utilizan para almacenar el texto borrado mediante operaciones como `d` o `c`. Cada vez que borras, el contenido se guarda en el registro `1`, y los borrados anteriores se desplazan hacia registros numéricos mayores.
- **Ejemplo:**  
    Al borrar una línea con `dd`, el contenido se almacena en el registro `1`. Si borras otra línea, el anterior contenido se mueve al registro `2`, y así sucesivamente.

### a-z (Registros Nombrados):
- **Uso:**  
    Permiten guardar texto en registros con nombres específicos para su reutilización posterior.
- **Ejemplo:**
    - Para copiar una línea al registro `a`:
        ```vim
        "ayy
        ```
    - Para pegar desde el registro `a`:
        ```vim
        "ap
        ```
        
### * y + (Registros del Portapapeles):
- **Uso:**
    - **`*`:** Interactúa con la selección primaria del sistema (muy utilizado en entornos X11).
    - **`+`:** Se asocia al portapapeles del sistema, facilitando la copia y pega entre Vim/Neovim y otras aplicaciones.
- **Ejemplo:**
    - Para copiar al portapapeles del sistema:
        ```vim
        "*y   o   "+y
        ```
    - Para pegar desde el portapapeles:
        ```vim
        "*p   o   "+p
        ```

### _ (Registro de la Papelera o "Black Hole"):
- **Uso:**  
    Permite descartar texto, de modo que el contenido borrado no se almacena en ningún otro registro, evitando sobrescribir datos valiosos.
- **Ejemplo:**  
    Para borrar sin almacenar el texto en ningún registro:
    ```vim
    "_d
    ```
    
### Registros Especiales:
- **Registro `/` (Última Búsqueda):**
    - **Uso:** Guarda el último patrón de búsqueda utilizado.
- **Registro `:` (Última Línea de Comando):**
    - **Uso:** Almacena la última línea de comando ejecutada.
- **Registro `.` (Último Cambio):**
    - **Uso:** Contiene el último cambio realizado en el texto.

### Visualización de Registros:
- **Comando:**
    ```vim
    :registers
    ```
    o
    ```vim
    :reg
    ```
- **Uso:**  
    Muestra el contenido de todos los registros, lo que te permite revisar qué texto contiene cada uno.

___

En **Neovim** (nvim) las marcas (o _marks_) son una herramienta muy útil para **navegar rápidamente** por tus archivos. Permiten **guardar posiciones específicas** dentro de un archivo y regresar a ellas en cualquier momento sin tener que desplazarte manualmente. Aquí te explico en detalle cómo funcionan:

---
# Marcas

- **Marcas en Neovim:** Permiten guardar y saltar a posiciones específicas dentro de un archivo.
- **Establecer una marca:**
    - Usa `m` seguido de una **letra**.
    - **Minúsculas:** Marcas locales (solo en el archivo actual).
    - **Mayúsculas:** Marcas globales (pueden guardarse entre sesiones).
- **Navegar a una marca:**
    - `'letra` para saltar a la **línea** de la marca.
    - `` `letra `` para ir a la **posición exacta** (línea y columna).
- **Marcas especiales:**
    - `"` guarda la última posición al cerrar el archivo.
    - `.` indica la última modificación.
    - `^` marca el inicio del modo de inserción.
- **Ver todas las marcas:** Usa el comando `:marks`.