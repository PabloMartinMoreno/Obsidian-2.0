---
aliases:
tags:
primary categories:
secondary categories:
tertiary categories:
kind: Concept
linked:
  - "[[HTTPS]]"
  - "[[http-flow]]"
  - "[[Certificados SSL-TLS]]"
---
# Criptografía Simétrica vs. Asimétrica

Estas son las dos tecnologías que utiliza el protocolo [[HTTPS]] durante el **TLS Handshake** para proteger la información.

___

## Cifrado Simétrico

En este método, se utiliza la **misma clave** tanto para cifrar como para descifrar el mensaje.

- **Ventaja:** Es extremadamente rápido.
- **Desventaja:** Ambos lados deben conocer la clave. Si alguien la intercepta durante el intercambio inicial, la seguridad se rompe.
- **Uso en HTTPS:** Se utiliza para cifrar los datos reales (el contenido de la web) una vez que la conexión segura ya se ha establecido.


---

## Cifrado Asimétrico (Clave Pública)

Utiliza un par de claves matemáticamente relacionadas: una **Clave Pública** y una **Clave Privada**.

- **Clave Pública:** Se puede compartir con cualquier persona. Se usa para **cifrar** el mensaje.
- **Clave Privada:** Se mantiene en secreto en el servidor. Es la única capaz de **descifrar** lo que la clave pública cifró.
- **Uso en HTTPS:** Se utiliza al inicio (Handshake) para que el cliente y el servidor puedan acordar una clave simétrica de forma segura.


---

## Cuadro Comparativo

|**Característica**|**Cifrado Simétrico**|**Cifrado Asimétrica**|
|---|---|---|
|**Claves**|1 clave única|2 claves (Pública y Privada)|
|**Velocidad**|Muy rápida|Lenta (consume más CPU)|
|**Uso Principal**|Transferencia masiva de datos|Intercambio de claves y firmas|
|**Ejemplos**|AES, ChaCha20|RSA, Diffie-Hellman, ECC|

---

## ¿Cómo trabajan juntas en HTTPS?

HTTPS combina lo mejor de ambos mundos:

1. El servidor usa **Cifrado Asimétrico** para enviar su clave pública al navegador.
2. El navegador genera una "clave maestra" y la cifra con esa clave pública.
3. Solo el servidor puede descifrarla con su clave privada.
4. Ahora que ambos tienen la clave en secreto, pasan a usar **Cifrado Simétrico** para el resto de la sesión porque es mucho más rápido.

> [!TIP] Analogía
> 
> El cifrado Asimétrico es como un buzón donde cualquiera puede echar cartas (clave pública), pero solo el dueño tiene la llave para abrirlo (clave privada). El cifrado Simétrico es como una caja fuerte donde ambos tienen una copia de la misma llave.

---

**Notas relacionadas:**

- [[HTTPS]]
- [[Certificados SSL-TLS]]
-  [[http-flow]]
