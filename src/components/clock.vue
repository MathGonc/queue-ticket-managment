<template>
  <div class="clock">
    <nav class="fixed-top">
      <span class="col pt-auto px-3">{{ currentTime.toLocaleTimeString() }}</span>
    </nav>
  </div>
</template>

<script>
import { useCurrentTime } from "./clock";
export default {
  name: "component_clock",
  setup() {
    const { currentTime } = useCurrentTime();
    console.log(currentTime.value);
    return { currentTime };
  },
};
</script>

<style></style>
