<template>
    <div>
        <input v-model="nameInput" placeholder="Nome" />
        <div><input type="checkbox" v-model="preferential" /> Preferencial</div>
        <button @click="cadastrarSenha()">Cadastrar Senha</button>
        <h2>Proximos atendimentos:</h2>
        <li v-for="(ticket, index) in sortedTickets" :key="index">
            {{ index }} | {{ ticketName[index] }}
            <span v-if="ticketPreferential[index]"> (Preferencial)</span>
        </li>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "page_sorting",
    data() {
        return {
            nameInput: "",
            preferential: false,
        };
    },
    mounted() {
        this.socket = io(config.url_server);
        this.$store.dispatch("getVariablesAPI");
    },
    computed: {
        ...mapState(["ticketInQueue", "ticketPreferential", "ticketName"]),
        sortedTickets() {
            const sorted = [];
            console.log(this.ticketInQueue);
            for (let i = 0; i < this.ticketInQueue.length; i++) {
                if (this.ticketInQueue[i] === 1) {
                    sorted.push(
                        this.ticketInQueue[i].toString().padStart(3, "0")
                    );
                }
            }

            return sorted;
        },
    },
    methods: {
        cadastrarSenha() {
            if (this.nameInput.length < 1) return;
            // Procurar a primeira posição vaga na array ticketInQueue
            const index = this.ticketInQueue.findIndex(
                (ticket) => ticket === 0
            );
            console.log(index);

            if (index !== -1) {
                // Atualizar os valores da senha na posição encontrada
                this.ticketInQueue[index] = 1; // Altera o status para "cadastrada"
                this.ticketPreferential[index] = this.preferential ? 1 : 0; // Define o valor preferencial ou não
                this.ticketName[index] = this.nameInput; // Define o nome preenchido

                this.$store.commit("setTicketData", {
                    index,
                    ticketInQueue: this.ticketInQueue[index],
                    ticketPreferential: this.ticketPreferential[index],
                    ticketName: this.ticketName[index],
                });

                this.$store.dispatch("updateVariablesInAPI");
                this.socket.emit("clientMonitorUpdate", this.currentTicket);

                this.nameInput = "";
                this.preferential = false;
            }
        },
    },
};
</script>
