"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Send, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { useSendSlackMessage } from "@/hooks/useIntegrations";
import { useSlackChannels } from "@/hooks/useIntegrations";

const schema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  channel: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SlackMessageForm() {
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
  const { mutate: send, isPending } = useSendSlackMessage();
  const { data: channels = [], isLoading: loadingChannels } = useSlackChannels(
    channelPickerOpen,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: "", channel: undefined },
  });

  function handleSubmit(values: FormValues) {
    send(
      { text: values.message, channel: values.channel || undefined },
      {
        onSuccess: () => form.reset(),
      },
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="glass rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-4 w-4 text-green-500" />
        <h2 className="font-display text-base font-semibold text-foreground">
          Send Slack Message
        </h2>
      </div>

      {/* Message */}
      <Field data-invalid={!!form.formState.errors.message}>
        <FieldLabel htmlFor="slack-message">Message</FieldLabel>
        <Textarea
          id="slack-message"
          {...form.register("message")}
          placeholder="Type your message…"
          className="bg-muted border-border min-h-[80px] resize-none"
          disabled={isPending}
          aria-invalid={!!form.formState.errors.message}
        />
        {form.formState.errors.message && (
          <FieldError errors={[form.formState.errors.message]} />
        )}
      </Field>

      {/* Channel (optional) */}
      <Field>
        <FieldLabel htmlFor="slack-channel">
          Channel{" "}
          <span className="text-muted-foreground font-normal">(optional — uses default if blank)</span>
        </FieldLabel>
        <Select
          onOpenChange={(open) => setChannelPickerOpen(open)}
          onValueChange={(val) => form.setValue("channel", val)}
          disabled={isPending}
        >
          <SelectTrigger
            id="slack-channel"
            className="bg-muted border-border text-sm"
          >
            <SelectValue placeholder="Use default channel" />
            <ChevronDown className="h-4 w-4 opacity-50 ml-auto" />
          </SelectTrigger>
          <SelectContent>
            {loadingChannels ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading channels…
              </div>
            ) : channels.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No channels found
              </div>
            ) : (
              channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  # {ch.name}
                  {ch.is_private && (
                    <span className="ml-1 text-muted-foreground text-xs">
                      (private)
                    </span>
                  )}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </Field>

      <Button
        type="submit"
        variant="outline"
        className="w-full gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:border-green-500/60"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending ? "Sending…" : "Send to Slack"}
      </Button>
    </form>
  );
}
