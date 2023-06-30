<template>
    <div class="index">
        <h1>{{ msg }}</h1>
        <div class="buttons">
            <button @click="goToAdmin" class="btn">Atendente</button>
            <button @click="goToSorting" class="btn">Triagem</button>
            <button @click="goToMonitor" class="btn">Monitor</button>
            <button @click="goToConfig" class="btn">Config</button>
        </div>
    </div>
</template>

<script>
export default {
    name: "page_index",
    props: {
        msg: String,
    },
    methods: {
        goToAdmin() {
            this.$router.push("/admin");
        },
        goToSorting() {
            this.$router.push("/sorting");
        },
        goToMonitor() {
            this.$router.push("/monitor");
        },
        goToConfig() {
            this.$router.push("/config");
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
