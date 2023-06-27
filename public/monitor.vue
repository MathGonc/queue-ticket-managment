<template>
  <div>
    <header>
      <h1>Chamada de senhas</h1>
    </header>
    <main>
      <div class="ticket">
        <h2>Senha</h2>
        <h2 id="ticket">N0000</h2>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  mounted() {
    const vTicket = document.querySelector("#ticket");
    let ticketNormal = localStorage.getItem("ticketNormal");
    let ticketPref = localStorage.getItem("ticketPref");
    let lastTicket = localStorage.getItem("lastTicket");
    let audio = new Audio("../sounds/audio.mp3");

    if (!ticketNormal) ticketNormal = 0;

    if (!ticketPref) ticketPref = 0;

    if (!lastTicket) lastTicket = 0;

    this.showTicket(vTicket, ticketNormal, ticketPref, lastTicket);

    window.addEventListener("keydown", (e) => {
      if (e.key == "n" || e.key == "N") {
        ticketNormal++;
        lastTicket = "N";
        audio.play();
      } else if (e.key == "p" || e.key == "P") {
        ticketPref++;
        lastTicket = "P";
        audio.play();
      } else if (e.key == "r" || e.key == "R") {
        ticketPref++;
        lastTicket = "N";
        ticketNormal = 0;
        ticketPref = 0;
      }

      console.log(
        "Senha normal = " + ticketNormal + " senha pref:" + ticketPref
      );

      localStorage.setItem("ticketNormal", ticketNormal);
      localStorage.setItem("ticketPref", ticketPref);
      localStorage.setItem("lastTicket", lastTicket);
      this.showTicket(vTicket, ticketNormal, ticketPref, lastTicket);
    });
  },
  methods: {
    showTicket(vTicket, ticketNormal, ticketPref, lastTicket) {
      if (lastTicket == "N") {
        vTicket.innerHTML =
          "N" +
          parseInt(ticketNormal).toLocaleString("pt-br", {
            minimumIntegerDigits: 3,
          });
      } else {
        vTicket.innerHTML =
          "P" +
          parseInt(ticketPref).toLocaleString("pt-br", {
            minimumIntegerDigits: 3,
          });
      }
    },
  },
};
</script>

<style>
/* Estilos CSS para o componente */
</style>
