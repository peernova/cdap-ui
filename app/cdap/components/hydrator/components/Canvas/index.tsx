/*
 * Copyright © 2022 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { useCallback, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  ControlButton,
  Background,
  useEdgesState,
  addEdge,
  useNodesState,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
  useKeyPress,
  MarkerType,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PluginNode, PluginNodeWithAlertAndError } from './PluginNode';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import PipelineContextMenu from 'components/PipelineContextMenu';
import { connectionIsValid, getPluginColor } from './helper';
import { PLUGIN_TYPES } from './constants';
import { EdgeStyle, ConnectionLineStyle } from './styles';

interface ICanvasProps {
  angularNodes: any;
  angularConnections: any;
  isDisabled: boolean;
  updateNodes: (nodes: any[]) => void;
  updateConnections: (connections: any[]) => void;
  onPropertiesClick: (node: any) => void;
  getAngularConnections: () => any;
  getAngularNodes: () => any;
  setSelectedNodes: (nodes: any[]) => void;
  setSelectedConnections: (connections: any[]) => void;
  onKeyboardCopy: () => void;
  setPluginActiveForComment: (nodeId: string) => void;
  getActivePluginForComment: () => string;
  setPluginComments: (nodeId: string, comments: any) => void;
  getPluginConfiguration: () => any;
  getCustomIconSrc: (node: any) => string;
  shouldShowAlertsPort: (node: any) => boolean;
  shouldShowErrorsPort: (node: any) => boolean;
  undoActions: () => void;
  redoActions: () => void;
}

const nodeTypes = { plugin: PluginNode, pluginWithAlertAndError: PluginNodeWithAlertAndError };

const getConnectionsForDisplay = (connections, nodes) => {
  return connections.map((conn) => {
    const reactFlowConn: any = {
      id: 'reactflow__edge-' + conn.from + '-' + conn.to,
      source: conn.from,
      target: conn.to,
      ...EdgeStyle,
    };
    const fromNode = nodes.find((node) => node.name === conn.from);
    const toNode = nodes.find((node) => node.name === conn.to);
    if (toNode.type === PLUGIN_TYPES.ERROR_TRANSFORM) {
      reactFlowConn.sourceHandle = 'source_error';
    } else if (toNode.type === PLUGIN_TYPES.ALERT_PUBLISHER) {
      reactFlowConn.sourceHandle = 'source_alert';
    }
    return reactFlowConn;
  });
};

const Canvas = ({
  angularNodes,
  angularConnections,
  isDisabled,
  updateNodes,
  updateConnections,
  onPropertiesClick,
  getAngularConnections,
  getAngularNodes,
  setSelectedNodes,
  setSelectedConnections,
  onKeyboardCopy,
  setPluginActiveForComment,
  getActivePluginForComment,
  setPluginComments,
  getPluginConfiguration,
  getCustomIconSrc,
  shouldShowAlertsPort,
  shouldShowErrorsPort,
  undoActions,
  redoActions,
}: ICanvasProps) => {
  const reactFlowInstance = useReactFlow();
  const deletePressed = useKeyPress(['Backspace', 'Delete']);

  const getNodesForDisplay = (nodes, reactNodes) => {
    const existingIds = reactNodes.map((node) => node.id);
    return nodes.map((node) => {
      const data = {
        node,
        onPropertiesClick,
        setPluginActiveForComment,
        getActivePluginForComment,
        setPluginComments,
        getSelectedConnections,
        getSelectedNodes,
        getPluginConfiguration,
        getCustomIconSrc,
        shouldShowAlertsPort,
        shouldShowErrorsPort,
      };
      const reactflowNode = {
        id: node.name,
        data,
        type: 'plugin',
        position: {
          x: parseInt(node._uiPosition.left, 10),
          y: parseInt(node._uiPosition.top, 10),
        },
      };
      if (shouldShowAlertsPort(node) && shouldShowErrorsPort(node)) {
        reactflowNode.type = 'pluginWithAlertAndError';
      }
      if (existingIds.includes(node.name)) {
        reactflowNode.position = reactNodes.find((nd) => nd.id === node.name).position;
      }
      return reactflowNode;
    });
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // draw connections
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // set selection state to angular store
  // useEffect(() => {
  //   setSelectedNodes(getSelectedNodes());
  //   setSelectedConnections(getSelectedConnections());
  // }, [nodes]);

  // delete selection box
  // it requires some adjustments to reuse the onKeyboardDelete function in dag-plus-ctrl
  // writing the logic here to directly delete
  useEffect(() => {
    if (isDisabled) {
      return;
    }
    const selectedNodesId = nodes.filter((node) => node.selected).map((node) => node.id);
    const selectedEdgesId = edges.filter((edge) => edge.selected).map((edge) => edge.id);
    setNodes((nds) => nds.filter((node) => !selectedNodesId.includes(node.id)));
    setEdges((eds) => eds.filter((edge) => !selectedEdgesId.includes(edge.id)));
    const newNodes = getAngularNodes().filter((node) => !selectedNodesId.includes(node.name));
    updateNodes(newNodes);
    const newConnections = getAngularConnections().filter(
      (conn) =>
        !selectedNodesId.includes(conn.from) &&
        !selectedNodesId.includes(conn.to) &&
        !selectedEdgesId.find((edge) => edge.includes(conn.from) && edge.includes(conn.to))
    );
    updateConnections(newConnections);
  }, [deletePressed]);

  useEffect(() => {
    setNodes((nds) => {
      return [].concat(getNodesForDisplay(getAngularNodes(), nds));
    });
  }, [JSON.stringify(getAngularNodes())]);

  useLayoutEffect(() => {
    setEdges(() => {
      return [].concat(getConnectionsForDisplay(getAngularConnections(), getAngularNodes()));
    });
  }, [nodes]);

  const getSelectedConnections = () => {
    const selectedEdgesId = edges.filter((edge) => edge.selected).map((edge) => edge.id);
    const selectedConnections = getAngularConnections().filter((conn) => {
      return !!selectedEdgesId.find((edge) => edge.includes(conn.from) && edge.includes(conn.to));
    });
    return selectedConnections;
  };

  const getSelectedNodes = () => {
    const selectedNodesId = nodes.filter((node) => node.selected).map((node) => node.id);
    const selectedNodes = getAngularNodes().filter((node) => selectedNodesId.includes(node.name));
    return selectedNodes;
  };

  const addConnections = (params) => {
    const connections = getAngularConnections().concat({
      id: params.id,
      from: params.source,
      to: params.target,
    });
    updateConnections(connections);
  };

  const checkIfConnectionExistsOrValid = (params) => {
    // exisiting connections
    if (edges.find((edge) => edge.source === params.source && edge.target === params.target)) {
      return false;
    }
    // same node
    if (params.source === params.target) {
      return false;
    }
    const fromNode = nodes.find((node) => node.id === params.source);
    const toNode = nodes.find((node) => node.id === params.target);
    return connectionIsValid(fromNode.data.node, toNode.data.node);
  };

  const addEdgeStyle = (params) => {
    const fromNode = nodes.find((node) => node.id === params.source);
    const toNode = nodes.find((node) => node.id === params.target);
    const newParams = { ...params, ...EdgeStyle };
    if (
      toNode.data.node.type === PLUGIN_TYPES.CONDITION ||
      fromNode.data.node.type === PLUGIN_TYPES.ACTION ||
      toNode.data.node.type === PLUGIN_TYPES.ACTION ||
      fromNode.data.node.type === PLUGIN_TYPES.SPARK_PROGRAM ||
      toNode.data.node.type === PLUGIN_TYPES.SPARK_PROGRAM
    ) {
      newParams.style.strokeDasharray = '4,8';
    }
    return newParams;
  };

  return (
    <div id="diagram-container" style={{ height: '92vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        minZoom={-5}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => {
          if (checkIfConnectionExistsOrValid(params)) {
            const newParams = addEdgeStyle(params);
            onConnect(newParams);
            addConnections(newParams);
          }
        }}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        connectionLineStyle={ConnectionLineStyle}
        connectionLineType={ConnectionLineType.SmoothStep}
        onConnectStart={() => {}}
        nodesDraggable={!isDisabled}
        nodesConnectable={!isDisabled}
      >
        <Background />
        {nodes.length > 5 && (
          <MiniMap
            nodeColor={(n) => {
              return getPluginColor(n.data.node.type);
            }}
          />
        )}
        <Controls position="top-right" style={{ marginTop: '100px' }} showInteractive={!isDisabled}>
          <ControlButton title="Undo" onClick={undoActions}>
            <UndoIcon />
          </ControlButton>
          <ControlButton title="Redo" onClick={redoActions}>
            <RedoIcon />
          </ControlButton>
        </Controls>
      </ReactFlow>

      <PipelineContextMenu
        onWranglerSourceAdd={() => {}}
        onNodesPaste={() => {}}
        pipelineArtifactType="cdap-data-pipeline"
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        fitToScreen={() => {}}
        prettyPrintGraph={() => {}}
      />
    </div>
  );
};

export const WrapperCanvas = ({
  angularNodes,
  angularConnections,
  isDisabled,
  updateNodes,
  updateConnections,
  onPropertiesClick,
  getAngularConnections,
  getAngularNodes,
  setSelectedNodes,
  setSelectedConnections,
  onKeyboardCopy,
  setPluginActiveForComment,
  getActivePluginForComment,
  setPluginComments,
  getPluginConfiguration,
  getCustomIconSrc,
  shouldShowAlertsPort,
  shouldShowErrorsPort,
  undoActions,
  redoActions,
}: ICanvasProps) => {
  return (
    <ReactFlowProvider>
      <Canvas
        angularNodes={angularNodes}
        angularConnections={angularConnections}
        isDisabled={isDisabled}
        updateNodes={updateNodes}
        updateConnections={updateConnections}
        onPropertiesClick={onPropertiesClick}
        getAngularConnections={getAngularConnections}
        getAngularNodes={getAngularNodes}
        setSelectedNodes={setSelectedNodes}
        setSelectedConnections={setSelectedConnections}
        onKeyboardCopy={onKeyboardCopy}
        setPluginActiveForComment={setPluginActiveForComment}
        getActivePluginForComment={getActivePluginForComment}
        setPluginComments={setPluginComments}
        getPluginConfiguration={getPluginConfiguration}
        getCustomIconSrc={getCustomIconSrc}
        shouldShowAlertsPort={shouldShowAlertsPort}
        shouldShowErrorsPort={shouldShowErrorsPort}
        undoActions={undoActions}
        redoActions={redoActions}
      />
    </ReactFlowProvider>
  );
};
