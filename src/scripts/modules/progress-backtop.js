/* --- Scroll Effects back top progress bar --- */
export const initScrolls = () => {
 window.addEventListener("scroll", () => {
  const scrollTotal =
   document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = scrollTotal > 0 ? window.scrollY / scrollTotal : 0;

  // Top Bar
  document.getElementById("top-progress-bar").style.width =
   scrollPercent * 100 + "%";

  // Progress Ring
  const ring = document.getElementById("progress-ring");
  const circum = 22 * 2 * Math.PI;
  ring.style.strokeDashoffset = circum - scrollPercent * circum;

  // Back to Top Visibility
  const btt = document.getElementById("back-to-top");
  if (window.scrollY > 300) {
   btt.classList.remove("invisible", "opacity-0");
   btt.classList.add("visible", "opacity-100");
  } else {
   btt.classList.add("invisible", "opacity-0");
   btt.classList.remove("visible", "opacity-100");
  }
 });
};
