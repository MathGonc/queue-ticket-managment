<template>
    <div class="config">
        <h2>Painel de configuração</h2>
        <div>
            <button
                type="button"
                class="btn btn-outline-danger"
                @click="changeActualTicket(newTicketNumber)"
                :disabled="buttonDisabled"
            >
                Resetar senhas
            </button>
        </div>

        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                v-model="soundNotification"
            />
            <label class="form-check-label" for="flexSwitchCheckDefault"
                >Notificação ao chamar senha</label
            >
        </div>

        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                v-model="soundCallTicket"
            />
            <label class="form-check-label" for="flexSwitchCheckDefault"
                >Voz ao chamar senha</label
            >
        </div>
        <div v-if="soundCallTicket">
            <label>Tipo de voz: </label
            ><select class="selectpicker" v-model="soundCallTicketVoice">
                <option v-for="value in 21" :key="value - 1">
                    {{ value - 1 }}
                </option>
            </select>
        </div>
    </div>
</template>

<script>
export default {
    name: "page_config",
    data() {
        return {
            soundNotification: true,
            soundCallTicket: true,
            soundCallTicketVoice: 0,
            voicesSelectAvailable: [],
        };
    },
    mounted() {
        speechSynthesis.onvoiceschanged = function () {
            var voices = speechSynthesis.getVoices();
            console.log(voices);
        };
    },
    methods: {},
    computed: {},
};
</script>

<style scoped>
.config {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
