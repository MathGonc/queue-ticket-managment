<template>
    <div class="sidebar">
        <h2>Próximos atendimentos:</h2>
        <ul>
            <li v-for="(ticket, index) in sortedTickets" :key="index">
                {{ index }} | {{ ticketName[index] }}
                <span v-if="ticketPreferential[index]"> (Preferencial)</span>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from "vuex";

export default {
    mounted() {
        this.$store.watch(
            (state) => state.currentTicket,
            (newTicket) => {
                // Faça algo com a nova variável
                console.log("Nova atualização do ticket:", newTicket);
            }
        );
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
};
</script>

<style>
.sidebar {
    text-align: left;
    position: fixed;
    left: 0;
    top: 0;
    width: 200px;
    height: 100%;
    background-color: #f2f2f2;
    padding: 10px;
}
</style>
