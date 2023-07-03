<template>
    <div>
        <div class="sidebar_admin" v-if="!isMobile()">
            <h2>Próximos atendimentos:</h2>
            <ul style="white-space: nowrap">
                <li v-for="(ticket, index) in filteredTickets" :key="index">
                    {{ ticket.ticketNumber }} ({{ ticket.ticketName }}) [{{
                        ticket.ticketType
                    }}]
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
            this.$store.dispatch("getGlobalVariablesAPI");
        });
    },
    computed: {
        ...mapState([
            "ticketInQueue",
            "ticketType",
            "ticketPreferential",
            "ticketName",
        ]),
        filteredTickets() {
            return this.ticketInQueue.reduce((filtered, ticket, index) => {
                if (ticket === 1) {
                    filtered.push({
                        ticketNumber: index,
                        ticketName: this.ticketName[index],
                        ticketType: this.ticketType[index],
                        ticketPreferential: this.ticketPreferential[index],
                    });
                }
                return filtered;
            }, []);
        },
    },
    methods: {
        isMobile() {
            if (
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                )
            ) {
                return true;
            } else {
                return false;
            }
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
