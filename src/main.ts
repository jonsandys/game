import "./style.css";
import { createApp } from "./app";

const mount = document.querySelector<HTMLDivElement>("#app");

if (!mount) {
  throw new Error("App mount element not found.");
}

createApp(mount);
