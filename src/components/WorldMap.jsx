import React from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WorldMap = ({ nodes }) => {
  return (
    <div className="w-full h-full relative" aria-label="Interactive world map showing active network nodes">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.05)" strokeWidth="0.5"/>
          </pattern>
           <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#0ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <ComposableMap
          projection="geoMercator"
          projectionConfig={{
              scale: 120,
              center: [0, 20]
          }}
          style={{ width: "100%", height: "100%", position: 'relative', zIndex: 1 }}
      >
          <Geographies geography={geoUrl}>
              {({ geographies }) =>
                  geographies.map((geo) => (
                      <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="rgba(13, 37, 54, 0.5)"
                          stroke="#0f3a5f"
                          strokeWidth={0.5}
                      />
                  ))
              }
          </Geographies>
          {nodes.map((node, i) => {
              const nextNode = nodes[(i + 1) % nodes.length];
              return (
                <Line
                    key={`line-${i}`}
                    from={[node.lon, node.lat]}
                    to={[nextNode.lon, nextNode.lat]}
                    stroke="url(#line-gradient)"
                    strokeWidth={1}
                    strokeLinecap="round"
                >
                  <animate 
                      attributeName="stroke-dasharray"
                      from="0, 500" to="500, 0"
                      dur="5s"
                      repeatCount="indefinite"
                      begin={`${i * 0.5}s`}
                  />
                </Line>
              );
          })}
          {nodes.map(node => {
              const isHypercity = node.country === 'Hypercity';
              const loadColor = isHypercity ? '#a855f7' : (node.load < 50 ? '#4ade80' : node.load < 80 ? '#facc15' : '#f87171');

              return (
                  <Marker key={node.id} coordinates={[node.lon, node.lat]}>
                      <Popover>
                          <PopoverTrigger asChild>
                              <motion.g
                                  className="cursor-pointer"
                                  whileHover={{ scale: 1.5 }}
                              >
                                  <circle r={4} fill={loadColor} stroke="#fff" strokeWidth={0.5} />
                                  <circle r={6} fill={loadColor} fillOpacity={0.3}>
                                      <animate
                                          attributeName="r"
                                          from="6"
                                          to="12"
                                          dur="1.5s"
                                          begin="0s"
                                          repeatCount="indefinite"
                                      />
                                      <animate
                                          attributeName="opacity"
                                          from="0.3"
                                          to="0"
                                          dur="1.5s"
                                          begin="0s"
                                          repeatCount="indefinite"
                                      />
                                  </circle>
                              </motion.g>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto bg-black/80 border-cyan-500/50 text-white p-3 text-xs rounded-lg shadow-lg backdrop-blur-sm">
                              <p className="font-bold text-cyan-400">{node.id}</p>
                              <p className={isHypercity ? "text-purple-400 flex items-center gap-1" : ""}>
                                {isHypercity && <span title="Privacy Mode">🔒</span>}
                                {node.country}
                              </p>
                              <p><span className="text-gray-400">Load:</span> {node.load}%</p>
                              <p><span className="text-gray-400">Uptime:</span> {node.uptime}</p>
                              <p><span className="text-gray-400">Points:</span> {node.points.toFixed(2)}</p>
                          </PopoverContent>
                      </Popover>
                  </Marker>
              );
          })}
      </ComposableMap>
    </div>
  );
};

export default WorldMap;