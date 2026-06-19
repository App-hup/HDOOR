'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportElementToPDF(
  element: HTMLElement,
  filename: string
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(`${filename}.pdf`)
}

export async function exportMultipleElementsToPDF(
  elements: HTMLElement[],
  filename: string
) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (i > 0) pdf.addPage()

    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }
  }

  pdf.save(`${filename}.pdf`)
}

export function printElement(element: HTMLElement) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>طباعة</title>
      <style>
        body { font-family: 'Cairo', 'Tajawal', sans-serif; padding: 20px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>${element.innerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}
