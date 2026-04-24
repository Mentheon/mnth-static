'use client';
import ReactTypingEffect from 'react-typing-effect';

export interface TypedContentProps {
  texts: string[];
}

export default function TypedContent({ texts }: TypedContentProps) {
  return (
    <div>
      <ReactTypingEffect
        text={texts}
        speed={100}
        eraseDelay={2000}
      />
    </div>
  );
}
