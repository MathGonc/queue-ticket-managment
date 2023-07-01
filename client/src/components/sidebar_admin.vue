<template>
    <div>
        <div class="sidebar_admin">
            <h2>Próximos atendimentos:</h2>
            <ul style="white-space: nowrap">
                <li v-for="(ticket, index) in filteredTickets" :key="index">
                    {{ ticket.ticketNumber }} - {{ ticket.ticketName }}
                    <span v-if="ticket.ticketPreferential" style="color: red"
                        >(Preferencial)</span
                    >
                </li>
            </ul>
        </div>
        <router-view></router-view>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("receiveUpdateGlobal", () => {
            this.$store.dispatch("getVariablesAPI");
        });
    },
    computed: {
        ...mapState(["ticketInQueue", "ticketPreferential", "ticketName"]),
        filteredTickets() {
            return this.ticketInQueue.reduce((filtered, ticket, index) => {
                if (ticket === 1) {
                    filtered.push({
                        ticketNumber: index,
                        ticketName: this.ticketName[index],
                        ticketPreferential: this.ticketPreferential[index],
                    });
                }
                return filtered;
            }, []);
        },
    },
};
</script>

<style>
.sidebar_admin {
    text-align: left;
    position: fixed;
    left: 0;
    top: 0;
    width: 200px;
    height: 100%;
    background-color: #f2f2f2;
}
</style>
