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
}

export const DEMOS: Demo[] = [
  { slug: 'proof-gate', title: 'The Proof Gate', description: 'Decide when a self-improving machine has earned the right to change.', outcome: 'Explore the difference between a formal proof, a measured improvement, and a decision made under a limited budget.', duration: 'About 5 minutes', device: 'Phone, tablet, or desktop', poster: '/demo-proof-gate.webp', playUrl: '/demos/Proof_Gate/index.html', kind: 'Browser', bookSlug: 'self-improving-agents' },
  { slug: 'helix-garden', title: 'Helix Garden', description: 'Run an improvement loop around a population of learning creatures.', outcome: 'Observe, compare, and decide which changes to keep as agents move through a sense-plan-act-learn loop.', duration: '90-second introduction, then explore', device: 'Best on a tablet or desktop', poster: '/demo-helix-garden.webp', playUrl: '/demos/Helix_Garden/index.html', kind: 'Browser', bookSlug: 'self-improving-agents' },
  { slug: 'perceptron', title: 'The Perceptron Game', description: 'Set weights by hand and watch a single perceptron fit data.', outcome: 'Build an intuition for weights, decision boundaries, and what a single neuron can learn.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-perceptron.webp', playUrl: '/demos/Perceptron_Game/index.html', kind: 'Unity WebGL' },
  { slug: 'multilayer-perceptron', title: 'The Multilayer Perceptron Game', description: 'Add hidden layers and explore what a larger network can learn.', outcome: 'See how hidden layers let a network represent relationships a single perceptron cannot.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-mlp.webp', playUrl: '/demos/MLP_Game/index.html', kind: 'Unity WebGL' },
  { slug: 'autoencoder', title: 'The Autoencoder Game', description: 'Watch an encoder and decoder learn a compressed representation.', outcome: 'Explore how a network compresses its input and reconstructs information from that representation.', duration: 'Explore at your own pace', device: 'Desktop with WebGL · download about 5 MB', poster: '/demo-autoencoder.webp', playUrl: '/demos/Autoencoder_Game/index.html', kind: 'Unity WebGL' },
]
