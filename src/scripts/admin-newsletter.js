/* global FirebaseService */

document.addEventListener("DOMContentLoaded", () => {
 const loginForm = document.getElementById("admin-login-form");
 const loginStatus = document.getElementById("admin-login-status");
 const adminLogin = document.getElementById("admin-login");
 const adminPanel = document.getElementById("admin-panel");
 const adminEmail = document.getElementById("admin-email");
 const signOutBtn = document.getElementById("admin-signout");
 const newsletterContainer = document.getElementById("admin-newsletter");

 const ALLOWED_ADMINS = ["h@bylucas.org"];

 const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  const normalized = String(user.email).trim().toLowerCase();
  return ALLOWED_ADMINS.map((email) =>
   String(email || "")
    .trim()
    .toLowerCase(),
  ).includes(normalized);
 };

 const setStatus = (message, isError = false) => {
  if (!loginStatus) return;
  loginStatus.textContent = message || "";
  loginStatus.classList.toggle("text-red-600", isError);
  loginStatus.classList.toggle("text-green-600", !isError);
 };

 const showLogin = (message) => {
  adminPanel.classList.add("hidden");
  adminLogin.classList.remove("hidden");
  setStatus(message);
 };

 const showAdmin = (user) => {
  adminEmail.textContent = user?.email || "";
  adminLogin.classList.add("hidden");
  adminPanel.classList.remove("hidden");
 };

 const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
 };

 const formatTimestamp = (value) => {
  if (!value) return "";
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  try {
   return new Date(value).toLocaleString();
  } catch {
   return String(value);
  }
 };

 const setContainerHtml = (container, html) => {
  if (!container) return;
  container.innerHTML = html;
 };

 const renderNewsletter = (subscribers = []) => {
  if (!subscribers || subscribers.length === 0) {
   setContainerHtml(
    newsletterContainer,
    '<p class="text-sm text-gray-500">No newsletter signups found.</p>',
   );
   return;
  }

  const html = subscribers
   .map((subscriber) => {
    return `
      <div class="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2" data-subscriber-id="${escapeHtml(subscriber.id)}">
        <div>
          <div class="text-sm font-semibold">${escapeHtml(subscriber.email)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(formatTimestamp(subscriber.subscribedAt))}</div>
        </div>
        <button type="button" data-action="delete-subscriber" class="text-xs font-semibold px-3 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
          Delete
        </button>
      </div>
    `;
   })
   .join("");

  setContainerHtml(newsletterContainer, html);
  attachNewsletterActions();
 };

 const attachNewsletterActions = () => {
  if (!newsletterContainer) return;
  const buttons = newsletterContainer.querySelectorAll(
   "[data-action='delete-subscriber']",
  );
  buttons.forEach((button) => {
   const subElement = button.closest("[data-subscriber-id]");
   if (!subElement) return;
   const subscriberId = subElement.dataset.subscriberId;

   button.addEventListener("click", async () => {
    if (!window.confirm("Remove this subscriber?")) return;
    try {
     button.disabled = true;
     await FirebaseService.deleteSubscriber(subscriberId);
     await loadAll();
    } catch (error) {
     console.error(error);
     setStatus(String(error.message || error), true);
    } finally {
     button.disabled = false;
    }
   });
  });
 };

 const loadAll = async () => {
  if (!FirebaseService) return;
  setContainerHtml(
   newsletterContainer,
   '<p class="text-sm text-gray-500">Loading newsletter signups…</p>',
  );

  try {
   const subscribers = await FirebaseService.getNewsletterSubscribers();
   renderNewsletter(subscribers);
  } catch (error) {
   console.error(error);
   setContainerHtml(
    newsletterContainer,
    `<p class="text-sm text-red-600">Error loading data: ${escapeHtml(String(error.message || error))}</p>`,
   );
  }
 };

 const handleAuthChange = (user) => {
  if (isAdminUser(user)) {
   setStatus("");
   showAdmin(user);
   loadAll();
  } else {
   showLogin(
    user
     ? "Your account is not configured as an administrator."
     : "Sign in to access the admin dashboard.",
   );
  }
 };

 const handleLogin = async (event) => {
  event.preventDefault();
  if (!loginForm) return;
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  if (!email || !password) {
   setStatus("Email and password are required.", true);
   return;
  }
  try {
   setStatus("Signing in…");
   const credential = await FirebaseService.signIn(email, password);
   handleAuthChange(credential?.user || FirebaseService.getCurrentUser?.());
  } catch (error) {
   console.error(error);
   setStatus(String(error.message || error), true);
  }
 };

 const handleSignOut = async () => {
  try {
   await FirebaseService.signOut();
   showLogin("Signed out.");
  } catch (error) {
   console.error(error);
   setStatus(String(error.message || error), true);
  }
 };

 if (!window.FirebaseService) {
  setStatus("Firebase is not loaded.", true);
  return;
 }

 if (typeof FirebaseService.onAuthStateChanged === "function") {
  FirebaseService.onAuthStateChanged(handleAuthChange);
 } else {
  handleAuthChange(FirebaseService.getCurrentUser?.());
 }

 if (loginForm) loginForm.addEventListener("submit", handleLogin);
 if (signOutBtn) signOutBtn.addEventListener("click", handleSignOut);
});
