import { loadGists, addGist, deleteGist } from "./api/manageGist.js";
import { loadFile, addFile, deleteFile } from "./api/manageFile.js";

document.addEventListener("DOMContentLoaded", () => {
  loadGists("api");
});

// Contoh: Menggunakan fungsi di dalam event listener
document.getElementById("loadBtn").addEventListener("click", () => {
  loadFile("someGistId", "someFileName");
});

document.getElementById("addBtn").addEventListener("click", () => {
  addFile("someGistId", "newFile.txt");
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  deleteFile();
});

window.deleteFile = deleteFile;
window.addGist = addGist;
window.saveGist = saveGist; // Pastikan fungsi saveGist sudah diimport
window.closeEditor = closeEditor; // Jika berasal dari util/script.js
