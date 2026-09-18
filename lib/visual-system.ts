import type {
  ClientSource,
  ClientStatus,
  DocumentStatus,
  EquipmentType,
  PaymentStatus,
  ServiceType,
} from "@/lib/admin/schema";

export type Tone =
  | "brand"
  | "neutral"
  | "cooling"
  | "heating"
  | "maintenance"
  | "replacement"
  | "success"
  | "warning"
  | "danger";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getAdminMetricCardClass(tone: Tone) {
  return `admin-metric-card admin-metric-card--${tone}`;
}

export function getAdminQueueCardClass(tone: Tone) {
  return `admin-queue-card admin-queue-card--${tone}`;
}

export function getAdminRecordRowClass(tone: Tone) {
  return `admin-record-row admin-record-row--${tone}`;
}

export function getAdminSegmentClass(active: boolean, tone: Tone = "brand") {
  return cx("admin-segment", `admin-segment--${tone}`, active && "is-active");
}

export function getAdminChoiceChipClass(active: boolean, tone: Tone = "brand") {
  return cx("admin-choice-chip", `admin-choice-chip--${tone}`, active && "is-active");
}

export const clientStatusToneMap: Record<ClientStatus, Tone> = {
  lead: "cooling",
  active: "success",
  inactive: "neutral",
};

export const clientSourceToneMap: Record<ClientSource, Tone> = {
  website: "brand",
  manual: "neutral",
  referral: "maintenance",
};

export const paymentStatusToneMap: Record<PaymentStatus, Tone> = {
  paid: "success",
  pending: "warning",
  invoiced: "danger",
};

export const documentStatusToneMap: Record<DocumentStatus, Tone> = {
  draft: "neutral",
  sent: "cooling",
  approved: "success",
  rejected: "danger",
  paid: "success",
  past_due: "danger",
  void: "neutral",
};

export const equipmentTypeToneMap: Record<EquipmentType, Tone> = {
  ac: "cooling",
  furnace: "heating",
  heat_pump: "maintenance",
  mini_split: "cooling",
  thermostat: "brand",
  duct: "brand",
  other: "neutral",
};

export const serviceTypeToneMap: Record<ServiceType, Tone> = {
  ac_repair: "cooling",
  ac_tuneup: "maintenance",
  furnace_repair: "heating",
  furnace_tuneup: "maintenance",
  install: "replacement",
  duct: "brand",
  maintenance: "maintenance",
  inspection: "neutral",
  other: "neutral",
};

export function getClientStatusTone(status: ClientStatus) {
  return clientStatusToneMap[status];
}

export function getPaymentStatusTone(status: PaymentStatus) {
  return paymentStatusToneMap[status];
}

export function getDocumentStatusTone(status: DocumentStatus) {
  return documentStatusToneMap[status];
}

export function getEquipmentTypeTone(equipmentType: EquipmentType) {
  return equipmentTypeToneMap[equipmentType];
}

export function getServiceTypeTone(serviceType: ServiceType) {
  return serviceTypeToneMap[serviceType];
}
