import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

export interface OTPInputProps {
  length: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function OtpInput({
  length,
  onComplete,
  disabled = false,
  autoFocus = true,
  className,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(() => Array.from({ length }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setOtp(Array.from({ length }, () => ""));
    inputRefs.current = Array.from({ length }, () => null);
  }, [length]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const lastSubmittedOtpRef = useRef<string | null>(null);

  const isComplete = useMemo(() => otp.every((digit) => digit !== ""), [otp]);

  useEffect(() => {
    const fullOtp = otp.join("");
    if (fullOtp.length === length && isComplete) {
      if (lastSubmittedOtpRef.current !== fullOtp) {
        lastSubmittedOtpRef.current = fullOtp;
        onCompleteRef.current(fullOtp);
      }
    } else {
      lastSubmittedOtpRef.current = null;
    }
  }, [otp, isComplete, length]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextValue = value.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = nextValue;
    setOtp(nextOtp);

    if (nextValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length - index);
    if (!pasted) return;

    event.preventDefault();
    const nextOtp = [...otp];
    pasted.split("").forEach((digit, offset) => {
      nextOtp[index + offset] = digit;
    });
    setOtp(nextOtp);

    const nextIndex = Math.min(index + pasted.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn("flex flex-wrap gap-2.5 justify-center", className)}>
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(event, index)}
          className="h-12 w-12 rounded-xl text-center text-lg font-bold border-2 focus-visible:border-primary shadow-sm"
        />
      ))}
    </div>
  );
}
export { OtpInput };
