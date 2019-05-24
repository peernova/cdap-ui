/*
 *
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

package io.cdap.cdap.starwars;

import com.google.common.base.Charsets;
import com.google.common.io.Resources;
import graphql.GraphQL;
import graphql.schema.GraphQLSchema;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;
import graphql.schema.idl.TypeRuntimeWiring;

import java.io.IOException;
import java.net.URL;


public class GraphQLProvider {

  private final GraphQL graphQL;

  GraphQLProvider() throws IOException {
    this.graphQL = buildGraphQL();
  }

  private GraphQL buildGraphQL() throws IOException {
    URL url = Resources.getResource("starWarsSchema.graphqls");
    String sdl = Resources.toString(url, Charsets.UTF_8);
    GraphQLSchema graphQLSchema = buildSchema(sdl);

    return GraphQL.newGraphQL(graphQLSchema).build();
  }

  private GraphQLSchema buildSchema(String sdl) {
    TypeDefinitionRegistry typeDefinitionRegistry = new SchemaParser().parse(sdl);
    RuntimeWiring runtimeWiring = buildWiring();
    SchemaGenerator schemaGenerator = new SchemaGenerator();

    return schemaGenerator.makeExecutableSchema(typeDefinitionRegistry, runtimeWiring);
  }

  private RuntimeWiring buildWiring() {
    return RuntimeWiring.newRuntimeWiring()
      .type(getQueryTypeRuntimeWiring())
      .type(getCharacterTypeRuntimeWiring())
      .type(getHumanTypeRuntimeWiring())
      .type(getDroidTypeRuntimeWiring())
      .build();
  }

  private TypeRuntimeWiring.Builder getQueryTypeRuntimeWiring() {
    return TypeRuntimeWiring.newTypeWiring("Query")
      .dataFetcher("hero", StarWarsDataFetcher.getHeroDataFetcher())
      .dataFetcher("human", StarWarsDataFetcher.getHumanDataFetcher())
      .dataFetcher("droid", StarWarsDataFetcher.getDroidDataFetcher())
      ;
  }

  private TypeRuntimeWiring.Builder getCharacterTypeRuntimeWiring() {
    return TypeRuntimeWiring.newTypeWiring("Character")
      .typeResolver(StarWarsTypeResolver.getCharacterTypeResolver());
  }

  private TypeRuntimeWiring.Builder getHumanTypeRuntimeWiring() {
    return TypeRuntimeWiring.newTypeWiring("Human");
  }

  private TypeRuntimeWiring.Builder getDroidTypeRuntimeWiring() {
    return TypeRuntimeWiring.newTypeWiring("Droid");
  }

  GraphQL getGraphQL() {
    return graphQL;
  }
}