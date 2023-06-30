<template>
    <div class="admin">
        <h2>Painel de Administração - Guichê: {{ myTable }}</h2>
        <h4>Senha atual: {{ currentTicket }} (Guichê: {{ currentTable }})</h4>
        <label for="counter"
            >Digite o número do guichê:
            <input
                type="number"
                id="counter"
                min="00"
                max="99"
                maxlength="2"
                v-model="myTable"
        /></label>

        <button @click="callNextTicket" :disabled="buttonDisabled" class="btn">
            Chamar Próxima Senha
        </button>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "page_admin",
    data() {
        return {
            myTable: "00",
            myCalledTicket: 0,
            buttonDisabled: false,
        };
    },
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("updatedGlobalCurrentTicket", () => {
            this.$store.dispatch("getVariablesAPI");
        });

        this.$store.watch(
            (state) => state.currentTicket,
            (newTicket) => {
                // Faça algo com a nova variável
                console.log("Nova atualização do ticket:", newTicket);
            }
        );
    },
    methods: {
        callNextTicket() {
            let data = {
                newTicket: parseInt(this.currentTicket) + 1,
                newTable: parseInt(this.myTable),
            };
            console.log(data);
            this.$store.dispatch("updatedGlobalCurrentTicket", data);
            this.$store.dispatch("updateVariables");

            this.socket.emit("clientMonitorUpdate", this.currentTicket);

            this.myCalledTicket = this.currentTicket;
            //this.buttonDisabled = true;

            // Habilita o botão novamente após 10 segundos (10000 ms)
            setTimeout(() => {
                this.buttonDisabled = false;
            }, 10000);
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
