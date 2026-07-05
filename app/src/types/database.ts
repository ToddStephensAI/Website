export type UserRole = "admin" | "contractor" | "customer";
export type ProjectStage = "deposit" | "dno" | "installation" | "handover" | "complete";
export type TaskStatus = "open" | "done";

export const STAGE_LABELS: Record<ProjectStage, string> = {
  deposit: "Deposit",
  dno: "DNO Approval",
  installation: "Installation",
  handover: "Handover",
  complete: "Complete",
};

export const STAGE_ORDER: ProjectStage[] = [
  "deposit",
  "dno",
  "installation",
  "handover",
  "complete",
];

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  reference: string;
  customer_id: string | null;
  site_address: string;
  equipment_summary: string | null;
  stage: ProjectStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectContractor {
  project_id: string;
  contractor_id: string;
  assigned_at: string;
}

export interface Photo {
  id: string;
  project_id: string;
  uploaded_by: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  assigned_to: string | null;
  created_at: string;
}

export interface Signoff {
  id: string;
  project_id: string;
  signed_by_name: string;
  signature_data_url: string;
  signed_at: string;
}
