import { Link, Outlet } from "react-router-dom";

export default function RootLayout() {
    return (
        <div style={{ padding: 16 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                }}
            >
                <strong>React TSX</strong>
                <nav style={{ display: "flex", gap: 8 }}>
                    <Link to="/">Home</Link>
                    <Link to="/workspace">Workspace</Link>
                </nav>
            </header>

            <main style={{ marginTop: 16 }}>
                <Outlet />
            </main>
        </div>
    );
}
