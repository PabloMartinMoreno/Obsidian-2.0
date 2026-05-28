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


## Introducción

A medida que las aplicaciones web se vuelven más avanzadas y más comunes, también lo hacen las vulnerabilidades en aplicaciones web. Entre los tipos más comunes se encuentran las vulnerabilidades de Cross-Site Scripting (XSS). Las vulnerabilidades XSS aprovechan una falla en la sanitización de la entrada del usuario para “escribir” código JavaScript en la página y ejecutarlo del lado del cliente, lo que lleva a varios tipos de ataques.

## Qué es XSS

Una aplicación web típica funciona recibiendo el código HTML desde el servidor back-end y renderizándolo en el navegador del usuario. Cuando una aplicación web vulnerable no sanitiza correctamente la entrada del usuario, un atacante puede inyectar código JavaScript adicional en un campo de entrada (por ejemplo, comentario/respuesta), de modo que cuando otro usuario visite la misma página, ejecute sin saberlo ese código malicioso.

Las vulnerabilidades XSS se ejecutan exclusivamente del lado del cliente y, por lo tanto, no afectan directamente al servidor back-end. Solo pueden afectar al usuario que ejecuta la vulnerabilidad. El impacto directo sobre el servidor es relativamente bajo, pero dado que son muy comunes en aplicaciones web, esto resulta en un riesgo medio (bajo impacto + alta probabilidad = riesgo medio). Como siempre, debemos intentar reducir este riesgo detectando, corrigiendo y previniendo proactivamente este tipo de vulnerabilidades.

*Matriz de riesgo con los ejes Probabilidad (baja a alta) e Impacto (bajo a alto), mostrando estrategias: Reducir, Evitar, Aceptar, Transferir.*

## Ataques XSS

Las vulnerabilidades XSS pueden facilitar una amplia variedad de ataques, esencialmente cualquier cosa que pueda ejecutarse a través de código JavaScript en el navegador. Un ejemplo básico es hacer que el usuario víctima envíe sin querer su cookie de sesión al servidor del atacante. Otro ejemplo es hacer que el navegador de la víctima ejecute llamadas a APIs que lleven a acciones maliciosas, como cambiar la contraseña del usuario por una elegida por el atacante. Existen muchos otros tipos de ataques XSS, desde minado de Bitcoin hasta mostrar anuncios.

Como los ataques XSS ejecutan JavaScript dentro del navegador, están limitados al motor de JS del navegador (por ejemplo, V8 en Chrome). No pueden ejecutar JavaScript a nivel del sistema, como lograr ejecución de código a nivel de SO. En los navegadores modernos también están limitados al mismo dominio del sitio vulnerable. Aun así, poder ejecutar JavaScript en el navegador de un usuario permite una gran variedad de ataques. Además, si un investigador habilidoso identifica una vulnerabilidad binaria en el navegador (por ejemplo, un heap overflow en Chrome), puede utilizar una vulnerabilidad XSS para ejecutar un exploit en JavaScript que salga del sandbox del navegador y ejecute código en la máquina del usuario.

Las vulnerabilidades XSS pueden encontrarse en casi todas las aplicaciones web modernas y han sido explotadas activamente durante las últimas dos décadas. Un ejemplo conocido es el **gusano Samy**, un gusano basado en navegador que explotó una vulnerabilidad XSS almacenada en MySpace en 2005. Al ver una página infectada, se publicaba automáticamente un mensaje en la página de la víctima que decía “Samy is my hero”, y ese mensaje contenía el mismo payload JavaScript para replicarse cuando otros lo veían. En un solo día, más de un millón de usuarios de MySpace tenían este mensaje en sus páginas. Aunque ese payload no causó daño real, podría haber sido usado para propósitos mucho más maliciosos, como robar tarjetas de crédito, instalar keyloggers o explotar vulnerabilidades binarias del navegador.

En 2014, un investigador descubrió accidentalmente una vulnerabilidad XSS en TweetDeck (Twitter). Fue explotada para crear un tuit que se auto-retuiteaba, llegando a más de 38.000 retuits en menos de dos minutos. Twitter tuvo que cerrar temporalmente TweetDeck para reparar la vulnerabilidad.

Incluso hoy, las aplicaciones web más importantes siguen teniendo vulnerabilidades XSS. Hasta la página del buscador de Google ha tenido múltiples vulnerabilidades XSS, la más reciente en 2019 en su biblioteca XML. Además, Apache Server —el servidor web más utilizado en internet— reportó en una ocasión una vulnerabilidad XSS que estaba siendo explotada activamente para robar contraseñas de usuarios de ciertas empresas. Todo esto muestra que las vulnerabilidades XSS deben tomarse muy en serio, y que se debe invertir esfuerzo en detectarlas y prevenirlas.

## Tipos de XSS

Existen tres tipos principales de vulnerabilidades XSS:

| Tipo                               | Descripción                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS Almacenado (Persistente)**   | El tipo más crítico. Ocurre cuando la entrada del usuario se guarda en la base de datos del back-end y luego se muestra al recuperarse (ej.: publicaciones o comentarios).                                                                              |
| **XSS Reflejado (No Persistente)** | Ocurre cuando la entrada del usuario se muestra en la página después de ser procesada por el servidor, sin almacenarse (ej.: resultados de búsqueda o mensajes de error).                                                                               |
| **XSS basado en DOM**              | Otro tipo de XSS no persistente que ocurre cuando la entrada del usuario se refleja directamente en el navegador y es procesada completamente en el lado del cliente, sin llegar al back-end (ej.: parámetros HTTP del lado del cliente o anchor tags). |

En las próximas secciones veremos cada tipo en detalle y trabajaremos con ejercicios para entender cómo ocurren y cómo pueden explotarse en ataques.

---

