---
aliases:
tags:
  - tool/git
kind: Tool
linked:
  - "[[git-dumper]]"
---
# git

## Definición 

> [!INFO] git
>Es un sistema de control de versiones distribuido ampliamente utilizado en el desarrollo de software. Un flujo de trabajo (workflow) de Git define cómo los equipos colaboran y manejan el código fuente. A continuación, se presenta una guía extremadamente completa sobre los flujos de trabajo de Git, incluyendo conceptos básicos, flujos populares, y ejemplos prácticos.
^definicion

## Conceptos Básicos de Git

- **Repositorio (Repo):** Almacén donde Git guarda todos los archivos y el historial de cambios.
- **Commit:** Un snapshot o instantánea del estado del proyecto en un momento específico.
- **Rama (Branch):** Una línea de desarrollo independiente.
- **Merge:** Integrar cambios de una rama a otra.
- **Clone:** Crear una copia local de un repositorio remoto.
- **Fork:** Crear una copia personal de un repositorio para contribuir.

## Configuración Inicial

Después de instalar Git, es importante configurarlo con tu información de usuario:
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tuemail@example.com"
```

## Comandos Básicos de Git

### 1. Inicializar un Repositorio
Para crear un nuevo repositorio:
```bash
git init
```

### 2. Clonar un Repositorio
Para clonar un repositorio existente:
```bash
git clone https://github.com/usuario/repositorio.git
```

### 3. Ver el Estado del Repositorio
Para ver los cambios realizados y el estado de los archivos:
```bash
git status
```

### 4. Agregar Archivos al Área de Preparación (Staging Area)
Para agregar un archivo específico:
```bash
git add archivo.txt
```
Para agregar todos los cambios:
```bash
git add .
```

### 5. Hacer un Commit
Para guardar los cambios en el historial:
```bash
git commit -m "Mensaje descriptivo del commit"
```

### 6. Ver el Historial de Commits
Para ver el historial de commits:
```bash
git log
```

### 7. Crear una Nueva Rama
Para crear y cambiar a una nueva rama:
```bash
git checkout -b nombre-de-la-rama
```

### 8. Cambiar de Rama
Para cambiar a una rama existente:
```bash
git checkout nombre-de-la-rama
```

### 9. Fusionar Ramas
Para fusionar una rama en la rama actual:
```bash
git merge nombre-de-la-rama
```

### 10. Subir Cambios a un Repositorio Remoto
Para subir commits a una rama remota:
```bash
git push origin nombre-de-la-rama
```

### 11. Descargar Cambios del Repositorio Remoto
Para traer y fusionar cambios del remoto:
```bash
git pull
```

### 12. Ver las Ramas Existentes
Para listar todas las ramas:
```bash
git branch
```

### 13. Eliminar una Rama
Para eliminar una rama local:
```bash
git branch -d nombre-de-la-rama
```

## Ejemplos Prácticos

### Ejemplo 1: Crear un Repositorio y Hacer el Primer Commit

1. **Inicializar el repositorio:**
    ```bash
    mkdir mi-proyecto
    cd mi-proyecto
    git init
    ```

2. **Crear un archivo y agregar contenido:**
    ```bash
    echo "# Mi Proyecto" > README.md
    ```

3. **Agregar el archivo al área de preparación y hacer commit:**
    ```bash
    git add README.md
    git commit -m "Agregar archivo README.md inicial"
    ```

### Ejemplo 2: Trabajar con Ramas

1. **Crear una nueva rama para una funcionalidad:**
    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```

2. **Realizar cambios y hacer commits en la nueva rama:**
    ```bash
    echo "Nueva funcionalidad" > funcionalidad.txt
    git add funcionalidad.txt
    git commit -m "Agregar nueva funcionalidad"
    ```

3. **Cambiar de vuelta a la rama principal y fusionar los cambios:**
    ```bash
    git checkout main
    git merge feature/nueva-funcionalidad
    ```

4. **Eliminar la rama de funcionalidad:**
    ```bash
    git branch -d feature/nueva-funcionalidad
    ```

### Ejemplo 3: Colaborar con un Repositorio Remoto

1. **Clonar un repositorio remoto:**
    ```bash
    git clone https://github.com/usuario/repositorio.git
    cd repositorio
    ```

2. **Crear una nueva rama y hacer cambios:**
    ```bash
    git checkout -b feature/colaboracion
    echo "Colaboración" > colaboracion.txt
    git add colaboracion.txt
    git commit -m "Agregar colaboración"
    ```

3. **Subir la rama al remoto:**
    ```bash
    git push origin feature/colaboracion
    ```

4. **Crear una Pull Request (PR) en GitHub para revisar y fusionar los cambios.**

## Flujo de Trabajo Común (Workflow)

### Git Flow

Git Flow es una estrategia de branching que define un modelo de ramificación específico para manejar el desarrollo, lanzamientos y mantenimiento. Incluye ramas como `develop`, `feature`, `release` y `hotfix`.

### Workflow Simplificado

1. **Clonar el repositorio:**
    ```bash
    git clone https://github.com/usuario/repositorio.git
    cd repositorio
    ```

2. **Crear una nueva rama para trabajar en una funcionalidad:**
    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```

3. **Hacer cambios y commits:**
    ```bash
    git add .
    git commit -m "Implementar nueva funcionalidad"
    ```

4. **Actualizar la rama principal antes de fusionar:**
    ```bash
    git checkout main
    git pull origin main
    ```

5. **Fusionar la rama de funcionalidad:**
    ```bash
    git merge feature/nueva-funcionalidad
    ```

6. **Subir los cambios al repositorio remoto:**
    ```bash
    git push origin main
    ```

## Buenas Prácticas

1. **Commits Frecuentes y Descriptivos**: Realiza commits pequeños y con mensajes claros.
2. **Uso de Ramas**: Utiliza ramas para desarrollar nuevas funcionalidades o corregir errores.
3. **Revisar Antes de Fusionar**: Siempre revisa los cambios antes de fusionar ramas.
4. **Mantener el Repositorio Limpio**: Elimina ramas que ya no se usen y organiza el proyecto adecuadamente.
5. **Uso de `.gitignore`**: Define qué archivos no deben ser rastreados por Git (por ejemplo, archivos temporales, dependencias instaladas, etc.).


---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `git clone http://target/.git` | Clonar repo expuesto si listing activo | `.git/` accesible vía HTTP |
| `git log --all --oneline` | Histórico commits | Buscar credenciales en commits viejos |
| `git log -p --all -S<keyword>` | Buscar en diffs por keyword | Hunt secrets (password, api_key, token) |
| `git show <hash>` | Ver commit específico | Auditoría puntual |
| `git diff <hash1> <hash2>` | Diff entre commits | Cambios entre versiones |
| `git branch -a` | Listar todas branches (local + remote) | Buscar dev/staging branches |
| `git stash list` + `git stash show -p <n>` | Cambios stashed | A veces contienen secretos |

---

## Recon de repos expuestos

```bash
# Detectar .git/ expuesto
curl -s http://target/.git/HEAD
curl -s http://target/.git/config

# Dump completo
git-dumper http://target/.git/ output/

# Análisis post-dump
cd output
git log --all --oneline
git log -p --all -Spassword
git log -p --all -Sapi_key
```

Ver [[git-dumper]] para extracción automática.

---

## Notas Relacionadas

- [[git-dumper]]
- [[GitHub Dorking]]
- [[GitLab Enumeration]]
