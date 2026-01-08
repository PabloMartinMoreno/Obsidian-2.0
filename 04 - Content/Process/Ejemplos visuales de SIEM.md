### Ejemplo de Visualización en SIEM 1: Intentos de Inicio de Sesión Fallidos (Todos los Usuarios)

Los tableros (_dashboards_) en las soluciones SIEM sirven como contenedores para múltiples visualizaciones, lo que nos permite organizar y mostrar datos de una manera significativa.

En esta y las siguientes secciones, crearemos un tablero y algunas visualizaciones desde cero.

#### Desarrollando Nuestro Primer Tablero y Visualización

Navega hasta la parte inferior de esta sección y haz clic en _"Click here to spawn the target system!"_ (¡Clic aquí para generar el sistema objetivo!).

Ahora, navega a `http://[IP Objetivo]:5601`, haz clic en el interruptor de navegación lateral y haz clic en **"Dashboard"**.

Elimina el tablero existente "SOC-Alerts" como se muestra a continuación.
![[Pasted image 20260108170608.png]]

Al visitar la página de Dashboard nuevamente, se nos presentará un mensaje indicando que actualmente no existen tableros. Además, habrá una opción disponible para crear un nuevo Tablero y su primera visualización. Para iniciar la creación de nuestro primer tablero, simplemente tenemos que hacer clic en el botón **"Create new dashboard"** (Crear nuevo tablero).
![[Pasted image 20260108170618.png]]

Ahora, para iniciar la creación de nuestra primera visualización, simplemente tenemos que hacer clic en el botón **"Create visualization"** (Crear visualización).
![[Pasted image 20260108170627.png]]

Al iniciar la creación de nuestra primera visualización, aparecerá la siguiente ventana nueva con varias opciones y configuraciones.

Antes de proceder con cualquier configuración, es importante que primero hagamos clic en el **icono de calendario** para abrir el selector de tiempo. Luego, debemos especificar el rango de fechas como **"last 15 years"** (últimos 15 años). Finalmente, podemos hacer clic en el botón **"Apply"** para aplicar el rango de fechas especificado a los datos.
![[Pasted image 20260108170636.png]]

Hay cuatro cosas que debemos notar en esta ventana:

1. Una opción de **filtro** que nos permite filtrar los datos antes de crear un gráfico. Por ejemplo, si nuestro objetivo es mostrar intentos de inicio de sesión fallidos, podemos usar un filtro para considerar solo los IDs de eventos que coincidan con **4625 – Intento de inicio de sesión fallido** en un sistema Windows. La siguiente imagen demuestra cómo podemos especificar dicho filtro.
![[Pasted image 20260108170647.png]]
    
2. Este campo indica el conjunto de datos (**índice**) que vamos a utilizar. Es común que los datos de varias fuentes de infraestructura se separen en diferentes índices, como red, Windows, Linux, etc. En este ejemplo particular, especificaremos `windows*` en el "Index pattern".
    
3. Esta **barra de búsqueda** nos brinda la capacidad de verificar dos veces la existencia de un campo específico dentro de nuestro conjunto de datos. Por ejemplo, digamos que estamos interesados en el campo `user.name.keyword`. Podemos usar la barra de búsqueda para realizar rápidamente una búsqueda y verificar si este campo está presente.
    ![[Pasted image 20260108170700.png]]
    
4. Por último, este menú desplegable nos permite seleccionar el **tipo de visualización** que queremos crear. La opción predeterminada es "Bar vertical stacked". Si hacemos clic en ese botón, revelará opciones adicionales disponibles.
    ![[Pasted image 20260108170718.png]]

Para esta visualización, seleccionemos la opción **"Table"** (Tabla). Después de seleccionar "Table", podemos proceder a hacer clic en la opción **"Rows"** (Filas). Esto nos permitirá elegir los elementos de datos específicos que queremos incluir en la vista de tabla.
![[Pasted image 20260108170748.png]]

Configuremos los ajustes de "Rows" de la siguiente manera:
![[Pasted image 20260108170755.png]]

Avanzando, cerremos la ventana "Rows" y procedamos a ingresar a la configuración de **"Metrics"** (Métricas).
![[Pasted image 20260108170950.png]]

En la ventana "Metrics", seleccionemos **"count"** como la métrica deseada.
![[Pasted image 20260108170958.png]]

