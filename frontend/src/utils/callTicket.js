// Chamada de senha (guiche). Logica identica a do projeto original; fica
// fora de utils/index.js para que aquele modulo tenha so funcoes puras.
import { useLocalStorage } from "@vueuse/core";
import { useToast } from "vue-toastification";
import { useAuth } from "@/stores/auth.js";
import { createSocket } from "@/socket.js";
import { loadTicket, updateTicketCalled } from "@/controllers/ticketController.js";
import {
  getGlobalTicketData,
  updateGlobalTicketData,
} from "@/controllers/globalController.js";

export async function callTicket(_id) {
  const auth = useAuth();
  const toast = useToast();

  const callByName = useLocalStorage("callByName", true).value;
  const showAttendantName = useLocalStorage("showAttendantName", true).value;
  const userTable = useLocalStorage("userTable", 0).value;
  if (!userTable) return toast.error("Selecione seu guichê");

  // Socket autenticado: o backend ignora sinais sem token valido
  const socket = createSocket();

  const responseLoadTicket = await loadTicket(_id);
  const ticketData = responseLoadTicket.data.ticket[0];

  const responseGlobalTicketData = await getGlobalTicketData();
  const globalTicketData = responseGlobalTicketData.data.ticket;

  // Set servicedBy BEFORE updating global data so currentServicedBy is correct
  ticketData.servicedBy = auth.userData.username;

  if (ticketData.number != globalTicketData.currentNumber) {
    globalTicketData.lastNumber = globalTicketData.currentNumber;
    globalTicketData.lastTable = globalTicketData.currentTable;
    globalTicketData.lastUser = globalTicketData.currentUser;
    globalTicketData.lastShowAttendant = globalTicketData.currentShowAttendant;
    globalTicketData.lastServicedBy = globalTicketData.currentServicedBy;

    globalTicketData.currentNumber = ticketData.number;
    globalTicketData.currentTable = userTable;
    globalTicketData.currentUser = ticketData.name;
    globalTicketData.currentShowAttendant = showAttendantName;
    globalTicketData.currentServicedBy = ticketData.servicedBy;
  }
  const updateGlobalResponse = await updateGlobalTicketData({
    ticket: globalTicketData,
  });
  if (updateGlobalResponse.status != 200)
    return toast.error("Ocorreu um erro");

  ticketData.status = 2;
  ticketData.dateServiced = new Date();
  ticketData.servicedTable = Number(userTable); // guiche que chamou (registro de atividades)
  const updateTicketResponse = await updateTicketCalled(ticketData._id, {
    ...ticketData,
  });
  if (updateTicketResponse.status != 200)
    return toast.error("Ocorreu um erro");

  await socket.emit("signalUpdateValues");
  await socket.emit("signalUpdateMonitor", callByName);

  localStorage.setItem("userCalledTicket", ticketData._id);
}
