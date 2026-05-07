import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { l as renderHead, n as renderComponent, r as renderTemplate } from './entrypoint_Bdv9jed8.mjs';
/* empty css                 */

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Lecturer Monitoring Dashboard - Victoria University</title>${renderHead()}</head> <body class="bg-slate-50"> ${renderComponent($$result, "LecturerDashboard", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/apple/vu-exam-system/VU/src/components/admin/LecturerDashboard", "client:component-export": "default" })} </body></html>`;
}, "/Users/apple/vu-exam-system/VU/src/pages/admin/dashboard.astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/admin/dashboard.astro";
const $$url = "/admin/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
