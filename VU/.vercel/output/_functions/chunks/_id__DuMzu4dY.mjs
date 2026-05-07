import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { l as renderHead, o as renderSlot, r as renderTemplate, n as renderComponent } from './entrypoint_Bdv9jed8.mjs';
import 'clsx';
/* empty css                 */

const $$ExamLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ExamLayout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Victoria University Exam System"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><title>${title} | VU Online Exam</title>${renderHead()}</head> <body class="bg-[#f4f7f6] text-slate-900 font-sans antialiased min-h-screen flex flex-col"> <!-- Secure Header --> <header class="bg-[#2c6fb7] text-white py-3 px-6 flex justify-between items-center shadow-md sticky top-0 z-50"> <div class="flex items-center gap-4"> <div class="bg-white p-1 rounded-md h-10 w-10 flex items-center justify-center"> <img src="/vu-logo.png" alt="VU Logo" class="h-8 object-contain"> </div> <div class="flex flex-col"> <span class="font-bold text-[15px] leading-tight tracking-wide">${title}</span> <span class="text-blue-200 text-[11px] font-medium tracking-wider uppercase">Official Examination Environment</span> </div> </div> <div class="flex items-center gap-4 text-sm font-bold"> <div class="flex items-center gap-2 bg-red-600/20 text-red-50 px-3 py-1.5 rounded-full border border-red-500/30"> <div class="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]"></div> <span class="tracking-wide text-xs">PROCTORING ACTIVE</span> </div> </div> </header> <main class="flex-1 w-full max-w-[1500px] mx-auto overflow-hidden p-6 py-8"> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/Users/apple/vu-exam-system/VU/src/layouts/ExamLayout.astro", void 0);

function getStaticPaths() {
  return [
    { params: { id: "COMP301" } },
    { params: { id: "DBMS201" } },
    { params: { id: "SWE402" } }
  ];
}
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const examId = id || "COMP301";
  return renderTemplate`${renderComponent($$result, "ExamLayout", $$ExamLayout, { "title": `${examId} - Final Examination` }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "ExamInterface", null, { "client:only": "react", "examId": examId, "client:component-hydration": "only", "client:component-path": "/Users/apple/vu-exam-system/VU/src/components/exam/ExamInterface", "client:component-export": "default" })} ` })}`;
}, "/Users/apple/vu-exam-system/VU/src/pages/exam/[id].astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/exam/[id].astro";
const $$url = "/exam/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
