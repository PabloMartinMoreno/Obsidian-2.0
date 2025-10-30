## 1. El Riesgo: El Front End como Puerta Trasera

- **El Mito:** Se suele pensar que los ataques al Front End (HTML, JavaScript) no son peligrosos porque solo afectan al navegador del usuario y no al servidor.
- **La Realidad:** Esto es falso. Si bien un ataque de Front End no daña _directamente_ al servidor, sí pone en grave peligro al **usuario**.
- **El Punto Crítico:** ¿Y si ese usuario es un **administrador**? Si un atacante explota una vulnerabilidad de Front End para robar la sesión o las credenciales de un admin, obtiene acceso total al Back End (el panel de administración) y, desde ahí, puede comprometer todo el servidor.

## 2. ¿Qué es la Exposición de Datos Sensibles?

Es el error de dejar "migas de pan" o información confidencial en el código fuente de la página web (el código HTML, CSS o JavaScript que cualquiera puede ver).
- **Cómo se encuentra:** Es la primera cosa que un pentester revisa. No requiere herramientas complejas, solo hacer clic derecho y seleccionar **"Ver código fuente"** (o presionar `Ctrl+U`).
- **La "Seguridad" Inútil:** Algunos desarrolladores deshabilitan el clic derecho. Esto es una medida de seguridad completamente inútil, ya que `Ctrl+U` o usar un proxy web (como Burp Suite) lo ignora por completo.

## 3. El Ejemplo Clásico: El Comentario Olvidado

El texto muestra un formulario de inicio de sesión normal. Sin embargo, al revisar el código fuente HTML, se encuentra esta joya:

Un desarrollador dejó un comentario para sí mismo (un "TODO") con credenciales de prueba (`usuario: test`, `clave: test`) y olvidó borrarlo antes de que la página pasara a producción. Si esas credenciales siguen activas, el atacante acaba de entrar sin esfuerzo.

Esta es la "fruta madura" (_low-hanging fruit_) que se busca. Aunque encontrar contraseñas no es lo más común, es frecuente encontrar:
- Enlaces a páginas ocultas (paneles de admin, portales de prueba).
- Nombres de directorios.
- Parámetros de _debugging_ (depuración).
- Información sensible del usuario.
