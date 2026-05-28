---
aliases:
tags:
  - asset/web-app
  - technique/recon/active
  - estado/incompleto
primary categories:
secondary categories:
tertiary categories:
linked:
---


## Subdomain Bruteforcing — Fuerza bruta de subdominios

La enumeración por fuerza bruta de subdominios es una técnica activa y potente para descubrir subdominios que se basa en listas predefinidas de posibles nombres de subdominio. Este enfoque prueba sistemáticamente esos nombres contra el dominio objetivo para identificar subdominios válidos. Usando wordlists bien seleccionadas, podés aumentar significativamente la eficiencia y efectividad del descubrimiento de subdominios.

El proceso se divide en cuatro pasos:
1. **Selección de la wordlist**: se comienza eligiendo una lista de palabras con posibles nombres de subdominio. Estas wordlists pueden ser:
    - **Propósito general**: contienen nombres comunes de subdominios (por ejemplo: `dev`, `staging`, `blog`, `mail`, `admin`, `test`). Útil cuando no conocés las convenciones de nombres del objetivo.
    - **Dirigidas/targeted**: enfocadas en industrias, tecnologías o patrones de nombres específicos relevantes para el objetivo. Más eficientes y reducen falsos positivos.
    - **Personalizadas**: creás tu propia lista basada en palabras clave, patrones o inteligencia obtenida de otras fuentes.

2. **Iteración y consulta**: un script o herramienta recorre la wordlist, concatenando cada palabra o frase al dominio principal (ej.: `dev.example.com`, `staging.example.com`) para crear subdominios potenciales.

3. **Consulta DNS**: se realiza una consulta DNS por cada subdominio potencial para comprobar si resuelve a una dirección IP (normalmente registros A o AAAA).

4. **Filtrado y validación**: si un subdominio resuelve correctamente, se agrega a la lista de subdominios válidos. Pueden realizarse pasos adicionales de validación (por ejemplo, intentar acceder por navegador) para confirmar existencia y funcionalidad.
    

Hay varias herramientas que sobresalen en la enumeración por fuerza bruta:

| **Herramienta** | **Descripción**                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dnsenum`       | Herramienta de enumeración DNS completa que soporta ataques por diccionario y fuerza bruta para descubrir subdominios.                                          |
| `fierce`        | Herramienta amigable para descubrimiento recursivo de subdominios, con detección de comodines y una interfaz sencilla.                                          |
| `dnsrecon`      | Herramienta versátil que combina múltiples técnicas de reconocimiento DNS y ofrece formatos de salida personalizables.                                          |
| `amass`         | Herramienta en mantenimiento activo centrada en descubrimiento de subdominios; conocida por su integración con otras herramientas y múltiples fuentes de datos. |
| `assetfinder`   | Herramienta simple y efectiva para encontrar subdominios mediante varias técnicas; ideal para escaneos rápidos y ligeros.                                       |
| `puredns`       | Herramienta potente y flexible para fuerza bruta DNS, capaz de resolver y filtrar resultados de forma eficiente.                                                |

---

## DNSEnum

`dnsenum` es una herramienta de línea de comandos versátil y ampliamente usada, escrita en Perl. Es un kit de herramientas completo para reconocimiento DNS que permite recopilar información sobre la infraestructura DNS de un dominio objetivo y sus posibles subdominios. Funcionalidades clave:

- **Enumeración de registros DNS**: puede recuperar registros A, AAAA, NS, MX, TXT, proporcionando una visión completa de la configuración DNS.
    
- **Intentos de transferencia de zona (zone transfer)**: intenta automáticamente transferencias de zona en los servidores de nombres descubiertos. Aunque la mayoría de servidores bloquean estos intentos, una transferencia exitosa puede revelar mucha información.
    
- **Fuerza bruta de subdominios**: soporta enumeración por fuerza bruta usando una wordlist, probando nombres potenciales para identificar subdominios válidos.
    
- **Scraping en Google**: puede raspar resultados de Google para encontrar subdominios adicionales que no figuren directamente en los registros DNS.
    
- **Búsqueda inversa**: realiza búsquedas DNS inversas para identificar dominios asociados a una IP dada (útil para descubrir otros sitios en el mismo host).
    
- **Consultas WHOIS**: puede ejecutar consultas WHOIS para recolectar datos de registro y propiedad del dominio.
    

Veamos `dnsenum` en acción para enumerar subdominios del objetivo `inlanefreight.com`. En este ejemplo se usa la wordlist `subdomains-top1million-20000.txt` de SecLists (top 20.000 subdominios más comunes).

### Código (bash)

```bash
dnsenum --enum inlanefreight.com -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -r
```

En este comando:
- `dnsenum --enum inlanefreight.com`: especifica el dominio objetivo y activa opciones de enumeración con el atajo `--enum`.
- `-f /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt`: ruta a la wordlist de SecLists usada para la fuerza bruta. Ajustá la ruta si tu instalación de SecLists está en otra ubicación.
- `-r`: habilita fuerza bruta recursiva; si `dnsenum` encuentra un subdominio, intentará enumerar subdominios de ese subdominio.

---

## Ejemplo de salida de `dnsenum`

```bash
dnsenum --enum inlanefreight.com -f  /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt 

dnsenum VERSION:1.2.6

-----   inlanefreight.com   -----

Host's addresses:
__________________

inlanefreight.com.                       300      IN    A        134.209.24.248

[...]

Brute forcing with /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt:
_______________________________________________________________________________________

www.inlanefreight.com.                   300      IN    A        134.209.24.248
support.inlanefreight.com.               300      IN    A        134.209.24.248
[...]


done.

/ 1 spawns left
Waiting to start...
```

(Esta salida muestra cómo `dnsenum` resolvió el dominio principal y luego identificó subdominios validados mediante la wordlist.)
