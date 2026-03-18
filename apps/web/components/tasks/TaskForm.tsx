"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

const schema = z.object({
  taskPrompt: z
    .string()
    .min(10, "Please describe your task in at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { taskPrompt: "" },
  });

  function handleSubmit(values: FormValues) {
    onSubmit(values.taskPrompt);
    form.reset();
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="glass rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold text-foreground">
          New Task
        </h2>
      </div>

      <Field data-invalid={!!form.formState.errors.taskPrompt}>
        <FieldLabel htmlFor="taskPrompt">Describe what you need done</FieldLabel>
        <Textarea
          id="taskPrompt"
          {...form.register("taskPrompt")}
          placeholder="e.g. Build a REST API for user authentication with JWT, rate limiting, and email verification"
          className="bg-muted border-border min-h-[100px] resize-none"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.taskPrompt}
        />
        <FieldDescription>
          Describe your goal in plain language — the AI will break it into
          subtasks and create GitHub issues.
        </FieldDescription>
        {form.formState.errors.taskPrompt && (
          <FieldError errors={[form.formState.errors.taskPrompt]} />
        )}
      </Field>

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={isLoading}
      >
        <Sparkles className="h-4 w-4" />
        {isLoading ? "Processing…" : "Delegate Task"}
      </Button>
    </form>
  );
}
