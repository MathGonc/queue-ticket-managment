<template>
    <div class="sorting">
        <span class="title_page">Painel de triagem</span>
        <transition-group>
            <div v-if="transitionFade">
                <div class="container w-25 p-3">
                    <div class="row">
                        <div class="col">
                            <div class="input-group input-group-sm mb-3">
                                <span class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm"
                                        >Nome:</span
                                    >
                                </span>
                                <input
                                    type="text"
                                    class="form-control"
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    v-model="nameInput" />
                            </div>

                            <div class="form-check form-switch">
                                <label class="form-check-label" for="flexSwitchCheckDefault">
                                    <input
                                        class="form-check-input"
                                        type="checkbox"
                                        id="flexSwitchCheckDefault"
                                        v-model="preferential" />
                                    Preferencial</label
                                >
                            </div>
                            <button
                                type="button"
                                @click="cadastrarSenha()"
                                class="btn btn-outline-primary"
                                :disabled="buttonDisabled">
                                Cadastrar Senha
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>
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
            transitionFade: false,
            buttonDisabled: false,
            nameInput: "",
            preferential: false,
        };
    },
    mounted() {
        this.transitionFade = true;
        this.socket = io(config.url_server);
    },
    computed: {
        ...mapState(["ticketInQueue", "ticketPreferential", "ticketName"]),
    },
    methods: {
        setButtonDisabled() {
            this.buttonDisabled = true;
            setTimeout(() => {
                this.buttonDisabled = false;
            }, 5000);
        },
        cadastrarSenha() {
            if (this.nameInput.length < 1) {
                return useToast().error("Digite um nome para cadastrar");
            }
            // Procurar a primeira posição vaga na array ticketInQueue
            const index = this.ticketInQueue.findIndex((ticket) => ticket === 0);

            if (index !== -1) {
                this.ticketInQueue[index] = 1;
                this.ticketPreferential[index] = this.preferential ? 1 : 0;
                this.ticketName[index] = this.nameInput;
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
            } else return useToast().error("Sem espaço disponivel para novas senhas");
            this.setButtonDisabled();
        },
    },
};
</script>

<style scoped></style>
