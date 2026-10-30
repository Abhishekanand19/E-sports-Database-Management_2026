import Link from 'next/link';
export default function NotFound(){return <section><h1>Record not found</h1><p>The requested record does not exist.</p><Link href="/tournaments">Browse tournaments</Link></section>;}
