import { AuroraBackground } from "@/src/components/ui/aurora-background";
import { BackgroundBeams } from "@/src/components/ui/background-beams";
import { BackgroundLines } from "@/src/components/ui/background-lines";
import { FlipWords } from "@/src/components/ui/flip-words";
import { TextHoverEffect } from "@/src/components/ui/text-hover-effect";
import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const words = ["Investor", "Trader", "Financier"];
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="h-full flex flex-col items-center justify-center px-4 bg-neutral-200">
        <div className="text-center space-y-4 pt-16">
          <h1 className="font-bold text-3xl font-white">
            Welcome Back
            <br />
            <FlipWords words={words} />
          </h1>
          <p className="text-base text-primary">
            Log in or Create account to get back to your dashboard
          </p>
        </div>
        <div className="flex items-center justify-center mt-8 z-50">
          <ClerkLoading>
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignIn />
          </ClerkLoaded>
        </div>
        <BackgroundBeams />
      </div>
      <div className="hidden lg:block">
        <AuroraBackground>
          <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
            <Image
              src="/images/full_logo.svg"
              alt="Sign In"
              width={500}
              height={500}
              className="invert"
            />
          </div>
        </AuroraBackground>
      </div>
    </main>
  );
}
