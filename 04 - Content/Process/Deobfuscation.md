## Beautify (Embellecer / Formatear)

Vemos que el código actual está escrito en una sola línea. Esto se conoce como **JavaScript minificado**. Para poder leerlo correctamente, necesitamos **formatear** el código.
El método más básico es usar las herramientas de desarrollo del navegador.

Por ejemplo, si usamos **Firefox**, podemos abrir el debugger con:
**CTRL + SHIFT + Z**
Luego hacemos clic en nuestro script *secret.js*. Esto nos mostrará el script con su formato original, pero también podemos hacer clic en el botón **{ }** para aplicar *Pretty Print* y ver el script en un formato JavaScript adecuado.

![[Pasted image 20251115123122.png]]

Además, podemos usar herramientas online o plugins de editores como **Prettier** o **Beautifier**. Copiemos el script *secret.js*:

```javascript
eval(function (p, a, c, k, e, d) { e = function (c) { return c.toString(36) }; if (!''.replace(/^/, String)) { while (c--) { d[c.toString(a)] = k[c] || c.toString(a) } k = [function (e) { return d[e] }]; e = function () { return '\\w+' }; c = 1 }; while (c--) { if (k[c]) { p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]) } } return p }('g 4(){0 5="6{7!}";0 1=8 a();0 2="/9.c";1.d("e",2,f);1.b(3)}', 17, 17, 'var|xhr|url|null|generateSerial|flag|HTB|flag|new|serial|XMLHttpRequest|send|php|open|POST|true|function'.split('|'), 0, {}))
```

Vemos que ambas herramientas lo formatean correctamente:

![[Pasted image 20251115123133.png]]

![[Pasted image 20251115123212.png]]
Sin embargo, el código **sigue siendo difícil de leer**. Esto se debe a que no solo está minificado, sino también **ofuscado**. Por lo tanto, solo embellecerlo no alcanza.
Para entenderlo, necesitaremos **herramientas de desofuscación**.

## Deobfuscate (Desofuscar)

Hay muchas herramientas online que permiten desofuscar JavaScript y convertirlo en algo legible.
Una muy útil es **UnPacker**.

Probemos copiando el código ofuscado anterior y pulsando **UnPack**.

**Tip:** Asegurate de NO dejar líneas vacías antes del script. Puede afectar el proceso y dar resultados incorrectos.

![[Pasted image 20251115123223.png]]

Este tipo de herramientas hace un trabajo mucho mejor y nos da algo entendible:

```javascript
function generateSerial() {
  ...SNIP...
  var xhr = new XMLHttpRequest;
  var url = "/serial.php";
  xhr.open("POST", url, true);
  xhr.send(null);
};
```

Como mencionamos antes, el tipo de ofuscación usado es **packing**.
Otra manera de “desempaquetar” este tipo de código es encontrar el valor retornado al final y usar **console.log** para imprimirlo en lugar de ejecutarlo.

## Reverse Engineering (Ingeniería Inversa)

Aunque estas herramientas son muy útiles para limpiar código, **cuando el código está demasiado ofuscado o codificado**, los métodos automáticos dejan de funcionar.
Esto es especialmente cierto cuando el código fue ofuscado con un **ofuscador personalizado**.

En esos casos, necesitamos **analizar y revertir manualmente** la lógica del código para entender:

* cómo fue ofuscado
* qué hace realmente
* cómo reconstruir su versión original

Si te interesa aprender más sobre desofuscación avanzada e ingeniería inversa en JavaScript, podés revisar el módulo **[Secure Coding 101](https://academy.hackthebox.com/module/details/38)**, que cubre estos temas en detalle.
