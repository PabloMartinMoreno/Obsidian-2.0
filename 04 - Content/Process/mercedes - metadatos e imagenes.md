## El concepto

Casi todo archivo —fotos, PDFs, documentos de Office— carga metadatos: información embebida sobre cómo, cuándo, dónde y con qué se creó. En las imágenes eso se llama **EXIF**. Es data que el sistema agrega solo y que el usuario, la mayoría de las veces, ni sabe que está compartiendo.

## Qué guarda el EXIF de una foto

- Marca y modelo del dispositivo (qué celular o cámara la sacó).
- Fecha y hora de captura (y a veces de edición).
- Parámetros técnicos: ISO, apertura, velocidad, distancia focal.
- **Coordenadas GPS** — el dato estrella: el lugar exacto donde se tomó la foto, si el geoetiquetado estaba activo.
- Software usado para editarla.
- A veces una miniatura interna que puede diferir de la imagen editada (truco forense viejo).

## La advertencia clave (para que no lo vendas de más)

**Las redes sociales borran el EXIF al subir.** Instagram, Facebook, X, WhatsApp (en modo foto comprimida) eliminan los metadatos por privacidad. Así que rara vez vas a sacar GPS de una imagen bajada de una red.

¿Dónde sí sobrevive el EXIF? En archivos compartidos directamente: adjuntos de email, archivos enviados "como documento" sin comprimir, originales subidos a sitios o foros que no procesan la imagen, a veces fotos de apps de citas. Enseñá esto explícitamente, porque si no la alumna va a probar con una foto de Instagram, no va a encontrar nada, y va a creer que la técnica no sirve.

## Las herramientas

**ExifTool** (de Phil Harvey) es el estándar absoluto, open source y por línea de comandos — ideal para vos:

```
exiftool imagen.jpg
```

Te vuelca todo. Lee imágenes, PDFs, videos, documentos de Office, prácticamente cualquier formato. Para ver solo el GPS:

```
exiftool -gps:all imagen.jpg
```

Visores web si no querés instalar nada: **metadata2go**, **Jeffrey's Image Metadata Viewer** (exif.regex.info) y **Pic2Map**, que además ubica las coordenadas GPS directo en un mapa.

## Metadatos de documentos (esto conecta con tu mundo)

No es solo fotos. Los **PDF y documentos de Office** guardan autor, organización, software, fechas, a veces nombres de usuario y hasta historial de revisiones. Esto es reconocimiento clásico de pentest: bajás los PDFs públicos de una organización (con `filetype:pdf` vía dorking), les extraés los metadatos, y aprendés nombres de usuario internos, convenciones de nombres y qué software usan.

Para eso hay herramientas que automatizan la cosecha: **metagoofil** (descarga documentos de un dominio y les saca los metadatos) y la clásica **FOCA** en Windows. Acá el encadenamiento es lindo: dorking → cosecha de documentos → metadatos → nombres de usuario → enumeración del punto 2.

## Detección de manipulación (análisis forense)

Cuando lo que querés saber es si una imagen fue editada:

- **FotoForensics** (fotoforensics.com) usa _Error Level Analysis_ (ELA): resalta zonas que fueron recomprimidas o pegadas de forma distinta al resto, lo que delata retoques. Importante: el ELA _sugiere_, no prueba; es fácil malinterpretarlo, así que enseñalo con cautela.
- **Forensically** (29a.ch) es una suite más completa: ELA, detección de clonado, análisis de ruido, lupa, metadatos.
- **InVID/WeVerify** es un plugin de navegador pensado para verificar imágenes y videos (muy usado en periodismo): extrae fotogramas clave, magnifica, lee metadatos e integra búsqueda inversa.

Ojo con el alcance: esto detecta _edición_, no _identidad_.

## El flujo de geolocalización por GPS

Si una foto trae GPS en el EXIF:

1. Sacás las coordenadas con ExifTool.
2. Las pegás en Google Maps o Earth → punto exacto.
3. Pic2Map te lo hace automático.

Y si no hay GPS, caés en geolocalización visual, que es el punto 7.

## Cómo se encadena con todo lo demás

- Fecha + GPS sirven para **corroborar o desmentir una historia**: ¿esta foto es realmente de donde y cuándo dicen? Verificación pura, clave contra desinformación y para detectar perfiles falsos.
- El original que encontraste con búsqueda inversa (punto 4) puede conservar el EXIF que la copia de la red perdió.
- Los nombres de usuario que saques de documentos vuelven al punto 2.

## El marco ético (y el lado defensivo, que acá es oro)

Leer los metadatos de un archivo que alguien compartió es, en general, lícito. Pero extraer el GPS de la foto de una persona para averiguar dónde vive o dónde está es exactamente el uso de vigilancia que hay que evitar. El uso legítimo es verificar autenticidad, hacer reconocimiento autorizado, y —sobre todo— **autoprotección**.

Acá está la mejor lección defensiva de todo el curso: enseñá a **limpiar los metadatos de los propios archivos** antes de compartirlos. ExifTool también borra:

```
exiftool -all= imagen.jpg
```

Que la alumna entienda que cada foto que manda puede llevar dónde la sacó es más valioso que cualquier técnica ofensiva.

## Ejercicio para vos

1. Tomá una foto **original** de tu celular (no de una red) y corré `exiftool` sobre ella. Buscá el GPS y pegá las coordenadas en Maps.
2. Subí esa misma foto a una red, descargala y volvé a correr ExifTool: confirmá que los metadatos desaparecieron.
3. Corré ExifTool sobre un PDF que hayas hecho vos: mirá que aparece tu nombre como autor.
4. Limpiá los metadatos con `exiftool -all=` y verificá que quedaron vacíos.
5. Probá FotoForensics con una imagen que hayas editado, a ver qué marca el ELA.

Cuando lo tengas, seguimos con el punto 6 (dominios, sitios web e infraestructura). Y al cerrar la serie te compilo todo en `.md` para Obsidian.