## Basic Obfuscation (Ofuscación Básica)

La ofuscación de código normalmente no se hace de manera manual, ya que existen muchas herramientas para distintos lenguajes que realizan la ofuscación automáticamente. Hay muchas herramientas en línea que pueden hacerlo, aunque muchos actores maliciosos y desarrolladores profesionales crean sus propios ofuscadores para dificultar aún más la desofuscación.

## Ejecutando código JavaScript

Tomemos la siguiente línea de código como ejemplo e intentemos ofuscarla:

```javascript
console.log('HTB JavaScript Deobfuscation Module');
```

Primero, probemos ejecutar este código en texto claro para ver cómo funciona. Podemos ir a JSConsole, pegar el código y presionar Enter para ver la salida:

![[Pasted image 20251115121930.png]]

Vemos que esta línea imprime *HTB JavaScript Deobfuscation Module*, lo cual se hace usando la función `console.log()`.

## Minificación de JavaScript

Una forma común de reducir la legibilidad de un fragmento de JavaScript sin afectar su funcionalidad es la minificación. Minificar código significa poner todo el código en una sola línea (generalmente muy larga). La minificación es más útil en códigos largos, ya que si nuestro código solo tuviera una línea, prácticamente no cambiaría al minificarlo.

Muchas herramientas permiten minificar código JavaScript, como *javascript-minifier*. Simplemente copiamos nuestro código, hacemos clic en **Minify**, y obtenemos la versión minificada al lado:

![[Pasted image 20251115121945.png]]

De nuevo, podemos copiar el código minificado en JSConsole y ejecutarlo, y veremos que funciona igual. Por convención, los archivos JavaScript minificados suelen guardarse con la extensión `.min.js`.

**Nota:** La minificación no es exclusiva de JavaScript; también se puede aplicar a muchos otros lenguajes, como se ve en *javascript-minifier*.

## Empaquetado (Packing) de código JavaScript

Ahora vamos a ofuscar nuestra línea de código para hacerla más oscura y difícil de leer. Primero, probaremos BeautifyTools para ofuscarlo:

![[Pasted image 20251115122000.png]]

```javascript
eval(function(p,a,c,k,e,d){e=function(c){return c};if(!''.replace(/^/,String)){while(c--){d[c]=k[c]||c}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('5.4(\'3 2 1 0\');',6,6,'Module|Deobfuscation|JavaScript|HTB|log|console'.split('|'),0,{}))
```

Vemos que el código quedó mucho más ofuscado y difícil de leer. Podemos copiarlo en JSConsole para verificar que sigue cumpliendo su función:

![[Pasted image 20251115122011.png]]
Obtenemos la misma salida.

**Nota:** Este tipo de ofuscación se conoce como *packing* (empaquetado), que suele ser reconocible por los seis argumentos usados en la función inicial `function(p,a,c,k,e,d)`.

Un empaquetador normalmente intenta convertir todas las palabras y símbolos del código en una lista o diccionario, y luego referirse a ellos mediante la función `(p,a,c,k,e,d)` para reconstruir el código original durante la ejecución. Esa función puede variar entre empaquetadores, pero siempre mantiene un orden específico para saber cómo reconstruir las palabras y símbolos durante la ejecución.

Aunque un *packer* reduce muchísimo la legibilidad del código, aún se pueden ver cadenas importantes en texto claro, lo que puede revelar parte de su funcionalidad. Por eso, muchas veces conviene buscar métodos de ofuscación aún más avanzados.
