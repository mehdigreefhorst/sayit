import  Delaunator from 'delaunator';
import createGraph from 'ngraph.graph';

export default function getDelaunayGraph(vertices) {
  // Validate vertices before attempting triangulation
  if (!validateVertices(vertices)) {
    console.warn('Invalid vertices for Delaunay triangulation, returning empty graph');
    // Return a complete graph as fallback
    return createCompleteGraph(vertices);
  }

  let delaunay;
  try {
    delaunay = Delaunator.from(vertices);
  } catch (error) {
    console.warn('Delaunay triangulation failed:', error.message);
    // Return a complete graph as fallback
    return createCompleteGraph(vertices);
  }

  const triangles = delaunay.triangles;
  const triangulationGraph = createGraph()
  vertices.forEach(v => {
    triangulationGraph.addNode(v.id, v);
  });

  for (let i = triangles.length; i;) {
    --i
    const first = vertices[triangles[i]]
    --i
    const second = vertices[triangles[i]]
    --i
    const third = vertices[triangles[i]]

    addTriangulationLink(first.id, second.id, triangulationGraph)
    addTriangulationLink(second.id, third.id, triangulationGraph)
    addTriangulationLink(third.id, first.id, triangulationGraph)
  }

  return triangulationGraph;
}

/**
 * Validates that vertices are suitable for Delaunay triangulation
 */
function validateVertices(vertices) {
  if (!vertices || vertices.length < 3) {
    return false;
  }

  // Check that all coordinates are valid numbers
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (!v || v.length < 2) return false;
    if (!Number.isFinite(v[0]) || !Number.isFinite(v[1])) {
      console.warn(`Invalid coordinates at vertex ${i}:`, v);
      return false;
    }
  }

  // Check if all points are at the same location (degenerate case)
  const first = vertices[0];
  let allSame = true;
  for (let i = 1; i < vertices.length; i++) {
    if (vertices[i][0] !== first[0] || vertices[i][1] !== first[1]) {
      allSame = false;
      break;
    }
  }
  if (allSame) {
    console.warn('All vertices are at the same location');
    return false;
  }

  // Check if all points are collinear (on the same line)
  if (vertices.length >= 3 && areAllCollinear(vertices)) {
    console.warn('All vertices are collinear');
    return false;
  }

  return true;
}

/**
 * Checks if all points are collinear (on the same line)
 */
function areAllCollinear(vertices) {
  if (vertices.length < 3) return true;

  const [x0, y0] = vertices[0];
  const [x1, y1] = vertices[1];

  // Check if first two points are the same
  if (x0 === x1 && y0 === y1) return true;

  const epsilon = 1e-10;

  // For each subsequent point, check if it's on the line formed by the first two points
  for (let i = 2; i < vertices.length; i++) {
    const [x2, y2] = vertices[i];

    // Calculate cross product to check collinearity
    // If cross product is 0, points are collinear
    const crossProduct = Math.abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0));

    if (crossProduct > epsilon) {
      // Found a point that's not collinear
      return false;
    }
  }

  return true;
}

/**
 * Creates a complete graph (all nodes connected) as a fallback
 * when Delaunay triangulation fails
 */
function createCompleteGraph(vertices) {
  const graph = createGraph();

  vertices.forEach(v => {
    graph.addNode(v.id, v);
  });

  // Connect each vertex to every other vertex
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      addTriangulationLink(vertices[i].id, vertices[j].id, graph);
    }
  }

  return graph;
}

function addTriangulationLink (fromId, toId, tGraph) {
  tGraph.addLink(fromId, toId)
}
