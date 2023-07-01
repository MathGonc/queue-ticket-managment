<template>
    <div class="admin">
        <div class="container">
            <h2>Painel de atendimento</h2>
            <h5>
                Senha atual: {{ currentTicket }} ({{ currentUser }}) (Guichê:
                {{ currentTable }})
            </h5>
            <br />
            <div class="input-group mb-3 justify-content-center">
                <span class="input-group-text" id="basic-addon1"
                    >Digite o número do seu guichê:</span
                ><input
                    type="number"
                    id="counter"
                    min="00"
                    max="99"
                    maxlength="2"
                    v-model="myTable"
                />
            </div>
            <br />
            <span
                ><button
                    type="button"
                    @click="callNextTicket"
                    :disabled="buttonDisabled"
                    class="btn btn-outline-primary"
                >
                    Chamar Próxima Senha
                </button></span
            >

            <span v-if="myCalledTicket != 0"
                ><button
                    type="button"
                    @click="callNextTicket"
                    :disabled="true"
                    class="btn btn-outline-primary"
                >
                    Chamar senha {{ myCalledTicket }} novamente
                </button></span
            >
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../../config.js";

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
        this.socket.on("receiveUpdateGlobal", () => {
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
                let data = {
                    newTicket: parseInt(ticketIndex),
                    newTable: parseInt(this.myTable),
                    newUser: this.ticketName[ticketIndex],
                };
                console.log(data);
                this.$store.dispatch("updatedGlobalCurrentTicket", data);

                this.currentTicket = ticketIndex.toString().padStart(3, "0");
                this.ticketInQueue[ticketIndex] = 2;
                this.ticketPreferential[ticketIndex] = 0;
                this.ticketName[ticketIndex] = "-";

                this.$store.dispatch("updateVariablesInAPI");

                this.socket.emit("signalUpdateValues");
                this.socket.emit("signalUpdateMonitor", ticketIndex);

                this.myCalledTicket = parseInt(ticketIndex);

                this.buttonDisabled = true;
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

<style scoped></style>
