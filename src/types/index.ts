// src/types/index.ts

export type IPoll = {
  created_at: string;
  created_by: string;
  description: string | null;
  end_date: string;
  id: string;
  title: string;
  updated_at: string | null;
  users: {
    avatar_url: string | null;
    email: string | null;
    id: string;
    user_name: string | null;
  } | null;
  questions?: IPollQuestion[];
};

export type IPollQuestion = {
  id: string;
  created_at: string;
  poll_id: string;
  question_text: string;
  position: number;
  options?: IPollOption[];
};

export type IPollOption = {
  id: string;
  created_at: string;
  option: string;
  question_id: string;
  count: number;
};

export type IPollLog = {
  id: string;
  created_at: string;
  option: string;
  poll_id: string;
  question_id: string;
  user_id: string;
};

// For the existing IPolls type, update to include the questions array
export type IPolls = {
  created_at: string;
  created_by: string;
  description: string | null;
  end_date: string;
  id: string;
  title: string;
  updated_at: string | null;
  questions?: IPollQuestion[];
}[];

// Type for the DB structure in supabase.ts - you may need to update this file as well
export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  links: {
    github: string;
  };
};

// Form types for creating a multi-question poll
export type MultiQuestionPollFormData = {
  title: string;
  description?: string;
  end_date: Date;
  questions: {
    question_text: string;
    options: string[];
  }[];
};

// Type for vote submission
export type VoteSubmission = {
  question_id: string;
  option: string;
};
