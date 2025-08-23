import { BackButton } from '@/components/back-button';

export default function ArticlesPage() {
  return (
    <div className="container py-8">
        <div className="max-w-3xl mx-auto">
             <BackButton title="Articles" description="Tips and guides for getting the most out of CharaForge."/>
             <article className="mt-8 prose dark:prose-invert max-w-none">
                <h2 className="text-3xl font-bold font-headline">Mastering the Prompt: Writing for AI</h2>
                <p className="lead">
                    Writing a good prompt is more of an art than a science. The key is to be both specific and evocative. Instead of "a fantasy warrior", try "a grizzled female dwarf warrior with a braided beard, wielding a glowing battle-axe, standing on a snowy mountain peak".
                </p>

                <h3 className="text-2xl font-bold font-headline mt-8">Key Principles</h3>
                <ol className="list-decimal list-inside space-y-4">
                    <li>
                        <strong>Specificity is King:</strong> The more detail you provide, the better the AI can interpret your vision. Mention colors, materials, lighting, and mood.
                    </li>
                    <li>
                        <strong>Use Strong Verbs:</strong> Instead of "holding a sword", try "wielding a sword" or "clutching a sword" to create more dynamic imagery.
                    </li>
                    <li>
                        <strong>Combine Concepts:</strong> Don't be afraid to mix genres! "A cyber-sorcerer with neon-lit robes" is more interesting than just "a sorcerer".
                    </li>
                    <li>
                        <strong>Reference Artists or Styles:</strong> If you want a specific look, mention it. For example, add "in the style of Greg Rutkowski" or "trending on ArtStation" to guide the AI.
                    </li>
                </ol>
             </article>
        </div>
    </div>
  );
}
