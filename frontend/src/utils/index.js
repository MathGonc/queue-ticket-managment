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

// Remove tudo que nao for digito (ex.: CPF "123.456.789-01" -> "12345678901")
export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
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

export function calculateAge(date) {
  if (date == null)
    return false
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function callTicket(_id) {
  const { useAuth } = await import("@/stores/auth.js");
  const { useLocalStorage } = await import("@vueuse/core");
  const { useToast } = await import("vue-toastification");
  const { loadTicket, updateTicketCalled } = await import("@/controllers/ticketController.js");
  const { getGlobalTicketData, updateGlobalTicketData } = await import("@/controllers/globalController.js");
  const { createSocket } = await import("@/socket.js");

  const auth = useAuth();
  const toast = useToast();

  const callByName = useLocalStorage("callByName", true).value;
  const showAttendantName = useLocalStorage("showAttendantName", true).value;
  const userTable = useLocalStorage("userTable", 0).value;
  if (!userTable) return toast.error("Selecione seu guichê");

  // Use authenticated socket for control events
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
  const updateTicketResponse = await updateTicketCalled(ticketData._id, {
    ...ticketData,
  });
  if (updateTicketResponse.status != 200)
    return toast.error("Ocorreu um erro");

  await socket.emit("signalUpdateValues");
  await socket.emit("signalUpdateMonitor", callByName);

  localStorage.setItem("userCalledTicket", ticketData._id);
}
