---
aliases:
tags:
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---

### Etapa de Preparación (Parte 2)

Otra parte de la etapa de Preparación es protegerse contra incidentes. Si bien la protección no es necesariamente responsabilidad del equipo de gestión de incidentes, cualquier actividad relacionada con la protección debe ser conocida por ellos para comprender mejor el tipo y la sofisticación de un incidente y saber dónde buscar artefactos o evidencias que puedan ayudar en la investigación.

Echemos un vistazo a algunas de las medidas de protección altamente recomendadas, las cuales tienen un alto impacto de mitigación contra la mayoría de las amenazas.

#### DMARC

DMARC es un mecanismo de protección de correo electrónico contra el _phishing_ construido sobre los ya existentes **SPF** y **DKIM**. La idea detrás de DMARC es rechazar los correos electrónicos que "fingen" originarse en nuestra organización. Por lo tanto, si un adversario está falsificando (_spoofing_) un correo electrónico fingiendo ser un empleado que solicita el pago de una factura, el sistema rechazará el correo electrónico antes de que llegue al destinatario previsto. DMARC es fácil y económico de implementar; sin embargo, no podemos dejar de enfatizar que **las pruebas exhaustivas son obligatorias**; de lo contrario (y este es a menudo el caso), corremos el riesgo de bloquear correos electrónicos legítimos sin capacidad de recuperarlos.

Con reglas de filtrado de correo electrónico, es posible llevar DMARC al "siguiente" nivel y aplicar protección adicional contra correos que fallan DMARC desde dominios que no poseemos. Esto es posible porque algunos sistemas de correo realizarán una verificación DMARC e incluirán un encabezado indicando si DMARC pasó o falló en los encabezados del mensaje. Si bien esto puede ser increíblemente poderoso para detectar correos de _phishing_ de cualquier dominio, requiere pruebas exhaustivas antes de poder introducirse en un entorno de producción. Los falsos positivos altos aquí suelen ser correos enviados "en nombre de" a través de algún servicio de envío de correo, ya que tienden a fallar DMARC debido a la falta de coincidencia de dominios.

#### Hardening de Endpoints (y EDR)

Los dispositivos de punto final o _endpoints_ (estaciones de trabajo, computadoras portátiles, etc.) son los puntos de entrada para la mayoría de los ataques que enfrentamos a diario. Considerando que la mayoría de las amenazas se originarán en Internet y apuntarán a usuarios que navegan por sitios web, abren archivos adjuntos o ejecutan ejecutables maliciosos, un porcentaje significativo de esta actividad ocurrirá en sus _endpoints_ corporativos.

Existen algunos estándares de _hardening_ (endurecimiento) de _endpoints_ ampliamente reconocidos, siendo las líneas base (_baselines_) de **CIS** y **Microsoft** las más populares, y estas deberían ser realmente los bloques de construcción para las líneas base de _hardening_ de nuestra organización. Algunas acciones muy importantes (que realmente funcionan) para tener en cuenta y ejecutar son:

- **Deshabilitar LLMNR/NetBIOS.**
- **Implementar LAPS** y eliminar los privilegios administrativos de los usuarios regulares.
- **Deshabilitar o configurar PowerShell** en modo "ConstrainedLanguage".
- **Habilitar reglas de Reducción de Superficie de Ataque (ASR)** si se usa Microsoft Defender.
- **Implementar listas blancas (_whitelisting_).** Sabemos que esto es casi imposible de implementar perfectamente. Considera al menos bloquear la ejecución desde carpetas donde el usuario tiene permisos de escritura (Descargas, Escritorio, AppData, etc.). Estas son las ubicaciones donde los exploits y las cargas útiles (_payloads_) maliciosas se encontrarán inicialmente. Recuerda también bloquear tipos de scripts como `.hta`, `.vbs`, `.cmd`, `.bat`, `.js` y similares. Necesitamos prestar atención a los archivos **LOLBin** al implementar listas blancas. No los pases por alto; realmente se usan "en la naturaleza" (_in the wild_) como acceso inicial para eludir las listas blancas.
- **Utilizar firewalls basados en host.** Como mínimo, bloquear la comunicación de estación de trabajo a estación de trabajo y bloquear el tráfico saliente de los LOLBins.
- **Desplegar un producto EDR.** En este momento, **AMSI** proporciona una gran visibilidad de los scripts ofuscados para que los productos antimalware inspeccionen el contenido antes de que se ejecute. Es muy recomendable que solo elijamos productos que se integren con AMSI.

#### Protección de Red

La segmentación de la red es una técnica poderosa para evitar que una brecha se propague por toda la organización. Los sistemas críticos para el negocio deben estar aislados, y las conexiones solo deben permitirse según lo requiera el negocio. Los recursos internos no deben estar expuestos directamente a Internet (a menos que se coloquen en una DMZ).

Además, al hablar de protección de red, debemos considerar los sistemas **IDS/IPS** (Sistema de Detección de Intrusos/Sistema de Prevención de Intrusos). Su poder realmente brilla cuando se realiza la **intercepción SSL/TLS**, de modo que pueden identificar tráfico malicioso basado en el contenido en la red y no en la reputación de las direcciones IP, que es una forma tradicional y muy ineficiente de detectar tráfico malicioso.

