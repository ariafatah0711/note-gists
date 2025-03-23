import { domain } from "../../config";

export async function fetchGistData(source) {
  if (source === "local") {
    const response = await fetch("gits.json");
    return await response.json();
  } else {
    const response = await fetch(`${domain}/gists`);
    return await response.json();
  }
}
