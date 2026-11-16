# Modo Docker

Sobe MongoDB, backend e frontend em containers, isolado do modo standalone. Não usa `backend/.env` nem os `.env` do frontend.

## Subir

Nesta pasta (`infra/docker`):

```bash
cp .env.example .env      # Windows: copy .env.example .env
# edite .env: DB_PASS e JWT_SECRET são obrigatórios
docker compose up -d --build
```

| Serviço | Porta no host |
|---------|---------------|
| frontend (nginx) | `FRONTEND_PORT` (80) |
| backend | `BACKEND_PORT` (3030) |
| mongodb | `127.0.0.1:MONGO_PORT` (27017), acessível só da própria máquina |

O backend só sobe depois que o MongoDB responde (healthcheck). No primeiro start de um volume novo, crie o administrador:

```bash
docker compose exec backend npm run create-admin -- --login nome.sobrenome --name "Nome" --password segredo
```

## Operação

```bash
docker compose ps              # status (inclui healthcheck do backend)
docker compose logs -f backend
docker compose down            # para (os dados ficam no volume mongodb_data)
docker compose up -d --build   # depois de atualizar o código
```

## Observações

- `DB_USER`/`DB_PASS` criam o usuário root do MongoDB **apenas no primeiro start do volume**. Trocar depois exige recriar o volume ou alterar o usuário no banco.
- O frontend é compilado sem `VITE_URL`: o navegador usa o próprio host para chegar ao backend em `BACKEND_PORT`. A mesma imagem funciona em qualquer IP.
- O `.dockerignore` da raiz impede que o `node_modules` do Windows e os `.env` locais entrem nas imagens.
