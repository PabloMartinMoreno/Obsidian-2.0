## Qué es la ofuscación

La ofuscación es una técnica usada para hacer que un script sea más difícil de leer para los humanos, pero que siga funcionando igual desde el punto de vista técnico, aunque el rendimiento pueda ser un poco más lento. Esto normalmente se logra de forma automática utilizando una herramienta de ofuscación, que toma el código como entrada e intenta reescribirlo de una manera mucho más difícil de leer, dependiendo de su diseño.

Por ejemplo, los ofuscadores de código suelen convertir el código en un diccionario de todas las palabras y símbolos usados dentro del mismo, y luego intentan reconstruirlo durante la ejecución refiriéndose a cada palabra y símbolo desde ese diccionario. Lo siguiente es un ejemplo de un código JavaScript simple siendo ofuscado:

![[Pasted image 20251115121302.png]]

Los códigos escritos en muchos lenguajes interpretados, como Python, PHP y JavaScript, se publican y ejecutan sin ser compilados. Mientras que Python y PHP suelen ejecutarse del lado del servidor —y por lo tanto quedan ocultos al usuario final—, JavaScript normalmente se usa en navegadores del lado del cliente, y el código se envía al usuario y se ejecuta en texto claro. Esta es la razón por la cual la ofuscación se usa con muchísima frecuencia en JavaScript.

## Casos de uso

Hay muchas razones por las cuales los desarrolladores pueden considerar ofuscar su código. Una razón común es ocultar el código original y sus funciones para evitar que sea reutilizado o copiado sin permiso del desarrollador, haciendo más difícil revertirlo o entender su funcionalidad original. Otra razón es agregar una capa de seguridad cuando se trata de autenticación o cifrado, para evitar ataques que exploten posibles vulnerabilidades dentro del código.

**Debe señalarse que realizar autenticación o cifrado del lado del cliente no es recomendable, ya que el código es mucho más propenso a ataques.**

Sin embargo, el uso más común de la ofuscación es para acciones maliciosas. Es habitual que atacantes y actores maliciosos ofusquen sus scripts para evitar que los sistemas de Detección y Prevención de Intrusiones identifiquen sus códigos. En la próxima sección aprenderemos cómo ofuscar un código simple en JavaScript y probaremos ejecutarlo antes y después de la ofuscación para notar las diferencias.
