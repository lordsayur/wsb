import { greet } from "shared";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.textContent = greet("wsb");
