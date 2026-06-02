---
aliases:
tags:
  - tool/pspy
kind: Tool
linked:
  - "[[Linux PrivEsc - Cron Jobs]]"
---
# pspy

> [!info]
> Process snooper sin root para Linux. Detecta procesos arrancando + cmdlines via `procfs` polling, sin `ptrace`. Esencial para detectar cron jobs y scripts triggered por otros users.

---

## Uso

```bash
# Download static binary
wget https://github.com/DominicBreuker/pspy/releases/latest/download/pspy64
chmod +x pspy64

# Run con default settings
./pspy64

# Más verbose / agresivo
./pspy64 -pf -i 1000   # Print full cmdline, poll cada 1000ms

# Con file watching (detecta abrir/escribir files)
./pspy64 -f
```

---

## Output típico

```
2024/05/21 10:00:01 CMD: UID=0     PID=12345  | /usr/sbin/CRON -f
2024/05/21 10:00:01 CMD: UID=0     PID=12346  | /bin/bash /opt/backup.sh
```

→ Cron como root ejecuta `/opt/backup.sh` cada minuto. Si writable → PrivEsc.

---

## Workflow privesc

```bash
# 1. Run pspy en background mientras enumeras
./pspy64 > /tmp/pspy.log &

# 2. Wait 5+ minutes
# 3. Análisis
grep 'UID=0' /tmp/pspy.log | sort -u

# 4. Identify scripts root-executed
# 5. Check writability
ls -la /opt/backup.sh
```

---

## Notas Relacionadas

- [[Linux PrivEsc - Cron Jobs]]
- [[Linux Privilege Escalation]]
- [[Linux PrivEsc - PATH Hijacking]]
