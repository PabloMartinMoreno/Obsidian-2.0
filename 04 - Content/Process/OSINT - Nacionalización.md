## Cuándo y por qué

Como vimos en el punto 5, lo ideal sería que la foto tenga GPS en el EXIF — pero las redes lo borran, así que casi nunca lo vas a tener. Entonces caés en la geolocalización visual: deducir el lugar a partir de lo que se ve en la imagen. Es razonamiento puro contrastado contra datos de mapas.

## Qué pistas buscar en una imagen

Esto es lo que tenés que entrenar a mirar, de lo más fuerte a lo más sutil:

- **Idioma y texto:** carteles, vidrieras, patentes, nombres de comercios. Hasta el alfabeto ya te acota país o región.
- **Arquitectura y mobiliario urbano:** estilo de edificios, marcas en el asfalto, diseño de semáforos, postes de luz, hidrantes, tapas de cloaca, bolardos. Varían muchísimo por país y son delatores enormes.
- **Vehículos:** formato y color de patentes, de qué lado se maneja, modelos de autos típicos de la región.
- **Naturaleza:** vegetación, terreno, clima → te ubican en una latitud o bioma.
- **Hitos:** lo obvio — monumentos, torres, montañas con un perfil reconocible. Acá la búsqueda inversa de imágenes (punto 4) muchas veces te lo nombra directo.
- **Nombres de negocios, teléfonos, dominios** visibles: los buscás y tienen dirección.
- **Sol y sombras:** la dirección y el largo de las sombras te dan orientación y hora del día. Esto es _cronolocalización_.

## Las herramientas de contraste

- **Google Maps / Street View / Earth** — el caballo de batalla. Una vez que tenés una zona candidata, Street View te confirma el punto exacto matcheando edificios y carteles. Earth para satélite e imágenes históricas.
- **Yandex Maps** — mejor cobertura de Street View en algunas regiones.
- **Mapillary** y **KartaView** — imágenes a nivel de calle colaborativas, donde Google no llega.
- **OpenStreetMap + Overpass Turbo** — esto es potente: te deja _consultar_ el mapa por características específicas. Por ejemplo "todos los estadios en esta área" o "iglesias cerca de un río", para reducir candidatos cuando solo tenés rasgos geográficos.
- **Bing Maps** — da ángulos de satélite distintos.

## Cronolocalización (sol y sombras)

- **SunCalc** (suncalc.org): le das una ubicación y una fecha y te muestra la posición del sol y la dirección de las sombras. Lo usás al revés: con la sombra de la foto estimás hora y orientación.
- **Archivos meteorológicos** (tipo Wunderground histórico): si en la imagen hay nieve, lluvia o cielo despejado, lo cruzás con el clima de una fecha para confirmar o descartar.

## La metodología (al estilo Bellingcat)

1. **Inventariá** cada pista de la imagen.
2. Formá hipótesis de región con las pistas fuertes (idioma, patentes).
3. Acotá con las secundarias (arquitectura, vegetación).
4. Usá OSM/Overpass para encontrar lugares candidatos que tengan esos rasgos.
5. Confirmá con Street View o satélite matcheando un detalle específico (ese edificio, el perfil exacto de esa montaña).
6. Cruzá con sol/sombras para verificar que todo es consistente.

Es deducción iterativa, no un clic. Por eso entrena tanto el ojo analítico.

## Dónde practicar (ético y gamificado)

- **GeoGuessr** — te tira en un Street View al azar y tenés que adivinar dónde estás. Entrena el músculo de "leer un lugar".
- **Bellingcat** publica desafíos y guías de geolocalización gratis.
- **GeoHints** y **Geotips** — catálogos de pistas por país (bolardos, patentes, líneas del asfalto). Material de referencia buenísimo.

## La aplicación legítima

- **Verificar una afirmación:** "este perfil dice que vive en Buenos Aires, pero sus fotos son claramente de Madrid" → detección de catfishing y estafas.
- **Desmentir desinformación:** confirmar si una foto viral es realmente del lugar y momento que dicen.
- **Autoauditoría:** ver cuánto revelan tus propias fotos sobre dónde vivís y te movés.

## El marco ético (acá hay que ser explícito)

Geolocalizar una imagen pública para verificar su autenticidad es legítimo. Pero geolocalizar las fotos de una persona concreta para averiguar dónde vive o dónde está en tiempo real es exactamente la línea de la vigilancia y el acoso — y en un curso que nació de "cómo descubrir a una pareja", este es el punto donde más firme tenés que marcar el límite. Geolocalizamos para **verificar**, no para **rastrear personas**.

Y el reverso defensivo, que es la lección más valiosa: mostrale a la alumna cuánto entrega ella misma. La cafetería de enfrente de su casa que sale en una foto identifica su barrio; postear en tiempo real dice dónde está ahora. Entender eso protege más que cualquier técnica.

## Ejercicio para vos

1. Agarrá una foto que vos hayas posteado y, olvidándote de que sabés dónde es, intentá geolocalizarla solo por las pistas. Mirá qué tan identificable sos.
2. Probá un desafío de Bellingcat o unas rondas de GeoGuessr para entrenar el ojo.
3. Tomá una foto con sombra marcada y jugá con SunCalc para estimar la hora.
4. Practicá una consulta en Overpass Turbo (por ejemplo, buscar un tipo de lugar en tu zona) para ver cómo se filtra por características.

Con esto cerramos las técnicas centrales. Queda el punto 8 (frameworks de automatización: SpiderFoot, Maltego, recon-ng), que es para cuando ya domines todo lo manual. ¿Seguimos con ese y después te compilo la serie completa en `.md` para Obsidian?