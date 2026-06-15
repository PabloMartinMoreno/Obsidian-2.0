```bash
#!/bin/bash

file_name='data.gz'

while [ -n "$file_name" ]; do
  7z x "$file_name" &>/dev/null
  echo -e "\n[+] Nuevo archivo descomprimido $file_name"
  file_name="$(7z l "$file_name" 2>/dev/null | tail -n 3 | head -n 1 | awk '{print $NF}')"
done
```

### Condicional `-n` en Bash

En Bash, `-n` es un operador que se utiliza en expresiones condicionales para comprobar si una cadena no está vacía. 

#### Ejemplo Básico

```bash
string="hello"
if [ -n "$string" ]; then
  echo "La cadena no está vacía"
else
  echo "La cadena está vacía"
fi
```

En este ejemplo, el script imprimirá "La cadena no está vacía" porque la variable `string` contiene la cadena "hello".

#### En el Contexto del Script

Veamos la línea relevante del script:

```bash
while [ -n "$file_name" ]; do
```

### Paso a Paso

1. **Evaluación de `-n "$file_name"`:**
   - `"$file_name"` es una variable que contiene el nombre del archivo actual.
   - `-n` es el operador que comprueba si la cadena contenida en `"$file_name"` no está vacía.

2. **Condición del Bucle `while`:**
   - El bucle `while` continuará ejecutándose mientras la condición `[ -n "$file_name" ]` sea verdadera.
   - Esto significa que mientras `"$file_name"` tenga algún valor (es decir, no sea una cadena vacía), el bucle seguirá iterando.

3. **Actualización de `file_name`:**
   - Dentro del bucle, `file_name` se actualiza en cada iteración:
     ```bash
     file_name="$(7z l "$file_name" 2>/dev/null | tail -n 3 | head -n 1 | awk 'NF{print $NF}')"
     ```
   - Este comando intenta encontrar el nombre del siguiente archivo a descomprimir. Si no se encuentra un archivo válido, `file_name` se establece como una cadena vacía.

4. **Terminación del Bucle:**
   - Si en algún momento `file_name` se convierte en una cadena vacía (por ejemplo, cuando no hay más archivos para descomprimir), la condición `[ -n "$file_name" ]` será falsa y el bucle `while` se detendrá.