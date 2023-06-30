<template>
    <div class="admin">
        <h2>Painel de Administração - Guichê: {{ myTable }}</h2>
        <h4>
            Senha atual: {{ currentTicket }} ({{ currentUser }}) (Guichê:
            {{ currentTable }})
        </h4>
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
    computed: {
        ...mapState([
            "currentTicket",
            "currentTable",
            "currentUser",
            "lastTicket",
            "lastTable",
            "lastUser",
            "ticketInQueue",
            "ticketPreferential",
            "ticketName",
        ]),
    },
    methods: {
        callNextTicket() {
            let ticketIndex = -1;
            for (let i = 0; i < this.ticketInQueue.length; i++) {
                if (
                    this.ticketInQueue[i] === 1 &&
                    this.ticketPreferential[i] === 1
                ) {
                    ticketIndex = i;
                    break;
                }
            }

            // Se não houver ticket preferencial, procurar por tickets não preferenciais (ticketInQueue == 1)
            if (ticketIndex === -1) {
                for (let i = 0; i < this.ticketInQueue.length; i++) {
                    if (this.ticketInQueue[i] === 1) {
                        ticketIndex = i;
                        break;
                    }
                }
            }

            if (ticketIndex !== -1) {
                // Ticket encontrado
                this.currentTicket = ticketIndex.toString().padStart(3, "0");
                this.ticketInQueue[ticketIndex] = 2;
                this.ticketPreferential[ticketIndex] = 0;
                this.ticketName[ticketIndex] = "-";

                let data = {
                    newTicket: parseInt(ticketIndex),
                    newTable: parseInt(this.myTable),
                    newUser: "",
                };
                console.log(data);
                this.$store.dispatch("updatedGlobalCurrentTicket", data);
                this.$store.dispatch("updateVariablesInAPI");

                this.socket.emit("clientMonitorUpdate", parseInt(ticketIndex));

                this.myCalledTicket = parseInt(ticketIndex);

                //this.buttonDisabled = true;
                setTimeout(() => {
                    this.buttonDisabled = false;
                }, 10000);
            } else {
                console.log("Nenhuma senha cadastrada");
            }
        },
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
