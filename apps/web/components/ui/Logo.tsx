import Image from "next/image";
import LogoImg from "@/public/logo.jpg";

type LogoProps = {
  size: number;
  text?: boolean;
};

export function Logo({ size, text = true }: LogoProps) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src={LogoImg}
        alt="Meeting Delegator Logo"
        width={size}
        height={size}
        priority={true}
        className="rounded-full object-cover"
        style={{
          width: size,
          height: size,
        }}
      />
      {text && (
        <span
          className={`font-bold text-white font-sans ${size >= 38 ? "text-sl" : ""} whitespace-nowrap`}
        >
          Meeting Delegator
        </span>
      )}
    </span>
  );
}
