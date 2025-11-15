## Obfuscator

Vamos a visitar **obfuscator.io**. Antes de hacer clic en *Obfuscate*, cambiaremos la opción **String Array Encoding** a **Base64**, como se ve aquí:

![[Pasted image 20251115122357.png]]

Ahora podemos pegar nuestro código y hacer clic en *Obfuscate*:

![[Pasted image 20251115122405.png]]

Obtenemos el siguiente código:

```javascript
var _0x1ec6=['Bg9N','sfrciePHDMfty3jPChqGrgvVyMz1C2nHDgLVBIbnB2r1Bgu='];(function(_0x13249d,_0x1ec6e5){var _0x14f83b=function(_0x3f720f){while(--_0x3f720f){_0x13249d['push'](_0x13249d['shift']());}};_0x14f83b(++_0x1ec6e5);}(_0x1ec6,0xb4));var _0x14f8=function(_0x13249d,_0x1ec6e5){_0x13249d=_0x13249d-0x0;var _0x14f83b=_0x1ec6[_0x13249d];if(_0x14f8['eOTqeL']===undefined){var _0x3f720f=function(_0x32fbfd){var _0x523045='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=',_0x4f8a49=String(_0x32fbfd)['replace'](/=+$/,'');var _0x1171d4='';for(var _0x44920a=0x0,_0x2a30c5,_0x443b2f,_0xcdf142=0x0;_0x443b2f=_0x4f8a49['charAt'](_0xcdf142++);~_0x443b2f&&(_0x2a30c5=_0x44920a%0x4?_0x2a30c5*0x40+_0x443b2f:_0x443b2f,_0x44920a++%0x4)?_0x1171d4+=String['fromCharCode'](0xff&_0x2a30c5>>(-0x2*_0x44920a&0x6)):0x0){_0x443b2f=_0x523045['indexOf'](_0x443b2f);}return _0x1171d4;};_0x14f8['oZlYBE']=function(_0x8f2071){var _0x49af5e=_0x3f720f(_0x8f2071);var _0x52e65f=[];for(var _0x1ed1cf=0x0,_0x79942e=_0x49af5e['length'];_0x1ed1cf<_0x79942e;_0x1ed1cf++){_0x52e65f+='%'+('00'+_0x49af5e['charCodeAt'](_0x1ed1cf)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x52e65f);},_0x14f8['qHtbNC']={},_0x14f8['eOTqeL']=!![];}var _0x20247c=_0x14f8['qHtbNC'][_0x13249d];return _0x20247c===undefined?(_0x14f83b=_0x14f8['oZlYBE'](_0x14f83b),_0x14f8['qHtbNC'][_0x13249d]=_0x14f83b):_0x14f83b=_0x20247c,_0x14f83b;};console[_0x14f8('0x0')](_0x14f8('0x1'));
```

Este código está claramente mucho más ofuscado, y no podemos ver ningún rastro de nuestro código original. Ahora podemos probarlo en **jsconsole.com** para confirmar que todavía cumple su función original.

Probá también jugar con las configuraciones de **obfuscator.io** para generar código aún más ofuscado, y luego ejecútalo en JSConsole para verificar que sigue funcionando.

## More Obfuscation (Más Ofuscación)

Ahora deberíamos tener una idea clara de cómo funciona la ofuscación de código. Sin embargo, existen muchas variantes de herramientas de ofuscación, cada una de las cuales ofusca el código de forma diferente. Tomemos el siguiente código JavaScript como ejemplo:

```javascript
[][(![]+[])[+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]][([][(![]+[])[+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(!
...SNIP...
```

Podemos ejecutar este código y seguirá realizando su función original:

![[Pasted image 20251115122419.png]]

**Nota:** El código fue recortado porque es demasiado largo, pero la versión completa debería ejecutarse correctamente.

Podemos intentar ofuscar código usando la misma herramienta en **[JSF](http://www.jsfuck.com/)** y ejecutarlo nuevamente. Notaremos que el código puede tardar más en correr, lo cual demuestra cómo la ofuscación puede afectar el rendimiento, como mencionamos antes.

Hay muchos otros ofuscadores de JavaScript, como **[JJ Encode](https://utf-8.jp/public/jjencode.html)** o **[AA Encode](https://utf-8.jp/public/aaencode.html)**. Sin embargo, estos suelen hacer que la ejecución o compilación del código sea extremadamente lenta, así que no se recomienda usarlos a menos que haya una razón clara, como evadir filtros web o restricciones.
