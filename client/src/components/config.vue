<template>
    <div class="config">
        <h2>Painel de configuração</h2>
        <div class="input-button-container">
            <label for="counter">
                <input
                    type="number"
                    id="counter"
                    min="00"
                    max="99"
                    maxlength="2"
                    v-model="newTicketNumber"
                /><button
                    @click="changeActualTicket(newTicketNumber)"
                    :disabled="buttonDisabled"
                    class="btn-info"
                >
                    Modificar senha atual
                </button></label
            >
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "page_config",
    data() {
        return {
            newTicketNumber: 0,
            buttonDisabled: false,
        };
    },
    mounted() {
        this.socket = io(config.url_server);
    },
    methods: {
        changeActualTicket(value) {
            let data = {
                newTicket: parseInt(value),
                newTable: 0,
            };
            console.log(data);
            this.$store.dispatch("updatedGlobalCurrentTicket", data);
            this.$store.dispatch("updateVariables");

            this.socket.emit("clientMonitorUpdate", this.currentTicket);
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
