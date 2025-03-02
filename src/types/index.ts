import { Doc } from '../../convex/_generated/dataModel';

export type Poll = Doc<"polls"> & {
  questions: (Doc<"pollQuestions"> & {options: Doc<"pollOptions">[]})[];
};
