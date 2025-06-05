export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <p className="mb-4">We'd love to hear from you! Reach out to us using the information below:</p>
      <ul className="list-none pl-0 mb-4">
        <li className="mb-2">
          <span className="font-semibold">Email:</span>{' '}
          <a href="mailto:newsfeed@beardedtek.com" className="text-blue-600 hover:underline">newsfeed@beardedtek.com</a>
        </li>
        <li>
          <span className="font-semibold">GitHub:</span>{' '}
          <a href="https://github.com/beardedtek/newsfeed" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            github.com/beardedtek/newsfeed
          </a>
        </li>
      </ul>
      <p>
        We welcome feedback, bug reports, and contributions!
      </p>
    </div>
  );
} 