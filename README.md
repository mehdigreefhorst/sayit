# Related Subreddits Visualization

An interactive graph visualization of related subreddits based on user commenting patterns.

![Demo](https://i.imgur.com/xKlxRkf.gif)

## Features

- **Interactive Graph Visualization** - Force-directed physics-based layout with smooth animations
- **Smart Search** - Fuzzy autocomplete search for subreddits
- **Interactive Exploration** - Click to preview, double-click to navigate
- **Pan & Zoom** - Smooth navigation controls
- **Real-time Building** - Graph builds progressively as data loads
- **Responsive Design** - Works on desktop and mobile

## How It Works

Recommendations are based on user behavior:
> _"Redditors who commented in this subreddit, also commented in..."_

The visualization uses ~38 million user-subreddit comment records from August-September 2018. Relationships are computed using Jaccard Similarity.

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern responsive styling
- **ngraph** - Graph algorithms and physics simulation
- **panzoom** - Smooth pan/zoom controls

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## Architecture

The app uses a sophisticated 4-phase layout system:

1. **Boid Simulation** - Initial rapid positioning using flocking algorithm
2. **Physics Layout** - Force-directed graph layout running in parallel
3. **Overlap Removal** - Delaunay triangulation-based collision detection
4. **Smooth Transition** - Interpolation between layouts for smooth animation

## Data Source

Pre-computed data is hosted at `https://anvaka.github.io/sayit-data/3/`

## License

MIT
