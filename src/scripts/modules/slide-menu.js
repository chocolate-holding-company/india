export const initSlideMenu = () => {
 const menuBtn = document.getElementById("menu-btn");
 const fullMenu = document.getElementById("full-menu");
 const hamburgerIcon = document.getElementById("hamburger-icon");
 const closeIcon = document.getElementById("close-icon");
 const navItems = document.querySelectorAll(".nav-item");

 //make the button disappear/appear on-scroll
 let lastScrollY = window.scrollY;

 window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;

  if (currentScrollY > lastScrollY && currentScrollY > 50) {
   // Scrolling Down - Hide
   menuBtn.classList.replace("opacity-100", "opacity-0");
   menuBtn.classList.add("pointer-events-none");
  } else {
   // Scrolling Up - Show
   menuBtn.classList.replace("opacity-0", "opacity-100");
   menuBtn.classList.remove("pointer-events-none");
  }

  lastScrollY = currentScrollY;
 });

 menuBtn.addEventListener("click", () => {
  const isOpening = fullMenu.classList.contains("translate-x-full");

  if (isOpening) {
   // OPENING SEQUENCE
   fullMenu.classList.remove("translate-x-full", "opacity-0");
   fullMenu.classList.add("translate-x-0", "opacity-100");

   hamburgerIcon.classList.add("hidden");
   closeIcon.classList.remove("hidden");
   document.body.style.overflow = "hidden";

   // Stagger the items appearing
   navItems.forEach((item, index) => {
    setTimeout(
     () => {
      item.classList.add("show");
     },
     200 + index * 100,
    ); // 200ms delay to start, then 100ms per item
   });
  } else {
   // CLOSING SEQUENCE
   fullMenu.classList.add("translate-x-full", "opacity-0");
   fullMenu.classList.remove("translate-x-0", "opacity-100");

   hamburgerIcon.classList.remove("hidden");
   closeIcon.classList.add("hidden");
   document.body.style.overflow = "";

   // Instantly reset items for the next time it opens
   navItems.forEach((item) => item.classList.remove("show"));
  }
 });
};
