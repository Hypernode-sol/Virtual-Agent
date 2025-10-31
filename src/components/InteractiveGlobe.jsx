import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const Globe = ({ rotationX, rotationY }) => (
  <motion.div
    className="absolute inset-0"
    style={{
      transformStyle: 'preserve-3d',
      rotateY: rotationY,
      rotateX: rotationX,
    }}
  >
    <div className="absolute w-full h-full rounded-full" style={{
      backgroundImage: 'radial-gradient(circle at 35% 35%, rgba(0, 255, 255, 0.4), rgba(46, 94, 255, 0.2))',
      boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.5), 0 0 50px rgba(46, 94, 255, 0.3)',
      transform: 'translateZ(-1px)',
    }}></div>
    {/* Grid lines */}
    {[...Array(12)].map((_, i) => (
      <div
        key={`long-${i}`}
        className="absolute top-0 left-1/2 w-px h-full bg-cyan-400/10"
        style={{
          transform: `translateX(-50%) rotateY(${i * 15}deg)`,
          transformOrigin: 'center'
        }}
      />
    ))}
    {[...Array(5)].map((_, i) => (
      <div
        key={`lat-${i}`}
        className="absolute left-0 top-1/2 w-full h-px bg-cyan-400/10"
        style={{
          transform: `translateY(-50%) rotateX(${i * 30 - 60}deg)`,
          transformOrigin: 'center'
        }}
      />
    ))}
  </motion.div>
);

const NodeMarker = ({ node, rotationX, rotationY, onHover }) => {
  const loadColor =
    node.load < 50 ? 'bg-green-400' : node.load < 80 ? 'bg-yellow-400' : 'bg-red-500';

  const [x, y, z] = latLonToSphere(node.lat, node.lon, 98);

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full"
      style={{
        transformStyle: 'preserve-3d',
        rotateY: rotationY,
        rotateX: rotationX,
      }}
      onHoverStart={() => onHover(node)}
      onHoverEnd={() => onHover(null)}
    >
      <div
        className={`absolute w-3 h-3 rounded-full ${loadColor} transform -translate-x-1/2 -translate-y-1/2`}
        style={{
          transform: `translateX(${x}px) translateY(${y}px) translateZ(${z}px)`,
          boxShadow: `0 0 10px ${loadColor}`,
        }}
      />
    </motion.div>
  );
};

function latLonToSphere(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  let x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

const InteractiveGlobe = ({ nodes }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const rotationX = useMotionValue(20);
  const rotationY = useMotionValue(220);

  const handleMouseMove = (event) => {
    const { clientX, clientY,currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    
    rotationY.set(220 + x * 180);
    rotationX.set(20 - y * 180);
  };
  
  return (
    <div
      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      style={{ perspective: '800px' }}
    >
      <div className="relative w-52 h-52" style={{ transformStyle: 'preserve-3d' }}>
        <Globe rotationX={rotationX} rotationY={rotationY} />
        {nodes.map(node => (
          <NodeMarker 
            key={node.id} 
            node={node} 
            rotationX={rotationX}
            rotationY={rotationY}
            onHover={setHoveredNode}
          />
        ))}
      </div>
       {hoveredNode && (
          <motion.div 
            className="absolute bg-black/70 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 text-xs shadow-2xl shadow-cyan-500/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ pointerEvents: 'none' }}
          >
            <p className="font-bold text-cyan-400">{hoveredNode.id}</p>
            <p className="text-white">{hoveredNode.country}</p>
            <p><span className="text-gray-400">Load:</span> {hoveredNode.load}%</p>
            <p><span className="text-gray-400">Uptime:</span> {hoveredNode.uptime}</p>
            <p><span className="text-gray-400">Points:</span> {hoveredNode.points}</p>
          </motion.div>
        )}
    </div>
  );
};

export default InteractiveGlobe;