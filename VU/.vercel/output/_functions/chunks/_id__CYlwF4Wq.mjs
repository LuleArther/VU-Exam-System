import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate } from './entrypoint_Bdv9jed8.mjs';
import { $ as $$Layout } from './Layout_CmWx9byV.mjs';

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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Identity Verification" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "VerificationFlow", null, { "client:only": "react", "examId": examId, "client:component-hydration": "only", "client:component-path": "/Users/apple/vu-exam-system/VU/src/components/exam/VerificationFlow", "client:component-export": "default" })} ` })}`;
}, "/Users/apple/vu-exam-system/VU/src/pages/verify/[id].astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/verify/[id].astro";
const $$url = "/verify/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
