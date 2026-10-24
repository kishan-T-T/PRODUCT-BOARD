import Link from "next/link";
import { LogoMark } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <LogoMark className="h-10 w-10 text-indigo-600" />
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        It may have been deleted, or you might not have access to this project.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/projects" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Go to projects
        </Link>
        <Link href="/" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Home
        </Link>
      </div>
    </div>
  );
}
