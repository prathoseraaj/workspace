export interface FunctionInfo {
  name: string;
  args: string[];
  line_start: number;
  line_end: number;
}

export interface VariableChange {
  variable_name: string;
  new_value: string;
}

export interface StepLog {
  step_number: number;
  description: string;
  code_snippet: string;
  variable_changes: VariableChange[];
}

export interface AnalyzeResponse {
  language: string;
  functions: FunctionInfo[];
  loops: number;
  time_complexity: string | null;
  space_complexity: string | null;
  narration_script: string[];
  logic_timeline: StepLog[];
  timeline_steps: number;
  error?: string;
  /** Present when the backend auto-corrected the code's indentation. */
  fixed_code?: string;
}

// ── Language support types ────────────────────────────────────────────────────

export interface SupportedLanguage {
  key: string;
  label: string;
  ext: string;
}

// ── Step Tracer types ─────────────────────────────────────────────────────────

export interface TraceMemoryState {
  variables: Record<string, unknown>;
}

export interface TraceStep {
  step_number: number;
  line_number: number;
  description: string;
  memory: TraceMemoryState;
  is_loop_iteration: boolean;
  loop_label: string | null;
  highlight_type: 'normal' | 'branch_true' | 'branch_false' | 'swap' | 'return' | 'call';
}

export interface TraceResult {
  title: string;
  language: string;
  source_lines: string[];
  tracked_variables: string[];
  steps: TraceStep[];
  error?: string;
  /** Present when the backend auto-corrected the code's indentation. */
  fixed_code?: string;
}
