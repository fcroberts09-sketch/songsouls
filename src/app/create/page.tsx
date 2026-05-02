import { Suspense } from "react";
import CreateWizard from "@/components/CreateWizard";

export const metadata = {
  title: "Begin a song",
  description: "Tell us who the song is for. We'll write the first verse free.",
};

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
        </div>
      }
    >
      <CreateWizard />
    </Suspense>
  );
}
