export const TEXT_PREVIEW_MAX_BYTES = 256 * 1024;
export const IMAGE_PREVIEW_MAX_BYTES = 10 * 1024 * 1024;
export const OFFICE_PREVIEW_MAX_BYTES = 50 * 1024 * 1024;
export const DOCX_PREVIEW_MAX_BYTES = OFFICE_PREVIEW_MAX_BYTES;
export const DOC_PREVIEW_MAX_BYTES = OFFICE_PREVIEW_MAX_BYTES;

export const OFFICE_EXTENSIONS = new Set([
  "doc", "docx", "dot", "dotx", "rtf",
  "xls", "xlsx", "xlsm", "xlt", "xltx",
  "ppt", "pptx", "pot", "potx", "pps", "ppsx",
  "odt", "ods", "odp",
]);

export type DocumentPreviewKind =
  | "pdf"
  | "docx"
  | "doc"
  | "dot"
  | "dotx"
  | "rtf"
  | "xlsx"
  | "xls"
  | "xlsm"
  | "xlt"
  | "xltx"
  | "pptx"
  | "ppt"
  | "pot"
  | "potx"
  | "pps"
  | "ppsx"
  | "odt"
  | "ods"
  | "odp";

export const IMAGE_EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
};

export const AUDIO_EXT_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  weba: "audio/webm",
};

export const VIDEO_EXT_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
};

export const DOCUMENT_EXT_TO_MIME: Record<DocumentPreviewKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  dot: "application/msword",
  dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  rtf: "application/rtf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  xlt: "application/vnd.ms-excel",
  xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  pot: "application/vnd.ms-powerpoint",
  potx: "application/vnd.openxmlformats-officedocument.presentationml.template",
  pps: "application/vnd.ms-powerpoint",
  ppsx: "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
};

function getBaseName(filePath: string): string {
  return filePath.replace(/\\/g, "/").split("/").pop() ?? "";
}

export function getFileExt(filePath: string): string {
  return getBaseName(filePath).toLowerCase().split(".").pop() ?? "";
}

export function getImageMime(filePath: string): string | null {
  return IMAGE_EXT_TO_MIME[getFileExt(filePath)] ?? null;
}

export function getAudioMime(filePath: string): string | null {
  return AUDIO_EXT_TO_MIME[getFileExt(filePath)] ?? null;
}

export function getVideoMime(filePath: string): string | null {
  return VIDEO_EXT_TO_MIME[getFileExt(filePath)] ?? null;
}

export function getDocumentMime(filePath: string): string | null {
  return DOCUMENT_EXT_TO_MIME[getFileExt(filePath) as DocumentPreviewKind] ?? null;
}

export function isOfficePath(filePath: string): boolean {
  return OFFICE_EXTENSIONS.has(getFileExt(filePath));
}

export function documentPreviewKind(filePath: string): DocumentPreviewKind | null {
  const ext = getFileExt(filePath);
  if (ext === "pdf" || OFFICE_EXTENSIONS.has(ext)) {
    return ext as DocumentPreviewKind;
  }
  return null;
}

export function isImagePath(filePath: string): boolean {
  return getImageMime(filePath) !== null;
}

export function isAudioPath(filePath: string): boolean {
  return getAudioMime(filePath) !== null;
}

export function isVideoPath(filePath: string): boolean {
  return getVideoMime(filePath) !== null;
}

export function isDocumentPreviewPath(filePath: string): boolean {
  return documentPreviewKind(filePath) !== null;
}
