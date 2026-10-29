const API_BASE =
  import.meta.env.VITE_AGENT5_API || "http://localhost:8005";


async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        data.message ||
        `Agent 5 API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to Agent 5 backend. Please make sure the Agent 5 backend is running on port 8005."
      );
    }

    throw error;
  }
}


/* =========================
   START INTERVIEW
   ========================= */

export function startInterview({
  role = "Software Engineer",
  resume_text = "",
  question_number = 1,
} = {}) {
  return request("/api/agent5/start", {
    method: "POST",
    body: JSON.stringify({
      role,
      resume_text,
      question_number,
    }),
  });
}


/* =========================
   SUBMIT ANSWER
   ========================= */

export function submitAnswer({
  role = "Software Engineer",
  resume_text = "",
  question_number = 1,
  answer = "",
} = {}) {
  return request("/api/agent5/answer", {
    method: "POST",
    body: JSON.stringify({
      role,
      resume_text,
      question_number,
      answer,
    }),
  });
}


/* =========================
   NEXT QUESTION
   ========================= */

export function nextQuestion({
  role = "Software Engineer",
  resume_text = "",
  question_number = 1,
} = {}) {
  return request("/api/agent5/next", {
    method: "POST",
    body: JSON.stringify({
      role,
      resume_text,
      question_number,
    }),
  });
}


/* =========================
   HEALTH CHECK
   ========================= */

export function checkAgent5Health() {
  return request("/api/agent5/health", {
    method: "GET",
  });
}


/* =========================
   DEFAULT EXPORT
   ========================= */

export default {
  startInterview,
  submitAnswer,
  nextQuestion,
  checkAgent5Health,
};