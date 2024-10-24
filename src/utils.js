import { loadTicket, updateTicketCalled } from "./controllers/ticketController";
import {
  getGlobalTicketData,
  updateGlobalTicketData,
} from "./controllers/globalController";
import { useToast } from "vue-toastification";
import { socket } from "@/socket";
import { useLocalStorage } from "@vueuse/core";

import { useAuth } from "./stores/auth.js";

export function convertDate(date) {
  if (!date) return;
  const dateString = new Date(date);
  const formatedDate = `${dateString.toLocaleDateString(
    "pt-BR"
  )} às ${dateString.toLocaleTimeString("pt-BR", {
    hour12: false,
  })}`.slice(0, 19);
  return formatedDate;
}

export function convertHours(ms) {
  const hours = Math.floor(ms / 1000 / 60 / 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const seconds = Math.floor((ms / 1000) % 60);

  const formatedDate = `${hours}h ${minutes}m ${seconds}s`;
  return formatedDate;
}

export function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return !isNaN(date) && date instanceof Date;
}

export async function callTicket(_id) {
  const auth = useAuth();

  const callByName = useLocalStorage("callByName", true).value;
  const showAttendantName = useLocalStorage("showAttendantName", true).value;
  const userTable = useLocalStorage("userTable", 0).value;
  if (!userTable) return useToast().error("Selecione seu guichê");

  const responseLoadTicket = await loadTicket(_id);
  const ticketData = responseLoadTicket.data.ticket[0];

  const responseGlobalTicketData = await getGlobalTicketData();
  const globalTicketData = responseGlobalTicketData.data.ticket;

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
  console.log("🚀 ~ callTicket ~ globalTicketData:", globalTicketData);
  if (updateGlobalResponse.status != 200)
    return useToast().error("Ocorreu um erro");

  ticketData.status = 2;
  ticketData.servicedBy = auth.userData.username;
  ticketData.dateServiced = new Date();
  const updateTicketResponse = await updateTicketCalled(ticketData._id, {
    ...ticketData,
  });
  if (updateTicketResponse.status != 200)
    return useToast().error("Ocorreu um erro");

  await socket.emit("signalUpdateValues");
  await socket.emit("signalUpdateMonitor", callByName);
  console.log("🚀 ~ callTicket ~ callByName:", callByName);

  localStorage.setItem("userCalledTicket", ticketData._id);
}
