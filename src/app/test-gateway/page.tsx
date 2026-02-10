'use client';

import { useEffect, useState } from 'react';
import { useOpenClawGateway } from '@/lib/gateway-client';

export default function GatewayTestPage() {
  const {
    connectionState,
    connectionError,
    isConnected,
    submitAuth,
    reconnect,
    listAgents,
    listSessions,
  } = useOpenClawGateway();

  const [password, setPassword] = useState('');
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ key: string; status: string }>>([]);

  useEffect(() => {
    if (isConnected) {
      // Test listing agents
      listAgents().then((result) => {
        if (result?.agents) {
          setAgents(result.agents);
        }
      }).catch(console.error);

      // Test listing sessions
      listSessions().then((result) => {
        if (result?.sessions) {
          setSessions(result.sessions);
        }
      }).catch(console.error);
    }
  }, [isConnected, listAgents, listSessions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAuth({ password });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gateway Connection Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p><strong>Status:</strong> {connectionState}</p>
        {connectionError && (
          <p className="text-red-600 mt-2"><strong>Error:</strong> {connectionError}</p>
        )}
      </div>

      {connectionState === 'needs-auth' && (
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block mb-2">
            Gateway Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter your gateway password"
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect
          </button>
        </form>
      )}

      {(connectionState === 'error' || connectionState === 'disconnected') && (
        <button
          onClick={reconnect}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-6"
        >
          Retry Connection
        </button>
      )}

      {isConnected && (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-semibold text-green-800">✓ Connected to OpenClaw Gateway</h2>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Agents ({agents.length}):</h3>
            {agents.length === 0 ? (
              <p className="text-gray-500">No agents found</p>
            ) : (
              <ul className="space-y-1">
                {agents.map((agent) => (
                  <li key={agent.id} className="p-2 bg-gray-50 rounded">
                    <code className="text-sm">{agent.id}</code>
                    {agent.name && <span className="ml-2 text-gray-600">({agent.name})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sessions ({sessions.length}):</h3>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No active sessions</p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => (
                  <li key={session.key} className="p-2 bg-gray-50 rounded text-sm">
                    <code>{session.key}</code>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {session.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
