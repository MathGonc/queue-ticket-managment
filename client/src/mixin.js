export default {
    data() {
        return {
            showAlert: false,
            stringAlert: "-",
        };
    },
    methods: {
        showNotification(string) {
            console.log(`Notificação exibida: ${string}`);
            this.stringAlert = string;
            this.showAlert = true;
            setTimeout(() => {
                this.showAlert = false;
            }, 5000);
        },
    },
};
