'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="card"><h1>Unable to load this page</h1><p>Check the database connection and retry.</p><button onClick={reset}>Try again</button></section>;}
