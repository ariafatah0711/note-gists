let currentGistId = null;
let currentFileName = null;

async function fetchGistData(source) {
  if (source === "local") {
    const response = await fetch("gits.json");
    return await response.json();
  } else {
    const response = await fetch("https://api.github.com/gists", {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    return await response.json();
  }
}

async function loadGists(source = "local") {
  const gists = await fetchGistData(source);
  const listDiv = document.getElementById("gist-list");
  listDiv.innerHTML = "";

  for (const gist of gists) {
    const gistId = source === "local" ? gist.gits : gist.id;
    if (!gistId || gistId.length < 32) continue; // Skip jika ID kurang dari 32 karakter

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      });

      if (!response.ok) {
        console.warn(`Gist ID ${gistId} tidak ditemukan atau tidak valid.`);
        continue;
      }

      const gistData = await response.json();

      if (!gistData.files) {
        console.warn(`Gist ID ${gistId} tidak memiliki file.`);
        continue;
      }

      const gistItem = document.createElement("div");
      gistItem.className = "gist-item";

      // Cek apakah state dari gistId disimpan di localStorage
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

      // Attach event handlers
      gistItem.querySelector(".delete-btn").onclick = () => deleteGist(gistId, source);
      gistItem.querySelector(".add-btn").onclick = () => {
        const fileName = prompt("Masukkan nama file:");
        if (fileName) addFile(gistId, fileName);
      };

      // Simpan state open/close ke localStorage
      const detailsElement = gistItem.querySelector(".file-details");
      detailsElement.addEventListener("toggle", () => {
        localStorage.setItem(`gist_open_${gistId}`, detailsElement.open);
      });

      listDiv.appendChild(gistItem);
    } catch (error) {
      console.error(`Terjadi kesalahan saat memuat Gist ID ${gistId}:`, error);
    }
  }
}

async function loadFile(gistId, fileName) {
  currentGistId = gistId;
  currentFileName = fileName;
  document.getElementById("editor").style.display = "flex";
  document.getElementById("file-name").innerText = `${gistId}/${fileName}`;
  document.getElementById("file-content").value = "";

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  const data = await response.json();

  if (data.files[fileName] && data.files[fileName].content) {
    document.getElementById("file-content").value = data.files[fileName].content;
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

  await fetch(`https://api.github.com/gists/${currentGistId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  alert(`File "${currentFileName}" berhasil disimpan!`);
}

async function deleteFile() {
  if (!currentGistId || !currentFileName) return;

  const confirmDelete = confirm(`Apakah kamu yakin ingin menghapus "${currentFileName}"?`);
  if (!confirmDelete) return;

  const payload = {
    files: {
      [currentFileName]: null,
    },
  };

  await fetch(`https://api.github.com/gists/${currentGistId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  alert(`File "${currentFileName}" telah dihapus!`);
  document.getElementById("editor").style.display = "none";
  loadGists();
  location.reload();
}

async function addFile(gistId, fileName) {
  if (!fileName.trim()) return alert("Nama file tidak boleh kosong!");

  const payload = {
    files: {
      [fileName]: { content: "_" }, // Minimal harus ada string kosong
    },
  };

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Response:", response.status, result);

    if (response.status === 200) {
      alert(`File "${fileName}" berhasil ditambahkan!`);
      loadGists();
      location.reload();
    } else {
      alert(`Gagal menambahkan file! ${result.message}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menambahkan file.");
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
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201) {
      const result = await response.json();
      alert(`Gist berhasil dibuat! ID: ${result.id}`);
      location.reload();
      loadGists(); // Refresh daftar Gist
    } else {
      const errorData = await response.json();
      alert(`Gagal membuat Gist! ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat membuat Gist.");
  }
}

async function deleteGist(gistId) {
  if (!confirm(`Apakah Anda yakin ingin menghapus Gist ${gistId}?`)) return;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    if (response.status === 204) {
      alert(`Gist ${gistId} berhasil dihapus!`);
      loadGists(); // Refresh daftar Gist
      location.reload();
    } else {
      alert(`Gagal menghapus Gist!`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menghapus Gist.");
  }
}

loadGists("api");
// loadGists("local"); // Ambil langsung dari GitHub
