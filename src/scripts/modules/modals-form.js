export function initForms() {
 const overlay = document.getElementById("modal-overlay");
 const contactModal = document.getElementById("contact-modal");
 const privacyModal = document.getElementById("privacy-modal");
 const contactForm = document.getElementById("contact-form");
 const successMsg = document.getElementById("success-msg");
 const submitBtn = document.getElementById("submit-btn");
 const btnText = document.getElementById("btn-text");
 const btnSpinner = document.getElementById("btn-spinner");

 // --- Modal Logic ---
 const openModal = (type) => {
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  if (type === "contact") contactModal.classList.remove("hidden");
  if (type === "privacy") privacyModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent scroll
 };

 const closeModal = () => {
  overlay.classList.add("hidden");
  overlay.classList.remove("flex");
  contactModal.classList.add("hidden");
  privacyModal.classList.add("hidden");
  document.body.style.overflow = "";
 };

 document.getElementById("open-contact").onclick = (e) => {
  e.preventDefault();
  openModal("contact");
 };
 document.getElementById("open-privacy").onclick = (e) => {
  e.preventDefault();
  openModal("privacy");
 };

 document
  .querySelectorAll(".close-modal")
  .forEach((btn) => (btn.onclick = closeModal));
 overlay.onclick = (e) => {
  if (e.target === overlay) closeModal();
 };

 // --- Validation Logic ---
 const inputs = contactForm.querySelectorAll("input:not(#hp_field), textarea");

 const validateField = (field) => {
  let isValid = field.checkValidity();
  const value = field.value.trim();

  if (field.name === "name") {
   isValid = isValid && value.length >= 4;
  }

  if (field.name === "message") {
   isValid = isValid && value.length >= 10;
  }

  // Custom email regex check for better accuracy
  if (field.type === "email") {
   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   isValid = re.test(field.value);
  }

  if (isValid && value !== "") {
   field.classList.remove("border-gray-200", "border-red-500");
   field.classList.add("border-green-500");
  } else {
   field.classList.remove("border-gray-200", "border-green-500");
   field.classList.add("border-red-500");
  }
  return isValid;
 };

 inputs.forEach((input) => {
  input.addEventListener("input", () => validateField(input));
  input.addEventListener("blur", () => validateField(input));
 });

 // --- Form Submission ---
 contactForm.onsubmit = async (e) => {
  e.preventDefault();

  // Honeypot check
  const isBot = document.getElementById("hp_field").value !== "";
  if (isBot) return; // Silent fail for bots

  let formValid = true;
  inputs.forEach((input) => {
   if (!validateField(input)) formValid = false;
  });

  if (!formValid) return;

  submitBtn.disabled = true;
  btnSpinner.classList.remove("hidden");
  btnText.textContent = "Sending...";

  const name = contactForm.elements.name?.value.trim();
  const email = contactForm.elements.email?.value.trim();
  const message = contactForm.elements.message?.value.trim();

  try {
   if (window.FirebaseService && window.FirebaseService.sendContactMessage) {
    await window.FirebaseService.sendContactMessage({ name, email, message });
   } else {
    // Fallback: simulate latency when Firebase isn't available
    await new Promise((resolve) => setTimeout(resolve, 1500));
   }

   // Transition to Success Message
   contactForm.classList.add("hidden");
   successMsg.classList.remove("hidden");

   // Close modal after 5 seconds
   setTimeout(() => {
    closeModal();
    setTimeout(() => {
     contactForm.reset();
     contactForm.classList.remove("hidden");
     successMsg.classList.add("hidden");
     inputs.forEach((i) =>
      i.classList.remove("border-green-500", "border-red-500"),
     );
    }, 500);
   }, 5000);
  } catch (err) {
   // eslint-disable-next-line no-console
   console.error(err);
   alert("Something went wrong. Please try again later.");
  } finally {
   submitBtn.disabled = false;
   submitBtn.classList.remove("opacity-80", "cursor-not-allowed");
   btnText.textContent = "Send Message";
   btnSpinner.classList.add("hidden");
  }
 };
}
