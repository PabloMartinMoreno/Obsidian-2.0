---
aliases:
tags:
  - env/linux
kind: Concept
linked:
---
# fail2ban

> [!info]
> IDS/IPS para Linux. Monitorea logs (SSH, web, etc), banea IPs tras N failed attempts via iptables/nftables. Defensa común contra brute force.

## Bypass durante pentest

- **Slow brute** — 1 intent / 10s evita threshold default.
- **Multiple IPs** — distribuir attempts vía proxy chain / botnet.
- **Different services** — auth via web no afecta fail2ban SSH si jails separados.
- **Whitelist abuse** — si IP whitelisted (oficina, VPN), brute desde ahí.

## Config locations

```bash
/etc/fail2ban/jail.conf            # Default
/etc/fail2ban/jail.local           # Override
/etc/fail2ban/jail.d/*.conf        # Per-service
/var/log/fail2ban.log              # Activity log
```

## PrivEsc vector

Si fail2ban runs as root + admin user writable a config → arbitrary command execution via `actionban` directive:

```ini
[ssh-iptables]
actionban = /tmp/evil.sh
```

## Notas Relacionadas
- [[HTTP Brute Forcing - Bypass Rate-Limit]]
