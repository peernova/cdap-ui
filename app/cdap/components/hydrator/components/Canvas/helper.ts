/*
 * Copyright © 2023 Cask Data, Inc.
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

import { GLOBALS } from 'services/global-constants';
import { PLUGIN_TYPES } from './constants';

export const getPluginColor = (pluginType: String) => {
  switch (pluginType) {
    case PLUGIN_TYPES.BATCH_SOURCE:
      return '#48c038';
    case PLUGIN_TYPES.TRANSFORM:
    case PLUGIN_TYPES.SPLITTER_TRANSFORM:
    case PLUGIN_TYPES.BATCH_AGGREGATOR:
    case PLUGIN_TYPES.SPARK_COMPUTE:
    case PLUGIN_TYPES.BATCH_JOINER:
      return '#4586f3';
    case PLUGIN_TYPES.BATCH_SINK:
      return '#8367df';
    case PLUGIN_TYPES.CONDITION:
    case PLUGIN_TYPES.ACTION:
      return '#988470';
    case PLUGIN_TYPES.ALERT_PUBLISHER:
      return '#ffba01';
    case PLUGIN_TYPES.ERROR_TRANSFORM:
      return '#d40001';
  }
};

export const connectionIsValid = (fromNode, toNode) => {
  /**
   * Rules:
   *    1. Source & Transform can only connect to Transform, Sink, or Condition
   *    2. Sink can only connect to Action, or Condition
   *    3. Action can only connect to Action, Source or Condition
   *    4. Condition can connect to anything
   **/
  const fromType = GLOBALS.pluginConvert[fromNode.type];
  const toType = GLOBALS.pluginConvert[toNode.type];

  switch (fromType) {
    case 'source':
    case 'transform':
      if (!(toType === 'transform' || toType === 'sink' || toType === 'condition')) {
        return false;
      }
      break;
    case 'sink':
      if (toType !== 'action' && toType !== 'condition') {
        return false;
      }
      break;
    case 'action':
      if (!(toType === 'action' || toType === 'source' || toType === 'condition')) {
        return false;
      }
      break;
  }
  return true;
};