import { ref } from "vue";

// Sugestoes enquanto digita (CPF e nome na triagem): busca com espera curta,
// descarta respostas atrasadas e navega com as setas, Enter e Esc.
export function useSuggest(fetcher, { min = 3, delay = 250 } = {}) {
  const items = ref([]);
  const open = ref(false);
  const active = ref(-1);
  let seq = 0;
  let timer = null;

  function close() {
    clearTimeout(timer);
    seq++;
    open.value = false;
    active.value = -1;
  }

  function search(query) {
    clearTimeout(timer);
    if (!query || query.length < min) {
      close();
      items.value = [];
      return;
    }
    timer = setTimeout(async () => {
      const mine = ++seq;
      try {
        const list = await fetcher(query);
        if (mine !== seq) return;
        items.value = list;
        open.value = list.length > 0;
        active.value = -1;
      } catch {
        // Sem sugestoes: a pessoa continua digitando normalmente
      }
    }, delay);
  }

  // pick(item) e chamado no Enter sobre um item destacado
  function onKeydown(event, pick) {
    if (!open.value || !items.value.length) return;
    const n = items.value.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active.value = (active.value + 1) % n;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active.value = (active.value - 1 + n) % n;
    } else if (event.key === "Enter" && active.value >= 0) {
      event.preventDefault();
      pick(items.value[active.value]);
    } else if (event.key === "Escape") {
      close();
    }
  }

  return { items, open, active, search, close, onKeydown };
}
