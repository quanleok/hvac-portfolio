export const publicNavLinks = [
  { href: "/about", label: "About" },
  { href: "/services-detail", label: "Services" },
  { href: "/service-area", label: "Service Area" },
  { href: "/gallery", label: "Gallery" },
  { href: "/testimonials", label: "Reviews" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerNavLinks = [
  { href: "/", label: "Home" },
  ...publicNavLinks,
] as const;

export const mobileNavLinks = footerNavLinks;
