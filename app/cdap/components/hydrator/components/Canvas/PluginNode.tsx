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

import { Button } from '@material-ui/core';
import Popover from 'components/shared/Popover';
import React, { useEffect, useState } from 'react';
import { Handle, Position, useStore } from 'reactflow';
import classnames from 'classnames';
import styled from 'styled-components';
import MenuIcon from '@material-ui/icons/Menu';
import ThemeWrappedComment from 'components/AbstractWidget/Comment';
import PluginContextMenu from 'components/PluginContextMenu';
import { getPluginColor } from './helper';
import PrimaryOutlinedButton from 'components/shared/Buttons/PrimaryOutlinedButton';

const CommentsWrapper = styled.div`
  position: absolute;
  top: -30px;
  right: 0;
  color: #1a73e8;
  z-index: 2;
`;

const StyledDiv = styled.div`
  height: 100px;
  width: 200px;
  border: 2px solid ${(props) => props.color};
  padding: 5px;
  border-radius: 5px;
  background: ${(props) => (props.selected || props.dragging ? props.color : 'white')};

  &:hover {
    border-width: 4px;
  }

  label {
    display: block;
    color: ${(props) => (props.selected || props.dragging ? 'white' : props.color)};
    font-size: 14px;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 120px;
  }

  button {
    color: ${(props) => (props.selected || props.dragging ? 'white' : props.color)};
    border-color: ${(props) => (props.selected || props.dragging ? 'white' : props.color)};
  }
`;

const FlexDiv = styled.div`
  display: flex;
`;

const StyledImg = styled.img`
  width: 25px;
  height: 25px;
  margin: 5px;
`;

const IconDiv = styled.div`
  margin: 5px;
  font-size: 25px !important;
`;

const ErrorDiv = styled.div`
  margin-left: auto;
  border-radius: 5px;
  padding: 3px;
  background: #ffcc00;
  color: white;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 1;
`;

const CaretHandle = styled(Handle)`
  width: 14px;
  height: 14px;
  background-color: #4e5568;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  div {
    width: 0;
    height: 0;
    pointer-events: none;
    ${(props) =>
      props.position === Position.Bottom
        ? `
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 7px solid #bac0d6;
        transform: translateY(1px);
      `
        : `
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        border-left: 7px solid #bac0d6;
        transform: translateX(1px)
      `}
  }
  span {
    font-size: 11px;
    position: absolute;
    top: -16px;
    color: #b9c0d8;
  }
  ${(props) => props.id === 'source_error' && `transform: translate(-40px, 0)`}
  ${(props) => props.id === 'source_alert' && `transform: translate(-70px, 0)`}
`;

const NodeMenu = styled.div`
  display: flex;
  position: absolute;
  bottom: 0;
  right: 0;
  padding-bottom: 10px;
  align-items: center;
`;

/**
 * This is to achieve the effect of dropping connection line onto anywhere inside
 * a plugin will establish a connection.
 * Reactflow's connection depends on the Handle component, we need to make the handle the
 * same width and height as the plugin node. But one caveat is that this will prevent
 * dragging the node on the canvas. One solution is to check the state of whether the user
 * is currently drawing a connection line by checking the reactflowStore. If not drawing,
 * pointer-events will be disabled on the TargetHandle so that the user will be able to drag
 * the node. Otherwise, pointer-events will be allowed so that the user can attach the connection
 * to the node.
 */
const TargetHandle = styled(Handle)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0;
  transform: none;
  border: none;
  opacity: 0;
  ${(props) => !props.isDrawing && `pointer-events: none !important;`}
`;

const isDrawingConnection = (state) => {
  return state.connectionHandleId !== null;
};

export const PluginNode = ({ data, selected, dragging, zIndex }) => {
  const {
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
  } = data;

  const [isEntered, setIsEntered] = useState(false);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);

  const isDrawing = useStore(isDrawingConnection);

  const imgUrl = getCustomIconSrc(node);

  const handleMouseEnter = () => {
    setIsEntered(true);
  };

  const handleMouseLeave = () => {
    setIsEntered(false);
  };

  const toggleNodeMenu = () => {
    setShowNodeMenu(!showNodeMenu);
  };

  const target = () => {
    return (
      <Button>
        <MenuIcon />
      </Button>
    );
  };

  return (
    <>
      {(node?.information?.comments?.list || isCommentBoxOpen) && (
        <CommentsWrapper>
          <ThemeWrappedComment
            comments={node?.information?.comments?.list}
            commentsId={node.id}
            isOpen={isCommentBoxOpen}
            placement="bottom-start"
            onChange={setPluginComments}
            onOpen={() => {
              setPluginActiveForComment(node.id);
              setIsCommentBoxOpen(true);
            }}
            onClose={() => {
              setPluginActiveForComment(null);
              setIsCommentBoxOpen(false);
            }}
          />
        </CommentsWrapper>
      )}

      <StyledDiv
        id={node.id}
        color={getPluginColor(node.type)}
        selected={selected}
        dragging={dragging}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        isEntered={isEntered}
      >
        <FlexDiv>
          {imgUrl ? (
            <div>
              <StyledImg src={imgUrl} />
            </div>
          ) : (
            <IconDiv className={classnames('node-icon fa', node.icon)}></IconDiv>
          )}
          <div>
            <label htmlFor="text" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {node.plugin.label}
            </label>
            {isEntered ? (
              <PrimaryOutlinedButton
                onClick={() => {
                  onPropertiesClick(node);
                }}
              >
                Properties
              </PrimaryOutlinedButton>
            ) : (
              <label style={{ fontSize: '10px' }}>{node.plugin.artifact.version}</label>
            )}
          </div>
          {node.errorCount > 0 && <ErrorDiv>{node.errorCount}</ErrorDiv>}
        </FlexDiv>
        <NodeMenu>
          <Popover target={target} showPopover={showNodeMenu} onTogglePopover={toggleNodeMenu}>
            <ul>
              <li
                onClick={() => {
                  setPluginActiveForComment(node.id);
                  setIsCommentBoxOpen(true);
                }}
              >
                Add Comment
              </li>
            </ul>
          </Popover>
        </NodeMenu>
        <TargetHandle type="target" position={Position.Left} isDrawing={isDrawing} />
        <CaretHandle id="source_right" type="source" position={Position.Right}>
          <div></div>
        </CaretHandle>
        {shouldShowErrorsPort(node) && (
          <CaretHandle id="source_error" type="source" position={Position.Bottom}>
            <span>Error</span>
            <div></div>
          </CaretHandle>
        )}
        {shouldShowAlertsPort(node) && (
          <CaretHandle id="source_alert" type="source" position={Position.Bottom}>
            <span>Alert</span>
            <div></div>
          </CaretHandle>
        )}
      </StyledDiv>
      <PluginContextMenu
        nodeId={node.id}
        getPluginConfiguration={getPluginConfiguration}
        getSelectedConnections={getSelectedConnections}
        getSelectedNodes={getSelectedNodes}
        onDelete={() => {}}
        onOpen={() => {}}
        onAddComment={() => {}}
      />
    </>
  );
};
