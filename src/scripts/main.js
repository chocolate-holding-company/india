import "./firebase-service.js";
import { initScrolls } from "./modules/progress-backtop.js";
import { initTheme } from "./modules/dark-mode.js";
import { initForms } from "./modules/modals-form.js";
import { initNewsComments } from "./modules/newsletter-comments.js";
import { initSlideMenu } from "./modules/slide-menu.js";

document.addEventListener("DOMContentLoaded", () => {
 initScrolls();
 initTheme();
 initForms();
 if (document.getElementById("comments-section")) {
  initNewsComments();
 }
 initSlideMenu();
});
