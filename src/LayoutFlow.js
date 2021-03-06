import React, { useState, useCallback } from "react";
import ReactFlow, {
  Controls,
  ReactFlowProvider,
  addEdge,
  removeElements,
  isNode,
} from "react-flow-renderer";
import dagre from "dagre";

import json from "./sample-definition.json";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// In order to keep this example simple the node width and height are hardcoded.
// In a real world app you would use the correct width and height values of
// const nodes = useStoreState(state => state.nodes) and then node.__rf.width, node.__rf.height

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (elements, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  elements.forEach((el) => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
    } else {
      dagreGraph.setEdge(el.source, el.target);
    }
  });

  dagre.layout(dagreGraph);

  return elements.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id);
      el.targetPosition = isHorizontal ? "left" : "top";
      el.sourcePosition = isHorizontal ? "right" : "bottom";

      // unfortunately we need this little hack to pass a slightly different position
      // to notify react flow about the change. Moreover we are shifting the dagre node position
      // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
      el.position = {
        x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }

    return el;
  });
};

const position = { x: 0, y: 0 };

const JSONnodes = json.nodes.map((node) => {
  return {
    id: node.name,
    data: { label: node.name },
    position,
  };
});

const JSONtransitions = json.transitions.map((transition) => {
  return {
    id: transition.name,
    source: transition.sourceNodeName,
    target: transition.targetNodeName,
    type: "step",
  };
});

const JSONelements = JSONnodes.concat(JSONtransitions);

const layoutedElements = getLayoutedElements(JSONelements);

const LayoutFlow = () => {
  const [elements, setElements] = useState(layoutedElements);
  const onConnect = (params) =>
    setElements((els) =>
      addEdge({ ...params, type: "smoothstep", animated: true }, els)
    );
  const onElementsRemove = (elementsToRemove) =>
    setElements((els) => removeElements(elementsToRemove, els));

  const onLayout = useCallback(
    (direction) => {
      const layoutedElements = getLayoutedElements(elements, direction);
      setElements(layoutedElements);
    },
    [elements]
  );

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView();
  };

  return (
    <div className="layoutflow">
      <ReactFlowProvider>
        <ReactFlow
          elements={elements}
          onConnect={onConnect}
          onElementsRemove={onElementsRemove}
          onLoad={onLoad}
          connectionLineType="smoothstep"
        />
        <div className="controls">
          <button onClick={() => onLayout("TB")}>vertical layout</button>
          <button onClick={() => onLayout("LR")}>horizontal layout</button>
        </div>
        <Controls />
      </ReactFlowProvider>
    </div>
  );
};

export default LayoutFlow;
