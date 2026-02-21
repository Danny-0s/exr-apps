import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";
import StoreFooter from "../components/StoreFooter";

export default function StoreLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-black text-white">

            {/* TOP NAVBAR */}
            <Navbar />

            {/* PAGE CONTENT */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* FOOTER */}
            <StoreFooter />

        </div>
    );
}