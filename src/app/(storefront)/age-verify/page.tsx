import { verifyAge } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Age Verification",
  description: "You must be 21 or older to enter this website.",
};

export default function AgeVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <AgeGateContent searchParams={searchParams} />;
}

async function AgeGateContent({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo || "/shop";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <a
        href="#age-question"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to age verification
      </a>

      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Dispensory</h1>
        <div className="mx-auto mt-3 h-0.5 w-16 bg-emerald-500" />
        <p className="mt-3 text-sm tracking-widest text-neutral-400 uppercase">Southern California</p>

        <div id="age-question" className="mt-12" role="main" tabIndex={-1}>
          <p className="text-lg text-neutral-300">Are you 21 years of age or older?</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <form
              action={async () => {
                "use server";
                await verifyAge(returnTo);
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:w-auto"
              >
                Yes, Enter
              </button>
            </form>

            <button
              type="button"
              className="w-full rounded-lg border border-neutral-700 px-8 py-3 text-base font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 sm:w-auto"
            >
              No
            </button>
          </div>
        </div>

        <footer className="mt-16 space-y-2 text-xs text-neutral-600">
          <p>This website contains content related to cannabis products. You must be 21 years of age or older to enter, or 18+ with a valid physician&apos;s recommendation.</p>
          <p>California Department of Cannabis Control Licensed Retailer</p>
        </footer>
      </div>
    </div>
  );
}
