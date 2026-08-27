/* global FirebaseService */

document.addEventListener("DOMContentLoaded", () => {
 const loginForm = document.getElementById("admin-login-form");
 const loginStatus = document.getElementById("admin-login-status");
 const adminLogin = document.getElementById("admin-login");
 const adminPanel = document.getElementById("admin-panel");
 const adminEmail = document.getElementById("admin-email");
 const signOutBtn = document.getElementById("admin-signout");
 const commentsContainer = document.getElementById("admin-comments");
 const postSelectFilter = document.getElementById("post-select-filter");

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
  if (value?.seconds) {
   return new Date(value.seconds * 1000).toLocaleString();
  }
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

 let currentComments = [];
 let allComments = [];
 let commentFilter = "newest";
 let selectedPostFilter = "all"; // State variable tracking selected post

 const applyCommentFilter = (comments) => {
  let list = Array.isArray(comments) ? comments.slice() : [];

  // Step 1: Filter down by dynamic selected post first
  if (selectedPostFilter !== "all") {
   list = list.filter((c) => String(c.postId) === selectedPostFilter);
  }

  const getTime = (c) => {
   const value = c?.createdAt;
   if (!value) return 0;
   if (typeof value.seconds === "number") return value.seconds * 1000;
   if (typeof value.toMillis === "function") return value.toMillis();
   const parsed = Date.parse(value);
   return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortByTime = (a, b) => {
   const aTime = getTime(a);
   const bTime = getTime(b);
   return commentFilter === "oldest" ? aTime - bTime : bTime - aTime;
  };

  // Step 2: Handle Sub-filtering categories
  if (commentFilter === "pending") {
   return list.filter((c) => !c.isApproved).sort(sortByTime);
  }

  return list.sort(sortByTime);
 };

 const setActiveCommentFilterButton = () => {
  const buttons = document.querySelectorAll(".comment-filter-btn");
  buttons.forEach((button) => {
   const filter = button.dataset.commentFilter;
   const isActive = filter === commentFilter;
   if (isActive) {
    button.classList.add("bg-brand", "text-white");
    button.classList.remove("bg-white", "text-gray-700");
   } else {
    button.classList.add("bg-white", "text-gray-700");
    button.classList.remove("bg-brand", "text-white");
   }
  });
 };

 // Populates drop-down items from the unique array of active posts discovered in DB
 const updatePostDropdownOptions = (comments = []) => {
  if (!postSelectFilter) return;

  // Extract clean unique postIds
  const uniquePostIds = [
   ...new Set(comments.map((c) => c.postId).filter(Boolean)),
  ].sort();

  let optionsHtml = '<option value="all">All Posts</option>';
  uniquePostIds.forEach((id) => {
   optionsHtml += `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`;
  });

  postSelectFilter.innerHTML = optionsHtml;
  postSelectFilter.value = selectedPostFilter;
 };

 const initCommentFilters = () => {
  const buttons = document.querySelectorAll(".comment-filter-btn");
  buttons.forEach((button) => {
   button.addEventListener("click", () => {
    const filter = button.dataset.commentFilter;
    if (!filter) return;
    commentFilter = filter;
    setActiveCommentFilterButton();
    renderComments(allComments);
   });
  });
  setActiveCommentFilterButton();

  // Wire drop-down selection handler directly to standard loop execution
  if (postSelectFilter) {
   postSelectFilter.addEventListener("change", (e) => {
    selectedPostFilter = e.target.value;
    renderComments(allComments);
   });
  }
 };

 const renderComments = (comments = []) => {
  currentComments = comments;
  const filtered = applyCommentFilter(comments);
  setActiveCommentFilterButton();

  if (!filtered || filtered.length === 0) {
   setContainerHtml(
    commentsContainer,
    '<p class="text-sm text-gray-500">No comments found matching the selection criteria.</p>',
   );
   return;
  }

  const map = new Map();
  const roots = [];

  filtered.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  map.forEach((comment) => {
   if (comment.parentId && map.has(comment.parentId)) {
    map.get(comment.parentId).replies.push(comment);
   } else {
    roots.push(comment);
   }
  });

  const renderEntry = (comment, isChild = false) => {
   const approved = comment.isApproved ? "Live" : "Pending";
   const statusColor = comment.isApproved ? "text-green-600" : "text-amber-600";

   const borderStyle = isChild
    ? "border-2 border-emerald-100 bg-emerald-50/30 ml-8 md:ml-12 mt-1 mb-4"
    : "border border-gray-200 bg-white mb-6 shadow-sm";

   return `
      <div class="rounded-xl p-5 transition-all ${borderStyle}" data-comment-id="${escapeHtml(comment.id)}">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-900">${escapeHtml(comment.name)}</span>
              ${isChild ? `<span class="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">Reply</span>` : ""}
            </div>
            <div class="text-[10px] font-medium text-blue-600 uppercase tracking-tight mt-1">
              Source Post: <span class="bg-blue-50 px-1 rounded">${escapeHtml(comment.postId)}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-bold text-gray-400">${escapeHtml(formatTimestamp(comment.createdAt))}</span>
            <span class="text-[10px] font-black uppercase ${statusColor}">${approved}</span>
          </div>
        </div>

        <p class="text-sm text-gray-700 leading-relaxed mb-4">${escapeHtml(comment.text)}</p>

        ${
         comment.reply
          ? `
          <div class="mt-2 p-3 bg-slate-800 rounded-lg border-l-4 border-brand">
            <p class="text-[10px] text-brand font-black uppercase mb-1">Your Response</p>
            <p class="text-sm text-slate-200 font-medium italic">"${escapeHtml(comment.reply)}"</p>
          </div>
        `
          : ""
        }

        <div class="mt-4 flex gap-4 border-t border-gray-100 pt-3">
          <button type="button" data-action="toggle-approve" class="text-[11px] font-bold text-gray-600 hover:text-black uppercase">
            ${comment.isApproved ? "Unapprove" : "Approve"}
          </button>
          <button type="button" data-action="reply" class="text-[11px] font-bold text-gray-600 hover:text-brand uppercase">
            ${comment.reply ? "Edit Reply" : "Reply"}
          </button>
          <button type="button" data-action="delete" class="text-[11px] font-bold text-red-400 hover:text-red-700 uppercase ml-auto">
            Delete
          </button>
        </div>

        <div class="mt-4 hidden" data-reply-form>
          <textarea class="w-full text-sm p-3 border rounded-lg focus:ring-2 focus:ring-brand outline-none" rows="3">${escapeHtml(comment.reply || "")}</textarea>
          <div class="flex justify-end gap-2 mt-2">
            <button type="button" data-action="reply-save" class="bg-brand text-white text-[11px] font-bold px-4 py-2 rounded-lg">Save</button>
            <button type="button" data-action="reply-cancel" class="text-gray-500 text-[11px] font-bold px-4 py-2">Cancel</button>
          </div>
        </div>
      </div>
      ${comment.replies.map((r) => renderEntry(r, true)).join("")}
    `;
  };

  const finalHtml = roots.map((root) => renderEntry(root)).join("");
  setContainerHtml(commentsContainer, finalHtml);
  attachCommentActions();
 };

 const attachCommentActions = () => {
  const buttons = commentsContainer.querySelectorAll("[data-action]");
  buttons.forEach((button) => {
   const action = button.dataset.action;
   const commentElement = button.closest("[data-comment-id]");
   if (!commentElement) return;
   const commentId = commentElement.dataset.commentId;

   const handle = async () => {
    const comment = currentComments.find((c) => c.id === commentId);
    if (!comment) return;

    try {
     button.disabled = true;
     if (action === "toggle-approve") {
      await FirebaseService.updateComment(commentId, {
       isApproved: !comment.isApproved,
      });
     } else if (action === "delete") {
      if (!window.confirm("Delete this comment? This cannot be undone."))
       return;
      await FirebaseService.deleteComment(commentId);
     } else if (action === "reply") {
      const form = commentElement.querySelector("[data-reply-form]");
      form?.classList.toggle("hidden");
      return;
     } else if (action === "reply-save") {
      const textarea = commentElement.querySelector("textarea");
      const reply = textarea?.value.trim();
      await FirebaseService.updateComment(commentId, { reply });
     } else if (action === "reply-cancel") {
      const form = commentElement.querySelector("[data-reply-form]");
      form?.classList.add("hidden");
      return;
     }
     await loadAll();
    } catch (error) {
     console.error(error);
     setStatus(String(error.message || error), true);
    } finally {
     button.disabled = false;
    }
   };

   button.addEventListener("click", handle);
  });
 };

 const loadAll = async () => {
  if (!FirebaseService) return;
  setContainerHtml(
   commentsContainer,
   '<p class="text-sm text-gray-500">Loading comments…</p>',
  );

  try {
   // Only call the comments service—contacts/newsletters are isolated to their own views
   const comments = await FirebaseService.getComments({
    includeUnapproved: true,
   });
   allComments = comments;

   // Update the selectable options list and run rendering filters
   updatePostDropdownOptions(allComments);
   renderComments(allComments);
  } catch (error) {
   console.error(error);
   setContainerHtml(
    commentsContainer,
    `<p class="text-sm text-red-600">Error loading data: ${escapeHtml(
     String(error.message || error),
    )}</p>`,
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
     ? "Your account is not configured as an administrator. Update the ALLOWED_ADMINS list in js/admin.js."
     : "Sign in with a Firebase Auth user to access the admin dashboard.",
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

 initCommentFilters();

 if (!window.FirebaseService) {
  setStatus(
   "Firebase is not loaded. Make sure firebase-service.js is included.",
   true,
  );
  return;
 }

 if (typeof FirebaseService.onAuthStateChanged === "function") {
  FirebaseService.onAuthStateChanged(handleAuthChange);
 } else {
  handleAuthChange(FirebaseService.getCurrentUser?.());
 }

 if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
 }

 if (signOutBtn) {
  signOutBtn.addEventListener("click", handleSignOut);
 }
});
