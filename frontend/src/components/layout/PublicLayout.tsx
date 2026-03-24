import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function PublicLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
