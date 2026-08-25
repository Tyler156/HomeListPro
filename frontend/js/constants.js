// shared by the dashboard and the appraisal page
export const ROOMS = [
  "Kitchen",
  "Bathroom",
  "Living Room",
  "Bedroom 1",
  "Bedroom 2",
  "Garage",
  "Exterior",
  "Other",
];

// key is stored, label is shown
export const TRADE_OPTIONS = [
  { key: "electrician", label: "Electrician" },
  { key: "painter", label: "Painter" },
  { key: "exterior-cleaning", label: "Exterior Cleaning" },
  { key: "handyman", label: "Handyman" },
  { key: "cleaner", label: "Cleaner" },
  { key: "gardener", label: "Gardener" },
  { key: "home-stager", label: "Home Stager" },
];

export function tradeLabelFor(tradeKey) {
  return TRADE_OPTIONS.find((option) => option.key === tradeKey)?.label || "Trade";
}

export function buildTradeOptionsHtml(selected = "") {
  return [`<option value="">Select a trade</option>`]
    .concat(
      TRADE_OPTIONS.map(
        (option) =>
          `<option value="${option.key}" ${option.key === selected ? "selected" : ""}>${option.label}</option>`,
      ),
    )
    .join("");
}

export function buildRoomOptionsHtml(selected = "") {
  return ROOMS.map(
    (room) => `<option value="${room}" ${room === selected ? "selected" : ""}>${room}</option>`,
  ).join("");
}
