import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_Bdv9jed8.mjs';
import { $ as $$Layout } from './Layout_CmWx9byV.mjs';

const $$Register = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Victoria University | Register for VClass" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="flex min-h-screen bg-slate-50"> <!-- Left Panel: Registration Form --> <div class="w-full lg:w-[500px] bg-white flex flex-col relative z-10 shadow-2xl lg:shadow-none"> <div class="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 pt-12 pb-24"> <!-- Logo Area --> <div class="flex flex-col items-center mb-8"> <div class="flex items-center justify-center mb-6"> <img src="/vu-logo.png" alt="Victoria University Kampala Uganda Logo" class="h-[80px] object-contain"> </div> <h1 class="text-[#1a365d] text-[20px] font-bold tracking-wide">VICTORIA UNIVERSITY</h1> <h2 class="text-slate-500 text-[18px] mt-1 font-medium">Create Student Account</h2> </div> ${renderComponent($$result2, "RegistrationForm", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/apple/vu-exam-system/VU/src/components/auth/RegistrationForm", "client:component-export": "default" })} </div> <!-- Online Payments Footer --> <div class="py-6 flex justify-center border-t border-slate-100 mt-auto"> <a href="#" class="text-[#6b9bc2] font-semibold text-[15px] hover:text-[#5a8ab1] transition-colors">
Online Support
</a> </div> </div> <!-- Right Panel: Cover Image --> <div class="hidden lg:block relative flex-1 bg-slate-900 border-l border-slate-200"> <img src="/bg-login.jpg" alt="Students at Victoria University" class="absolute inset-0 w-full h-full object-cover"> <div class="absolute inset-0 bg-black/10 mix-blend-multiply"></div> <!-- Version Text --> <div class="absolute bottom-4 right-6 text-white text-sm font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
VClass Identity Setup
</div> </div> </main> ` })}`;
}, "/Users/apple/vu-exam-system/VU/src/pages/register.astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/register.astro";
const $$url = "/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
