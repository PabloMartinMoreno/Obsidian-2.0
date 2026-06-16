---
aliases:
  - md5sum
tags:
  - tool/md5sum
  - env/linux
  - topic/forensics
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

# md5sum

## Definición 

> [!INFO] md5sum (**M**essage **D**igest **5** check**sum**) 
>Se utiliza para calcular y verificar sumas de verificación MD5 (Message Digest 5). Una suma de verificación MD5 es un valor hash de 128 bits generado a partir de un archivo o una cadena de texto. Este valor hash es único para los datos proporcionados, lo que significa que incluso un pequeño cambio en los datos producirá un hash completamente diferente.
^definicion

#### Principales usos de `md5sum`

1. **Verificación de la integridad de archivos**:
   - `md5sum` se usa comúnmente para verificar la integridad de un archivo. Esto es útil, por ejemplo, cuando se descargan archivos de Internet y se quiere asegurar que el archivo no ha sido modificado o corrompido durante la descarga.
  
2. **Verificación de archivos duplicados**:
   - Como el hash MD5 es único para cada conjunto de datos, se puede usar para comparar archivos y determinar si son idénticos, sin necesidad de comparar los archivos completos.

#### Cómo funciona

Al ejecutar `md5sum`, el comando lee el archivo o los datos de entrada y genera un hash MD5. Este hash se representa como una cadena de 32 caracteres hexadecimales.

## Sintaxis básica

```bash
md5sum [opciones] [archivo]
```

- **[archivo]**: Especifica el archivo o los archivos para los que se desea calcular el hash MD5. Si no se proporciona ningún archivo, `md5sum` leerá desde la entrada estándar.
- **[opciones]**: Las opciones adicionales permiten modificar el comportamiento del comando.

## Ejemplos prácticos

#### Calcular el hash MD5 de un archivo
```bash
md5sum archivo.txt
```
Este comando generará y mostrará el hash MD5 del archivo `archivo.txt` en la terminal, seguido del nombre del archivo.

#### Guardar el hash MD5 en un archivo `.md5`
```bash
md5sum archivo.txt > archivo.md5
```
Guarda el resultado en un archivo `.md5`

#### Verificar la integridad de un archivo
Si se dispone del hash MD5 de un archivo que se desea verificar, se puede hacer lo siguiente:
```bash
md5sum -c archivo.md5
```
Este comando verificará que el archivo especificado en `archivo.md5` coincida con su hash MD5. El archivo `.md5` suele contener líneas con el hash MD5 seguido del nombre del archivo.

#### Calcular el hash MD5 de una cadena de texto
```bash
echo -n "cadena de texto" | md5sum
```
Este comando genera el hash MD5 de la cadena `"cadena de texto"`. La opción `-n` evita que se incluya el salto de línea generado por `echo` en el cálculo.

### Opciones comunes

- **`-b`**: Trata la entrada como binaria. Este es el comportamiento predeterminado en Windows.
- **`-c`**: Verifica los hashes MD5 almacenados en un archivo.
- **`-t`**: Trata la entrada como texto. Este es el comportamiento predeterminado en Unix/Linux.

### No reversible

Cuando se calcula el hash MD5 de un texto usando `md5sum`, se obtiene una cadena única (el hash) que representa ese texto. Sin embargo, es crucial entender que el proceso de hashing es **unidireccional**, lo que significa que **no es posible revertir el hash para obtener el texto original**.

En otras palabras, una vez que se genera un hash a partir de un texto, no existe un método directo para "deshacer" el hash y recuperar el texto original. Esto se debe a que el hash es una función matemática diseñada para ser irreversible, es decir, dado un hash, no se puede determinar con precisión el texto que lo generó.

`md5sum` no altera el archivo en absoluto; simplemente calcula un hash del contenido del archivo. Esto significa que el archivo original permanece intacto después de ejecutar `md5sum`. Por lo tanto, no es necesario revertir un archivo tras haberle calculado su hash con `md5sum`, ya que el archivo no sufre ninguna modificación durante el proceso.

## Más usos en archivos

#### Verificación de Integridad después de una Descarga

Uno de los usos más comunes de `md5sum` es la verificación de archivos descargados. Muchos sitios web y repositorios de software publican el hash MD5 de sus archivos junto con el enlace de descarga. Después de descargar un archivo, se puede calcular su hash MD5 localmente y compararlo con el hash publicado para asegurarse de que el archivo no ha sido corrompido o alterado durante la descarga.

```bash
md5sum archivo_descargado.iso
```
Si el hash generado coincide con el hash publicado, el archivo es íntegro.

#### Detección de Archivos Duplicados

`md5sum` puede utilizarse para identificar archivos duplicados. Si se tiene una colección de archivos y se quiere verificar si algunos de ellos son idénticos, se puede calcular el hash MD5 de cada archivo y compararlos. Archivos con el mismo hash MD5 son probablemente duplicados.

