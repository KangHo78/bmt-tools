export type Role = "user" | "petugas" | "kepala_logistik" | "admin";
export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    institution?: string;
    phone?: string;
    token_quota: number;
    token_used: number;
}
export interface PageProps {
    auth: { user: User; canApprove: boolean };
    flash: { success?: string; error?: string };
    unreadCount: number;
    [key: string]: unknown;
}
export interface ToolType {
    id: number;
    code: string;
    name: string;
    size?: string;
    description?: string;
    rules_summary?: string;
    image_url?: string;
    catalog_image_url?: string | null;
    checklist?: string[];
    category?: { id: number; name: string };
    primary_location?: { id: number; name: string };
    units_count?: number;
    available_count?: number;
    units?: ToolUnit[];
}
export interface ToolUnit {
    id: number;
    asset_code: string;
    serial_number?: string;
    status: string;
    condition: string;
    owner?: string;
    location?: { id: number; name: string };
    tool_type?: ToolType;
}
export interface LoanItem {
    id: number;
    tool_type: ToolType;
    unit?: ToolUnit;
    return_status: string;
    checklist?: Record<string, boolean>;
    condition_out?: string;
    condition_in?: string;
    return_note?: string;
    physical_token?: { id: number; code: string; status: string };
}
export interface Borrower {
    id: number;
    name: string;
    institution?: string;
    phone?: string;
    identifier?: string;
    user?: Pick<User, "id" | "email">;
}
export interface Loan {
    id: number;
    trx_no: string;
    usage_type: "dalam_area" | "luar_area";
    purpose: string;
    location_text: string;
    start_date: string;
    due_date: string;
    created_at?: string;
    status: string;
    letter_url?: string;
    rejection_reason?: string;
    tokens_used: number;
    handover_at?: string;
    returned_at?: string;
    borrower: Borrower;
    approver?: User;
    items: LoanItem[];
    extensions?: any[];
}
