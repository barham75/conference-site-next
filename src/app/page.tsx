export default function HomePage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Conference Site</h1>
      <p>Welcome to the conference website.</p>

      <ul>
        <li><a href="/register">Register</a></li>
        <li><a href="/program">Program</a></li>
        <li><a href="/poster-vote">Poster Vote</a></li>
        <li><a href="/evaluation">Evaluation</a></li>
        <li><a href="/supporters">Supporters</a></li>
      </ul>
    </main>
  );
}
