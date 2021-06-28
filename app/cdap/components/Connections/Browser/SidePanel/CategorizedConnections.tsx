/*
 * Copyright © 2021 Cask Data, Inc.
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

import * as React from 'react';
import MuiAccordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles, StyleRules, Theme, withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { getCurrentNamespace } from 'services/NamespaceStore';
import If from 'components/If';
import classnames from 'classnames';
import ActionsPopover, { IAction } from 'components/ActionsPopover';
import { objectQuery } from 'services/helpers';
import DownloadFile from 'services/download-file';
import ConfirmationModal from 'components/ConfirmationModal';
import CreateConnectionModal from 'components/Connections/CreateConnectionModal';
import { ConnectionsApi } from 'api/connections';
import { IConnectorType } from 'components/Connections/Browser/SidePanel';

interface ICategorizedConnectionsProps {
  categorizedConnections: Map<string, any[]>;
  connectorTypes: IConnectorType[];
  onConnectionSelection: (conn: string) => void;
  selectedConnection: string;
  boundaryElement: any;
  fetchConnections: () => void;
}
const Accordion = withStyles({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    boxShadow: 'none',
    background: 'transparent',
    borderRight: 0,
    '&:not(:last-child)': {
      borderBottom: 0,
      borderRight: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: 'auto',
    },
  },
  expanded: {},
})(MuiAccordion);

const CustomAccordionSummary = withStyles((theme) => ({
  root: {
    minHeight: `${theme.spacing(4)}px`,
    '&$expanded': {
      minHeight: `${theme.spacing(4)}px`,
    },
  },
  content: {
    '&$expanded': {
      margin: `${theme.spacing(1.25)}px 0`,
    },
  },
  expanded: {},
}))(AccordionSummary);

const CustomAccordionDetails = withStyles((theme) => ({
  root: {
    padding: 0,
    gap: '10px',
    display: 'grid',
    gridAutoRows: `${theme.spacing(4)}px`,
  },
}))(AccordionDetails);

const useStyle = makeStyles<Theme>(
  (theme): StyleRules => {
    return {
      connection: {
        color: 'black',
        paddingLeft: `${theme.spacing(4)}px`,
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          textDecoration: 'none',
        },
        '&:hover > span': {
          fontWeight: 600,
          color: 'black',
        },
      },
      selectedConnection: {
        background: 'white',
        color: theme.palette.primary.main,
        '&:hover': {
          color: theme.palette.primary.main,
          fontWeight: 'normal',
        },
      },
      actionPopover: {
        marginLeft: 'auto',

        '&:hover': {
          fontWeight: 'normal',
        },
      },
      delete: {
        color: theme.palette.red[100],
      },
    };
  }
);
function getActiveCategory(selectedConnection: string, categorizedConnections: Map<string, any[]>) {
  const entries = Array.from(categorizedConnections.entries());
  if (!entries || (Array.isArray(entries) && !entries.length)) {
    return null;
  }
  for (const [category, connectors] of entries) {
    const isActive = connectors.find((connector) => connector.name === selectedConnection);
    if (isActive) {
      return category;
    }
  }
  return null;
}

function getConnectionConfig(conn) {
  const connectionConfig = {
    name: conn.name,
    description: conn.description,
    category: conn.plugin.category,
    plugin: conn.plugin,
  };

  return connectionConfig;
}

export function CategorizedConnections({
  categorizedConnections = new Map(),
  connectorTypes = [],
  onConnectionSelection,
  selectedConnection,
  boundaryElement,
  fetchConnections,
}: ICategorizedConnectionsProps) {
  const classes = useStyle();
  const activeCategory = selectedConnection
    ? getActiveCategory(selectedConnection, categorizedConnections)
    : null;
  const [currentActiveAccordion, setCurrentActiveAccordion] = React.useState(activeCategory);
  const [localSelectedConnection, setLocalSelectedConnection] = React.useState(selectedConnection);
  const [isCreateConnectionOpen, setIsCreateConnectionOpen] = React.useState(false);
  const [initConnConfig, setInitConnConfig] = React.useState(null);
  const [connectionToDelete, setConnectionToDelete] = React.useState(null);
  const [deleteError, setDeleteError] = React.useState(null);
  const [isEdit, setIsEdit] = React.useState(false);

  React.useEffect(() => {
    const currentCategory = selectedConnection
      ? getActiveCategory(selectedConnection, categorizedConnections)
      : null;
    setCurrentActiveAccordion(currentCategory);
  }, [categorizedConnections]);

  React.useEffect(() => {
    setLocalSelectedConnection(selectedConnection);
  }, [selectedConnection]);

  const handleChange = (tabName) => {
    if (currentActiveAccordion === tabName) {
      setCurrentActiveAccordion('');
    } else {
      setCurrentActiveAccordion(tabName);
    }
  };

  function exportConnection(conn) {
    const connectionConfig = getConnectionConfig(conn);
    const artifact = conn?.plugin?.artifact || {};

    DownloadFile(
      connectionConfig,
      null,
      `${conn.name}-connector-${artifact.name}-${artifact.version}`
    );
  }

  function cloneConnection(conn) {
    const config = getConnectionConfig(conn);
    delete config.name;

    openConnectionConfig(config);
  }

  function openConnectionConfig(config) {
    setInitConnConfig(config);
    toggleConnectionCreate();
  }

  function editConnection(conn) {
    const config = getConnectionConfig(conn);
    setIsEdit(true);
    openConnectionConfig(config);
  }

  function handleConfirmationClose() {
    setConnectionToDelete(null);
    setDeleteError(null);
  }

  function toggleConnectionCreate() {
    const newState = !isCreateConnectionOpen;

    setIsCreateConnectionOpen(newState);

    if (!newState) {
      setInitConnConfig(null);
      setIsEdit(false);
    }
  }

  function handleDelete() {
    if (!connectionToDelete) {
      return;
    }

    const params = {
      context: getCurrentNamespace(),
      connectionId: connectionToDelete.name,
    };

    return ConnectionsApi.deleteConnection(params).subscribe(
      () => {
        handleConfirmationClose();
        fetchConnections();
      },
      (err) => {
        setDeleteError(err);
      }
    );
  }

  const popperModifiers = {
    preventOverflow: {
      enabled: true,
      boundariesElement: objectQuery(boundaryElement, 'current'),
    },
    hide: {
      enabled: false,
    },
  };

  let confirmDeleteElem;
  if (connectionToDelete) {
    confirmDeleteElem = (
      <div>
        Are you sure you want to delete{' '}
        <strong>
          <em>{connectionToDelete.name}</em>
        </strong>
        ?
      </div>
    );
  }

  return (
    <div>
      {connectorTypes.map((connectorType) => {
        const key = connectorType.name;
        const connections = categorizedConnections.get(key) || [];

        return (
          <Accordion
            square
            expanded={currentActiveAccordion === key}
            onChange={() => handleChange(key)}
            key={key}
          >
            <CustomAccordionSummary expandIcon={<ExpandMoreIcon />}>
              {key}({connections.length})
            </CustomAccordionSummary>
            <CustomAccordionDetails>
              {connections.map((connection) => {
                const actions: IAction[] = [
                  {
                    label: 'Edit',
                    actionFn: () => editConnection(connection),
                  },
                  {
                    label: 'Export',
                    actionFn: () => exportConnection(connection),
                  },
                  {
                    label: 'Duplicate',
                    actionFn: () => cloneConnection(connection),
                  },
                  {
                    label: 'separator',
                  },
                  {
                    label: 'Delete',
                    actionFn: () => setConnectionToDelete(connection),
                    className: classes.delete,
                  },
                ];

                return (
                  <Link
                    to={`/ns/${getCurrentNamespace()}/connections/${connection.name}?path=/`}
                    key={connection.name}
                    onClick={() => onConnectionSelection(connection.name)}
                    className={classnames(classes.connection, {
                      [classes.selectedConnection]: localSelectedConnection === connection.name,
                    })}
                  >
                    <If condition={localSelectedConnection === connection.name}>
                      <strong>{connection.name}</strong>
                    </If>
                    <If condition={localSelectedConnection !== connection.name}>
                      <span>{connection.name}</span>
                    </If>

                    <ActionsPopover
                      className={classes.actionPopover}
                      actions={actions}
                      modifiers={popperModifiers}
                    />
                  </Link>
                );
              })}

              <ConfirmationModal
                headerTitle="Delete connection"
                toggleModal={handleConfirmationClose}
                confirmationElem={confirmDeleteElem}
                confirmButtonText="Delete"
                confirmFn={handleDelete}
                cancelFn={handleConfirmationClose}
                isOpen={!!connectionToDelete}
                errorMessage={!deleteError ? '' : 'Failed to delete connection'}
                extendedMessage={deleteError}
              />

              <CreateConnectionModal
                isOpen={isCreateConnectionOpen}
                onToggle={toggleConnectionCreate}
                initialConfig={initConnConfig}
                onCreate={fetchConnections}
                isEdit={isEdit}
              />
            </CustomAccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}