/**
 * Books section content. Every title, subtitle, year, ISBN and URL here was
 * checked against the publisher or retailer listing on 2026-08-23 — do not
 * edit from memory; look the book up.
 */

export interface DevBook {
  title: string
  publisher: string
  badge: 'MEAP' | 'IN DEVELOPMENT'
  flavor: string
}

export const DEV_BOOKS: DevBook[] = [
  {
    title: 'Self-Improving Agents',
    publisher: 'Manning Publications',
    badge: 'MEAP',
    flavor: 'Agents that rewrite their own behavior.',
  },
  {
    title: 'Learn AI Filmmaking',
    publisher: 'BPB Publications',
    badge: 'IN DEVELOPMENT',
    flavor: 'Generative pipelines for cinematic craft.',
  },
  {
    title: 'The Instinctual Learning Agent Harness',
    publisher: 'Packt Publishing',
    badge: 'IN DEVELOPMENT',
    flavor: 'Instincts, drives, and self-improving agents.',
  },
]

export interface PublishedBook {
  /** null when the source lists no year (BPB title) */
  year: string | null
  title: string
  subtitle: string
  isbn: string | null
  url: string | null
}

export type PublisherKey = 'MANNING' | "O'REILLY" | 'APRESS' | 'PACKT' | 'BPB'

export interface PublisherCluster {
  key: PublisherKey
  /** display label, e.g. "MANNING PUBLICATIONS" */
  label: string
  /** branch node color — amber for Manning, teal for the others */
  nodeColor: string
  /** card spine-bar color (Manning amber, O'Reilly teal, Apress copper,
   *  Packt teal-dim, BPB amber-dim/ember) */
  spineColor: string
  books: PublishedBook[]
}

export const PUBLISHER_CLUSTERS: PublisherCluster[] = [
  {
    key: 'MANNING',
    label: 'MANNING PUBLICATIONS',
    nodeColor: '#E09B4A',
    spineColor: '#E09B4A',
    books: [
      {
        year: '2026',
        title: 'AI Agents in Action, Second Edition',
        subtitle: 'Intelligent workflows with LLMs, MCP, A2A, and more',
        isbn: '9781633434530',
        url: 'https://www.manning.com/books/ai-agents-in-action-second-edition',
      },
      {
        year: '2025',
        title: 'AI Agents in Action',
        subtitle: 'Build, orchestrate, and deploy autonomous multi-agent systems',
        isbn: '9781633436343',
        url: 'https://www.manning.com/books/ai-agents-in-action',
      },
      {
        year: '2023',
        title: 'Evolutionary Deep Learning',
        subtitle: 'Genetic algorithms and neural networks',
        isbn: '9781617299520',
        url: 'https://www.amazon.com/Evolutionary-Deep-Learning-algorithms-networks/dp/1617299529',
      },
    ],
  },
  {
    key: "O'REILLY",
    label: "O'REILLY MEDIA",
    nodeColor: '#3E9E96',
    spineColor: '#3E9E96',
    books: [
      {
        year: '2020',
        title: 'Practical AI on the Google Cloud Platform',
        subtitle: "Utilizing Google's state-of-the-art AI cloud services",
        isbn: '9781492075813',
        url: 'https://www.amazon.com/Practical-Google-Cloud-Platform-State/dp/1492075817',
      },
    ],
  },
  {
    key: 'APRESS',
    label: 'APRESS',
    nodeColor: '#3E9E96',
    spineColor: '#C2703C',
    books: [
      {
        year: '2021',
        title: 'Generating a New Reality',
        subtitle: 'From autoencoders and adversarial networks to deepfakes',
        isbn: '9781484270912',
        url: 'https://link.springer.com/book/10.1007/978-1-4842-7092-9',
      },
    ],
  },
  {
    key: 'PACKT',
    label: 'PACKT PUBLISHING',
    nodeColor: '#3E9E96',
    spineColor: '#1E5A55',
    books: [
      {
        year: '2020',
        title: 'Hands-On Reinforcement Learning for Games',
        subtitle: 'Implementing self-learning agents in games using artificial intelligence techniques',
        isbn: '9781839214936',
        url: 'https://www.amazon.com/Hands-Reinforcement-Learning-Games-self-learning/dp/1839214937',
      },
      {
        year: '2019',
        title: 'Hands-On Deep Learning for Games',
        subtitle: 'Leverage the power of neural networks and reinforcement learning to build intelligent games',
        isbn: '9781788994071',
        url: 'https://www.amazon.com/Hands-Deep-Learning-Games-reinforcement/dp/1788994078',
      },
      {
        year: '2018',
        title: 'Learn Unity ML-Agents — Fundamentals of Unity Machine Learning',
        subtitle: 'Incorporate new powerful ML algorithms such as Deep Reinforcement Learning for games',
        isbn: '9781789138139',
        url: 'https://www.packtpub.com/en-us/product/learn-unity-ml-agents-fundamentals-of-unity-machine-learning-9781789138139',
      },
      {
        year: '2018',
        title: 'Learn ARCore — Fundamentals of Google ARCore',
        subtitle: 'Learn to build augmented reality apps for Android, Unity, and the web with Google ARCore 1.0',
        isbn: '9781788830409',
        url: 'https://www.packtpub.com/en-us/product/learn-arcore-fundamentals-of-google-arcore-9781788830409',
      },
      {
        year: '2017',
        title: 'Augmented Reality Game Development',
        subtitle: 'Create your own augmented reality games from scratch with Unity 5',
        isbn: '9781787122888',
        url: 'https://www.packtpub.com/en-us/product/augmented-reality-game-development-9781787122888',
      },
      {
        year: '2017',
        title: 'Game Audio Development with Unity 5.X',
        subtitle: 'Design a blockbuster game soundtrack with Unity 5.X',
        isbn: '9781787286450',
        url: 'https://www.packtpub.com/product/game-audio-development-with-unity-5x/9781787286450',
      },
    ],
  },
  {
    key: 'BPB',
    label: 'BPB PUBLICATIONS',
    nodeColor: '#3E9E96',
    spineColor: '#8A4A22',
    books: [
      {
        year: '2024',
        title: 'Learn Python Game Development with ChatGPT',
        subtitle: 'Techniques for creating engaging games with generative AI',
        isbn: '9789355516435',
        url: 'https://bpbonline.com/products/learn-python-game-development-with-chatgpt',
      },
    ],
  },
]

export const FILTER_KEYS: ('ALL' | PublisherKey)[] = ['ALL', 'MANNING', "O'REILLY", 'APRESS', 'PACKT', 'BPB']
