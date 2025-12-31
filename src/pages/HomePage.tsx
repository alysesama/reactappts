import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <section>
            <h1>Home</h1>
            <p>
                Core skeleton (Vite + React TS + HashRouter)
            </p>
            <Link to="/workspace">Go to Workspace</Link>
        </section>
    );
}