Adicionalmente, asegúrate de que solo los dispositivos aprobados por la organización puedan acceder a la red. Soluciones como **802.1x** se pueden utilizar para reducir el riesgo de _BYOD_ (Trae tu propio dispositivo) o dispositivos maliciosos que se conectan a la red corporativa. Si somos una empresa "solo en la nube" que usa, por ejemplo, Azure/Azure AD (ahora llamado **Microsoft Entra ID**), entonces podemos lograr una protección similar con políticas de Acceso Condicional que permitirán el acceso a los recursos de la organización solo si nos conectamos desde un dispositivo administrado por la empresa.

#### Gestión de Identidad Privilegiada / MFA / Contraseñas

En este momento, el robo de credenciales de usuarios privilegiados es la ruta de escalada más común en entornos de Active Directory. Además, un error común es que los usuarios administradores tienen una contraseña débil (pero a menudo compleja) o una contraseña compartida con su cuenta de usuario regular (que se puede obtener a través de múltiples vectores de ataque como _keylogging_). Como referencia, una contraseña débil pero compleja es "Password1!". Incluye mayúsculas, minúsculas, números y caracteres especiales, pero a pesar de esto, es fácilmente predecible y se puede encontrar en muchas listas de contraseñas que los adversarios emplean en sus ataques.

Se recomienda enseñar a los empleados a usar **frases de contraseña (_passphrases_)** porque son más difíciles de adivinar y difíciles de atacar por fuerza bruta. Un ejemplo de una frase de contraseña que es fácil de recordar pero larga y compleja es "i LIK3 my coffeE warm" (me GUST4 mi cafE caliente). Si uno conoce un segundo idioma, puede mezclar palabras de varios idiomas para una protección adicional.

La **Autenticación Multifactor (MFA)** es otra solución de protección de identidad que debe implementarse al menos para cualquier tipo de acceso administrativo a todas las aplicaciones y dispositivos.

#### Escaneo de Vulnerabilidades

Realizar escaneos continuos de vulnerabilidades de nuestro entorno y remediar al menos las vulnerabilidades "Altas" y "Críticas" que se descubran. Si bien el escaneo puede automatizarse, las correcciones generalmente requieren participación manual. Si no podemos aplicar parches por alguna razón, definitivamente necesitamos segmentar los sistemas que son vulnerables.

#### Formación de Concientización del Usuario

Capacitar a los usuarios para reconocer comportamientos sospechosos y reportarlos cuando los descubran es una gran victoria para nosotros. Si bien es poco probable alcanzar el 100% de éxito en esta tarea, se sabe que estas sesiones de capacitación reducen significativamente el número de compromisos exitosos. Las pruebas "sorpresa" periódicas también deben ser parte de esta capacitación, incluyendo, por ejemplo, correos electrónicos de _phishing_ mensuales, dejar memorias USB tiradas en el edificio de oficinas, etc.

#### Evaluación de Seguridad de Active Directory

La mejor manera de detectar configuraciones de seguridad erróneas o vulnerabilidades críticas expuestas es buscarlas **desde la perspectiva de un atacante**. Realizar nuestras propias revisiones (o contratar a un tercero si falta el conjunto de habilidades en la organización) asegurará que cuando un dispositivo _endpoint_ se vea comprometido, el atacante no tendrá una posibilidad de escalada de un solo paso a altos privilegios en la red. Cuantas más herramientas y actividades adicionales genere un atacante, mayor será la probabilidad de que lo detectemos, por lo que tratamos de eliminar las victorias fáciles (_low-hanging fruit_) tanto como sea posible.

Active Directory tiene algunas rutas de escalada/bugs conocidos y únicos. También se descubren nuevos con bastante frecuencia. Las evaluaciones de seguridad de Active Directory son cruciales para la postura de seguridad del entorno en general. No asumimos que nuestros administradores de sistemas estén al tanto de todos los errores descubiertos o publicados, porque en realidad, probablemente no lo estén.

#### Ejercicios de Purple Team

Necesitamos entrenar a los gestores de incidentes y mantenerlos comprometidos. No hay duda de eso, y el mejor lugar para hacerlo es dentro del propio entorno de una organización. Los **ejercicios de Purple Team** son esencialmente evaluaciones de seguridad realizadas por un _Red Team_ (equipo rojo/atacante) que informa continua o eventualmente al _Blue Team_ (equipo azul/defensivo) sobre sus acciones, hallazgos, cualquier falta de visibilidad o deficiencias de seguridad, etc. Tales ejercicios ayudarán a identificar vulnerabilidades en una organización mientras prueban la capacidad defensiva del equipo azul en términos de registro (_logging_), monitoreo, detección y capacidad de respuesta. Si una amenaza pasa desapercibida, hay una oportunidad para mejorar. Para aquellas que se detectan, el equipo azul puede probar cualquier _playbook_ y procedimiento de gestión de incidentes para asegurarse de que sean robustos y se haya logrado el resultado esperado.

Para practicar ejercicios relacionados con el equipo púrpura, puedes consultar módulos como la _Intro to Academy's Purple Modules_ y _Detection & OpSec Cyber Range_, que proporcionan un entorno para realizar ejercicios de equipo púrpura.

---
