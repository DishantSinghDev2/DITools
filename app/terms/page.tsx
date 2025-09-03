export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6 text-pretty">Terms of Service</h1>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
        <p>
          By using this tool, you agree that you are responsible for the data you connect and actions you perform. Use
          least-privilege credentials. The tool is provided “as is” without warranties. DishIs Technologies is not
          liable for data loss or misuse.
        </p>
        <h2>Acceptable Use</h2>
        <ul className="list-disc pl-5">
          <li>No illegal use or unauthorized access.</li>
          <li>You must own or have permission to access connected databases.</li>
          <li>Respect rate limits and resource constraints.</li>
        </ul>
      </div>
    </main>
  )
}
