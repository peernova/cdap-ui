/*
 * Copyright © 2019 Cask Data, Inc.
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

const programsTypeResolver = {
  ProgramRecord: {
    async __resolveType(parent, args, context, info) {
      return await (new Promise((resolve, reject) => {
        switch (parent.type) {
          case 'Mapreduce': resolve('MapReduce')
          case 'Workflow': resolve('Workflow')
          case 'Spark': resolve('Spark')
          default: resolve(null)
        }
      }));
    }
  }
};

const programRecordTypeResolvers = programsTypeResolver;

module.exports = {
  programRecordTypeResolvers
};