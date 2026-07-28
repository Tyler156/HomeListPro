import { exportReportPdf, exportReportWord } from "./export.js";

const params = new URLSearchParams(window.location.search);
const appraisalId = parseInt(params.get("id"), 10);
const reportFrame = document.getElementById("reportFrame");
const backBtn = document.getElementById("back-btn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportWordBtn = document.getElementById("exportWordBtn");

const ROOM_PROBLEMS = {
  Kitchen: [
    "Damaged cupboard",
    "Broken drawer",
    "Cracked bench",
    "Leaking tap",
  ],
  Bathroom: [
    "Mould",
    "Broken tiles",
    "Water damage",
    "Blocked drain",
  ],
  "Living Room": [
    "Sun-faded carpet",
    "Loose skirting",
    "Cracked window",
    "Damaged paint",
  ],
  Bedroom: [
    "Wardrobe door issue",
    "Loose light fitting",
    "Uneven flooring",
    "Window seal damage",
  ],
  Exterior: [
    "Broken gutter",
    "Damaged cladding",
    "Overgrown garden",
    "Peeling paint",
  ],
  Garage: [
    "Door track issue",
    "Lighting fault",
    "Floor staining",
    "Storage damage",
  ],
  Other: [
    "General wear",
    "Poor finish",
    "Minor damage",
    "Loose fittings",
  ],
};

function getStoredProperty() {
  const properties = JSON.parse(localStorage.getItem("properties")) || [];
  return properties[appraisalId] || null;
}

function normalizeRoom(room) {
  if (!room) return "Other";
  return room;
}

function groupIssuesByRoom(issues = []) {
  const grouped = {};
  issues.forEach((issue) => {
    const room = normalizeRoom(issue.room);
    grouped[room] = grouped[room] || [];
    grouped[room].push(issue);
  });
  return grouped;
}

function buildReportPropertySection(property) {
  return `
    <div class="report-cover">
      <div class="report-cover-brand">HomeList Pro</div>
      <div>
        <p class="report-cover-title">Property Inspection Report</p>
        <p class="report-cover-subtitle">${property.address}</p>
      </div>
    </div>

    <section class="report-details">
      <div>
        <span>Prepared By</span>
        <strong>HomeList Pro</strong>
      </div>
      <div>
        <span>Agency</span>
        <strong>${property.agency || "HomeList Pro"}</strong>
      </div>
      <div>
        <span>Date</span>
        <strong>${new Date().toLocaleDateString()}</strong>
      </div>
      <div>
        <span>Property Address</span>
        <strong>${property.address}</strong>
      </div>
      <div>
        <span>Client</span>
        <strong>${property.owner}</strong>
      </div>
    </section>
  `;
}

function buildIssueCard(issue, index) {
  return `
    <div class="report-issue-card">
      <div class="report-issue-photo">
        <img src="${issue.image}" alt="${issue.title}" />
      </div>
      <div class="report-issue-copy">
        <div class="report-issue-heading">
          <strong>${issue.title}</strong>
          <span>${new Date(issue.date).toLocaleDateString()}</span>
        </div>
        <div class="report-issue-body">
          <p><strong>Problem:</strong> ${issue.description}</p>
          <p><strong>Notes:</strong> ${issue.notes || "No additional notes."}</p>
        </div>
      </div>
    </div>
  `;
}

function buildReport() {
  const property = getStoredProperty();
  if (!property) {
    reportFrame.innerHTML = `<div class="report-empty-state"><p>No appraisal data found.</p></div>`;
    return;
  }

  const issues = property.issues || [];
  const grouped = groupIssuesByRoom(issues);
  const roomSections = Object.keys(grouped)
    .sort()
    .map((room) => {
      const roomIssues = grouped[room];
      const issueBlocks = roomIssues
        .map((issue, idx) => {
          return `
            <div class="report-room-issue">
              <h3>${room}</h3>
              <p class="report-issue-number">Issue ${String(idx + 1).padStart(2, "0")}</p>
              ${buildIssueCard(issue, idx)}
            </div>
          `;
        })
        .join("\n");
      return `<div class="report-room-block">${issueBlocks}</div>`;
    })
    .join("\n");

  reportFrame.innerHTML = `
    <div class="report-sheet">
      ${buildReportPropertySection(property)}
      <div class="report-summary-note">
        <p>This inspection report summarises identified issues by room and provides a recommended action plan for presenting the property at its best.</p>
      </div>
      ${roomSections || `<div class="report-empty-state"><p>No issues have been captured for this appraisal yet.</p></div>`}
    </div>
  `;
}

function init() {
  if (isNaN(appraisalId)) {
    window.location.href = "dashboard.html";
    return;
  }

  backBtn.addEventListener("click", () => {
    window.location.href = `appraisal.html?id=${appraisalId}`;
  });

  exportPdfBtn.addEventListener("click", async () => {
    await exportReportPdf(document.querySelector(".report-sheet"), `HomelistPro_Report_${appraisalId}.pdf`);
  });

  exportWordBtn.addEventListener("click", () => {
    exportReportWord(document.querySelector(".report-sheet"), `HomelistPro_Report_${appraisalId}.doc`);
  });

  buildReport();
}

init();
