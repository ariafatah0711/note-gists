let currentGistId = localStorage.getItem("currentGistId") || null;
let currentFileName = localStorage.getItem("currentFileName") || null;
let domain = "https://note-gist.vercel.app/api";

async function fetchGistData(source) {
  if (source === "local") {
    const response = await fetch("gits.json");
    return await response.json();
  } else {
    const response = await fetch(`${domain}/gists`);
    return await response.json();
  }
}

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

async function loadFile(gistId, fileName) {
  currentGistId = gistId;
  currentFileName = fileName;

  localStorage.setItem("currentGistId", gistId);
  localStorage.setItem("currentFileName", fileName);

  document.getElementById("editor").style.display = "flex";
  document.getElementById("file-name").innerText = `${gistId}/${fileName}`;
  document.getElementById("file-content").value = "";
  document.getElementById("file-content").disabled = false;

  const response = await fetch(`${domain}/gists/${gistId}`);
  //   if (!response.ok) {
  // console.warn(`curent id remove`);
  // return;
  //   }

  const data = await response.json();

  if (data && data.files && data.files[fileName] && data.files[fileName].content) {
    document.getElementById("file-content").value = data.files[fileName].content;
  } else {
    document.getElementById("file-content").value = "File tidak ada";
    document.getElementById("file-content").disabled = true;
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

async function addFile(gistId, fileName) {
  if (!fileName.trim()) return alert("Nama file tidak boleh kosong!");

  const payload = {
    files: {
      [fileName]: { content: "_" },
    },
  };

  try {
    const response = await fetch(`${domain}/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200) {
      alert(`File "${fileName}" berhasil ditambahkan!`);
      window.location.reload();
    } else {
      alert(`Gagal menambahkan file!`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menambahkan file.");
  }
}

async function deleteFile() {
  if (!currentGistId || !currentFileName) {
    console.error("Gagal menghapus file: currentGistId atau currentFileName tidak ditemukan.");
    return;
  }

  console.log(`Menghapus file "${currentFileName}" dari Gist ID ${currentGistId}...`);

  const confirmDelete = confirm(`Apakah kamu yakin ingin menghapus "${currentFileName}"?`);
  if (!confirmDelete) return;

  const payload = {
    files: {
      [currentFileName]: null,
    },
  };

  try {
    const response = await fetch(`${domain}/gists/${currentGistId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`Gagal menghapus file. Status: ${response.status}`);
    }

    alert(`File "${currentFileName}" telah dihapus!`);

    currentFileName = null;
    window.location.reload();
  } catch (error) {
    console.error("Error saat menghapus file:", error);
  }
}

function closeEditor() {
  document.getElementById("editor").style.display = "none";
  localStorage.removeItem("currentGistId");
  localStorage.removeItem("currentFileName");
  currentGistId = null;
  currentFileName = null;
}

document.addEventListener("DOMContentLoaded", () => {
  loadGists("api");
});
