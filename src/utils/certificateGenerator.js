import jsPDF from 'jspdf';

/**
 * Generates a professional certificate of completion PDF
 * @param {Object} certificateData - Certificate data object
 * @param {string} certificateData.studentName - Full name of the student
 * @param {string} certificateData.courseName - Name of the completed course
 * @param {number} certificateData.courseDuration - Duration in days (e.g., 30)
 * @param {number} certificateData.completionPercentage - Completion percentage (0-100)
 * @param {number} certificateData.quizAverageScore - Average quiz score percentage (0-100)
 * @param {string} certificateData.completionDate - Completion date string (formatted)
 * @returns {jsPDF} - The generated PDF document
 */
export const generateCertificate = (certificateData) => {
  const {
    studentName,
    courseName,
    courseDuration,
    completionPercentage,
    quizAverageScore,
    completionDate
  } = certificateData;

  // Create PDF in landscape orientation (11 x 8.5 inches)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [11, 8.5]
  });

  const pageWidth = 11;
  const pageHeight = 8.5;
  const margin = 0.5;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  // Light background color (light gray/cream)
  pdf.setFillColor(250, 248, 245);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  pdf.setDrawColor(200, 180, 150);
  pdf.setLineWidth(0.02);
  pdf.rect(margin, margin, contentWidth, contentHeight);

  // Inner decorative border
  pdf.setDrawColor(180, 160, 130);
  pdf.setLineWidth(0.01);
  pdf.rect(margin + 0.1, margin + 0.1, contentWidth - 0.2, contentHeight - 0.2);

  // Title
  pdf.setFontSize(36);
  pdf.setTextColor(50, 50, 50);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'Certificate of Completion';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 2);

  // Subtitle
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'This is to certify that';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, 2.5);

  // Student Name
  pdf.setFontSize(28);
  pdf.setTextColor(200, 100, 50); // Orange color
  pdf.setFont('helvetica', 'bold');
  const nameText = studentName || 'Student Name';
  const nameWidth = pdf.getTextWidth(nameText);
  pdf.text(nameText, (pageWidth - nameWidth) / 2, 3.2);

  // Course completion text
  pdf.setFontSize(14);
  pdf.setTextColor(50, 50, 50);
  pdf.setFont('helvetica', 'normal');
  const completionText = `has successfully completed the course`;
  const completionWidth = pdf.getTextWidth(completionText);
  pdf.text(completionText, (pageWidth - completionWidth) / 2, 3.7);

  // Course Name
  pdf.setFontSize(20);
  pdf.setTextColor(200, 100, 50); // Orange color
  pdf.setFont('helvetica', 'bold');
  const courseText = courseName || 'Course Name';
  const courseWidth = pdf.getTextWidth(courseText);
  pdf.text(courseText, (pageWidth - courseWidth) / 2, 4.2);

  // Completion Date
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const dateText = `Completion Date: ${completionDate}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, (pageWidth - dateWidth) / 2, 4.8);

  // Signatures section
  const signatureY = 6.5;
  const signatureSpacing = 2.5;
  const signatureStartX = margin + 1;
  const signatureWidth = (contentWidth - 2) / 3;

  // Signature lines
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.01);
  
  // Head of Training
  pdf.line(signatureStartX, signatureY, signatureStartX + signatureWidth - 0.2, signatureY);
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Head of Training', signatureStartX + (signatureWidth - 0.2) / 2 - pdf.getTextWidth('Head of Training') / 2, signatureY + 0.15);
  
  // Course Instructor
  pdf.line(signatureStartX + signatureSpacing, signatureY, signatureStartX + signatureSpacing + signatureWidth - 0.2, signatureY);
  pdf.text('Course Instructor', signatureStartX + signatureSpacing + (signatureWidth - 0.2) / 2 - pdf.getTextWidth('Course Instructor') / 2, signatureY + 0.15);
  
  // Platform Director
  pdf.line(signatureStartX + (signatureSpacing * 2), signatureY, signatureStartX + (signatureSpacing * 2) + signatureWidth - 0.2, signatureY);
  pdf.text('Platform Director', signatureStartX + (signatureSpacing * 2) + (signatureWidth - 0.2) / 2 - pdf.getTextWidth('Platform Director') / 2, signatureY + 0.15);

  return pdf;
};

/**
 * Downloads the certificate PDF
 * @param {Object} certificateData - Certificate data object
 * @param {string} fileName - Optional custom file name (default: "Certificate_[CourseName]_[StudentName].pdf")
 */
export const downloadCertificate = (certificateData, fileName = null) => {
  const pdf = generateCertificate(certificateData);
  
  // Generate file name if not provided
  if (!fileName) {
    const courseName = (certificateData.courseName || 'Course')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 30);
    const studentName = (certificateData.studentName || 'Student')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 20);
    fileName = `Certificate_${courseName}_${studentName}.pdf`;
  }
  
  pdf.save(fileName);
};

