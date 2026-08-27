const leftLinks = [
 {
  cat: "Pages",
  links: [{ link: "Home", link_url: "/" }],
 },
 {
  cat: "Routes",
  links: [
   {
    link: "Pedal to Israel",
    link_url: "/blog/israel.html",
   },
  ],
 },
 {
  cat: "India",
  links: [
   { link: "Packing List", link_url: "/packing-list/" },
   { link: "Navigating Delhi by Cycle", link_url: "/delhi/" },
   { link: "Lost in India", link_url: "/delhi-agra/" },
   { link: "In Conclusion", link_url: "/conclusion/" },
  ],
 },
];

const rightLinks = [
 {
  cat: "Safety",
  links: [
   {
    link: "Winter Hill Walking Safety",
    link_url: "/blog/winter-hill-walking-saftey.html",
   },
   {
    link: "Navigation Skills for Hill Walkers",
    link_url: "/blog/navigation-skills-for-hill-walkers.html",
   },
  ],
 },
 {
  cat: "Advanced",
  links: [
   {
    link: "Planning Your First Multi-Day Trek",
    link_url: "/blog/planning-your-first-multi-day-trek.html",
   },
   { link: "About Walking", link_url: "/blog/about.html" },
  ],
 },
];

const leftNav = document.getElementById("left-nav");
const rightNav = document.getElementById("right-nav");

function renderMenu(data, container) {
 data.forEach((group) => {
  // Create the Category Title
  let html = `
            <div mb-4>
                <h3 class="text-blue-500 uppercase tracking-[0.3em] text-sm font-bold mb-4 opacity-60">
                    ${group.cat}
                </h3>
                <ul class="space-y-6">`;

  // Loop through the links in this category
  group.links.forEach((item) => {
   html += `
                <li class="nav-item js-magnetic">
                    <a href="${item.link_url}" class="text-white text-3xl leading-snug md:text-4xl font-medium hover:text-blue-400 transition-colors tracking-tight">
                        ${item.link}
                    </a>
                </li>`;
  });

  html += `</ul></div>`;
  container.innerHTML += html;
 });
}

// Run the function for both sides
renderMenu(leftLinks, leftNav);
renderMenu(rightLinks, rightNav);

//magnetic links
document.addEventListener("DOMContentLoaded", () => {
 const magneticItems = document.querySelectorAll(".js-magnetic");

 magneticItems.forEach((item) => {
  // 1. Handle Mouse Move
  item.addEventListener("mousemove", (e) => {
   const rect = item.getBoundingClientRect();

   // Calculate center of the specific element
   const centerX = rect.left + rect.width / 2;
   const centerY = rect.top + rect.height / 2;

   // Calculate distance from mouse to center
   const deltaX = e.clientX - centerX;
   const deltaY = e.clientY - centerY;

   // Move the element (30% of the distance)
   item.style.transform = `translate(${deltaX * 0.2}px, ${deltaY * 0.2}px)`;
  });

  // 2. Handle Mouse Leave
  item.addEventListener("mouseleave", () => {
   item.style.transform = "translate(0px, 0px)";
  });
 });
});
