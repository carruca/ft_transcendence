import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import Events from './Events.vue';

import "./assets/main.css";

const app = createApp(Events);

app.use(router);

app.mount("#app");
