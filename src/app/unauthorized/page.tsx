import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="text-gray-500">You don&apos;t have permission to access this page.</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
