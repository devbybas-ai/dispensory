"use client";

import { useState } from "react";

export function DenialHandler({ children }: { children: React.ReactNode }) {
  const [denied, setDenied] = useState(false);

  if (denied) {
    return (
      <div className="text-center" role="alert">
        <p className="text-lg text-neutral-300">Sorry, you must be 21 or older to access this website.</p>
        <p className="mt-2 text-sm text-neutral-500">If you are 18 or older with a valid physician&apos;s recommendation, please visit us in store.</p>
      </div>
    );
  }

  return (
    <div>
      {children}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setDenied(true)}
          className="w-full rounded-lg border border-neutral-700 px-8 py-3 text-base font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 sm:w-auto"
        >
          No
        </button>
      </div>
    </div>
  );
}
