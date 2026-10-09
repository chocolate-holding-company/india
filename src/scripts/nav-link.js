const leftLinks = [
 {
  cat: "Pages",
  links: [
   { link: "Home", link_url: "/" },
   { link: "Packing List for Cycling India", link_url: "/packing-list/" },
   { link: "India - Trip Conclusion", link_url: "/conclusion/" },
  ],
 },
 {
  cat: "North India",
  links: [
   { link: "Navigating Delhi by Cycle", link_url: "/delhi/" },
   { link: "Delhi to Agra - Lost in India", link_url: "/delhi-agra/" },
   { link: "Agra and More", link_url: "/agra-more/" },
   { link: "Kota to Mumbai Second Class", link_url: "/kota-mumbia/" },
  ],
 },
];

const rightLinks = [
 {
  cat: "West Coast",
  links: [{ link: "Kota to Mumbai Second Class", link_url: "/kota-mumbia/" }],
 },
];

const leftNav = document.getElementById("left-nav");
const rightNav = document.getElementById("right-nav");

function renderMenu(data, container) {
 data.forEach((group) => {
  // Create the Category Title
  let html = `
            <div mb-2>
                <h3 class="text-blue-300 uppercase tracking-[0.6em] text-sm font-bold mb-4 opacity-80">
                    ${group.cat}
                </h3>
                <ul class="space-y-2 md:space-y-4">`;

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
