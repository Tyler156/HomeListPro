export async function exportReportPdf(reportElement, filename) {
  if (!reportElement) return;

  const clone = reportElement.cloneNode(true);
  clone.style.width = "800px";
  clone.querySelectorAll("img").forEach((img) => {
    img.style.maxWidth = "100%";
  });

  document.body.appendChild(clone);
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  });
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new window.jspdf.jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 20;
  pdf.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight);
  if (imgHeight > pageHeight - 40) {
    const totalPages = Math.ceil(imgHeight / (pageHeight - 40));
    for (let i = 1; i < totalPages; i += 1) {
      pdf.addPage();
      position = -(pageHeight - 40) * i + 20;
      pdf.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight);
    }
  }
  pdf.save(filename);
}

export function exportReportWord(reportElement, filename) {
  if (!reportElement) return;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>HomeList Pro Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 1in; color: #111111; }
          h1, h2, h3, h4 { color: #0f172a; }
          img { max-width: 100%; height: auto; border-radius: 10px; }
          .report-cover { margin-bottom: 24px; }
          .report-cover-title { font-size: 32px; margin: 0; }
          .report-cover-subtitle { margin: 8px 0 0; color: #4f7fbf; }
          .report-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
          .report-details div { margin-bottom: 12px; }
          .report-details span { display: block; color: #475569; font-size: 12px; margin-bottom: 4px; }
          .report-details strong { font-size: 14px; }
          .report-room-heading { font-size: 20px; margin-top: 28px; }
          .report-issue-number { margin: 8px 0; font-weight: 700; }
          .report-issue-card { display: flex; gap: 14px; margin-top: 12px; }
          .report-issue-photo { width: 160px; }
          .report-issue-body p { margin: 6px 0; }
        </style>
      </head>
      <body>
        ${reportElement.outerHTML}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
