export interface Article {
  number: string;
  title: string;
  content: string;
}

export interface Section {
  id: string;
  title: string;
  articles: string[]; // Range or list
}

export const getArticleExplanation = async (articleNumber: string, language: string = "English") => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "explanation",
      payload: { articleNumber },
      language,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch explanation");
  const data = await response.json();
  return data.text;
};

export const findRelevantArticlesForCase = async (caseDescription: string, language: string = "English") => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "case-analysis",
      payload: { caseDescription },
      language,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch case analysis");
  const data = await response.json();
  return data.text;
};

export const searchConstitution = async (query: string, language: string = "English") => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "search",
      payload: { query },
      language,
    }),
  });
  if (!response.ok) throw new Error("Failed to search constitution");
  const data = await response.json();
  return data.results as { number: string; title: string }[];
};

export const getConstitutionalAmendments = async (query: string = "", language: string = "English") => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "amendments",
      payload: { query },
      language,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch amendments");
  const data = await response.json();
  return data.text;
};
