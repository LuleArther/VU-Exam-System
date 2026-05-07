import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { m as maybeRenderHead, h as addAttribute, r as renderTemplate, n as renderComponent } from './entrypoint_Bdv9jed8.mjs';
import { $ as $$DashboardLayout } from './DashboardLayout_DRAxtwf6.mjs';
import { FileText, Calendar, Clock, ChevronRight, CheckCircle2, Search } from 'lucide-react';

const $$ExamCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ExamCard;
  const { title, courseCode, date, duration, status, id } = Astro2.props;
  const statusStyles = {
    upcoming: "bg-slate-100 text-slate-800 border-slate-200",
    active: "bg-green-50 text-green-700 border-green-200 ring-1 ring-green-500",
    completed: "bg-slate-50 text-slate-500 border-slate-200 opacity-75"
  };
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${statusStyles[status]}`, "class")}> <div class="flex justify-between items-start mb-4"> <div> <div class="flex items-center space-x-2 mb-1"> <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800"> ${courseCode} </span> ${status === "active" && renderTemplate`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 animate-pulse">
Live Now
</span>`} </div> <h3 class="text-lg font-bold text-slate-900 border-none m-0 p-0 leading-tight">${title}</h3> </div> <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600"> ${renderComponent($$result, "FileText", FileText, { "className": "w-5 h-5" })} </div> </div> <div class="space-y-2 mb-6"> <div class="flex items-center text-sm text-slate-600"> ${renderComponent($$result, "Calendar", Calendar, { "className": "w-4 h-4 mr-2 text-slate-400" })} <span>${date}</span> </div> <div class="flex items-center text-sm text-slate-600"> ${renderComponent($$result, "Clock", Clock, { "className": "w-4 h-4 mr-2 text-slate-400" })} <span>${duration}</span> </div> </div> <div class="pt-4 border-t border-slate-100"> ${status === "active" ? renderTemplate`<a${addAttribute(`/verify/${id}`, "href")} class="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
Enter Exam
${renderComponent($$result, "ChevronRight", ChevronRight, { "className": "w-4 h-4 ml-1" })} </a>` : status === "upcoming" ? renderTemplate`<button disabled class="w-full inline-flex justify-center items-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed">
Waiting to Start
</button>` : renderTemplate`<div class="w-full inline-flex justify-center items-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-slate-50"> ${renderComponent($$result, "CheckCircle2", CheckCircle2, { "className": "w-4 h-4 mr-2 text-green-500" })}
Completed
</div>`} </div> </div>`;
}, "/Users/apple/vu-exam-system/VU/src/components/ui/ExamCard.astro", void 0);

const $$Exams = createComponent(($$result, $$props, $$slots) => {
  const exams = [
    {
      id: "COMP301",
      title: "Advanced Database Systems",
      courseCode: "COMP301",
      date: "Today, 10:00 AM",
      duration: "2 Hours",
      status: "active"
    },
    {
      id: "SE402",
      title: "Software Architecture",
      courseCode: "SE402",
      date: "Tomorrow, 02:00 PM",
      duration: "3 Hours",
      status: "upcoming"
    },
    {
      id: "NET201",
      title: "Computer Networks",
      courseCode: "NET201",
      date: "March 24, 2026",
      duration: "1.5 Hours",
      status: "completed"
    }
  ];
  return renderTemplate`${renderComponent($$result, "DashboardLayout", $$DashboardLayout, { "title": "Exams & Assessments" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[1200px] mx-auto w-full pb-10"> <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4"> <div> <h1 class="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Exams & Assessments</h1> <p class="text-slate-500 mt-1 font-medium">View and manage your upcoming university exams.</p> </div> <div class="relative max-w-sm w-full"> <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"> ${renderComponent($$result2, "Search", Search, { "className": "h-4 w-4 text-slate-400" })} </div> <input type="text" class="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#2c6fb7] focus:ring-1 focus:ring-[#2c6fb7] bg-white shadow-sm" placeholder="Search for an exam..."> </div> </div> <div class="space-y-10"> <section id="active-exams"> <h2 class="text-[17px] font-bold text-[#2c6fb7] mb-5 pb-3 border-b border-slate-200">Live & Upcoming</h2> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> ${exams.filter((e) => e.status !== "completed").map((exam) => renderTemplate`${renderComponent($$result2, "ExamCard", $$ExamCard, { ...exam })}`)} </div> </section> <section> <h2 class="text-[17px] font-bold text-[#2c6fb7] mb-5 pb-3 border-b border-slate-200">Past Examinations</h2> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> ${exams.filter((e) => e.status === "completed").map((exam) => renderTemplate`${renderComponent($$result2, "ExamCard", $$ExamCard, { ...exam })}`)} </div> </section> </div> </div> ` })}`;
}, "/Users/apple/vu-exam-system/VU/src/pages/exams.astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/exams.astro";
const $$url = "/exams";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Exams,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
