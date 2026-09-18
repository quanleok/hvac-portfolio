"use client";

import { useState, type FormEvent } from "react";

export function ContactForm({ className = "" }: { className?: string }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
    company: "",
    promoCode: "",
  });
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");

  function updateField(name: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setFormState("error");
      setFormMessage("We need your name, number, and a few words on what's going on.");
      return;
    }
    setFormState("submitting");
    setFormMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = (await response.json()) as { success?: boolean; error?: string; discountApplied?: boolean };
      if (!response.ok) {
        setFormState("error");
        setFormMessage(data.error || "Couldn't send that. Give us a call at (405) 361-5014.");
        return;
      }
      setFormState("success");
      setFormMessage(
        data.discountApplied
          ? "Got it — your $500 off code was accepted. We'll call you to confirm the install estimate."
          : "Got it, we'll be in touch shortly."
      );
      setFormData({ name: "", phone: "", email: "", city: "", message: "", company: "", promoCode: "" });
    } catch {
      setFormState("error");
      setFormMessage("Something glitched. Just call us at (405) 361-5014.");
    }
  }

  return (
    <form id="promo-apply" onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={(e) => updateField("company", e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="name"
          aria-label="Name"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          autoComplete="name"
          placeholder="Name…"
          className="contact-input"
        />
        <input
          type="tel"
          name="phone"
          aria-label="Phone number"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder="Phone number…"
          className="contact-input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          name="email"
          aria-label="Email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          autoComplete="email"
          placeholder="Email…"
          spellCheck={false}
          className="contact-input"
        />
        <input
          type="text"
          name="city"
          aria-label="City"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
          autoComplete="address-level2"
          placeholder="City…"
          className="contact-input"
        />
      </div>
      <input
        type="text"
        name="promoCode"
        aria-label="Discount code (optional)"
        value={formData.promoCode}
        onChange={(e) => updateField("promoCode", e.target.value)}
        placeholder="Discount code (optional)…"
        autoComplete="off"
        spellCheck={false}
        className="contact-input"
      />
      <textarea
        name="message"
        aria-label="Service request details"
        value={formData.message}
        onChange={(e) => updateField("message", e.target.value)}
        placeholder="What's going on. AC not cooling, furnace won't start, etc."
        rows={5}
        className="contact-input contact-textarea"
      />
      {formMessage ? (
        <p
          className={`text-sm leading-6 ${
            formState === "success" ? "text-emerald-300" : "text-amber-200"
          }`}
          aria-live="polite"
          role="status"
        >
          {formMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={formState === "submitting"}
        className="primary-button btn-gloss inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] disabled:opacity-70"
      >
        {formState === "submitting" ? "Sending…" : "Send it"}
      </button>
    </form>
  );
}
