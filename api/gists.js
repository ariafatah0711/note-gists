export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const GITHUB_API = "https://api.github.com/gists";
  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`, // Token tetap di backend
    "Content-Type": "application/json",
  };

  try {
    let response;
    switch (req.method) {
      case "GET":
        response = await fetch(GITHUB_API, { headers });
        break;
      case "POST":
      case "PATCH":
      case "DELETE":
        response = await fetch(GITHUB_API, {
          method: req.method,
          headers,
          body: JSON.stringify(req.body),
        });
        break;
      default:
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
