"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  placeholder = "補充你的觀點、例子，或直接分享你會怎樣回答。",
}: CommentFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const inputId = `comment-${postId}-${parentId ?? "root"}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setFormError("請先登入，再發佈這份回覆。");
      toast.error("登入後才可以回覆");
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (content.trim().length < 2) {
      setFormError("回覆內容至少需要 2 個字。");
      toast.error("回覆內容至少需要 2 個字");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("request failed");
      }

      setContent("");
      toast.success("已發佈回覆");
      router.refresh();
    } catch {
      setFormError("發佈回覆失敗，內容仍保留在輸入框，請稍後再試。");
      toast.error("發佈回覆失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor={inputId} className="sr-only">回覆內容</label>
      <Textarea
        id={inputId}
        aria-describedby={`${inputId}-help${formError ? ` ${inputId}-error` : ""}`}
        aria-invalid={Boolean(formError)}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        className="min-h-[140px] rounded-2xl border-neutral-200 bg-white px-4 py-3 text-[14px] leading-7 focus-visible:ring-neutral-400"
      />
      <div className="flex items-center justify-between gap-4">
        <p id={`${inputId}-help`} className="text-[12px] text-neutral-600">
          具體例子、立場比較、實戰表達會比泛泛而談更有價值。
        </p>
        <Button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="rounded-full bg-neutral-900 px-5 text-[13px] text-white hover:bg-neutral-800"
        >
          <SendHorizontal className="h-4 w-4" />
          發佈回覆
        </Button>
      </div>
      {formError ? <p id={`${inputId}-error`} role="alert" className="text-sm text-[#a74231]">{formError}</p> : null}
    </form>
  );
}
