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

  // Signatures section - Professional layout with lines above labels
  const signatureY = 6.5;
  const signatureAreaStartX = margin + 1;
  const signatureAreaWidth = contentWidth - 2;
  const signatureCount = 3;
  const signatureSectionWidth = signatureAreaWidth / signatureCount;
  const lineLength = 2.0; // Fixed line length for consistent appearance
  
  // Set styling for signature elements
  pdf.setDrawColor(0, 0, 0); // Black lines
  pdf.setLineWidth(0.015); // Slightly thicker for professional look
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0); // Black text
  pdf.setFont('helvetica', 'bold');
  
  // Draw each signature: line above, label below (centered)
  const signatures = [
    'Head of Training',
    'Course Instructor',
    'Platform Director'
  ];
  
  signatures.forEach((label, index) => {
    // Calculate center position of this signature section
    const sectionCenterX = signatureAreaStartX + (signatureSectionWidth * index) + (signatureSectionWidth / 2);
    const lineStartX = sectionCenterX - (lineLength / 2);
    const lineEndX = sectionCenterX + (lineLength / 2);
    
    // Draw the signature line (black, horizontal)
    pdf.line(lineStartX, signatureY, lineEndX, signatureY);
    
    // Draw the label centered below the line
    const labelWidth = pdf.getTextWidth(label);
    const labelX = sectionCenterX - (labelWidth / 2);
    pdf.text(label, labelX, signatureY + 0.18);
  });

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

