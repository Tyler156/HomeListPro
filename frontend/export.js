export async function exportReportPdf(reportElement, filename) {
  if (!reportElement) return;

  const clone = reportElement.cloneNode(true);
  clone.style.width = "800px";
  clone.querySelectorAll("img").forEach((img) => {
    img.style.maxWidth = "100%";
  });

  document.body.appendChild(clone);
  // html2canvas only draws what is already decoded, so wait for the images first
  await Promise.all(
    [...clone.querySelectorAll("img")].map((img) => img.decode().catch(() => {}))
  );
  // allowTaint must stay off or the toDataURL below throws a security error
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
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

// Word will not fetch remote images out of a .doc, so a Cloud Storage URL turns up
// as a broken box - redraw each one through a canvas to get a base64 data URI
function inlineImages(sourceElement, targetElement) {
  const sources = [...sourceElement.querySelectorAll("img")];
  const targets = [...targetElement.querySelectorAll("img")];

  sources.forEach((source, index) => {
    const target = targets[index];
    if (!target || !source.src || source.src.startsWith("data:")) return;
    if (!source.naturalWidth) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      canvas.getContext("2d").drawImage(source, 0, 0);
      target.src = canvas.toDataURL("image/png");
    } catch (err) {
      console.error("Could not embed an image in the Word export", err);
    }
  });
}

export async function exportReportWord(reportElement, filename) {
  if (!reportElement) return;

  await Promise.all(
    [...reportElement.querySelectorAll("img")].map((img) => img.decode().catch(() => {}))
  );
  // work on a copy so the report on screen keeps its original srcs
  const clone = reportElement.cloneNode(true);
  inlineImages(reportElement, clone);

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
          .report-cover-brand { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #0f9577; margin-bottom: 12px; }
          .report-cover-logo { max-height: 64px; max-width: 220px; border-radius: 0; margin-bottom: 12px; }
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
        ${clone.outerHTML}
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
