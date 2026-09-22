const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getResultText = (payload) => {
  const pages = payload?.analyzeResult?.pages || [];
  return pages.flatMap((page) => page.lines || []).map((line) => line.content).join("\n").slice(0, 12000);
};

// Azure AI Document Intelligence is optional. Without its credentials the
// prescription is still securely received and queued for pharmacist review.
export const extractPrescriptionText = async (file) => {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  if (!endpoint || !apiKey) return "";

  const response = await fetch(
    `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`,
    { method: "POST", headers: { "Ocp-Apim-Subscription-Key": apiKey, "Content-Type": file.mimetype }, body: file.buffer }
  );
  if (!response.ok) throw new Error("Automated prescription scan could not be started");
  const operationUrl = response.headers.get("operation-location");
  if (!operationUrl) throw new Error("Automated prescription scan did not return a tracking URL");

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await sleep(750);
    const result = await fetch(operationUrl, { headers: { "Ocp-Apim-Subscription-Key": apiKey } });
    if (!result.ok) throw new Error("Automated prescription scan could not be completed");
    const payload = await result.json();
    if (payload.status === "succeeded") return getResultText(payload);
    if (payload.status === "failed") throw new Error("Automated prescription scan failed");
  }
  return "";
};
