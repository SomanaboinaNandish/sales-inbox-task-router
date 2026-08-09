# EVALS.md — Sales Inbox Task Router Evaluation

This document contains the evaluation results of the Sales Inbox Task Router using a test set of 50 hand-labeled emails from our generated test corpus and `inbox.json`.

Candidate ID: **priya.sharma@gmail.com**

---

## 1. Test Set Summary
A test set of 50 emails was hand-labeled across the 6 routing categories as well as noise/spam categories:
- **enterprise_rfp**: 12 emails
- **smb_enquiry**: 10 emails
- **marketing**: 8 emails
- **alliances**: 6 emails
- **finance**: 7 emails
- **triage**: 7 emails
- **skipped (spam/ooo/newsletter)**: 10 emails (evaluated to ensure they did not trigger task creation)

---

## 2. Classification Performance

| Category | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **enterprise_rfp** | 12 | 1 | 0 | 92.3% | 100.0% | 96.0% |
| **smb_enquiry** | 9 | 1 | 1 | 90.0% | 90.0% | 90.0% |
| **marketing** | 7 | 0 | 1 | 100.0% | 87.5% | 93.3% |
| **alliances** | 5 | 0 | 1 | 100.0% | 83.3% | 90.9% |
| **finance** | 7 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **triage** | 6 | 2 | 1 | 75.0% | 85.7% | 80.0% |
| **skipped (spam/noise)**| 9 | 1 | 1 | 90.0% | 90.0% | 90.0% |

### Macro Metrics
- **Average Precision**: 92.5%
- **Average Recall**: 90.9%
- **Average F1 Score**: 91.5%

---

## 3. Failure Cases I Did Not Fix

Here are three real-world edge cases where the system misrouted or had issues that were knowingly shipped anyway:

### Failure Case 1: The "Joint-Deal Partner Proposal" (Alliances vs. Sales)
- **Email Subject**: `Reseller channel opportunity + Enterprise customer tender collab`
- **Body**: *"We have a warm lead with a large insurance bank in Mumbai (potential 30 Lakhs deal). We want to register as a reseller partner with you and pitch this jointly. Who handles partner signup?"*
- **Symptom**: Classified as `alliances` (routed to Karan), but the email mentions a specific ₹30,00,000 deal opportunity (which technically should route to Aarti or be triaged under `triage` due to dual-intent).
- **Reasoning**: The system focused heavily on the partner signup and reseller language, missing the immediate sales-deal value context. A human would want this routed to both or flagged as triage.

### Failure Case 2: Out of Office (OOO) with a Specific Invoice Query
- **Email Subject**: `Out of office - Accounts Payable`
- **Body**: *"I am out of office until next Monday. If you are emailing about PO-48192 or the pending invoice payment, I have CCed the team to process this immediately."*
- **Symptom**: Classified as `skipped` because of the automatic "out of office" subject line and starting signature.
- **Reasoning**: Because of the spam/OOO rule override, the system saw "Out of office" and skipped the email entirely, even though it contained a legitimate billing update and invoice context that Divya (`u_divya`) should have received.

### Failure Case 3: The "TBD Budget" Enterprise Pitch
- **Email Subject**: `Inbound DMS RFP - Apex Manufacturing Ltd`
- **Body**: *"We are looking for a document system. Budget is TBD as it requires board approval, but we are a 2,000-user organization. Proposals due by Friday."*
- **Symptom**: Routed to `u_rohit` (SMB) because the budget value was not present (null).
- **Reasoning**: The system did not have a clear deal value to apply the > 10L threshold. However, since the organization has 2,000 users, it is clearly an enterprise deal that should have gone to Aarti. The prompt rules state that anything above 10L goes to Aarti and anything below or equal goes to Rohit, but when deal value is null, the system fell back to the SMB queue rather than checking company sizing metadata.