Tan pronto como seleccionemos "Count" como la métrica, observaremos que la tabla se puebla con datos (asumiendo que hay eventos presentes en el conjunto de datos seleccionado).
![[Pasted image 20260108171005.png]]

Una adición final a la tabla es incluir otra configuración de "Rows" para mostrar la máquina donde ocurrió el intento de inicio de sesión fallido. Para hacer esto, seleccionaremos el campo `host.hostname.keyword`, que representa la computadora que reporta el intento de inicio de sesión fallido.
![[Pasted image 20260108171014.png]]

Ahora podemos ver tres columnas en la tabla, que contienen la siguiente información:

1. El **nombre de usuario** de las personas que inician sesión.
    
2. La **máquina** en la que ocurrió el intento de inicio de sesión.
    
3. El **número de veces** que ha ocurrido el evento.
    

Finalmente, haz clic en **"Save and return"**, y observarás que la nueva visualización se agrega al tablero.
![[Pasted image 20260108171021.png]]

No olvidemos guardar el tablero también. Podemos hacerlo simplemente haciendo clic en el botón **"Save"**.
![[Pasted image 20260108171031.png]]

---

#### Refinando la Visualización

Supongamos que el Gerente del SOC sugirió los siguientes refinamientos:

- Se deben especificar **nombres de columna más claros** en la visualización.
    
- El **Tipo de Inicio de Sesión** (_Logon Type_) debe incluirse en la visualización.
    
- Los resultados en la visualización deben estar **ordenados**.
    
- Los nombres de usuario `DESKTOP-DPOESND`, `WIN-OK9BH1BCKSD` y `WIN-RMMGJA7T9TC` **no deben ser monitoreados**.
    
- Las **cuentas de computadora** no deben ser monitoreadas (no es una buena práctica).
    

Refinemos la visualización que creamos para que cumpla con las sugerencias anteriores.

1. Navega a `http://[IP Objetivo]:5601`, ve a **"Dashboard"**.
    
2. El tablero que creamos anteriormente debería ser visible. Hagamos clic en el icono de **"lápiz"/editar**.
    ![[Pasted image 20260108171055.png]]
3. Ahora hagamos clic en el botón de **"engranaje"** en la esquina superior derecha de nuestra visualización, y luego hagamos clic en **"Edit lens"**.
    ![[Pasted image 20260108171103.png]]

**Cambios de configuración:**

- **Cambiar nombre de columna Usuario:** En la configuración de filas para `user.name.keyword`, cambia el "Display name" a **"Username"**.
    ![[Pasted image 20260108171127.png]]
    ![[Pasted image 20260108171139.png]]
- **Cambiar nombre de columna Host:** En la configuración de filas para `host.hostname.keyword`, cambia el "Display name" a **"Event logged by"**.
    ![[Pasted image 20260108171206.png]]
    
- **Agregar Tipo de Inicio de Sesión:** Agrega una nueva fila usando el campo `winlog.logon.type.keyword` y establece el "Display name" a **"Logon Type"**.
![[Pasted image 20260108171216.png]]
![[Pasted image 20260108171226.png]]
- **Cambiar nombre de Métrica:** En la configuración de métricas, cambia el nombre a **"# of logins"** y alinea el texto a la derecha ("Right").
    ![[Pasted image 20260108171238.png]]
    
- **Ordenar resultados:** Haz clic en el encabezado de la columna "# of logins" para ordenar descendentemente.
    ![[Pasted image 20260108171257.png]]

Todo lo que tenemos que hacer ahora es hacer clic en **"Save and return"**.
![[Pasted image 20260108171323.png]]

**Excluyendo Usuarios y Cuentas de Computadora:**

Los nombres de usuario específicos se pueden excluir especificando filtros adicionales (usando el operador "is not").

Las cuentas de computadora se pueden excluir especificando la siguiente consulta **KQL** y haciendo clic en el botón "Update":

YAML

```
NOT user.name: *$ AND winlog.channel.keyword: Security
```
![[Pasted image 20260108171342.png]]

Esta es nuestra visualización después de todos los refinamientos que realizamos.
![[Pasted image 20260108171349.png]]

Finalmente, démosle un título a nuestra visualización haciendo clic en **"No Title"** y asignándole uno adecuado (ej. "Failed Logons Table").
![[Pasted image 20260108171356.png]]

No olvides hacer clic en el botón **"Save"** para guardar los cambios en el tablero completo.