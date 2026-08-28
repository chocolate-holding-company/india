export function initNewsComments() {
 // --- Helpers ---
 const postId =
  (window.FirebaseService &&
   window.FirebaseService.getPostIdFromPath &&
   window.FirebaseService.getPostIdFromPath()) ||
  "unknown";

 const formatDate = (comment) => {
  if (comment.formattedDate) return comment.formattedDate;
  if (comment.date) return comment.date;
  return "";
 };

 const getPendingStorageKey = () => `pendingComments_${postId}`;

 const loadPendingComments = () => {
  const raw = window.localStorage.getItem(getPendingStorageKey());
  if (!raw) return [];
  try {
   return JSON.parse(raw) || [];
  } catch (err) {
   console.error("Failed to parse pending comments from localStorage", err);
   return [];
  }
 };

 const savePendingComments = (pending) => {
  window.localStorage.setItem(getPendingStorageKey(), JSON.stringify(pending));
 };

 const mergePendingIntoComments = () => {
  const pending = loadPendingComments();
  const filtered = pending.filter(
   (p) =>
    !comments.some(
     (c) =>
      c.name === p.name &&
      c.text === p.text &&
      (c.parentId || null) === (p.parentId || null),
    ),
  );
  if (filtered.length) comments.push(...filtered);
 };

 const showCommentSuccess = (message) => {
  const success = document.getElementById("comment-success");
  if (!success) return;
  const original = success.textContent;
  success.textContent = message;
  success.classList.remove("hidden");
  setTimeout(() => {
   success.classList.add("hidden");
   success.textContent = original;
  }, 5000);
 };

 const showCommentError = (message) => {
  const errorEl = document.getElementById("comment-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  setTimeout(() => {
   errorEl.classList.add("hidden");
  }, 10000);
 };

 const addPendingComment = (comment) => {
  const pending = loadPendingComments();
  pending.push(comment);
  savePendingComments(pending);
  comments.push(comment);
  renderComments();
 };

 // 1. FORM VALIDATION ENGINE (Reusable)
 const setupValidation = (formId, successId, onSuccess) => {
  const form = document.getElementById(formId);
  const success = successId ? document.getElementById(successId) : null;
  const inputs = form.querySelectorAll(
   'input:not([class*="hidden"]), textarea',
  );

  const validate = (field) => {
   let isValid = field.checkValidity();
   if (field.type === "email")
    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

   field.classList.toggle("border-green-500", isValid && field.value !== "");
   field.classList.toggle("border-red-500", !isValid && field.value !== "");
   return isValid;
  };

  inputs.forEach((input) =>
   input.addEventListener("input", () => validate(input)),
  );

  form.onsubmit = async (e) => {
   e.preventDefault();

   // Honeypot check
   const hp = form.querySelector(".hidden");
   if (hp && hp.value !== "") return;

   let allValid = true;
   inputs.forEach((i) => {
    if (!validate(i)) allValid = false;
   });

   if (!allValid) return;

   form.classList.add("opacity-50", "pointer-events-none");

   try {
    if (onSuccess) {
     const formData = new FormData(form);
     await onSuccess(formData);
    }

    form.reset();

    if (success) {
     success.classList.remove("hidden");
     setTimeout(() => success.classList.add("hidden"), 5000);
    }
   } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
   } finally {
    form.classList.remove("opacity-50", "pointer-events-none");
    // Reset borders
    inputs.forEach((i) =>
     i.classList.remove("border-green-500", "border-red-500"),
    );
   }
  };
 };

 // 2. COMMENTS LOGIC
 const comments = [
  {
   name: "Jack Wilson",
   date: "2 days ago",
   text: "Great guide! Really helped me prepare for my first hike.",
   reply: "Thanks Jack! Glad you found it useful.",
  },
  {
   name: "Emma Reed",
   date: "5 days ago",
   text: "Do you have recommendations for specific boots for this route?",
   reply: null,
  },
 ];

 const renderComments = () => {
  const list = document.getElementById("comment-list");
  const countEl = document.getElementById("comment-count");
  if (!list || !countEl) return;

  const approved = (comments || []).filter((c) => c && c.isApproved !== false);
  if (approved.length === 0) {
   countEl.textContent = "0";
   list.innerHTML =
    '<p class="text-center text-gray-500 py-10">No comments yet. Be the first to comment!</p>';
   return;
  }

  // Build lookup map so we can nest replies under their parent comment.
  const byId = new Map();
  approved.forEach((c) => {
   byId.set(c.id, { ...c, replies: [] });
  });

  const roots = [];
  byId.forEach((comment) => {
   if (comment.parentId && byId.has(comment.parentId)) {
    byId.get(comment.parentId).replies.push(comment);
   } else {
    roots.push(comment);
   }
  });

  // Only count top-level comments to avoid inflating count by replies.
  countEl.textContent = String(roots.length);

  // const roots = [];
  // byId.forEach((comment) => {
  //  if (comment.parentId && byId.has(comment.parentId)) {
  //   byId.get(comment.parentId).replies.push(comment);
  //  } else {
  //   roots.push(comment);
  //  }
  // });

  const sortByDateDesc = (a, b) => {
   const aTime = a.createdAt?.seconds
    ? a.createdAt.seconds * 1000
    : Date.parse(a.createdAt || "") || 0;
   const bTime = b.createdAt?.seconds
    ? b.createdAt.seconds * 1000
    : Date.parse(b.createdAt || "") || 0;
   return bTime - aTime;
  };

  const renderCommentItem = (c, depth = 0) => {
   const isChild = depth > 0;
   const indent = depth === 0 ? "" : `ml-8 md:ml-12`;
   const avatar = c.name ? c.name.charAt(0) : "?";
   const replyFormId = `reply-form-${c.id}`;

   // Only allow replies to top-level comments
   const canReply = depth === 0;

   // Apply a shaded box and border for replies (depth > 0)
   const wrapperClass = isChild
    ? `border border-red-100 bg-red-50/30 rounded-xl p-4 mt-2 mb-2`
    : `border-b border-gray-200 pb-6 last:border-0`;

   return `
    <div class="${wrapperClass} ${indent}" data-comment-id="${c.id}">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
          ${avatar}
        </div>
        <div>
          <h5 class="font-bold text-sm text-gray-900">${c.name}</h5>
          <p class="text-[10px] text-gray-500 uppercase tracking-widest">
            ${formatDate(c)}
            ${c.pending ? '<span class="text-orange-600 ml-2 font-semibold">(Awaiting moderation)</span>' : ""}
          </p>
        </div>
      </div>

      <p class="text-gray-700 text-base mb-4 ${depth === 0 ? "ml-13" : "ml-0"}">${c.text}</p>

      ${
       c.reply
        ? `
        <div class="mt-4 mb-4 p-4 bg-white/80 rounded-lg border-l-4 border-brand shadow-sm ${depth === 0 ? "ml-13" : "ml-0"}">
          <h6 class="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Author Response</h6>
          <p class="text-sm text-gray-800">"${c.reply}"</p>
        </div>
      `
        : ""
      }

      ${
       canReply
        ? `
        <div class="mb-6">
          <button
            class="ml-13 text-xs font-bold text-brand hover:underline comment-reply-btn"
            data-comment-id="${c.id}"
            data-reply-form-id="${replyFormId}"
          >
            Reply
          </button>
        </div>

        <div id="${replyFormId}" class="hidden mt-4 ml-13">
          <div class="grid grid-cols-1 gap-3">
            <input type="text" placeholder="Your name" class="input-field reply-name" />
          </div>
          <textarea rows="3" placeholder="Write your reply..." class="w-full input-field mt-3 reply-text"></textarea>
          <div class="flex gap-2 mt-2">
            <button class="btn-primary px-4 py-2 reply-submit" type="button">Submit</button>
            <button class="btn-secondary px-4 py-2 reply-cancel" type="button">Cancel</button>
          </div>
        </div>
      `
        : ""
      }

      ${(c.replies || [])
       .sort(sortByDateDesc)
       .map((reply) => renderCommentItem(reply, depth + 1))
       .join("")}
    </div>
  `;
  };

  list.innerHTML = roots
   .sort(sortByDateDesc)
   .map((c) => renderCommentItem(c))
   .join("");

  // Attach reply handlers after rendering
  attachReplyHandlers();
 };

 const attachReplyHandlers = () => {
  const buttons = document.querySelectorAll(".comment-reply-btn");
  buttons.forEach((btn) => {
   const formId = btn.dataset.replyFormId;
   const formEl = formId ? document.getElementById(formId) : null;
   if (!formEl) return;

   const nameInput = formEl.querySelector(".reply-name");
   const textInput = formEl.querySelector(".reply-text");
   const submitBtn = formEl.querySelector(".reply-submit");
   const cancelBtn = formEl.querySelector(".reply-cancel");

   const showForm = () => {
    formEl.classList.remove("hidden");
    nameInput?.focus();
   };

   const hideForm = () => {
    formEl.classList.add("hidden");
   };

   btn.addEventListener("click", () => {
    if (formEl.classList.contains("hidden")) {
     showForm();
    } else {
     hideForm();
    }
   });

   cancelBtn?.addEventListener("click", () => {
    hideForm();
   });

   submitBtn?.addEventListener("click", async () => {
    const parentId = btn.dataset.commentId;
    const name = String(nameInput?.value || "").trim();
    const text = String(textInput?.value || "").trim();

    if (!parentId) {
     alert("Unable to identify which comment you are replying to.");
     return;
    }

    if (!name || !text) {
     alert("Name and reply text are required.");
     return;
    }

    if (!window.FirebaseService || !window.FirebaseService.addComment) {
     alert("Unable to save reply right now.");
     return;
    }

    try {
     submitBtn.disabled = true;
     await window.FirebaseService.addComment({
      postId,
      parentId,
      name,
      text,
     });

     // Show a clear success message and keep the reply visible until moderation.
     showCommentSuccess(
      "✓ Your reply is awaiting moderation and will appear once approved.",
     );

     addPendingComment({
      id: `pending-${Date.now()}`,
      name,
      text,
      parentId,
      date: new Date().toISOString(),
      pending: true,
     });

     nameInput.value = "";
     textInput.value = "";
     hideForm();
    } catch (err) {
     // eslint-disable-next-line no-console
     console.error(err);
     alert(`Unable to save reply: ${err.message || err}`);
    } finally {
     submitBtn.disabled = false;
    }
   });
  });
 };

 let commentLoadError = null;

 const initComments = () => {
  const renderFallback = () => {
   mergePendingIntoComments();
   renderComments();
  };

  if (
   window.FirebaseService &&
   typeof window.FirebaseService.listenForComments === "function"
  ) {
   try {
    // Show any pending comments immediately while remote loads.
    renderFallback();

    window.FirebaseService.listenForComments(
     postId,
     (remoteComments) => {
      if (Array.isArray(remoteComments)) {
       comments.length = 0;
       comments.push(...remoteComments);
      } else {
       console.warn(
        "listenForComments returned unexpected data",
        remoteComments,
       );
      }

      mergePendingIntoComments();
      renderComments();
     },
     (err) => {
      commentLoadError = err;
      console.error("Failed to load comments", err);
      showCommentError(
       "Unable to load comments due to permissions. Please check Firebase rules.",
      );
     },
    );
   } catch (err) {
    console.error("Failed to load comments", err);
    renderFallback();
   }
  } else {
   renderFallback();
  }
 };

 setupValidation("newsletter-form", "newsletter-success", async (formData) => {
  const email = formData.get("email");
  if (!email) return;
  if (window.FirebaseService && window.FirebaseService.subscribeNewsletter) {
   await window.FirebaseService.subscribeNewsletter(email);
  }
 });

 setupValidation("comment-form", "comment-success", async (formData) => {
  const name = formData.get("name");
  const text = formData.get("comment") || formData.get("text") || "";

  if (!name || !text) return;

  if (window.FirebaseService && window.FirebaseService.addComment) {
   await window.FirebaseService.addComment({
    postId,
    name,
    text,
   });

   showCommentSuccess(
    "✓ Your comment is awaiting moderation and will appear once approved.",
   );

   addPendingComment({
    id: `pending-${Date.now()}`,
    name,
    text,
    date: new Date().toISOString(),
    pending: true,
   });
  }
 });

 // Load and render comments (remote + pending) on page load
 initComments();
}
