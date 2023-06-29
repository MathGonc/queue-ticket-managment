<template>
    <div class="admin">
        <h2>Painel de Administração - Guichê: {{ myTable }}</h2>
        <label for="counter">Digite o número do guichê:</label>
        <input type="number" id="counter" min="00" max="99" v-model="myTable" />
        <button @click="callNextPassword" class="btn">
            Chamar Próxima Senha
        </button>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "admin_page",
    data() {
        return {
            myTable: "00",
        };
    },
    mounted() {
        this.socket = io(config.url_server);
    },
    methods: {
        callNextPassword() {
            this.$store.dispatch("updateCurrentTicket", this.myTable);
            this.$store.dispatch("updateVariables");
            this.socket.emit("newUpdate", this.currentTicket);
        },
    },
    computed: {
        ...mapState([
            "currentTicket",
            "currentTable",
            "lastTicket",
            "lastTable",
        ]),
    },
};
</script>

<style scoped>
.admin {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.btn {
    display: block;
    width: 200px;
    height: 50px;
    margin-top: 20px;
}
</style>
