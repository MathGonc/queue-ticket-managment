<template>
    <div class="sidebar" v-if="!isMobile()">
        <div>
            <div class="container-fluid">
                <div class="row flex-nowrap">
                    <div class="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark">
                        <div
                            class="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
                            <a
                                class="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                                <span class="fs-5 d-none d-sm-inline">
                                    <h2>Próximos atendimentos:</h2>
                                </span>
                            </a>

                            <ul
                                class="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start">
                                <li
                                    class="nav-item"
                                    v-for="(ticket, index) in filteredTickets"
                                    :key="index">
                                    <a
                                        href="#"
                                        class="nav-link align-middle px-0"
                                        style="color: rgb(255, 255, 255)">
                                        <i class="fs-4 bi-house"></i>
                                        <span class="ms-1 d-none d-sm-inline"
                                            >{{ ticket.ticketNumber }} - {{ ticket.ticketName }} ({{
                                                ticket.ticketType
                                            }})<span
                                                v-if="ticket.ticketPreferential"
                                                style="color: red"
                                                >(Preferencial)</span
                                            ></span
                                        >
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col py-3"><router-view></router-view></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
import config from "../../config.js";

export default {
    name: "page_sidebar",
    mounted() {
        this.socket = io(config.url_server);
        this.socket.on("receiveUpdateGlobal", () => {
            this.$store.dispatch("getGlobalVariablesAPI");
        });
    },
    computed: {
        ...mapState(["ticketInQueue", "ticketType", "ticketPreferential", "ticketName"]),
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

<style></style>
