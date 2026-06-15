# Comando `diff`

### Definición 

> [!INFO] diff
>Se utiliza para comparar archivos o directorios y mostrar las diferencias entre ellos. Es una herramienta muy útil para ver cambios entre versiones de archivos, especialmente en el contexto de desarrollo de software.
^definicion

### Uso Básico de `diff`

La sintaxis básica del comando `diff` es:

```bash
diff [opciones] archivo1 archivo2
```

### Subcomandos y Opciones Más Usadas

1. **Comparación de Archivos**
   - **`diff archivo1 archivo2`**: Muestra las diferencias entre `archivo1` y `archivo2`.

2. **Comparación de Directorios**
   - **`diff -r directorio1 directorio2`**: Compara recursivamente dos directorios.

3. **Ignorar Espacios en Blanco**
   - **`diff -w archivo1 archivo2`**: Ignora diferencias en espacios en blanco.
   - **`diff -B archivo1 archivo2`**: Ignora líneas en blanco.

4. **Formato de Salida**
   - **`diff -u archivo1 archivo2`**: Muestra la salida en formato unificado, que es más legible y se utiliza comúnmente en parches.
   - **`diff -c archivo1 archivo2`**: Muestra la salida en formato de contexto.
   - **`diff --side-by-side archivo1 archivo2`**: Muestra las diferencias lado a lado.

5. **Crear un Archivo de Parche**
   - **`diff -u archivo1 archivo2 > archivo.patch`**: Crea un archivo de parche con las diferencias entre `archivo1` y `archivo2`.

6. **Comparación de Binarios**
   - **`diff -a archivo1 archivo2`**: Trata los archivos como texto incluso si son binarios.

### Ejemplos

1. **Comparación Básica de Archivos**

   ```bash
   diff archivo1.txt archivo2.txt
   ```

   Esto mostrará las líneas que difieren entre `archivo1.txt` y `archivo2.txt`.

2. **Comparación en Formato Unificado**

   ```bash
   diff -u archivo1.txt archivo2.txt
   ```

   La salida se verá algo así:

```
   --- archivo1.txt 2024-07-31 10:00:00.000000000 +0000
   +++ archivo2.txt 2024-07-31 10:00:00.000000000 +0000
   @@ -1,3 +1,3 @@
   -Línea en archivo1
   +Línea modificada en archivo2
    Otra línea
    Una línea más
```

3. **Comparación Lado a Lado**

   ```bash
   diff --side-by-side archivo1.txt archivo2.txt
   ```

   La salida se verá algo así:

   ```
   Línea en archivo1                 | Línea modificada en archivo2
   Otra línea                        Otra línea
   Una línea más                     Una línea más
   ```

4. **Comparación de Directorios Recursiva**

   ```bash
   diff -r directorio1 directorio2
   ```

   Esto comparará todos los archivos y subdirectorios dentro de `directorio1` y `directorio2`.

5. **Ignorar Espacios en Blanco**

   ```bash
   diff -w archivo1.txt archivo2.txt
   ```

   Esto ignorará las diferencias en espacios en blanco entre `archivo1.txt` y `archivo2.txt`.

### Resumen

El comando `diff` es esencial para comparar archivos y directorios en Linux. Sus opciones más utilizadas incluyen la comparación recursiva de directorios (`-r`), ignorar diferencias en espacios en blanco (`-w`), y mostrar la salida en formato unificado (`-u`). Estos subcomandos permiten ajustar la comparación según las necesidades específicas, haciendo que `diff` sea una herramienta flexible y poderosa en el manejo de archivos y la gestión de versiones.