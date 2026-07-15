"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <h1>Ocorreu um erro</h1>
      <button onClick={() => reset()}>Tentar novamente</button>
    </main>
  );
}
