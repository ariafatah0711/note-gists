import { domain } from "../../config";

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

export { loadFile, addFile, deleteFile };
