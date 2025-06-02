import { ClientSocket } from "@shared/classes/clientSocket/clientSocket";
import { ClientSocketPostInstanceVariableUpdateFunction, ClientSocketPostLogoutFunction, ClientSocketPostProcessingFunction } from "@shared/types/socket";

/**
 * Generates an array of ClientSocket instances for testing purposes.
 * 
 * Note: Should be used in testing files only, never in production code
 * 
 * Note 2: Should only be used once per testing file, as multiple calls can cause conflicts.
 * 
 * @param count The number of sockets to create.
 * @param address The WebSocket server address.
 * @param testingSuite The name of the testing suite. (Used in the auth token for identification, ensures no conflicts with other tests)
 * @returns An array of ClientSocket instances.
 */
export function GenerateSocketArray(
  count: number,
  address: string,
  testingSuite: string,
  postProcess?: ClientSocketPostProcessingFunction,
  postProcessInstanceVariableFunction?: ClientSocketPostInstanceVariableUpdateFunction,
  postLogoutProcess?: ClientSocketPostLogoutFunction,
): ClientSocket[] {
  const SocketArray: ClientSocket[] = [];
  for (let i = 0; i < count; i++) {
    const newSocket: ClientSocket = new ClientSocket(address, {
      auth: { token: `testing clientSocket.${testingSuite}.${i + 1}` },
    }, postProcess, postProcessInstanceVariableFunction, postLogoutProcess);
    SocketArray.push(newSocket);
  }
  return SocketArray;
}
