import fs from "fs-extra";
import glob from "fast-glob";
import matter from "gray-matter";
import { Marked } from "marked";
import Handlebars from "handlebars";
import path from "path";

// Initialize a custom Marked instance with an image renderer extension
const marked = new Marked({
 renderer: {
  image({ href, title, text }) {
   if (text) {
    return `
          <figure class="my-8">
            <img src="${href}" alt="${text}" ${title ? `title="${title}"` : ""} class="w-full rounded-lg shadow-sm" />
            <figcaption class="mt-3 text-center text-sm text-var(--text-color) italic">${text}</figcaption>
          </figure>
        `.trim();
   }
   return `<img src="${href}" ${title ? `title="${title}"` : ""} class="w-full rounded-lg my-8" />`;
  },

  blockquote(token) {
   // 1. Safely extract rendered HTML string across different Marked versions
   // (In marked v12+, token is an object containing 'text' or 'raw')
   let bodyHtml = "";

   if (typeof token === "string") {
    bodyHtml = token;
   } else if (token && token.text) {
    // Parse inner tokens to HTML if text is unparsed, or use text directly
    bodyHtml = this.parser.parse(token.tokens || []);
   } else if (token && token.raw) {
    bodyHtml = token.raw;
   }

   const rawText = bodyHtml.trim();

   // 2. Match [!NOTE], [!WARNING], [!TIP], [!INFO] (handles <p> wrapper or raw text)
   const calloutRegex =
    /^(?:<p>)?\s*\[!(NOTE|WARNING|TIP|INFO)\]\s*(?:<br\s*\/?>)?\s*/i;
   const match = rawText.match(calloutRegex);

   if (match) {
    const type = match[1].toUpperCase();

    // Strip out [!NOTE] tag while keeping the rest of the text intact
    let content = rawText.replace(calloutRegex, "");
    if (!content.startsWith("<p>")) {
     content = `<p>${content}`;
    }

    const styles = {
     NOTE: "bg-blue-50 border-blue-500 text-blue-900",
     INFO: "bg-slate-100 border-slate-500 text-slate-900",
     WARNING: "bg-amber-50 border-amber-500 text-amber-900",
     TIP: "bg-emerald-50 border-emerald-500 text-emerald-900",
    };

    const styleClass = styles[type] || styles.NOTE;

    return `
          <div class="my-10 p-4 border-l-4 rounded-r-lg ${styleClass} not-prose">
            <div class="font-bold text-xs uppercase tracking-wider mb-1">${type}</div>
            <div class="text-sm leading-relaxed">${content}</div>
          </div>
        `.trim();
   }

   // Default standard blockquote fallback
   return `<blockquote class="border-l-4 border-slate-300 pl-4 my-10 italic text-var(--text-color)">${bodyHtml}</blockquote>`;
  },
 },
});

// Register Handlebars Partials dynamically
async function registerPartials() {
 const partialFiles = await glob("src/partials/*.hbs");
 for (const file of partialFiles) {
  const partialName = path.basename(file, ".hbs");
  const partialContent = await fs.readFile(file, "utf-8");
  Handlebars.registerPartial(partialName, partialContent);
 }
}

function formatDate(dateString) {
 if (!dateString) return "";
 const [year, month, day] = String(dateString).split("-").map(Number);
 const date = new Date(year, month - 1, day);
 return date.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
 });
}

async function prepareThumb(thumb) {
 if (!thumb || !thumb.startsWith("/src/assets/images/")) return thumb;

 const sourcePath = path.resolve(process.cwd(), thumb.slice(1));
 const filename = path.basename(sourcePath);
 const destinationPath = path.resolve(process.cwd(), "public/assets", filename);

 if (await fs.pathExists(sourcePath)) {
  await fs.copy(sourcePath, destinationPath);
  return `/assets/${filename}`;
 }

 return thumb;
}

async function generatePosts() {
 // Register partials first
 await registerPartials();

 const layoutSource = await fs.readFile("src/layouts/post.hbs", "utf-8");
 const template = Handlebars.compile(layoutSource);
 const files = await glob("src/content/*.md");

 const postsIndex = [];

 for (const file of files) {
  const rawContent = await fs.readFile(file, "utf-8");
  const { data: frontmatter, content } = matter(rawContent);
  const htmlContent = marked.parse(content);

  const formattedDate = formatDate(frontmatter.date);
  const description = frontmatter.description || frontmatter.excerpt || "";
  const thumb = await prepareThumb(
   frontmatter.thumb ||
    frontmatter.image ||
    "/src/assets/images/india-header-small.webp",
  );

  // Skip draft or test posts
  if (frontmatter.draft === true) {
   continue;
  }

  const finalHtml = template({
   ...frontmatter,
   description,
   image: frontmatter.image,
   thumb,
   formattedDate,
   body: htmlContent,
  });

  await fs.outputFile(`src/pages/${frontmatter.slug}/index.html`, finalHtml);

  postsIndex.push({
   title: frontmatter.title || "Untitled",
   date: frontmatter.date || "",
   formattedDate,
   slug: frontmatter.slug,
   excerpt: description,
   image: frontmatter.image || "/src/assets/images/india-header.webp",
   thumb,
   tags: frontmatter.tags || [],
   url: `/${frontmatter.slug}/`,
  });
 }

 postsIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

 await fs.outputJson("public/posts.json", postsIndex, { spaces: 2 });
 await fs.outputJson("src/data/posts.json", postsIndex, { spaces: 2 });
}

generatePosts();
