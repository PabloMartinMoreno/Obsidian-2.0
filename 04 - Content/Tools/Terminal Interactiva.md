---
aliases:
tags:
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Shells]]"
kind: Concept
linked:
---
#  Mejora de Terminal Interactiva

### Configuración inicial

#### Iniciar sesión en una terminal interactiva
    
```bash
script /dev/null -c bash
```
o
```python
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
Luego se envía el proceso a segundo plano con `Ctrl + Z`.

Este comando inicia una sesión de terminal simulada utilizando el programa `script`.
- **`script`**: Es una utilidad que registra todo lo que sucede en una sesión de terminal en un archivo.
- **`/dev/null`**: Especifica que no se guarde ningún registro, ya que `/dev/null` actúa como un "agujero negro" donde se descartan los datos.
- **`-c bash`**: Ejecuta el shell de `bash` dentro de esta sesión simulada.

**Propósito:** Crear un entorno aislado para la ejecución del shell sin guardar un historial o salida.

### Ajuste de la terminal

#### Configurar el modo de terminal y traer el proceso al primer plano
    
```bash
 stty raw -echo; fg
```
- **`stty raw -echo`**:
    - `stty`: Comando para cambiar y mostrar la configuración del terminal.
    - `raw`: Configura el terminal en modo "raw" (sin procesar), lo que significa que los caracteres ingresados no son interpretados ni procesados por el terminal (e.g., teclas de control como `Ctrl+C` no funcionan de la forma habitual).
    - `-echo`: Desactiva la impresión automática de caracteres ingresados en el terminal.
    
    **Efecto:** Cambia el comportamiento del terminal, útil en situaciones donde se necesita manejar directamente las entradas sin interferencias.
    
- **`fg`**:
    - Este comando trae un proceso suspendido al primer plano. Normalmente se usa después de haber detenido un proceso con `Ctrl+Z`.
    
    **Propósito aquí:** Si el comando anterior o el shell estaba en segundo plano, `fg` lo reactiva en el primer plano.
    
#### Reiniciar configuración básica
    
```bash
reset xterm
```
- Esto restablece la configuración de la terminal.
- Se habilita el uso de `Ctrl + C`, pero `Ctrl + L` aún no funciona.
- **`reset`**: Restaura la configuración del terminal a su estado inicial (limpia la pantalla y restablece parámetros).
- **`xterm`**: Especifica que el tipo de terminal a resetear es `xterm`. Esto asegura que el terminal adopte las configuraciones predeterminadas para ese tipo de terminal.

**Propósito:** Solucionar problemas con el terminal si se desconfiguró (por ejemplo, después de usar `stty raw`).

#### Establecer la variable `TERM`
    
```bash
export TERM=xterm
```
- Cambia el valor de `TERM` que, por defecto, es `dumb`.
- Permite habilitar el uso de `Ctrl + L`.

- **`export`**: Establece una variable de entorno que estará disponible para los procesos hijos.
- **`TERM=xterm`**: Define el tipo de terminal como `xterm`.

**Propósito:** Informar a las aplicaciones que el terminal es de tipo `xterm` para que puedan ajustar su comportamiento en consecuencia. Es fundamental para que programas como `vim` o `htop` funcionen correctamente en este entorno.

#### Ajustar las dimensiones de la terminal

- Consultar el tamaño actual:
```bash
stty size
```
        
- Configurar filas y columnas en la terminal de la máquina víctima:
```bash
stty rows 33 columns 150
```

- Ajusta las dimensiones del terminal:
    - **`rows 33`**: Define que el terminal tendrá 33 filas.
    - **`columns 150`**: Define que el terminal tendrá 150 columnas.

**Propósito:** Establecer un tamaño específico para la ventana del terminal, lo cual puede ser útil para aplicaciones que dependen de dimensiones específicas para una correcta visualización.

---

### Resumen del flujo:

1. Se inicia un entorno aislado de terminal (`script`).
2. Se cambia el terminal a modo "raw" y se recupera cualquier proceso suspendido.
3. Se restablece la configuración del terminal a un estado conocido y funcional (`reset`).
4. Se asegura que las aplicaciones reconozcan el terminal como de tipo `xterm` (`TERM=xterm`).
5. Se define un tamaño específico para la ventana del terminal.
