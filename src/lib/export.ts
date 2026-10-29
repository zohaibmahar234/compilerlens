import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export function exportToTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportElementToImage(
  element: HTMLElement,
  filename = "compiler-lens-artifact.png"
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#090d16",
    scale: 2,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCompilerReportPdf(
  title: string,
  sections: { heading: string; body: string }[]
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CompilerLens - Compiler Compilation Report", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleString()} | Program: ${title}`, 14, y);
  y += 12;

  doc.setTextColor(0);

  for (const sec of sections) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(sec.heading, 14, y);
    y += 6;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);

    const splitText = doc.splitTextToSize(sec.body, pageWidth - 28);
    for (const line of splitText) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 4;
    }
    y += 6;
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}_compiler_report.pdf`);
}
