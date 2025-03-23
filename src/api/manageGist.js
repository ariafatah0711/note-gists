import { fetchGistData } from "./fetch";
import { currentGistId, currentFileName, domain } from "../../config";

async function loadGists(source = "local") {
  const gists = await fetchGistData(source);
  const listDiv = document.getElementById("gist-list");
  listDiv.innerHTML = "";

  for (const gist of gists) {
    const gistId = source === "local" ? gist.gits : gist.id;
    if (!gistId || gistId.length < 32) continue;

    try {
      const response = await fetch(`${domain}/gists/${gistId}`);

      if (!response.ok) {
        console.warn(`Gist ID ${gistId} tidak ditemukan atau tidak valid.`);
        continue;
      }

      const gistData = await response.json();
      if (!gistData.files) continue;

      const gistItem = document.createElement("div");
      gistItem.className = "gist-item";

      const isOpen = localStorage.getItem(`gist_open_${gistId}`) === "true";

      gistItem.innerHTML = `
              <div class="gist-header">
                <details class="file-details" ${isOpen ? "open" : ""} data-gist-id="${gistId}">
                  <summary class="file-summary">
                    <span class="gist-id">
                      <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub">
                      ${gistId}
                    </span>
                    <span class="gist-body">
                      <button class="delete-btn">🗑️</button>
                      <button class="add-btn">➕</button>
                    </span>
                  </summary>
                  <ul class="file-list">
                    ${Object.keys(gistData.files)
                      .map((file) => `<li><a href="#" onclick="loadFile('${gistId}', '${file}')">${file}</a></li>`)
                      .join("")}
                  </ul>
                </details>
              </div>
            `;

      gistItem.querySelector(".delete-btn").onclick = () => deleteGist(gistId, source);
      gistItem.querySelector(".add-btn").onclick = () => {
        const fileName = prompt("Masukkan nama file:");
        if (fileName) addFile(gistId, fileName);
      };

      const detailsElement = gistItem.querySelector(".file-details");
      detailsElement.addEventListener("toggle", () => {
        localStorage.setItem(`gist_open_${gistId}`, detailsElement.open);
      });

      listDiv.appendChild(gistItem);
    } catch (error) {
      console.error(`Terjadi kesalahan saat memuat Gist ID ${gistId}:`, error);
    }
  }

  if (currentGistId && currentFileName) {
    loadFile(currentGistId, currentFileName);
  }
}

async function addGist() {
  const payload = {
    description: "New Gist",
    public: true,
    files: {
      new: { content: "_" },
    },
  };

  try {
    const response = await fetch(`${domain}/gists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201) {
      const result = await response.json();
      //   alert(`Gist berhasil dibuat! ID: ${result.id}`);
      window.location.reload();
    } else {
      const errorData = await response.json();
      alert(`Gagal membuat Gist! ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat membuat Gist.");
  }
}

async function saveGist() {
  if (!currentGistId || !currentFileName) return;

  const content = document.getElementById("file-content").value;
  const payload = {
    files: {
      [currentFileName]: { content: content },
    },
  };

  await fetch(`${domain}/gists/${currentGistId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  //   alert(`File "${currentFileName}" berhasil disimpan!`);
}

async function deleteGist(gistId, source) {
  const confirmDelete = confirm(`Yakin ingin menghapus Gist ${gistId}?`);
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${domain}/gists/${gistId}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Gagal menghapus Gist: ${response.status}`);

    console.log(`Gist ${gistId} berhasil dihapus`);

    // Hapus dari localStorage
    localStorage.removeItem(`gist_open_${gistId}`);
    localStorage.removeItem("currentGistId");
    localStorage.removeItem("currentFileName");

    // Refresh daftar Gist
    // await loadGists(source);
    window.location.reload();
  } catch (error) {
    console.error("Error saat menghapus Gist:", error);
  }
}

export { loadGists, addGist, deleteGist };
