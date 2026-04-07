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
  functions: FunctionInfo[];
  loops: number;
  time_complexity: string | null;
  space_complexity: string | null;
  narration_script: string[];
  logic_timeline: StepLog[];
  timeline_steps: number;
  error?: string;
}
