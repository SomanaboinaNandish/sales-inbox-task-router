import { GoogleGenAI } from "@google/genai";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log(
  "Gemini key loaded:",
  Boolean(apiKey),
  "length:",
  apiKey?.length || 0
);

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({
  apiKey
});

function normalizeCandidateId(candidateId) {
  return String(candidateId || "").trim().toLowerCase();
}

async function getDatabaseContext(candidateId) {
  const normalizedCandidateId =
    normalizeCandidateId(candidateId);

  const [tasks, emails, runs] = await Promise.all([
    db.tasks
      .find({
        candidate_id: normalizedCandidateId
      })
      .sort({
        created_at: -1
      })
      .toArray(),

    db.processedEmails
      .find({
        candidate_id: normalizedCandidateId
      })
      .sort({
        received_at: -1
      })
      .toArray(),

    db.runs
      .find({
        candidate_id: normalizedCandidateId
      })
      .sort({
        timestamp: -1
      })
      .toArray()
  ]);

  return {
    tasks,
    emails,
    runs
  };
}

function removeMongoId(items) {
  return items.map(item => {
    const { _id, ...rest } = item;
    return rest;
  });
}

export async function handleChatQuery(candidateId, query) {
  try {
    const normalizedCandidateId =
      normalizeCandidateId(candidateId);

    if (!normalizedCandidateId) {
      return {
        answer: "Candidate ID is required.",
        supporting_data: {}
      };
    }

    if (!query || !query.trim()) {
      return {
        answer: "Please provide a question.",
        supporting_data: {}
      };
    }

    console.log(
      "Chat candidate:",
      normalizedCandidateId
    );

    console.log(
      "Chat question:",
      query
    );

    // --------------------------------------------------
    // Get MongoDB data
    // --------------------------------------------------

    const databaseContext =
      await getDatabaseContext(
        normalizedCandidateId
      );

    const tasks =
      removeMongoId(databaseContext.tasks);

    const emails =
      removeMongoId(databaseContext.emails);

    const runs =
      removeMongoId(databaseContext.runs);

    console.log(
      "Chat data:",
      {
        tasks: tasks.length,
        emails: emails.length,
        runs: runs.length
      }
    );

    // --------------------------------------------------
    // Calculate statistics
    // --------------------------------------------------

    const highPriorityTasks =
      tasks.filter(
        task => task.priority === "high"
      );

    const mediumPriorityTasks =
      tasks.filter(
        task => task.priority === "medium"
      );

    const lowPriorityTasks =
      tasks.filter(
        task => task.priority === "low"
      );

    const totalDealValue =
      tasks.reduce(
        (sum, task) =>
          sum +
          (Number(task.deal_value_inr) || 0),
        0
      );

    const tasksCreated =
      emails.filter(
        email =>
          email.status === "created_task"
      ).length;

    const tasksUpdated =
      emails.filter(
        email =>
          email.status === "updated_task"
      ).length;

    const skippedEmails =
      emails.filter(
        email =>
          email.status === "skipped"
      ).length;

    const categoryCounts = {};

    for (const task of tasks) {
      const category =
        task.category || "unknown";

      categoryCounts[category] =
        (categoryCounts[category] || 0) + 1;
    }

    const assigneeCounts = {};

    for (const task of tasks) {
      const assignee =
        task.assignee_id || "unassigned";

      assigneeCounts[assignee] =
        (assigneeCounts[assignee] || 0) + 1;
    }

    // --------------------------------------------------
    // Prepare database context
    // --------------------------------------------------

    const context = {
      candidate_id:
        normalizedCandidateId,

      summary: {
        total_tasks:
          tasks.length,

        total_processed_emails:
          emails.length,

        total_processing_runs:
          runs.length,

        tasks_created:
          tasksCreated,

        tasks_updated:
          tasksUpdated,

        skipped_emails:
          skippedEmails,

        high_priority_tasks:
          highPriorityTasks.length,

        medium_priority_tasks:
          mediumPriorityTasks.length,

        low_priority_tasks:
          lowPriorityTasks.length,

        total_deal_value_inr:
          totalDealValue,

        category_counts:
          categoryCounts,

        assignee_counts:
          assigneeCounts
      },

      tasks,

      processed_emails:
        emails,

      processing_runs:
        runs
    };

    // --------------------------------------------------
    // Gemini system instruction
    // --------------------------------------------------

    const systemInstruction = `
You are a B2B Sales Operations Analytics Assistant.

You answer questions about the Sales Inbox Task Router.

IMPORTANT RULES:

1. Use ONLY the database context provided by the application.
2. Never invent information.
3. Never invent tasks, emails, companies, people, values, dates, or statistics.
4. If requested information does not exist, clearly say so.
5. You are READ-ONLY.
6. You cannot send emails.
7. You cannot delete tasks.
8. You cannot modify tasks.
9. You cannot reassign tasks.
10. For counts, use the provided database data.
11. For money, use INR.
12. Keep answers concise and useful.
13. Return valid JSON only.
14. supporting_data must contain only information derived from the database context.
15. Do not use example or imaginary data.

Return exactly this structure:

{
  "answer": "Natural language answer",
  "supporting_data": {}
}
`;

    const prompt = `
User question:

${query}

Database context:

${JSON.stringify(
  context,
  null,
  2
)}
`;

    console.log("Calling Gemini...");

    // --------------------------------------------------
    // Gemini API
    // --------------------------------------------------

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: prompt,

        config: {
          systemInstruction,

          responseMimeType:
            "application/json",

          temperature: 0.1
        }
      });

    console.log("Gemini response received.");

    const responseText =
      response.text?.trim();

    if (!responseText) {
      return {
        answer:
          "I could not generate an answer from the available data.",

        supporting_data: {}
      };
    }

    // --------------------------------------------------
    // Parse Gemini JSON
    // --------------------------------------------------

    let result;

    try {
      result =
        JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:",
        responseText
      );

      return {
        answer:
          responseText,

        supporting_data: {}
      };
    }

    return {
      answer:
        result.answer ||
        "No answer was generated.",

      supporting_data:
        result.supporting_data ||
        {}
    };

  } catch (error) {

    console.error(
      "========== CHAT ERROR =========="
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Status:",
      error.status
    );

    console.error(
      "Cause:",
      error.cause
    );

    console.error(
      "================================"
    );

    // Gemini quota error
    if (
      error?.status === 429 ||
      error?.code === 429
    ) {
      return {
        answer:
          "Gemini API usage limit reached. Please try again later.",

        supporting_data: {
          error:
            "quota_exceeded"
        }
      };
    }

    return {
      answer:
        `An error occurred while processing your request: ${error.message}`,

      supporting_data: {
        error:
          error.message,

        error_name:
          error.name
      }
    };
  }
}