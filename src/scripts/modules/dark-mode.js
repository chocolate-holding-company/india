export function initTheme() {
 const toggle = document.querySelector("#themeToggle");
 const html = document.documentElement;

 if (!toggle) return;

 toggle.addEventListener("click", () => {
  const isDark = html.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  // Optional: Dispatch event if other components need to know
  window.dispatchEvent(new Event("themeChanged"));
 });
}
