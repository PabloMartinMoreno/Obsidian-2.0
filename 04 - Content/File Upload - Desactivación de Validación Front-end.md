---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[File Upload Vulnerabilities]]"
---
# File Upload - Desactivación de Validación Front-end

***

## Cheatsheet de Métodos de Evasión

|                **Método**                 |       **Herramienta**        | **Mecanismo de Acción**                                                                                                                | **Ventaja Principal**                                                                                               |
|:-----------------------------------------:|:----------------------------:| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Modificación de Petición al Back-end**  |   `[[Burp Suite]]` / Proxy   | Interceptar la petición HTTP legítima para alterar el parámetro `filename` y el contenido del archivo antes de que llegue al servidor. | Ignora completamente el código frontend; evade cualquier lógica de validación de la interfaz de usuario.            |
| **Desactivación de Validación Front-end** | `[[DevTools]]` del Navegador | Modificar el DOM en tiempo real para eliminar eventos y atributos restrictivos (ej. `onchange="checkFile(this)"` o `accept`).          | Permite utilizar el flujo normal de la aplicación y la interfaz gráfica original para subir archivos no permitidos. |
^fu-frontend

## Detalles de Implementación

### Modificación de Peticiones al Back-end

Este método aprovecha la intercepción del tráfico para enviar la petición de subida directamente al servidor, saltándose las comprobaciones previas del navegador.

1. **Captura:** Subir un archivo permitido (por ejemplo, una imagen válida) e interceptar la petición HTTP POST resultante.
2. **Modificación del Payload:**
    - Cambiar el parámetro `filename="imagen.png"` por el archivo deseado, como `filename="shell.php"`.
    - Reemplazar el contenido del archivo binario con el código malicioso de la `[[Web Shell]]`.
3. **Ejecución:** Enviar la petición modificada al servidor. Al carecer de validación en el back-end, la respuesta será exitosa (`200 OK`) y el archivo quedará alojado.

### Manipulación del Código Front-end

Consiste en alterar temporalmente la estructura HTML/JS que el navegador está interpretando para desactivar las validaciones antes de seleccionar el archivo.

1. **Inspección:** Abrir el Inspector de Página (ej. `CTRL+SHIFT+C` en Firefox) y ubicar el elemento `<input>` de carga de archivos.
2. **Identificación:** Localizar los atributos responsables de la validación. Típicamente se presentan así:
    ```HTML
    <input type="file" name="uploadFile" id="uploadFile" onchange="checkFile(this)" accept=".jpg,.jpeg,.png">
    ```
3. **Modificación (Eliminación de Restricciones):**
    - Borrar el evento desencadenador de la función JavaScript (ej. eliminar `onchange="checkFile(this)"`).
    - _Opcional:_ Eliminar el atributo `accept=".jpg,.jpeg,.png"` para que el cuadro de diálogo del sistema operativo no oculte extensiones diferentes a las de imagen.
4. **Ejecución:** Seleccionar y subir el archivo `.php` usando el botón normal de la página. Sin la función `checkFile` bloqueando la acción, el formulario se enviará correctamente.

> **Nota:** Estas modificaciones en el DOM son efímeras y no persisten al recargar la página, pero cumplen el objetivo de enviar la petición de carga sin restricciones.

### Interacción Post-Explotación

Tras evadir las validaciones y concretar la subida, el paso final es localizar el punto de acceso para ejecutar código de forma remota ([[RCE]]).
- Utilizar nuevamente el Inspector de Página para examinar dónde se refleja el archivo (ej. buscar etiquetas `<img src="/profile_images/shell.php">`).
- Navegar directamente a la URL identificada para interactuar con la shell (ej. `http://SERVER_IP/profile_images/shell.php?cmd=id`).

---
