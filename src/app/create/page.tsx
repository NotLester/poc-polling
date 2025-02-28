"use client";

import {useMutation} from "convex/react";
import {Plus, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useToast} from "@/components/ui/use-toast";

import {api} from "../../../convex/_generated/api";

interface Question {
  text: string;
  options: string[];
  status: "published" | "inactive";
}

export default function CreatePoll() {
  const router = useRouter();
  const {toast} = useToast();
  const createPoll = useMutation(api.polls.createPoll);

  const [title, setTitle] = useState("");
  const [pollStatus, setPollStatus] = useState<
    "published" | "unpublished" | "inactive"
  >("unpublished");
  const [questions, setQuestions] = useState<Question[]>([
    {text: "", options: ["", ""], status: "inactive"},
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {text: "", options: ["", ""], status: "inactive"},
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push("");
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  const updateQuestionStatus = (
    index: number,
    status: "published" | "inactive"
  ) => {
    const newQuestions = [...questions];
    newQuestions[index].status = status;
    setQuestions(newQuestions);
  };

  const updateOptionText = (
    questionIndex: number,
    optionIndex: number,
    text: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = text;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll title",
        variant: "destructive",
      });
      return;
    }

    const isValid = questions.every(q => {
      return (
        q.text.trim() !== "" &&
        q.options.length >= 2 &&
        q.options.every(o => o.trim() !== "")
      );
    });

    if (!isValid) {
      toast({
        title: "Error",
        description:
          "Please fill in all questions and ensure each has at least 2 options",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPoll({
        title,
        status: pollStatus,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
          status: q.status,
        })),
      });

      toast({
        title: "Success",
        description: "Poll created successfully",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter poll title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pollStatus">Poll Status</Label>
              <Select
                value={pollStatus}
                onValueChange={(
                  value: "published" | "unpublished" | "inactive"
                ) => setPollStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={qIndex}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 mr-4">
                        <Label>Question {qIndex + 1}</Label>
                        <Input
                          value={question.text}
                          onChange={e =>
                            updateQuestionText(qIndex, e.target.value)
                          }
                          placeholder="Enter your question"
                          className="mt-2"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-[180px]">
                          <Label>Status</Label>
                          <Select
                            value={question.status}
                            onValueChange={(value: "published" | "inactive") =>
                              updateQuestionStatus(qIndex, value)
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">
                                Published
                              </SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="mt-8"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={e =>
                              updateOptionText(qIndex, oIndex, e.target.value)
                            }
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              <Button type="submit">Create Poll</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
