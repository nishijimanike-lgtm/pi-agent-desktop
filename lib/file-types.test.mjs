import assert from "node:assert/strict";
import test from "node:test";

async function loadSubject() {
  return import("./file-types.ts");
}

test("detects image, audio, and document preview paths", async () => {
  const {
    getAudioMime,
    getDocumentMime,
    getImageMime,
    isAudioPath,
    isDocumentPreviewPath,
    isImagePath,
    isOfficePath,
  } = await loadSubject();

  assert.equal(getImageMime("/tmp/screenshot.PNG"), "image/png");
  assert.equal(getAudioMime("C:\\Users\\me\\voice.OPUS"), "audio/ogg");
  assert.equal(getDocumentMime("/tmp/report.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.equal(getDocumentMime("/tmp/report.doc"), "application/msword");
  assert.equal(getDocumentMime("/tmp/data.xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(getDocumentMime("/tmp/slides.pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  assert.equal(isImagePath("/tmp/screenshot.PNG"), true);
  assert.equal(isAudioPath("C:\\Users\\me\\voice.OPUS"), true);
  assert.equal(isDocumentPreviewPath("/tmp/report.pdf"), true);
  assert.equal(isDocumentPreviewPath("/tmp/report.docx"), true);
  assert.equal(isDocumentPreviewPath("/tmp/report.doc"), true);
  assert.equal(isDocumentPreviewPath("/tmp/data.xlsx"), true);
  assert.equal(isDocumentPreviewPath("/tmp/slides.pptx"), true);
  assert.equal(isDocumentPreviewPath("/tmp/report.txt"), false);
  assert.equal(isOfficePath("/tmp/report.doc"), true);
  assert.equal(isOfficePath("/tmp/data.xlsx"), true);
  assert.equal(isOfficePath("/tmp/slides.pptx"), true);
  assert.equal(isOfficePath("/tmp/report.pdf"), false);
});

test("detects video preview paths and treats webm as video", async () => {
  const { getAudioMime, getVideoMime, isVideoPath } = await loadSubject();

  assert.equal(getVideoMime("/tmp/clip.MP4"), "video/mp4");
  assert.equal(getVideoMime("C:\\Users\\me\\recording.webm"), "video/webm");
  assert.equal(getVideoMime("/tmp/movie.mov"), "video/quicktime");
  assert.equal(getVideoMime("/tmp/notes.txt"), null);
  assert.equal(isVideoPath("/tmp/clip.mp4"), true);
  assert.equal(isVideoPath("/tmp/song.mp3"), false);
  assert.equal(getAudioMime("/tmp/recording.webm"), null);
  assert.equal(getAudioMime("/tmp/voice.weba"), "audio/webm");
});

test("extracts extensions from mixed path styles", async () => {
  const { documentPreviewKind, getFileExt } = await loadSubject();

  assert.equal(getFileExt("/tmp/archive.tar.gz"), "gz");
  assert.equal(getFileExt("C:\\Users\\me\\photo.AVIF"), "avif");
  assert.equal(documentPreviewKind("/tmp/manual.PDF"), "pdf");
  assert.equal(documentPreviewKind("/tmp/manual.DOC"), "doc");
  assert.equal(documentPreviewKind("/tmp/manual.docx"), "docx");
  assert.equal(documentPreviewKind("/tmp/manual.md"), null);
});
