import html2pdf from 'html2pdf.js';

export const exportToPdf = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const opt = {
      margin:       1,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  } else {
    console.error(`Element with ID '${elementId}' not found.`);
  }
};
