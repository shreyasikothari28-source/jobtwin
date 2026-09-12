// Google Drive folder fetcher — uses public folder JSON endpoint, no API key

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
}

export interface DriveFetchResult {
  files: DriveFile[];
  error?: string;
}

// Extract folder ID from a Google Drive folder URL
export function extractFolderId(url: string): string | null {
  // Match patterns like:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /\/folderview\?.*id=([a-zA-Z0-9-_]+)/,
    /[?&]id=([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Fetch file list from a public Google Drive folder
// Uses the public embed endpoint that returns HTML with embedded JSON
export async function fetchDriveFolder(folderUrl: string): Promise<DriveFetchResult> {
  const folderId = extractFolderId(folderUrl);

  if (!folderId) {
    return { files: [], error: 'Could not extract folder ID from the provided URL. Make sure it is a valid Google Drive folder link.' };
  }

  try {
    // The embed endpoint for public folders returns HTML with embedded file data
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;

    const response = await fetch(embedUrl);
    if (!response.ok) {
      return { files: [], error: `Failed to fetch folder (HTTP ${response.status}). Make sure the folder is set to "Anyone with the link".` };
    }

    const html = await response.text();
    const files = parseFolderHtml(html, folderId);

    if (files.length === 0) {
      return { files: [], error: 'No supported files (PDF/DOCX) found in the folder, or the folder is not publicly accessible.' };
    }

    return { files };
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err.message : 'Failed to fetch Drive folder. Check the link and permissions.',
    };
  }
}

// Parse the HTML from embeddedfolderview to extract file info
function parseFolderHtml(html: string, folderId: string): DriveFile[] {
  const files: DriveFile[] = [];

  // The embed page contains flip-entries with file data
  // Each file entry has a data-id attribute and contains the filename
  const entryRegex = /<div[^>]*class="[^"]*flip-entry[^"]*"[^>]*data-id="([^"]+)"[^>]*>/g;
  const entries = html.matchAll(entryRegex);

  for (const entry of entries) {
    const fileId = entry[1];
    // Find the filename and type near this entry
    const afterEntry = html.slice(entry.index! + entry[0].length, entry.index! + 2000);

    // Extract filename
    const nameMatch = afterEntry.match(/class="[^"]*flip-entry-title[^"]*"[^>]*>([^<]+)</);
    const name = nameMatch ? nameMatch[1].trim() : `file_${fileId}`;

    // Determine file type from extension
    const ext = name.toLowerCase().split('.').pop() || '';
    if (!['pdf', 'docx', 'doc'].includes(ext)) continue;

    const mimeType = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    files.push({
      id: fileId,
      name,
      mimeType,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    });
  }

  // Alternative parsing: look for /file/d/ links
  if (files.length === 0) {
    const fileLinkRegex = /\/file\/d\/([a-zA-Z0-9-_]+)/g;
    const linkMatches = html.matchAll(fileLinkRegex);
    const seen = new Set<string>();

    for (const match of linkMatches) {
      const fileId = match[1];
      if (seen.has(fileId)) continue;
      seen.add(fileId);

      // Try to find filename near the link
      const afterMatch = html.slice(match.index!, match.index! + 1000);
      const nameMatch = afterMatch.match(/>([^<]+\.(?:pdf|docx?))</i);
      const name = nameMatch ? nameMatch[1].trim() : `file_${fileId}.pdf`;

      const ext = name.toLowerCase().split('.').pop() || 'pdf';

      files.push({
        id: fileId,
        name,
        mimeType: ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      });
    }
  }

  return files;
}

// Download a file from Google Drive
export async function downloadDriveFile(file: DriveFile): Promise<Blob> {
  const response = await fetch(file.downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${file.name} (HTTP ${response.status})`);
  }
  return response.blob();
}
