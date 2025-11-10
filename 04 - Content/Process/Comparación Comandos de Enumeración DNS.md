
---

## Comparación

| Herramienta                          | Tipo (pasivo/activo)                 | Función principal                             | Qué obtiene / cómo se usa                                                                                                           | Cuándo elegirla                                                                                            |
| ------------------------------------ | ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **whois**                            | 🔵 Pasivo                            | Datos del registrador/propietario             | Información del registrante, NS declarados, fechas, contactos.                                                                      | Inicio de reconocimiento pasivo; contexto administrativo                                                   |
| **dig**                              | 🟡 Activo                            | Consultas DNS puntuales y precisas            | Registros A/AAAA/MX/NS/TXT/SOA, AXFR si está abierto; permite `@<server>`                                                           | Verificar registros, probar un NS específico, depurar resoluciones                                         |
| **nslookup**                         | 🟡 Activo                            | Consultas DNS simples (útil en Windows)       | Igual que `dig` pero formato más básico                                                                                             | Consultas rápidas o entornos donde `dig` no está disponible                                                |
| **dnsrecon**                         | 🔴 Activo (automatizado)             | Enumeración avanzada de DNS                   | Fuerza bruta de subdominios, pruebas AXFR, búsquedas inversas, consulta de registros                                                | Enumeración profunda con wordlists; auditorías en laboratorio/autorizadas                                  |
| **dnsenum**                          | 🔴 Activo (híbrido: pasivo + activo) | Enumeración/colección completa de subdominios | Brute force de subdominios, intentos AXFR, reverse lookup, whois lookup y recolección OSINT; genera listados y puede usar wordlists | Buen complemento cuando querés combinar búsquedas pasivas/osint + fuerza bruta; útil para informes rápidos |
| **theHarvester / amass / sublist3r** | 🔵/🔴 (depende)                      | Enumeración pasiva y activa de subdominios    | Recolectan de motores, cert transparency, APIs y/o fuerza bruta                                                                     | Cuando querés mezclar fuentes OSINT (certs, motores, feeds)                                                |

---

## Notas prácticas sobre **dnsenum** vs **dnsrecon**

* Ambos son herramientas de enumeración de subdominios y realizan fuerza bruta y pruebas AXFR, pero:

  * **dnsrecon** suele ofrecer modos claros (`std`, `brt`, `axfr`) y salidas más orientadas a pentesting moderno.
  * **dnsenum** combina técnicas pasivas (recolección básica de OSINT / whois) con ataques activos y está pensado para obtener un *mapa rápido* de subdominios y hosts.
* **dnsenum** suele ser muy práctico para generar listados iniciales que luego podés refinar con `amass`/`dnsrecon`.
* Ambos generan tráfico ruidoso: usalos sólo con autorización o en laboratorios.

---

## Ejemplos de comandos útiles

### dnsenum (ejemplos)

```bash
# enumeración básica con brute force usando la wordlist por defecto
dnsenum example.com

# con una wordlist personalizada y guardando resultados
dnsenum --dnsserver 8.8.8.8 --threads 10 --file subdomain-list.txt example.com

# intentar AXFR explícitamente y hacer reverse lookups
dnsenum --axfr --rev example.com
```

### dnsrecon (ejemplos)

```bash
# modo estándar
dnsrecon -d example.com -t std

# fuerza bruta con wordlist
dnsrecon -d example.com -t brt -D /ruta/wordlist.txt

# intento de AXFR
dnsrecon -d example.com -t axfr
```

### dig (para pruebas puntuales)

```bash
dig example.com A
dig example.com NS +short
dig @ns1.example.com example.com AXFR
```

### whois (contexto)

```bash
whois example.com
whois -h whois.iana.org example.com
```

---

## Recomendación de flujo práctico

1. **Pasivo**: `whois` + búsquedas OSINT + `amass`/`theHarvester` para recopilar subdominios pasivos.
2. **Activo y puntual**: `dig`/`nslookup` para confirmar registros encontrados.
3. **Enumeración ruidosa**: `dnsenum` o `dnsrecon` (fuerza bruta, AXFR, reverse) **con autorización**.
4. **Refinar**: usar `amass` y `subfinder`/`amass` para fuentes de certificados y feeds, y luego correlacionar.

---

