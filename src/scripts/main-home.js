import "./firebase-service.js";
import { initScrolls } from "./modules/progress-backtop.js";
import { initTheme } from "./modules/dark-mode.js";
import { initForms } from "./modules/modals-form.js";

document.addEventListener("DOMContentLoaded", () => {
 initScrolls();
 initTheme();
 initForms();
});
