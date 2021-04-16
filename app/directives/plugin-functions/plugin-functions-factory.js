/*
 * Copyright © 2016 Cask Data, Inc.
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

angular.module(PKG.name + '.commons')
  .service('PluginsFunctionsFactory', function() {
    this.registry = {
      'getSchema': {
        element: '<get-schema></get-schema>',
        attributes: {
          'node': 'node',
          'fn-config': 'fnConfig',
          'class': 'pull-right'
        }
      },
      'outputSchema': {
        element: '<output-schema></output-schema>',
        attributes: {
          'node': 'node',
          'fn-config': 'fnConfig',
          'node-config': 'nodeConfig',
          'class': 'pull-right'
        }
      },
      'getPropertyValue': {
        element: '<get-property-value></get-property-value>',
        attributes: {
          'node': 'node',
          'fn-config': 'fnConfig',
          'class': 'pull-right'
        },
      },
      'connection-browser': {
        element: '<connection-browser></connection-browser>',
        attributes: {
          'node': 'node',
          'on-browse-complete': 'onComplete',
          'fn-config': 'fnConfig',
        }
      }
    };

  });