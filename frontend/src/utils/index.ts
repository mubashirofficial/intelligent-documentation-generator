import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  } catch (error) {
    toast.error('Failed to copy to clipboard');
  }
}

// Re-export document generator functions
export {
  generateAndDownloadDocumentation,
  generateDocumentationDocx,
  downloadDocument,
  type DocumentationItem,
  type DocumentationData
} from './documentGenerator';
