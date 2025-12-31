import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <section>
            <h1>404</h1>
            <Link to="/">Back Home</Link>
        </section>
    );
}