```bash
md5sum archivo1.bin archivo2.bin archivo3.bin
```
Si los hashes de varios archivos coinciden, esos archivos son duplicados.

#### Verificación de Integridad después de una Transferencia de Archivos

Cuando se transfieren archivos entre sistemas o a través de redes, puede ser necesario verificar que los archivos no se hayan corrompido durante la transferencia. `md5sum` permite calcular el hash del archivo antes y después de la transferencia para confirmar su integridad.

1. **En el sistema de origen**:
   ```bash
   md5sum archivo_para_transferir.tar.gz > archivo_para_transferir.md5
   ```

2. **En el sistema de destino**:
   ```bash
   md5sum -c archivo_para_transferir.md5
   ```
Este proceso verifica que el archivo transferido es idéntico al original.

#### Verificación de la Integridad de Backups

Para asegurar que los backups (copias de seguridad) se han realizado correctamente y que los archivos no se han corrompido con el tiempo, se pueden generar hashes MD5 de los archivos respaldados y almacenarlos. Posteriormente, se pueden verificar los archivos de los backups con los hashes almacenados.

```bash
md5sum archivo_importante.txt > archivo_importante.txt.md5
# En el futuro:
md5sum -c archivo_importante.txt.md5
```

#### Comprobación de Archivos Grandes en Diferentes Partes

Para archivos grandes, como imágenes de disco o archivos de video, se pueden calcular hashes MD5 para diferentes partes del archivo. Esto permite verificar la integridad de secciones específicas del archivo, lo que es útil si solo se sospecha de la corrupción en una parte del archivo.

```bash
split -b 500M archivo_grande.iso parte_
md5sum parte_*
```
Esto divide el archivo en partes de 500 MB y luego calcula el hash MD5 de cada parte.

#### Verificación de Archivos en Sistemas Distribuidos

En sistemas distribuidos o en aplicaciones donde los archivos se replican entre varios servidores, `md5sum` se puede usar para garantizar que todas las réplicas de un archivo son idénticas. Al comparar los hashes MD5 de los archivos replicados, se puede identificar si alguna réplica se ha corrompido o modificado.


## Usos en texto

#### Verificación de la Integridad de un Texto

Si se necesita asegurar que un texto no ha sido alterado, se puede calcular el hash MD5 del texto original y luego, en el futuro, calcular nuevamente el hash del texto supuestamente inalterado. Si los hashes coinciden, el texto no ha cambiado; si no coinciden, ha habido alguna modificación.

#### Almacenamiento y Comparación de Contraseñas

Aunque MD5 ya no se recomienda para contraseñas debido a su vulnerabilidad a ataques de colisión y fuerza bruta, históricamente se ha utilizado para almacenar contraseñas en sistemas. La idea era almacenar el hash MD5 de la contraseña en lugar de la contraseña en sí. Al intentar autenticar, se compara el hash de la contraseña ingresada con el hash almacenado.

#### Identificación Única de Cadenas

El hash MD5 de un texto puede servir como identificador único para esa cadena. Esto es útil en sistemas donde se necesita una forma rápida de identificar o comparar cadenas de texto largas, ya que comparar dos hashes es más eficiente que comparar los textos completos.

#### Generación de Firmas o Checksums

En sistemas de control de versiones o de bases de datos, se puede generar un hash MD5 de un texto para mantener un registro de versiones o cambios. El hash actúa como una firma o resumen del contenido, facilitando la detección de cambios o la restauración de versiones anteriores.

#### Validación de Datos en APIs o Comunicaciones

En algunas APIs, se utiliza el hash MD5 de un mensaje o conjunto de datos para validar la autenticidad o integridad de los datos transmitidos. Por ejemplo, un servidor puede enviar el hash MD5 de los datos junto con los datos mismos, y el cliente puede verificar que los datos recibidos no han sido alterados calculando el hash MD5 de los datos y comparándolo con el hash proporcionado.

#### Evitar Reenvíos Duplicados en Mensajería

En sistemas de mensajería o colas de procesamiento, el hash MD5 de un mensaje puede utilizarse para detectar y evitar reenvíos duplicados, asegurando que cada mensaje se procese solo una vez.

## Importancia de la suma MD5

Aunque MD5 ha sido ampliamente utilizado, se considera obsoleto para propósitos de seguridad debido a su vulnerabilidad a ataques de colisión, donde dos entradas diferentes pueden producir el mismo hash MD5. Sin embargo, sigue siendo útil para tareas como la verificación de integridad de archivos no sensibles.

## Conclusión

El uso de `md5sum` en archivos, especialmente en el contexto de descargas, transferencias y backups, es fundamental para garantizar la integridad y autenticidad de los datos. Aunque MD5 ya no es seguro para aplicaciones criptográficas debido a las vulnerabilidades conocidas en el algoritmo MD5, sigue siendo una herramienta valiosa para detectar corrupción o modificaciones accidentales en archivos. Es recomendable usar algoritmos más robustos como SHA-256 para aplicaciones que requieran una mayor seguridad.  