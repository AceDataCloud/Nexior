export type ISkillType = 'prompt' | 'workflow' | 'code';

export interface ISkill {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  type: ISkillType;
  instructions?: string;
  steps?: IWorkflowStep[];
  code?: string;
  required_tools?: string[];
  tags: string[];
  is_builtin: boolean;
  is_public: boolean;
  user_id?: string;
  created_at: number;
  updated_at: number;
}

export interface IWorkflowStep {
  tool: string;
  args: Record<string, unknown>;
  output?: string;
  condition?: string;
}

export interface ISkillListResponse {
  items: ISkill[];
}
