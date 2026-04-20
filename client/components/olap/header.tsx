import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-white shadow flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="font-bold text-xl text-blue-700">OLAP_WEB</span>
      </div>
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-gray-700 hover:text-blue-700 font-medium">
          Tổng quan
        </Link>
        <Link href="/olap" className="text-gray-700 hover:text-blue-700 font-medium">
          Phân tích OLAP
        </Link>
      </nav>
    </header>
  );
}
