let allPosts = [];
let activeTag = "all";

const gridContainer = document.getElementById("posts-grid");
const filtersContainer = document.getElementById("tag-filters");

async function initGallery() {
 try {
  const response = await fetch("posts.json");
  allPosts = await response.json();

  renderFilterButtons();
  renderPosts();
 } catch (error) {
  gridContainer.innerHTML = `<p class="text-red-500">Failed to load posts.</p>`;
 }
}

// Extract unique tags and build filter buttons
function renderFilterButtons() {
 const tags = new Set();
 allPosts.forEach((post) => {
  if (Array.isArray(post.tags)) {
   post.tags.forEach((tag) => tags.add(tag));
  }
 });

 tags.forEach((tag) => {
  const btn = document.createElement("button");
  btn.dataset.tag = tag;
  btn.className =
   "tag-btn bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-full text-sm font-medium transition";
  btn.textContent = `#${tag}`;
  filtersContainer.appendChild(btn);
 });

 // Attach single event listener using delegation
 filtersContainer.addEventListener("click", (e) => {
  const target = e.target.closest("button");
  if (!target) return;

  activeTag = target.dataset.tag;
  updateButtonStyles();
  renderPosts();
 });
}

// Toggle button active states
function updateButtonStyles() {
 const buttons = filtersContainer.querySelectorAll(".tag-btn");
 buttons.forEach((btn) => {
  if (btn.dataset.tag === activeTag) {
   btn.className =
    "tag-btn bg-slate-900 text-white px-3 py-1.5 rounded-full text-sm font-medium transition";
  } else {
   btn.className =
    "tag-btn bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-full text-sm font-medium transition";
  }
 });
}

//format date
function formatDate(dateString) {
 // Parsing YYYY-MM-DD directly
 const [year, month, day] = dateString.split("-").map(Number);
 const date = new Date(year, month - 1, day);

 return date.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
 }); // Output: "22 Aug 2026"
}

// Render filtered post cards
function renderPosts() {
 const filtered =
  activeTag === "all"
   ? allPosts
   : allPosts.filter((post) => post.tags && post.tags.includes(activeTag));

 if (filtered.length === 0) {
  gridContainer.innerHTML = `<p class="text-slate-500 col-span-2">No posts found for #${activeTag}.</p>`;
  return;
 }

 gridContainer.innerHTML = filtered
  .map(
   (post) => `
    <article class="bg-white w-full rounded-xl border border-slate-200 flex flex-col justify-between overflow-hidden animate-card shadow-sm hover:shadow-md transition-shadow">
<div class="h-60 overflow-hidden">
  <img src="${post.thumb}" alt="${post.title}" class="w-full h-full object-cover">
</div>
      <div class="p-4 mb-2">


        <h3 class="text-xl font-bold mt-2 mb-2 text-slate-900 hover:text-blue-600">
          <a href="${post.url}" class="text-blue-600">${post.title}</a>
        </h3>
        ${post.excerpt ? `<p class="text-slate-600 text-sm leading-relaxed">${post.excerpt}</p>` : ""}
        <div class="flex items-center justify-between border-t-slate-300 border-t-[1px] pt-3 mt-2">
          <time class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${formatDate(post.date)}</time>
          <div class="flex gap-1">
            ${(post.tags || []).map((t) => `<span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">#${t}</span>`).join("")}
          </div>
        </div>
      </div>
    </article>
  `,
  )
  .join("");
}
initGallery();
