import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Exponential backoff helper for rate limits (429) or temporary server errors (5xx)
async function callGeminiWithRetry(contents, systemInstruction, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1, // low temperature for deterministic routing
        }
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }
      return JSON.parse(text);
    } catch (error) {
      const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded');
      const isServerError = error.status >= 500 || error.message?.includes('500');
      
      if ((isRateLimit || isServerError) && i < retries - 1) {
        const sleepTime = delay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`Gemini API call failed (${error.message}). Retrying in ${Math.round(sleepTime)}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Classify a batch of emails.
 * @param {Array} emails - Array of email objects.
 * @param {Array} existingTasksForThreadReconciliation - Map of thread_id to task objects for identifying updates.
 */
export async function classifyEmail(email, threadTasks = []) {
  // If we already have a task for this thread, we will pass the existing task details to the LLM
  // so it can perform thread reconciliation (e.g. update budget, deadline, escalate priority)
  const existingTask = threadTasks.find(t => t.thread_id === email.thread_id);

  const systemInstruction = `You are the lead operations and routing agent at a B2B services company. Your job is to classify inbound emails to the sales@company.com inbox and extract metadata for task routing.

Team Roster and Departments:
1. Aarti Menon (u_aarti, Sales — Enterprise): RFPs, RFIs, tenders, and inbound deals above ₹10,00,000 (10 Lakhs). Government and PSU tenders ALWAYS go to Aarti, irrespective of deal value.
2. Rohit Sharma (u_rohit, Sales — SMB): Product enquiries, demo requests, deals at or below ₹10,00,000 (10 Lakhs).
3. Meera Iyer (u_meera, Marketing): Webinars, event and conference sponsorships, content collaborations, PR and media.
4. Karan Doshi (u_karan, Alliances): Reseller, channel partner, and technology integration proposals.
5. Divya Rao (u_divya, Finance): Invoices, purchase orders, payment reminders, GST and vendor billing.
6. Triage Queue (u_triage, Operations): Anything ambiguous, or where rules conflict, or multiple distinct requests exist (e.g., both a demo request and a webinar sponsor request).

Critical Routing & Parsing Rules:
- GOVERNMENT/PSU TENDERS: Always route to u_aarti, regardless of value (beats the <= 10L SMB rule).
- VALUE MULTIPLIERS: Parse numerical values correctly. E.g. "25 lakhs" = 2500000, "1.2 cr" or "1.2 crores" = 12000000. If no deal value is mentioned, return null. DO NOT guess or default to zero.
- INVOICES/PAYMENTS: Divya handles these. An invoice amount is NOT a deal value. Do not write invoice values to deal_value_inr (leave it null).
- SPAM & NOISE FILTERING: Set is_spurious_or_noise to true for:
  * Out-of-office auto-replies.
  * Newsletters or bulk updates.
  * Unsolicited vendor spam (e.g. agencies pitching SEO, content writing, design services to us). "Direction of intent" matters: they are selling to us, not buying from us.
- PRIORITY RULE: Set priority to "high" if there is an explicit deadline within 72 hours of the email's received_at date. Otherwise, set it to "medium" or "low" based on urgency. If the email describes an overdue invoice or urgent system issue, high priority is justified.
- DATE FORMATTING: Format due_date as YYYY-MM-DD. Compute relative dates (e.g. "tomorrow", "next week") relative to the received_at timestamp. If no date is stated, return null.
- COMPANY NAME: Extract the organization name. Do not invent. If not stated, but the domain of from_email is a company domain (like s.kulkarni@meridiansteel.co.in -> Meridian Steel), use that company name. If not determinable, return null.
- CONFIDENCE: Assign a float value between 0.0 and 1.0 representing your certainty. If there is ambiguity or double-intents, route to u_triage and set a low confidence (e.g. 0.3 - 0.5).

Response Format:
You must return a single JSON object matching this schema exactly:
{
  "is_spurious_or_noise": boolean,
  "category": "enterprise_rfp" | "smb_enquiry" | "marketing" | "alliances" | "finance" | "triage",
  "assignee_id": "u_aarti" | "u_rohit" | "u_meera" | "u_karan" | "u_divya" | "u_triage",
  "priority": "high" | "medium" | "low",
  "due_date": "YYYY-MM-DD" or null,
  "deal_value_inr": integer or null,
  "company_name": string or null,
  "title": "Short descriptive title",
  "description": "Clear explanation of the email, listing relevant context",
  "confidence": float,
  "reasoning": "Brief explanation of your classification and routing decisions"
}`;

  const emailPayload = {
    email_id: email.email_id,
    thread_id: email.thread_id,
    from_name: email.from_name,
    from_email: email.from_email,
    subject: email.subject,
    body: email.body,
    received_at: email.received_at,
    attachments: email.attachments || [],
    is_reply: email.is_reply || false,
    existing_thread_task: existingTask ? {
      task_id: existingTask.task_id,
      category: existingTask.category,
      assignee_id: existingTask.assignee_id,
      priority: existingTask.priority,
      due_date: existingTask.due_date,
      deal_value_inr: existingTask.deal_value_inr,
      company_name: existingTask.company_name
    } : null
  };

  const prompt = `Classify this email:
${JSON.stringify(emailPayload, null, 2)}`;

  try {
    const classification = await callGeminiWithRetry(prompt, systemInstruction);
    return classification;
  } catch (error) {
    console.error(`Error classifying email ${email.email_id}:`, error);
    // Safe fallback classification if Gemini fails completely
    return {
      is_spurious_or_noise: false,
      category: 'triage',
      assignee_id: 'u_triage',
      priority: 'medium',
      due_date: null,
      deal_value_inr: null,
      company_name: null,
      title: `Triage Required: ${email.subject}`,
      description: `Auto-triaged due to classification failure: ${error.message}. Original Subject: ${email.subject}`,
      confidence: 0.1,
      reasoning: `Gemini API call failed: ${error.message}`
    };
  }
}
