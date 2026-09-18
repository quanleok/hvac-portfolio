export const clientSources = ["website", "manual", "referral"] as const;
export const clientStatuses = ["lead", "active", "inactive"] as const;
export const paymentStatuses = ["paid", "pending", "invoiced"] as const;
export const documentTypes = ["quote", "invoice"] as const;
export const documentStatuses = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "paid",
  "past_due",
  "void",
] as const;
export const equipmentTypes = [
  "ac",
  "furnace",
  "heat_pump",
  "mini_split",
  "thermostat",
  "duct",
  "other",
] as const;
export const serviceTypes = [
  "ac_repair",
  "ac_tuneup",
  "furnace_repair",
  "furnace_tuneup",
  "install",
  "duct",
  "maintenance",
  "inspection",
  "other",
] as const;

export type ClientSource = (typeof clientSources)[number];
export type ClientStatus = (typeof clientStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type DocumentType = (typeof documentTypes)[number];
export type DocumentStatus = (typeof documentStatuses)[number];
export type EquipmentType = (typeof equipmentTypes)[number];
export type ServiceType = (typeof serviceTypes)[number];

export const clientSourceLabels: Record<ClientSource, string> = {
  website: "Website",
  manual: "Manual",
  referral: "Referral",
};

export const clientStatusLabels: Record<ClientStatus, string> = {
  lead: "Lead",
  active: "Active",
  inactive: "Inactive",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  invoiced: "Invoiced",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  quote: "Quote",
  invoice: "Invoice",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  past_due: "Past due",
  void: "Void",
};

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  ac: "AC",
  furnace: "Furnace",
  heat_pump: "Heat pump",
  mini_split: "Mini split",
  thermostat: "Thermostat",
  duct: "Duct",
  other: "Other",
};

export const serviceTypeLabels: Record<ServiceType, string> = {
  ac_repair: "AC repair",
  ac_tuneup: "AC tune-up",
  furnace_repair: "Furnace repair",
  furnace_tuneup: "Furnace tune-up",
  install: "Install",
  duct: "Duct",
  maintenance: "Maintenance",
  inspection: "Inspection",
  other: "Other",
};
