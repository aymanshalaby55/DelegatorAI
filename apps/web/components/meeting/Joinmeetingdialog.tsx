// components/JoinMeetingDialog.tsx
"use client";

import { useState } from "react";
import { Video, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useJoinMeeting } from "@/hooks/use-meeting";

const microsoftUrlRegex =
  /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.+$/i;
const googleUrlRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;

const schema = z.object({
  title: z.string().optional(),
  meeting_url: z
    .string()
    .min(1, "Meeting URL is required")
    .refine((val) => microsoftUrlRegex.test(val) || googleUrlRegex.test(val), {
      message: "Must be a valid Microsoft Teams or Google Meet URL",
    }),
});

type FormValues = z.infer<typeof schema>;

export function JoinMeetingDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: joinMeeting, isPending } = useJoinMeeting();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", meeting_url: "" },
  });

  function onSubmit(values: FormValues) {
    joinMeeting(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        setOpen(v);
        if (!v) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Join a Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Join a Meeting</DialogTitle>
          <DialogDescription>
            Enter the meeting details below to send the AI delegator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Meeting Title{" "}
                  <span className="text-xs text-muted-foreground">
                    (Optional)
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Sprint Planning"
                  className="bg-muted border-border"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="meeting_url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Meeting URL{" "}
                  <span className="text-xs text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="https://zoom.us/j/..."
                  className="bg-muted border-border"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Supports Zoom, Google Meet, and Microsoft Teams.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="submit" className="w-full gap-2" disabled={isPending}>
              <Video className="h-4 w-4" />
              {isPending ? "Sending..." : "Send Delegator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
