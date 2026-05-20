https://github.com/datasets/world-cities/blob/main/data/world-cities.csv
```bash
cat world-cities.csv | cut -d ',' -f1 > city_wordlist.txt
```

```bash
grep '[[:upper:]]' /opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt | grep '[[:lower:]]' | grep '[[:digit:]]' | grep -E '.{10}' > custom_wordlist.txt
```
o
```bash
awk 'length($0) >= 10 && /[a-z]/ && /[A-Z]/ && /[0-9]/' /opt/useful/seclists/Passwords/Leaked-Databases/rockyou.txt > custom_wordlist.txt
```

[https://cirt.net/passwords/