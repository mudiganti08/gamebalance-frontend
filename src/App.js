import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [results, setResults] = useState([]);

  const baseURL = 'http://localhost:8080/api';

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(`${baseURL}/players`);
      // Convert withdrawals to total amount per player
      const playersWithWithdrawals = res.data.map(p => ({
        ...p,
        withdrawals: Array.isArray(p.withdrawals)
          ? p.withdrawals.reduce((sum, w) => sum + w.amount, 0)
          : 0,
      }));
      setPlayers(playersWithWithdrawals);
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const addPlayer = async () => {
    if (!newPlayer.trim()) return;
    try {
      await axios.post(`${baseURL}/players`, { name: newPlayer });
      setNewPlayer('');
      fetchPlayers();
    } catch (err) {
      console.error("Error adding player:", err);
      alert("Failed to add player. Check server logs.");
    }
  };

  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${baseURL}/players/${id}`);
      fetchPlayers();
    } catch (err) {
      console.error("Error deleting player:", err);
    }
  };

  const addWithdrawal = async (id) => {
    try {
      await axios.post(`${baseURL}/players/${id}/withdrawals`, {
        amount: 20,
        addedBy: "admin" // hardcoded
      });
      fetchPlayers();
    } catch (err) {
      console.error("Error adding withdrawal:", err);
    }
  };

  const updateReturn = async (id, amount) => {
    try {
      const player = players.find(p => p.id === id);
      await axios.put(`${baseURL}/players/${id}`, {
        name: player.name,
        finalAmount: parseFloat(amount) || 0
      });
      fetchPlayers();
    } catch (err) {
      console.error("Error updating return amount:", err);
    }
  };

  const calculateResults = async () => {
    const totalTaken = players.reduce((sum, p) => sum + p.withdrawals, 0);
    const totalReturned = players.reduce((sum, p) => sum + (p.finalAmount || 0), 0);

    if (Math.abs(totalTaken - totalReturned) > 0.01) {
      alert(
        `❗ Totals don't match:\n\nTotal Taken from Bank: $${totalTaken.toFixed(2)}\nTotal Returned: $${totalReturned.toFixed(2)}\n\nMake sure all players return the amount they took from the bank.`
      );
      return;
    }

    try {
      const res = await axios.get(`${baseURL}/results`);
      setResults(res.data.settlements);
    } catch (err) {
      console.error("Error calculating results:", err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🏦 Poker Game Tracker</h1>

      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Player name"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
        />
        <button onClick={addPlayer}>Add Player</button>
      </div>

      <table border="1" style={{ width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Taken from Bank ($)</th>
            <th>Add to Bank</th>
            <th>Returned ($)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.name}</td>
              <td>{player.withdrawals.toFixed(2)}</td>
              <td>
                <button onClick={() => addWithdrawal(player.id)}>+20</button>
              </td>
              <td>
                <input
                  type="number"
                  defaultValue={player.finalAmount}
                  onBlur={e => updateReturn(player.id, e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => deletePlayer(player.id)}>❌ Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={calculateResults}>🧮 Calculate Results</button>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>💰 Settlements</h2>
          <ul>
            {results.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
