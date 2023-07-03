<template>
    <div class="index">
        <span class="title_page">Sistema de atendimento</span>
        <div class="buttons">
            <button type="button" class="btn btn btn-outline-primary" @click="goToService">
                Atendimento
            </button>
            <button type="button" class="btn btn btn-outline-primary" @click="goToSorting">
                Triagem
            </button>
            <button type="button" class="btn btn btn-outline-primary" @click="goToMonitor">
                Monitor
            </button>
            <button type="button" class="btn btn btn-outline-primary" @click="goToConfig">
                Configurações
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: "page_index",
    props: {},
    methods: {
        goToMonitor() {
            this.$router.push({ name: "monitor" });
        },
        goToService() {
            this.$router.push({ name: "service" });
        },
        goToSorting() {
            this.$router.push({ name: "sorting" });
        },
        goToConfig() {
            this.$router.push({ name: "config" });
        },
    },
};
</script>

<style scoped>
.index {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.buttons {
    margin-top: 20px;
}

.btn {
    display: block;
    width: 200px;
    height: 50px;
    margin-bottom: 10px;
}
</style>
