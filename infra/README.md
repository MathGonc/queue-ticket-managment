# Infra

Duas formas de subir o sistema. O código é o mesmo; muda só quem roda os processos.

| | [Standalone](standalone/README.md) | [Docker](docker/README.md) |
|---|---|---|
| Para | Windows **sem virtualização** (forma principal hoje) | Máquina com Docker |
| Como roda | MongoDB, backend e frontend, cada um numa janela | 3 containers |
| Frontend | `http://<ip>:8080` | `http://<ip>` (porta 80) |
| Backend (API) | porta 3030 | porta 3030 |
| Config | `backend/.env` + `infra/standalone/.env` | `infra/docker/.env` |

Nos dois modos o navegador acessa o backend em `<mesmo host>:3030`. Por isso o mesmo build funciona em qualquer IP, e a porta 3030 precisa estar liberada no firewall junto com a do frontend.
