Para executar "vue" sem as restrições do windows: set-executionpolicy RemoteSignedvue

MongoDB: connect EACCES 127.0.0.1:2701 >> Reiniciar serviço no gerenciador de tarefas

## **DOCKER / MongoDB::**
mongodb://admin:senha123@localhost:27017

Rodar novo container via docker-compose.yml:
docker compose up -d

Usar container já existente:
docker start mongodb

Containers:
docker ps

Logs:
docker logs mongodb

Entrar no mongo:
docker exec -it mongodb mongosh