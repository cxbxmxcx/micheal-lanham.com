export interface Demo {
  slug: string
  title: string
  description: string
  outcome: string
  duration: string
  device: string
  poster: string
  playUrl: string
  kind: 'Browser' | 'Unity WebGL'
  bookSlug?: string
  /** The concept games' engine card in the home lab: its subject, and readouts
   * that state facts about the game (not scores). */
  engine?: { kicker: string; gauges: [string, string][] }
}

export const DEMOS: Demo[] = [
  { slug: 'selection-engine', title: 'The Selection Engine', description: 'Define what good is, measure the gap, and let a search breed better versions.', outcome: 'See why proof beats opinion when it exists, how a judge can be gamed, and how an archive of variants escapes a false peak.', duration: 'About 8 minutes', device: 'Phone, tablet, or desktop', poster: '/demo-selection-engine.webp', playUrl: '/demos/Selection_Engine/index.html', kind: 'Browser', bookSlug: 'self-improving-agents', engine: { kicker: 'Self-Improving Agents', gauges: [['Signal', 'Proof'], ['Search', 'DGM']] } },
  { slug: 'instinct-engine', title: 'The Instinct Engine', description: 'Be the harness around a frozen language model and turn slow reasoning into fast instinct.', outcome: 'Route tasks between fast and slow thinking, write memories, move settled decisions to Jev, and catch a memory that has gone stale.', duration: 'About 6–8 minutes', device: 'Phone, tablet, or desktop', poster: '/demo-instinct-engine.webp', playUrl: '/demos/Instinct_Engine/index.html', kind: 'Browser', bookSlug: 'instinctual-learning-agent-harness', engine: { kicker: 'The Instinctual Learning Agent Harness', gauges: [['Model', 'Frozen'], ['Routes', '4']] } },
  { slug: 'difference-engine', title: 'The Difference Engine', description: 'Learn how to learn: find the rule that rebuilds a times table, then let it print a bigger one.', outcome: 'Watch counting become recall, see why memorizing is not learning, and search for a method that generalizes beyond what it was shown.', duration: 'Self-paced', device: 'Phone, tablet, or desktop', poster: '/demo-difference-engine.webp', playUrl: '/demos/Difference_Engine/index.html', kind: 'Browser', bookSlug: 'instinctual-learning-agent-harness', engine: { kicker: 'Metacognition', gauges: [['Table', '10 × 10'], ['Held back', '9']] } },
  { slug: 'perceptron', title: 'The Perceptron Game', description: 'Set weights by hand and watch a single perceptron fit data.', outcome: 'Build an intuition for weights, decision boundaries, and what a single neuron can learn.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-perceptron.webp', playUrl: '/demos/Perceptron_Game/index.html', kind: 'Unity WebGL' },
  { slug: 'multilayer-perceptron', title: 'The Multilayer Perceptron Game', description: 'Add hidden layers and explore what a larger network can learn.', outcome: 'See how hidden layers let a network represent relationships a single perceptron cannot.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-mlp.webp', playUrl: '/demos/MLP_Game/index.html', kind: 'Unity WebGL' },
  { slug: 'autoencoder', title: 'The Autoencoder Game', description: 'Watch an encoder and decoder learn a compressed representation.', outcome: 'Explore how a network compresses its input and reconstructs information from that representation.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-autoencoder.webp', playUrl: '/demos/Autoencoder_Game/index.html', kind: 'Unity WebGL' },
]

/** "How to play" steps and a text description for the Unity games, which
 * otherwise expose nothing but an unlabelled canvas. Written from the games
 * as they run; the standalone pages in public/demos/ repeat this text, so
 * keep them in step. */
export const UNITY_GUIDES: Record<string, { steps: string[]; summary: string }> = {
  perceptron: {
    steps: [
      'Select one of the three training examples on the left. Its two values become the inputs, and its label becomes the expected output.',
      'To change a weight, click its box and type a value, or drag on the box.',
      'Watch the weighted sum, Output, Expected and Loss update as the weights change.',
      'Try to find one set of weights that brings the loss to 0.00 for all three examples.',
    ],
    summary: 'A single perceptron with three inputs. The top input is always 1.0, so its weight acts as the bias; the other two take the values of the training example you select. Each input is multiplied by its weight, the products are added, and the sum passes through a linear (purelin) activation. The panel on the right compares the result with the example’s label and shows the loss.',
  },
  'multilayer-perceptron': {
    steps: [
      'Select a training example at the left edge of the game. Its two values feed both perceptrons in the hidden layer.',
      'To change a weight, click its box and type a value, or drag on the box.',
      'Follow each sum and output from the hidden layer to the final output on the right.',
    ],
    summary: 'Two perceptrons form a hidden layer, and a third perceptron combines their outputs. Each perceptron has a fixed input of 1.0 for its bias, multiplies its inputs by its weights, adds the products, and passes the sum through the activation shown in its small graph. The training example you select feeds both hidden perceptrons, and their outputs become the inputs of the last one.',
  },
  autoencoder: {
    steps: [
      'Select a training example at the left edge of the game. Its two values feed both encoder perceptrons.',
      'To change a weight, click its box and type a value, or drag on the box.',
      'Adjust the encoder and decoder weights until the two outputs on the right reproduce the example’s two values.',
    ],
    summary: 'Two encoder perceptrons each read the selected example’s two values and produce one number; together those two numbers are the code. Two decoder perceptrons read the code and produce the two outputs on the right. Each perceptron has a fixed bias input of 1.0, multiplies its inputs by its weights, adds the products, and applies the activation shown in its small graph.',
  },
}
export const UNITY_CONTROLS = 'You need a mouse or trackpad: the game area can’t be reached with the keyboard alone.'

/** Demos retired on 2026-11-01. Their old site pages redirect to the game
 * that replaced them (written by scripts/prerender.mjs); their old player
 * pages in public/demos/ redirect as well. */
export const RETIRED_DEMOS: Record<string, string> = { 'proof-gate': 'selection-engine', 'helix-garden': 'selection-engine' }
