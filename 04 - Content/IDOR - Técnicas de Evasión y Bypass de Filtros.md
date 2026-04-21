---
aliases:
tags:
  - type/cheatsheet
  - vuln/idor
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[BOLA - IDOR]]"
---
# IDOR - Técnicas de Evasión y Bypass de Filtros

***

## Cheatsheet

| **Técnica**                                                       | **Descripción**                                                                                                                                                                                                                                      | **Payload Original (Ejemplo)**   | **Payload Evasivo (Ejemplo)**                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| <br>**Doble Codificación (Double URL Encoding)**                  | <br>Codificar la carga útil dos veces. El WAF decodifica la primera capa y no detecta anomalías, pero el backend decodifica la segunda capa y procesa el ataque.<br><br>                                                                             | <br>`id=106` <br>(o `id=../106`) | <br>`id=%2531%2530%2536`<br>`id=%252e%252e%252f106`        |
| <br>**Codificación Unicode / Hexadecimal**                        | <br>Representar los caracteres del identificador mediante secuencias de escape Unicode o Hexadecimales, eludiendo filtros basados en expresiones regulares simples.                                                                                  | <br>`{"id": 106}`                | <br>`{"id": "\u0031\u0030\u0036"}`                         |
| <br>**Inyección de Caracteres Nulos (Null Byte)**                 | <br>Inserción de un byte nulo (`%00`) para engañar a los filtros o funciones de validación (especialmente en C/C++ o PHP antiguo) haciéndoles creer que la cadena ha terminado, mientras el backend procesa el resto.<br><br>                        | <br>`GET /file?name=106.pdf`     | <br>`GET /file?name=106.pdf%00.jpg`                        |
| <br><br>**Manipulación de Espacios y Saltos de Línea**            | <br>Añadir espacios, tabulaciones (`%09`), retornos de carro (`%0d`) o saltos de línea (`%0a`) antes o después del ID. El WAF puede no reconocer el patrón, pero el backend suele limpiar (_trim_) estos caracteres antes del procesamiento.<br><br> | <br><br>`id=106`                 | <br><br>`id=%20106%0a`                                     |
| <br>**Ofuscación de Rutas (Path Normalization)**                  | <br>Alteración de la ruta utilizando secuencias de navegación de directorios combinadas con parámetros de matriz u otros separadores (`..;/`) que el proxy ignora pero el servidor web resuelve.<br><br>                                             | <br>`GET /api/users/106`         | <br>`GET /api/users/105/..;/106`<br>`GET /api/./users/106` |
| <br>**Notación Científica / Representación Numérica Alternativa** | <br>Explotación de la forma en que los diferentes motores analizan los números (Type Juggling). Si se bloquea un entero específico, representarlo como flotante, notación científica o hexadecimal.                                                  | <br>`{"user_id": 106}`           | <br>`{"user_id": 1.06e2}`<br>`{"user_id": 0x6a}`           |
| <br>**HTTP Parameter Smuggling (HPS)**                            | <br>Abuso de la discrepancia en cómo un proxy y un servidor backend analizan cadenas de consulta malformadas (por ejemplo, usando `;` en lugar de `&`), logrando contrabandear parámetros no autorizados.<br><br>                                    | <br>`?id=105`                    | <br>`?id=105;id=106`                                       |
^idor-filtros

## Estrategias de Evaluación y Testing

Para identificar si un sistema es susceptible a estas técnicas durante una evaluación de [[API Security]] o _Pentesting_, la metodología debe enfocarse en la mutación de la entrada:
- Mapear primero cómo responde el backend ante entradas malformadas sin intentar un _bypass_. Observar si devuelve errores de sintaxis, errores de base de datos o si ignora caracteres específicos.
- Aplicar fuzzeo (_fuzzing_) sobre los parámetros identificadores utilizando diccionarios de codificaciones alternativas y caracteres de control (espacios, saltos de línea, nulos).
- Analizar la respuesta del sistema de defensa (por ejemplo, si devuelve un HTTP 403 o resetea la conexión) frente a la respuesta del servidor de aplicaciones (HTTP 500, 200, 404) para identificar dónde se está filtrando la petición.

### Principios de Mitigación

La defensa contra el _bypass_ de filtros no consiste en crear reglas de filtrado infinitamente complejas, sino en eliminar la dependencia de estos mecanismos como única línea de defensa:

- Implementar [[Defensa en Profundidad]]. Los WAFs y filtros de entrada deben ser considerados controles compensatorios, no soluciones definitivas.
- Normalizar siempre la entrada de datos (decodificación estandarizada y _type casting_ estricto) antes de realizar cualquier validación o verificación de seguridad en el backend.
- Rechazar categóricamente cualquier petición que contenga caracteres inesperados o representaciones ambiguas (aplicar validación estricta mediante listas blancas / _Allowlisting_).
- Basar la autorización exclusivamente en el contexto de sesión criptográficamente seguro (como un [[JWT]]) y en la verificación explícita de la relación entre el usuario autenticado y el recurso solicitado a nivel del modelo de datos, independientemente de cómo se haya formateado el ID en la petición.


***
