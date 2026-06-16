---
aliases:
  - more
tags:
  - tool/more
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

# more

### Definición 

> [!INFO] more
> Es una herramienta utilizada para visualizar el contenido de archivos de texto en la terminal de manera paginada, es decir, permite ver el contenido de un archivo pantalla por pantalla. Esto es útil cuando se trata de archivos largos que no caben en una sola pantalla, ya que permite desplazarse por el archivo en secciones manejables.
^definicion

### Sintaxis

```bash
more [opciones] [archivo]
```

- `archivo`: Es el archivo de texto que se desea visualizar.
- `opciones`: Son parámetros adicionales que modifican el comportamiento del comando.

### Funcionamiento Básico

Cuando se ejecuta `more`, el archivo especificado se muestra en la pantalla una página a la vez. Una página generalmente se define por la cantidad de líneas que caben en la terminal. Al llegar al final de una página, `more` espera a que el usuario indique cómo proceder.

### Comandos de Navegación

Mientras se utiliza `more`, se pueden usar varios comandos de teclado para navegar a través del archivo:

- **Espacio**: Avanza una página.
- **Enter**: Avanza una línea.
- **b**: Retrocede una página.
- **q**: Salir de `more`.
- **/cadena**: Busca hacia adelante la siguiente aparición de "cadena" en el archivo.
- **n**: Repite la búsqueda anterior.
- **h**: Muestra un resumen de los comandos disponibles.

### Opciones Comunes

- `-num`: Define el número de líneas por pantalla. Por ejemplo, `more -10 archivo.txt` muestra 10 líneas por pantalla.
- `-d`: Muestra mensajes de error más amigables y espera a que el usuario presione una tecla para continuar.
- `-c`: Muestra el contenido limpiando la pantalla antes de cada nueva página, en lugar de hacer scroll.
- `-s`: Comprime múltiples líneas en blanco consecutivas en una sola línea en blanco.

### Ejemplos

1. **Visualizar un archivo con `more`:**

   ```bash
   more archivo.txt
   ```

   Muestra el contenido de `archivo.txt` pantalla por pantalla.

2. **Especificar el número de líneas por página:**

   ```bash
   more -5 archivo.txt
   ```

   Muestra el archivo con solo 5 líneas por pantalla.

3. **Buscar dentro del archivo:**

   Una vez que el archivo está abierto con `more`, se puede buscar una palabra o frase usando `/`.

   ```bash
   /palabra
   ```

   Esto buscará la próxima aparición de "palabra" en el archivo.

### Comparación con `less`

Aunque `more` es útil, el comando `less` es más avanzado y flexible. `less` permite navegar tanto hacia adelante como hacia atrás en el archivo, y tiene más opciones de búsqueda y visualización.

### Casos de Uso

El comando `more` es útil cuando se necesita visualizar rápidamente un archivo largo en la terminal sin necesidad de abrir un editor de texto. Es especialmente útil en scripts donde se desea mostrar el contenido de un archivo a un usuario en forma de texto paginado.