"use client";

import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, TrashIcon, XCircle } from 'lucide-react';
import { MutableRefObject, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { createPollWithQuestions } from '@/lib/actions/poll';
import { cn, nextWeek } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

// Schema validation for the form
const FormSchema = z.object({
  title: z
    .string()
    .min(2, {message: "Title should be minimum of 2 characters"})
    .max(200, {message: "Title has a maximum characters of 200"}),
  description: z
    .string()
    .max(500, {message: "Description has a maximum of 500 characters"})
    .optional(),
  end_date: z.date({
    required_error: "Please select an end date for the poll",
  }),
  questions: z
    .array(
      z.object({
        question_text: z
          .string()
          .min(2, {message: "Question should be minimum of 2 characters"})
          .max(200, {message: "Question has a maximum of 200 characters"}),
        options: z
          .array(z.string())
          .min(2, {message: "Each question must have at least 2 options"})
          .max(10, {
            message: "A maximum of 10 options is allowed per question",
          }),
      })
    )
    .min(1, {message: "Please add at least one question"})
    .max(5, {message: "A maximum of 5 questions is allowed per poll"}),
});

export default function CreatePollForm() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const optionInputRef = useRef() as MutableRefObject<HTMLInputElement>;

  const createPollMutation = useMutation({
    mutationFn: createPollWithQuestions,
  });

  // Initialize the form with default values
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [
        {
          question_text: "",
          options: [],
        },
      ],
    },
  });

  // Helper to get current question
  const getCurrentQuestion = () => {
    return form.getValues("questions")[currentQuestionIndex];
  };

  // Add an option to the current question
  const addOption = () => {
    const optionText = optionInputRef.current.value.trim();
    if (!optionText) return;

    const currentOptions = [...getCurrentQuestion().options];

    // Check if option already exists
    if (currentOptions.includes(optionText)) {
      form.setError(`questions.${currentQuestionIndex}.options`, {
        type: "manual",
        message: "This option already exists for this question",
      });
      return;
    }

    // Add the new option
    const updatedQuestions = [...form.getValues("questions")];
    updatedQuestions[currentQuestionIndex].options = [
      ...currentOptions,
      optionText,
    ];
    form.setValue("questions", updatedQuestions);

    // Clear the input field
    optionInputRef.current.value = "";

    // Clear any errors
    form.clearErrors(`questions.${currentQuestionIndex}.options`);
  };

  // Remove an option from the current question
  const removeOption = (optionIndex: number) => {
    const updatedQuestions = [...form.getValues("questions")];
    const currentOptions = [...updatedQuestions[currentQuestionIndex].options];
    currentOptions.splice(optionIndex, 1);
    updatedQuestions[currentQuestionIndex].options = currentOptions;
    form.setValue("questions", updatedQuestions);
  };

  // Add a new question
  const addQuestion = () => {
    const currentQuestions = form.getValues("questions");
    if (currentQuestions.length >= 5) {
      toast.error("You cannot add more than 5 questions to a poll");
      return;
    }

    form.setValue("questions", [
      ...currentQuestions,
      {question_text: "", options: []},
    ]);
    setCurrentQuestionIndex(currentQuestions.length);
  };

  // Remove the current question
  const removeQuestion = (index: number) => {
    const questions = [...form.getValues("questions")];
    if (questions.length <= 1) {
      toast.error("A poll must have at least one question");
      return;
    }

    questions.splice(index, 1);
    form.setValue("questions", questions);

    // Adjust current index if needed
    if (currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(questions.length - 1);
    }
  };

  // Switch to a different question
  const switchToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Submit the form
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    // Check that all questions have at least 2 options
    const invalidQuestions = data.questions.filter(q => q.options.length < 2);
    if (invalidQuestions.length > 0) {
      toast.error("All questions must have at least 2 options");
      return;
    }

    toast.promise(createPollMutation.mutateAsync(data), {
      loading: "Creating your poll...",
      success: "Successfully created your poll",
      error: "Failed to create poll",
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full items-center gap-6"
      >
        {/* Poll Title */}
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem>
              <FormLabel>Poll Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter the title of your poll" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Poll Description */}
        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description for your poll (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date */}
        <FormField
          control={form.control}
          name="end_date"
          render={({field}) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date*</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={date => date < new Date() || date > nextWeek()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2 my-4">
          {form.getValues("questions").map((question, index) => (
            <Badge
              key={index}
              className={cn(
                "cursor-pointer",
                index === currentQuestionIndex
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-secondary hover:bg-secondary/80"
              )}
              onClick={() => switchToQuestion(index)}
            >
              Question {index + 1}
              {form.getValues("questions").length > 1 && (
                <XCircle
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    removeQuestion(index);
                  }}
                />
              )}
            </Badge>
          ))}

          <Badge
            variant="outline"
            className="cursor-pointer border-dashed border-primary text-primary hover:text-primary"
            onClick={addQuestion}
          >
            <PlusCircle className="mr-1 h-3 w-3" /> Add Question
          </Badge>
        </div>

        {/* Current Question */}
        <Card className="p-4">
          <CardContent className="p-0 space-y-4">
            {/* Question Text */}
            <FormField
              control={form.control}
              name={`questions.${currentQuestionIndex}.question_text`}
              render={({field}) => (
                <FormItem>
                  <FormLabel>Question {currentQuestionIndex + 1}*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What would you like to ask?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Options */}
            <FormField
              control={form.control}
              name={`questions.${currentQuestionIndex}.options`}
              render={() => (
                <FormItem>
                  <div>
                    <FormLabel>Options*</FormLabel>
                    <FormDescription>
                      Add at least 2 options for this question
                    </FormDescription>
                  </div>

                  {/* Display existing options */}
                  <div className="space-y-2">
                    {getCurrentQuestion()?.options.map(
                      (option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex justify-between items-center p-2 border rounded-md"
                        >
                          <span>{option}</span>
                          <TrashIcon
                            className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => removeOption(optionIndex)}
                          />
                        </div>
                      )
                    )}
                  </div>

                  {/* Add new option */}
                  <div className="flex mt-2">
                    <Input
                      ref={optionInputRef}
                      placeholder="Add an option"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                      className="mr-2"
                    />
                    <Button type="button" variant="outline" onClick={addOption}>
                      Add
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <LoadingButton
          type="submit"
          text="Create Poll"
          loading={createPollMutation.isPending}
          disabled={createPollMutation.isPending}
        />
      </form>
    </Form>
  );
}
