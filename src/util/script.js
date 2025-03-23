import { currentGistId, currentFileName } from "../../config";

function closeEditor() {
  document.getElementById("editor").style.display = "none";
  localStorage.removeItem("currentGistId");
  localStorage.removeItem("currentFileName");
  currentGistId = null;
  currentFileName = null;
}

export { closeEditor };
