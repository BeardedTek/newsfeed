export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">About NewsFeed</h1>
      <p className="mb-4">
        <strong>NewsFeed</strong> is a modern, open-source news dashboard designed as a privacy-friendly alternative to Google News. Our mission is to provide you with a clean, fast, and unbiased way to read the news that matters to you—without the influence of hidden algorithms or commercial interests.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">No Algorithms. No Bias.</h2>
      <p className="mb-4">
        Unlike mainstream news aggregators, NewsFeed does not use opaque recommendation algorithms or personalized feeds that can reinforce filter bubbles or bias. All articles are shown in chronological order, deduplicated, and categorized for your convenience—never filtered or ranked based on your behavior.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Features</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Aggregates news from your own FreshRSS instance for full control and privacy</li>
        <li>OAuth2 login with Casdoor for secure authentication</li>
        <li>Modern, responsive UI built with Next.js and Flowbite</li>
        <li>Categories and related articles powered by local LLM (Ollama) for transparency</li>
        <li>No tracking, no ads, and no third-party analytics</li>
        <li>Open source and self-hostable</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Our Philosophy</h2>
      <p className="mb-4">
        We believe that news should be accessible, transparent, and free from manipulation. NewsFeed puts you in control—what you see is what's published, not what an algorithm thinks you should see.
      </p>
      <p>
        Thank you for using NewsFeed!
      </p>
    </div>
  );
} 