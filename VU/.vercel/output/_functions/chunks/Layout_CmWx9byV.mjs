import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { h as addAttribute, l as renderHead, o as renderSlot, r as renderTemplate } from './entrypoint_Bdv9jed8.mjs';
import 'clsx';
/* empty css                 */

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="description" content="Victoria University Online Examination System"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><!-- Fonts: Inter as the main type for a cleaner look --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><title>${title} | Victoria University</title>${renderHead()}</head> <body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/Users/apple/vu-exam-system/VU/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
