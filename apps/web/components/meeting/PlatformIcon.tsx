export function PlatformIcon({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  if (platform === "Google Meet") {
    return (
      <img
        src="/icons/googlemeeting.png"
        alt="Google Meet"
        className={className}
        width={24}
        height={24}
        style={{ display: "inline-block" }}
      />
    );
  }

  // fallback
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#444" />
      <path
        d="M14 18a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H16a2 2 0 01-2-2V18z"
        fill="white"
      />
      <path d="M30 22l6-4v12l-6-4v-4z" fill="white" />
    </svg>
  );
}
