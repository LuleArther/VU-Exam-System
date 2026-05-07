import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { p as createRenderInstruction, n as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, o as renderSlot } from './entrypoint_Bdv9jed8.mjs';
import { $ as $$Layout } from './Layout_CmWx9byV.mjs';
import { Home, Folder, Video, Clock, BookOpen, FileText, CheckSquare, MessageCircle, LogOut } from 'lucide-react';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

const $$DashboardLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DashboardLayout;
  const { title } = Astro2.props;
  const currentPath = Astro2.url.pathname;
  const navItems = [
    { label: "Home", icon: Home, href: "/dashboard" },
    { label: "My Modules", icon: Folder, href: "#" },
    { label: "Lectures", icon: Video, href: "#" },
    { label: "My Timetable", icon: Clock, href: "#" },
    { label: "Exams & Assessments", icon: BookOpen, href: "/exams" },
    { label: "Financial Statements", icon: FileText, href: "#" },
    { label: "VU Elections", icon: CheckSquare, href: "#" },
    { label: "Chats / Inquiries", icon: MessageCircle, href: "#" }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex h-screen bg-[#f9fafb] overflow-hidden font-sans"> <!-- Sidebar --> <aside class="w-[260px] bg-[#f4f7f6] border-r border-slate-200 hidden md:flex flex-col flex-shrink-0"> <div class="p-6 flex items-center justify-center"> <!-- Logo --> <a href="/dashboard"> <img src="/vu-logo.png" alt="Victoria University" class="h-[75px] object-contain"> </a> </div> <nav class="flex-1 mt-6 px-4 space-y-1 overflow-y-auto"> ${navItems.map((item) => {
    const isActive = currentPath === item.href || currentPath === "/" && item.href === "/dashboard";
    return renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute(`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-semibold transition-colors ${isActive ? "text-[#2c6fb7] bg-blue-50 relative" : "text-slate-600 hover:text-[#2c6fb7] hover:bg-white"}`, "class")}> ${isActive && renderTemplate`<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-md"></div>`} ${renderComponent($$result2, "item.icon", item.icon, { "className": `w-[22px] h-[22px] ${isActive ? "text-[#2c6fb7] fill-blue-100" : "text-slate-400"}`, "strokeWidth": 1.5 })} ${item.label} </a>`;
  })} </nav> <div class="px-4 py-6 border-t border-slate-200"> <button id="signout-button" class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-semibold text-red-600 hover:bg-red-50 transition-colors"> ${renderComponent($$result2, "LogOut", LogOut, { "className": "w-[22px] h-[22px]", "strokeWidth": 1.5 })}
Sign Out
</button> </div> </aside> <!-- Main Content Wrapper --> <div class="flex-1 flex flex-col h-screen overflow-hidden"> <!-- Top header --> <header class="bg-[#f9fafb] py-6 px-10 flex justify-between items-center z-10"> <div class="text-[15px] flex items-center"> <span id="header-student-name" class="font-bold text-slate-800 text-[17px] tracking-tight">Student</span> <span class="text-slate-300 mx-3">|</span> <span id="header-student-reg" class="text-slate-500 text-sm">VU-BIT-STUDENT &bull; VClass Student</span> </div> </header> <!-- Scrollable Main Content --> <main class="flex-1 overflow-y-auto px-10 pb-10"> ${renderSlot($$result2, $$slots["default"])} </main> </div> </div> ` })} ${renderScript($$result, "/Users/apple/vu-exam-system/VU/src/layouts/DashboardLayout.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/apple/vu-exam-system/VU/src/layouts/DashboardLayout.astro", void 0);

export { $$DashboardLayout as $, renderScript as r };
