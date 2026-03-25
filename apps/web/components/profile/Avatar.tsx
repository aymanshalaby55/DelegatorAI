import Image from "next/image";
import type { User } from "@supabase/supabase-js";

interface AvatarProps {
  user: User;
}

export function Avatar({ user }: AvatarProps) {
  const initial = (user.email ?? user.id).charAt(0).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt="Avatar"
        className="h-20 w-20 rounded-2xl object-cover"
        width={80}
        height={80}
      />
    );
  }

  return (
    <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary select-none">
      {initial}
    </div>
  );
}
