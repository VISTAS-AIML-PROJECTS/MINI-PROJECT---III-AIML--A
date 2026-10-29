/* ==================================================
   AGENT 06 - HR DECISION SUPPORT API
   ================================================== */


const API_BASE = "http://127.0.0.1:8006";


/* ==================================================
   COMMON REQUEST FUNCTION
   ================================================== */

async function request(path, options = {}) {

  try {

    const response = await fetch(
      `${API_BASE}${path}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },

        ...options,
      }
    );


    const data = await response
      .json()
      .catch(() => ({}));


    if (!response.ok) {

      throw new Error(
        data.detail ||
        data.error ||
        `Agent 6 API error: ${response.status}`
      );

    }


    return data;

  } catch (error) {

    if (error instanceof TypeError) {

      throw new Error(
        "Cannot connect to Agent 6 backend. Please make sure main_agent6.py is running on port 8006."
      );

    }


    throw error;

  }

}


/* ==================================================
   AGENT 6 - HR DECISION SUPPORT
   ================================================== */

export function calculateReadiness(scores = {}) {

  return request(
    "/api/agent6/score",
    {
      method: "POST",

      body: JSON.stringify({
        scores: scores,
      }),
    }
  );

}


/* ==================================================
   DEFAULT EXPORT
   ================================================== */

export default {

  calculateReadiness,

};