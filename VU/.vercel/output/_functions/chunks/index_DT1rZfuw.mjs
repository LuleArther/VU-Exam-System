import { c as createComponent } from './astro-component_x51wMvUg.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_Bdv9jed8.mjs';
import { $ as $$Layout } from './Layout_CmWx9byV.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_number: regNo, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to login. Please check your credentials.");
      }
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("student_name", data.student_name);
      localStorage.setItem("student_id", regNo);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h3", { className: "text-slate-800 font-bold text-[15px]", children: "Enter your details to login" }) }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200", children: error }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        placeholder: "Reg No e.g VU-AAA-0000-0000",
        required: true,
        value: regNo,
        onChange: (e) => setRegNo(e.target.value),
        className: "w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: showPassword ? "text" : "password",
          placeholder: "Your password",
          required: true,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: "w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors pr-12"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowPassword(!showPassword),
          className: "absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors",
          children: showPassword ? /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center pt-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "remember_me",
          type: "checkbox",
          className: "h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-white",
          style: { accentColor: "white", border: "2px solid #cbd5e1" }
        }
      ),
      /* @__PURE__ */ jsx("label", { htmlFor: "remember_me", className: "ml-3 block text-[14px] text-slate-600 cursor-pointer", children: "Remember me" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pt-4 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full py-[14px] px-4 border border-transparent rounded text-[15px] font-medium text-white bg-[#6b9bc2] hover:bg-[#5a8ab1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b9bc2] transition-colors disabled:opacity-50",
          children: loading ? "Authenticating..." : "Sign In"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/register",
          className: "w-full py-[14px] px-4 border border-slate-300 rounded text-[15px] font-medium text-slate-700 bg-white hover:bg-slate-50 text-center transition-colors block",
          children: "Register for VClass"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-1", children: /* @__PURE__ */ jsx("a", { href: "#", className: "text-[13px] text-slate-500 hover:text-slate-800 transition-colors", children: "Forgot password ?" }) })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Victoria University | Student's Portal", "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="flex min-h-screen bg-slate-50" data-astro-cid-j7pv25f6> <!-- Left Panel: Login Form --> <div class="w-full lg:w-[500px] bg-white flex flex-col relative z-10 shadow-2xl lg:shadow-none" data-astro-cid-j7pv25f6> <div class="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 pt-12 pb-24" data-astro-cid-j7pv25f6> <!-- Logo Area --> <div class="flex flex-col items-center mb-10" data-astro-cid-j7pv25f6> <div class="flex items-center justify-center mb-6" data-astro-cid-j7pv25f6> <img src="/vu-logo.png" alt="Victoria University Kampala Uganda Logo" class="h-[100px] object-contain" data-astro-cid-j7pv25f6> </div> <h1 class="text-[#1a365d] text-[22px] font-bold tracking-wide" data-astro-cid-j7pv25f6>VICTORIA UNIVERSITY</h1> <h2 class="text-slate-500 text-[19px] mt-1 font-medium" data-astro-cid-j7pv25f6>Student's Portal</h2> </div> <div class="mb-6" data-astro-cid-j7pv25f6> <h3 class="text-slate-800 font-bold text-[15px]" data-astro-cid-j7pv25f6>Enter your details to login</h3> </div> ${renderComponent($$result2, "LoginForm", LoginForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/apple/vu-exam-system/VU/src/components/auth/LoginForm", "client:component-export": "default", "data-astro-cid-j7pv25f6": true })} </div> <!-- Online Payments Footer --> <div class="py-6 flex justify-center border-t border-slate-100 mt-auto" data-astro-cid-j7pv25f6> <a href="#" class="text-[#6b9bc2] font-semibold text-[15px] hover:text-[#5a8ab1] transition-colors" data-astro-cid-j7pv25f6>
Online Payments
</a> </div> </div> <!-- Right Panel: Cover Image --> <div class="hidden lg:block relative flex-1 bg-slate-900 border-l border-slate-200" data-astro-cid-j7pv25f6> <img src="/bg-login.jpg" alt="Graduation Ceremony" class="absolute inset-0 w-full h-full object-cover" data-astro-cid-j7pv25f6> <!-- Blue tint overlay could go here if needed, but original image seems raw with vivid reds/blues --> <div class="absolute inset-0 bg-black/5 mix-blend-multiply" data-astro-cid-j7pv25f6></div> <!-- Version Text --> <div class="absolute bottom-4 right-6 text-white text-sm font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" data-astro-cid-j7pv25f6>
Version 3.80
</div> </div> </main> ` })}`;
}, "/Users/apple/vu-exam-system/VU/src/pages/index.astro", void 0);

const $$file = "/Users/apple/vu-exam-system/VU/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
