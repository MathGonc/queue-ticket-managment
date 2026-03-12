const mongoose = require("mongoose");

async function connect() {
  mongoose.connect(`mongodb://${process.env.VUE_APP_DB_USER}:${process.env.VUE_APP_DB_PASS}@${process.env.VUE_APP_DB_IP}/${process.env.VUE_APP_DB_NAME}?authSource=admin`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "Erro na conexão com o banco de dados:"));
  db.once("open", () => {
    console.log("Conexão bem-sucedida com o banco de dados");
  });
}

module.exports = { connect };
