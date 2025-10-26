import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Shading, ShadingType, BorderStyle } from 'docx';
import toast from 'react-hot-toast';

export interface DocumentationItem {
  _id: string;
  name: string;
  type: string;
  summary?: string;
  codeSnippet?: string;
  examples?: string[];
}

export interface DocumentationData {
  [fileName: string]: DocumentationItem[];
}

/**
 * Generates a DOCX document from documentation data
 * @param projectName - The name of the project
 * @param fileName - The name of the file being documented
 * @param fileData - Array of documentation items for the file
 * @param projectLanguage - The programming language of the project
 * @returns Promise<Blob> - The generated DOCX document as a blob
 */
export async function generateDocumentationDocx(
  projectName: string,
  fileName: string,
  fileData: DocumentationItem[],
  projectLanguage: string = 'typescript'
): Promise<Blob> {
  try {
    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Project Name
          new Paragraph({
            children: [
              new TextRun({ text: projectName, bold: true, size: 32, color: "1F4788" })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // Title
          new Paragraph({
            text: `Documentation for ${fileName}`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // Add each documentation item
          ...fileData.flatMap((docItem: DocumentationItem, index: number) => [
            // Function/Item name as heading
            new Paragraph({
              text: docItem.name,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 200 },
              border: {
                bottom: {
                  color: "CCCCCC",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6
                }
              }
            }),

            // Type information
            new Paragraph({
              children: [
                new TextRun({ text: "Type: ", bold: true, size: 22 }),
                new TextRun({ 
                  text: docItem.type, 
                  italics: true,
                  color: "2D5F9E",
                  size: 22
                })
              ],
              spacing: { after: 200 }
            }),

            // Summary
            ...(docItem.summary ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Summary", bold: true, size: 24, color: "1F4788" })
                ],
                spacing: { before: 200, after: 150 }
              }),
              ...formatSummary(docItem.summary)
            ] : []),

            // Code snippet
            ...(docItem.codeSnippet ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Code", bold: true, size: 24, color: "1F4788" })
                ],
                spacing: { before: 250, after: 150 }
              }),
              ...formatCodeSnippet(docItem.codeSnippet)
            ] : []),

            // Examples
            ...(docItem.examples && docItem.examples.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Examples", bold: true, size: 24, color: "1F4788" })
                ],
                spacing: { before: 250, after: 150 }
              }),
              ...docItem.examples.flatMap(example => formatCodeSnippet(example))
            ] : []),

            // Separator between items (except for the last one)
            ...(index < fileData.length - 1 ? [
              new Paragraph({
                text: "",
                spacing: { before: 400, after: 400 },
                border: {
                  top: {
                    color: "DDDDDD",
                    space: 1,
                    style: BorderStyle.DOUBLE,
                    size: 6
                  }
                }
              })
            ] : [])
          ])
        ]
      }]
    });

    // Generate and return the document as blob
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);
    return new Blob([uint8Array], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Error generating document:', error);
    throw new Error('Failed to generate document');
  }
}

/**
 * Formats code snippet with proper monospace font and styling
 * @param code - The code string to format
 * @returns Array of formatted Paragraph objects
 */
function formatCodeSnippet(code: string): Paragraph[] {
  const lines = code.split('\n');
  
  return lines.map(line => 
    new Paragraph({
      children: [
        new TextRun({
          text: line || ' ', // Empty line for spacing
          font: "Courier New",
          size: 20,
          color: "000000"
        })
      ],
      spacing: { 
        before: 0, 
        after: 0,
        line: 276 // 1.15 line spacing
      },
      indent: { left: 720 }, // Indent code block
      shading: {
        type: ShadingType.CLEAR,
        color: "F5F5F5",
        fill: "F5F5F5"
      },
      border: {
        left: {
          color: "CCCCCC",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12
        }
      }
    })
  );
}

/**
 * Formats summary text with proper structure and readability
 * @param summary - The summary text to format
 * @returns Array of formatted Paragraph objects
 */
function formatSummary(summary: string): Paragraph[] {
    // Clean the text first
    const cleaned = cleanText(summary);
  
    // Split by paragraphs
    const sections = cleaned.split(/\n\n+|\r\n\r\n+/);
  
    return sections
      .map(section => section.trim())
      .filter(section => section.length > 0) // ✅ remove empty sections BEFORE creating Paragraphs
      .map(section => {
        // Check if it's a bulleted item (starts with -, *, •)
        const isBullet = /^[-*•]\s/.test(section);
  
        if (isBullet) {
          return new Paragraph({
            text: section.replace(/^[-*•]\s/, ''),
            spacing: { before: 100, after: 100 },
            indent: { left: 360 },
            bullet: { level: 0 }
          });
        }
  
        // Regular paragraph
        return new Paragraph({
          text: section,
          spacing: { before: 120, after: 120 },
          alignment: AlignmentType.LEFT
        });
      });
  }
  

/**
 * Downloads a DOCX document to the user's device
 * @param blob - The document blob to download
 * @param projectName - The name of the project
 * @param fileName - The name for the downloaded file
 */
export function downloadDocument(blob: Blob, projectName: string, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\.(ts|tsx|js|jsx|py)$/, '')}_documentation.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Documentation downloaded for ${projectName} - ${fileName}`);
  } catch (error) {
    console.error('Error downloading document:', error);
    toast.error('Failed to download document');
  }
}

/**
 * Main function to generate and download documentation
 * @param projectName - The name of the project
 * @param fileName - The name of the file being documented
 * @param fileData - Array of documentation items for the file
 * @param projectLanguage - The programming language of the project
 */
export async function generateAndDownloadDocumentation(
  projectName: string,
  fileName: string,
  fileData: DocumentationItem[],
  projectLanguage: string = 'typescript'
): Promise<void> {
  try {
    const blob = await generateDocumentationDocx(projectName, fileName, fileData, projectLanguage);
    downloadDocument(blob, projectName, fileName);
  } catch (error) {
    console.error('Error in generateAndDownloadDocumentation:', error);
    toast.error('Failed to generate and download documentation');
  }
}

/**
 * Cleans text content by removing markdown syntax and formatting
 * @param text - The text to clean
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  return text
    .replace(/```[\s\S]*?\n|```/g, '') // remove code blocks
    .replace(/\*\*/g, '') // remove bold markers
    .replace(/\*/g, '') // remove asterisks
    .replace(/\([^)]*[a-zA-Z][^)]*\)/g, '') // remove type annotations
    .replace(/@param|@returns|@example/g, '') // remove JSDoc tags
    .replace(/^##\s?/gm, '')
    .replace(/^#\s?/gm, '')
    .trim();
}
