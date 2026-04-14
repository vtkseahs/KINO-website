import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { getComplexity, simpleEstimator } from 'graphql-query-complexity';

export class GraphqlComplexityPlugin implements ApolloServerPlugin {
  constructor(private readonly maxHard=100) {}

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      didResolveOperation: async (requestContext) => {
        const { request, document, schema } = requestContext;
        if (request.operationName === 'IntrospectionQuery') {
          return;
        }

        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [simpleEstimator({ defaultComplexity: 1 })],
        });


        if (complexity>this.maxHard) {
          throw new GraphQLError(
            `Слишком сложный запрос. Максимально допустимая сложность: ${this.maxHard}`,
          );
        }
      },
    };
  }
}