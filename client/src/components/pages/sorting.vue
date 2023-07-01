<template>
    <div class="sorting">
        <h2>Painel de triagem</h2>
        <input v-model="nameInput" placeholder="Nome" />

        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                v-model="preferential"
            />
            <label class="form-check-label" for="flexSwitchCheckDefault"
                >Preferencial</label
            >
        </div>
        <button
            type="button"
            @click="cadastrarSenha()"
            class="btn btn-outline-primary"
        >
            Cadastrar Senha
        </button>
    </div>
</template>

<script>
import { mapState } from "vuex";
import { useToast } from "vue-toastification";
import io from "socket.io-client";
import config from "../../../config.js";

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
    },
    computed: {
        ...mapState(["ticketInQueue", "ticketPreferential", "ticketName"]),
    },
    methods: {
        cadastrarSenha() {
            if (this.nameInput.length < 1) {
                return useToast().error("Digite um nome para cadastrar");
            }
            // Procurar a primeira posição vaga na array ticketInQueue
            const index = this.ticketInQueue.findIndex(
                (ticket) => ticket === 0
            );

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
                this.socket.emit("signalUpdateValues");

                this.nameInput = "";
                this.preferential = false;

                useToast().success("Usuario cadastrado com sucesso");
            } else
                return useToast().error(
                    "Sem espaço disponivel para novas senhas"
                );
        },
    },
};
</script>

<style scoped>
.sorting {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
