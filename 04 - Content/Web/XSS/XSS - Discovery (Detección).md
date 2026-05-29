---
aliases:
tags:
  - vuln/xss
  - technique/execution
  - asset/web-app
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

## Descubrimiento de XSS

A esta altura, deberíamos tener un buen entendimiento de qué es una vulnerabilidad XSS, los tres tipos de XSS, y cómo cada tipo se diferencia del resto. También deberíamos entender cómo funciona XSS a través de inyectar código JavaScript en el código fuente del lado del cliente, ejecutando así código adicional, que luego aprenderemos a usar a nuestro favor.

En esta sección vamos a ver varias formas de detectar vulnerabilidades XSS dentro de una aplicación web. En las vulnerabilidades de aplicaciones web (y vulnerabilidades en general), detectarlas puede ser tan difícil como explotarlas. Sin embargo, como las vulnerabilidades XSS están muy extendidas, existen muchas herramientas que nos pueden ayudar a detectarlas e identificarlas.

---

## Descubrimiento Automatizado

Casi todos los escáneres de vulnerabilidades de aplicaciones web (como Nessus, Burp Pro o ZAP) tienen capacidades para detectar los tres tipos de XSS. Estos escáneres usualmente hacen dos tipos de escaneos:

* **Escaneo pasivo**: revisa el código del lado del cliente buscando posibles vulnerabilidades DOM-based.
* **Escaneo activo**: envía distintos tipos de payloads intentando disparar un XSS mediante inyección en el código fuente de la página.

Si bien las herramientas pagas suelen tener mayor precisión al detectar XSS (especialmente cuando requieren bypasses de seguridad), aún podemos encontrar herramientas open-source que nos ayudan a identificar posibles vulnerabilidades XSS.

Estas herramientas generalmente:

1. Identifican campos de entrada en las páginas web.
2. Envían varios tipos de payloads XSS.
3. Comparan el código fuente renderizado para ver si aparece el mismo payload, lo que puede indicar una inyección exitosa.

Aun así, esto no siempre es exacto, ya que a veces, aunque el payload se inyecte, puede no ejecutarse por múltiples razones. Por eso debemos **verificar manualmente** cada inyección XSS.

Algunas herramientas open-source comunes para descubrir XSS son **XSStrike**, **BruteXSS** y **XSSer**.

Ejemplo con XSStrike:

```bash
git clone https://github.com/s0md3v/XSStrike.git
cd XSStrike
pip install -r requirements.txt
python xsstrike.py
```

Después ejecutamos el script con una URL que tenga un parámetro usando `-u`:

```bash
python xsstrike.py -u "http://SERVER_IP:PORT/index.php?task=test"
```

Salida:
```
[!] Testing parameter: task
[!] Reflections found: 1
[!] Payloads generated: 3072
[+] Payload: <HtMl%09onPoIntERENTER+=+confirm()>
```

Vemos que la herramienta identificó el parámetro como vulnerable al primer payload.

Podés probar ese payload en los ejercicios anteriores para verificarlo. También podés probar el resto de las herramientas para ver qué tan efectivas son detectando XSS.

---

## Descubrimiento Manual

Cuando hablamos de encontrar XSS manualmente, la dificultad depende del nivel de seguridad de la aplicación web. Las vulnerabilidades XSS básicas se pueden encontrar probando varios payloads XSS, pero encontrar XSS avanzados requiere habilidades avanzadas de revisión de código.

---

## Payloads de XSS

El método más básico es probar manualmente diferentes payloads XSS contra un campo de entrada en la página.

Se pueden encontrar enormes listas de payloads en internet, como:

* PayloadAllTheThings
* PayloadBox

Luego copiamos y pegamos cada payload en el formulario, y observamos si aparece una ventana `alert`.

**Nota:**
XSS se puede inyectar en *cualquier entrada* del HTML, no solo formularios.
También puede estar en cabeceras HTTP como:

* Cookie
* User-Agent

cuando sus valores se muestran en la página.

Vas a notar que la mayoría de esos payloads NO funcionan en las aplicaciones de ejemplo, incluso si son vulnerables. Esto es porque muchos payloads están diseñados para:

* inyecciones específicas (ej. después de una comilla simple `'`)
* evadir filtros de sanitización
* usar distintos vectores de ejecución: `<script>`, atributos HTML como `<img>`, atributos CSS, etc.

Por eso no es eficiente copiar/pegar payloads uno por uno, especialmente si hay muchos campos.

Una solución más eficiente sería escribir tu propio script en Python que:

1. Envíe payloads automáticamente
2. Compare el código fuente de la página renderizada
3. Detecte reflexiones del payload

Esto es útil cuando las herramientas no pueden enviar o comparar adecuadamente payloads. Sin embargo, este enfoque es avanzado y está fuera del alcance de este módulo.

---

## Revisión de Código

El método más fiable para detectar vulnerabilidades XSS es la **revisión manual de código**, tanto del back-end como del front-end.

Si entendemos exactamente cómo se procesa nuestra entrada hasta que llega al navegador, podemos crear un payload personalizado con alta probabilidad de éxito.

En la sección anterior vimos un ejemplo básico al revisar HTML y JavaScript para identificar el **Source** y el **Sink** en un XSS basado en DOM.

Es poco común encontrar XSS en aplicaciones populares usando listas de payloads o herramientas automáticas. Esto es porque los desarrolladores suelen usar escáneres de vulnerabilidades y corregir cualquier issue antes de lanzar la aplicación.

En estos casos, la revisión manual de código puede revelar XSS que pasaron inadvertidos.

Estas técnicas avanzadas se cubren en:

* [Secure Coding 101: JavaScript](https://academy.hackthebox.com/course/preview/secure-coding-101-javascript)
* [Whitebox Pentesting 101: Command Injection](https://academy.hackthebox.com/course/preview/whitebox-pentesting-101-command-injection)

---
