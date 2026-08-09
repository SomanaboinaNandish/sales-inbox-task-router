import express from 'express';
import db from './db.js';
import { classifyEmail } from './classifier.js';
import { handleChatQuery } from './chat.js';

const router = express.Router();

// --------------------------------------------------
// Enums
// --------------------------------------------------

const allowedAssignees = [
  "u_aarti",
  "u_rohit",
  "u_meera",
  "u_karan",
  "u_divya",
  "u_triage"
];

const allowedCategories = [
  "enterprise_rfp",
  "smb_enquiry",
  "marketing",
  "alliances",
  "finance",
  "triage"
];

const allowedPriorities = [
  "high",
  "medium",
  "low"
];

// --------------------------------------------------
// Team roster
// --------------------------------------------------

const teamRoster = [
  {
    user_id: "u_aarti",
    name: "Aarti Menon",
    department: "Sales — Enterprise",
    scope: "RFPs, RFIs, tenders, and inbound deals above ₹10,00,000"
  },
  {
    user_id: "u_rohit",
    name: "Rohit Sharma",
    department: "Sales — SMB",
    scope: "Product enquiries, demo requests, deals at or below ₹10,00,000"
  },
  {
    user_id: "u_meera",
    name: "Meera Iyer",
    department: "Marketing",
    scope: "Webinars, event and conference sponsorships, content collaborations, PR and media"
  },
  {
    user_id: "u_karan",
    name: "Karan Doshi",
    department: "Alliances",
    scope: "Reseller, channel partner, and technology integration proposals"
  },
  {
    user_id: "u_divya",
    name: "Divya Rao",
    department: "Finance",
    scope: "Invoices, purchase orders, payment reminders, GST and vendor billing"
  },
  {
    user_id: "u_triage",
    name: "Triage Queue",
    department: "Operations",
    scope: "Ambiguous items requiring human review"
  }
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function generateTaskId() {
  return 'tsk_' + Math.random().toString(16).substring(2, 10);
}

function generateRunId() {
  return 'run_' + Math.random().toString(16).substring(2, 10);
}

function getIndianTimestamp() {
  const now = new Date();

  const utc = now.getTime() + (
    now.getTimezoneOffset() * 60000
  );

  const ist = new Date(
    utc + (3600000 * 5.5)
  );

  const pad = (num) =>
    String(num).padStart(2, '0');

  const yyyy = ist.getFullYear();
  const mm = pad(ist.getMonth() + 1);
  const dd = pad(ist.getDate());
  const hh = pad(ist.getHours());
  const min = pad(ist.getMinutes());
  const ss = pad(ist.getSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
}

function normalizeEmail(email) {
  if (!email) {
    return '';
  }

  return email.trim().toLowerCase();
}

// --------------------------------------------------
// POST /tasks
// --------------------------------------------------

router.post('/tasks', async (req, res) => {

  const {
    candidate_id,
    source_email_id,
    thread_id,
    title,
    description,
    assignee_id,
    category,
    priority,
    due_date,
    deal_value_inr,
    company_name,
    confidence
  } = req.body;

  // Validation
  if (!candidate_id) {
    return res.status(400).json({
      error: "missing_field",
      field: "candidate_id"
    });
  }

  if (!source_email_id) {
    return res.status(400).json({
      error: "missing_field",
      field: "source_email_id"
    });
  }

  if (!thread_id) {
    return res.status(400).json({
      error: "missing_field",
      field: "thread_id"
    });
  }

  if (!title) {
    return res.status(400).json({
      error: "missing_field",
      field: "title"
    });
  }

  if (confidence === undefined || confidence === null) {
    return res.status(400).json({
      error: "missing_field",
      field: "confidence"
    });
  }

  if (!allowedAssignees.includes(assignee_id)) {
    return res.status(400).json({
      error: "invalid_enum_value",
      field: "assignee_id",
      received: assignee_id,
      allowed: allowedAssignees
    });
  }

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      error: "invalid_enum_value",
      field: "category",
      received: category,
      allowed: allowedCategories
    });
  }

  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      error: "invalid_enum_value",
      field: "priority",
      received: priority,
      allowed: allowedPriorities
    });
  }

  const taskId = generateTaskId();
  const createdAt = getIndianTimestamp();

  try {

    const task = {
      task_id: taskId,
      candidate_id: normalizeEmail(candidate_id),
      source_email_id,
      thread_id,
      title,
      description: description || null,
      assignee_id,
      category,
      priority,
      due_date: due_date || null,
      deal_value_inr:
        deal_value_inr !== undefined
          ? deal_value_inr
          : null,
      company_name: company_name || null,
      confidence,
      created_at: createdAt
    };

    await db.tasks.insertOne(task);

    return res.status(201).json({
      task_id: taskId,
      candidate_id: normalizeEmail(candidate_id),
      source_email_id,
      created_at: createdAt
    });

  } catch (err) {

    console.error(
      "Database error inserting task:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// PATCH /tasks/:task_id
// --------------------------------------------------

router.patch('/tasks/:task_id', async (req, res) => {

  const { task_id } = req.params;
  const updates = req.body;

  try {

    const existing =
      await db.tasks.findOne({
        task_id
      });

    if (!existing) {
      return res.status(404).json({
        error: "task_not_found",
        task_id
      });
    }

    // Enum validation
    if (
      updates.assignee_id !== undefined &&
      !allowedAssignees.includes(
        updates.assignee_id
      )
    ) {
      return res.status(400).json({
        error: "invalid_enum_value",
        field: "assignee_id",
        received: updates.assignee_id,
        allowed: allowedAssignees
      });
    }

    if (
      updates.category !== undefined &&
      !allowedCategories.includes(
        updates.category
      )
    ) {
      return res.status(400).json({
        error: "invalid_enum_value",
        field: "category",
        received: updates.category,
        allowed: allowedCategories
      });
    }

    if (
      updates.priority !== undefined &&
      !allowedPriorities.includes(
        updates.priority
      )
    ) {
      return res.status(400).json({
        error: "invalid_enum_value",
        field: "priority",
        received: updates.priority,
        allowed: allowedPriorities
      });
    }

    const allowedFields = [
      'title',
      'description',
      'assignee_id',
      'category',
      'priority',
      'due_date',
      'deal_value_inr',
      'company_name',
      'confidence'
    ];

    const updateData = {};

    for (const field of allowedFields) {

      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json(existing);
    }

    updateData.updated_at =
      getIndianTimestamp();

    await db.tasks.updateOne(
      { task_id },
      {
        $set: updateData
      }
    );

    const updated =
      await db.tasks.findOne({
        task_id
      });

    return res.status(200).json(updated);

  } catch (err) {

    console.error(
      "Database error patching task:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// GET /tasks
// --------------------------------------------------

router.get('/tasks', async (req, res) => {

  const {
    candidate_id,
    thread_id,
    source_email_id,
    assignee_id
  } = req.query;

  if (!candidate_id) {
    return res.status(400).json({
      error: "candidate_id is mandatory"
    });
  }

  try {

    const filter = {
      candidate_id:
        normalizeEmail(candidate_id)
    };

    if (thread_id) {
      filter.thread_id = thread_id;
    }

    if (source_email_id) {
      filter.source_email_id =
        source_email_id;
    }

    if (assignee_id) {
      filter.assignee_id =
        assignee_id;
    }

    const rows =
      await db.tasks
        .find(filter)
        .sort({
          created_at: -1
        })
        .toArray();

    return res.status(200).json(rows);

  } catch (err) {

    console.error(
      "Database error listing tasks:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// DELETE /tasks/:task_id
// --------------------------------------------------

router.delete('/tasks/:task_id', async (req, res) => {

  const { task_id } = req.params;

  try {

    const existing =
      await db.tasks.findOne({
        task_id
      });

    if (!existing) {
      return res.status(404).json({
        error: "task_not_found",
        task_id
      });
    }

    await db.tasks.deleteOne({
      task_id
    });

    // Clear associated task references
    await db.processedEmails.updateMany(
      {
        associated_task_id: task_id
      },
      {
        $set: {
          associated_task_id: null
        }
      }
    );

    return res.status(200).json({
      message: "Task deleted successfully",
      task_id
    });

  } catch (err) {

    console.error(
      "Database error deleting task:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// GET /users
// --------------------------------------------------

router.get('/users', (req, res) => {

  return res.status(200).json({
    team: teamRoster
  });
});

// --------------------------------------------------
// POST /ingest
// --------------------------------------------------

router.post('/ingest', async (req, res) => {

  const {
    candidate_id,
    emails
  } = req.body;

  if (!candidate_id) {
    return res.status(400).json({
      error: "missing candidate_id"
    });
  }

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({
      error: "emails array is required"
    });
  }

  const runId = generateRunId();

  const startTime =
    getIndianTimestamp();

  let processedCount = 0;
  let tasksCreated = 0;
  let tasksUpdated = 0;
  let skippedCount = 0;

  const errors = [];

  const normCandidateId =
    normalizeEmail(candidate_id);

  try {

    // Load active tasks for this candidate
    let activeTasks =
      await db.tasks
        .find({
          candidate_id: normCandidateId
        })
        .toArray();

    for (const email of emails) {

      try {

        // ------------------------------------------------
        // 1. Idempotency check
        // ------------------------------------------------

        const existingProcessed =
          await db.processedEmails.findOne({
            candidate_id: normCandidateId,
            email_id: email.email_id
          });

        if (existingProcessed) {

          processedCount++;
          skippedCount++;

          continue;
        }

        // ------------------------------------------------
        // 2. Thread reconciliation
        // ------------------------------------------------

        const existingTask =
          activeTasks.find(
            task =>
              task.thread_id === email.thread_id
          );

        // ------------------------------------------------
        // 3. AI classification
        // ------------------------------------------------

        const classification =
          await classifyEmail(
            email,
            activeTasks
          );

        // ------------------------------------------------
        // 4. Noise / spam / OOO
        // ------------------------------------------------

        if (
          classification.is_spurious_or_noise
        ) {

          await db.processedEmails.insertOne({

            candidate_id: normCandidateId,

            email_id:
              email.email_id,

            thread_id:
              email.thread_id,

            from_name:
              email.from_name,

            from_email:
              email.from_email,

            subject:
              email.subject,

            body:
              email.body,

            received_at:
              email.received_at,

            run_id: runId,

            status: "skipped",

            decision_category:
              classification.category ||
              "triage",

            decision_priority:
              classification.priority ||
              "low",

            decision_assignee:
              classification.assignee_id ||
              null,

            decision_confidence:
              classification.confidence,

            decision_reasoning:
              classification.reasoning,

            associated_task_id:
              null
          });

          skippedCount++;

        }

        // ------------------------------------------------
        // 5. Existing thread → update task
        // ------------------------------------------------

        else if (existingTask) {

          const updatedTitle =
            classification.title ||
            existingTask.title;

          const updatedDesc =
            (
              existingTask.description
                ? existingTask.description +
                  "\n\n"
                : ""
            ) +
            `[Update from Email ${email.email_id}]: ` +
            (
              classification.description ||
              email.body
            );

          const updatedAssignee =
            classification.assignee_id ||
            existingTask.assignee_id;

          const updatedCategory =
            classification.category ||
            existingTask.category;

          const updatedPriority =
            classification.priority ||
            existingTask.priority;

          const updatedDueDate =
            classification.due_date !== null &&
            classification.due_date !== undefined
              ? classification.due_date
              : existingTask.due_date;

          const updatedValue =
            classification.deal_value_inr !== null &&
            classification.deal_value_inr !== undefined
              ? classification.deal_value_inr
              : existingTask.deal_value_inr;

          const updatedCompany =
            classification.company_name !== null &&
            classification.company_name !== undefined
              ? classification.company_name
              : existingTask.company_name;

          const updatedConfidence =
            classification.confidence ||
            existingTask.confidence;

          await db.tasks.updateOne(
            {
              task_id:
                existingTask.task_id
            },
            {
              $set: {
                title: updatedTitle,
                description: updatedDesc,
                assignee_id: updatedAssignee,
                category: updatedCategory,
                priority: updatedPriority,
                due_date: updatedDueDate,
                deal_value_inr: updatedValue,
                company_name: updatedCompany,
                confidence: updatedConfidence,
                updated_at:
                  getIndianTimestamp()
              }
            }
          );

          await db.processedEmails.insertOne({

            candidate_id: normCandidateId,

            email_id:
              email.email_id,

            thread_id:
              email.thread_id,

            from_name:
              email.from_name,

            from_email:
              email.from_email,

            subject:
              email.subject,

            body:
              email.body,

            received_at:
              email.received_at,

            run_id: runId,

            status: "updated_task",

            decision_category:
              classification.category,

            decision_priority:
              classification.priority,

            decision_assignee:
              classification.assignee_id,

            decision_confidence:
              classification.confidence,

            decision_reasoning:
              classification.reasoning,

            associated_task_id:
              existingTask.task_id
          });

          // Update in-memory task
          const index =
            activeTasks.findIndex(
              task =>
                task.task_id ===
                existingTask.task_id
            );

          if (index !== -1) {

            activeTasks[index] = {
              ...activeTasks[index],
              title: updatedTitle,
              description: updatedDesc,
              assignee_id: updatedAssignee,
              category: updatedCategory,
              priority: updatedPriority,
              due_date: updatedDueDate,
              deal_value_inr: updatedValue,
              company_name: updatedCompany,
              confidence: updatedConfidence
            };
          }

          tasksUpdated++;

        }

        // ------------------------------------------------
        // 6. Create new task
        // ------------------------------------------------

        else {

          const taskId =
            generateTaskId();

          const createdAt =
            getIndianTimestamp();

          const task = {

            task_id:
              taskId,

            candidate_id:
              normCandidateId,

            source_email_id:
              email.email_id,

            thread_id:
              email.thread_id,

            title:
              classification.title ||
              email.subject,

            description:
              classification.description ||
              email.body,

            assignee_id:
              classification.assignee_id ||
              "u_triage",

            category:
              classification.category ||
              "triage",

            priority:
              classification.priority ||
              "medium",

            due_date:
              classification.due_date ||
              null,

            deal_value_inr:
              classification.deal_value_inr !== undefined
                ? classification.deal_value_inr
                : null,

            company_name:
              classification.company_name ||
              null,

            confidence:
              classification.confidence ||
              0.5,

            created_at:
              createdAt
          };

          await db.tasks.insertOne(task);

          await db.processedEmails.insertOne({

            candidate_id:
              normCandidateId,

            email_id:
              email.email_id,

            thread_id:
              email.thread_id,

            from_name:
              email.from_name,

            from_email:
              email.from_email,

            subject:
              email.subject,

            body:
              email.body,

            received_at:
              email.received_at,

            run_id:
              runId,

            status:
              "created_task",

            decision_category:
              classification.category ||
              "triage",

            decision_priority:
              classification.priority ||
              "medium",

            decision_assignee:
              classification.assignee_id ||
              "u_triage",

            decision_confidence:
              classification.confidence ||
              0.5,

            decision_reasoning:
              classification.reasoning ||
              "",

            associated_task_id:
              taskId
          });

          // Add to active tasks
          activeTasks.push(task);

          tasksCreated++;
        }

        processedCount++;

      } catch (err) {

        console.error(
          `Error processing email ${email.email_id}:`,
          err
        );

        errors.push({
          email_id: email.email_id,
          error: err.message
        });
      }
    }

    // ------------------------------------------------
    // Record processing run
    // ------------------------------------------------

    await db.runs.insertOne({

      run_id: runId,

      candidate_id:
        normCandidateId,

      timestamp:
        startTime,

      emails_count:
        processedCount,

      tasks_created:
        tasksCreated,

      tasks_updated:
        tasksUpdated,

      skipped_count:
        skippedCount
    });

    return res.status(200).json({

      run_id: runId,

      processed:
        processedCount,

      tasks_created:
        tasksCreated,

      tasks_updated:
        tasksUpdated,

      skipped:
        skippedCount,

      errors
    });

  } catch (err) {

    console.error(
      "Error during ingestion:",
      err
    );

    return res.status(500).json({
      error: "ingestion_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// GET /api/tasks
// --------------------------------------------------

router.get('/api/tasks', async (req, res) => {

  const { candidate_id } =
    req.query;

  if (!candidate_id) {
    return res.status(400).json({
      error:
        "candidate_id query parameter is required"
    });
  }

  try {

    const normalizedCandidate =
      normalizeEmail(candidate_id);

    const tasks =
      await db.tasks
        .find({
          candidate_id:
            normalizedCandidate
        })
        .sort({
          created_at: -1
        })
        .toArray();

    // Get associated processed email
    // information for each task
    const result = [];

    for (const task of tasks) {

      const email =
        await db.processedEmails.findOne({
          associated_task_id:
            task.task_id
        });

      result.push({
        ...task,

        from_name:
          email?.from_name || null,

        from_email:
          email?.from_email || null,

        subject:
          email?.subject || null,

        received_at:
          email?.received_at || null,

        decision_reasoning:
          email?.decision_reasoning || null,

        run_id:
          email?.run_id || null
      });
    }

    return res.status(200).json(result);

  } catch (err) {

    console.error(
      "Database error fetching api tasks:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// GET /api/stats
// --------------------------------------------------

router.get('/api/stats', async (req, res) => {

  try {

    // Category breakdown
    const categories =
      await db.processedEmails
        .aggregate([
          {
            $group: {
              _id: "$decision_category",
              count: {
                $sum: 1
              }
            }
          },
          {
            $project: {
              _id: 0,
              category: "$_id",
              count: 1
            }
          },
          {
            $sort: {
              count: -1
            }
          }
        ])
        .toArray();

    // Status breakdown
    const statuses =
      await db.processedEmails
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1
              }
            }
          },
          {
            $project: {
              _id: 0,
              status: "$_id",
              count: 1
            }
          },
          {
            $sort: {
              count: -1
            }
          }
        ])
        .toArray();

    // Spurious count
    const spurious =
      await db.processedEmails.countDocuments({
        status: {
          $in: [
            "created_task",
            "updated_task"
          ]
        },
        decision_category: {
          $in: [
            "spam",
            "ooo",
            "newsletter"
          ]
        }
      });

    // Runs
    const runsList =
      await db.runs
        .find({})
        .sort({
          timestamp: -1
        })
        .toArray();

    // Total processed
    const totalProcessed =
      await db.processedEmails.countDocuments({});

    return res.status(200).json({

      total_processed:
        totalProcessed,

      categories,

      statuses,

      spurious_count:
        spurious,

      spurious_rate:
        totalProcessed > 0
          ? spurious / totalProcessed
          : 0,

      runs:
        runsList
    });

  } catch (err) {

    console.error(
      "Database error fetching stats:",
      err
    );

    return res.status(500).json({
      error: "database_error",
      message: err.message
    });
  }
});

// --------------------------------------------------
// POST /api/chat
// --------------------------------------------------

router.post('/api/chat', async (req, res) => {

  const {
    candidate_id,
    query
  } = req.body;

  if (!candidate_id) {
    return res.status(400).json({
      error: "missing candidate_id"
    });
  }

  if (!query) {
    return res.status(400).json({
      error: "missing query"
    });
  }

  try {

    const result =
      await handleChatQuery(
        candidate_id,
        query
      );

    return res.status(200).json(result);

  } catch (err) {

    console.error(
      "Error in POST /api/chat:",
      err
    );

    return res.status(500).json({

      answer:
        "An unexpected error occurred while processing your query.",

      supporting_data: {
        error: err.message
      }
    });
  }
});

// --------------------------------------------------

export default router;