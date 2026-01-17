"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="text-sm text-gray-500">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/sales" className="hover:text-gray-700">
            Sales
          </Link>
        </li>
        {segments.slice(1).map((seg, i) => (
          <li key={i} className="flex items-center gap-1">
            <span>/</span>
            <span className="capitalize text-gray-700 font-medium">
              {seg.replace("-", " ")}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
