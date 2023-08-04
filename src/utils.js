import { loadTicket, updateTicketCalled } from "./controllers/ticketController";
import { getGlobalTicketData, updateGlobalTicketData } from "./controllers/globalController";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { useLocalStorage } from "@vueuse/core";

import { useAuth } from "./stores/auth.js";
import { checkToken } from "./controllers/userController";

export async function callTicket(_id) {
  const auth = useAuth();
  let userData = {};
  if (auth.isAuth) {
    await checkToken().then((data) => {
      userData = data.userData;
    });
  }

  const myTable = localStorage.getItem("myTable");
  const callTicketByName = useLocalStorage("callTicketByName", true).value;
  const responseLoadTicket = await loadTicket(_id);
  const ticketData = responseLoadTicket.data.ticket[0];

  if (myTable < 1) return useToast().error("Selecione seu guichê");

  const responseGlobalTicketData = await getGlobalTicketData();
  const globalTicketData = responseGlobalTicketData.data.ticket;
  if (ticketData.number != globalTicketData.currentNumber) {
    globalTicketData.lastNumber = globalTicketData.currentNumber;
    globalTicketData.lastTable = globalTicketData.currentTable;
    globalTicketData.lastUser = globalTicketData.currentUser;

    globalTicketData.currentNumber = ticketData.number;
    globalTicketData.currentTable = myTable;
    globalTicketData.currentUser = ticketData.name;
  }
  const updateGlobalResponse = await updateGlobalTicketData({
    ticket: globalTicketData,
  });
  if (updateGlobalResponse.status != 200) return useToast().error("Ocorreu um erro");

  ticketData.status = 2;
  ticketData.servicedBy = userData.username;
  console.log(
    "🚀 ~ file: utils.js:32 ~ callTicket ~ ticketData.servicedBy:",
    ticketData.servicedBy
  );
  ticketData.dateServiced = new Date();
  const updateTicketResponse = await updateTicketCalled(ticketData._id, {
    ...ticketData,
  });
  if (updateTicketResponse.status != 200) return useToast().error("Ocorreu um erro");

  await socket.emit("signalUpdateValues");
  await socket.emit("signalUpdateMonitor", callTicketByName);

  const myCalledTicketData = useLocalStorage("myCalledTicketData", {});
  myCalledTicketData.value = ticketData;
}
