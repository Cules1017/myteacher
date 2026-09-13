import { Sparkles } from "lucide-react";

function ComingSoon({ text }) {
  return (
    <div className="mt-10 rounded-3xl border border-border bg-transparent px-6 py-16 text-center text-text-muted">
      <Sparkles className="mx-auto mb-3 h-6 w-6 text-amber-300" strokeWidth={2} />
      {text}
    </div>
  );
}

export default ComingSoon;
